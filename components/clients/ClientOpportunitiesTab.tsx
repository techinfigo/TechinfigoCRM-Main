import React, { useState } from 'react';
import { Plus, Sparkles, Trophy, X as XIcon, CalendarClock, Trash2, Pencil } from 'lucide-react';
import type { AgreedService, Client, Opportunity, OpportunityStage, ServiceBillingType } from '../../types';
import { inrFull } from '../../selectors/money';

/**
 * Upsell tracking for an existing client: "interested in SEO, ₹7,999/month".
 * Stage Interested → Quote sent → Won / Lost, with a follow-up date (phone
 * reminders pick it up). Won adds the service to the client and starts its
 * invoice.
 */

const SERVICES = ['Website', 'Google Business Profile', 'SEO', 'Social media', 'Meta ads', 'Google ads', 'D2C growth', 'Other'];
const BILLING: ServiceBillingType[] = ['One-Time', 'Monthly', 'Quarterly', 'Annual'];
const OPEN: OpportunityStage[] = ['Interested', 'Quote sent'];

const toLocalInput = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fmt = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

type Draft = { id?: string; service: string; other: string; amount: string; billingType: ServiceBillingType; followUp: string; notes: string };
const blank = (): Draft => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(11, 0, 0, 0);
  return { service: 'SEO', other: '', amount: '', billingType: 'Monthly', followUp: toLocalInput(d.toISOString()), notes: '' };
};

export const ClientOpportunitiesTab: React.FC<{
  client: Client;
  opportunities: Opportunity[];
  onSave: (o: Opportunity) => void;
  onDelete: (id: string) => void;
  onUpdateClient?: (c: Client) => void;
  onStartInvoice: (client: Client, service: AgreedService) => void;
}> = ({ client, opportunities, onSave, onDelete, onUpdateClient, onStartInvoice }) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = opportunities.filter((o) => OPEN.includes(o.stage)).sort((a, b) => (a.followUpDate || '').localeCompare(b.followUpDate || ''));
  const closed = opportunities.filter((o) => !OPEN.includes(o.stage)).sort((a, b) => (b.closedAt || '').localeCompare(a.closedAt || ''));
  const pipeline = open.reduce((s, o) => s + (Number(o.amount) || 0), 0);

  const edit = (o: Opportunity) =>
    setDraft({
      id: o.id,
      service: SERVICES.includes(o.service) ? o.service : 'Other',
      other: SERVICES.includes(o.service) ? '' : o.service,
      amount: String(o.amount || ''),
      billingType: o.billingType,
      followUp: toLocalInput(o.followUpDate),
      notes: o.notes || '',
    });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const service = draft.service === 'Other' ? draft.other.trim() : draft.service;
    if (!service) return setError('Which service are they interested in?');
    const now = new Date().toISOString();
    const existing = draft.id ? opportunities.find((o) => o.id === draft.id) : undefined;
    onSave({
      id: draft.id || `opp-${Date.now()}`,
      clientId: client.id,
      service,
      amount: Number(draft.amount) || 0,
      billingType: draft.billingType,
      stage: existing?.stage || 'Interested',
      followUpDate: draft.followUp ? new Date(draft.followUp).toISOString() : undefined,
      notes: draft.notes.trim() || undefined,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      closedAt: existing?.closedAt,
    });
    setDraft(null);
    setError(null);
  };

  const setStage = (o: Opportunity, stage: OpportunityStage) => {
    const now = new Date().toISOString();
    const next: Opportunity = { ...o, stage, updatedAt: now, closedAt: stage === 'Won' || stage === 'Lost' ? now : undefined };
    onSave(next);
    if (stage === 'Won') {
      const service: AgreedService = { id: `svc-${Date.now()}`, name: o.service, cost: Number(o.amount) || 0, billingType: o.billingType, notes: o.notes };
      if (onUpdateClient) onUpdateClient({ ...client, agreedServices: [...(client.agreedServices || []), service] });
      if (window.confirm(`${o.service} added to ${client.companyName || client.name}'s services.\n\nCreate its invoice now?`)) onStartInvoice(client, service);
    }
  };

  const input =
    'w-full h-10 px-3 rounded-lg border border-border-base dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-text-base dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-secondary-accent/50';

  const stageStyle = (s: OpportunityStage) =>
    s === 'Won'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      : s === 'Lost'
        ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
        : s === 'Quote sent'
          ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';

  const Row = ({ o }: { o: Opportunity }) => {
    const overdue = o.followUpDate && OPEN.includes(o.stage) && new Date(o.followUpDate).getTime() < Date.now();
    return (
      <li className="rounded-xl border border-border-base dark:border-slate-700 bg-white dark:bg-slate-800/60 p-4 space-y-3">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-text-heading dark:text-white">{o.service}</p>
            <p className="text-sm text-text-muted">
              {o.amount ? inrFull(o.amount) : 'Price not set'} {o.amount ? `· ${o.billingType === 'One-Time' ? 'one-time' : o.billingType.toLowerCase()}` : ''}
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${stageStyle(o.stage)}`}>{o.stage}</span>
        </div>
        {o.followUpDate && OPEN.includes(o.stage) && (
          <p className={`text-xs font-semibold flex items-center gap-1.5 ${overdue ? 'text-rose-600' : 'text-text-muted'}`}>
            <CalendarClock className="w-3.5 h-3.5" /> Follow up {fmt(o.followUpDate)} {overdue ? '(overdue)' : ''}
          </p>
        )}
        {o.notes && <p className="text-sm text-text-base dark:text-slate-300">{o.notes}</p>}
        <div className="flex flex-wrap gap-2">
          {o.stage === 'Interested' && (
            <button type="button" onClick={() => setStage(o, 'Quote sent')} className="px-3 py-1.5 rounded-lg border border-sky-300 text-sky-700 dark:text-sky-300 text-xs font-semibold">
              Quote sent
            </button>
          )}
          {OPEN.includes(o.stage) && (
            <>
              <button type="button" onClick={() => setStage(o, 'Won')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">
                <Trophy className="w-3.5 h-3.5" /> Won
              </button>
              <button type="button" onClick={() => setStage(o, 'Lost')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-base dark:border-slate-600 text-xs font-semibold text-text-muted">
                <XIcon className="w-3.5 h-3.5" /> Lost
              </button>
            </>
          )}
          {!OPEN.includes(o.stage) && (
            <button type="button" onClick={() => setStage(o, 'Interested')} className="px-3 py-1.5 rounded-lg border border-border-base dark:border-slate-600 text-xs font-semibold text-text-muted">
              Reopen
            </button>
          )}
          <button type="button" onClick={() => edit(o)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-base dark:border-slate-600 text-xs font-semibold text-text-muted">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            type="button"
            onClick={() => window.confirm('Delete this opportunity?') && onDelete(o.id)}
            aria-label="Delete"
            className="ml-auto p-1.5 rounded text-slate-400 hover:text-rose-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <p className="text-sm text-text-muted">Extra services this client may buy</p>
          <p className="text-xl font-bold text-text-heading dark:text-white">
            {open.length} open · {inrFull(pipeline)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDraft(blank())}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary-accent text-secondary-accent-text text-sm font-semibold hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Add opportunity
        </button>
      </div>

      {draft && (
        <form onSubmit={save} className="rounded-xl border border-border-base dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
          <p className="text-sm font-semibold text-text-heading dark:text-white">{draft.id ? 'Edit opportunity' : `${client.companyName || client.name} is interested in…`}</p>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setDraft({ ...draft, service: s })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  draft.service === s ? 'bg-slate-900 text-white border-slate-900 dark:bg-amber-400 dark:text-slate-900 dark:border-amber-400' : 'border-border-base dark:border-slate-600 text-text-muted'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {draft.service === 'Other' && <input className={input} value={draft.other} onChange={(e) => setDraft({ ...draft, other: e.target.value })} placeholder="Service name" />}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1 text-xs font-semibold text-text-muted">
              Price (₹)
              <input className={input} inputMode="decimal" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="e.g. 7999" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-text-muted">
              Billing
              <select className={input} value={draft.billingType} onChange={(e) => setDraft({ ...draft, billingType: e.target.value as ServiceBillingType })}>
                {BILLING.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold text-text-muted">
              Follow up on
              <input className={input} type="datetime-local" value={draft.followUp} onChange={(e) => setDraft({ ...draft, followUp: e.target.value })} />
            </label>
          </div>
          <label className="block space-y-1 text-xs font-semibold text-text-muted">
            Note
            <input className={input} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="e.g. Asked for SEO after seeing Google results, wants price for 6 months" />
          </label>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-secondary-accent text-secondary-accent-text text-sm font-semibold">
              Save
            </button>
            <button type="button" onClick={() => setDraft(null)} className="px-4 py-2 rounded-lg border border-border-base dark:border-slate-600 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {opportunities.length === 0 && !draft ? (
        <div className="rounded-xl border border-dashed border-border-base dark:border-slate-700 p-8 text-center text-sm text-text-muted">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
          When this client shows interest in another service, add it here with a follow-up date. You will get a reminder on your phone.
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <ul className="space-y-3">
              {open.map((o) => (
                <Row key={o.id} o={o} />
              ))}
            </ul>
          )}
          {closed.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted pt-2">Closed</p>
              <ul className="space-y-3 opacity-80">
                {closed.map((o) => (
                  <Row key={o.id} o={o} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};
