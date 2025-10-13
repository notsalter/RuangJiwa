import { db } from '@/services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Psychologist } from '@/models/types';

const col = collection(db, 'psychologists');

export async function list(): Promise<Psychologist[]> {
  const snap = await getDocs(col);
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
}
