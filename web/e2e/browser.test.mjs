import assert from 'node:assert/strict';
import { before, after, afterEach, test } from 'node:test';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectId = 'demo-ruangjiwa';
const runDir = process.env.E2E_RUN_DIR;
assert(runDir, 'Run through e2e/run.mjs');
for (const [key, value] of Object.entries({ FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085', FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199' })) assert.equal(process.env[key], value);
function loader(packageFile) {
  const require = createRequire(packageFile);
  return name => import(pathToFileURL(require.resolve(name)).href);
}
const load = loader(path.join(web, 'package.json'));
const tools = loader(path.join(process.env.E2E_BROWSER_TOOLS, 'package.json'));
const rules = loader(path.join(process.env.E2E_RULES_TOOLS, 'package.json'));
const { chromium, expect } = (await tools('@playwright/test')).default;
const appSdk = await load('firebase/app');
const authSdk = await load('firebase/auth');
const store = await load('firebase/firestore/lite');
const storage = await load('firebase/storage');
const { initializeTestEnvironment } = await rules('@firebase/rules-unit-testing');
const adminStore = await rules('firebase/firestore');
const adminStorage = await rules('firebase/storage');
const origin = 'http://127.0.0.1:4178';
const config = { projectId, apiKey: 'demo-only-key', authDomain: 'demo-ruangjiwa.firebaseapp.com', storageBucket: 'demo-ruangjiwa.appspot.com', appId: 'demo-only-app' };
const password = 'Disposable-local-E2E-2026!';
const owners = [{ email: 'owner1-e2e@example.test' }, { email: 'owner2-e2e@example.test' }];
const records = {}, observations = [], consoleErrors = [], network = [], remoteAttempts = [], sdkApps = [];
let resetCode;
let browser, context, page, server, testEnv, owner1, owner2, guest;
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZxkAAAAASUVORK5CYII=', 'base64');
function note(name, data) { observations.push({ name, data }); console.log(`${name}: ${JSON.stringify(data)}`); }
async function sdkClient(name, account) {
  const app = appSdk.initializeApp(config, name);
  sdkApps.push(app);
  const auth = authSdk.getAuth(app);
  authSdk.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = store.getFirestore(app);
  store.connectFirestoreEmulator(db, '127.0.0.1', 8085);
  const bucket = storage.getStorage(app);
  storage.connectStorageEmulator(bucket, '127.0.0.1', 9199);
  if (account) account.uid = (await authSdk.signInWithEmailAndPassword(auth, account.email, password)).user.uid;
  return { app, auth, db, bucket };
}
async function authUI(account, register = false) {
  await expect(page.getByRole('heading', { name: 'Masuk ke RuangJiwa' })).toBeVisible();
  if (register) await page.getByRole('button', { name: 'Buat akun', exact: true }).click();
  await page.getByLabel('Email', { exact: true }).fill(account.email);
  await page.getByLabel('Kata sandi', { exact: true }).fill(password);
  await page.getByRole('button', { name: register ? 'Daftar' : 'Masuk', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeVisible({ timeout: 20000 });
}
async function logout() {
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Masuk ke RuangJiwa' })).toBeVisible();
}
async function route(url, heading) {
  await page.goto(origin + url);
  await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible({ timeout: 20000 });
  await expect(page.getByText('Memuat catatan dari Firebase...', { exact: true })).toHaveCount(0, { timeout: 15000 });
}
async function success(text = 'Tersimpan.') {
  await expect(page.getByRole('status').filter({ hasText: text })).toBeVisible({ timeout: 15000 });
}
async function ownRows(collection) {
  const result = await store.getDocs(store.query(store.collection(owner1.db, collection), store.where('userId', '==', owners[0].uid)));
  return result.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function adminRead(collection, id) {
  let result;
  await testEnv.withSecurityRulesDisabled(async c => {
    const snap = await adminStore.getDoc(adminStore.doc(c.firestore(), collection, id));
    result = snap.exists() ? snap.data() : null;
  });
  return result;
}
async function denied(fn, expected = 'permission-denied') {
  await assert.rejects(fn, error => error.code === expected);
}

before(async () => {
  testEnv = await initializeTestEnvironment({ projectId, firestore: { host: '127.0.0.1', port: 8085 }, storage: { host: '127.0.0.1', port: 9199 } });
  // TEST ONLY: provision a visibly marked directory fixture, never browser/backend injection.
  await testEnv.withSecurityRulesDisabled(async c => adminStore.setDoc(adminStore.doc(c.firestore(), 'psychologists', 'e2e-test-only'), {
    name: 'TEST ONLY Emulator Psychologist', specialization: 'TEST ONLY local fixture', bio: 'Disposable emulator fixture, not a real practitioner.'
  }));
  server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, origin).pathname);
      const requested = path.resolve(web, 'dist', '.' + pathname);
      assert(requested === path.join(web, 'dist') || requested.startsWith(path.join(web, 'dist') + path.sep));
      let file = requested;
      try { if (!path.extname(pathname)) throw new Error('SPA'); await readFile(file); } catch { file = path.join(web, 'dist/index.html'); }
      const contentTypes = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
      res.writeHead(200, { 'Content-Type': contentTypes[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(await readFile(file));
    } catch (error) { res.writeHead(500); res.end(String(error)); }
  });
  await new Promise(resolve => server.listen(4178, '127.0.0.1', resolve));
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ viewport: { width: 1280, height: 900 }, timezoneId: 'UTC' });
  await context.route('**/*', async request => {
    const url = new URL(request.request().url());
    if (['http:', 'https:'].includes(url.protocol) && url.hostname !== '127.0.0.1') {
      remoteAttempts.push(request.request().url());
      await request.abort('blockedbyclient');
    } else await request.continue();
  });
  page = await context.newPage();
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', error => consoleErrors.push(String(error)));
  page.on('requestfailed', request => network.push({ url: request.url(), failure: request.failure() }));
  await page.goto(origin);
  await authUI(owners[0], true);
  await logout();
  await authUI(owners[1], true);
  await logout();
  await authUI(owners[0]);
  owner1 = await sdkClient('e2e-owner1', owners[0]);
  owner2 = await sdkClient('e2e-owner2', owners[1]);
  guest = await sdkClient('e2e-guest');
  note('Registered disposable accounts through DOM and signed in SDK', owners);
}, { timeout: 90000 });

afterEach(async t => {
  const name = t.name.replaceAll(/[^a-z0-9]+/gi, '-').toLowerCase();
  if (page && !page.isClosed()) {
    await writeFile(path.join(runDir, `${name}.txt`), await page.locator('body').innerText());
    await page.screenshot({ path: path.join(runDir, `${name}.png`), fullPage: true });
  }
  await writeFile(path.join(runDir, 'observations.json'), JSON.stringify({ observations, consoleErrors, network, remoteAttempts, records, owners }, null, 2));
});
after(async () => {
  if (context) await context.close();
  if (browser) await browser.close();
  for (const app of sdkApps) { await authSdk.signOut(authSdk.getAuth(app)); await appSdk.deleteApp(app); }
  if (testEnv) await testEnv.cleanup();
  if (server) await new Promise(resolve => server.close(resolve));
});

test('mood DOM create and persisted owner readback', async () => {
  await route('/mood', 'Catat mood');
  await page.locator('input[name="mood"][value="happy"]').check();
  await page.getByLabel('Catatan (opsional)').fill('OWNER1 PRIVATE MOOD E2E');
  await page.getByRole('button', { name: 'Simpan mood' }).click();
  await success();
  await expect(page.locator('article').filter({ hasText: 'OWNER1 PRIVATE MOOD E2E' })).toHaveCount(1);
  const rows = await ownRows('moods');
  assert.equal(rows.length, 1); assert.equal(rows[0].mood, 'happy'); assert.equal(rows[0].note, 'OWNER1 PRIVATE MOOD E2E');
  records.moods = rows[0].id;
  note('Mood persisted', rows);
});

test('journal DOM create detail favorite and edit readbacks', async () => {
  await route('/journal', 'Tulis jurnal');
  await page.getByLabel('Judul (opsional)').fill('OWNER1 PRIVATE JOURNAL E2E');
  await page.getByLabel('Isi jurnal', { exact: true }).fill('OWNER1 PRIVATE CONTENT first reflection.');
  await page.getByLabel('Tag (pisahkan dengan koma)').fill('local, e2e');
  await page.getByLabel('Mood jurnal (opsional)').selectOption('happy');
  await page.getByRole('button', { name: 'Simpan jurnal', exact: true }).click();
  await success();
  await page.getByRole('button', { name: 'Baca OWNER1 PRIVATE JOURNAL E2E', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Detail jurnal' })).toContainText('OWNER1 PRIVATE CONTENT first reflection.');
  await page.getByRole('button', { name: 'Favoritkan', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hapus favorit', exact: true })).toBeVisible();
  let rows = await ownRows('journals');
  assert.equal(rows.length, 1); assert.equal(rows[0].isFavorite, true);
  assert.equal(rows[0].title, 'OWNER1 PRIVATE JOURNAL E2E');
  assert.equal(rows[0].content, 'OWNER1 PRIVATE CONTENT first reflection.');
  assert.equal(rows[0].mood, 'happy');
  records.journals = rows[0].id;
  const createdAt = rows[0].createdAt;
  await page.getByRole('button', { name: 'Edit jurnal', exact: true }).click();
  await expect(page.getByLabel('Mood jurnal (opsional)')).toHaveValue('happy');
  await page.getByLabel('Mood jurnal (opsional)').selectOption({ label: 'Tanpa mood' });
  await expect(page.getByLabel('Mood jurnal (opsional)')).toHaveValue('');
  await page.getByLabel('Isi jurnal', { exact: true }).fill('OWNER1 PRIVATE CONTENT edited reflection.');
  await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click();
  await success();
  rows = await ownRows('journals');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].title, 'OWNER1 PRIVATE JOURNAL E2E');
  assert.equal(rows[0].isFavorite, true);
  assert.equal(rows[0].content, 'OWNER1 PRIVATE CONTENT edited reflection.'); assert.equal(rows[0].createdAt, createdAt);
  assert.deepEqual(rows[0].tags, ['local', 'e2e']);
  assert.equal(Object.hasOwn(rows[0], 'mood'), false, 'Actual owner SDK readback must have no mood property after DOM selects Tanpa mood');
  await expect(page.getByRole('region', { name: 'Detail jurnal' })).toContainText(rows[0].content);
  note('Journal updated', rows);
});

test('both quiz DOM completions persist exact scores and categories', async () => {
  await route('/quiz', 'Kuis refleksi');
  for (const [title, value] of [['Stres Harian', 1], ['Kecemasan', 3]]) {
    await page.getByRole('button', { name: `Isi ${title}`, exact: true }).click();
    for (let i = 0; i < 5; i++) await page.locator(`input[name="question-${i}"]`).nth(value).check();
    await page.getByRole('button', { name: 'Simpan hasil kuis' }).click();
    await success();
    await expect(page.getByRole('region', { name: 'Hasil kuis' })).toContainText(value === 1 ? 'Rendah: 5 / 15' : 'Tinggi: 15 / 15');
    await page.getByRole('button', { name: 'Kembali ke pilihan kuis' }).click();
  }
  const rows = await ownRows('quizHistory');
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(({ quizType, score, category }) => ({ quizType, score, category })).sort((a, b) => a.quizType.localeCompare(b.quizType)), [
    { quizType: 'anxiety', score: 15, category: 'high' }, { quizType: 'stress', score: 5, category: 'low' }
  ]);
  records.quizHistory = rows[0].id;
  note('Quiz results persisted', rows);
});

test('future consultation DOM booking pending then cancel readback', async () => {
  await route('/consultations', 'Konsultasi');
  await page.getByRole('button', { name: 'Detail TEST ONLY Emulator Psychologist' }).click();
  const future = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  await page.getByLabel('Waktu konsultasi yang diminta').fill(future);
  await page.getByLabel('Catatan untuk pengelola (opsional)').fill('OWNER1 PRIVATE CONSULTATION E2E');
  await page.getByRole('button', { name: 'Kirim permintaan' }).click();
  await success('Permintaan dikirim. Tunggu konfirmasi pengelola.');
  let rows = await ownRows('consultations');
  assert.equal(rows.length, 1); assert.equal(rows[0].status, 'pending'); assert(Date.parse(rows[0].scheduledAt) > Date.now());
  assert.equal(rows[0].psychologistId, 'e2e-test-only');
  records.consultations = rows[0].id;
  note('Consultation pending', rows);
  await page.getByRole('button', { name: 'Batalkan permintaan' }).click();
  await page.getByRole('button', { name: 'Ya, batalkan', exact: true }).click();
  await success('Dibatalkan.');
  rows = await ownRows('consultations'); assert.equal(rows[0].status, 'canceled');
  note('Consultation canceled', rows);
});

test('profile name DOM save verifies Auth and Firestore', async () => {
  await route('/profile', 'Profil saya');
  await page.getByLabel('Nama profil').fill('OWNER1 PRIVATE PROFILE E2E');
  await page.getByRole('button', { name: 'Simpan profil', exact: true }).click();
  await success('Profil tersimpan.');
  await authSdk.reload(owner1.auth.currentUser);
  const profile = await store.getDoc(store.doc(owner1.db, 'users', owners[0].uid));
  assert.equal(profile.data().name, 'OWNER1 PRIVATE PROFILE E2E');
  assert.equal(owner1.auth.currentUser.displayName, profile.data().name);
  note('Profile name persisted', profile.data());
});

test('password reset DOM request creates emulator OOB code and SDK confirms', async () => {
  await route('/profile', 'Profil saya');
  await page.getByRole('button', { name: 'Kirim pemulihan kata sandi' }).click();
  await success('Jika email dapat menerima pemulihan, periksa kotak masuk.');
  const response = await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${projectId}/oobCodes`);
  assert.equal(response.status, 200);
  const data = await response.json();
  const code = data.oobCodes.find(c => c.email === owners[0].email && c.requestType === 'PASSWORD_RESET');
  assert(code, 'UI sendPasswordResetEmail must create a local OOB record');
  assert.equal(await authSdk.verifyPasswordResetCode(owner1.auth, code.oobCode), owners[0].email);
  resetCode = code.oobCode;
  note('Local reset request verified using SDK; confirm after private flows to avoid revoking their sessions', { email: code.email, requestType: code.requestType });
});

test('direct actual owner2 and unauthenticated SDK private access denials', async () => {
  let assertions = 0;
  for (const [collection, id] of Object.entries(records)) {
    assert(id, `Missing UI-created ${collection} document`);
    for (const client of [owner2, guest]) {
      await denied(() => store.getDoc(store.doc(client.db, collection, id))); assertions++;
      await denied(() => store.getDocs(store.query(store.collection(client.db, collection), store.where('userId', '==', owners[0].uid)))); assertions++;
      await denied(() => store.updateDoc(store.doc(client.db, collection, id), { userId: owners[1].uid })); assertions++;
    }
    await denied(() => store.getDocs(store.collection(owner1.db, collection))); assertions++;
    assert.equal((await adminRead(collection, id)).userId, owners[0].uid);
  }
  for (const client of [owner2, guest]) {
    await denied(() => store.getDoc(store.doc(client.db, 'users', owners[0].uid))); assertions++;
    await denied(() => store.setDoc(store.doc(client.db, 'users', owners[0].uid), { name: 'intruder' })); assertions++;
  }
  await denied(() => store.getDocs(store.collection(guest.db, 'psychologists'))); assertions++;
  note('Exact permission-denied assertions against UI-created private records', { assertions });
});

test('offline and DOM logout account switch remove every owner1 private view', async () => {
  await route('/journal', 'Tulis jurnal');
  await page.getByRole('button', { name: 'Baca OWNER1 PRIVATE JOURNAL E2E' }).click();
  await expect(page.getByText('OWNER1 PRIVATE CONTENT edited reflection.', { exact: true })).toBeVisible();
  await context.setOffline(true);
  await expect(page.getByRole('heading', { name: 'Kamu sedang offline' })).toBeVisible();
  assert(!(await page.locator('body').innerText()).includes('OWNER1 PRIVATE'));
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await context.setOffline(false);
  await expect(page.getByRole('heading', { name: 'Tulis jurnal', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Baca OWNER1 PRIVATE JOURNAL E2E' })).toBeVisible();
  await logout();
  assert(!(await page.locator('body').innerText()).includes('OWNER1 PRIVATE'));
  await authUI(owners[1]);
  for (const [url, heading] of [['/mood', 'Catat mood'], ['/journal', 'Tulis jurnal'], ['/quiz', 'Kuis refleksi'], ['/consultations', 'Konsultasi'], ['/profile', 'Profil saya']]) {
    if (url === '/quiz') {
      await page.locator('nav a[href="/consultations"]').click();
      await page.getByRole('link', { name: 'Isi kuis refleksi' }).click();
    } else await page.locator(`nav a[href="${url}"]`).click();
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await expect(page.getByText('Memuat catatan dari Firebase...', { exact: true })).toHaveCount(0);
    assert(!(await page.locator('body').innerText()).includes('OWNER1 PRIVATE'));
    await expect(page.locator('article').filter({ hasText: 'OWNER1 PRIVATE' })).toHaveCount(0);
  }
  await expect(page.getByLabel('Nama profil')).toHaveValue('');
  await expect(page.getByLabel('Email akun')).toHaveValue(owners[1].email);
  await logout(); await authUI(owners[0]);
  note('Offline, logout, account-switch private DOM cleared', { routes: 5 });
}, { timeout: 90000 });

test('responsive private routes at 320 375 768 1280 have no horizontal overflow', async () => {
  const measurements = [];
  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [url, heading] of [['/', 'Apa kabar hari ini?'], ['/mood', 'Catat mood'], ['/journal', 'Tulis jurnal'], ['/quiz', 'Kuis refleksi'], ['/consultations', 'Konsultasi'], ['/profile', 'Profil saya']]) {
      await route(url, heading);
      const measure = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        outside: [...document.querySelectorAll('main *,header *,nav *,footer *')].filter(e => {
          const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1);
        }).map(e => ({ tag: e.tagName, text: e.textContent.slice(0, 60) })) }));
      measurements.push({ url, ...measure });
      await page.screenshot({ path: path.join(runDir, `responsive-${width}-${url.replaceAll('/', '') || 'home'}.png`), fullPage: true });
      assert.equal(measure.scrollWidth, width, `${url} at ${width} must not overflow`);
      assert.deepEqual(measure.outside, [], `${url} at ${width} has out-of-viewport elements`);
    }
  }
  note('Responsive measurements', measurements);
  await page.setViewportSize({ width: 1280, height: 900 });
}, { timeout: 120000 });

test('profile photo DOM save must persist matching Storage Auth Firestore URL', async () => {
  await route('/profile', 'Profil saya');
  await page.getByLabel('Nama profil').fill('OWNER1 PRIVATE PROFILE E2E');
  await page.getByLabel('Foto profil (opsional)').setInputFiles({ name: 'test-only-pixel.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('button', { name: 'Simpan profil', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Simpan profil', exact: true })).toBeEnabled({ timeout: 20000 });
  await authSdk.reload(owner1.auth.currentUser);
  const listing = await storage.listAll(storage.ref(owner1.bucket, `profile_images/${owners[0].uid}`));
  const objects = await Promise.all(listing.items.map(async item => ({ fullPath: item.fullPath, metadata: await storage.getMetadata(item) })));
  const profile = await adminRead('users', owners[0].uid);
  note('Photo attempted actual readbacks', { objects, authPhotoURL: owner1.auth.currentUser.photoURL, profile, alerts: await page.getByRole('alert').allTextContents() });
  assert.equal(objects.length, 1, 'UI uploadBytes must persist one photo');
  records.photo = objects[0].fullPath;
  await success('Profil tersimpan.');
  assert.equal(profile.profileImageUrl, owner1.auth.currentUser.photoURL);
  await expect(page.getByRole('img', { name: 'Foto profil saya' })).toBeVisible();
  assert(await page.getByRole('img', { name: 'Foto profil saya' }).evaluate(img => img.complete && img.naturalWidth > 0));
});

test('Storage owner gets and crossuser unauthenticated gets writes denied', async () => {
  assert(records.photo, 'Photo upload must have reached emulator');
  const ownerRef = storage.ref(owner1.bucket, records.photo);
  const metadata = await storage.getMetadata(ownerRef);
  assert.equal(metadata.contentType, 'image/png'); assert.equal(metadata.size, png.length);
  assert.deepEqual(Buffer.from(await storage.getBytes(ownerRef)), png);
  let assertions = 0;
  for (const client of [owner2, guest]) {
    const target = storage.ref(client.bucket, records.photo);
    for (const fn of [() => storage.getMetadata(target), () => storage.getBytes(target), () => storage.uploadBytes(target, png, { contentType: 'image/png' }), () => storage.deleteObject(target)]) {
      await denied(fn, 'storage/unauthorized'); assertions++;
    }
  }
  const url = await storage.getDownloadURL(ownerRef);
  const bearerResponse = await fetch(url);
  note('Storage exact unauthorized assertions; bearer URL separate privacy boundary', { assertions, ownerMetadataSize: metadata.size, tokenUrlUnauthStatus: bearerResponse.status });
  assert.equal(bearerResponse.status, 403, 'Unauthenticated download-token URL must not expose private image');
});

test('journal DOM deletion must show success remove private detail and verify absence', async () => {
  await route('/journal', 'Tulis jurnal');
  await page.getByRole('button', { name: 'Baca OWNER1 PRIVATE JOURNAL E2E' }).click();
  await page.getByRole('button', { name: 'Hapus jurnal', exact: true }).click();
  await page.getByRole('button', { name: 'Ya, hapus permanen' }).click();
  await success('Jurnal dihapus.');
  await expect(page.getByRole('button', { name: 'Ya, hapus permanen' })).toHaveCount(0);
  const persisted = await adminRead('journals', records.journals);
  note('Journal delete actual absence and DOM feedback', { persisted, alerts: await page.getByRole('alert').allTextContents(), staleDetail: await page.getByRole('region', { name: 'Detail jurnal' }).count() });
  assert.equal(persisted, null, 'TEST ONLY admin read verifies actual delete');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await success('Jurnal dihapus.');
  await expect(page.getByRole('region', { name: 'Detail jurnal' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Baca OWNER1 PRIVATE JOURNAL E2E' })).toHaveCount(0);
});

test('local SDK confirms reset then DOM login works and logout clears', async () => {
  assert(resetCode);
  await authSdk.confirmPasswordReset(owner1.auth, resetCode, password);
  await authSdk.signInWithEmailAndPassword(owner1.auth, owners[0].email, password);
  await page.goto(origin);
  await expect(page.getByRole('heading', { name: 'Masuk ke RuangJiwa' })).toBeVisible({ timeout: 15000 });
  assert(!(await page.locator('body').innerText()).includes('OWNER1 PRIVATE'));
  await authUI(owners[0]);
  await logout();
  note('Password reset confirmed and subsequent real DOM login/logout passed', { email: owners[0].email });
});

test('no production network attempts or uncaught browser exceptions', () => {
  assert.deepEqual(remoteAttempts, [], 'All browser traffic must remain loopback');
  const uncaught = consoleErrors.filter(e => !e.startsWith('Failed to load resource:'));
  note('Browser errors retained without filtering evidence', { consoleErrors, network, remoteAttempts });
  assert.deepEqual(uncaught, []);
});
