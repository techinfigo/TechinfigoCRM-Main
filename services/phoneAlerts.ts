import { auth, isFirebaseConfigured } from '../firebase';

/**
 * Phone alerts for new enquiries and reminders.
 *
 * How it works:
 *  1. The CRM registers /sw.js (also what makes it installable as an app).
 *  2. "Turn on alerts" asks the browser for permission, fetches the website's
 *     public Web Push key (www.techinfigo.com/api/crm-push, GET) and subscribes
 *     this phone/computer with it. The website creates and keeps that key
 *     itself, so there is nothing to set up in Firebase or Vercel.
 *  3. The subscription is sent to the website together with the signed-in
 *     user's Firebase ID token. The website checks it is the owner, stores it,
 *     and sends this device a notification for every new enquiry and reminder.
 */

const PUSH_ENDPOINT = `${(process.env.WEBSITE_URL || 'https://www.techinfigo.com').replace(/\/$/, '')}/api/crm-push`;
const STORED_TOKEN = 'crm_push_token';

function fromBase64Url(value: string): Uint8Array {
  const padded = (value + '='.repeat((4 - (value.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function toBase64Url(buf: ArrayBuffer | null | undefined): string {
  if (!buf) return '';
  let bin = '';
  new Uint8Array(buf).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export type AlertsState = 'unsupported' | 'not-configured' | 'off' | 'on' | 'blocked' | 'needs-install';

let swRegistration: Promise<ServiceWorkerRegistration | null> | null = null;

/** Registers the service worker once. Safe to call many times. */
export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (swRegistration) return swRegistration;
  swRegistration =
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator
      ? navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => {
          console.warn('[alerts] service worker failed:', err);
          return null;
        })
      : Promise.resolve(null);
  return swRegistration;
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** True when opened from the home-screen icon rather than a browser tab. */
export function isInstalledApp(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export async function getAlertsState(): Promise<AlertsState> {
  if (!isFirebaseConfigured) return 'not-configured';
  // iPhone only allows web notifications for apps added to the Home Screen.
  if (isIOS() && !isInstalledApp()) return 'needs-install';
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  if (Notification.permission === 'granted' && localStorage.getItem(STORED_TOKEN)) return 'on';
  return 'off';
}

async function callWebsite(method: 'POST' | 'DELETE', token: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in again.');
  const idToken = await user.getIdToken();
  const res = await fetch(PUSH_ENDPOINT, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idToken,
      token,
      origin: window.location.origin,
      device: navigator.userAgent.slice(0, 200),
    }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Could not save alerts (${res.status}).`);
  }
}

/** Asks permission, gets this device's token and registers it with the website. */
export async function turnOnAlerts(): Promise<AlertsState> {
  const state = await getAlertsState();
  if (state === 'not-configured' || state === 'unsupported' || state === 'needs-install') return state;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'blocked' : 'off';

  const reg = await registerServiceWorker();
  if (!reg) throw new Error('This browser could not start notifications.');
  await navigator.serviceWorker.ready;

  const keyRes = await fetch(PUSH_ENDPOINT, { method: 'GET' });
  const keyData = (await keyRes.json().catch(() => ({}))) as { publicKey?: string };
  if (!keyRes.ok || !keyData.publicKey) throw new Error('Could not reach the alert server. Try again in a minute.');

  let sub = await reg.pushManager.getSubscription();
  // A subscription made with an older key must be replaced.
  if (sub && toBase64Url(sub.options.applicationServerKey) !== keyData.publicKey) {
    await sub.unsubscribe().catch(() => {});
    sub = null;
  }
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: fromBase64Url(keyData.publicKey) });
  }
  const token = JSON.stringify(sub.toJSON());

  await callWebsite('POST', token);
  localStorage.setItem(STORED_TOKEN, token);
  return 'on';
}

/** Stops alerts on this device. */
export async function turnOffAlerts(): Promise<AlertsState> {
  const token = localStorage.getItem(STORED_TOKEN);
  if (token) {
    await callWebsite('DELETE', token).catch((err) => console.warn('[alerts] unregister failed:', err));
    const reg = await registerServiceWorker();
    const sub = await reg?.pushManager.getSubscription().catch(() => null);
    await sub?.unsubscribe().catch(() => {});
  }
  localStorage.removeItem(STORED_TOKEN);
  return 'off';
}

/**
 * Sends a test notification to this device (through the website, the same
 * path a real enquiry takes), so the owner can see that it works.
 */
export async function sendTestAlert(): Promise<void> {
  const token = localStorage.getItem(STORED_TOKEN);
  if (!token) throw new Error('Turn on alerts first.');
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in again.');
  const res = await fetch(`${PUSH_ENDPOINT}?test=1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: await user.getIdToken(), token, origin: window.location.origin, test: true }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(`Test alert failed${data.error ? `: ${data.error}` : '.'}`);
  }
}

export type CheckStep = { label: string; ok: boolean | null; detail: string };

/**
 * "Check alerts": runs every step of a phone alert on this device and says
 * which one fails, so a problem can be fixed from one screenshot.
 */
export async function runAlertsCheck(onStep: (steps: CheckStep[]) => void): Promise<CheckStep[]> {
  const steps: CheckStep[] = [];
  const add = (label: string, ok: boolean | null, detail: string) => {
    steps.push({ label, ok, detail });
    onStep([...steps]);
  };

  add('Opened as the app', isInstalledApp() ? true : null, isInstalledApp() ? 'Yes' : 'No (browser tab)');

  const perm = 'Notification' in window ? Notification.permission : 'missing';
  add('Notification permission', perm === 'granted', perm);
  if (perm !== 'granted') return steps;

  const reg = await registerServiceWorker();
  await navigator.serviceWorker.ready.catch(() => null);
  add('Background worker', !!reg?.active, reg?.active ? 'Running' : 'Not running');
  if (!reg?.active) return steps;

  const sub = await reg.pushManager.getSubscription().catch(() => null);
  const host = sub ? new URL(sub.endpoint).host : '';
  add('Push subscription', !!sub, sub ? host : 'None. Tap Turn off, then Turn on alerts again.');
  if (!sub) return steps;

  const saved = localStorage.getItem(STORED_TOKEN);
  add('Saved on server', saved === JSON.stringify(sub.toJSON()) ? true : null, saved ? (saved === JSON.stringify(sub.toJSON()) ? 'Yes' : 'Changed. Tap Turn off, then Turn on.') : 'No');

  // Show one notification straight from this phone (no server involved).
  try {
    await reg.showNotification('Local test from Techinfigo', {
      body: 'If you see this, your phone can show CRM notifications.',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      tag: 'local-test',
    });
    await new Promise((r) => setTimeout(r, 800));
    const shown = await reg.getNotifications({ tag: 'local-test' }).catch(() => []);
    add('Phone can show a notification', shown.length > 0 ? true : null, shown.length > 0 ? 'Shown (check your notification bar)' : 'Sent to the phone, but it did not appear in the list');
  } catch (err) {
    add('Phone can show a notification', false, err instanceof Error ? err.message : String(err));
  }

  // Full path: website → push service → this phone.
  const arrived = new Promise<{ shown: boolean; error: string | null } | null>((resolve) => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'crm-push-received') {
        navigator.serviceWorker.removeEventListener('message', onMsg);
        resolve({ shown: !!e.data.shown, error: e.data.error });
      }
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    setTimeout(() => {
      navigator.serviceWorker.removeEventListener('message', onMsg);
      resolve(null);
    }, 20000);
  });
  try {
    await sendTestAlert();
    add('Website sent the alert', true, 'Accepted by the push service');
  } catch (err) {
    add('Website sent the alert', false, err instanceof Error ? err.message : String(err));
    return steps;
  }
  const got = await arrived;
  add(
    'Alert reached this phone',
    got ? got.shown : false,
    got ? (got.shown ? 'Yes, and shown' : `Arrived but could not show: ${got.error}`) : 'Not received within 20 seconds',
  );
  return steps;
}
