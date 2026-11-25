import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, before, beforeEach, test } from 'node:test';

// An isolated scratch install keeps emulator tooling out of application dependencies.
const require = createRequire(process.env.FIREBASE_RULES_DEPS_DIR
  ? path.join(path.resolve(process.env.FIREBASE_RULES_DEPS_DIR), 'package.json')
  : new URL('../package.json', import.meta.url));
const load = specifier => import(pathToFileURL(require.resolve(specifier)).href);
const { initializeTestEnvironment, assertFails, assertSucceeds } = await load('@firebase/rules-unit-testing');
const { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, updateDoc, deleteDoc, deleteField } = await load('firebase/firestore');
const { ref, uploadBytes, getBytes, getMetadata, updateMetadata, listAll, deleteObject } = await load('firebase/storage');

const projectId = process.env.FIREBASE_RULES_PROJECT_ID || 'demo-ruangjiwa';
assert.match(projectId, /^demo-[a-z0-9-]+$/, 'Only demo projects may run this suite');
function endpoint(name) {
  const value = process.env[name];
  assert.match(value || '', /^127\.0\.0\.1:\d+$/, `${name} must explicitly point to a loopback emulator`);
  const [host, port] = value.split(':');
  return { host, port: Number(port) };
}
const firestore = endpoint('FIRESTORE_EMULATOR_HOST');
const storage = endpoint('FIREBASE_STORAGE_EMULATOR_HOST');
const rulesRoot = new URL('../firebase/', import.meta.url);
let env;
const iso = () => new Date().toISOString();
const future = () => new Date(Date.now() + 86_400_000).toISOString();
const past = () => new Date(Date.now() - 86_400_000).toISOString();
const db = (uid = 'alice') => uid === null ? env.unauthenticatedContext().firestore() : env.authenticatedContext(uid).firestore();
const bucket = (uid = 'alice') => uid === null ? env.unauthenticatedContext().storage() : env.authenticatedContext(uid).storage();
const entries = {
  journals: uid => ({ userId: uid, content: 'A private reflection.', createdAt: iso() }),
  moods: uid => ({ userId: uid, mood: 'neutral', createdAt: iso() }),
  quizHistory: uid => ({ userId: uid, quizType: 'stress', score: 6, category: 'low', takenAt: iso() }),
  consultations: uid => ({ userId: uid, psychologistId: 'psych-1', status: 'pending', scheduledAt: future() }),
};
const edit = { journals: { content: 'An edited private reflection.' }, moods: { mood: 'happy' }, quizHistory: { score: 7, category: 'moderate' }, consultations: { status: 'canceled' } };
const put = (col, data, uid = 'alice', id = 'new') => setDoc(doc(db(uid), col, id), data);
const patch = (col, data, uid = 'alice') => updateDoc(doc(db(uid), col, 'alice-entry'), data);
const image = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
const upload = (uid = 'alice', target = 'profile_images/alice/avatar.jpg', data = image, contentType = 'image/jpeg') => uploadBytes(ref(bucket(uid), target), data, { contentType });

before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { ...firestore, rules: await readFile(process.env.FIREBASE_TEST_FIRESTORE_RULES || new URL('firestore.rules', rulesRoot), 'utf8') },
    storage: { ...storage, rules: await readFile(process.env.FIREBASE_TEST_STORAGE_RULES || new URL('storage.rules', rulesRoot), 'utf8') },
  });
});
after(async () => { if (env) await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async context => {
    const admin = context.firestore();
    for (const [col, build] of Object.entries(entries)) {
      await setDoc(doc(admin, col, 'alice-entry'), build('alice'));
      await setDoc(doc(admin, col, 'bob-entry'), build('bob'));
    }
    await setDoc(doc(admin, 'users', 'alice'), { name: 'Alice', email: 'alice@example.test' });
    await setDoc(doc(admin, 'users', 'bob'), { name: 'Bob' });
    await setDoc(doc(admin, 'psychologists', 'psych-1'), { name: 'Emulator fixture psychologist', specialization: 'Stress' });
    await uploadBytes(ref(context.storage(), 'profile_images/alice/avatar.jpg'), image, { contentType: 'image/jpeg' });
  });
});

for (const [col, build] of Object.entries(entries)) {
  test(`${col}: owner can create and read a valid record`, async () => {
    await assertSucceeds(put(col, build('alice')));
    assert.equal((await assertSucceeds(getDoc(doc(db(), col, 'new')))).data().userId, 'alice');
  });
  test(`${col}: owner-filtered ordered list contains only own records`, async () => {
    const constraints = [where('userId', '==', 'alice')];
    if (col !== 'consultations') constraints.push(orderBy(col === 'quizHistory' ? 'takenAt' : 'createdAt', 'desc'));
    const result = await assertSucceeds(getDocs(query(collection(db(), col), ...constraints)));
    assert.deepEqual(result.docs.map(item => item.id), ['alice-entry']);
  });
  test(`${col}: unfiltered list denied`, async () => {
    await assertFails(getDocs(collection(db(), col)));
  });
  test(`${col}: another owner's query denied`, async () => {
    await assertFails(getDocs(query(collection(db(), col), where('userId', '==', 'bob'))));
  });
  test(`${col}: multi-owner query denied`, async () => {
    await assertFails(getDocs(query(collection(db(), col), where('userId', 'in', ['alice', 'bob']))));
  });
  test(`${col}: another owner's direct read denied`, async () => {
    await assertFails(getDoc(doc(db(), col, 'bob-entry')));
  });
  test(`${col}: unauthenticated read and filtered query denied`, async () => {
    await assertFails(getDoc(doc(db(null), col, 'alice-entry')));
    await assertFails(getDocs(query(collection(db(null), col), where('userId', '==', 'alice'))));
  });
  test(`${col}: unauthenticated create update and delete denied`, async () => {
    await assertFails(put(col, build('alice'), null));
    await assertFails(patch(col, edit[col], null));
    await assertFails(deleteDoc(doc(db(null), col, 'alice-entry')));
  });
  test(`${col}: cross-user create update and delete denied`, async () => {
    await assertFails(put(col, build('bob')));
    await assertFails(patch(col, edit[col], 'bob'));
    await assertFails(deleteDoc(doc(db('bob'), col, 'alice-entry')));
  });
  test(`${col}: owner cannot transfer userId`, async () => {
    await assertFails(patch(col, { userId: 'bob' }));
  });
  test(`${col}: owner cannot remove userId`, async () => {
    await assertFails(patch(col, { userId: deleteField() }));
  });
  test(`${col}: unexpected fields rejected on create and update`, async () => {
    await assertFails(put(col, { ...build('alice'), admin: true }));
    await assertFails(patch(col, { admin: true }));
  });
  test(`${col}: owner can make allowed update`, async () => {
    await assertSucceeds(patch(col, edit[col]));
    const saved = (await getDoc(doc(db(), col, 'alice-entry'))).data();
    for (const [key, value] of Object.entries(edit[col])) assert.equal(saved[key], value);
  });
  if (col !== 'consultations') {
    test(`${col}: owner can delete`, async () => {
      await assertSucceeds(deleteDoc(doc(db(), col, 'alice-entry')));
      // Missing documents have no owner; verify deletion through the test-only bypass.
      await env.withSecurityRulesDisabled(async context => {
        assert.equal((await getDoc(doc(context.firestore(), col, 'alice-entry'))).exists(), false);
      });
    });
  }
}

test('users: owner can create update read and delete explicit profile fields', async () => {
  await assertSucceeds(setDoc(doc(db('carol'), 'users', 'carol'), { name: 'Carol', email: 'carol@example.test', profileImageUrl: 'https://example.test/owner-upload', photoUrl: 'https://example.test/legacy-owner-upload' }));
  await assertSucceeds(updateDoc(doc(db('carol'), 'users', 'carol'), { name: 'Updated Carol' }));
  assert.equal((await getDoc(doc(db('carol'), 'users', 'carol'))).data().name, 'Updated Carol');
  await assertSucceeds(deleteDoc(doc(db('carol'), 'users', 'carol')));
});
test('users: cross-user get create update delete denied', async () => {
  await assertFails(getDoc(doc(db(), 'users', 'bob')));
  await assertFails(setDoc(doc(db(), 'users', 'bob'), { name: 'Impersonation' }));
  await assertFails(updateDoc(doc(db(), 'users', 'bob'), { name: 'Impersonation' }));
  await assertFails(deleteDoc(doc(db(), 'users', 'bob')));
});
test('users: unauthenticated get list create update delete denied', async () => {
  await assertFails(getDoc(doc(db(null), 'users', 'alice')));
  await assertFails(getDocs(collection(db(null), 'users')));
  await assertFails(setDoc(doc(db(null), 'users', 'new'), { name: 'New' }));
  await assertFails(updateDoc(doc(db(null), 'users', 'alice'), { name: 'New' }));
  await assertFails(deleteDoc(doc(db(null), 'users', 'alice')));
});
test('users: profile enumeration denied', async () => {
  await assertFails(getDocs(collection(db(), 'users')));
});
for (const [label, fields] of Object.entries({ role: { role: 'admin' }, userId: { userId: 'bob' }, storedId: { id: 'alice' }, nameType: { name: 1 }, nameLength: { name: 'x'.repeat(101) }, emailType: { email: false }, emailLength: { email: 'x'.repeat(255) }, invalidEmail: { email: 'not-an-email' }, urlScheme: { profileImageUrl: 'javascript:alert(1)' }, urlLength: { photoUrl: `https://${'x'.repeat(2049)}` } })) {
  test(`users: invalid ${label} denied on create and update`, async () => {
    await assertFails(setDoc(doc(db('carol'), 'users', 'carol'), fields));
    await assertFails(updateDoc(doc(db(), 'users', 'alice'), fields));
  });
}

test('users: owned profileImagePath create/update/readback and exact 2048 limit allowed', async () => {
  const path = 'profile_images/alice/avatar.png';
  await assertSucceeds(setDoc(doc(db(), 'users', 'alice'), { name: 'Alice', profileImagePath: path }));
  assert.equal((await getDoc(doc(db(), 'users', 'alice'))).data().profileImagePath, path);
  const limit = 'profile_images/alice/' + 'x'.repeat(2048 - 'profile_images/alice/'.length);
  await assertSucceeds(updateDoc(doc(db(), 'users', 'alice'), { profileImagePath: limit }));
  assert.equal((await getDoc(doc(db(), 'users', 'alice'))).data().profileImagePath.length, 2048);
});
for (const [label, profileImagePath] of Object.entries({ otherOwner: 'profile_images/bob/avatar', nested: 'profile_images/alice/nested/avatar', traversal: 'profile_images/alice/../avatar', encodedSlash: 'profile_images/alice/avatar%2fother', encodedTraversal: 'profile_images/alice/%2e%2e', doubleEncoded: 'profile_images/alice/%252e', url: 'https://example.test/avatar', emptyFilename: 'profile_images/alice/', tooLong: 'profile_images/alice/' + 'x'.repeat(2048), null: null, wrongType: 1 })) {
  test(`users: avatar path ${label} rejected on create and update`, async () => {
    await assertFails(setDoc(doc(db('carol'), 'users', 'carol'), {profileImagePath}));
    await assertFails(updateDoc(doc(db(), 'users', 'alice'), {profileImagePath}));
  });
}
test('users: HTTP legacy URLs still rejected; avatar transition deletes old URL fields only explicitly', async () => {
  await assertFails(updateDoc(doc(db(), 'users', 'alice'), {profileImageUrl: 'http://127.0.0.1:9199/image'}));
  await assertSucceeds(updateDoc(doc(db(), 'users', 'alice'), {profileImageUrl: 'https://example.test/legacy', photoUrl: 'https://example.test/old'}));
  await assertSucceeds(updateDoc(doc(db(), 'users', 'alice'), {profileImagePath: 'profile_images/alice/new', profileImageUrl: deleteField(), photoUrl: deleteField()}));
  const data = (await getDoc(doc(db(), 'users', 'alice'))).data();
  assert.equal(data.profileImagePath, 'profile_images/alice/new');
  assert(!Object.hasOwn(data, 'photoUrl')); assert(!Object.hasOwn(data, 'profileImageUrl'));
});

test('psychologists: authenticated get and list allowed', async () => {
  await assertSucceeds(getDoc(doc(db(), 'psychologists', 'psych-1')));
  await assertSucceeds(getDocs(collection(db(), 'psychologists')));
});
test('psychologists: unauthenticated get and list denied', async () => {
  await assertFails(getDoc(doc(db(null), 'psychologists', 'psych-1')));
  await assertFails(getDocs(collection(db(null), 'psychologists')));
});
for (const uid of ['alice', null, 'claimed-admin']) {
  test(`psychologists: ${uid ?? 'unauthenticated'} client cannot create update or delete`, async () => {
    const client = uid === 'claimed-admin' ? env.authenticatedContext(uid, { admin: true }).firestore() : db(uid);
    await assertFails(setDoc(doc(client, 'psychologists', 'new'), { name: 'Untrusted' }));
    await assertFails(updateDoc(doc(client, 'psychologists', 'psych-1'), { name: 'Untrusted' }));
    await assertFails(deleteDoc(doc(client, 'psychologists', 'psych-1')));
  });
}

test('journals: optional fields and bounded arbitrary text tags accepted', async () => {
  await assertSucceeds(put('journals', { ...entries.journals('alice'), title: 'Reflection', prompt: 'What helped today?', mood: 'very_happy', tags: ['rest', 'support'], isFavorite: true }));
});
const invalidJournals = { short: { content: '123456789' }, whitespace: { content: '          ' }, long: { content: 'x'.repeat(10001) }, contentType: { content: 1 }, titleType: { title: null }, titleLength: { title: 'x'.repeat(161) }, promptLength: { prompt: 'x'.repeat(1001) }, promptType: { prompt: 1 }, moodEnum: { mood: 'ecstatic' }, favoriteType: { isFavorite: 'yes' }, tagsType: { tags: 'rest' }, tagType: { tags: ['rest', 1] }, tagLength: { tags: ['x'.repeat(41)] }, emptyTag: { tags: [''] }, tagsCount: { tags: Array(11).fill('rest') }, lastTagType: { tags: [...Array(9).fill('rest'), 1] }, createdAtType: { createdAt: 1 }, createdAtFormat: { createdAt: 'yesterday' }, impossibleDate: { createdAt: '2026-02-30T10:00:00.000Z' } };
for (const [label, invalid] of Object.entries(invalidJournals)) {
  test(`journals: ${label} denied on create and update`, async () => {
    await assertFails(put('journals', { ...entries.journals('alice'), ...invalid }));
    await assertFails(patch('journals', invalid));
  });
}
test('journals: exact proposed text and tag limits accepted', async () => {
  await assertSucceeds(put('journals', { ...entries.journals('alice'), content: 'x'.repeat(10000), title: 'x'.repeat(160), prompt: 'x'.repeat(1000), tags: Array(10).fill('x'.repeat(40)), isFavorite: false }));
});
for (const mood of ['very_sad', 'sad', 'neutral', 'happy', 'very_happy']) {
  test(`moods: ${mood} enum value accepted`, async () => { await assertSucceeds(put('moods', { ...entries.moods('alice'), mood, note: 'x'.repeat(2000) })); });
}
for (const [label, invalid] of Object.entries({ enum: { mood: 'great' }, moodType: { mood: 1 }, noteType: { note: null }, noteLength: { note: 'x'.repeat(2001) }, dateFormat: { createdAt: '2026-01-01' }, dateType: { createdAt: 1 } })) {
  test(`moods: invalid ${label} denied on create and update`, async () => {
    await assertFails(put('moods', { ...entries.moods('alice'), ...invalid }));
    await assertFails(patch('moods', invalid));
  });
}
for (const quizType of ['stress', 'anxiety']) {
  for (const [score, category] of [[0, 'low'], [6, 'low'], [7, 'moderate'], [12, 'moderate'], [13, 'high'], [15, 'high']]) {
    test(`quizHistory: ${quizType} score ${score} category ${category} accepted`, async () => { await assertSucceeds(put('quizHistory', { ...entries.quizHistory('alice'), quizType, score, category })); });
  }
}
for (const [label, invalid] of Object.entries({ negative: { score: -1 }, aboveMaximum: { score: 16 }, fractional: { score: 6.5 }, scoreType: { score: '6' }, unknownQuiz: { quizType: 'diagnosis' }, unknownCategory: { category: 'severe' }, lowBoundary: { score: 7, category: 'low' }, moderateLower: { score: 6, category: 'moderate' }, moderateUpper: { score: 13, category: 'moderate' }, highBoundary: { score: 12, category: 'high' }, dateType: { takenAt: 1 }, dateFormat: { takenAt: 'yesterday' } })) {
  test(`quizHistory: invalid ${label} denied on create and update`, async () => {
    await assertFails(put('quizHistory', { ...entries.quizHistory('alice'), ...invalid }));
    await assertFails(patch('quizHistory', invalid));
  });
}
for (const col of ['journals', 'moods', 'quizHistory', 'consultations']) {
  test(`${col}: required fields cannot be omitted`, async () => {
    for (const key of Object.keys(entries[col]('alice'))) {
      const data = entries[col]('alice');
      delete data[key];
      await assertFails(put(col, data));
    }
  });
}

test('consultations: pending future UTC ISO booking with optional notes accepted', async () => { await assertSucceeds(put('consultations', { ...entries.consultations('alice'), notes: 'x'.repeat(2000) })); });
for (const status of ['confirmed', 'completed', 'canceled', 'unknown']) {
  test(`consultations: client cannot create ${status} booking`, async () => { await assertFails(put('consultations', { ...entries.consultations('alice'), status })); });
}
for (const [label, invalid] of Object.entries({ past: { scheduledAt: past() }, malformedDate: { scheduledAt: 'tomorrow' }, impossibleDate: { scheduledAt: '2099-02-30T10:00:00.000Z' }, offsetDate: { scheduledAt: '2099-01-01T10:00:00.000+07:00' }, timestampType: { scheduledAt: 1 }, unknownPsychologist: { psychologistId: 'missing' }, emptyPsychologist: { psychologistId: '' }, notesType: { notes: null }, notesLength: { notes: 'x'.repeat(2001) } })) {
  test(`consultations: invalid ${label} booking denied`, async () => { await assertFails(put('consultations', { ...entries.consultations('alice'), ...invalid })); });
}
for (const [label, invalid] of Object.entries({ psychologist: { psychologistId: 'psych-2' }, schedule: { scheduledAt: new Date(Date.now() + 172_800_000).toISOString() }, confirm: { status: 'confirmed' }, complete: { status: 'completed' }, notes: { notes: 'changed' } })) {
  test(`consultations: owner cannot alter ${label} even while canceling`, async () => { await assertFails(patch('consultations', { status: 'canceled', ...invalid })); });
}
test('consultations: owner cannot delete', async () => { await assertFails(deleteDoc(doc(db(), 'consultations', 'alice-entry'))); });
test('consultations: canceled booking cannot be reopened or updated', async () => {
  await assertSucceeds(patch('consultations', { status: 'canceled' }));
  await assertFails(patch('consultations', { status: 'pending' }));
  await assertFails(patch('consultations', { status: 'canceled' }));
});
for (const status of ['confirmed', 'completed']) {
  test(`consultations: owner cannot cancel ${status} backend state`, async () => {
    await env.withSecurityRulesDisabled(context => updateDoc(doc(context.firestore(), 'consultations', 'alice-entry'), { status }));
    await assertFails(patch('consultations', { status: 'canceled' }));
  });
}
test('legacy optional fields: owner reads retained; unexpected legacy fields block writes', async () => {
  await env.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'journals', 'alice-entry'), { ...entries.journals('alice'), legacyUnknown: 'needs migration' }));
  await assertSucceeds(getDoc(doc(db(), 'journals', 'alice-entry')));
  await assertFails(patch('journals', { isFavorite: true }));
});
test('default deny: unknown collection and nested documents private', async () => {
  for (const uid of ['alice', null]) {
    await assertFails(setDoc(doc(db(uid), 'unrecognized', 'entry'), { userId: 'alice' }));
    await assertFails(getDoc(doc(db(uid), 'unrecognized', 'entry')));
    await assertFails(getDocs(collection(db(uid), 'unrecognized')));
    await assertFails(setDoc(doc(db(uid), 'users', 'alice', 'private', 'entry'), { value: true }));
    await assertFails(getDoc(doc(db(uid), 'users', 'alice', 'private', 'entry')));
  }
});

for (const contentType of ['image/jpeg', 'image/png', 'image/webp']) {
  test(`storage: owner ${contentType} upload and authenticated read allowed`, async () => {
    await assertSucceeds(upload('alice', 'profile_images/alice/new-image', image, contentType));
    assert.deepEqual(new Uint8Array(await assertSucceeds(getBytes(ref(bucket(), 'profile_images/alice/new-image')))), image);
    await assertSucceeds(getMetadata(ref(bucket(), 'profile_images/alice/new-image')));
  });
}
test('storage: owner replacement metadata update list and delete allowed', async () => {
  await assertSucceeds(upload());
  await assertSucceeds(updateMetadata(ref(bucket(), 'profile_images/alice/avatar.jpg'), { contentType: 'image/png' }));
  await assertSucceeds(listAll(ref(bucket(), 'profile_images/alice')));
  await assertSucceeds(deleteObject(ref(bucket(), 'profile_images/alice/avatar.jpg')));
});
for (const uid of ['bob', null]) {
  test(`storage: ${uid ?? 'unauthenticated'} upload read metadata list replace and delete denied`, async () => {
    await assertFails(upload(uid));
    await assertFails(getBytes(ref(bucket(uid), 'profile_images/alice/avatar.jpg')));
    await assertFails(getMetadata(ref(bucket(uid), 'profile_images/alice/avatar.jpg')));
    await assertFails(updateMetadata(ref(bucket(uid), 'profile_images/alice/avatar.jpg'), { contentType: 'image/png' }));
    await assertFails(listAll(ref(bucket(uid), 'profile_images/alice')));
    await assertFails(deleteObject(ref(bucket(uid), 'profile_images/alice/avatar.jpg')));
  });
}
for (const contentType of ['image/svg+xml', 'text/plain', 'application/octet-stream', 'image/gif']) {
  test(`storage: owner ${contentType} upload denied`, async () => { await assertFails(upload('alice', 'profile_images/alice/new-image', image, contentType)); });
}
test('storage: owner cannot change metadata to a disallowed MIME type', async () => { await assertFails(updateMetadata(ref(bucket(), 'profile_images/alice/avatar.jpg'), { contentType: 'text/html' })); });
test('storage: exactly 5 MiB accepted; one byte over denied', async () => {
  await assertSucceeds(upload('alice', 'profile_images/alice/maximum', new Uint8Array(5 * 1024 * 1024)));
  await assertFails(upload('alice', 'profile_images/alice/oversize', new Uint8Array(5 * 1024 * 1024 + 1)));
});
test('storage: unknown paths nested paths and parent enumeration denied', async () => {
  for (const target of ['other/alice/avatar.jpg', 'profile_images/alice/nested/avatar.jpg', 'profile_images/avatar.jpg']) await assertFails(upload('alice', target));
  await assertFails(listAll(ref(bucket(), 'profile_images')));
  await assertFails(listAll(ref(bucket(), '')));
});
