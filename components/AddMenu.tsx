import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export type AddMenuItem = {
  label: string;
  hint?: string;
  Icon: React.ElementType;
  onClick: () => void;
};

/**
 * Phones: what the centre "+" in the bottom bar opens. One tap to add any
 * kind of record (lead, client, task, project, invoice, payment, expense).
 */
export const AddMenu: React.FC<{ open: boolean; onClose: () => void; items: AddMenuItem[] }> = ({ open, onClose, items }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="lg:hidden fixed inset-0 z-[999] flex items-end bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add new"
        className="w-full rounded-t-2xl bg-bg-base dark:bg-zinc-900 border-t border-border-base dark:border-zinc-800 px-4 pt-3"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-text-heading dark:text-white">Add new</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-slate-100 dark:hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <ul className="grid grid-cols-3 gap-2">
          {items.map(({ label, hint, Icon, onClick }) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => { onClose(); onClick(); }}
                className="w-full h-full min-h-[84px] rounded-xl border border-border-base dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 active:scale-95 transition flex flex-col items-center justify-center gap-1.5 px-1 py-2"
              >
                <span className="w-9 h-9 rounded-full bg-secondary-accent/15 text-secondary-accent flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-xs font-semibold text-text-base dark:text-slate-100 text-center leading-tight">{label}</span>
                {hint && <span className="text-[10px] text-text-muted dark:text-slate-400 leading-none">{hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
