import React from 'react';
import { observeAuth } from '@/services/auth';
import { useAuth } from '@/store/auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUserId = useAuth(s => s.setUserId);
  React.useEffect(() => {
    const unsubscribe = observeAuth(user => setUserId(user?.uid));
    return unsubscribe;
  }, [setUserId]);
  return <>{children}</>; 
}
