import { assertWritableCollection, createRecord, updateRecord, validRecord } from "./validation";
import { decodeRecord } from "./records";
import { emulatorEnabled } from "./emulators";
import { firebaseConfig } from "../core/config";
import { ownedAvatarPath, legacyAvatarPath, validAvatar, MAX_AVATAR_BYTES, AvatarSaveError } from "./avatar";
import type { Backend, Collections } from "../core/types";
export function createBackend(env: Record<string, unknown>): Backend | null {
  const config = firebaseConfig(env);
  if (!config) return null;
  let pending: ReturnType<typeof connect> | undefined;
  async function connect() {
    const [appSdk, authSdk, store] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/firestore/lite"),
    ]);
    const app = appSdk.getApps()[0] ?? appSdk.initializeApp(config!);
    const auth = authSdk.getAuth(app),
      db = store.getFirestore(app);
    if (emulatorEnabled(env)) {
      authSdk.connectAuthEmulator(auth, "http://127.0.0.1:9099", {
        disableWarnings: true,
      });
      store.connectFirestoreEmulator(db, "127.0.0.1", 8085);
    }
    return { app, authSdk, auth, store, db };
  }
  const client = () => (pending ??= connect());
  let photoClient: Promise<{ sdk: typeof import("firebase/storage"); bucket: import("firebase/storage").FirebaseStorage }> | undefined;
  const imageClient = () => (photoClient ??= (async () => {
    const c = await client();
    const sdk = await import("firebase/storage");
    const bucket = sdk.getStorage(c.app);
    if (emulatorEnabled(env)) sdk.connectStorageEmulator(bucket, "127.0.0.1", 9199);
    return { sdk, bucket };
  })());
  async function readPhoto(uid: string, path: string) {
    if (!ownedAvatarPath(uid, path)) throw new Error("invalid-photo-path");
    const c = await client();
    assertOwner(c.auth, uid);
    const { sdk, bucket } = await imageClient();
    assertOwner(c.auth, uid);
    const ref = sdk.ref(bucket, path);
    const metadata = await sdk.getMetadata(ref);
    assertOwner(c.auth, uid);
    if (!validAvatar({type: metadata.contentType ?? "", size: metadata.size})) throw new Error("invalid-photo");
    const blob = await sdk.getBlob(ref, MAX_AVATAR_BYTES);
    assertOwner(c.auth, uid);
    if (blob.size !== metadata.size || (blob.type && blob.type !== metadata.contentType)) throw new Error("invalid-photo");
    // Firebase's bounded getBlob slices away MIME; restore only authenticated metadata's allowlisted type.
    return blob.slice(0, blob.size, metadata.contentType);
  }
  const assertOwner = (
    auth: { currentUser: { uid: string } | null },
    uid: string,
  ) => {
    if (auth.currentUser?.uid !== uid) throw new Error("session-changed");
  };
  async function owned(name: string, uid: string, id: string) {
    const c = await client();
    assertOwner(c.auth, uid);
    const ref = c.store.doc(c.db, name, id),
      snap = await c.store.getDoc(ref);
    assertOwner(c.auth, uid);
    if (!snap.exists() || snap.data()?.userId !== uid)
      throw new Error("not-owner");
    return { c, ref, data: snap.data() };
  }
  return {
    observe(callback, onError) {
      let active = true,
        stop = () => {};
      void client()
        .then((c) => {
          if (active)
            stop = c.authSdk.onAuthStateChanged(c.auth, callback, onError);
        })
        .catch((error) => {
          if (active) onError(error);
        });
      return () => {
        active = false;
        stop();
      };
    },
    async login(email, password, register) {
      const c = await client();
      await (
        register
          ? c.authSdk.createUserWithEmailAndPassword
          : c.authSdk.signInWithEmailAndPassword
      )(c.auth, email, password);
    },
    async logout() {
      const c = await client();
      await c.authSdk.signOut(c.auth);
    },
    async resetPassword(email) {
      const c = await client();
      await c.authSdk.sendPasswordResetEmail(c.auth, email);
    },
    async profile(uid) {
      const c = await client();
      assertOwner(c.auth, uid);
      const snap = await c.store.getDoc(c.store.doc(c.db, "users", uid));
      assertOwner(c.auth, uid);
      const data = snap.exists() ? snap.data() : {};
      return {
        id: uid,
        name:
          typeof data.name === "string"
            ? data.name
            : (c.auth.currentUser?.displayName ?? undefined),
        email: c.auth.currentUser?.email ?? undefined,
        profileImagePath: "profileImagePath" in data
          ? ownedAvatarPath(uid, data.profileImagePath)
          : [data.profileImageUrl, data.photoUrl, c.auth.currentUser?.photoURL]
              .map(value => legacyAvatarPath(uid, value, config!.storageBucket, emulatorEnabled(env)))
              .find(path => path !== undefined),
      };
    },
    getPhoto: readPhoto,
    async saveProfile(uid, name, photo) {
      const c = await client();
      assertOwner(c.auth, uid);
      const displayName = name.trim();
      if (!displayName || displayName.length > 100) throw new Error("invalid-name");
      if (photo && !validAvatar(photo)) throw new Error("invalid-photo");
      let imagePath: string | undefined;
      let mutationStarted = false;
      try {
        if (photo) {
          imagePath = `profile_images/${uid}/${crypto.randomUUID()}`;
          if (!ownedAvatarPath(uid, imagePath)) throw new Error("invalid-photo-path");
          const { sdk, bucket } = await imageClient();
          assertOwner(c.auth, uid);
          mutationStarted = true;
          await sdk.uploadBytes(sdk.ref(bucket, imagePath), photo, { contentType: photo.type });
          const uploaded = await readPhoto(uid, imagePath);
          const originalBytes = new Uint8Array(await photo.arrayBuffer());
          const storedBytes = new Uint8Array(await uploaded.arrayBuffer());
          if (uploaded.size !== photo.size || uploaded.type !== photo.type
            || !storedBytes.every((byte, i) => byte === originalBytes[i]))
            throw new Error("photo-not-verified");
        }
        assertOwner(c.auth, uid);
        mutationStarted = true;
        await c.authSdk.updateProfile(c.auth.currentUser!, { displayName, ...(photo && c.auth.currentUser?.photoURL ? { photoURL: "" } : {}) });
        assertOwner(c.auth, uid);
        const payload = {
          name: displayName,
          ...(imagePath ? {
            profileImagePath: imagePath,
            profileImageUrl: c.store.deleteField(),
            photoUrl: c.store.deleteField(),
          } : {}),
        };
        const ref = c.store.doc(c.db, "users", uid);
        await c.store.setDoc(ref, payload, { merge: true });
        assertOwner(c.auth, uid);
        const saved = await c.store.getDoc(ref);
        assertOwner(c.auth, uid);
        if (!saved.exists() || saved.data().name !== displayName
          || c.auth.currentUser?.displayName !== displayName
          || (imagePath && (saved.data().profileImagePath !== imagePath
            || Object.hasOwn(saved.data(), "profileImageUrl") || Object.hasOwn(saved.data(), "photoUrl")
            || Boolean(c.auth.currentUser?.photoURL))))
          throw new Error("profile-not-verified");
      } catch (error) {
        if (photo && mutationStarted)
          throw new AvatarSaveError(error);
        throw error;
      }
    },
    async list(name, uid) {
      const c = await client();
      assertOwner(c.auth, uid);
      const col = c.store.collection(c.db, name);
      const snap = await c.store.getDocs(
        name === "psychologists"
          ? col
          : c.store.query(col, c.store.where("userId", "==", uid)),
      );
      assertOwner(c.auth, uid);
      const items = snap.docs.map((d) => decodeRecord(name, d.id, d.data()));
      if (items.some((item) => !item)) throw new Error("invalid-record-schema");
      return items as Collections[typeof name][];
    },
    async create(name, uid, data) {
      const c = await client();
      assertOwner(c.auth, uid);
      const payload = createRecord(name, uid, data);
      if (name === "consultations") {
        const psychologist = await c.store.getDoc(
          c.store.doc(c.db, "psychologists", payload.psychologistId as string),
        );
        assertOwner(c.auth, uid);
        if (!psychologist.exists()) throw new Error("invalid-record-schema");
      }
      const ref = await c.store.addDoc(c.store.collection(c.db, name), payload);
      assertOwner(c.auth, uid);
      const snap = await c.store.getDoc(ref);
      assertOwner(c.auth, uid);
      if (
        !snap.exists() || !validRecord(name, snap.data()) ||
        Object.entries(payload).some(
          ([key, value]) =>
            JSON.stringify(snap.data()[key]) !== JSON.stringify(value),
        )
      )
        throw new Error("write-not-verified");
    },
    async update(name, uid, id, data) {
      assertWritableCollection(name);
      const { c, ref, data: current } = await owned(name, uid, id);
      updateRecord(name, uid, id, data, current);
      assertOwner(c.auth, uid);
      const payload = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key, value === undefined ? c.store.deleteField() : value,
        ]),
      );
      await c.store.updateDoc(ref, payload);
      assertOwner(c.auth, uid);
      const snap = await c.store.getDoc(ref);
      assertOwner(c.auth, uid);
      if (
        !snap.exists() ||
        !validRecord(name, snap.data()) || snap.data().userId !== uid ||
        Object.entries(data).some(
          ([key, value]) =>
            value === undefined
              ? Object.hasOwn(snap.data(), key)
              : JSON.stringify(snap.data()[key]) !== JSON.stringify(value),
        )
      )
        throw new Error("write-not-verified");
    },
    async remove(name, uid, id) {
      const { c, ref } = await owned(name, uid, id);
      assertOwner(c.auth, uid);
      await c.store.deleteDoc(ref);
      assertOwner(c.auth, uid);
      const snap = await c.store.getDocs(
        c.store.query(
          c.store.collection(c.db, name),
          c.store.where("userId", "==", uid),
          c.store.where(c.store.documentId(), "==", id),
          // Keep query authorization: a point-only query checks missing resource data.
          c.store.where(c.store.documentId(), ">=", id),
        ),
      );
      assertOwner(c.auth, uid);
      if (snap.docs.length) throw new Error("delete-not-verified");
    },
  };
}
