import type { RecommendationItem } from '@/models/types';

const recommendations: RecommendationItem[] = [
  {
    id: 'meditation',
    title: 'Meditasi untuk Menenangkan Pikiran',
    subtitle: '10 menit • Relaksasi',
    type: 'audio',
    imageUrl: 'https://images.unsplash.com/photo-1523978591478-c753949ff840?auto=format&fit=crop&w=640&q=80',
  },
  {
    id: 'journal',
    title: 'Refleksi Diri: Mengatasi Kesedihan',
    subtitle: '5 menit • Reflektif',
    type: 'journal',
    imageUrl: 'https://images.unsplash.com/photo-1498079022511-d15614cb1c02?auto=format&fit=crop&w=640&q=80',
  },
  {
    id: 'psychologist',
    title: 'Dr. Budi Santoso, M.Psi',
    subtitle: 'Spesialis Depresi & Kecemasan',
    type: 'psychologist',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=640&q=80',
  },
  {
    id: 'article',
    title: 'Teknik Pernapasan untuk Mengurangi Kecemasan',
    subtitle: 'Artikel • 8 menit baca',
    type: 'article',
    imageUrl: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=640&q=80',
  },
];

export function getRecommendations(): Promise<RecommendationItem[]> {
  return Promise.resolve(recommendations);
}
