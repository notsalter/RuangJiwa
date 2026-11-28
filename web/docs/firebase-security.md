# Proposed Firebase security rules (local recommendation only)

**These files are not deployed rules. Production Firebase configuration, deployed rules, IAM, existing documents, download tokens, and administrator authorization were unavailable. Nothing here establishes that the live application or backend protects personal data.** No Firebase deploy, production data access, GitHub write, or alert closure is part of this work.

## Files and local boundaries

- `web/firebase/firestore.rules`: proposed default-deny Firestore policy.
- `web/firebase/storage.rules`: proposed owner-only profile-image policy.
- `web/firebase/firebase.json`: browser integration emulator configuration, project `demo-ruangjiwa`, Auth `127.0.0.1:9099`, Firestore `127.0.0.1:8085`, Storage `127.0.0.1:9199`, UI disabled.
- `web/firebase/firebase.test.json`: isolated rules-test configuration, Firestore `127.0.0.1:8185`, Storage `127.0.0.1:9299`, hub `4485`, logging `4585`, Firestore websocket `9185`, all loopback, UI disabled.
- `web/firebase/run-rules-tests.mjs`: starts and stops the real Emulator Suite; writes logs and optional RED baseline only in cache/scratch; fixes the project to `demo-ruangjiwa` and excludes credential environment variables.
- `web/tests/firebase-rules.test.mjs`: real SDK requests against the local emulators, with test-only authenticated/unauthenticated contexts and fixture seeding. No production fixtures are copied. Mock authentication contexts are supported by the rules-unit-testing library; they test authorization, not the real sign-in UI.[1]

The suite refuses non-`demo-*` projects and missing/non-loopback Firestore/Storage endpoints. It clears the chosen demo project's Firestore and Storage before each test. **Do not run it against a shared interactive emulator session whose data must be retained.** The runner uses separate test ports. The initial dependency install and emulator-binary downloads require registry/artifact network access; tested database and image operations use local emulators only.

## Schema evidence and proposed policy

Repository evidence: [`core/types.ts`](../src/core/types.ts), [`services/records.ts`](../src/services/records.ts), [`features/quiz.ts`](../src/features/quiz.ts), [`pages/Journal.tsx`](../src/pages/Journal.tsx), and [`pages/Consultations.tsx`](../src/pages/Consultations.tsx). The legacy Expo files these replaced were removed in #22 and remain available at the `legacy/expo-app` tag. `id` is populated from document paths by the record services and is **not** an allowed stored field. The owner field is exactly `userId`, not `ownerId`.

| Collection | Proposed read/list | Proposed client writes |
| --- | --- | --- |
| `users/{uid}` | Authenticated UID equals document path; no profile enumeration | Same UID may create/update only `name`, `email`, `profileImageUrl`, `photoUrl`; delete own profile |
| `journals` | Existing document `userId` equals authenticated UID; list must constrain ownership | Own create/update/delete; ownership immutable; strict full resulting-document validation |
| `moods` | Same owner boundary | Own create/update/delete; ownership immutable; strict validation |
| `quizHistory` | Same owner boundary | Own create/update/delete; ownership immutable; strict validation |
| `consultations` | Same owner boundary | Own create only `pending`, existing psychologist, future schedule; update only `pending` → `canceled`; no delete |
| `psychologists` | Authenticated get/list only | All client create/update/delete denied, including an `admin: true` claim; provisioning requires separately authorized backend/IAM |
| Any other collection/subcollection | Denied | Denied |

Lists of personal records must include `where('userId', '==', authenticatedUid)`; existing ordered journal/mood/quiz queries are tested. Rules reject unfiltered, other-user, and multi-user lists rather than returning a filtered subset.[2]

### Validation contract

Absent optional fields are accepted; present fields must have the specified types. `null` is not a substitute for omission. Unknown fields on the resulting document block writes, including merge updates. Optional legacy `photoUrl` and current `profileImageUrl` are both recognized.

- **Users:** optional name ≤100 characters; email ≤254 characters with a basic email-shape check; each photo URL ≤2048 characters and HTTPS. An email field is user-supplied profile text, not authentication or a verified identity. URL validation does not prove image ownership, existence, or safe remote content.
- **Journals:** require `userId`, `content`, `createdAt`; trimmed content ≥10 and raw content ≤10,000 characters. Optional title ≤160; prompt ≤1,000; `mood` must match the enum below; `isFavorite` boolean. Optional tags: at most 10 nonempty strings, each ≤40 characters. Arbitrary bounded text tags are allowed; no tag vocabulary exists in the inspected model.
- **Moods:** require `userId`, `mood`, `createdAt`; optional note ≤2,000 characters. Mood enum: `very_sad`, `sad`, `neutral`, `happy`, `very_happy`.
- **Quiz history:** require `userId`, `quizType`, `score`, `category`, `takenAt`. Only `stress`/`anxiety`; integer score 0–15. Both current quiz definitions contain five questions, each option worth 0–3. Category must agree with score: `low` 0–6, `moderate` 7–12, `high` 13–15. The source's shared `high` category extends to 100, but the inspected quizzes cannot produce a score above 15. This validates self-reported consistency, not clinical correctness or an independently trusted assessment.
- **Consultations:** require `userId`, `psychologistId`, `status`, `scheduledAt`; optional notes ≤2,000 characters. Psychologist ID is a nonempty slash-free string ≤128 characters and must exist at creation. Client creates must be `pending`. Schedule must be strictly later than rules `request.time`. Owner updates may affect **only** `status`, and only `pending` → `canceled`; `userId`, `psychologistId`, `scheduledAt`, notes, and all other fields remain immutable. No client confirmation/completion, reopening, or cancellation of backend-confirmed/completed records. Rules do not reserve slots, verify practitioner credentials, or prevent duplicate bookings.
- **Dates:** use canonical UTC `YYYY-MM-DDTHH:mm:ss.SSSZ` strings, matching the existing clients' `new Date().toISOString()`, not Firestore Timestamp fields or offset strings. Shape and calendar date are checked; consultation time is constructed from the string and compared with server request time. Consultation cancellation does not require a still-future schedule.

All maximum lengths and tag bounds above are **proposed limits**, not discovered production constraints. Journal minimum content length, mood values, field names, quiz choices/category boundaries, and string timestamp representation come from the inspected source.

### Storage contract and limits

Only `profile_images/{uid}/{filename}` is client-accessible. Authenticated path owner may get/list/delete; create, replace, and metadata updates require MIME type `image/jpeg`, `image/png`, or `image/webp`, and size **≤5 MiB (5 × 1024 × 1024 bytes)**. Other users and unauthenticated clients cannot read, enumerate, upload, replace, alter metadata, or delete. Unknown/nested paths and parent enumeration are denied. Firebase Storage rules can validate object size/content-type metadata; this suite tests those controls.[3]

MIME metadata is not byte-level image inspection. The fixtures are small synthetic binary data, not external or generated-person images. A malicious file can claim an allowed MIME type; production may need trusted image decoding/re-encoding, malware checks, and metadata stripping.

**Existing tokenized Firebase download URLs or public bucket IAM/ACL exposure are outside these tests.** A reusable download URL can act as a bearer link; the legacy `getDownloadURL()` flow and stored profile URLs therefore need explicit owner review before promising private image delivery. Prefer authenticated SDK byte/blob retrieval for private images. Revoke/migrate existing shareable tokens and audit IAM as appropriate; these rules alone do not establish the privacy of old links. Do not replace user photos with external/generated people.

## Compatibility and deployment gate

Owner reads do not apply new schema validation, so readable legacy records remain readable if they have the correct owner. An unknown legacy field or incompatible optional field can block updates under these strict rules. Owner deletes of journals/moods/quiz history are allowed even if legacy validation fails; consultation deletes are never client-allowed. A missing personal document has no owner, so direct get is denied instead of promising an empty result.

Known source incompatibility: the legacy booking screen writes `scheduledAt: new Date().toISOString()` at submission, which is no longer future by server evaluation and is intentionally rejected. `scheduledAt` is optional in the old TypeScript interface but required here. Null-valued legacy optional fields, stored IDs, noncanonical dates, existing role/metadata fields, or other unknown production schemas may require migration or a separately reviewed compatibility policy. The legacy journal payload also uses JavaScript `undefined` for absent fields; clients must omit them before serialization.

**Before anyone deploys:** the authorized project owner must inspect the actual deployed rules/configuration and representative data, review these limits and the known incompatibilities, plan any migration/backfill, verify client payloads/query indexes and profile image delivery, define trusted practitioner/consultation administration, audit IAM/download tokens, and rerun emulator plus full browser integration tests. This work contains no deploy command and no production project alias. Client memory-only handling is a separate frontend requirement; Firebase rules do not enforce browser storage behavior.

## Reproduce real local tests

Run from the repository root. Dependencies are deliberately separate from the application package and lockfile. Verified versions: Node `26.12.1`, Java `21.0.13.1`, Firebase CLI `15.37.0`, `@firebase/rules-unit-testing` `6.0.0`, Firebase JS `13.4.0`. The scratch dependency package pins the security overrides `@grpc/grpc-js` `1.14.7`, `glob` `14.0.6`, `minimatch` `11.0.9`; npm audit reported zero vulnerabilities for that test-only dependency graph at execution time.

For the provided local tool installation:

```sh
export FIREBASE_RULES_DEPS_DIR=/root/.hermes/cache/scratch/ruangjiwa-rules-tools
export FIREBASE_TOOLS_CLI=/root/.hermes/cache/scratch/ruangjiwa-browser-tools/node_modules/firebase-tools/lib/bin/firebase.js
node web/firebase/run-rules-tests.mjs --red  # intentionally fails: permissive scratch-only baseline
node web/firebase/run-rules-tests.mjs        # proposed rules must pass
```

On another machine, create a **separate cache/scratch package**, pin those versions (and overrides) there, and set the two variables to its package directory and Firebase CLI file. Do not add emulator dependencies to the application's package/lockfile merely to run these tests. `FIREBASE_RULES_SCRATCH_DIR` may override the log/baseline artifact directory; `/tmp` is rejected. The RED switch never replaces repository rules and deliberately preserves a nonzero exit status.

For later browser integration, start the full configuration with the same explicit demo project and connect the frontend SDKs to its loopback ports **before any backend request**:

```sh
node "$FIREBASE_TOOLS_CLI" emulators:start --project demo-ruangjiwa \
  --config web/firebase/firebase.json --only auth,firestore,storage
```

### Executed evidence

- Strict TDD: tests were written and exercised before repository rules. Intentional permissive rules existed only in scratch. First RED execution: **172 tests, 41 passed, 131 failed**, all 131 failures reporting `Expected request to fail, but it succeeded`. The checked-in runner reproduced the same RED outcome.
- GREEN using the checked-in runner: **172 tests passed, 0 failed, 0 skipped**, real Firestore/Storage Emulator Suite, exit code 0. Coverage includes ownership reads/lists/CRUD, unauthenticated and cross-user operations, ownership changes/removal, unexpected fields, all quiz boundary values, text/tag/type limits, booking escalation/immutability/future-time denials, default-deny paths, and image MIME/size/metadata/read/list controls.
- Local transcript paths: `/root/.hermes/cache/scratch/ruangjiwa-rules-run/red.log`, `red-runner.log`, `green-runner.log`. Runner prints the separate per-run emulator artifact directory. Expected permission-denied SDK logs are retained rather than hidden.
- Full browser emulator configuration was started separately and its hub read back: Auth `127.0.0.1:9099`, Firestore `127.0.0.1:8085`, Storage `127.0.0.1:9199`; startup/check/shutdown exit code 0. This is configuration smoke verification, not a browser feature test.
- Staged Gitleaks scan: zero findings. Offline Semgrep JS eval seed rule: positive/negative fixture test passed, both new JavaScript files scanned, zero findings/errors. Firestore/Storage rules require manual review and actual emulator validation; this limited SAST rule does not understand Firebase authorization.
- Existing `web/tests/security-dependencies.test.mjs` could not run in this worktree because application dependencies (`@firebase/firestore`) are not installed. Application manifests/lockfiles were left untouched; the separate scratch test dependency graph was installed/audited and the real rules suite passed.
- No production authorization, deployment, actual sign-in UI, real user data, private download-token revocation, IAM, or production index verification was performed.

## Sources

[1] https://firebase.google.com/docs/rules/unit-tests
[2] https://firebase.google.com/docs/firestore/security/rules-query
[3] https://firebase.google.com/docs/storage/security/rules-conditions
