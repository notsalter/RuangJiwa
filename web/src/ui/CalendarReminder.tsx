import { useState } from "preact/hooks";
import { calendarEvent, calendarUrl } from "../features/calendar";
import { Field } from "./shared";
export function CalendarReminder({
  scheduledAt,
  consultationId,
}: {
  scheduledAt?: string;
  consultationId?: string;
}) {
  const [when, setWhen] = useState(""),
    [href, setHref] = useState(""),
    [error, setError] = useState("");
  return (
    <section>
      <h2>Pengingat kalender</h2>
      <p>
        Unduh lalu impor ke aplikasi kalender. Aplikasi kalender mengelola
        alarm, RuangJiwa tidak mengirim notifikasi terjadwal. File berisi waktu
        dan judul umum, tanpa isi catatan.
      </p>
      {!scheduledAt && (
        <Field label="Waktu pengingat mood">
          <input
            type="datetime-local"
            value={when}
            required
            onInput={(e) => {
              setWhen(e.currentTarget.value);
              setHref("");
            }}
          />
        </Field>
      )}
      <button
        onClick={() => {
          try {
            const content = calendarEvent({
              id: consultationId ?? crypto.randomUUID(),
              title: consultationId ? "Konsultasi RuangJiwa" : "Catat mood",
              start: new Date(scheduledAt ?? when),
            });
            setHref(calendarUrl(content));
            setError("");
          } catch {
            setError("Pilih waktu mendatang yang valid.");
            setHref("");
          }
        }}
      >
        Siapkan kalender
      </button>
      {error && <p role="alert">{error}</p>}
      {href && (
        <div class="actions">
          <a download="ruangjiwa-reminder.ics" href={href}>
            Unduh pengingat .ics
          </a>
        </div>
      )}
    </section>
  );
}
