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
const chartPoint = (
  value: number,
  index: number,
  count: number,
): [number, number] => [
  30 + (index * 280) / Math.max(1, count - 1),
  150 - value * 24,
];
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
    coords = series.map((x, i) => chartPoint(x.value, i, series.length)),
    points = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area = coords.length
    ? `${points} ${coords[coords.length - 1][0]},150 ${coords[0][0]},150`
    : "";
  return (
    <>
      <h1>Catat mood</h1>
      <p class="card__hint">
        Catatan berurutan untuk dirimu sendiri, bukan penilaian klinis.
      </p>
      <form
        class="card"
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
          <div class="mood-picker">
            {moodOptions.map((item) => (
              <label class="mood-option" key={item.value}>
                <input
                  type="radio"
                  name="mood"
                  value={item.value}
                  checked={mood === item.value}
                  onChange={() => setMood(item.value)}
                />
                <span class="mood-option__emoji" aria-hidden="true">
                  {item.emoji}
                </span>
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Catatan (opsional)">
          <textarea
            class="note-input"
            value={note}
            maxLength={formLimits.moodNote}
            onInput={(e) => {
              setNote(e.currentTarget.value);
              setValidation("");
            }}
          />
        </Field>
        {validation && <p role="alert">{validation}</p>}
        <div class="actions">
          <button class="primary" disabled={action.busy}>
            Simpan mood
          </button>
        </div>
      </form>
      <ActionFeedback action={action} />
      <section class="section">
        <div class="section-head">
          <h2>Riwayat mood</h2>
          {series.length > 0 && (
            <span class="badge">{series.length} catatan terakhir</span>
          )}
        </div>
        <QueryFeedback
          query={query}
          retry={() => void session.load("moods")}
          empty="Belum ada catatan. Simpan mood pertamamu di atas."
        />
        {series.length > 0 && (
          <figure class="chart">
            <svg
              role="img"
              aria-label="Pola mood dari 14 catatan terakhir, skala 1 sangat sedih hingga 5 sangat senang"
              viewBox="0 0 340 170"
              width="100%"
              height="170"
            >
              <defs>
                <linearGradient id="moodArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.28" />
                  <stop offset="100%" stop-color="#4f46e5" stop-opacity="0" />
                </linearGradient>
              </defs>
              {[5, 3, 1].map((value) => (
                <text
                  key={value}
                  x="6"
                  y={150 - value * 24 + 4}
                  font-size="10"
                  fill="#6d6b84"
                >
                  {value}
                </text>
              ))}
              {coords.length > 1 && (
                <text
                  x="310"
                  y="166"
                  font-size="10"
                  fill="#6d6b84"
                  text-anchor="end"
                >
                  {new Date(
                    series[series.length - 1].createdAt,
                  ).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}
                </text>
              )}
              {[30, 78, 126].map((y) => (
                <line
                  key={y}
                  x1="30"
                  y1={y}
                  x2="310"
                  y2={y}
                  stroke="#e7e5f1"
                  stroke-width="1"
                />
              ))}
              <line x1="30" y1="150" x2="310" y2="150" stroke="#d6d3e6" />
              {coords.length > 1 && (
                <polygon points={area} fill="url(#moodArea)" />
              )}
              <polyline
                points={points}
                fill="none"
                stroke="#4f46e5"
                stroke-width="3"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
              {series.map((x, i) => (
                <circle
                  key={x.id}
                  cx={coords[i][0]}
                  cy={coords[i][1]}
                  r="4"
                  fill="#ffffff"
                  stroke="#3730a3"
                  stroke-width="2.5"
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
            <article class="mood-item" key={item.id}>
              <span class="mood-item__emoji" aria-hidden="true">
                {moodOptions.find((m) => m.value === item.mood)?.emoji}
              </span>
              <p class="mood-item__label">
                {moodOptions.find((m) => m.value === item.mood)?.label}
              </p>
              {item.note && <p class="mood-item__note">{item.note}</p>}
              <p class="mood-item__date">{dateLabel(item.createdAt)}</p>
            </article>
          ))}
      </section>
      <CalendarReminder />
    </>
  );
}
