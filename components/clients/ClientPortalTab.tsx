import React, { useState } from 'react';
import { MonitorSmartphone, KeyRound, MessageCircle, Loader2, Power, ExternalLink, RefreshCw } from 'lucide-react';
import type { Client, ClientPlanItem } from '../../types';
import { PORTAL_URL, makePassword, setupPortal } from '../../services/portal';

/**
 * Give a client their own dashboard: phone number + a starter password.
 * Calendar, invoices and services are sent automatically after that.
 */
export const ClientPortalTab: React.FC<{
  client: Client;
  plans: ClientPlanItem[];
  onUpdateClient: (client: Client) => void;
  onSyncNow: () => void;
}> = ({ client, plans, onUpdateClient, onSyncNow }) => {
  const on = !!client.portal?.enabled;
  const [phone, setPhone] = useState(client.portal?.phone || (client.phone || '').replace(/\D/g, '').slice(-10));
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareText, setShareText] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);

  const waNumber = (() => {
    const d = (phone || '').replace(/\D/g, '');
    return d.length === 10 ? `91${d}` : d;
  })();

  const save = async (enabled: boolean, withPassword: boolean) => {
    setBusy(true);
    setError(null);
    const pass = withPassword ? password || makePassword(client) : '';
    try {
      const r = await setupPortal(client.id, phone, pass, enabled);
      onUpdateClient({ ...client, portal: { enabled: r.portal.enabled, phone: r.portal.phone, since: client.portal?.since || new Date().toISOString() } });
      if (enabled) onSyncNow();
      if (pass) {
        setPassword(pass);
        setShareText(
          `Namaste ${client.name} ji 🙏\n\nAapka Techinfigo dashboard ready hai. Yahan aap content calendar dekh sakte hain, posts approve kar sakte hain aur payments dekh sakte hain.\n\n👉 ${PORTAL_URL}\n📱 Mobile: ${r.portal.phone}\n🔑 Password: ${pass}\n\nPehli baar login ke baad password badal lijiye (menu → Change password).\n– Sachin, Techinfigo`,
        );
      } else setShareText(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    }
    setBusy(false);
  };

  const waiting = plans.filter((p) => p.changeRequested).length;
  const input = 'w-full h-10 px-3 rounded-lg border border-border-base dark:border-slate-600 bg-white dark:bg-slate-800 text-sm';

  return (
    <div className="space-y-5 max-w-2xl">
      <div className={`rounded-xl border p-4 flex items-start gap-3 ${on ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/40' : 'border-border-base dark:border-slate-700'}`}>
        <MonitorSmartphone className={`w-6 h-6 shrink-0 ${on ? 'text-emerald-600' : 'text-text-muted'}`} />
        <div className="flex-1">
          <p className="font-bold text-text-heading dark:text-white">{on ? 'Client portal is ON' : 'Client portal is off'}</p>
          <p className="text-sm text-text-muted">
            {on
              ? `${client.name} logs in at ${PORTAL_URL.replace('https://', '')} with ${client.portal?.phone}. They see their calendar (approve / ask changes), invoices with UPI pay, services and proposal. Never: notes, logins, other clients.`
              : 'Give the client their own login to see the content calendar, approve posts, and see invoices.'}
          </p>
          {on && waiting > 0 && <p className="mt-2 text-sm font-semibold text-amber-700 dark:text-amber-300">✏️ {waiting} change request{waiting > 1 ? 's' : ''} from the client waiting in the Calendar tab.</p>}
        </div>
        {on && (
          <a href={PORTAL_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold inline-flex items-center gap-1 text-text-muted hover:text-text-base">
            Open <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-semibold">Client’s mobile (login)</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" placeholder="10-digit mobile" className={`${input} mt-1`} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">
            {on ? 'New password' : 'Starter password'} <span className="font-normal text-text-muted">(leave empty to make one)</span>
          </span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="auto: e.g. jain-4821" className={`${input} mt-1`} autoComplete="off" />
        </label>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {!on ? (
          <button type="button" disabled={busy} onClick={() => save(true, true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary-accent text-secondary-accent-text text-sm font-semibold disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MonitorSmartphone className="w-4 h-4" />} Give portal access
          </button>
        ) : (
          <>
            <button type="button" disabled={busy} onClick={() => save(true, true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-base dark:border-slate-600 text-sm font-semibold disabled:opacity-50">
              <KeyRound className="w-4 h-4" /> Reset password
            </button>
            <button type="button" disabled={busy} onClick={() => save(true, false)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-base dark:border-slate-600 text-sm font-semibold disabled:opacity-50">
              Save number
            </button>
            <button
              type="button"
              onClick={() => {
                onSyncNow();
                setSynced(true);
                setTimeout(() => setSynced(false), 2500);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-base dark:border-slate-600 text-sm font-semibold"
            >
              <RefreshCw className="w-4 h-4" /> {synced ? 'Sent ✓' : 'Update portal now'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => window.confirm(`Switch off ${client.name}'s portal? They will be logged out.`) && save(false, false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-300 text-rose-600 text-sm font-semibold disabled:opacity-50"
            >
              <Power className="w-4 h-4" /> Switch off
            </button>
          </>
        )}
      </div>

      {shareText && (
        <div className="rounded-xl border border-amber-300/70 bg-amber-50/60 dark:bg-amber-400/5 p-4 space-y-3">
          <p className="text-sm font-semibold">Login ready. Send it to the client (the password is shown only now):</p>
          <pre className="whitespace-pre-wrap text-sm bg-white dark:bg-slate-800 rounded-lg p-3 border border-border-base dark:border-slate-700">{shareText}</pre>
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25d366] text-white text-sm font-semibold"
          >
            <MessageCircle className="w-4 h-4" /> Send on WhatsApp
          </a>
        </div>
      )}

      <div className="text-sm text-text-muted space-y-1">
        <p className="font-semibold text-text-base dark:text-slate-200">How approvals work</p>
        <p>1. In the Calendar tab, open a post/reel, paste the Canva or Drive link in “Design preview link”, and set it to Making.</p>
        <p>2. The client sees “Waiting for your approval” → taps Approve or Request change.</p>
        <p>3. You get a phone alert, and the item turns Approved (or shows their comment) here in the CRM by itself.</p>
      </div>
    </div>
  );
};
