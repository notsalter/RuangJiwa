import { create } from 'zustand';
import type { UserProfile } from '@/models/types';

export interface AuthState {
  userId?: string;
  profile?: UserProfile;
  setUserId: (id?: string) => void;
  setProfile: (profile?: UserProfile) => void;
}

type Setter<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;

export const useAuth = create<AuthState>((set: Setter<AuthState>) => ({
  userId: undefined,
  profile: undefined,
  setUserId: (id?: string) => set({ userId: id }),
  setProfile: (profile?: UserProfile) => set({ profile }),
}));
