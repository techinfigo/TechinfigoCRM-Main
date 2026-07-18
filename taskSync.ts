import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Task } from './types';

/**
 * Live, per-document Firestore sync for the "My Tasks" feature.
 *
 * Unlike the rest of the app (which stores each collection as one big JSON blob
 * via cloudSync.ts), tasks are stored one Firestore document per task under
 *   users/{uid}/tasks/{taskId}
 * so that "My Tasks" can update in real time and survive a refresh.
 *
 * When Firebase isn't configured, every function is a safe no-op and
 * subscribeToTasks returns an unsubscribe function that does nothing — so the
 * app still runs fully offline/local.
 */

const tasksCollection = (uid: string) => collection(db, 'users', uid, 'tasks');
const taskDoc = (uid: string, taskId: string) =>
  doc(db, 'users', uid, 'tasks', taskId);

/**
 * Firestore rejects `undefined` field values outright. Optional Task fields end
 * up undefined, so strip them before writing. JSON round-trip drops undefined
 * keys; undefined array entries become null, which Firestore accepts.
 */
function sanitizeForFirestore<T>(value: T): DocumentData {
  return JSON.parse(JSON.stringify(value ?? null));
}

/**
 * Subscribe to live task updates for a user. The callback fires immediately with
 * the current set and again on every change. Returns an unsubscribe function.
 */
export function subscribeToTasks(
  uid: string,
  callback: (tasks: Task[]) => void,
): () => void {
  if (!isFirebaseConfigured || !uid) {
    return () => {};
  }

  try {
    return onSnapshot(
      tasksCollection(uid),
      (snapshot: QuerySnapshot<DocumentData>) => {
        const tasks = snapshot.docs.map((d) => d.data() as Task);
        callback(tasks);
      },
      (err) => {
        console.error('Task sync: subscription error', err);
      },
    );
  } catch (err) {
    console.error('Task sync: failed to subscribe', err);
    return () => {};
  }
}

/** Create or update a single task in Firestore. */
export async function saveTaskToCloud(uid: string, task: Task): Promise<void> {
  if (!isFirebaseConfigured || !uid || !task?.id) return;
  try {
    await setDoc(taskDoc(uid, task.id), sanitizeForFirestore(task));
  } catch (err) {
    console.error(`Task sync: failed to save task "${task.id}"`, err);
  }
}

/** Delete a single task from Firestore. */
export async function deleteTaskFromCloud(
  uid: string,
  taskId: string,
): Promise<void> {
  if (!isFirebaseConfigured || !uid || !taskId) return;
  try {
    await deleteDoc(taskDoc(uid, taskId));
  } catch (err) {
    console.error(`Task sync: failed to delete task "${taskId}"`, err);
  }
}
