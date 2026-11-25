import { useEffect, useLayoutEffect, useState } from "preact/hooks";
import { Session } from "./core/session";
import { createBackend } from "./services/firebase";
import { useSession } from "./core/hooks";
import { translate } from "./core/i18n";
import { appHref, relativePath } from "./core/navigation";
import { Auth } from "./pages/Auth";
import { Home } from "./pages/Home";
import { MoodPage } from "./pages/Mood";
import { JournalPage } from "./pages/Journal";
import { QuizPage } from "./pages/Quiz";
import { ConsultationsPage } from "./pages/Consultations";
import { ProfilePage } from "./pages/Profile";
import { PwaControls } from "./pwa/PwaControls";
const defaultSession = new Session(createBackend(import.meta.env));
const discardMessage =
  "Jurnal belum disimpan. Tinggalkan halaman dan buang perubahan?";
export function App({ session = defaultSession }: { session?: Session }) {
  const state = useSession(session),
    [online, setOnline] = useState(navigator.onLine),
    [locale, setLocale] = useState("id"),
    [url, setUrl] = useState(
      location.pathname + location.search + location.hash,
    ),
    [journalDirty, setJournalDirty] = useState(false);
  const path = relativePath(url);
  useEffect(() => {
    session.setOnline(navigator.onLine);
    return session.start();
  }, [session]);
  useEffect(() => {
    const change = () => {
      setOnline(navigator.onLine);
      session.setOnline(navigator.onLine);
      if (navigator.onLine && journalDirty) void session.load("journals");
    };
    window.addEventListener("online", change);
    window.addEventListener("offline", change);
    return () => {
      window.removeEventListener("online", change);
      window.removeEventListener("offline", change);
    };
  }, [session, journalDirty]);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = "RuangJiwa | Catatan dan refleksi";
  }, [locale]);
  useLayoutEffect(() => {
    const allow = (next: string) =>
      !journalDirty ||
      relativePath(next) === path ||
      window.confirm(discardMessage);
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (
        !link ||
        link.hasAttribute("download") ||
        link.hasAttribute("data-native") ||
        (link.getAttribute("target") && link.getAttribute("target") !== "_self")
      )
        return;
      const href = link.getAttribute("href")!;
      if (!href.startsWith("/") || href.startsWith("//")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!allow(href)) return;
      history.pushState({}, "", href);
      setUrl(href);
      document.getElementById("content")?.focus();
    };
    const pop = (event: PopStateEvent) => {
      event.stopImmediatePropagation();
      const next = location.pathname + location.search + location.hash;
      if (!allow(next)) history.replaceState({}, "", url);
      else {
        setUrl(next);
        document.getElementById("content")?.focus();
      }
    };
    // Own route transitions so no delegated router can unmount a dirty editor.
    window.addEventListener("click", click, true);
    window.addEventListener("popstate", pop, true);
    return () => {
      window.removeEventListener("click", click, true);
      window.removeEventListener("popstate", pop, true);
    };
  }, [journalDirty, path, url]);
  return (
    <>
      <a class="skip" href="#content">
        Langsung ke isi
      </a>
      <header>
        <span class="brand">RuangJiwa</span>
        <div class="actions">
          <label>
            Bahasa{" "}
            <select
              value={locale}
              onChange={(e) => setLocale(e.currentTarget.value)}
            >
              <option value="id">Indonesia</option>
              <option value="en">English (navigation)</option>
            </select>
          </label>
          {state.user && (
            <button
              onClick={() => {
                if (!journalDirty || window.confirm(discardMessage))
                  void session.logout();
              }}
            >
              Keluar
            </button>
          )}
        </div>
      </header>
      <PwaControls hasUnsavedChanges={journalDirty} />
      <main id="content" class="page" tabIndex={-1}>
        {state.error && <p role="alert">{state.error}</p>}
        {!state.ready ? (
          <p role="status">Memeriksa sesi...</p>
        ) : !state.user ? (
          <Auth session={session} />
        ) : !online ? (
          <section>
            <h1>Kamu sedang offline</h1>
            <p>
              Catatan pribadi tidak tersedia offline. Sambungkan internet untuk
              mengaksesnya. Tidak ada catatan yang disimpan oleh service worker.
            </p>
          </section>
        ) : null}
        {state.ready &&
          state.user &&
          (online || (path === "/journal" && journalDirty)) && (
            <div hidden={!online} key={`${state.user.uid}:${path}`}>
              {path === "/" ? (
                <Home session={session} />
              ) : path === "/mood" ? (
                <MoodPage session={session} />
              ) : path === "/journal" ? (
                <JournalPage
                  session={session}
                  onDirtyChange={setJournalDirty}
                />
              ) : path === "/quiz" ? (
                <QuizPage session={session} />
              ) : path === "/consultations" ? (
                <ConsultationsPage session={session} />
              ) : path === "/profile" ? (
                <ProfilePage session={session} />
              ) : (
                <NotFound />
              )}
            </div>
          )}
      </main>
      {state.user && online && (
        <nav aria-label="Navigasi utama">
          <a
            href={appHref("/")}
            aria-current={path === "/" ? "page" : undefined}
          >
            {translate("home", locale)}
          </a>
          <a
            href={appHref("/mood")}
            aria-current={path === "/mood" ? "page" : undefined}
          >
            {translate("mood", locale)}
          </a>
          <a
            href={appHref("/journal")}
            aria-current={path === "/journal" ? "page" : undefined}
          >
            {translate("journal", locale)}
          </a>
          <a
            href={appHref("/consultations")}
            aria-current={
              path !== null && ["/consultations", "/quiz"].includes(path)
                ? "page"
                : undefined
            }
          >
            {translate("consultation", locale)}
          </a>
          <a
            href={appHref("/profile")}
            aria-current={path === "/profile" ? "page" : undefined}
          >
            {translate("profile", locale)}
          </a>
        </nav>
      )}
      <footer>
        Catatan pribadi memerlukan koneksi internet. RuangJiwa bukan layanan
        darurat.
      </footer>
    </>
  );
}
function NotFound() {
  return (
    <>
      <h1>Halaman tidak ditemukan</h1>
      <a href={appHref("/")}>Kembali ke beranda</a>
    </>
  );
}
