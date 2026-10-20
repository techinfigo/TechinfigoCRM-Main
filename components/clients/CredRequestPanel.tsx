import React, { useCallback, useEffect, useState } from 'react';
import { Send, Copy, Check, MessageCircle, Loader2, X, Link2 } from 'lucide-react';
import type { Client } from '../../types';
import { auth, isFirebaseConfigured } from '../../firebase';
import { Modal } from '../common/Modal';
import { CRED_ITEMS, createCredRequest, listCredRequests, removeCredRequest, type CredRequest } from '../../services/credRequests';

/**
 * "Send form to client": a private one-time link where the client fills
 * their own logins. What they submit lands in this client's Credentials
 * automatically (see useCredentialInbox in App).
 */

const DEFAULT_ITEMS = ['instagram', 'facebook', 'gbp', 'website'];

export const CredRequestPanel: React.FC<{ client: Client }> = ({ client }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<string[]>(DEFAULT_ITEMS);
  const [inviteEmail, setInviteEmail] = useState(() => auth.currentUser?.email || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState<CredRequest[]>([]);

  const refresh = useCallback(() => {
    if (!isFirebaseConfigured || !auth.currentUser) return;
    listCredRequests()
      .then((all) => setPending(all.filter((r) => r.clientId === client.id && r.status !== 'submitted')))
      .catch(() => 0);
  }, [client.id]);
  useEffect(refresh, [refresh]);

  const name = client.companyName || client.name;
  const phone = (client.phone || '').replace(/\D/g, '');
  const wa = phone.length === 10 ? `91${phone}` : phone;
  const waText = link
    ? `Hi ${client.name} ji 🙏\n\nKaam start karne ke liye ${name} ke kuch login details chahiye. Is private link pe 2 minute mein bhar dijiye:\n👉 ${link}\n\n🔒 Ye link sirf ek baar kaam karega aur sirf Techinfigo team details dekh sakti hai.\n– Sachin, Techinfigo`
    : '';

  const make = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await createCredRequest(client.id, name, items, inviteEmail.trim());
      setLink(r.url);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not make the link.');
    }
    setBusy(false);
  };

  const close = () => {
    setOpen(false);
    setLink(null);
    setCopied(false);
    setError(null);
  };

  const cancel = async (id: string) => {
    await removeCredRequest(id).catch(() => 0);
    refresh();
  };

  const chip = (on: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border ${
      on ? 'bg-slate-900 text-white border-slate-900 dark:bg-amber-400 dark:text-slate-900 dark:border-amber-400' : 'border-border-base dark:border-slate-600 text-text-muted'
    }`;

  return (
    <div className="rounded-xl border border-amber-300/70 dark:border-amber-400/30 bg-amber-50/60 dark:bg-amber-400/5 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <p className="font-bold text-text-heading dark:text-white">Let the client fill their logins</p>
          <p className="text-sm text-text-muted">Send a private one-time link. What they fill comes straight into the list below.</p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary-accent text-secondary-accent-text text-sm font-semibold hover:opacity-90 whitespace-nowrap">
          <Send className="w-4 h-4" /> Send form to client
        </button>
      </div>

      {pending.length > 0 && (
        <ul className="mt-3 space-y-2">
          {pending.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-border-base dark:border-slate-700 px-3 py-2">
              <Link2 className="w-4 h-4 text-text-muted shrink-0" />
              <span className="flex-1 min-w-0 truncate">
                {r.status === 'expired' ? (
                  <span className="text-rose-600 font-semibold">Expired, not filled</span>
                ) : (
                  <span className="font-semibold">Waiting for client</span>
                )}{' '}
                · {r.items.length} item{r.items.length > 1 ? 's' : ''} · sent {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
              <button type="button" onClick={() => cancel(r.id)} className="text-text-muted hover:text-rose-600 text-xs font-semibold inline-flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> {r.status === 'expired' ? 'Remove' : 'Cancel link'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <Modal isOpen onClose={close} title={`Logins form · ${name}`} size="2xl">
          {!link ? (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-text-heading dark:text-white">What do you need?</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CRED_ITEMS.map((i) => (
                    <button key={i.key} type="button" onClick={() => setItems((xs) => (xs.includes(i.key) ? xs.filter((x) => x !== i.key) : [...xs, i.key]))} className={chip(items.includes(i.key))}>
                      {i.emoji} {i.label}
                      {i.invite ? <span className="text-[10px] font-bold opacity-70">· invite</span> : null}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-text-muted">“invite” items let the client add you as a manager instead of sharing a password (safer).</p>
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-text-heading dark:text-white">Your email for access invites</span>
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  type="email"
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-border-base dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                />
                <span className="text-xs text-text-muted">Use a Google (Gmail) account, so Google Business and Ads invites work.</span>
              </label>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={close} className="px-4 py-2 rounded-lg border border-border-base dark:border-slate-600 text-sm font-semibold">
                  Cancel
                </button>
                <button type="button" onClick={make} disabled={busy || !items.length} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary-accent text-secondary-accent-text text-sm font-semibold disabled:opacity-40">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} Make private link
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-text-muted">Link ready. It works once and expires in 7 days. When the client submits, you get a phone alert and the logins appear in Credentials.</p>
              <div className="flex gap-2">
                <input readOnly value={link} className="flex-1 h-10 px-3 rounded-lg border border-border-base dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm" onFocus={(e) => e.target.select()} />
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(link).catch(() => 0);
                    setCopied(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 rounded-lg border border-border-base dark:border-slate-600 text-sm font-semibold"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <a
                href={wa ? `https://wa.me/${wa}?text=${encodeURIComponent(waText)}` : `https://wa.me/?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#25d366] text-white font-semibold"
              >
                <MessageCircle className="w-5 h-5" /> Send on WhatsApp{wa ? ` to ${client.name}` : ''}
              </a>
              <div className="flex justify-end">
                <button type="button" onClick={close} className="px-4 py-2 rounded-lg border border-border-base dark:border-slate-600 text-sm font-semibold">
                  Done
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
