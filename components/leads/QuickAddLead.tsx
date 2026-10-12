import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import type { Lead } from '../../types';

/**
 * 15-second lead entry for the phone: name, number, business, what they want,
 * a note and when to follow up. Opens from the "+" in the bottom bar. The full
 * Add Lead form is still there for everything else.
 */

const BUSINESS_TYPES = ['Clinic / Doctor', 'Coaching', 'Real estate', 'Shop / Showroom', 'Restaurant / Sweets', 'Hotel / Travel', 'Online brand (D2C)', 'Other'];
const SOURCES = ['Walk-in', 'Phone call', 'WhatsApp', 'Referral', 'Instagram', 'Other'];
const SERVICES = ['Website', 'Google profile', 'Social media', 'Ads', 'SEO'];
const FOLLOW_UPS: { label: string; days: number | null }[] = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'Next week', days: 7 },
  { label: 'No', days: null },
];

function followUpDate(days: number | null): string | undefined {
  if (days === null) return undefined;
  const d = new Date();
  d.setDate(d.getDate() + days);
  // Today: in 2 hours. Later days: 11 AM.
  if (days === 0) d.setHours(d.getHours() + 2, 0, 0, 0);
  else d.setHours(11, 0, 0, 0);
  return d.toISOString();
}

const input =
  'w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-3 text-base text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400';
const chip = (on: boolean) =>
  `px-3 py-2 rounded-full text-sm font-semibold border transition-colors ${
    on ? 'bg-slate-900 text-white border-slate-900 dark:bg-amber-400 dark:text-slate-900 dark:border-amber-400' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
  }`;

export const QuickAddLead: React.FC<{ open: boolean; onClose: () => void; onSave: (lead: Lead) => void }> = ({ open, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [business, setBusiness] = useState('');
  const [type, setType] = useState('');
  const [source, setSource] = useState('Walk-in');
  const [services, setServices] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [follow, setFollow] = useState<number | null>(1);
  const [saved, setSaved] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Reset only when the sheet opens (not on every parent re-render).
  useEffect(() => {
    if (!open) return;
    setSaved(false);
    const t = setTimeout(() => nameRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const reset = () => {
    setName(''); setPhone(''); setBusiness(''); setType(''); setSource('Walk-in'); setServices([]); setNote(''); setFollow(1);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const now = new Date().toISOString();
    const lead: Lead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: '',
      phone: phone.trim() || undefined,
      companyName: business.trim() || undefined,
      leadType: type === 'Online brand (D2C)' ? 'D2C' : 'General',
      source,
      status: 'New Lead',
      dateAdded: now,
      notes: note.trim() || undefined,
      serviceInterest: services,
      tags: type ? [type] : [],
      nextFollowUpDateTime: followUpDate(follow),
    };
    onSave(lead);
    setSaved(true);
    reset();
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-slate-50 dark:bg-slate-900 p-5 space-y-4"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quick add lead</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {saved && (
          <p className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 text-sm font-semibold px-3 py-2">
            <Check className="w-4 h-4" /> Saved to Leads. Add another or close.
          </p>
        )}

        <input ref={nameRef} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Name *" className={input} autoComplete="off" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone / WhatsApp" type="tel" inputMode="tel" className={input} />
        <input value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Business name & area" className={input} />

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Type of business</p>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_TYPES.map((t) => (
              <button key={t} type="button" onClick={() => setType(type === t ? '' : t)} className={chip(type === t)}>{t}</button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Interested in</p>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map((s) => (
              <button key={s} type="button" onClick={() => setServices((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))} className={chip(services.includes(s))}>{s}</button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">How did they come?</p>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <button key={s} type="button" onClick={() => setSource(s)} className={chip(source === s)}>{s}</button>
            ))}
          </div>
        </div>

        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (what they said, budget, next step…)" rows={3} className={input} />

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Follow up</p>
          <div className="flex flex-wrap gap-2">
            {FOLLOW_UPS.map((f) => (
              <button key={f.label} type="button" onClick={() => setFollow(f.days)} className={chip(follow === f.days)}>{f.label}</button>
            ))}
          </div>
        </div>

        <button type="submit" className="w-full rounded-xl bg-amber-400 text-slate-900 font-bold py-3.5 text-base">Save lead</button>
      </form>
    </div>,
    document.body,
  );
};
