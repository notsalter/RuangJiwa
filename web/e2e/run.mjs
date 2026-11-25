import assert from 'node:assert/strict';
import { access, copyFile, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

assert.equal(process.argv.length, 2, 'This runner accepts no arguments and never targets production');
const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scratch = path.resolve(process.env.E2E_SCRATCH_DIR || path.join(homedir(), '.hermes/cache/scratch'));
assert(!scratch.startsWith('/tmp'), 'Use a cache/scratch directory');
const tools = path.resolve(process.env.E2E_BROWSER_TOOLS || path.join(scratch, 'ruangjiwa-browser-tools'));
const rulesTools = path.resolve(process.env.E2E_RULES_TOOLS || path.join(scratch, 'ruangjiwa-rules-tools'));
const browsers = path.resolve(process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(scratch, 'ruangjiwa-browsers'));
const require = createRequire(path.join(tools, 'package.json'));
const cli = require.resolve('firebase-tools/lib/bin/firebase.js');
await Promise.all([access(cli), access(path.join(rulesTools, 'package.json')), access(browsers)]);
const runDir = await mkdtemp(path.join(scratch, 'ruangjiwa-e2e-run-'));
const env = { ...process.env, TMPDIR: runDir, E2E_RUN_DIR: runDir, E2E_BROWSER_TOOLS: tools,
  E2E_RULES_TOOLS: rulesTools, PLAYWRIGHT_BROWSERS_PATH: browsers,
  FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true', CI: 'true' };
for (const key of Object.keys(env)) {
  if (/^(VITE_FIREBASE_|FIREBASE_|GCLOUD_|GOOGLE_|CLOUDSDK_)/.test(key)) delete env[key];
}
Object.assign(env, { FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085',
  FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199',
  VITE_FIREBASE_PROJECT_ID: 'demo-ruangjiwa', VITE_FIREBASE_EMULATORS: 'true',
  VITE_FIREBASE_API_KEY: 'demo-only-key', VITE_FIREBASE_AUTH_DOMAIN: 'demo-ruangjiwa.firebaseapp.com',
  VITE_FIREBASE_STORAGE_BUCKET: 'demo-ruangjiwa.appspot.com', VITE_FIREBASE_APP_ID: 'demo-only-app' });
async function free(port) {
  await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', () => reject(new Error(`Port ${port} is busy; coordinate with its owner. No process was killed.`)));
    server.listen(port, '127.0.0.1', () => server.close(resolve));
  });
}
async function run(args, cwd) {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', data => { process.stdout.write(data); output.push(data.toString()); });
    child.stderr.on('data', data => { process.stderr.write(data); output.push(data.toString()); });
    child.on('error', reject);
    child.on('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}
const output = [];
console.log(`Local demo E2E only; artifacts: ${runDir}`);
try {
  for (const port of [9099, 8085, 9199, 4400, 4500, 9150, 4178]) await free(port);
  const build = await run([path.join(web, 'node_modules/vite/bin/vite.js'), 'build'], web);
  assert.equal(build, 0, 'Dummy-config build must pass');
  const config = JSON.parse(await readFile(path.join(web, 'firebase/firebase.json'), 'utf8'));
  for (const [name, port] of Object.entries({ auth: 9099, firestore: 8085, storage: 9199, hub: 4400, logging: 4500 })) {
    assert.deepEqual(config.emulators[name], { host: '127.0.0.1', port }, `${name} must use the fixed loopback endpoint`);
  }
  assert.equal(config.emulators.ui.enabled, false);
  assert.equal(config.emulators.singleProjectMode, true);
  await copyFile(path.join(web, 'firebase/firestore.rules'), path.join(runDir, 'firestore.rules'));
  await copyFile(path.join(web, 'firebase/storage.rules'), path.join(runDir, 'storage.rules'));
  await writeFile(path.join(runDir, 'firebase.json'), JSON.stringify(config, null, 2));
  const quote = value => `'${value.replaceAll("'", "'\\''")}'`;
  const command = `${quote(process.execPath)} --test --test-concurrency=1 ${quote(path.join(web, 'e2e/browser.test.mjs'))}`;
  process.exitCode = await run([cli, 'emulators:exec', '--project', 'demo-ruangjiwa', '--config', path.join(runDir, 'firebase.json'), '--only', 'auth,firestore,storage', command], runDir);
} catch (error) {
  console.error(error);
  output.push(String(error));
  process.exitCode = 1;
} finally {
  await writeFile(path.join(runDir, 'runner.log'), output.join(''));
  console.log(`Evidence retained at ${runDir}; exit ${process.exitCode || 0}`);
}
