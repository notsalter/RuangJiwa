import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
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
import {
  ConsultationIcon,
  HomeIcon,
  JournalIcon,
  LeafIcon,
  LogoutIcon,
  MoodIcon,
  ProfileIcon,
} from "./ui/icons";
const defaultSession = new Session(createBackend(import.meta.env));
const historyKey = "__ruangjiwa_history";
function entry(state: unknown): { id: string; index: number } | null {
  const value = (state as Record<string, unknown> | null)?.[historyKey] as
    | { id?: unknown; index?: unknown }
    | undefined;
  return value && typeof value.id === "string" &&
    Number.isSafeInteger(value.index) && (value.index as number) >= 0
    ? value as { id: string; index: number }
    : null;
}
type NativeNavigateEvent = Event & {
  navigationType: string;
  destination: { sameDocument: boolean; url: string; key: string };
};
type NativeNavigation = {
  currentEntry: { key: string } | null;
  addEventListener(type: "navigate", listener: (event: NativeNavigateEvent) => void): void;
  removeEventListener(type: "navigate", listener: (event: NativeNavigateEvent) => void): void;
};
const discardMessage =
  "Jurnal belum disimpan. Tinggalkan halaman dan buang perubahan?";
export function App({ session = defaultSession }: { session?: Session }) {
  const state = useSession(session),
    [online, setOnline] = useState(navigator.onLine),
    [locale, setLocale] = useState("id"),
    [url, setUrl] = useState(
      location.pathname + location.search + location.hash,
    ),
    [journalDirty, setJournalDirty] = useState(false),
    [unindexedDestination, setUnindexedDestination] = useState<string | null>(null);
  const path = relativePath(url);
  const currentEntry = useRef<ReturnType<typeof entry>>(null);
  const restoring = useRef(false);
  const allowedUnindexed = useRef<string | null>(null);
  const knownNativeEntries = useRef(new Set<string>());
  const navigation = (window as Window & { navigation?: NativeNavigation }).navigation;
  useLayoutEffect(() => {
    currentEntry.current = entry(history.state);
    if (!currentEntry.current &&
        (history.state === null || Object.getPrototypeOf(history.state) === Object.prototype)) {
      currentEntry.current = { id: crypto.randomUUID(), index: 0 };
      history.replaceState({ ...history.state, [historyKey]: currentEntry.current }, "");
    }
    if (currentEntry.current && navigation?.currentEntry)
      knownNativeEntries.current.add(navigation.currentEntry.key);
  }, []);
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
      if (restoring.current || !allow(href)) return;
      const previous = currentEntry.current;
      const nextEntry = previous
        ? { id: previous.id, index: previous.index + 1 }
        : { id: crypto.randomUUID(), index: 0 };
      history.pushState({ [historyKey]: nextEntry }, "", href);
      currentEntry.current = nextEntry;
      if (navigation?.currentEntry)
        knownNativeEntries.current.add(navigation.currentEntry.key);
      setUnindexedDestination(null);
      setUrl(href);
      document.getElementById("content")?.focus();
    };
    const navigate = (event: NativeNavigateEvent) => {
      if (event.navigationType !== "traverse" || !event.cancelable ||
          !event.destination.sameDocument ||
          knownNativeEntries.current.has(event.destination.key)) return;
      const destination = new URL(event.destination.url);
      const next = destination.pathname + destination.search + destination.hash;
      if (!allow(next)) event.preventDefault();
      else allowedUnindexed.current = next;
    };
    const pop = (event: PopStateEvent) => {
      event.stopImmediatePropagation();
      const next = location.pathname + location.search + location.hash;
      const target = entry(event.state);
      if (restoring.current) {
        if (target?.id === currentEntry.current?.id &&
            target?.index === currentEntry.current?.index) {
          restoring.current = false;
          return;
        }
      }
      const previous = currentEntry.current;
      const indexed = previous && target?.id === previous.id;
      if (!indexed && journalDirty && relativePath(next) !== path && allowedUnindexed.current !== next) {
        // popstate cannot be cancelled and gives no distance for a foreign entry.
        // Keep both the draft and the native stack; never guess an inverse delta.
        currentEntry.current = target;
        restoring.current = false;
        setUnindexedDestination(next);
        return;
      }
      const allowed = allowedUnindexed.current === next || allow(next);
      allowedUnindexed.current = null;
      if (!allowed && indexed && target.index !== previous.index) {
        restoring.current = true;
        history.go(previous.index - target.index);
      } else {
        currentEntry.current = target;
        restoring.current = false;
        setUnindexedDestination(null);
        setUrl(next);
        document.getElementById("content")?.focus();
      }
    };
    // Own route transitions so no delegated router can unmount a dirty editor.
    window.addEventListener("click", click, true);
    window.addEventListener("popstate", pop, true);
    navigation?.addEventListener("navigate", navigate);
    return () => {
      navigation?.removeEventListener("navigate", navigate);
      window.removeEventListener("click", click, true);
      window.removeEventListener("popstate", pop, true);
    };
  }, [journalDirty, path, url]);
  useLayoutEffect(() => {
    if (!journalDirty && unindexedDestination) {
      setUrl(unindexedDestination);
      setUnindexedDestination(null);
    }
  }, [journalDirty, unindexedDestination]);
  return (
    <>
      <a class="skip" href="#content">
        Langsung ke isi
      </a>
      <header>
        <span class="brand">
          <LeafIcon />
          RuangJiwa
        </span>
        <div class="actions">
          <label class="lang">
            <span class="lang__label">Bahasa</span>
            <select
              aria-label="Bahasa"
              value={locale}
              onChange={(e) => setLocale(e.currentTarget.value)}
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English (navigation)</option>
            </select>
          </label>
          {state.user && (
            <button
              class="icon-btn"
              aria-label="Keluar"
              title="Keluar"
              onClick={() => {
                if (!journalDirty || window.confirm(discardMessage))
                  void session.logout();
              }}
            >
              <LogoutIcon />
              <span class="icon-btn__text" aria-hidden="true">
                Keluar
              </span>
            </button>
          )}
        </div>
      </header>
      <PwaControls hasUnsavedChanges={journalDirty} />
      <main id="content" class="page" tabIndex={-1}>
        {unindexedDestination && (
          <p role="alert">
            Riwayat browser di luar navigasi aplikasi tidak dapat dipulihkan.
            Jurnal tetap terbuka agar perubahan dapat disimpan atau dibatalkan.{" "}
            <a data-native href={unindexedDestination}>Muat halaman tujuan</a>
          </p>
        )}
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
            <HomeIcon />
            {translate("home", locale)}
          </a>
          <a
            href={appHref("/mood")}
            aria-current={path === "/mood" ? "page" : undefined}
          >
            <MoodIcon />
            {translate("mood", locale)}
          </a>
          <a
            href={appHref("/journal")}
            aria-current={path === "/journal" ? "page" : undefined}
          >
            <JournalIcon />
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
            <ConsultationIcon />
            {translate("consultation", locale)}
          </a>
          <a
            href={appHref("/profile")}
            aria-current={path === "/profile" ? "page" : undefined}
          >
            <ProfileIcon />
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
