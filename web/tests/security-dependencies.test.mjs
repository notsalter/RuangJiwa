import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const firestoreRequire = createRequire(require.resolve('@firebase/firestore'));
const workboxRequire = createRequire(require.resolve('workbox-build'));
const globRequire = createRequire(workboxRequire.resolve('glob'));

function atLeast(version, minimum) {
  const actual = version.split('.').map(Number);
  const expected = minimum.split('.').map(Number);
  for (let index = 0; index < 3; index++) {
    if (actual[index] !== expected[index]) return actual[index] > expected[index];
  }
  return true;
}

test('Firestore resolves a gRPC release patched for both auth-context advisory ranges', () => {
  const version = firestoreRequire('@grpc/grpc-js/package.json').version;
  assert.ok(atLeast(version, '1.14.5'), `gRPC ${version} is below patched 1.14.5`);
});

test('Workbox resolves glob after the cancellation fix', () => {
  const version = workboxRequire('glob/package.json').version;
  assert.ok(atLeast(version, '14.0.2'), `glob ${version} is below patched 14.0.2`);
});

test('Workbox glob resolves minimatch after the amplification fix', () => {
  const version = globRequire('minimatch/package.json').version;
  assert.ok(atLeast(version, '11.0.1'), `minimatch ${version} is below patched 11.0.1`);
});

test('updated gRPC preserves a local unary request/response round trip', async () => {
  const grpc = firestoreRequire('@grpc/grpc-js');
  const method = {
    path: '/Compatibility/Echo', requestStream: false, responseStream: false,
    requestSerialize: value => Buffer.from(value), requestDeserialize: value => value.toString(),
    responseSerialize: value => Buffer.from(value), responseDeserialize: value => value.toString(),
  };
  const server = new grpc.Server();
  server.addService({ echo: method }, { echo: (call, callback) => callback(null, call.request) });
  const port = await new Promise((resolve, reject) => {
    server.bindAsync('127.0.0.1:0', grpc.ServerCredentials.createInsecure(), (error, value) => {
      if (error) reject(error); else resolve(value);
    });
  });
  if (!atLeast(firestoreRequire('@grpc/grpc-js/package.json').version, '1.10.0')) server.start();
  const Client = grpc.makeGenericClientConstructor({ echo: method }, 'Compatibility');
  const client = new Client(`127.0.0.1:${port}`, grpc.credentials.createInsecure());
  try {
    const result = await new Promise((resolve, reject) => {
      client.echo('compatibility-test', { deadline: Date.now() + 5000 }, (error, value) => {
        if (error) reject(error); else resolve(value);
      });
    });
    assert.equal(result, 'compatibility-test');
  } finally {
    client.close();
    server.forceShutdown();
  }
});

test('updated glob and minimatch preserve Workbox shell asset enumeration', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ruangjiwa-workbox-'));
  try {
    await mkdir(join(root, 'assets'));
    await writeFile(join(root, 'index.html'), '<!doctype html><title>RuangJiwa</title>');
    await writeFile(join(root, 'assets', 'app.js'), 'export const app = true;');
    await writeFile(join(root, 'assets', 'app.css'), 'body { color: black; }');
    const { globSync } = workboxRequire('glob');
    assert.deepEqual(globSync('**/*.{html,js,css}', { cwd: root }).sort(), [
      'assets/app.css', 'assets/app.js', 'index.html',
    ]);
    const { minimatch } = globRequire('minimatch');
    assert.ok(minimatch('assets/app.js', '**/*.{html,js,css}'));
    assert.equal(minimatch('private.json', '**/*.{html,js,css}'), false);
    const { generateSW } = workboxRequire('workbox-build');
    const result = await generateSW({
      globDirectory: root,
      globPatterns: ['**/*.{html,js,css}'],
      swDest: join(root, 'sw.js'),
      navigateFallback: '/index.html',
    });
    assert.equal(result.count, 3);
    assert.deepEqual(result.warnings, []);
    const worker = await readFile(join(root, 'sw.js'), 'utf8');
    for (const path of ['index.html', 'assets/app.js', 'assets/app.css']) {
      assert.ok(worker.includes(path), `Missing ${path} in generated precache`);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
