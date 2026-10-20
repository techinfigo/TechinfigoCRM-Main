import React, { useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, ClipboardPaste, Table2, Repeat, Plus, Trash2 } from 'lucide-react';
import type { Client, ClientPlanItem, PlanKind } from '../../types';
import { planKinds } from '../../types';
import { Modal } from '../common/Modal';
import { dayKey, isContent, kindEmoji } from './planUtils';

/**
 * Add many calendar items at once, three ways:
 *  1. Paste a list:  Date | Type | Title | Platforms | Time   (one per line;
 *     "|" or a tab from Excel / Google Sheets both work)
 *  2. Fill a table
 *  3. Repeat pattern: e.g. "Post every Mon, Wed, Fri this month"
 * Everything is previewed with ✅ / ⚠️ before it is saved.
 */

const PLATFORMS = ['Instagram', 'Facebook', 'YouTube', 'Google', 'LinkedIn', 'WhatsApp', 'Website'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const SAMPLE = `25 Oct | Reel | Diwali offer reel | Instagram, Facebook | 6 pm
27 Oct | Post | Student result post | Instagram
28 Oct | Shoot | Classroom photo shoot | | 11 am
30 Oct | Meeting | Monthly review call | | 4 pm`;

type Row = { date: string; kind: PlanKind | ''; title: string; platforms: string[]; time: string; problems: string[]; duplicate?: boolean; /** what is typed in the table's platforms box */ pText?: string };

/* ------------------------------------------------------------- parsing */

const pad = (n: number) => String(n).padStart(2, '0');

/** "25 Oct", "Oct 25", "25/10", "25-10-2026", "2026-10-25" → "2026-10-25". */
export function parseDay(raw: string, ref: Date): string | null {
  const s = raw.trim().toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g, '$1').replace(/,/g, ' ');
  if (!s) return null;
  let y: number | null = null;
  let m: number | null = null;
  let d: number | null = null;
  let r: RegExpMatchArray | null;
  if ((r = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) [y, m, d] = [+r[1], +r[2], +r[3]];
  else if ((r = s.match(/^(\d{1,2})\s*[/.\-]\s*(\d{1,2})(?:\s*[/.\-]\s*(\d{2,4}))?$/))) [d, m, y] = [+r[1], +r[2], r[3] ? +r[3] : null];
  else if ((r = s.match(/^(\d{1,2})\s*[- ]?\s*([a-z]{3,})\.?(?:\s*[- ]?\s*(\d{2,4}))?$/))) {
    d = +r[1];
    m = MONTHS.indexOf(r[2].slice(0, 3)) + 1 || null;
    y = r[3] ? +r[3] : null;
  } else if ((r = s.match(/^([a-z]{3,})\.?\s*(\d{1,2})(?:\s+(\d{2,4}))?$/))) {
    m = MONTHS.indexOf(r[1].slice(0, 3)) + 1 || null;
    d = +r[2];
    y = r[3] ? +r[3] : null;
  }
  if (!m || !d || m > 12 || d > 31) return null;
  if (y !== null && y < 100) y += 2000;
  if (y === null) {
    // No year written: the shown month's year, or next year if that date is long gone.
    y = ref.getFullYear();
    const guess = new Date(y, m - 1, d);
    if (guess.getTime() < ref.getTime() - 120 * 864e5) y += 1;
  }
  const dt = new Date(y, m - 1, d);
  if (dt.getMonth() !== m - 1) return null; // e.g. 31 Feb
  return dayKey(dt);
}

/** "6 pm", "6:30pm", "18:00", "11 am" → "18:00". */
export function parseTime(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/\./g, ':');
  const r = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!r) return null;
  let h = +r[1];
  const min = r[2] ? +r[2] : 0;
  if (!r[3] && !r[2]) return null; // a lone number is not a time
  if (r[3] === 'pm' && h < 12) h += 12;
  if (r[3] === 'am' && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return `${pad(h)}:${pad(min)}`;
}

export function parseKind(raw: string): PlanKind | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (/^(post|photo|image|carousel|creative)s?$/.test(s)) return 'Post';
  if (/^(reel|video|short)s?$/.test(s)) return 'Reel';
  if (/^stor(y|ies)$/.test(s)) return 'Story';
  if (/^(ad|ads|advert|campaign)$/.test(s)) return 'Ad';
  if (/^shoots?$/.test(s)) return 'Shoot';
  if (/^(meeting|meet|call)s?$/.test(s)) return 'Meeting';
  if (/^other$/.test(s)) return 'Other';
  return null;
}

const PLATFORM_ALIASES: Record<string, string> = {
  instagram: 'Instagram', insta: 'Instagram', ig: 'Instagram',
  facebook: 'Facebook', fb: 'Facebook',
  youtube: 'YouTube', yt: 'YouTube',
  google: 'Google', gmb: 'Google', gbp: 'Google', maps: 'Google',
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp', wa: 'WhatsApp',
  website: 'Website', web: 'Website', site: 'Website',
};

/** "Insta, FB" → ["Instagram", "Facebook"]; null if any word is not a platform. */
export function parsePlatforms(raw: string): string[] | null {
  const parts = raw.split(/[,/+&]| and /i).map((p) => p.trim().toLowerCase()).filter(Boolean);
  if (!parts.length) return [];
  const out = parts.map((p) => PLATFORM_ALIASES[p]);
  return out.every(Boolean) ? [...new Set(out)] : null;
}

export function parseLine(line: string, ref: Date): Row {
  const cells = (line.includes('|') ? line.split('|') : line.includes('\t') ? line.split('\t') : line.split(/\s{2,}|;/)).map((c) => c.trim());
  const [dRaw = '', kRaw = '', tRaw = '', ...rest] = cells;
  const problems: string[] = [];
  const date = parseDay(dRaw, ref);
  if (!date) problems.push(`Date "${dRaw}" not understood`);
  const kind = parseKind(kRaw);
  if (!kind) problems.push(`Type "${kRaw}" not understood (use Post, Reel, Story, Ad, Shoot, Meeting, Other)`);
  const title = tRaw;
  if (!title) problems.push('Title missing');
  let time = '';
  let platforms: string[] | null = null;
  for (const cell of rest) {
    if (!cell) continue;
    const t = parseTime(cell);
    if (t) {
      time = t;
      continue;
    }
    const p = parsePlatforms(cell);
    if (p) platforms = [...(platforms || []), ...p];
    else problems.push(`"${cell}" not understood (platform or time?)`);
  }
  return { date: date || '', kind: kind || '', title, platforms: platforms ?? [], time, problems };
}

/* ---------------------------------------------------------------- modal */

type Tab = 'paste' | 'table' | 'repeat';

export const BulkPlanModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  /** Fixed client (client page). Without it a client picker is shown (main calendar). */
  client?: Client;
  clients?: Client[];
  /** The month on screen; used for dates without a year and for repeat patterns. */
  month: Date;
  existing: ClientPlanItem[];
  onAdd: (items: ClientPlanItem[]) => void;
}> = ({ isOpen, onClose, client, clients = [], month, existing, onAdd }) => {
  const [tab, setTab] = useState<Tab>('paste');
  const [clientId, setClientId] = useState(client?.id || '');
  const [text, setText] = useState('');
  const [rows, setRows] = useState<Row[]>(() => Array.from({ length: 5 }, () => emptyRow()));
  // repeat pattern
  const [rKind, setRKind] = useState<PlanKind>('Post');
  const [rDays, setRDays] = useState<number[]>([1, 3, 5]);
  const [rTime, setRTime] = useState('');
  const [rPlatforms, setRPlatforms] = useState<string[]>(['Instagram']);
  const [rMonth, setRMonth] = useState(() => `${month.getFullYear()}-${pad(month.getMonth() + 1)}`);

  const ref = useMemo(() => new Date(month.getFullYear(), month.getMonth(), 1), [month]);
  const who = client || clients.find((c) => c.id === clientId);

  // Rows that would be saved, from whichever tab is open.
  const candidates: Row[] = useMemo(() => {
    const list =
      tab === 'paste'
        ? text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => parseLine(l, ref))
        : rows.filter((r) => r.title.trim() || r.date).map((r) => checkRow(r));
    return list.map((r) => ({
      ...r,
      duplicate: !!who && r.problems.length === 0 && existing.some((e) => e.clientId === who.id && e.date === r.date && e.kind === r.kind && e.title.trim().toLowerCase() === r.title.trim().toLowerCase()),
    }));
  }, [tab, text, rows, ref, existing, who]);

  const good = candidates.filter((r) => r.problems.length === 0 && !r.duplicate);
  const bad = candidates.filter((r) => r.problems.length > 0);

  const save = () => {
    if (!who || !good.length) return;
    const now = new Date().toISOString();
    onAdd(
      good.map((r, i) => ({
        id: `plan-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        clientId: who.id,
        date: r.date,
        time: r.time || undefined,
        kind: r.kind as PlanKind,
        title: r.title.trim(),
        platforms: isContent(r.kind as PlanKind) ? (r.platforms.length ? r.platforms : ['Instagram']) : [],
        status: 'Idea',
        createdAt: now,
        updatedAt: now,
      })),
    );
    onClose();
  };

  const makeRepeat = () => {
    const [y, m] = rMonth.split('-').map(Number);
    const days = new Date(y, m, 0).getDate();
    const out: Row[] = [];
    let n = 1;
    for (let d = 1; d <= days; d++) {
      const dt = new Date(y, m - 1, d);
      if (!rDays.includes(dt.getDay())) continue;
      if (dayKey(dt) < dayKey(new Date())) continue; // no dates that have already gone
      out.push({ date: dayKey(dt), kind: rKind, title: `${rKind} ${n++}`, platforms: isContent(rKind) ? rPlatforms : [], time: rTime, problems: [] });
    }
    setRows(out.length ? out : [emptyRow()]);
    setTab('table');
  };

  const setRow = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const input =
    'w-full h-10 px-3 rounded-lg border border-border-base dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-text-base dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-secondary-accent/50';
  const chip = (on: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold border ${
      on ? 'bg-slate-900 text-white border-slate-900 dark:bg-amber-400 dark:text-slate-900 dark:border-amber-400' : 'border-border-base dark:border-slate-600 text-text-muted'
    }`;
  const tabBtn = (t: Tab, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setTab(t)}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold ${
        tab === t ? 'bg-white dark:bg-slate-700 shadow text-text-heading dark:text-white' : 'text-text-muted'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      title={who ? `Bulk add · ${who.companyName || who.name}` : 'Bulk add to a client calendar'}
      footer={
        <div className="flex flex-wrap items-center gap-3 w-full">
          <p className="text-sm text-text-muted mr-auto">
            {good.length} ready{bad.length ? <span className="text-rose-600 font-semibold"> · {bad.length} need fixing</span> : null}
            {candidates.some((r) => r.duplicate) ? <span> · {candidates.filter((r) => r.duplicate).length} already in calendar (skipped)</span> : null}
          </p>
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border-base dark:border-slate-600 text-sm font-semibold">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!who || !good.length}
            className="px-4 py-2 rounded-lg bg-secondary-accent text-secondary-accent-text text-sm font-semibold disabled:opacity-40"
          >
            Add {good.length} item{good.length === 1 ? '' : 's'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {!client && (
          <label className="block">
            <span className="text-sm font-semibold text-text-heading dark:text-white">Client</span>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={`${input} mt-1`}>
              <option value="">Pick a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName ? `${c.companyName} (${c.name})` : c.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {tabBtn('paste', <ClipboardPaste className="w-4 h-4" />, 'Paste list')}
          {tabBtn('table', <Table2 className="w-4 h-4" />, 'Fill table')}
          {tabBtn('repeat', <Repeat className="w-4 h-4" />, 'Repeat')}
        </div>

        {tab === 'paste' && (
          <div className="space-y-2">
            <p className="text-sm text-text-muted">
              One item per line: <b className="text-text-base dark:text-slate-200">Date | Type | Title | Platforms | Time</b>. Platforms and time are optional. You can paste straight from Excel or Google Sheets.
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              placeholder={SAMPLE}
              className="w-full px-3 py-2 rounded-lg border border-border-base dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-mono text-text-base dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-secondary-accent/50"
            />
            <div className="flex flex-wrap gap-2 text-xs">
              <button type="button" onClick={() => setText(SAMPLE)} className="px-3 py-1.5 rounded-lg border border-border-base dark:border-slate-600 font-semibold">
                Fill an example
              </button>
              {text && (
                <button type="button" onClick={() => setText('')} className="px-3 py-1.5 rounded-lg border border-border-base dark:border-slate-600 font-semibold">
                  Clear
                </button>
              )}
              <span className="text-text-muted self-center">Dates: 25 Oct · 25/10 · 2026-10-25 · Time: 6 pm · 18:00 · Platforms: Insta, FB, YT, Google…</span>
            </div>
          </div>
        )}

        {tab === 'table' && (
          <div className="space-y-2">
            <div className="hidden sm:grid grid-cols-[9rem_7.5rem_1fr_9rem_6.5rem_2rem] gap-2 text-xs font-semibold text-text-muted px-1">
              <span>Date</span>
              <span>Type</span>
              <span>Title</span>
              <span>Platforms</span>
              <span>Time</span>
              <span />
            </div>
            {rows.map((r, i) => {
              const c = checkRow(r);
              const touched = !!(r.title.trim() || r.date);
              return (
                <div key={i} className={`grid grid-cols-2 sm:grid-cols-[9rem_7.5rem_1fr_9rem_6.5rem_2rem] gap-2 p-2 sm:p-1 rounded-lg ${touched && c.problems.length ? 'bg-rose-50 dark:bg-rose-900/20' : 'sm:bg-transparent bg-slate-50 dark:bg-slate-800/40'}`}>
                  <input type="date" value={r.date} onChange={(e) => setRow(i, { date: e.target.value })} className={input} aria-label="Date" />
                  <select value={r.kind} onChange={(e) => setRow(i, { kind: e.target.value as PlanKind })} className={input} aria-label="Type">
                    {planKinds.map((k) => (
                      <option key={k} value={k}>
                        {kindEmoji[k]} {k}
                      </option>
                    ))}
                  </select>
                  <input value={r.title} onChange={(e) => setRow(i, { title: e.target.value })} placeholder="e.g. Diwali offer reel" className={`${input} col-span-2 sm:col-span-1`} aria-label="Title" />
                  <input
                    value={r.pText ?? r.platforms.join(', ')}
                    onChange={(e) => setRow(i, { pText: e.target.value, platforms: parsePlatforms(e.target.value) ?? r.platforms })}
                    placeholder={isContent((r.kind || 'Post') as PlanKind) ? 'Insta, FB' : '—'}
                    disabled={!!r.kind && !isContent(r.kind as PlanKind)}
                    className={`${input} disabled:opacity-40`}
                    aria-label="Platforms"
                  />
                  <input type="time" value={r.time} onChange={(e) => setRow(i, { time: e.target.value })} className={input} aria-label="Time" />
                  <button type="button" onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((_, j) => j !== i) : [emptyRow()]))} aria-label="Remove row" className="h-10 grid place-items-center text-text-muted hover:text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            <button type="button" onClick={() => setRows((rs) => [...rs, ...Array.from({ length: 5 }, () => emptyRow(rs[rs.length - 1]))])} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-base dark:border-slate-600 text-sm font-semibold">
              <Plus className="w-4 h-4" /> 5 more rows
            </button>
          </div>
        )}

        {tab === 'repeat' && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-semibold">Type</span>
                <select value={rKind} onChange={(e) => setRKind(e.target.value as PlanKind)} className={`${input} mt-1`}>
                  {planKinds.map((k) => (
                    <option key={k} value={k}>
                      {kindEmoji[k]} {k}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Month</span>
                <input type="month" value={rMonth} onChange={(e) => setRMonth(e.target.value)} className={`${input} mt-1`} />
              </label>
            </div>
            <div>
              <span className="text-sm font-semibold">Every</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {WEEKDAYS.map((d, i) => (
                  <button key={d} type="button" onClick={() => setRDays((ds) => (ds.includes(i) ? ds.filter((x) => x !== i) : [...ds, i]))} className={chip(rDays.includes(i))}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            {isContent(rKind) && (
              <div>
                <span className="text-sm font-semibold">Platforms</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button key={p} type="button" onClick={() => setRPlatforms((ps) => (ps.includes(p) ? ps.filter((x) => x !== p) : [...ps, p]))} className={chip(rPlatforms.includes(p))}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label className="block max-w-[12rem]">
              <span className="text-sm font-semibold">
                Time <span className="font-normal text-text-muted">(optional)</span>
              </span>
              <input type="time" value={rTime} onChange={(e) => setRTime(e.target.value)} className={`${input} mt-1`} />
            </label>
            <button type="button" onClick={makeRepeat} disabled={!rDays.length} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900 text-sm font-semibold disabled:opacity-40">
              <Repeat className="w-4 h-4" /> Make the dates → then write titles
            </button>
          </div>
        )}

        {/* Preview */}
        {tab !== 'repeat' && candidates.length > 0 && (
          <div className="rounded-xl border border-border-base dark:border-slate-700 overflow-hidden">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-muted bg-slate-50 dark:bg-slate-800/60">Preview</p>
            <ul className="divide-y divide-border-base dark:divide-slate-700 max-h-64 overflow-y-auto">
              {candidates.map((r, i) => (
                <li key={i} className="px-3 py-2 flex items-start gap-2 text-sm">
                  {r.problems.length ? (
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                  ) : r.duplicate ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                  )}
                  <div className="min-w-0">
                    {r.problems.length ? (
                      <p className="text-rose-700 dark:text-rose-300">
                        Line {i + 1}: {r.problems.join(' · ')}
                      </p>
                    ) : (
                      <p className={r.duplicate ? 'text-text-muted line-through' : ''}>
                        <b>{new Date(`${r.date}T00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</b>
                        {r.time ? ` · ${r.time}` : ''} · {kindEmoji[r.kind as PlanKind]} {r.kind} · {r.title}
                        {isContent(r.kind as PlanKind) ? <span className="text-text-muted"> · {(r.platforms.length ? r.platforms : ['Instagram']).join(', ')}</span> : null}
                        {r.duplicate ? <span className="no-underline"> (already there)</span> : null}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!who && <p className="text-sm text-rose-600 font-semibold">Pick a client first.</p>}
      </div>
    </Modal>
  );
};

function emptyRow(prev?: Row): Row {
  return { date: '', kind: prev?.kind || 'Post', title: '', platforms: prev?.platforms || ['Instagram'], time: '', problems: [] };
}

function checkRow(r: Row): Row {
  const problems: string[] = [];
  if (!r.date) problems.push('Pick a date');
  if (!r.kind) problems.push('Pick a type');
  if (!r.title.trim()) problems.push('Write a title');
  return { ...r, problems };
}
