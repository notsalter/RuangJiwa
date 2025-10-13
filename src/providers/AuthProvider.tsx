import React from 'react';
import { observeAuth } from '@/services/auth';
import { useAuth } from '@/store/auth';
import { fetchUserProfile } from '@/services/collections/users';
import type { UserProfile } from '@/models/types';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUserId = useAuth(s => s.setUserId);
  const setProfile = useAuth(s => s.setProfile);
  React.useEffect(() => {
    let active = true;
    const unsubscribe = observeAuth(async user => {
      setUserId(user?.uid);
      if (!user) {
        setProfile(undefined);
        return;
      }

      const baseProfile: UserProfile = {
        id: user.uid,
        name: user.displayName ?? undefined,
        email: user.email ?? undefined,
        photoUrl: user.photoURL ?? undefined,
      };

      setProfile(baseProfile);

      try {
        const extra = await fetchUserProfile(user.uid);
        if (extra && active) {
          setProfile({ ...baseProfile, ...extra });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to fetch Firestore profile', error);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [setProfile, setUserId]);
  return <>{children}</>; 
}
