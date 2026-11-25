import { moodOptions } from "../features/mood";
import { Session } from "../core/session";
import { useQuery, useSession } from "../core/hooks";
import { greeting, latestMood, nextConsultation } from "../core/home";
import { QueryFeedback, dateLabel } from "../ui/shared";
export function Home({
  session,
  path: _path,
}: {
  session: Session;
  path?: string;
}) {
  const state = useSession(session),
    moods = useQuery(session, "moods"),
    consultations = useQuery(session, "consultations"),
    psychologists = useQuery(session, "psychologists");
  const mood = latestMood(moods.items),
    next = nextConsultation(consultations.items, Date.now());
  return (
    <>
      <p>
        {greeting(new Date().getHours())}
        {state.profile?.name ? `, ${state.profile.name}` : ""}
      </p>
      <h1>Apa kabar hari ini?</h1>
      <div class="actions">
        <a href="/mood">Catat mood</a>
        <a href="/journal">Tulis jurnal</a>
        <a href="/consultations">Lihat psikolog</a>
      </div>
      <section class="focal">
        <h2>Ruang untuk berhenti sejenak</h2>
        <p>
          Perhatikan perasaanmu tanpa harus menghakiminya. Bila terasa berat,
          hubungi orang yang kamu percaya.
        </p>
      </section>
      <section>
        <h2>Mood terakhir</h2>
        <QueryFeedback
          query={moods}
          retry={() => void session.load("moods")}
          empty="Belum ada catatan mood."
        />
        {mood && (
          <>
            <p>
              {moodOptions.find((m) => m.value === mood.mood)?.emoji}{" "}
              {moodOptions.find((m) => m.value === mood.mood)?.label}
            </p>
            {mood.note && <p>{mood.note}</p>}
            <p>{dateLabel(mood.createdAt)}</p>
          </>
        )}
      </section>
      <section>
        <h2>Konsultasi berikutnya</h2>
        <QueryFeedback
          query={consultations}
          retry={() => void session.load("consultations")}
          empty="Belum ada permintaan konsultasi."
        />
        {next ? (
          <>
            <p>{dateLabel(next.scheduledAt)}</p>
            <p>
              {psychologists.items.find((p) => p.id === next.psychologistId)
                ?.name ?? "Nama psikolog belum tersedia"}
            </p>
            <p>
              {next.status === "pending"
                ? "Permintaan menunggu konfirmasi, bukan janji terkonfirmasi."
                : "Jadwal terkonfirmasi."}
            </p>
          </>
        ) : (
          consultations.items.length > 0 && (
            <p>Tidak ada jadwal mendatang yang aktif.</p>
          )
        )}
      </section>
      <section>
        <h2>Latihan singkat</h2>
        <p>
          Duduk senyaman mungkin. Bernapas perlahan tanpa memaksakan napas.
          Berhenti jika terasa tidak nyaman.
        </p>
        <p>
          Ini latihan mandiri, bukan layanan audio atau pengganti perawatan
          profesional.
        </p>
      </section>
    </>
  );
}
