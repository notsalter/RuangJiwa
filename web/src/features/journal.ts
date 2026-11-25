import type { Mood } from '../core/types';
import { moodOptions } from './mood';
export const journalPrompts = [
  'Apa tiga hal kecil yang membuatmu tersenyum hari ini? Jelaskan mengapa itu berarti.',
  'Tuliskan satu tantangan yang kamu hadapi minggu ini dan bagaimana kamu mengatasinya.',
  'Siapa orang yang membuatmu merasa dihargai akhir-akhir ini? Apa yang mereka lakukan?',
  'Apa perasaan dominan yang kamu rasakan hari ini? Jelaskan asalnya.',
  'Tuliskan pesan penyemangat untuk dirimu di masa depan ketika hari terasa berat.',
  'Apa kebiasaan sehat yang ingin kamu pertahankan bulan ini? Mengapa itu penting?',
  'Ceritakan momen ketika kamu merasa bangga terhadap dirimu sendiri.',
];
export interface JournalDraft { title?: string; content: string; mood?: string; prompt?: string; tags?: string; isFavorite?: boolean }
export function journalDraft(input: JournalDraft, now: Date) {
  if (input.content.trim().length < 10) throw new Error('minimum-10-characters');
  if (input.mood && !moodOptions.some(m => m.value === input.mood)) throw new Error('invalid-mood');
  return { title: input.title?.trim() ?? '', content: input.content.trim(), mood: input.mood ? input.mood as Mood : undefined, prompt: input.prompt ?? '', tags: [...new Set((input.tags ?? '').split(',').map(t => t.trim()).filter(Boolean))], isFavorite: input.isFavorite ?? false, createdAt: now.toISOString() };
}
export function filterJournals<T extends { content: string; title?: string; tags?: string[]; isFavorite?: boolean; createdAt: string }>(items: T[], search: string, favorites: boolean) {
  return [...items].filter(x => (!favorites || x.isFavorite) && `${x.title ?? ''} ${x.content} ${(x.tags ?? []).join(' ')}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
