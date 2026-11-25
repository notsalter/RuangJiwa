export const quizzes = [
  {
    id: "stress",
    title: "Stres Harian",
    description:
      "Identifikasi tingkat stres yang kamu rasakan dalam beberapa hari terakhir.",
    questions: [
      "Seberapa sering kamu merasa kewalahan oleh tanggung jawab?",
      "Seberapa sering kamu mengalami gangguan tidur karena memikirkan masalah?",
      "Seberapa sering kamu merasa sulit berkonsentrasi?",
      "Seberapa sering kamu merasa mudah tersinggung?",
      "Seberapa sering kamu merasa lelah meskipun sudah beristirahat?",
    ],
  },
  {
    id: "anxiety",
    title: "Kecemasan",
    description: "Mengukur frekuensi gejala kecemasan yang kamu alami.",
    questions: [
      "Seberapa sering kamu merasa gelisah tanpa alasan yang jelas?",
      "Seberapa sering kamu merasakan detak jantung cepat karena khawatir?",
      "Seberapa sering kamu merasa sulit mengendalikan rasa khawatir?",
      "Seberapa sering kamu menghindari aktivitas karena takut sesuatu terjadi?",
      "Seberapa sering kamu mengalami ketegangan otot terkait kecemasan?",
    ],
  },
];
export const quizOptions = [
  "Tidak Pernah",
  "Jarang",
  "Sering",
  "Hampir Selalu",
];
export const quizCategories = {
  low: {
    title: "Rendah",
    description: "Pertahankan kebiasaan sehat dan dukungan sosial.",
  },
  moderate: {
    title: "Sedang",
    description: "Pertimbangkan strategi koping dan konsultasi lanjutan.",
  },
  high: {
    title: "Tinggi",
    description: "Diskusikan dengan profesional untuk dukungan lebih jauh.",
  },
};
export function scoreQuiz(id: string, answers: number[]) {
  if (
    !quizzes.some((q) => q.id === id) ||
    answers.length !== 5 ||
    answers.some((x) => !Number.isInteger(x) || x < 0 || x > 3)
  )
    throw new Error("invalid-answers");
  const score = answers.reduce((sum, value) => sum + value, 0),
    category = score <= 6 ? "low" : score <= 12 ? "moderate" : "high";
  return { score, category } as const;
}
