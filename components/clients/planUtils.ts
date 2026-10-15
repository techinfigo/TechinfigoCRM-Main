import type { ClientPlanItem, PlanKind, PlanStatus } from '../../types';

/** Posts, reels, stories and ads go Idea → Making → Approved → Posted. Shoots, meetings: Planned → Done. */
export const isContent = (k: PlanKind) => k === 'Post' || k === 'Reel' || k === 'Story' || k === 'Ad';

export const statusFlow = (k: PlanKind): PlanStatus[] => (isContent(k) ? ['Idea', 'Making', 'Approved', 'Done'] : ['Idea', 'Done']);

export const statusLabel = (s: PlanStatus, k: PlanKind): string => {
  if (s === 'Done') return isContent(k) ? (k === 'Ad' ? 'Live' : 'Posted') : 'Done';
  if (s === 'Idea') return isContent(k) ? 'Idea' : 'Planned';
  return s;
};

export const nextStatus = (item: ClientPlanItem): PlanStatus | null => {
  const flow = statusFlow(item.kind);
  const i = flow.indexOf(item.status);
  return i >= 0 && i < flow.length - 1 ? flow[i + 1] : null;
};

export const statusStyle = (s: PlanStatus): string =>
  s === 'Done'
    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
    : s === 'Approved'
      ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300'
      : s === 'Making'
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';

export const kindEmoji: Record<PlanKind, string> = {
  Post: '🖼️',
  Reel: '🎬',
  Story: '⏱️',
  Ad: '📣',
  Shoot: '📸',
  Meeting: '🤝',
  Other: '📌',
};

/** Not done and its day has passed. */
export const isLate = (item: ClientPlanItem, todayKey: string) => item.status !== 'Done' && item.date < todayKey;

export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const planDate = (item: ClientPlanItem) => new Date(`${item.date}T${item.time || '00:00'}`);

export const time12 = (t?: string) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

/** Steady colour per client on the main calendar. */
const CLIENT_COLORS = [
  'bg-rose-200 text-rose-900 dark:bg-rose-800/50 dark:text-rose-100',
  'bg-orange-200 text-orange-900 dark:bg-orange-800/50 dark:text-orange-100',
  'bg-lime-200 text-lime-900 dark:bg-lime-800/50 dark:text-lime-100',
  'bg-stone-300 text-stone-900 dark:bg-stone-600/60 dark:text-stone-100',
  'bg-cyan-200 text-cyan-900 dark:bg-cyan-800/50 dark:text-cyan-100',
  'bg-violet-200 text-violet-900 dark:bg-violet-800/50 dark:text-violet-100',
  'bg-fuchsia-200 text-fuchsia-900 dark:bg-fuchsia-800/50 dark:text-fuchsia-100',
  'bg-indigo-200 text-indigo-950 dark:bg-indigo-700/50 dark:text-indigo-100',
  'bg-sky-300 text-sky-950 dark:bg-sky-700/50 dark:text-sky-100',
];
export const clientColor = (clientId: string) => {
  let h = 0;
  for (const ch of clientId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CLIENT_COLORS[h % CLIENT_COLORS.length];
};
