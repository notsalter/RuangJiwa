import { it, expect, vi } from 'vitest';
import { createBackend } from './firebase';
const boundary = vi.hoisted(() => ({ user: { uid: 'owner' }, set: vi.fn(), update: vi.fn(), remove: vi.fn(), add: vi.fn(), data: { userId: 'someone-else' } }));
vi.mock('firebase/app', () => ({ initializeApp: () => ({}), getApps: () => [] }));
vi.mock('firebase/auth', () => ({ getAuth: () => ({ get currentUser() { return boundary.user; } }) }));
vi.mock('firebase/firestore/lite', () => ({ getFirestore: () => ({}), doc: (...args: unknown[]) => args, getDoc: async () => ({ exists: () => true, data: () => boundary.data }), updateDoc: boundary.update, deleteDoc: boundary.remove, setDoc: boundary.set, addDoc: boundary.add }));
const env = Object.fromEntries(['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'STORAGE_BUCKET', 'APP_ID'].map(k => ['VITE_FIREBASE_' + k, 'test-identifier']));
it('requires complete configuration and denies cross-user writes before Firestore update', async () => {
  expect(createBackend({})).toBeNull(); const backend = createBackend(env)!;
  await expect(backend.update('journals', 'owner', 'other-entry', { title: 'new title' })).rejects.toThrow(); expect(boundary.update).not.toHaveBeenCalled();
  await expect(backend.remove('journals', 'owner', 'other-entry')).rejects.toThrow(); expect(boundary.remove).not.toHaveBeenCalled();
  await expect(backend.create('moods', 'different-account', { mood: 'happy' })).rejects.toThrow(); expect(boundary.add).not.toHaveBeenCalled();
});
