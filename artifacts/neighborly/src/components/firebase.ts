import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDocFromServer, initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
export const isMockConfig = false;
export const googleProvider = new GoogleAuthProvider();

// In-memory rate limiting (localStorage doesn't exist in React Native)
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
    throw new Error(`Too many authentication attempts. Please try again in ${remaining} minutes.`);
  }
  recordAuthAttempt();
};

// signInWithGoogle is handled via expo-auth-session in AuthScreen component
// This helper completes the sign-in with a Google ID token
export const signInWithGoogleCredential = async (idToken: string) => {
  checkRateLimit();
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
};

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
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
