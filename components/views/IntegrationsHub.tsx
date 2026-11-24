import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore';
import {
  Globe,
  Copy,
  Check,
  Plus,
  Pause,
  Play,
  Trash2,
  Send,
  RefreshCw,
  Eye,
  EyeOff,
  Webhook,
  ChevronDown,
  Info,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { auth, db, isFirebaseConfigured } from '../../firebase';
import { Button } from '../common/Button';

/**
 * Integrations & Webhooks: every way a lead can reach the CRM.
 *
 * Connections are stored in the CRM's `integrations` collection. The website
 * (www.techinfigo.com) looks a connection up by its secret token when a tool
 * sends a lead, puts the lead in Leads -> Enquiries, and counts it in
 * `integrationStats` so this page can show "last lead 5 min ago".
 */

const SITE = 'https://www.techinfigo.com';

type ConnectionKind = 'webhook' | 'google-ads';
type Connection = {
  id: string;
  kind: ConnectionKind;
  name: string;
  token: string;
  enabled: boolean;
  createdAt: Date | null;
  clientId?: string;
};
type Stats = { receivedCount: number; lastReceivedAt: Date | null; lastTestAt: Date | null };

const toDate = (v: unknown) => ((v as Timestamp | undefined)?.toDate ? (v as Timestamp).toDate() : null);

function newToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function ago(date: Date | null): string {
  if (!date) return '';
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* --------------------------------- data ---------------------------------- */

function useIntegrations() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const onError = (err: { code?: string }) => {
      console.error('Integrations:', err);
      setError(
        err.code === 'permission-denied'
          ? 'This account cannot manage integrations yet. The Firestore rules need the "integrations" section (see the guide).'
          : 'Could not load integrations. Check your internet and refresh.',
      );
      setLoaded(true);
    };
    const offA = onSnapshot(
      collection(db, 'integrations'),
      (snap) => {
        setError(null);
        setLoaded(true);
        const list = snap.docs.map((d) => {
          const x = d.data();
          return {
            id: d.id,
            kind: (x.kind === 'google-ads' ? 'google-ads' : 'webhook') as ConnectionKind,
            name: typeof x.name === 'string' ? x.name : 'Connection',
            token: typeof x.token === 'string' ? x.token : '',
            enabled: x.enabled !== false,
            createdAt: toDate(x.createdAt),
            clientId: typeof x.clientId === 'string' ? x.clientId : undefined,
          };
        });
        list.sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
        setConnections(list);
      },
      onError,
    );
    const offB = onSnapshot(
      collection(db, 'integrationStats'),
      (snap) => {
        const map: Record<string, Stats> = {};
        snap.docs.forEach((d) => {
          const x = d.data();
          map[d.id] = {
            receivedCount: typeof x.receivedCount === 'number' ? x.receivedCount : 0,
            lastReceivedAt: toDate(x.lastReceivedAt),
            lastTestAt: toDate(x.lastTestAt),
          };
        });
        setStats(map);
      },
      onError,
    );
    return () => {
      offA();
      offB();
    };
  }, []);

  return { connections, stats, error, loaded, setError };
}

/* --------------------------------- bits ---------------------------------- */

const CopyField: React.FC<{ label: string; value: string; secret?: boolean }> = ({ label, value, secret }) => {
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState(!secret);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setShown(true);
    }
  };
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        <code className="flex-1 min-w-0 truncate rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100">
          {shown ? value : '•'.repeat(24)}
        </code>
        {secret && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title={shown ? 'Hide' : 'Show'}
          >
            {shown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-400"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

const StatusPill: React.FC<{ tone: 'green' | 'grey' | 'amber'; children: React.ReactNode }> = ({ tone, children }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
      tone === 'green'
        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
        : tone === 'amber'
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    }`}
  >
    {children}
  </span>
);

const StatsLine: React.FC<{ s?: Stats }> = ({ s }) => (
  <p className="text-xs text-slate-500 dark:text-slate-400">
    {s?.lastReceivedAt ? (
      <>
        Last lead <b className="text-slate-700 dark:text-slate-200">{ago(s.lastReceivedAt)}</b> · {s.receivedCount} total
      </>
    ) : (
      'No leads received yet'
    )}
    {s?.lastTestAt && <> · test {ago(s.lastTestAt)}</>}
  </p>
);

const SourceCard: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; status: React.ReactNode; children?: React.ReactNode }> = ({
  icon,
  title,
  subtitle,
  status,
  children,
}) => (
  <div className="min-w-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-900 p-4 space-y-3">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-10 h-10 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="shrink-0">{status}</div>
    </div>
    {children}
  </div>
);

/* ------------------------------- tool guides ------------------------------ */

const PRESETS: { name: string; steps: string[] }[] = [
  {
    name: 'Zapier',
    steps: [
      'Make a Zap. Trigger: the app the lead comes from (for example Gmail, Typeform, JustDial email).',
      'Action: "Webhooks by Zapier" → POST.',
      'URL: paste the link above. Payload type: json.',
      'Data: add name, phone, email, message (and anything else).',
      'Test the action. The lead appears in Leads → Enquiries.',
    ],
  },
  {
    name: 'Make',
    steps: [
      'In your scenario add the module HTTP → "Make a request".',
      'URL: paste the link above. Method: POST. Body type: JSON or "Application/x-www-form-urlencoded".',
      'Add fields name, phone, email, message.',
      'Run once to test.',
    ],
  },
  {
    name: 'Pabbly',
    steps: [
      'In your workflow add the action "API (Pabbly)" → Execute API Request.',
      'Method: POST, URL: paste the link above, Payload type: JSON.',
      'Map name, phone, email, message. Save & send test request.',
    ],
  },
  {
    name: 'IndiaMART',
    steps: [
      'Seller panel → Lead Manager → Settings → CRM Integration (Push API).',
      'Paste the link above as the URL and save. If you do not see the option, ask IndiaMART support to enable "Push API" for your account.',
      'New buy-leads then arrive in Enquiries automatically, labelled IndiaMART.',
    ],
  },
  {
    name: 'WordPress / Elementor',
    steps: [
      'Edit the form → Actions After Submit → add "Webhook".',
      'Open the Webhook section, paste the link above. Turn on "Advanced Data".',
      'Name your fields name, phone, email, message (or similar). Submit a test entry.',
      'Contact Form 7 / WPForms: use a webhook add-on and paste the same link.',
    ],
  },
  {
    name: 'Shopify / Other',
    steps: [
      'Any tool that can "send a webhook" or "POST to a URL" works.',
      'Paste the link above. Send at least a name and a phone or email.',
      'Field names like name, full_name, mobile, phone_number, email, company, city, message are recognised automatically.',
    ],
  },
];

/* ------------------------------ custom connection ------------------------- */

const ConnectionRow: React.FC<{ c: Connection; s?: Stats; onError: (msg: string) => void; clients?: { id: string; name: string; companyName?: string }[] }> = ({ c, s, onError, clients = [] }) => {
  const url = `${SITE}/api/hooks/in/${c.token}`;
  const [busy, setBusy] = useState(false);
  const assignClient = async (clientId: string) => {
    try {
      await updateDoc(doc(db, 'integrations', c.id), { clientId: clientId || null, updatedAt: serverTimestamp() });
    } catch (err) {
      console.error(err);
      onError('Could not update the client for this connection.');
    }
  };
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [test, setTest] = useState<'idle' | 'sending' | 'ok' | 'fail'>('idle');
  const [showGuide, setShowGuide] = useState(false);
  const preset = PRESETS.find((p) => c.name.toLowerCase().includes(p.name.split(' ')[0].toLowerCase())) ?? PRESETS[PRESETS.length - 1];

  const toggle = async () => {
    setBusy(true);
    try {
      await updateDoc(doc(db, 'integrations', c.id), { enabled: !c.enabled, updatedAt: serverTimestamp() });
    } catch {
      onError('Could not change this connection. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'integrations', c.id));
    } catch {
      onError('Could not delete this connection. Try again.');
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setTest('sending');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test lead',
          phone: '9876501234',
          email: 'test@example.com',
          message: `Test from the CRM for "${c.name}"`,
          is_test: true,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { stored?: boolean };
      setTest(res.ok && data.stored ? 'ok' : 'fail');
    } catch {
      setTest('fail');
    }
  };

  return (
    <SourceCard
      icon={<Webhook className="w-5 h-5" />}
      title={c.name}
      subtitle="Your connection · leads labelled with this name"
      status={c.enabled ? <StatusPill tone="green">● Active</StatusPill> : <StatusPill tone="grey">Paused</StatusPill>}
    >
      <CopyField label="Webhook link (paste this in the tool)" value={url} />
      <StatsLine s={s} />

      {clients.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Leads go to:</span>
          <select
            value={c.clientId || ''}
            onChange={(e) => assignClient(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-900 dark:text-white"
          >
            <option value="">Agency only</option>
            {clients.map((cl) => (
              <option key={cl.id} value={cl.id}>{cl.companyName || cl.name}</option>
            ))}
          </select>
          {c.clientId && <span className="text-xs text-emerald-600 dark:text-emerald-400">→ shows in their portal</span>}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={!c.enabled || test === 'sending'} onClick={sendTest} leftIcon={<Send className="w-3.5 h-3.5 mr-1" />}>
          {test === 'sending' ? 'Sending…' : 'Send test lead'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={toggle}
          leftIcon={c.enabled ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
        >
          {c.enabled ? 'Pause' : 'Resume'}
        </Button>
        {confirmDelete ? (
          <span className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            Delete? The link stops working.
            <Button size="sm" variant="danger" disabled={busy} onClick={remove}>
              Yes, delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
              No
            </Button>
          </span>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} leftIcon={<Trash2 className="w-3.5 h-3.5 mr-1" />}>
            Delete
          </Button>
        )}
        <button
          type="button"
          onClick={() => setShowGuide((v) => !v)}
          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline"
        >
          How to connect {preset.name} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showGuide ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {test === 'ok' && <p className="text-xs text-green-700 dark:text-green-400">✓ Test lead arrived. Check Leads → Enquiries (it is marked [TEST]).</p>}
      {test === 'fail' && <p className="text-xs text-red-600 dark:text-red-400">Test did not arrive. Check your internet, or that the connection is active.</p>}

      {showGuide && (
        <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-300">
          {preset.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
    </SourceCard>
  );
};

/* ------------------------------ apps & APIs ------------------------------- */

type AppState = { apiKey?: string; connected?: boolean; requested?: boolean; model?: string };
const APP_DEFS: { id: string; name: string; desc: string; kind: 'key' | 'oauth'; keyLabel?: string; keyHint?: string; badge: string; help?: string; defaultModel?: string }[] = [
  { id: 'claude', name: 'Claude (Anthropic)', desc: 'AI lead scoring, auto-draft WhatsApp/email replies, content ideas.', kind: 'key', keyLabel: 'Anthropic API key', keyHint: 'sk-ant-…', badge: 'AI', defaultModel: 'claude-3-5-haiku-latest' },
  { id: 'openai', name: 'OpenAI', desc: 'Alternative AI engine for the same features.', kind: 'key', keyLabel: 'OpenAI API key', keyHint: 'sk-…', badge: 'AI', defaultModel: 'gpt-4o-mini' },
  { id: 'meta', name: 'Meta — Facebook & Instagram', desc: 'Lead Ads auto-capture, page posting, ad metrics.', kind: 'oauth', badge: 'f', help: 'Needs a free Meta app + one permission review.' },
  { id: 'whatsapp', name: 'WhatsApp Business API', desc: 'Auto-reply + two-way inbox.', kind: 'oauth', badge: 'W', help: 'Paid Meta API (~₹1.5–2.5k/mo) + setup.' },
  { id: 'google', name: 'Google Business / Sheets', desc: 'Reply to reviews, GMB posts, export to Sheets.', kind: 'oauth', badge: 'G', help: 'Google sign-in (OAuth).' },
  { id: 'razorpay', name: 'Razorpay / UPI', desc: 'Online payments + automatic receipts.', kind: 'key', keyLabel: 'Razorpay Key ID', keyHint: 'rzp_live_…', badge: '₹' },
];

const ModelField: React.FC<{ id: string; current?: string; fallback: string }> = ({ id, current, fallback }) => {
  const [v, setV] = useState(current || fallback);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setV(current || fallback); }, [current, fallback]);
  const save = async () => {
    try { await setDoc(doc(db, 'appIntegrations', id), { model: v.trim() || fallback }, { merge: true }); setSaved(true); setTimeout(() => setSaved(false), 1500); } catch { /* ignore */ }
  };
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Model</p>
      <div className="flex items-center gap-1.5">
        <input value={v} onChange={(e) => setV(e.target.value)} className="flex-1 min-w-0 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white" />
        <Button size="sm" variant="ghost" onClick={save}>{saved ? 'Saved' : 'Save'}</Button>
      </div>
    </div>
  );
};

const AppIntegrations: React.FC = () => {
  const [apps, setApps] = useState<Record<string, AppState>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const off = onSnapshot(
      collection(db, 'appIntegrations'),
      (snap) => {
        const m: Record<string, AppState> = {};
        snap.docs.forEach((d) => {
          const x = d.data();
          m[d.id] = { apiKey: typeof x.apiKey === 'string' ? x.apiKey : undefined, connected: !!x.connected, requested: !!x.requested, model: typeof x.model === 'string' ? x.model : undefined };
        });
        setApps(m);
      },
      () => setNote('Could not load apps. If this persists, the Firestore rules need an "appIntegrations" section.'),
    );
    return () => off();
  }, []);

  const saveKey = async (id: string) => {
    if (!draft.trim()) return;
    try {
      await setDoc(doc(db, 'appIntegrations', id), { apiKey: draft.trim(), connected: true, connectedAt: serverTimestamp(), by: auth.currentUser?.email ?? null }, { merge: true });
      setEditing(null);
      setDraft('');
    } catch {
      setNote('Could not save. The Firestore rules may need an "appIntegrations" section.');
    }
  };
  const disconnect = async (id: string) => {
    try { await deleteDoc(doc(db, 'appIntegrations', id)); } catch { setNote('Could not disconnect. Try again.'); }
  };
  const requestSetup = async (id: string) => {
    try { await setDoc(doc(db, 'appIntegrations', id), { requested: true, requestedAt: serverTimestamp() }, { merge: true }); } catch { setNote('Could not save. Try again.'); }
  };

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Apps &amp; APIs</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Connect AI and other services. You paste your own API key — it is stored in your CRM only. Live wiring is added per app.</p>
      </div>
      {note && <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-800 dark:text-amber-300">{note}</div>}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {APP_DEFS.map((a) => {
          const st = apps[a.id] || {};
          const connected = a.kind === 'key' ? !!(st.connected && st.apiKey) : !!st.connected;
          const status = connected ? (
            <StatusPill tone="green">● Connected</StatusPill>
          ) : st.requested ? (
            <StatusPill tone="amber">Setup requested</StatusPill>
          ) : (
            <StatusPill tone="grey">Not connected</StatusPill>
          );
          return (
            <SourceCard key={a.id} icon={<span className="text-sm font-bold">{a.badge}</span>} title={a.name} subtitle={a.desc} status={status}>
              {a.kind === 'key' ? (
                connected ? (
                  <div className="space-y-2">
                    <CopyField label={a.keyLabel || 'API key'} value={st.apiKey || ''} secret />
                    {a.defaultModel && <ModelField id={a.id} current={st.model} fallback={a.defaultModel} />}
                    <Button size="sm" variant="ghost" onClick={() => disconnect(a.id)} leftIcon={<Trash2 className="w-3.5 h-3.5 mr-1" />}>Disconnect</Button>
                  </div>
                ) : editing === a.id ? (
                  <div className="space-y-2">
                    <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={a.keyHint} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white" />
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary" disabled={!draft.trim()} onClick={() => saveKey(a.id)}>Save key</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setDraft(''); }}>Cancel</Button>
                    </div>
                    <p className="text-[11px] text-slate-400">Paste your own key. Stored in your CRM only.</p>
                  </div>
                ) : (
                  <Button size="sm" variant="primary" onClick={() => { setEditing(a.id); setDraft(''); }} leftIcon={<KeyRound className="w-3.5 h-3.5 mr-1" />}>Add API key</Button>
                )
              ) : (
                <div className="space-y-2">
                  {a.help && <p className="text-xs text-slate-500 dark:text-slate-400">{a.help}</p>}
                  {st.requested ? (
                    <Button size="sm" variant="ghost" onClick={() => disconnect(a.id)}>Cancel request</Button>
                  ) : (
                    <Button size="sm" variant="primary" onClick={() => requestSetup(a.id)} leftIcon={<ExternalLink className="w-3.5 h-3.5 mr-1" />}>Connect</Button>
                  )}
                </div>
              )}
            </SourceCard>
          );
        })}
      </div>
    </section>
  );
};

/* --------------------------------- page ---------------------------------- */

export const IntegrationsHub: React.FC<{ clients?: { id: string; name: string; companyName?: string }[] }> = ({ clients = [] }) => {
  const { connections, stats, error, loaded, setError } = useIntegrations();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmNewKey, setConfirmNewKey] = useState(false);

  const googleAds = useMemo(() => connections.find((c) => c.kind === 'google-ads') ?? null, [connections]);
  const webhooks = connections.filter((c) => c.kind === 'webhook');

  const create = async (kind: ConnectionKind, connectionName: string, clientId?: string) => {
    setBusy(true);
    try {
      await addDoc(collection(db, 'integrations'), {
        kind,
        name: connectionName,
        token: newToken(),
        enabled: true,
        ...(clientId ? { clientId } : {}),
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.email ?? null,
      });
      setAdding(false);
      setName('');
      setNewClientId('');
    } catch (err) {
      console.error(err);
      setError('Could not create the connection. The Firestore rules may need the "integrations" section.');
    } finally {
      setBusy(false);
    }
  };

  const renewGoogleKey = async () => {
    if (!googleAds) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, 'integrations', googleAds.id), { token: newToken(), updatedAt: serverTimestamp() });
      setConfirmNewKey(false);
    } catch {
      setError('Could not make a new key. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!isFirebaseConfigured) {
    return <p className="p-6 text-sm text-slate-500">Integrations need the cloud connection.</p>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Integrations & Webhooks</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Connect any lead source. Every lead lands in <b>Leads → Enquiries</b>, labelled with where it came from.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Built-in sources */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Built-in</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SourceCard
            icon={<Globe className="w-5 h-5" />}
            title="Website"
            subtitle="techinfigo.com forms, spam-filtered"
            status={<StatusPill tone="green">● Connected</StatusPill>}
          >
            <StatsLine s={stats.website} />
            <p className="text-xs text-slate-500 dark:text-slate-400">Nothing to set up. Every form on the website is connected.</p>
          </SourceCard>

          <SourceCard
            icon={<span className="text-base font-bold">G</span>}
            title="Google Ads"
            subtitle="Lead form ads"
            status={
              stats['google-ads']?.lastReceivedAt || stats['google-ads']?.lastTestAt ? (
                <StatusPill tone="green">● Connected</StatusPill>
              ) : googleAds ? (
                <StatusPill tone="amber">Waiting for first lead</StatusPill>
              ) : (
                <StatusPill tone="grey">Not set up</StatusPill>
              )
            }
          >
            {googleAds ? (
              <>
                <CopyField label="Webhook URL" value={`${SITE}/api/hooks/google-ads`} />
                <CopyField label="Key" value={googleAds.token} secret />
                <StatsLine s={stats['google-ads']} />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Google Ads → Assets → Lead form → Lead delivery options → Webhook: paste both, then “Send test data”.
                </p>
                {confirmNewKey ? (
                  <span className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    The old key stops working. Paste the new one in Google Ads too.
                    <Button size="sm" variant="danger" disabled={busy} onClick={renewGoogleKey}>
                      Make new key
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmNewKey(false)}>
                      Cancel
                    </Button>
                  </span>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setConfirmNewKey(true)} leftIcon={<RefreshCw className="w-3.5 h-3.5 mr-1" />}>
                    Make new key
                  </Button>
                )}
              </>
            ) : (
              <>
                <StatsLine s={stats['google-ads']} />
                <Button size="sm" variant="primary" disabled={busy || !loaded} onClick={() => create('google-ads', 'Google Ads')}>
                  Get URL & key
                </Button>
              </>
            )}
          </SourceCard>

          <SourceCard
            icon={<span className="text-base font-bold">f</span>}
            title="Facebook & Instagram"
            subtitle="Meta lead ads (instant forms)"
            status={
              stats.meta?.lastReceivedAt || stats.meta?.lastTestAt ? (
                <StatusPill tone="green">● Connected</StatusPill>
              ) : (
                <StatusPill tone="grey">One-time setup</StatusPill>
              )
            }
          >
            <StatsLine s={stats.meta} />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Needs a free Meta app connected to your Facebook Page, once (guided setup). After that, leads arrive here on their own.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quick option: use Zapier / Make / Pabbly “Facebook Lead Ads” → add a connection below.
            </p>
          </SourceCard>
        </div>
      </section>

      {/* Apps & APIs */}
      <AppIntegrations />

      {/* Custom connections */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Your connections</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Zapier, Make, Pabbly, IndiaMART, WordPress, Shopify or any tool that can send a webhook.
            </p>
          </div>
          {!adding && (
            <Button size="sm" variant="primary" disabled={!loaded} onClick={() => setAdding(true)} leftIcon={<Plus className="w-4 h-4 mr-1" />}>
              New connection
            </Button>
          )}
        </div>

        {adding && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-900 p-4 space-y-3">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Where will these leads come from?</p>
            <div className="flex flex-wrap gap-2">
              {['Zapier', 'Make', 'Pabbly', 'IndiaMART', 'WordPress / Elementor', 'JustDial (via Zapier)', 'Shopify'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setName(p)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium ${
                    name === p
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder="Or type a name, e.g. Agra landing page"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
            {clients.length > 0 && (
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Send these leads to which client?</label>
                <select
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                >
                  <option value="">Agency only (no client portal)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> This name shows on every lead from this connection. If a client is chosen, their leads appear in that client\'s portal.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="primary" disabled={busy || !name.trim()} onClick={() => create('webhook', name.trim(), newClientId || undefined)}>
                Create connection
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAdding(false);
                  setName('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {loaded && webhooks.length === 0 && !adding && !error && (
          <p className="text-sm text-slate-500 dark:text-slate-400 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center">
            No connections yet. Click <b>New connection</b>, copy the link, paste it in your tool.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {webhooks.map((c) => (
            <ConnectionRow key={c.id} c={c} s={stats[c.id]} onError={setError} clients={clients} />
          ))}
        </div>
      </section>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Calls, WhatsApp chats and walk-ins: add them with <b>Leads → Add New Lead</b>.
      </p>
    </div>
  );
};
