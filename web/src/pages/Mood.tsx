import { useState } from "preact/hooks";
import { Session } from "../core/session";
import { useQuery } from "../core/hooks";
import type { Mood } from "../core/types";
import { moodDraft, moodOptions, moodSeries } from "../features/mood";
import {
  Field,
  useAction,
  ActionFeedback,
  QueryFeedback,
  dateLabel,
} from "../ui/shared";
import { CalendarReminder } from "../ui/CalendarReminder";
import { formLimits, noteFormError } from "../ui/forms";
export function MoodPage({
  session,
  path: _path,
}: {
  session: Session;
  path?: string;
}) {
  const query = useQuery(session, "moods"),
    [mood, setMood] = useState<Mood>("neutral"),
    [note, setNote] = useState(""),
    [validation, setValidation] = useState(""),
    action = useAction();
  const series = moodSeries(query.items),
    points = series
      .map(
        (x, i) =>
          `${30 + (i * 280) / Math.max(1, series.length - 1)},${150 - x.value * 24}`,
      )
      .join(" ");
  return (
    <>
      <h1>Catat mood</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const error = noteFormError(note, "mood");
          if (error) {
            setValidation(error);
            return;
          }
          void action.run(async () => {
            const saved = await session.create(
              "moods",
              moodDraft(mood, note, new Date()),
            );
            if (saved) setNote("");
            return saved;
          });
        }}
      >
        <fieldset>
          <legend>Apa yang kamu rasakan?</legend>
          {moodOptions.map((item) => (
            <label class="choice" key={item.value}>
              <input
                type="radio"
                name="mood"
                value={item.value}
                checked={mood === item.value}
                onChange={() => setMood(item.value)}
              />
              <span aria-hidden="true">{item.emoji}</span>
              {item.label}
            </label>
          ))}
        </fieldset>
        <Field label="Catatan (opsional)">
          <textarea
            value={note}
            maxLength={formLimits.moodNote}
            onInput={(e) => {
              setNote(e.currentTarget.value);
              setValidation("");
            }}
          />
        </Field>
        {validation && <p role="alert">{validation}</p>}
        <button class="primary" disabled={action.busy}>
          Simpan mood
        </button>
      </form>
      <ActionFeedback action={action} />
      <section>
        <h2>Riwayat mood</h2>
        <QueryFeedback
          query={query}
          retry={() => void session.load("moods")}
          empty="Belum ada catatan. Simpan mood pertamamu di atas."
        />
        {series.length > 0 && (
          <figure>
            <svg
              role="img"
              aria-label="Pola mood dari 14 catatan terakhir, skala 1 sangat sedih hingga 5 sangat senang"
              viewBox="0 0 340 160"
              width="100%"
              height="160"
            >
              <line x1="30" y1="126" x2="310" y2="126" stroke="#6b6b83" />
              <polyline
                points={points}
                fill="none"
                stroke="#4f46e5"
                stroke-width="3"
              />
              {series.map((x, i) => (
                <circle
                  key={x.id}
                  cx={30 + (i * 280) / Math.max(1, series.length - 1)}
                  cy={150 - x.value * 24}
                  r="4"
                  fill="#3730a3"
                />
              ))}
            </svg>
            <figcaption>
              Catatan berurutan, bukan ukuran klinis. Skala 1 sangat sedih, 5
              sangat senang. Nilai lengkap ada di riwayat.
            </figcaption>
          </figure>
        )}
        {[...query.items]
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
          .map((item) => (
            <article key={item.id}>
              <p>
                <span aria-hidden="true">
                  {moodOptions.find((m) => m.value === item.mood)?.emoji}
                </span>{" "}
                {moodOptions.find((m) => m.value === item.mood)?.label}
              </p>
              {item.note && <p>{item.note}</p>}
              <p>{dateLabel(item.createdAt)}</p>
            </article>
          ))}
      </section>
      <CalendarReminder />
    </>
  );
}
