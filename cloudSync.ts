import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { KEYS } from './storage';

// Keys that should stay purely local/device-specific and never sync to the cloud.
const LOCAL_ONLY_KEYS = new Set<string>([KEYS.theme, KEYS.globalSnoozeUntil]);

let currentUid: string | null = null;
const pendingTimers: Record<string, ReturnType<typeof setTimeout>> = {};
const DEBOUNCE_MS = 1200;

export function setCloudUid(uid: string | null) {
  currentUid = uid;
}

export function getCloudUid(): string | null {
  return currentUid;
}

function docRefFor(uid: string, key: string) {
  return doc(db, 'users', uid, 'appData', key);
}

/**
 * Pulls every known key from Firestore into localStorage.
 * Call this once, right after sign-in, BEFORE the main App component mounts,
 * since the app's React state reads from localStorage synchronously on first render.
 */
export async function bootstrapCloudData(uid: string): Promise<void> {
  if (!isFirebaseConfigured) return;

  const keys = Object.values(KEYS).filter(k => !LOCAL_ONLY_KEYS.has(k));

  await Promise.all(
    keys.map(async (key) => {
      try {
        const snap = await getDoc(docRefFor(uid, key));
        if (snap.exists()) {
          const { value } = snap.data() as { value: unknown };
          if (value !== undefined) {
            localStorage.setItem(key, JSON.stringify(value));
          }
        }
      } catch (err) {
        // Don't block the whole app if one key fails to fetch — log and continue.
        console.error(`Cloud sync: failed to fetch "${key}"`, err);
      }
    })
  );
}

/**
 * Queues a debounced write of a single key's value to Firestore.
 * Debounced per-key so rapid local state changes (typing, toggling) don't
 * spam Firestore with a write on every keystroke.
 */
export function queueCloudWrite<T>(key: string, value: T) {
  if (!isFirebaseConfigured || !currentUid || LOCAL_ONLY_KEYS.has(key)) return;

  if (pendingTimers[key]) clearTimeout(pendingTimers[key]);

  const uid = currentUid;
  pendingTimers[key] = setTimeout(async () => {
    delete pendingTimers[key];
    try {
      await setDoc(docRefFor(uid, key), { value, updatedAt: Date.now() });
    } catch (err) {
      console.error(`Cloud sync: failed to write "${key}"`, err);
    }
  }, DEBOUNCE_MS);
}

/**
 * After Firebase Auth confirms who the person is, make sure the app's own
 * TeamMember record (used for name/role/avatar throughout the UI) exists
 * and is set as the active user — so App.tsx's internal `currentUser` check
 * passes immediately without a second, weaker login step.
 */
export function ensureLocalUserRecord(email: string, uid: string) {
  const teamMembersRaw = localStorage.getItem(KEYS.teamMembers);
  let teamMembers: any[] = [];
  try {
    teamMembers = teamMembersRaw ? JSON.parse(teamMembersRaw) : [];
  } catch {
    teamMembers = [];
  }

  let match = teamMembers.find(m => m.email?.toLowerCase() === email.toLowerCase());

  if (!match) {
    match = {
      id: uid,
      name: email.split('@')[0],
      email,
      role: 'Admin',
      dateJoined: new Date().toISOString(),
      hrStatus: 'Active',
      jobTitle: 'Owner',
    };
    teamMembers = [match, ...teamMembers];
    localStorage.setItem(KEYS.teamMembers, JSON.stringify(teamMembers));
  }

  localStorage.setItem(KEYS.currentUser, JSON.stringify(match));
}

export function clearLocalUserRecord() {
  localStorage.removeItem(KEYS.currentUser);
}

/** Force-flush any pending debounced writes immediately (e.g. before logout). */
export async function flushPendingWrites(): Promise<void> {
  const keys = Object.keys(pendingTimers);
  await Promise.all(
    keys.map(key => new Promise<void>(resolve => {
      clearTimeout(pendingTimers[key]);
      delete pendingTimers[key];
      resolve();
    }))
  );
}
