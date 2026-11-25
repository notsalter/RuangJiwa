import { access, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (args.some(arg => arg !== '--red') || args.length > 1) {
  throw new Error('Usage: node web/firebase/run-rules-tests.mjs [--red]');
}
const red = args.includes('--red');
const root = path.dirname(fileURLToPath(import.meta.url));
const scratch = path.resolve(process.env.FIREBASE_RULES_SCRATCH_DIR || path.join(homedir(), '.hermes/cache/scratch'));
if (scratch === '/tmp' || scratch.startsWith('/tmp/')) throw new Error('Use a cache/scratch directory, not /tmp');
const runDir = await mkdtemp(path.join(scratch, 'ruangjiwa-rules-'));
const depsDir = process.env.FIREBASE_RULES_DEPS_DIR;
const require = createRequire(depsDir ? path.join(path.resolve(depsDir), 'package.json') : new URL('../package.json', import.meta.url));
const cli = process.env.FIREBASE_TOOLS_CLI || require.resolve('firebase-tools/lib/bin/firebase.js');
await access(cli);
let config = path.join(root, 'firebase.test.json');
const env = { ...process.env, TMPDIR: runDir, FIREBASE_RULES_PROJECT_ID: 'demo-ruangjiwa', FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true' };
for (const key of ['GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_TOKEN', 'GCLOUD_PROJECT', 'GOOGLE_CLOUD_PROJECT', 'FIREBASE_TEST_FIRESTORE_RULES', 'FIREBASE_TEST_STORAGE_RULES']) delete env[key];
if (red) {
  env.FIREBASE_TEST_FIRESTORE_RULES = path.join(runDir, 'permissive-firestore.rules');
  env.FIREBASE_TEST_STORAGE_RULES = path.join(runDir, 'permissive-storage.rules');
  await writeFile(env.FIREBASE_TEST_FIRESTORE_RULES, "rules_version = '2'; service cloud.firestore { match /databases/{db}/documents { match /{document=**} { allow read, write: if true; } } }\n");
  await writeFile(env.FIREBASE_TEST_STORAGE_RULES, "rules_version = '2'; service firebase.storage { match /b/{bucket}/o { match /{path=**} { allow read, write: if true; } } }\n");
  const baseline = JSON.parse(await readFile(config, 'utf8'));
  baseline.firestore.rules = env.FIREBASE_TEST_FIRESTORE_RULES;
  baseline.storage.rules = env.FIREBASE_TEST_STORAGE_RULES;
  config = path.join(runDir, 'firebase.red.json');
  await writeFile(config, `${JSON.stringify(baseline, null, 2)}\n`);
}
const quote = value => `'${value.replaceAll("'", "'\\''")}'`;
const command = `${quote(process.execPath)} --test --test-concurrency=1 ${quote(path.resolve(root, '../tests/firebase-rules.test.mjs'))}`;
console.log(`${red ? 'RED baseline (expected failures)' : 'Recommended rules'}; demo project only; artifacts: ${runDir}`);
const child = spawn(process.execPath, [cli, 'emulators:exec', '--project', 'demo-ruangjiwa', '--config', config, '--only', 'firestore,storage', command], { cwd: runDir, env, stdio: 'inherit' });
child.on('error', error => { console.error(error); process.exitCode = 1; });
child.on('exit', (code, signal) => {
  if (signal) console.error(`Emulator runner terminated by ${signal}`);
  process.exitCode = code ?? 1;
});
