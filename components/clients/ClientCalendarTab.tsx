import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Trash2, MessageCircle, ListPlus } from 'lucide-react';
import { BulkPlanModal } from './BulkPlanModal';
import type { Client, ClientPlanItem, PlanKind, PlanStatus } from '../../types';
import { planKinds } from '../../types';
import { Modal } from '../common/Modal';
import { dayKey, isContent, isLate, kindEmoji, nextStatus, statusFlow, statusLabel, statusStyle, time12 } from './planUtils';

/**
 * One client's planning calendar: posts, reels, stories, ads, shoots and
 * meetings, each moving Idea → Making → Approved → Posted (or Planned → Done).
 * Month grid on bigger screens, a day-by-day list on phones. Items also show
 * on the main Calendar.
 */

const PLATFORMS = ['Instagram', 'Facebook', 'YouTube', 'Google', 'LinkedIn', 'WhatsApp', 'Website'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Draft = {
  id?: string;
  date: string;
  time: string;
  kind: PlanKind;
  title: string;
  platforms: string[];
  status: PlanStatus;
  notes: string;
};

const blank = (date: string): Draft => ({ date, time: '', kind: 'Post', title: '', platforms: ['Instagram'], status: 'Idea', notes: '' });

const niceDay = (key: string) =>
  new Date(`${key}T00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

export const ClientCalendarTab: React.FC<{
  client: Client;
  items: ClientPlanItem[];
  onSave: (item: ClientPlanItem) => void;
  onDelete: (id: string) => void;
}> = ({ client, items, onSave, onDelete }) => {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const todayKey = dayKey(new Date());

  const monthPrefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
  const monthItems = useMemo(
    () =>
      items
        .filter((i) => i.date.startsWith(monthPrefix))
        .sort((a, b) => (a.date + (a.time || '99')).localeCompare(b.date + (b.time || '99'))),
    [items, monthPrefix],
  );
  const byDay = useMemo(() => {
    const m = new Map<string, ClientPlanItem[]>();
    monthItems.forEach((i) => m.set(i.date, [...(m.get(i.date) || []), i]));
    return m;
  }, [monthItems]);

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out: (string | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= days; d++) out.push(dayKey(new Date(month.getFullYear(), month.getMonth(), d)));
    while (out.length % 7) out.push(null);
    return out;
  }, [month]);

  const done = monthItems.filter((i) => i.status === 'Done').length;
  const late = monthItems.filter((i) => isLate(i, todayKey)).length;
  const monthName = month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const phone = (client.phone || '').replace(/\D/g, '');
  const wa = phone.length === 10 ? `91${phone}` : phone;
  const planText = [
    `Hi ${client.name}, here is your plan for ${monthName}:`,
    ...monthItems.map(
      (i) =>
        `• ${niceDay(i.date)}${i.time ? ` ${time12(i.time)}` : ''}: ${i.kind} – ${i.title}${i.platforms?.length && isContent(i.kind) ? ` (${i.platforms.join(', ')})` : ''}`,
    ),
    '',
    'Let us know if you want any change. – Team Techinfigo',
  ].join('\n');

  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));

  const openNew = (date?: string) => {
    setError(null);
    setDraft(blank(date || (todayKey.startsWith(monthPrefix) ? todayKey : `${monthPrefix}-01`)));
  };
  const openEdit = (i: ClientPlanItem) => {
    setError(null);
    setDraft({ id: i.id, date: i.date, time: i.time || '', kind: i.kind, title: i.title, platforms: i.platforms || [], status: i.status, notes: i.notes || '' });
  };

  const save = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!draft) return;
    if (!draft.title.trim()) return setError('Write what it is, e.g. "Diwali offer reel".');
    if (!draft.date) return setError('Pick a date.');
    const now = new Date().toISOString();
    const existing = draft.id ? items.find((i) => i.id === draft.id) : undefined;
    const flow = statusFlow(draft.kind);
    onSave({
      id: draft.id || `plan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      clientId: client.id,
      date: draft.date,
      time: draft.time || undefined,
      kind: draft.kind,
      title: draft.title.trim(),
      platforms: isContent(draft.kind) ? draft.platforms : [],
      status: flow.includes(draft.status) ? draft.status : 'Idea',
      notes: draft.notes.trim() || undefined,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    });
    setDraft(null);
  };

  const advance = (i: ClientPlanItem) => {
    const n = nextStatus(i);
    if (n) onSave({ ...i, status: n, updatedAt: new Date().toISOString() });
  };

  const input =
    'w-full h-10 px-3 rounded-lg border border-border-base dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-text-base dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-secondary-accent/50';
  const chip = (on: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold border ${
      on ? 'bg-slate-900 text-white border-slate-900 dark:bg-amber-400 dark:text-slate-900 dark:border-amber-400' : 'border-border-base dark:border-slate-600 text-text-muted'
    }`;

  return (
    <div className="space-y-4">
      {/* Month bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-1 sm:mr-auto">
          <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 sm:flex-none sm:min-w-[10rem] text-center">
            <p className="text-lg font-bold text-text-heading dark:text-white leading-tight">{monthName}</p>
            <p className="text-xs text-text-muted whitespace-nowrap">
              {monthItems.length} planned · {done} done{late ? <span className="text-rose-600 font-semibold"> · {late} late</span> : null}
            </p>
          </div>
          <button type="button" onClick={() => shift(1)} aria-label="Next month" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
            className="ml-1 px-2.5 py-1 rounded-lg border border-border-base dark:border-slate-600 text-xs font-semibold text-text-muted"
          >
            Today
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => openNew()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary-accent text-secondary-accent-text text-sm font-semibold hover:opacity-90 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add plan
          </button>
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border-base dark:border-slate-600 text-sm font-semibold text-text-base dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <ListPlus className="w-4 h-4" /> Bulk add
          </button>
          {wa && monthItems.length > 0 && (
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(planText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border-base dark:border-slate-600 text-sm font-semibold text-text-base dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" /> <span className="sm:hidden">Send plan</span><span className="hidden sm:inline">Send plan on WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      {/* Month grid (tablet / laptop) */}
      <div className="hidden sm:grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-text-muted bg-slate-100 dark:bg-slate-800/60">
            {d}
          </div>
        ))}
        {cells.map((key, idx) => {
          const list = key ? byDay.get(key) || [] : [];
          const isToday = key === todayKey;
          return (
            <div
              key={idx}
              onClick={() => key && openNew(key)}
              className={`min-h-[108px] p-1.5 flex flex-col gap-1 ${key ? 'bg-white dark:bg-slate-900 cursor-pointer hover:bg-amber-50/60 dark:hover:bg-slate-800/70' : 'bg-slate-50 dark:bg-slate-800/30'}`}
            >
              {key && (
                <span
                  className={`self-start text-xs font-bold w-6 h-6 grid place-items-center rounded-full ${
                    isToday ? 'bg-secondary-accent text-secondary-accent-text' : 'text-text-muted'
                  }`}
                >
                  {Number(key.slice(8))}
                </span>
              )}
              {list.slice(0, 3).map((i) => (
                <button
                  key={i.id}
                  type="button"
                  title={`${i.kind}: ${i.title} (${statusLabel(i.status, i.kind)})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(i);
                  }}
                  className={`w-full text-left px-1.5 py-0.5 rounded text-[11px] font-semibold truncate ${statusStyle(i.status)} ${
                    isLate(i, todayKey) ? 'ring-1 ring-rose-500' : ''
                  }`}
                >
                  {kindEmoji[i.kind]} {i.title}
                </button>
              ))}
              {list.length > 3 && <span className="text-[11px] text-text-muted text-center">+{list.length - 3} more</span>}
            </div>
          );
        })}
      </div>

      {/* Day-by-day list (phones) */}
      <div className="sm:hidden space-y-3">
        {monthItems.length === 0 && (
          <div className="rounded-xl border border-dashed border-border-base dark:border-slate-700 p-6 text-center text-sm text-text-muted">
            <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Nothing planned for {monthName}. Tap <b>Add plan</b> to add a post, reel, shoot or meeting.
          </div>
        )}
        {Array.from(byDay.entries()).map(([key, list]) => (
          <div key={key}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${key === todayKey ? 'text-secondary-accent' : 'text-text-muted'}`}>
              {niceDay(key)}
              {key === todayKey ? ' · Today' : ''}
            </p>
            <ul className="space-y-2">
              {list.map((i) => (
                <li
                  key={i.id}
                  className={`flex items-center gap-3 rounded-xl border bg-white dark:bg-slate-800/60 p-3 ${
                    isLate(i, todayKey) ? 'border-rose-300 dark:border-rose-700' : 'border-border-base dark:border-slate-700'
                  }`}
                >
                  <button type="button" onClick={() => openEdit(i)} className="min-w-0 flex-1 text-left">
                    <p className="font-semibold text-sm text-text-heading dark:text-white truncate">
                      {kindEmoji[i.kind]} {i.title}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {i.kind}
                      {i.time ? ` · ${time12(i.time)}` : ''}
                      {i.platforms?.length && isContent(i.kind) ? ` · ${i.platforms.join(', ')}` : ''}
                      {isLate(i, todayKey) ? ' · late' : ''}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => advance(i)}
                    disabled={!nextStatus(i)}
                    title={nextStatus(i) ? `Tap to mark ${statusLabel(nextStatus(i)!, i.kind)}` : undefined}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${statusStyle(i.status)}`}
                  >
                    {statusLabel(i.status, i.kind)}
                    {nextStatus(i) ? ' ›' : ''}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="hidden sm:block text-xs text-text-muted">Click a day to add a plan. Click a plan to change it or move it along.</p>

      {/* Add / edit */}
      {draft && (
        <Modal
          isOpen
          onClose={() => setDraft(null)}
          title={draft.id ? 'Edit plan' : `Plan for ${client.companyName || client.name}`}
          size="lg"
          footer={
            <div className="flex w-full items-center gap-2">
              {draft.id && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Delete this plan?')) {
                      onDelete(draft.id!);
                      setDraft(null);
                    }
                  }}
                  className="mr-auto inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
              <button type="button" onClick={() => setDraft(null)} className="ml-auto px-4 py-2 rounded-lg border border-border-base dark:border-slate-600 text-sm">
                Cancel
              </button>
              <button type="button" onClick={() => save()} className="px-4 py-2 rounded-lg bg-secondary-accent text-secondary-accent-text text-sm font-semibold">
                Save
              </button>
            </div>
          }
        >
          <form onSubmit={save} className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-text-muted mb-1.5">What is it?</p>
              <div className="flex flex-wrap gap-2">
                {planKinds.map((k) => (
                  <button key={k} type="button" onClick={() => setDraft({ ...draft, kind: k, status: statusFlow(k).includes(draft.status) ? draft.status : 'Idea' })} className={chip(draft.kind === k)}>
                    {kindEmoji[k]} {k}
                  </button>
                ))}
              </div>
            </div>
            <label className="block space-y-1 text-xs font-semibold text-text-muted">
              Title
              <input
                className={input}
                autoFocus
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder={isContent(draft.kind) ? 'e.g. Diwali offer reel' : draft.kind === 'Meeting' ? 'e.g. Monthly report call' : 'e.g. Shop photo shoot'}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs font-semibold text-text-muted">
                Date
                <input className={input} type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
              </label>
              <label className="space-y-1 text-xs font-semibold text-text-muted">
                Time (optional)
                <input className={input} type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
              </label>
            </div>
            {isContent(draft.kind) && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-1.5">Where</p>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setDraft({ ...draft, platforms: draft.platforms.includes(p) ? draft.platforms.filter((x) => x !== p) : [...draft.platforms, p] })
                      }
                      className={chip(draft.platforms.includes(p))}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-text-muted mb-1.5">Status</p>
              <div className="flex flex-wrap gap-2">
                {statusFlow(draft.kind).map((s) => (
                  <button key={s} type="button" onClick={() => setDraft({ ...draft, status: s })} className={chip(draft.status === s)}>
                    {statusLabel(s, draft.kind)}
                  </button>
                ))}
              </div>
            </div>
            <label className="block space-y-1 text-xs font-semibold text-text-muted">
              {isContent(draft.kind) ? 'Caption / idea notes' : 'Notes'}
              <textarea
                rows={3}
                className={`${input} h-auto py-2`}
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                placeholder={isContent(draft.kind) ? 'Hook, caption, hashtags, reference link…' : 'Place, who is coming, what to bring…'}
              />
            </label>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button type="submit" className="hidden" />
          </form>
        </Modal>
      )}
      {bulkOpen && (
        <BulkPlanModal
          isOpen
          onClose={() => setBulkOpen(false)}
          client={client}
          month={month}
          existing={items}
          onAdd={(list) => list.forEach(onSave)}
        />
      )}
    </div>
  );
};
