import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDocFromServer, initializeFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
export const isMockConfig = false;
export const googleProvider = new GoogleAuthProvider();

// ─── Input Limits ─────────────────────────────────────────────────────────────
export const LIMITS = {
  POST_TITLE: 100,
  POST_DESCRIPTION: 1000,
  CHAT_MESSAGE: 500,
  CATEGORY: 50,
};

// ─── Input Sanitizer ──────────────────────────────────────────────────────────
export const sanitize = (text: string, maxLength: number): string => {
  return text.trim().slice(0, maxLength);
};

// ─── Auth Rate Limiting (5 attempts / 15 min) ─────────────────────────────────
const authAttempts: number[] = [];
const AUTH_RATE_LIMIT = 5;
const AUTH_TIME_WINDOW = 15 * 60 * 1000;

const getAuthAttempts = (): number[] => {
  const now = Date.now();
  const valid = authAttempts.filter((t) => now - t < AUTH_TIME_WINDOW);
  authAttempts.length = 0;
  valid.forEach((t) => authAttempts.push(t));
  return valid;
};

const recordAuthAttempt = () => {
  authAttempts.push(Date.now());
};

export const checkRateLimit = () => {
  const attempts = getAuthAttempts();
  if (attempts.length >= AUTH_RATE_LIMIT) {
    const oldest = attempts[0];
    const remaining = Math.ceil((AUTH_TIME_WINDOW - (Date.now() - oldest)) / 60000);
    throw new Error(`Too many sign-in attempts. Please try again in ${remaining} minutes.`);
  }
  recordAuthAttempt();
};

// ─── Message Rate Limiting (10 messages / 60 sec per user) ───────────────────
const messageAttempts: Map<string, number[]> = new Map();
const MSG_RATE_LIMIT = 10;
const MSG_TIME_WINDOW = 60 * 1000;

export const checkMessageRateLimit = (userId: string) => {
  const now = Date.now();
  const attempts = (messageAttempts.get(userId) || []).filter(
    (t) => now - t < MSG_TIME_WINDOW
  );
  if (attempts.length >= MSG_RATE_LIMIT) {
    throw new Error('You are sending messages too fast. Please wait a moment.');
  }
  attempts.push(now);
  messageAttempts.set(userId, attempts);
};

// ─── Post Rate Limiting (5 posts / 10 min per user) ──────────────────────────
const postAttempts: Map<string, number[]> = new Map();
const POST_RATE_LIMIT = 5;
const POST_TIME_WINDOW = 10 * 60 * 1000;

export const checkPostRateLimit = (userId: string) => {
  const now = Date.now();
  const attempts = (postAttempts.get(userId) || []).filter(
    (t) => now - t < POST_TIME_WINDOW
  );
  if (attempts.length >= POST_RATE_LIMIT) {
    const remaining = Math.ceil(
      (POST_TIME_WINDOW - (now - attempts[0])) / 60000
    );
    throw new Error(
      `You've posted too many times. Please wait ${remaining} minute(s).`
    );
  }
  attempts.push(now);
  postAttempts.set(userId, attempts);
};

// ─── Google Sign-In ───────────────────────────────────────────────────────────
export const signInWithGoogleCredential = async (idToken: string) => {
  checkRateLimit();
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
};

// ─── Firestore Error Handler (no sensitive user data logged) ──────────────────
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authenticated: boolean;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : 'Unknown error',
    operationType,
    path,
    authenticated: !!auth.currentUser,
  };
  if (__DEV__) {
    console.error('Firestore Error:', JSON.stringify(errInfo));
  }
  throw new Error(errInfo.error);
}

// ─── Connection Test ──────────────────────────────────────────────────────────
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      if (__DEV__) console.error('Firebase offline. Check your configuration.');
    }
  }
}
