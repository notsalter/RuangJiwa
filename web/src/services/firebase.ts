import { emulatorEnabled } from './emulators';
import { firebaseConfig, safePhotoUrl } from '../core/config';
import type { Backend, Collections } from '../core/types';
export function createBackend(env: Record<string, unknown>): Backend | null {
  const config = firebaseConfig(env);
  if (!config) return null;
  let pending: ReturnType<typeof connect> | undefined;
  async function connect() {
    const [appSdk, authSdk, store] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore/lite')]);
    const app = appSdk.getApps()[0] ?? appSdk.initializeApp(config!);
    const auth = authSdk.getAuth(app), db = store.getFirestore(app);
    if (emulatorEnabled(env)) { authSdk.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true }); store.connectFirestoreEmulator(db, '127.0.0.1', 8085); }
    return { app, authSdk, auth, store, db };
  }
  const client = () => pending ??= connect();
  const assertOwner = (auth: { currentUser: { uid: string } | null }, uid: string) => { if (auth.currentUser?.uid !== uid) throw new Error('session-changed'); };
  const clean = (data: Record<string, unknown>) => Object.fromEntries(Object.entries(data).filter(([key, value]) => value !== undefined && !['id', 'userId'].includes(key)));
  async function owned(name: string, uid: string, id: string) {
    const c = await client(); assertOwner(c.auth, uid);
    const ref = c.store.doc(c.db, name, id), snap = await c.store.getDoc(ref);
    assertOwner(c.auth, uid);
    if (!snap.exists() || snap.data().userId !== uid) throw new Error('not-owner');
    return { c, ref };
  }
  return {
    observe(callback, onError) {
      let active = true, stop = () => {};
      void client().then(c => { if (active) stop = c.authSdk.onAuthStateChanged(c.auth, callback, onError); }).catch(error => { if (active) onError(error); });
      return () => { active = false; stop(); };
    },
    async login(email, password, register) { const c = await client(); await (register ? c.authSdk.createUserWithEmailAndPassword : c.authSdk.signInWithEmailAndPassword)(c.auth, email, password); },
    async logout() { const c = await client(); await c.authSdk.signOut(c.auth); },
    async resetPassword(email) { const c = await client(); await c.authSdk.sendPasswordResetEmail(c.auth, email); },
    async profile(uid) {
      const c = await client(); assertOwner(c.auth, uid);
      const snap = await c.store.getDoc(c.store.doc(c.db, 'users', uid)); assertOwner(c.auth, uid);
      const data = snap.exists() ? snap.data() : {};
      return { id: uid, name: typeof data.name === 'string' ? data.name : c.auth.currentUser?.displayName ?? undefined, email: c.auth.currentUser?.email ?? undefined, photoUrl: safePhotoUrl(typeof data.profileImageUrl === 'string' ? data.profileImageUrl : typeof data.photoUrl === 'string' ? data.photoUrl : c.auth.currentUser?.photoURL ?? undefined) };
    },
    async saveProfile(uid, name, photo) {
      const c = await client(); assertOwner(c.auth, uid);
      const updates: { displayName: string; photoURL?: string } = { displayName: name.trim() };
      if (!updates.displayName || updates.displayName.length > 100) throw new Error('invalid-name');
      if (photo) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type) || photo.size > 5 * 1024 * 1024) throw new Error('invalid-photo');
        const storage = await import('firebase/storage'); assertOwner(c.auth, uid);
        const bucket = storage.getStorage(c.app);
        if (emulatorEnabled(env)) storage.connectStorageEmulator(bucket, '127.0.0.1', 9199);
        const ref = storage.ref(bucket, `profile_images/${uid}/${crypto.randomUUID()}`);
        await storage.uploadBytes(ref, photo, { contentType: photo.type }); assertOwner(c.auth, uid);
        updates.photoURL = safePhotoUrl(await storage.getDownloadURL(ref)); assertOwner(c.auth, uid);
        if (!updates.photoURL) throw new Error('invalid-photo-url');
      }
      assertOwner(c.auth, uid); await c.authSdk.updateProfile(c.auth.currentUser!, updates); assertOwner(c.auth, uid);
      await c.store.setDoc(c.store.doc(c.db, 'users', uid), { name: updates.displayName, ...(updates.photoURL ? { profileImageUrl: updates.photoURL } : {}) }, { merge: true });
    },
    async list(name, uid) {
      const c = await client(); assertOwner(c.auth, uid);
      const col = c.store.collection(c.db, name);
      const snap = await c.store.getDocs(name === 'psychologists' ? col : c.store.query(col, c.store.where('userId', '==', uid)));
      assertOwner(c.auth, uid);
      const items = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      return items as unknown as Collections[typeof name][];
    },
    async create(name, uid, data) { const c = await client(); assertOwner(c.auth, uid); await c.store.addDoc(c.store.collection(c.db, name), { ...clean(data), userId: uid }); },
    async update(name, uid, id, data) { const { c, ref } = await owned(name, uid, id); assertOwner(c.auth, uid); await c.store.updateDoc(ref, clean(data)); },
    async remove(name, uid, id) { const { c, ref } = await owned(name, uid, id); assertOwner(c.auth, uid); await c.store.deleteDoc(ref); },
  };
}
