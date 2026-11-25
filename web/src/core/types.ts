export type Mood = "very_sad" | "sad" | "neutral" | "happy" | "very_happy";
export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}
export interface Profile {
  id: string;
  name?: string;
  email?: string;
  photoUrl?: string;
}
export interface MoodEntry {
  id: string;
  userId: string;
  mood: Mood;
  note?: string;
  createdAt: string;
}
export interface Journal {
  id: string;
  userId: string;
  title?: string;
  content: string;
  mood?: Mood;
  prompt?: string;
  tags?: string[];
  isFavorite?: boolean;
  createdAt: string;
}
export interface QuizResult {
  id: string;
  userId: string;
  quizType: string;
  score: number;
  category: string;
  takenAt: string;
}
export interface Psychologist {
  id: string;
  name: string;
  specialization?: string;
  bio?: string;
  photoUrl?: string;
  rating?: number;
}
export interface Consultation {
  id: string;
  userId: string;
  psychologistId: string;
  status: "pending" | "confirmed" | "completed" | "canceled";
  scheduledAt?: string;
  notes?: string;
}
export interface Collections {
  moods: MoodEntry;
  journals: Journal;
  quizHistory: QuizResult;
  psychologists: Psychologist;
  consultations: Consultation;
}
export type Collection = keyof Collections;
export type PrivateCollection = Exclude<Collection, "psychologists">;
export interface Backend {
  observe(
    callback: (user: User | null) => void,
    onError: (error: unknown) => void,
  ): () => void;
  login(email: string, password: string, register: boolean): Promise<void>;
  logout(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  profile(uid: string): Promise<Profile | null>;
  saveProfile(uid: string, name: string, photo?: File): Promise<void>;
  list<K extends Collection>(name: K, uid: string): Promise<Collections[K][]>;
  create(
    name: PrivateCollection,
    uid: string,
    data: Record<string, unknown>,
  ): Promise<void>;
  update(
    name: PrivateCollection,
    uid: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<void>;
  remove(name: "journals", uid: string, id: string): Promise<void>;
}
export interface QueryState<T> {
  items: T[];
  loading: boolean;
  error?: string;
}
export interface State {
  user: User | null;
  profile: Profile | null;
  ready: boolean;
  error?: string;
  data: { [K in Collection]?: QueryState<Collections[K]> };
}
