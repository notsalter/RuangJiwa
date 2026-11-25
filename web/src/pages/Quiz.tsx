import { useState } from "preact/hooks";
import { Session } from "../core/session";
import { useQuery } from "../core/hooks";
import {
  quizzes,
  quizOptions,
  quizCategories,
  scoreQuiz,
} from "../features/quiz";
import {
  useAction,
  ActionFeedback,
  QueryFeedback,
  dateLabel,
} from "../ui/shared";
export function QuizPage({
  session,
  path: _path,
}: {
  session: Session;
  path?: string;
}) {
  const query = useQuery(session, "quizHistory"),
    action = useAction(),
    [quizId, setQuiz] = useState(""),
    [answers, setAnswers] = useState<number[]>([]),
    [validation, setValidation] = useState(""),
    [result, setResult] = useState<ReturnType<typeof scoreQuiz> | null>(null);
  const quiz = quizzes.find((q) => q.id === quizId);
  return (
    <>
      <h1>Kuis refleksi</h1>
      <p>
        Kuis informal lima pertanyaan, bukan diagnosis atau alat skrining klinis
        tervalidasi. Hasil membantu refleksi, bukan keputusan medis.
      </p>
      {!quiz &&
        quizzes.map((q) => (
          <section key={q.id}>
            <h2>{q.title}</h2>
            <p>{q.description}</p>
            <button
              onClick={() => {
                setQuiz(q.id);
                setAnswers(Array(5).fill(-1));
                setResult(null);
                setValidation("");
                action.clear();
              }}
            >
              Isi {q.title}
            </button>
          </section>
        ))}
      {quiz && (
        <section>
          <h2>{quiz.title}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (answers.some((x) => x < 0) || answers.length !== 5) {
                setValidation(
                  "Jawab semua pertanyaan sebelum menyimpan hasil.",
                );
                return;
              }
              void action.run(async () => {
                const scored = scoreQuiz(quiz.id, answers);
                const saved = await session.create("quizHistory", {
                  quizType: quiz.id,
                  ...scored,
                  takenAt: new Date().toISOString(),
                });
                if (saved) setResult(scored);
                return saved;
              });
            }}
          >
            {quiz.questions.map((question, i) => (
              <fieldset key={question}>
                <legend>
                  {i + 1}. {question}
                </legend>
                {quizOptions.map((option, value) => (
                  <label class="choice" key={value}>
                    <input
                      type="radio"
                      name={`question-${i}`}
                      required
                      checked={answers[i] === value}
                      onChange={() => {
                        const updated = [...answers];
                        updated[i] = value;
                        setAnswers(updated);
                        setValidation("");
                        setResult(null);
                      }}
                    />
                    {option}
                  </label>
                ))}
              </fieldset>
            ))}
            {validation && <p role="alert">{validation}</p>}
            <div class="actions">
              <button class="primary" disabled={action.busy || !!result}>
                Simpan hasil kuis
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuiz("");
                  setResult(null);
                  action.clear();
                }}
              >
                Kembali ke pilihan kuis
              </button>
            </div>
          </form>
          {result && (
            <section aria-label="Hasil kuis">
              <h3>
                {quizCategories[result.category].title}: {result.score} / 15
              </h3>
              <p>{quizCategories[result.category].description}</p>
              <a href="/consultations">Lihat psikolog</a>
            </section>
          )}
        </section>
      )}
      <ActionFeedback action={action} />
      <section>
        <h2>Riwayat kuis</h2>
        <QueryFeedback
          query={query}
          retry={() => void session.load("quizHistory")}
          empty="Belum ada hasil tersimpan. Isi salah satu kuis di atas."
        />
        {[...query.items]
          .sort((a, b) => Date.parse(b.takenAt) - Date.parse(a.takenAt))
          .map((item) => (
            <article key={item.id}>
              <p>
                {quizzes.find((q) => q.id === item.quizType)?.title ??
                  item.quizType}
                : {item.score} / 15 ·{" "}
                {quizCategories[item.category as keyof typeof quizCategories]
                  ?.title ?? item.category}
              </p>
              <p>{dateLabel(item.takenAt)}</p>
            </article>
          ))}
      </section>
    </>
  );
}
