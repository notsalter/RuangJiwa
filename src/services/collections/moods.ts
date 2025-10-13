import { db } from '@/services/firebase';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { MoodEntry } from '@/models/types';

const col = collection(db, 'moods');

export async function listForUser(userId: string): Promise<MoodEntry[]> {
  const q = query(col, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
}

export async function create(entry: Omit<MoodEntry, 'id'>) {
  await addDoc(col, entry as any);
}
