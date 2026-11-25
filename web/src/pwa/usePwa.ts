import { useEffect, useRef, useState } from 'preact/hooks';
import { isIOS, isInstalled, type InstallPromptEvent } from './install';

export function usePwa(hasUnsavedChanges = false) {
  const unsaved = useRef(hasUnsavedChanges);
  unsaved.current = hasUnsavedChanges;
  const [installed, setInstalled] = useState(false);
  const [ios, setIOS] = useState(false);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [offlineReady, setOfflineReady] = useState(false);
  const [busy, setBusy] = useState<'install' | 'update' | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const alive = useRef(false);
  const cancelUpdate = useRef<(() => void) | null>(null);

  useEffect(() => {
    alive.current = true;
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const syncInstalled = () => setInstalled(isInstalled(displayMode.matches, (navigator as Navigator & { standalone?: boolean }).standalone));
    syncInstalled();
    setIOS(isIOS(navigator));
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    displayMode.addEventListener('change', syncInstalled);
    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      alive.current = false;
      cancelUpdate.current?.();
      displayMode.removeEventListener('change', syncInstalled);
      window.removeEventListener('beforeinstallprompt', capturePrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    const cleanups: (() => void)[] = [];
    const sync = () => {
      if (disposed || !registration) return;
      setWaiting(registration.waiting);
      setOfflineReady(Boolean(registration.active));
    };
    const watchInstalling = () => {
      const installing = registration?.installing;
      if (!installing) return;
      const changed = () => {
        if (installing.state === 'activated' || installing.state === 'installed') sync();
        if (installing.state === 'redundant' && !disposed) setError('Versi offline belum berhasil disiapkan. Sambungkan internet, lalu periksa lagi.');
      };
      installing.addEventListener('statechange', changed);
      cleanups.push(() => installing.removeEventListener('statechange', changed));
    };
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).then((value) => {
      if (disposed) return;
      registration = value;
      sync();
      watchInstalling();
      registration.addEventListener('updatefound', watchInstalling);
      cleanups.push(() => registration?.removeEventListener('updatefound', watchInstalling));
    }).catch(() => {
      if (!disposed) setError('Versi offline belum berhasil disiapkan. Periksa koneksi dan izin browser, lalu coba lagi.');
    });
    const checkOnReturn = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) registration?.update().catch(() => {
        if (!disposed) setError('Pembaruan belum dapat diperiksa. Coba lagi saat tersambung internet.');
      });
      sync();
    };
    document.addEventListener('visibilitychange', checkOnReturn);
    return () => {
      disposed = true;
      cleanups.forEach((cleanup) => cleanup());
      document.removeEventListener('visibilitychange', checkOnReturn);
    };
  }, [attempt]);

  async function install() {
    if (!prompt || busy || installed) return;
    const event = prompt;
    setPrompt(null);
    setBusy('install');
    setError('');
    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      if (alive.current) setError('Pemasangan belum berhasil. Gunakan menu browser untuk menambahkan aplikasi jika tersedia.');
    } finally {
      if (alive.current) setBusy(null);
    }
  }

  function update(hasUnsavedChanges: boolean) {
    if (!waiting || busy || hasUnsavedChanges || unsaved.current) return;
    const target = waiting;
    setBusy('update');
    setError('');
    let timer: ReturnType<typeof setTimeout>;
    const cleanup = () => {
      clearTimeout(timer);
      target.removeEventListener('statechange', changed);
      cancelUpdate.current = null;
    };
    const changed = () => {
      if (target.state === 'activated') {
        cleanup();
        if (alive.current) {
          if (unsaved.current) {
            setBusy(null);
            setError('Pembaruan siap, tetapi jurnal belum disimpan. Simpan atau batalkan jurnal sebelum memuat ulang.');
          } else window.location.reload();
        }
      } else if (target.state === 'redundant') {
        cleanup();
        if (alive.current) {
          setBusy(null);
          setError('Pembaruan belum berhasil. Periksa lagi, lalu coba muat ulang.');
        }
      }
    };
    timer = setTimeout(() => {
      cleanup();
      if (alive.current) {
        setBusy(null);
        setError('Pembaruan belum selesai. Periksa lagi, lalu coba muat ulang.');
      }
    }, 15_000);
    cancelUpdate.current = cleanup;
    target.addEventListener('statechange', changed);
    try { target.postMessage({ type: 'SKIP_WAITING' }); changed(); } catch {
      cleanup();
      setBusy(null);
      setError('Pembaruan belum berhasil. Periksa lagi, lalu coba muat ulang.');
    }
  }

  function retry() { setError(''); setAttempt((value) => value + 1); }
  return { installed, ios, canInstall: Boolean(prompt), waiting, offlineReady, busy, error, install, update, retry };
}
