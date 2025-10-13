import { db } from '@/services/firebase';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { QuizHistory } from '@/models/types';

const col = collection(db, 'quizHistory');

export async function listForUser(userId: string): Promise<QuizHistory[]> {
  const q = query(col, where('userId', '==', userId), orderBy('takenAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
}

export async function add(result: Omit<QuizHistory, 'id'>) {
  await addDoc(col, result as any);
}
