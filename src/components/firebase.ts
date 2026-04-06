import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDocFromServer, initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore
export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
export const isMockConfig = false;
export const googleProvider = new GoogleAuthProvider();

// Rate limiting for authentication
const AUTH_RATE_LIMIT = 5;
const AUTH_TIME_WINDOW = 15 * 60 * 1000; // 15 minutes

const getAuthAttempts = () => {
  try {
    const attemptsStr = localStorage.getItem('auth_attempts');
    if (!attemptsStr) return [];
    
    const attempts = JSON.parse(attemptsStr);
    const now = Date.now();
    
    // Filter out attempts older than the time window
    const validAttempts = attempts.filter((time: number) => now - time < AUTH_TIME_WINDOW);
    
    // Update storage if we filtered out old attempts
    if (validAttempts.length !== attempts.length) {
      localStorage.setItem('auth_attempts', JSON.stringify(validAttempts));
    }
    
    return validAttempts;
  } catch (e) {
    return [];
  }
};

const recordAuthAttempt = () => {
  try {
    const attempts = getAuthAttempts();
    attempts.push(Date.now());
    localStorage.setItem('auth_attempts', JSON.stringify(attempts));
  } catch (e) {
    console.error('Failed to record auth attempt', e);
  }
};

export const signInWithGoogle = async () => {
  const attempts = getAuthAttempts();
  
  if (attempts.length >= AUTH_RATE_LIMIT) {
    const oldestAttempt = attempts[0];
    const timeRemaining = Math.ceil((AUTH_TIME_WINDOW - (Date.now() - oldestAttempt)) / 60000);
    throw new Error(`Too many authentication attempts. Please try again in ${timeRemaining} minutes.`);
  }
  
  recordAuthAttempt();
  return signInWithPopup(auth, googleProvider);
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
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
