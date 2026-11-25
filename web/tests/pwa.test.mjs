import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';

function loadWorker(source, base) {
  const listeners = new Map();
  const scope = `https://example.test${base}`;
  let skips = 0;
  const cacheReads = [];
  const cacheWrites = [];
  const installRequests = [];
  const deletedCaches = [];
  const context = {
    URL, Request, Response, Headers, console,
    location: new URL(`${scope}sw.js`),
    registration: { scope },
    caches: {
      open: async () => ({
        match: async (key) => { cacheReads.push(String(key)); return new Response('static shell'); },
        put: async (url, response) => { cacheWrites.push({ url, body: await response.text() }); },
      }),
      keys: async () => ['unrelated-cache', 'ruangjiwa-shell:/RuangJiwa/:old'],
      delete: async (name) => { deletedCaches.push(name); return true; },
    },
    fetch: async (request) => { installRequests.push(request); return new Response('static build asset'); },
    addEventListener: (type, callback) => listeners.set(type, [...(listeners.get(type) ?? []), callback]),
    skipWaiting: async () => { skips += 1; },
  };
  context.self = context;
  assert.doesNotThrow(() => runInNewContext(source, context), 'worker must be a self-contained classic script');
  return {
    cacheReads, cacheWrites, installRequests, deletedCaches,
    skips: () => skips,
    async dispatch(type, event) {
      const promises = [];
      for (const callback of listeners.get(type) ?? []) callback({ ...event, waitUntil: (promise) => promises.push(promise) });
      await Promise.all(promises);
    },
    async fetch(path, { method = 'GET', mode = 'navigate', headers = {} } = {}) {
      let response;
      for (const callback of listeners.get('fetch') ?? []) {
        callback({
          request: { url: new URL(path, scope).href, method, mode, headers: new Headers(headers) },
          respondWith: (value) => { assert.equal(response, undefined); response = Promise.resolve(value); },
        });
      }
      return response;
    },
  };
}

const root = resolve(import.meta.dirname, '..');
const helperPath = join(root, 'src/pwa/deployment.ts');

async function deployment() {
  assert.ok(existsSync(helperPath), 'deployment helper is missing');
  return import(pathToFileURL(helperPath).href);
}

test('deployment bases default to root and normalize a repository subpath', async () => {
  const { normalizeBasePath } = await deployment();
  assert.equal(normalizeBasePath(undefined), '/');
  assert.equal(normalizeBasePath(''), '/');
  assert.equal(normalizeBasePath('/'), '/');
  assert.equal(normalizeBasePath('/RuangJiwa'), '/RuangJiwa/');
  assert.equal(normalizeBasePath('/RuangJiwa/'), '/RuangJiwa/');
  assert.equal(normalizeBasePath('/team/RuangJiwa'), '/team/RuangJiwa/');
  for (const invalid of ['RuangJiwa', '//evil.test/', 'https://evil.test/', '/a//b/', '/a/../b/', '/a/./', '/a?x=1', '/a#x', '/a%2fb/', '/a\\b/', ' /a/']) {
    assert.throws(() => normalizeBasePath(invalid), /VITE_BASE_PATH/, invalid);
  }
});

test('installation detection recognizes iOS and installed display modes without claiming browser support', async () => {
  const path = join(root, 'src/pwa/install.ts');
  assert.ok(existsSync(path), 'native installation helpers are missing');
  const { isIOS, isInstalled } = await import(pathToFileURL(path).href);
  assert.equal(isIOS({ userAgent: 'iPhone', platform: 'iPhone', maxTouchPoints: 5 }), true);
  assert.equal(isIOS({ userAgent: 'Mozilla/5.0 Macintosh', platform: 'MacIntel', maxTouchPoints: 5 }), true);
  assert.equal(isIOS({ userAgent: 'Mozilla/5.0 Macintosh', platform: 'MacIntel', maxTouchPoints: 0 }), false);
  assert.equal(isIOS({ userAgent: 'Android', platform: 'Linux', maxTouchPoints: 5 }), false);
  assert.equal(isInstalled(false, false), false);
  assert.equal(isInstalled(true, false), true);
  assert.equal(isInstalled(false, true), true);
});

test('install and update controls bundle without third-party registration or automatic page reload', async () => {
  const path = join(root, 'src/pwa/PwaControls.tsx');
  assert.ok(existsSync(path), 'install/update component is missing');
  const { build } = await import('esbuild');
  const result = await build({ entryPoints: [path], bundle: true, write: false, outfile: join(tmpdir(), 'pwa-controls.js'), tsconfig: join(root, 'tsconfig.json'), format: 'esm', jsx: 'automatic', jsxImportSource: 'preact' });
  const code = result.outputFiles[0].text;
  assert.match(code, /beforeinstallprompt/);
  assert.match(code, /appinstalled/);
  assert.match(code, /display-mode: standalone/);
  assert.match(code, /SKIP_WAITING/);
  assert.doesNotMatch(code, /workbox-window|virtual:pwa-register/);
  assert.match(code, /Tambahkan ke Layar Utama/);
  assert.match(code, /hasUnsavedChanges/);
});

test('the Apple icon composites the approved transparent icon onto opaque indigo', () => {
  const check = spawnSync('python', ['-c', `
from PIL import Image
from pathlib import Path
icons = Path('public/icons')
source = Image.open(icons / 'icon-192.png').convert('RGBA').resize((180, 180), Image.Resampling.LANCZOS)
expected = Image.new('RGBA', source.size, '#4f46e5')
expected.alpha_composite(source)
actual = Image.open(icons / 'apple-touch-icon.png').convert('RGBA')
assert actual.size == (180, 180)
assert actual.getpixel((0, 0)) == (79, 70, 229, 255), actual.getpixel((0, 0))
assert actual.tobytes() == expected.tobytes(), 'Logo pixels must match the approved icon'
`], { cwd: root, encoding: 'utf8' });
  assert.equal(check.status, 0, check.stdout + check.stderr);
});

test('the real build applies deployment paths and denies dynamic worker requests', { timeout: 120_000 }, async () => {
  const scratch = mkdtempSync(join(tmpdir(), 'ruangjiwa-pwa-'));
  try {
    const dist = join(scratch, 'dist');
    const build = spawnSync(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', dist], {
      cwd: root,
      env: { ...process.env, VITE_BASE_PATH: '/RuangJiwa/' },
      encoding: 'utf8',
      timeout: 110_000,
    });
    assert.equal(build.status, 0, build.stdout + build.stderr);
    const manifest = JSON.parse(readFileSync(join(dist, 'manifest.webmanifest'), 'utf8'));
    const manifestURL = new URL('https://example.test/RuangJiwa/manifest.webmanifest');
    assert.equal(new URL(manifest.start_url, manifestURL).pathname, '/RuangJiwa/');
    assert.equal(new URL(manifest.scope, manifestURL).pathname, '/RuangJiwa/');
    for (const icon of manifest.icons) {
      assert.ok(new URL(icon.src, manifestURL).pathname.startsWith('/RuangJiwa/icons/'));
    }
    assert.doesNotMatch(manifest.description, /privat|Firebase|—/);
    const html = readFileSync(join(dist, 'index.html'), 'utf8');
    assert.match(html, /href="\/RuangJiwa\/icons\/apple-touch-icon.png"/);
    assert.match(html, /href="\/RuangJiwa\/manifest.webmanifest"/);
    assert.match(html, /<noscript>[\s\S]*JavaScript[\s\S]*<\/noscript>/);
    assert.doesNotMatch(html, /—/);
    const workerSource = readFileSync(join(dist, 'sw.js'), 'utf8');
    assert.doesNotMatch(workerSource, /clients\.claim\(/);
    const worker = loadWorker(workerSource, '/RuangJiwa/');
    assert.equal(worker.skips(), 0, 'updates must not skip waiting on startup');
    await worker.dispatch('install', {});
    assert.equal(worker.skips(), 0, 'installation must leave an update waiting');
    assert.equal(new Set(worker.cacheWrites.map((entry) => entry.url)).size, worker.cacheWrites.length);
    for (const request of worker.installRequests) {
      assert.equal(request.credentials, 'omit');
      assert.equal(request.redirect, 'error');
      assert.match(new URL(request.url).pathname, /^\/RuangJiwa\/(?:index\.html|manifest\.webmanifest|favicon\.svg|icons\/[^/]+\.png|assets\/[^/]+\.(?:js|css))$/);
    }
    await worker.dispatch('activate', {});
    assert.deepEqual(worker.deletedCaches, ['ruangjiwa-shell:/RuangJiwa/:old']);
    for (const path of ['/RuangJiwa/', '/RuangJiwa/journal', '/RuangJiwa/mood']) {
      const response = await worker.fetch(path);
      assert.equal(await response?.text(), 'static shell', path);
      assert.match(worker.cacheReads.at(-1), /\/RuangJiwa\/index\.html(?:\?|$)/);
    }
    const jsAsset = html.match(/src="([^\"]+\/assets\/[^\"]+\.js)"/)[1];
    assert.ok(await worker.fetch(jsAsset, { mode: 'cors' }));
    for (const path of [
      '/api/journal', '/__/auth/handler', '/RuangJiwa/api/journal', '/RuangJiwa/__/auth/handler',
      '/RuangJiwa/auth', '/RuangJiwa/session', '/RuangJiwa/data', '/RuangJiwa/emulator/v1',
      '/RuangJiwa/v1/projects/demo', '/RuangJiwa/identitytoolkit.googleapis.com/v1/accounts:lookup',
      '/RuangJiwa/%61pi/journal', '/RuangJiwa/journal?token=secret', '/RuangJiwa/?utm_source=test',
      '/RuangJiwa/unlisted.json', '/outside/', 'https://other.test/RuangJiwa/',
      'http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:lookup',
    ]) {
      assert.equal(await worker.fetch(path), undefined, path);
    }
    assert.equal(await worker.fetch('/RuangJiwa/journal', { method: 'POST' }), undefined);
    assert.equal(await worker.fetch('/RuangJiwa/journal', { mode: 'cors' }), undefined);
    assert.equal(await worker.fetch(jsAsset + '?token=secret', { mode: 'cors' }), undefined);
    assert.equal(await worker.fetch(jsAsset, { mode: 'cors', headers: { Authorization: 'Bearer secret' } }), undefined);
    assert.equal(await worker.fetch(jsAsset, { mode: 'cors', headers: { Range: 'bytes=0-1' } }), undefined);
    await worker.dispatch('message', { data: { type: 'UNRELATED' } });
    assert.equal(worker.skips(), 0);
    await worker.dispatch('message', { data: { type: 'SKIP_WAITING' } });
    assert.equal(worker.skips(), 1, 'only an explicit update message may activate a waiting worker');
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
