import { useState } from "preact/hooks";
import { Session } from "../core/session";
import { useQuery } from "../core/hooks";
import { safePhotoUrl } from "../core/config";
import {
  consultationDraft,
  canCancel,
  statusLabel,
} from "../features/consultation";
import {
  Field,
  useAction,
  ActionFeedback,
  QueryFeedback,
  dateLabel,
} from "../ui/shared";
import { CalendarReminder } from "../ui/CalendarReminder";
export function ConsultationsPage({
  session,
  path: _path,
}: {
  session: Session;
  path?: string;
}) {
  const directory = useQuery(session, "psychologists"),
    query = useQuery(session, "consultations"),
    action = useAction();
  const [selected, setSelected] = useState(""),
    [when, setWhen] = useState(""),
    [notes, setNotes] = useState(""),
    [validation, setValidation] = useState(""),
    [cancel, setCancel] = useState("");
  const person = directory.items.find((p) => p.id === selected);
  return (
    <>
      <h1>Konsultasi</h1>
      <p>
        Pilih psikolog dari direktori dan ajukan waktu. Permintaan belum menjadi
        janji sampai dikonfirmasi oleh pengelola.
      </p>
      <a href="/quiz">Isi kuis refleksi</a>
      <section>
        <h2>Direktori psikolog</h2>
        <QueryFeedback
          query={directory}
          retry={() => void session.load("psychologists")}
          empty="Direktori belum berisi psikolog. Pengelola perlu menambahkan data di Firebase."
        />
        {directory.items.map((p) => (
          <article key={p.id}>
            <h3>{p.name}</h3>
            {p.specialization && <p>{p.specialization}</p>}
            <button
              onClick={() => {
                setSelected(p.id);
                setWhen("");
                setNotes("");
                setValidation("");
                action.clear();
              }}
            >
              Detail {p.name}
            </button>
          </article>
        ))}
      </section>
      {person && (
        <section aria-label="Detail psikolog">
          <h2>{person.name}</h2>
          {safePhotoUrl(person.photoUrl) && (
            <img
              src={safePhotoUrl(person.photoUrl)}
              alt={`Foto ${person.name}`}
              width="96"
              height="96"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          )}
          {person.specialization && <p>{person.specialization}</p>}
          {person.bio && <p>{person.bio}</p>}
          {typeof person.rating === "number" &&
            Number.isFinite(person.rating) && (
              <p>Rating dari direktori: {person.rating}</p>
            )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (
                !Number.isFinite(Date.parse(when)) ||
                Date.parse(when) <= Date.now()
              ) {
                setValidation("Pilih waktu mendatang yang valid.");
                return;
              }
              void action.run(
                () =>
                  session.create(
                    "consultations",
                    consultationDraft(person.id, when, notes),
                  ),
                "Permintaan dikirim. Tunggu konfirmasi pengelola.",
              );
            }}
          >
            <Field label="Waktu konsultasi yang diminta">
              <input
                type="datetime-local"
                required
                value={when}
                onInput={(e) => {
                  setWhen(e.currentTarget.value);
                  setValidation("");
                }}
              />
            </Field>
            <p>
              Waktu memakai zona waktu perangkatmu:{" "}
              {Intl.DateTimeFormat().resolvedOptions().timeZone}. Ini bukan
              informasi ketersediaan psikolog.
            </p>
            <Field label="Catatan untuk pengelola (opsional)">
              <textarea
                value={notes}
                maxLength={5000}
                onInput={(e) => setNotes(e.currentTarget.value)}
              />
            </Field>
            {validation && <p role="alert">{validation}</p>}
            <div class="actions">
              <button class="primary" disabled={action.busy}>
                Kirim permintaan
              </button>
              <button type="button" onClick={() => setSelected("")}>
                Tutup detail psikolog
              </button>
            </div>
          </form>
        </section>
      )}
      <ActionFeedback action={action} />
      <section>
        <h2>Permintaan dan jadwal saya</h2>
        <QueryFeedback
          query={query}
          retry={() => void session.load("consultations")}
          empty="Belum ada permintaan. Pilih psikolog dan waktu di atas."
        />
        {[...query.items]
          .sort(
            (a, b) =>
              Date.parse(b.scheduledAt ?? "") - Date.parse(a.scheduledAt ?? ""),
          )
          .map((item) => (
            <article key={item.id}>
              <h3>
                {directory.items.find((p) => p.id === item.psychologistId)
                  ?.name ?? "Nama psikolog belum tersedia"}
              </h3>
              <p>{dateLabel(item.scheduledAt)}</p>
              <p>{statusLabel(item.status)}</p>
              {item.notes && <p>{item.notes}</p>}
              {canCancel(item.status) && (
                <button
                  disabled={action.busy}
                  onClick={() => setCancel(item.id)}
                >
                  {item.status === "pending"
                    ? "Batalkan permintaan"
                    : "Batalkan jadwal"}
                </button>
              )}
              {cancel === item.id && (
                <div role="group" aria-label="Konfirmasi pembatalan">
                  <p>Batalkan permintaan atau jadwal ini?</p>
                  <div class="actions">
                    <button
                      disabled={action.busy}
                      onClick={() =>
                        void action.run(async () => {
                          const saved = await session.update(
                            "consultations",
                            item.id,
                            { status: "canceled" },
                          );
                          if (saved) setCancel("");
                          return saved;
                        }, "Dibatalkan.")
                      }
                    >
                      Ya, batalkan
                    </button>
                    <button onClick={() => setCancel("")}>
                      Tidak, pertahankan
                    </button>
                  </div>
                </div>
              )}
              {item.status === "confirmed" &&
                Date.parse(item.scheduledAt ?? "") > Date.now() && (
                  <CalendarReminder
                    scheduledAt={item.scheduledAt}
                    consultationId={item.id}
                  />
                )}
            </article>
          ))}
      </section>
    </>
  );
}
