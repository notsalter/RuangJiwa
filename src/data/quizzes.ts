export interface QuizOption {
  id: string;
  label: string;
  value: number;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
}

export interface QuizCategory {
  id: 'low' | 'moderate' | 'high';
  title: string;
  description: string;
  min: number;
  max: number;
}

export interface QuizDefinition {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  categories: QuizCategory[];
}

const baseOptions: QuizOption[] = [
  { id: 'never', label: 'Tidak Pernah', value: 0 },
  { id: 'rarely', label: 'Jarang', value: 1 },
  { id: 'often', label: 'Sering', value: 2 },
  { id: 'always', label: 'Hampir Selalu', value: 3 },
];

const defaultCategories: QuizCategory[] = [
  {
    id: 'low',
    title: 'Rendah',
    description: 'Gejala berada pada tingkat minimal. Pertahankan kebiasaan sehat dan dukungan sosial.',
    min: 0,
    max: 6,
  },
  {
    id: 'moderate',
    title: 'Sedang',
    description: 'Beberapa gejala muncul secara konsisten. Pertimbangkan strategi koping dan konsultasi lanjutan.',
    min: 7,
    max: 12,
  },
  {
    id: 'high',
    title: 'Tinggi',
    description: 'Gejala signifikan memengaruhi keseharian. Diskusikan dengan profesional untuk dukungan lebih jauh.',
    min: 13,
    max: 100,
  },
];

export const quizzes: QuizDefinition[] = [
  {
    id: 'stress',
    title: 'Stres Harian',
    description: 'Identifikasi tingkat stres yang kamu rasakan dalam beberapa hari terakhir.',
    questions: [
      {
        id: 'stress_q1',
        prompt: 'Seberapa sering kamu merasa kewalahan oleh tanggung jawab?',
        options: baseOptions,
      },
      {
        id: 'stress_q2',
        prompt: 'Seberapa sering kamu mengalami gangguan tidur karena memikirkan masalah?',
        options: baseOptions,
      },
      {
        id: 'stress_q3',
        prompt: 'Seberapa sering kamu merasa sulit berkonsentrasi?',
        options: baseOptions,
      },
      {
        id: 'stress_q4',
        prompt: 'Seberapa sering kamu merasa mudah tersinggung?',
        options: baseOptions,
      },
      {
        id: 'stress_q5',
        prompt: 'Seberapa sering kamu merasa lelah meskipun sudah beristirahat?',
        options: baseOptions,
      },
    ],
    categories: defaultCategories,
  },
  {
    id: 'anxiety',
    title: 'Kecemasan',
    description: 'Mengukur frekuensi gejala kecemasan yang kamu alami.',
    questions: [
      {
        id: 'anxiety_q1',
        prompt: 'Seberapa sering kamu merasa gelisah tanpa alasan yang jelas?',
        options: baseOptions,
      },
      {
        id: 'anxiety_q2',
        prompt: 'Seberapa sering kamu merasakan detak jantung cepat karena khawatir?',
        options: baseOptions,
      },
      {
        id: 'anxiety_q3',
        prompt: 'Seberapa sering kamu merasa sulit mengendalikan rasa khawatir?',
        options: baseOptions,
      },
      {
        id: 'anxiety_q4',
        prompt: 'Seberapa sering kamu menghindari aktivitas karena takut sesuatu terjadi?',
        options: baseOptions,
      },
      {
        id: 'anxiety_q5',
        prompt: 'Seberapa sering kamu mengalami ketegangan otot terkait kecemasan?',
        options: baseOptions,
      },
    ],
    categories: defaultCategories,
  },
];

export function getQuizDefinition(id: string): QuizDefinition | undefined {
  return quizzes.find(quiz => quiz.id === id);
}

export function calculateScore(values: number[]): number {
  return values.reduce((total, current) => total + current, 0);
}

export function resolveCategory(score: number, categories: QuizCategory[]): QuizCategory {
  const category = categories.find(item => score >= item.min && score <= item.max);
  if (category) {
    return category;
  }
  return categories[categories.length - 1];
}
