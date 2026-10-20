import { auth } from '../firebase';
import type { AccessCredential } from '../types';

/**
 * "Fill your logins" links (www.techinfigo.com/c/<id>), handled by the website.
 * The CRM creates them, lists them, and pulls in what clients submitted.
 */
const ENDPOINT = `${(process.env.WEBSITE_URL || 'https://www.techinfigo.com').replace(/\/$/, '')}/api/cred-requests`;

export const CRED_ITEMS: { key: string; emoji: string; label: string; invite?: boolean }[] = [
  { key: 'instagram', emoji: '📸', label: 'Instagram' },
  { key: 'facebook', emoji: '👍', label: 'Facebook Page', invite: true },
  { key: 'gbp', emoji: '📍', label: 'Google Business Profile', invite: true },
  { key: 'website', emoji: '🌐', label: 'Website admin' },
  { key: 'hosting', emoji: '🖥️', label: 'Hosting' },
  { key: 'domain', emoji: '🔗', label: 'Domain' },
  { key: 'gmail', emoji: '✉️', label: 'Business Gmail' },
  { key: 'youtube', emoji: '▶️', label: 'YouTube' },
  { key: 'ads', emoji: '📢', label: 'Google Ads', invite: true },
  { key: 'analytics', emoji: '📊', label: 'Google Analytics', invite: true },
  { key: 'other', emoji: '➕', label: 'Anything else (client writes it)' },
];

export type CredAnswer = {
  key: string;
  label: string;
  mode: 'login' | 'invite' | 'unknown';
  username?: string;
  password?: string;
  phone?: string;
  url?: string;
  notes?: string;
};

export type CredRequest = {
  id: string;
  clientId: string;
  clientName: string;
  items: string[];
  status: 'open' | 'submitted' | 'expired';
  createdAt: number;
  expiresAt: number;
  submittedAt?: number;
  answers?: CredAnswer[];
};

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in again.');
  const idToken = await user.getIdToken();
  const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken, ...body }) });
  const json = (await res.json().catch(() => ({}))) as T & { ok?: boolean; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error || `Something went wrong (${res.status}).`);
  return json;
}

export const createCredRequest = (clientId: string, clientName: string, items: string[], inviteEmail: string) =>
  call<{ id: string; url: string; expiresAt: number }>({ action: 'create', clientId, clientName, items, inviteEmail });

export const listCredRequests = () => call<{ requests: CredRequest[] }>({ action: 'list' }).then((r) => r.requests || []);

export const removeCredRequest = (id: string) => call<{ ok: boolean }>({ action: 'remove', id });

/** Turns a client's answers into vault entries. */
export function answersToCredentials(r: CredRequest): AccessCredential[] {
  const day = new Date(r.submittedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  // No undefined values: the cloud copy of the client rejects them.
  const tidy = (c: AccessCredential) => Object.fromEntries(Object.entries(c).filter(([, v]) => v !== undefined && v !== '')) as AccessCredential;
  return (r.answers || []).map((a, i) => tidy(build(a, i)));
  function build(a: CredAnswer, i: number): AccessCredential {
    const base = { id: `cred-${r.id}-${i}`, label: a.label, url: a.url };
    const note = (extra: string) => [extra, a.notes ? `Client note: ${a.notes}` : ''].filter(Boolean).join('\n');
    if (a.mode === 'invite')
      return { ...base, loginType: 'Other' as const, notes: note(`Client says they gave access by invite (${day}). Check your email / the platform and accept it.`) };
    if (a.mode === 'unknown')
      return { ...base, loginType: 'Other' as const, notes: note(`Client didn't know this on ${day}. Ask on call.`) };
    return {
      ...base,
      loginType: (a.key === 'gmail' ? 'Gmail Login' : a.username && !a.password && a.phone ? 'Phone / OTP' : 'Username + Password') as AccessCredential['loginType'],
      username: a.username,
      password: a.password,
      phone: a.phone,
      notes: note(`Filled by client via form on ${day}.`),
    };
  }
}
