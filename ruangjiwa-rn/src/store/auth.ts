import { create } from 'zustand';

export interface AuthState {
  userId?: string;
  setUserId: (id?: string) => void;
}

type Setter<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;

export const useAuth = create<AuthState>((set: Setter<AuthState>) => ({
  userId: undefined,
  setUserId: (id?: string) => set({ userId: id }),
}));
