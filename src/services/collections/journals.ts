import { db } from '@/services/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { JournalEntry } from '@/models/types';

const col = collection(db, 'journals');

export async function listForUser(userId: string): Promise<JournalEntry[]> {
  const q = query(col, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
}

export async function getById(id: string): Promise<JournalEntry | undefined> {
  const ref = doc(db, 'journals', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return undefined;
  }
  return { id: snap.id, ...snap.data() } as JournalEntry;
}

export async function create(entry: Omit<JournalEntry, 'id'>): Promise<JournalEntry> {
  const ref = await addDoc(col, entry as any);
  return { id: ref.id, ...entry } as JournalEntry;
}

export async function update(id: string, patch: Partial<JournalEntry>) {
  await updateDoc(doc(db, 'journals', id), patch as any);
}

export async function remove(id: string) {
  await deleteDoc(doc(db, 'journals', id));
}
