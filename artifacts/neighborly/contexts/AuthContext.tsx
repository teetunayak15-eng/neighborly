import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/src/firebase';
import { UserProfile } from '@/src/types';

interface AuthContextValue {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchOrCreateProfile(fbUser: FirebaseUser) {
    try {
      const ref = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        const newProfile: Omit<UserProfile, 'createdAt'> & { createdAt: any } = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'Neighbor',
          email: fbUser.email || '',
          photoURL: fbUser.photoURL || undefined,
          role: 'user',
          isVerified: false,
          badges: [],
          reliabilityScore: 100,
          neighborsHelped: 0,
          thankYous: 0,
          completionCount: 0,
          createdAt: serverTimestamp(),
        };
        await setDoc(ref, newProfile);
        setProfile(newProfile as UserProfile);
      }
    } catch (e) {
      console.error('Profile fetch error', e);
    }
  }

  async function refreshProfile() {
    if (user) await fetchOrCreateProfile(user);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        await fetchOrCreateProfile(fbUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
