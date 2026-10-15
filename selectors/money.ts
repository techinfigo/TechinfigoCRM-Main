import { Client, Invoice, Payment } from '../types';
import { convertToINR } from '../utils';

/**
 * One place for every money number in the CRM: what a client was billed, what
 * they paid, what is still due, and what counts as revenue.
 *
 * Rules (the way an Indian agency khata works):
 *  - Only invoices that were actually sent count as billed: Draft and
 *    Cancelled invoices are ignored.
 *  - An invoice is paid by: the advance written on it, payments recorded
 *    against it, and payments recorded on the client without an invoice.
 *    Client-level money is applied to the oldest unpaid invoice first.
 *  - A client's onboarding advance counts once. When it has been copied onto
 *    an invoice (the invoice form does that), the invoice's copy is used;
 *    otherwise it waits on the client account as credit.
 *  - Money left over after every invoice is paid is the client's credit
 *    (advance for the next bill).
 *  - Revenue = money received, without GST.
 */

const EPS = 0.5; // half a rupee: rounding noise

export const isBillable = (inv: Invoice): boolean => inv.status !== 'Draft' && inv.status !== 'Cancelled';

/** Amount before GST (after discount). */
export function invoiceNet(inv: Invoice): number {
  const sub = (inv.items || []).reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  let discount = 0;
  if (inv.discountType === 'Percentage' && inv.discountValue) discount = sub * (inv.discountValue / 100);
  else if (inv.discountType === 'Fixed' && inv.discountValue) discount = inv.discountValue;
  return Math.max(0, sub - discount);
}

/** Amount the client has to pay (after discount, with GST). */
export function invoiceTotal(inv: Invoice): number {
  const net = invoiceNet(inv);
  return net + (inv.taxRate ? net * (inv.taxRate / 100) : 0);
}

/** A piece of money received, and which invoice (if any) it paid. */
export interface MoneyIn {
  date: string;
  amount: number; // in the invoice's / client's currency
  method: string;
  note?: string;
  paymentId?: string; // undefined for advances
  invoiceId?: string; // invoice it was applied to; undefined = still credit
  kind: 'payment' | 'advance';
}

export interface InvoiceBalance {
  invoice: Invoice;
  total: number;
  paid: number;
  due: number;
  isPaid: boolean;
}

export interface LedgerRow {
  date: string;
  kind: 'invoice' | 'payment' | 'advance';
  label: string;
  billed: number;
  received: number;
  balance: number; // running: positive = client owes, negative = client has credit
  invoiceId?: string;
  paymentId?: string;
  method?: string;
}

export interface ClientAccount {
  billed: number;
  received: number;
  due: number; // what the client owes now (never negative)
  credit: number; // extra money waiting for the next bill
  invoices: InvoiceBalance[]; // billable invoices, oldest first
  pieces: MoneyIn[]; // money received, split per invoice it paid
  ledger: LedgerRow[];
}

const time = (iso?: string) => {
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
};

/** Payments that belong to this client (directly, or through one of its invoices). */
function clientPayments(clientId: string, invoices: Invoice[], payments: Payment[]): Payment[] {
  const own = new Set(invoices.filter((i) => i.clientId === clientId).map((i) => i.id));
  return payments.filter((p) => (p.invoiceId && own.has(p.invoiceId)) || (!p.invoiceId && p.clientId === clientId));
}

export function clientAccount(client: Pick<Client, 'id' | 'advanceAmount' | 'advanceReceivedDate' | 'advancePaymentMode' | 'dateAdded'>, invoices: Invoice[], payments: Payment[]): ClientAccount {
  const all = invoices.filter((i) => i.clientId === client.id);
  const billable = all.filter(isBillable).sort((a, b) => time(a.issueDate) - time(b.issueDate));
  const balances = new Map<string, InvoiceBalance>();
  billable.forEach((inv) => {
    const total = invoiceTotal(inv);
    balances.set(inv.id, { invoice: inv, total, paid: 0, due: total, isPaid: false });
  });

  const pieces: MoneyIn[] = [];
  const apply = (inv: InvoiceBalance | undefined, piece: Omit<MoneyIn, 'invoiceId'>, amount: number) => {
    if (amount <= 0) return 0;
    if (inv) {
      const take = Math.min(amount, Math.max(0, inv.due));
      if (take > 0) {
        inv.paid += take;
        inv.due -= take;
        pieces.push({ ...piece, amount: take, invoiceId: inv.invoice.id });
      }
      return take;
    }
    return 0;
  };

  // 1. Advances written on invoices, and payments recorded against an invoice.
  const credits: Omit<MoneyIn, 'invoiceId'>[] = [];
  billable.forEach((inv) => {
    const adv = Number(inv.advanceAmount) || 0;
    if (adv > 0) {
      const b = balances.get(inv.id);
      const piece = { date: inv.issueDate, amount: adv, method: client.advancePaymentMode || 'Advance', kind: 'advance' as const, note: `Advance on ${inv.invoiceNumber}` };
      const used = apply(b, piece, adv);
      if (adv - used > EPS) credits.push({ ...piece, amount: adv - used });
    }
  });
  const mine = clientPayments(client.id, all, payments).sort((a, b) => time(a.paymentDate) - time(b.paymentDate));
  mine.forEach((p) => {
    const piece = { date: p.paymentDate, amount: Number(p.amount) || 0, method: p.paymentMethod, note: p.notes, paymentId: p.id, kind: 'payment' as const };
    const b = p.invoiceId ? balances.get(p.invoiceId) : undefined;
    const used = b ? apply(b, piece, piece.amount) : 0;
    if (piece.amount - used > EPS) credits.push({ ...piece, amount: piece.amount - used });
  });

  // 2. The onboarding advance, if it was never copied onto an invoice.
  const advOnInvoices = all.some((i) => (Number(i.advanceAmount) || 0) > 0);
  const clientAdv = Number(client.advanceAmount) || 0;
  if (clientAdv > 0 && !advOnInvoices) {
    credits.push({ date: client.advanceReceivedDate || client.dateAdded, amount: clientAdv, method: client.advancePaymentMode || 'Advance', kind: 'advance', note: 'Advance at onboarding' });
  }

  // 3. Everything else pays the oldest unpaid invoice first; the rest is credit.
  credits.sort((a, b) => time(a.date) - time(b.date));
  let credit = 0;
  credits.forEach((c) => {
    let left = c.amount;
    for (const inv of billable) {
      if (left <= EPS) break;
      left -= apply(balances.get(inv.id), c, left);
    }
    if (left > EPS) {
      pieces.push({ ...c, amount: left });
      credit += left;
    }
  });

  // 4. Invoices marked "Paid" by hand: whatever was not recorded counts as received then.
  billable.forEach((inv) => {
    const b = balances.get(inv.id)!;
    if (inv.status === 'Paid' && inv.paidBy !== 'payments' && b.due > EPS) {
      apply(b, { date: inv.paidDate || inv.dueDate || inv.issueDate, amount: b.due, method: 'Marked paid', kind: 'payment', note: `${inv.invoiceNumber} marked as paid` }, b.due);
    }
  });

  const invs = billable.map((inv) => {
    const b = balances.get(inv.id)!;
    b.due = Math.max(0, b.due);
    b.isPaid = b.total > 0 ? b.due <= EPS : true;
    return b;
  });
  const billed = invs.reduce((s, b) => s + b.total, 0);
  const received = pieces.reduce((s, p) => s + p.amount, 0);
  const due = invs.reduce((s, b) => s + b.due, 0);

  // Ledger: bills and money in date order, running balance.
  type Ev = { date: string; order: number; row: Omit<LedgerRow, 'balance'> };
  const events: Ev[] = [];
  billable.forEach((inv) =>
    events.push({ date: inv.issueDate, order: 0, row: { date: inv.issueDate, kind: 'invoice', label: `Invoice ${inv.invoiceNumber}`, billed: invoiceTotal(inv), received: 0, invoiceId: inv.id } }),
  );
  // Show each received amount once (not once per invoice it was split over).
  const seen = new Map<string, Ev>();
  pieces.forEach((p) => {
    const key = p.paymentId ? `p:${p.paymentId}` : `a:${p.note}:${p.date}`;
    const existing = seen.get(key);
    if (existing) {
      existing.row.received += p.amount;
      return;
    }
    const ev: Ev = {
      date: p.date,
      order: 1,
      row: { date: p.date, kind: p.kind, label: p.kind === 'advance' ? p.note || 'Advance' : p.note ? `Payment: ${p.note}` : 'Payment received', billed: 0, received: p.amount, paymentId: p.paymentId, method: p.method },
    };
    seen.set(key, ev);
    events.push(ev);
  });
  events.sort((a, b) => time(a.date) - time(b.date) || a.order - b.order);
  let run = 0;
  const ledger = events.map((e) => {
    run += e.row.billed - e.row.received;
    return { ...e.row, balance: run };
  });

  return { billed, received, due, credit, invoices: invs, pieces, ledger };
}

/** Balance of one invoice (uses the whole client account, so client-level payments count). */
export function invoiceBalance(inv: Invoice, client: Client | undefined, invoices: Invoice[], payments: Payment[]): InvoiceBalance {
  if (!client || !isBillable(inv)) {
    const total = invoiceTotal(inv);
    const paid = (Number(inv.advanceAmount) || 0) + payments.filter((p) => p.invoiceId === inv.id).reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const due = Math.max(0, total - paid);
    return { invoice: inv, total, paid: Math.min(total, paid), due, isPaid: due <= EPS };
  }
  return clientAccount(client, invoices, payments).invoices.find((b) => b.invoice.id === inv.id)!;
}

/** Invoices whose stored status should now be "Paid" because the money covers them. */
export function invoicesNowPaid(clients: Client[], invoices: Invoice[], payments: Payment[]): string[] {
  const ids: string[] = [];
  clients.forEach((c) => {
    clientAccount(c, invoices, payments).invoices.forEach((b) => {
      if (b.isPaid && b.total > 0 && (b.invoice.status === 'Sent' || b.invoice.status === 'Overdue')) ids.push(b.invoice.id);
    });
  });
  return ids;
}

export interface MoneySummary {
  revenue: number; // received in range, without GST, in INR
  gstCollected: number; // GST part of money received in range, INR
  received: number; // all money received in range, INR
  outstanding: number; // owed now across all clients, INR
  monthly: Record<string, number>; // revenue (without GST) per yyyy-mm in range, INR
}

/**
 * Agency-wide money. `inRange` decides which received amounts count (by the
 * date the money came in); outstanding is always "as of now".
 */
export function moneySummary(clients: Client[], invoices: Invoice[], payments: Payment[], inRange: (iso: string) => boolean = () => true): MoneySummary {
  const byId = new Map(invoices.map((i) => [i.id, i]));
  let revenue = 0;
  let gst = 0;
  let received = 0;
  let outstanding = 0;
  const monthly: Record<string, number> = {};
  clients.forEach((c) => {
    const acc = clientAccount(c, invoices, payments);
    acc.invoices.forEach((b) => (outstanding += convertToINR(b.due, b.invoice.currency)));
    acc.pieces.forEach((p) => {
      const inv = p.invoiceId ? byId.get(p.invoiceId) : undefined;
      const inr = convertToINR(p.amount, inv?.currency);
      const total = inv ? invoiceTotal(inv) : 0;
      const netShare = inv && total > 0 ? invoiceNet(inv) / total : 1;
      const net = inr * netShare;
      if (!inRange(p.date)) return;
      const key = (p.date || '').slice(0, 7);
      if (key) monthly[key] = (monthly[key] || 0) + net;
      received += inr;
      revenue += net;
      gst += inr - net;
    });
  });
  return { revenue, gstCollected: gst, received, outstanding, monthly };
}

/** ₹1.2Cr / ₹2.5L / ₹30K / ₹950: short Indian money format. */
export function inrShort(amount: number): string {
  const n = Math.round(amount || 0);
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  const fmt = (v: number) => (v >= 100 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, ''));
  if (a >= 1e7) return `${sign}₹${fmt(a / 1e7)}Cr`;
  if (a >= 1e5) return `${sign}₹${fmt(a / 1e5)}L`;
  if (a >= 1e3) return `${sign}₹${fmt(a / 1e3)}K`;
  return `${sign}₹${a}`;
}

/** ₹1,23,456: full Indian money format. */
export const inrFull = (amount: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(amount || 0));
