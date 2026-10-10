import { getMessaging, getToken, deleteToken, isSupported } from 'firebase/messaging';
import { app, auth, isFirebaseConfigured } from '../firebase';

/**
 * Phone alerts for new enquiries.
 *
 * How it works:
 *  1. The CRM registers /sw.js (also what makes it installable as an app).
 *  2. "Turn on alerts" asks the browser for permission and gets a Firebase
 *     Cloud Messaging token for this phone/computer.
 *  3. The token is sent to the website (www.techinfigo.com/api/crm-push)
 *     together with the signed-in user's Firebase ID token. The website checks
 *     it is the owner, stores the token, and from then on sends a notification
 *     to this device every time a new enquiry arrives.
 *
 * The VAPID key is the public "web push certificate" from Firebase Console →
 * Project settings → Cloud Messaging. It is not a secret.
 */

const VAPID_KEY = process.env.FIREBASE_VAPID_KEY || '';
const PUSH_ENDPOINT = `${(process.env.WEBSITE_URL || 'https://www.techinfigo.com').replace(/\/$/, '')}/api/crm-push`;
const STORED_TOKEN = 'crm_push_token';

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
  if (!VAPID_KEY) return 'not-configured';
  // iPhone only allows web notifications for apps added to the Home Screen.
  if (isIOS() && !isInstalledApp()) return 'needs-install';
  if (!('Notification' in window) || !(await isSupported().catch(() => false))) return 'unsupported';
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

  const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
  if (!token) throw new Error('Could not get a notification token.');

  await callWebsite('POST', token);
  localStorage.setItem(STORED_TOKEN, token);
  return 'on';
}

/** Stops alerts on this device. */
export async function turnOffAlerts(): Promise<AlertsState> {
  const token = localStorage.getItem(STORED_TOKEN);
  if (token) {
    await callWebsite('DELETE', token).catch((err) => console.warn('[alerts] unregister failed:', err));
    await deleteToken(getMessaging(app)).catch(() => {});
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
  if (!res.ok) throw new Error('Test alert failed.');
}
