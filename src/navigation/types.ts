export type AuthStackParamList = {
  SignIn: undefined;
  Register: undefined;
};

export type ConsultationStackParamList = {
  ConsultationList: undefined;
  ConsultationBooking: { psychologistId: string; psychologistName?: string } | undefined;
  PsychologistDetail: { psychologist: unknown } | undefined;
  MyConsultations: undefined;
  QuizHome: undefined;
  QuizTake: { quizId: string } | undefined;
  QuizResult: { result: unknown } | undefined;
  QuizHistory: undefined;
};

export type MoodStackParamList = {
  MoodHome: undefined;
  MoodEntryNew: undefined;
  MoodHistory: undefined;
};

export type JournalStackParamList = {
  JournalHome: undefined;
  JournalEntryNew: undefined;
  JournalEntryDetail: { entryId: string } | undefined;
  JournalEntryEdit: { entryId: string } | undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  ProfileEdit: undefined;
};
