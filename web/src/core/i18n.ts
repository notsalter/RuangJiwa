const labels = { home: ['Beranda', 'Home'], mood: ['Mood', 'Mood'], journal: ['Jurnal', 'Journal'], consultation: ['Konsultasi', 'Consultations'], profile: ['Profil', 'Profile'], quiz: ['Kuis', 'Quizzes'] } as const;
export function translate(key: keyof typeof labels, locale: string) { return labels[key][locale.startsWith('en') ? 1 : 0]; }
