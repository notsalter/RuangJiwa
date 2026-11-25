import Router from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { Session } from './core/session';
import { createBackend } from './services/firebase';
import { useSession } from './core/hooks';
import { translate } from './core/i18n';
import { Auth } from './pages/Auth';
import { Home } from './pages/Home';
import { MoodPage } from './pages/Mood';
import { JournalPage } from './pages/Journal';
const defaultSession = new Session(createBackend(import.meta.env));
export function App({ session = defaultSession }: { session?: Session }) {
  const state = useSession(session), [online, setOnline] = useState(navigator.onLine), [locale, setLocale] = useState('id'), [path, setPath] = useState(location.pathname);
  useEffect(() => session.start(), [session]);
  useEffect(() => { const change = () => { setOnline(navigator.onLine); if (!navigator.onLine) session.clearData(); }; window.addEventListener('online', change); window.addEventListener('offline', change); return () => { window.removeEventListener('online', change); window.removeEventListener('offline', change); }; }, [session]);
  useEffect(() => { document.documentElement.lang = locale; document.title = 'RuangJiwa | Catatan dan refleksi'; }, [locale]);
  return <><a class="skip" href="#content">Langsung ke isi</a><header><span class="brand">RuangJiwa</span><div class="actions"><label>Bahasa <select value={locale} onChange={e => setLocale(e.currentTarget.value)}><option value="id">Indonesia</option><option value="en">English (navigation)</option></select></label>{state.user && <button onClick={() => void session.logout()}>Keluar</button>}</div></header>
    <main id="content" class="page">{state.error && <p role="alert">{state.error}</p>}{!state.ready ? <p role="status">Memeriksa sesi...</p> : !state.user ? <Auth session={session} /> : !online ? <section><h1>Kamu sedang offline</h1><p>Catatan pribadi tidak tersedia offline. Sambungkan internet untuk mengaksesnya. Tidak ada catatan yang disimpan oleh service worker.</p></section> : <Router key={state.user.uid} onChange={e => { setPath(e.url); document.getElementById('content')?.focus(); }}><Home path="/" session={session} /><MoodPage path="/mood" session={session} /><JournalPage path="/journal" session={session} /><NotFound default /></Router>}</main>
    {state.user && online && <nav aria-label="Navigasi utama"><a href="/" aria-current={path === '/' ? 'page' : undefined}>{translate('home', locale)}</a><a href="/mood" aria-current={path === '/mood' ? 'page' : undefined}>{translate('mood', locale)}</a><a href="/journal" aria-current={path === '/journal' ? 'page' : undefined}>{translate('journal', locale)}</a></nav>}
    <footer>Catatan pribadi memerlukan koneksi internet. RuangJiwa bukan layanan darurat.</footer>
  </>;
}
function NotFound(_props: { default?: boolean }) { return <><h1>Halaman tidak ditemukan</h1><a href="/">Kembali ke beranda</a></>; }
