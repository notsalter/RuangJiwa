import { isShellAssetPath, isShellNavigation, isShellRequest } from './policy';

type Entry = { url: string; revision?: string | null };
type WorkerEvent = { waitUntil: (promise: Promise<unknown>) => void };
type WorkerScope = {
  __WB_MANIFEST: Entry[];
  registration: { scope: string };
  addEventListener(type: 'install' | 'activate', callback: (event: WorkerEvent) => void): void;
  addEventListener(type: 'message', callback: (event: WorkerEvent & { data: unknown }) => void): void;
  addEventListener(type: 'fetch', callback: (event: { request: Request; respondWith: (response: Promise<Response>) => void }) => void): void;
  skipWaiting: () => Promise<void>;
};
const worker = self as unknown as WorkerScope;
const scope = worker.registration.scope;
const base = new URL(scope);
const entries = (self as unknown as WorkerScope).__WB_MANIFEST.filter((entry) => {
  const url = new URL(entry.url, scope);
  return url.origin === base.origin && url.pathname.startsWith(base.pathname) && !url.search &&
    isShellAssetPath(url.pathname.slice(base.pathname.length));
});
const shellURL = new URL('index.html', scope).href;
const version = entries.find((entry) => new URL(entry.url, scope).href === shellURL)?.revision;
if (!version) throw new Error('The static index.html must have a precache revision.');
const prefix = `ruangjiwa-shell:${base.pathname}:`;
const cacheName = prefix + entries.map((entry) => `${entry.url}:${entry.revision ?? ''}`).join('|');
const assetURLs = new Set(entries.map((entry) => new URL(entry.url, scope).href));

worker.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    for (const url of assetURLs) {
      const response = await fetch(new Request(url, { credentials: 'omit', cache: 'reload', redirect: 'error' }));
      if (!response.ok || response.type === 'opaque' || response.redirected) throw new Error('Static shell precache failed.');
      await cache.put(url, response);
    }
  })());
});

worker.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(prefix) && name !== cacheName).map((name) => caches.delete(name)));
  })());
});

worker.addEventListener('message', (event) => {
  if ((event.data as { type?: unknown } | null)?.type === 'SKIP_WAITING') event.waitUntil(worker.skipWaiting());
});

worker.addEventListener('fetch', (event) => {
  const request = event.request;
  if (!isShellRequest(request, scope)) return;
  const url = new URL(request.url);
  const navigation = request.mode === 'navigate' && isShellNavigation(url.pathname.slice(base.pathname.length));
  if (!navigation && !assetURLs.has(url.href)) return;
  event.respondWith((async () => {
    const cached = await (await caches.open(cacheName)).match(navigation ? shellURL : url.href);
    if (cached) return cached;
    if (!navigation) return fetch(request);
    return new Response('RuangJiwa belum tersedia offline. Sambungkan internet, lalu buka ulang aplikasi.', {
      status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  })());
});
