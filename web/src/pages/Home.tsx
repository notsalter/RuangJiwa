import type { ComponentChildren } from "preact";
import { appHref } from "../core/navigation";
import { moodOptions } from "../features/mood";
import { Session } from "../core/session";
import { useQuery, useSession } from "../core/hooks";
import { greeting, latestMood, nextConsultation } from "../core/home";
import { QueryFeedback, dateLabel } from "../ui/shared";
import {
  BreathIcon,
  ChartIcon,
  ConsultationIcon,
  MoodIcon,
  PencilIcon,
} from "../ui/icons";
function Shortcut({
  href,
  label,
  hint,
  icon,
}: {
  href: string;
  label: string;
  hint: string;
  icon: ComponentChildren;
}) {
  const id = `shortcut-${href.replace(/[^a-z]/gi, "") || "home"}`;
  return (
    <a class="action-card" href={href} aria-labelledby={id}>
      {icon}
      <span class="action-card__label" id={id}>
        {label}
      </span>
      <span class="action-card__hint">{hint}</span>
    </a>
  );
}
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
    next = nextConsultation(consultations.items, Date.now()),
    moodOption = moodOptions.find((m) => m.value === mood?.mood),
    today = new Date();
  return (
    <>
      <section class="hero">
        <p class="hero__date">
          {today.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <p class="hero__greeting">
          {greeting(today.getHours())}
          {state.profile?.name ? `, ${state.profile.name}` : ""}
        </p>
        <h1>Apa kabar hari ini?</h1>
      </section>
      <div class="action-grid">
        <Shortcut
          href={appHref("/mood")}
          label="Catat mood"
          hint="Perasaan hari ini"
          icon={<MoodIcon />}
        />
        <Shortcut
          href={appHref("/journal")}
          label="Tulis jurnal"
          hint="Refleksi singkat"
          icon={<PencilIcon />}
        />
        <Shortcut
          href={appHref("/consultations")}
          label="Lihat psikolog"
          hint="Cari dukungan"
          icon={<ConsultationIcon />}
        />
      </div>
      <section class="focal">
        <h2>Ruang untuk berhenti sejenak</h2>
        <p>
          Perhatikan perasaanmu tanpa harus menghakiminya. Bila terasa berat,
          hubungi orang yang kamu percaya.
        </p>
        <a class="focal__cta" href="#latihan">
          Lihat latihan singkat
        </a>
      </section>
      <div class="grid grid--halves">
        <section class="card section">
          <div class="section-head">
            <h2>Mood terakhir</h2>
            <a href={appHref("/mood")}>Lihat riwayat</a>
          </div>
          <QueryFeedback
            query={moods}
            retry={() => void session.load("moods")}
            empty="Belum ada catatan mood."
          />
          {mood && (
            <div class="mood-hero">
              <span class="mood-hero__emoji" aria-hidden="true">
                {moodOption?.emoji}
              </span>
              <div>
                <p class="mood-hero__label">{moodOption?.label}</p>
                {mood.note && <p class="mood-item__note">{mood.note}</p>}
                <p class="mood-hero__meta">{dateLabel(mood.createdAt)}</p>
              </div>
            </div>
          )}
        </section>
        <section class="card section">
          <div class="section-head">
            <h2>Konsultasi berikutnya</h2>
            <a href={appHref("/consultations")}>Lihat semua</a>
          </div>
          <QueryFeedback
            query={consultations}
            retry={() => void session.load("consultations")}
            empty="Belum ada permintaan konsultasi."
          />
          {next ? (
            <>
              <p class="mood-hero__label">{dateLabel(next.scheduledAt)}</p>
              <p>
                {psychologists.items.find((p) => p.id === next.psychologistId)
                  ?.name ?? "Nama psikolog belum tersedia"}
              </p>
              <span class="badge">
                {next.status === "pending"
                  ? "Menunggu konfirmasi"
                  : "Terkonfirmasi"}
              </span>
              <p class="card__hint">
                {next.status === "pending"
                  ? "Permintaan menunggu konfirmasi, bukan janji terkonfirmasi."
                  : "Jadwal terkonfirmasi."}
              </p>
            </>
          ) : (
            consultations.items.length > 0 && (
              <p class="card__hint">Tidak ada jadwal mendatang yang aktif.</p>
            )
          )}
        </section>
      </div>
      <section class="card section" id="latihan">
        <div class="row">
          <span class="badge">
            <BreathIcon />
            Latihan
          </span>
          <span class="badge">
            <ChartIcon />
            Tanpa audio
          </span>
        </div>
        <h2>Latihan singkat</h2>
        <p>
          Duduk senyaman mungkin. Bernapas perlahan tanpa memaksakan napas.
          Berhenti jika terasa tidak nyaman.
        </p>
        <p class="card__hint">
          Ini latihan mandiri, bukan layanan audio atau pengganti perawatan
          profesional.
        </p>
      </section>
    </>
  );
}
