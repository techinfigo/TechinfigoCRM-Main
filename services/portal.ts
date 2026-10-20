import { auth } from '../firebase';
import type { Client, ClientPlanItem, Invoice, Payment, Proposal } from '../types';
import { invoiceBalance, isBillable } from '../selectors/money';

/**
 * Client portal (www.techinfigo.com/portal), handled by the website. The CRM
 * gives access, sends each client only their own snapshot, and pulls back
 * what they approved or asked to change.
 */
const ENDPOINT = `${(process.env.WEBSITE_URL || 'https://www.techinfigo.com').replace(/\/$/, '')}/api/portal-admin`;
export const PORTAL_URL = `${(process.env.WEBSITE_URL || 'https://www.techinfigo.com').replace(/\/$/, '')}/portal`;

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in again.');
  const idToken = await user.getIdToken();
  const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken, ...body }) });
  const json = (await res.json().catch(() => ({}))) as T & { ok?: boolean; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error || `Something went wrong (${res.status}).`);
  return json;
}

export const setupPortal = (clientId: string, phone: string, password: string, enabled: boolean) =>
  call<{ portal: { enabled: boolean; phone: string; syncedAt: number } }>({ action: 'setup', clientId, phone, password: password || undefined, enabled });

export const syncPortal = (clientId: string, snapshot: unknown) => call<{ ok: true }>({ action: 'sync', clientId, snapshot });

export type PortalAction = { id: string; clientId: string; planId: string; action: 'approve' | 'change'; comment: string; at: number };
export const pullPortalActions = () => call<{ actions: PortalAction[] }>({ action: 'pull' }).then((r) => r.actions || []);
export const ackPortalActions = (ids: string[]) => call<{ ok: true }>({ action: 'ack', ids });

/** A readable starter password, e.g. "jain-4821". The client can change it. */
export function makePassword(client: Client): string {
  const word = (client.companyName || client.name || 'client').toLowerCase().replace(/[^a-z]/g, '').slice(0, 6) || 'client';
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  return `${word}-${1000 + (n[0] % 9000)}`;
}

/** Only what this client may see: no notes, costs, logins or other clients. */
export function buildSnapshot(
  client: Client,
  plans: ClientPlanItem[],
  invoices: Invoice[],
  payments: Payment[],
  proposals: Proposal[],
  contact: { upiId?: string; name?: string; phone?: string },
) {
  const from = new Date(Date.now() - 120 * 864e5).toISOString().slice(0, 10);
  const mine = invoices.filter((i) => i.clientId === client.id && isBillable(i));
  return {
    business: client.companyName || client.name,
    person: client.primaryContactName || client.name,
    plans: plans
      .filter((p) => p.clientId === client.id && p.date >= from)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p) => ({
        id: p.id,
        date: p.date,
        time: p.time,
        kind: p.kind,
        title: p.title,
        platforms: p.platforms || [],
        status: p.status,
        previewUrl: p.previewUrl,
        clientComment: p.clientComment,
        changeRequested: p.changeRequested || undefined,
      })),
    invoices: mine.map((inv) => {
      const b = invoiceBalance(inv, client, invoices, payments);
      return { id: inv.id, number: inv.invoiceNumber, issueDate: inv.issueDate, dueDate: inv.dueDate, total: b.total, paid: b.paid, due: b.isPaid ? 0 : b.due, status: b.isPaid ? 'Paid' : inv.status };
    }),
    services: (client.agreedServices || []).map((s) => ({ name: s.name, cost: s.cost, billingType: s.billingType })),
    docs: proposals
      .filter((p) => p.publicUrl && (p.clientId === client.id || (client.convertedFromLeadId && p.clientId === client.convertedFromLeadId)))
      .map((p) => ({ title: `Proposal ${p.design?.number || p.proposalNumber}`, url: p.publicUrl!, date: (p.generatedDate || '').slice(0, 10) })),
    upiId: contact.upiId || '',
    contactName: contact.name || '',
    contactPhone: contact.phone || '',
  };
}
