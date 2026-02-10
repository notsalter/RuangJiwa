import { db } from '@/services/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where } from 'firebase/firestore';
import type { Consultation } from '@/models/types';

const col = collection(db, 'consultations');

export async function listForUser(userId: string) {
  const q = query(col, where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Consultation[];
}

export async function create(data: Omit<Consultation, 'id'>) {
  const ref = await addDoc(col, data as any);
  const snap = await getDoc(doc(db, 'consultations', ref.id));
  return { id: ref.id, ...snap.data() } as Consultation;
}

export async function update(id: string, patch: Partial<Consultation>) {
  await updateDoc(doc(db, 'consultations', id), patch as any);
}
