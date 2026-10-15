import React, { useMemo, useState } from 'react';
import { Plus, Trash2, MessageCircle, Wallet } from 'lucide-react';
import type { Client, Invoice, Payment, PaymentMethod } from '../../types';
import { clientAccount, inrFull } from '../../selectors/money';

/**
 * Client "khata": every bill and every payment in date order with a running
 * balance, plus "Add payment" that does not need an invoice (the money pays
 * the oldest unpaid bill first; anything extra is kept as advance).
 */

const METHODS: PaymentMethod[] = ['UPI', 'Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Other'];

const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
};

export const ClientPaymentsTab: React.FC<{
  client: Client;
  invoices: Invoice[];
  payments: Payment[];
  onAddPayment: (clientId: string, data: { amount: number; date: string; method: PaymentMethod; notes?: string }) => void;
  onDeletePayment: (paymentId: string) => void;
  onOpenInvoice?: (invoice: Invoice) => void;
}> = ({ client, invoices, payments, onAddPayment, onDeletePayment, onOpenInvoice }) => {
  const acc = useMemo(() => clientAccount(client, invoices, payments), [client, invoices, payments]);
  const defaultMethod: PaymentMethod = (['UPI', 'Cash', 'Bank Transfer', 'Cheque'] as PaymentMethod[]).includes(client.paymentMode as PaymentMethod)
    ? (client.paymentMode as PaymentMethod)
    : 'UPI';
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState<PaymentMethod>(defaultMethod);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) return setError('Enter the amount received.');
    if (!date) return setError('Pick the date.');
    onAddPayment(client.id, { amount: n, date, method, notes: notes.trim() || undefined });
    setAmount('');
    setNotes('');
    setDate(todayISO());
    setError(null);
    setOpen(false);
  };

  const invoiceById = new Map(invoices.map((i) => [i.id, i]));
  const phone = (client.phone || '').replace(/\D/g, '');
  const wa = phone.length === 10 ? `91${phone}` : phone;
  const statement = [
    `Hi ${client.name}, your account with Techinfigo:`,
    ...acc.invoices.map((b) => `• ${b.invoice.invoiceNumber}: ${inrFull(b.total)} (${b.isPaid ? 'paid' : `${inrFull(b.due)} due`})`),
    `Total billed: ${inrFull(acc.billed)}`,
    `Received: ${inrFull(acc.received)}`,
    acc.due > 0.5 ? `Balance due: ${inrFull(acc.due)}` : acc.credit > 0.5 ? `Advance with us: ${inrFull(acc.credit)}` : 'All settled. Thank you!',
  ].join('\n');

  const input =
    'w-full h-10 px-3 rounded-lg border border-border-base dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-text-base dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-secondary-accent/50';

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border-base dark:border-slate-700 bg-white dark:bg-slate-800/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total billed</p>
          <p className="text-2xl font-bold text-text-heading dark:text-white mt-1">{inrFull(acc.billed)}</p>
          <p className="text-xs text-text-muted mt-1">{acc.invoices.length} invoice(s), drafts not counted</p>
        </div>
        <div className="rounded-xl border border-border-base dark:border-slate-700 bg-white dark:bg-slate-800/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Received</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{inrFull(acc.received)}</p>
          <p className="text-xs text-text-muted mt-1">Advances and payments</p>
        </div>
        <div
          className={`rounded-xl border p-4 ${
            acc.due > 0.5
              ? 'border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30'
              : 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{acc.due > 0.5 ? 'Balance due' : acc.credit > 0.5 ? 'Advance with you' : 'Balance'}</p>
          <p className={`text-2xl font-bold mt-1 ${acc.due > 0.5 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {acc.due > 0.5 ? inrFull(acc.due) : acc.credit > 0.5 ? inrFull(acc.credit) : 'Settled'}
          </p>
          <p className="text-xs text-text-muted mt-1">{acc.due > 0.5 ? 'Still to collect' : acc.credit > 0.5 ? 'Will be used on the next bill' : 'Nothing pending'}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary-accent text-secondary-accent-text text-sm font-semibold hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Add payment
        </button>
        {wa && (
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent(statement)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-base dark:border-slate-600 text-sm font-semibold text-text-base dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <MessageCircle className="w-4 h-4" /> Send statement on WhatsApp
          </a>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="rounded-xl border border-border-base dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
          <p className="text-sm font-semibold text-text-heading dark:text-white">Money received from {client.companyName || client.name}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1 text-xs font-semibold text-text-muted">
              Amount (₹) *
              <input className={input} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 8000" autoFocus />
            </label>
            <label className="space-y-1 text-xs font-semibold text-text-muted">
              Date *
              <input className={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="space-y-1 text-xs font-semibold text-text-muted">
              Method
              <select className={input} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                {METHODS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-1 text-xs font-semibold text-text-muted">
            Note (optional)
            <input className={input} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. 2nd part for website, UTR 4521…" />
          </label>
          <p className="text-xs text-text-muted">It pays the oldest unpaid bill first. Anything extra is kept as advance for the next bill.</p>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-secondary-accent text-secondary-accent-text text-sm font-semibold">
              Save payment
            </button>
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-border-base dark:border-slate-600 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Ledger */}
      {acc.ledger.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-base dark:border-slate-700 p-8 text-center text-sm text-text-muted">
          <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No bills or payments yet. Sent invoices and money received will show here.
        </div>
      ) : (
        <div className="rounded-xl border border-border-base dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase tracking-wider text-text-muted">
              <tr>
                <th className="text-left px-3 py-2.5 font-semibold">Date</th>
                <th className="text-left px-3 py-2.5 font-semibold">What</th>
                <th className="text-right px-3 py-2.5 font-semibold hidden sm:table-cell">Billed</th>
                <th className="text-right px-3 py-2.5 font-semibold hidden sm:table-cell">Received</th>
                <th className="text-right px-3 py-2.5 font-semibold">Balance</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base dark:divide-slate-700">
              {acc.ledger.map((r, i) => {
                const inv = r.invoiceId ? invoiceById.get(r.invoiceId) : undefined;
                return (
                  <tr key={i} className="bg-white dark:bg-slate-900/30">
                    <td className="px-3 py-2.5 whitespace-nowrap text-text-muted">{fmtDate(r.date)}</td>
                    <td className="px-3 py-2.5">
                      {inv && onOpenInvoice ? (
                        <button type="button" onClick={() => onOpenInvoice(inv)} className="font-semibold text-text-heading dark:text-white hover:underline text-left">
                          {r.label}
                        </button>
                      ) : (
                        <span className={`font-semibold ${r.kind === 'invoice' ? 'text-text-heading dark:text-white' : 'text-emerald-700 dark:text-emerald-400'}`}>{r.label}</span>
                      )}
                      {r.method && r.kind !== 'invoice' && <span className="ml-2 text-xs text-text-muted">{r.method}</span>}
                      {/* Phones: amounts under the label */}
                      <span className="sm:hidden block text-xs mt-0.5">
                        {r.billed > 0 ? <span className="text-text-base dark:text-slate-200">Billed {inrFull(r.billed)}</span> : <span className="text-emerald-600">Received {inrFull(r.received)}</span>}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right hidden sm:table-cell">{r.billed > 0 ? inrFull(r.billed) : ''}</td>
                    <td className="px-3 py-2.5 text-right hidden sm:table-cell text-emerald-600 dark:text-emerald-400">{r.received > 0 ? inrFull(r.received) : ''}</td>
                    <td className={`px-3 py-2.5 text-right font-semibold whitespace-nowrap ${r.balance > 0.5 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {r.balance < -0.5 ? `${inrFull(-r.balance)} adv` : inrFull(Math.max(0, r.balance))}
                    </td>
                    <td className="px-1 text-right">
                      {r.paymentId && (
                        <button
                          type="button"
                          title="Delete this payment"
                          aria-label="Delete this payment"
                          onClick={() => {
                            if (window.confirm('Delete this payment? The balance will go back up.')) onDeletePayment(r.paymentId!);
                          }}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
