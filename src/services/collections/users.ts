import { db, storage } from '@/services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { UserProfile } from '@/models/types';

const USERS_COLLECTION = 'users';

export async function fetchUserProfile(userId: string): Promise<Partial<UserProfile> | null> {
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, userId));
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() as Record<string, unknown>;
  return {
    id: userId,
    name: typeof data.name === 'string' ? data.name : undefined,
    email: typeof data.email === 'string' ? data.email : undefined,
    photoUrl:
      typeof data.profileImageUrl === 'string'
        ? (data.profileImageUrl as string)
        : typeof data.photoUrl === 'string'
          ? (data.photoUrl as string)
          : undefined,
  };
}

export async function upsertUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) {
    payload.name = updates.name;
  }
  if (updates.email !== undefined) {
    payload.email = updates.email;
  }
  if (updates.photoUrl !== undefined) {
    payload.profileImageUrl = updates.photoUrl;
  }

  if (Object.keys(payload).length === 0) {
    return;
  }

  await setDoc(doc(db, USERS_COLLECTION, userId), payload, { merge: true });
}

export async function uploadProfileImage(userId: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const storageRef = ref(storage, `profile_images/${userId}/${Date.now()}.jpg`);
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  return url;
}
