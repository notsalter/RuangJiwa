export type TimestampISO = string;

export interface Psychologist {
  id: string;
  name: string;
  specialization?: string;
  photoUrl?: string;
  rating?: number;
  bio?: string;
}

export interface Consultation {
  id: string;
  userId: string;
  psychologistId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  scheduledAt?: TimestampISO;
  notes?: string;
}

export interface QuizHistory {
  id: string;
  userId: string;
  quizType: string;
  score: number;
  category: string;
  takenAt: TimestampISO;
}

export interface MoodEntry {
  id: string;
  userId: string;
  mood: 'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy';
  note?: string;
  createdAt: TimestampISO;
}
