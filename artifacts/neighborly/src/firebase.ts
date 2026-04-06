import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {}, firebaseConfig.databaseId);

// In-memory rate limiting (replaces localStorage which doesn't exist in React Native)
const authAttempts: number[] = [];
const AUTH_RATE_LIMIT = 5;
const AUTH_TIME_WINDOW = 15 * 60 * 1000;

function getValidAttempts(): number[] {
  const now = Date.now();
  const filtered = authAttempts.filter((t) => now - t < AUTH_TIME_WINDOW);
  authAttempts.length = 0;
  filtered.forEach((t) => authAttempts.push(t));
  return filtered;
}

function checkRateLimit() {
  const attempts = getValidAttempts();
  if (attempts.length >= AUTH_RATE_LIMIT) {
    const oldest = attempts[0];
    const remaining = Math.ceil((AUTH_TIME_WINDOW - (Date.now() - oldest)) / 60000);
    throw new Error(`Too many attempts. Try again in ${remaining} minutes.`);
  }
  authAttempts.push(Date.now());
}

export async function signInWithEmail(email: string, password: string) {
  checkRateLimit();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email: string, password: string, displayName: string) {
  checkRateLimit();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  return cred;
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('Firestore Error', { operationType, path, error: msg });
  throw new Error(msg);
}
