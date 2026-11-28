# RuangJiwa web

Lightweight Preact application. Run every command from `web/`.

```sh
npm ci
npm run dev
npm run check
npm run test:coverage
```

`npm run check` typechecks, runs unit/component tests and builds the PWA shell. Firebase SDK modules load lazily. Firestore Lite performs one-shot online queries with no Firestore IndexedDB cache. The service worker caches static application assets, not private Firebase responses.

## Backend configuration

Copy `.env.example` to a git-ignored `.env` and supply the Firebase web identifiers. Without complete configuration, login is visibly unavailable but the application still opens. There is no guest backend, seeded doctor or production credential.

Deploying requires email/password Auth, Firestore and Storage, appropriate authorized domains, reviewed enforcement rules and an operator privacy policy. Proposed rules are recorded in #7, but have not been deployed. Client validation is defense in depth, never a substitute for backend rules. Production connectivity, IAM/CORS and private avatar delivery remain unverified; see `../MIGRATION.md`.

Optional local emulator integration requires both `VITE_FIREBASE_EMULATORS=true` and `VITE_FIREBASE_PROJECT_ID=demo-ruangjiwa`, plus all normal Firebase identifiers. This exact opt-in connects Auth at `127.0.0.1:9099`, Firestore at `127.0.0.1:8085` and Storage at `127.0.0.1:9199`. It must not be enabled for deployment. No emulator or fake backend is automatically started.

### Self-hosted backend

Set `VITE_BACKEND=http` and `VITE_API_URL` to use the API in `../server` instead of Firebase. Sessions are HTTP only cookies, so no token is stored in the browser. The adapter maps server status codes to stable application errors, including `501 auth/reset-not-configured` until email delivery is configured. See `../server/README.md`.

## Preserved features

Email login/registration, readonly Auth email and password reset; journal create/read/edit/delete with prompts/moods/tags/favorites/search; mood entry/history and a 14-point chart; both original informal quizzes and quizHistory; Firebase psychologist directory/detail; future consultation requests, history and pending-only cancellation; Home greeting/last mood/next active consultation. Existing collection names and ISO timestamp field names are retained. Strict validation requires a compatibility review for legacy records.

Profile name editing passes browser persistence tests. Avatar upload and display are implemented; the owner decision and its residual risk are recorded below. The presence of the UI is not a privacy guarantee.

Mood reminders and confirmed future consultation reminders export `.ics` calendar files. Importing and allowing alerts in the calendar application is the user's responsibility. There is no web push backend or startup notification permission request.

## Avatar delivery decision

The owner explicitly chose to keep lightweight client-only avatar uploads with authenticated rendering and accepted the residual download-token link risk. This is not a strict-private raw-object design, a token-risk remediation, or authorization to deploy rules, rotate tokens, introduce a backend or disable uploads.

New uploads persist only `users/{uid}.profileImagePath` as `profile_images/{uid}/{single-filename}`. Storage is lazy, and authenticated SDK metadata plus bounded `getBlob` reads validate JPEG/PNG/WebP and nonempty size at most 5 MiB. The profile image uses a trusted generated `blob:` URL, separate from the unchanged general URL sanitizer. URLs are revoked on replacement, logout, account switch, offline transition, image decode failure and unmount; stale reads cannot restore a previous view. Private images are not service-worker cache entries.

Name-only saves preserve existing Auth `photoURL` and Firestore legacy URL fields. Reading a legacy link only derives an owned path for the configured Firebase bucket; it never fetches arbitrary third-party URLs. Selecting a new photo is the explicit transition: Auth receives the name and an empty photo URL only when clearing an existing URL, and Firestore deletes `profileImageUrl`/`photoUrl` using `deleteField` while saving the path. No automatic legacy deletion or token revocation occurs. Unrecognized legacy URLs no longer render in the web profile.

Storage, Auth and Firestore are not atomic. Success requires uploaded-byte readback, Auth name/no durable URL, and Firestore path/field-deletion readback. A partial failure is visibly labeled unverified; the selected file remains for retry. Failed attempts can leave orphaned Storage objects and there is no automatic cleanup here.

Authenticated SDK cross-user/guest denials do not stop a holder of a Firebase download token. Local emulator probes still return HTTP 200 and matching image bytes for an unauthenticated token-bearing request. Existing bearer links are not revoked by changing fields. Production bucket CORS for authenticated reads, IAM, deployed rules and token behavior remain unverified and require separate operator review.

## Boundaries

Private query state is in memory only and is cleared synchronously when the account changes, logout begins or the browser goes offline. Late query/mutation results cannot populate a different account's state. A server write already dispatched before logout cannot be recalled.

Indonesian is the content language. The language selector currently translates navigation only and explicitly labels the limited English scope.

The install prompt and service-worker update policy are maintained separately. Do not infer background reminder support from installation.

## Docs

- [Setup and deployment](../docs/SETUP.md) - commands, environment variables, hosting
- [PWA](../docs/PWA.md) - service worker caching, install and update policy
- [Avatars](../docs/AVATARS.md) - avatar delivery and the accepted token risk
- [Firebase rules](../docs/FIREBASE_RULES.md) - proposed owner rules and how to run them
- [Design](../docs/DESIGN.md) - visual and interaction decisions
- [Testing](../docs/TESTING.md) and [test evidence](../docs/TEST_EVIDENCE.md) - the gate and how each test was driven red then green
- [Documentation index](../docs/README.md) - every document in the repository
