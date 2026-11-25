# RuangJiwa web

Lightweight Preact application. Run commands from `web/`, not the legacy Expo root.

```sh
npm ci
npm run dev
npm run check
npm run test:coverage
```

`npm run check` typechecks, runs unit/component tests and builds the PWA shell. Firebase SDK modules load lazily. Firestore Lite performs one-shot online queries with no Firestore IndexedDB cache. The service worker caches static application assets, not private Firebase responses.

## Backend configuration

Copy `.env.example` to a git-ignored `.env` and supply the Firebase web identifiers. Without complete configuration, login is visibly unavailable but the application still opens. There is no guest backend, seeded doctor or production credential.

Deploying requires email/password Auth, Firestore and Storage, appropriate authorized domains, owner-restricting Firestore/Storage rules and an operator privacy policy. Rules and production configuration were absent from the source. Client checks are defense in depth, never a substitute for backend rules. Production connectivity is not verified.

Optional local emulator integration requires both `VITE_FIREBASE_EMULATORS=true` and `VITE_FIREBASE_PROJECT_ID=demo-ruangjiwa`, plus all normal Firebase identifiers. This exact opt-in connects Auth at `127.0.0.1:9099`, Firestore at `127.0.0.1:8085` and Storage at `127.0.0.1:9199`. It must not be enabled for deployment. No emulator or fake backend is automatically started.

## Preserved features

Email login/registration, profile name/photo editing (Auth plus users/Storage), readonly current Auth email and password reset; journal create/read/edit/delete with prompts/moods/tags/favorites/search; mood entry/full history and 14-point chart; both original informal quizzes and quizHistory; Firebase psychologist directory/detail; future consultation requests, history and cancellation; Home greeting/last mood/next active consultation. Existing collection names and ISO timestamp field names are retained.

Mood reminders and confirmed future consultation reminders export `.ics` calendar files. Importing and allowing alerts in the calendar application is the user's responsibility. There is no web push backend or startup notification permission request.

## Boundaries

Private query state is in memory only and is cleared synchronously when the account changes, logout begins or the browser goes offline. Late query/mutation results cannot populate a different account's state. A server write already dispatched before logout cannot be recalled.

Indonesian is the content language. The language selector currently translates navigation only and explicitly labels the limited English scope.

The install prompt and service-worker update policy are maintained separately. Do not infer background reminder support from installation.
