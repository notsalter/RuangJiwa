import { db } from '@/services/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where } from 'firebase/firestore';

export interface Consultation {
  id?: string;
  userId: string;
  psychologistId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  scheduledAt?: string;
  notes?: string;
}

const col = collection(db, 'consultations');

export async function listForUser(userId: string) {
  const q = query(col, where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Consultation[];
}

export async function create(data: Consultation) {
  const { id, ...payload } = data;
  const ref = await addDoc(col, payload);
  const snap = await getDoc(doc(db, 'consultations', ref.id));
  return { id: ref.id, ...snap.data() } as Consultation;
}

export async function update(id: string, patch: Partial<Consultation>) {
  await updateDoc(doc(db, 'consultations', id), patch as any);
}
