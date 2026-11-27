# RuangJiwa: web/PWA migration record

Tracking issue: [#1](https://github.com/notsalter/RuangJiwa/issues/1).

The app lives in `web/`, with an optional self-hosted API in `server/`. The legacy Expo app has been retired; its last revision is tagged `legacy/expo-app`. Nothing is deployed.

## What was built

- Vite, Preact, TypeScript, vanilla CSS and system fonts. No UI, chart, icon, state or query library was added for the migrated features.
- Native History API routing that works at `/` and under a subpath such as `/RuangJiwa/`.
- A static-shell service worker: offline app shell only, never private data. Updates ask for consent, and an unsaved journal draft blocks reload.
- A pluggable `Backend` interface: Firebase (default) or the self-hosted HTTP API (`VITE_BACKEND=http`).
- Reminders export `.ics` calendar files. There is no push scheduler.
- Indonesian content. English currently covers navigation labels only.

## Merged history

| Milestone | PR |
| --- | --- |
| Web scaffold, manifest, icons, CI | [#2](https://github.com/notsalter/RuangJiwa/pull/2) |
| Scoped web dependency remediation | [#3](https://github.com/notsalter/RuangJiwa/pull/3) |
| Session, auth, five tab shell, Home | [#4](https://github.com/notsalter/RuangJiwa/pull/4) |
| Mood, journal and calendar export | [#5](https://github.com/notsalter/RuangJiwa/pull/5) |
| Quizzes, consultations, profile, recommendations | [#6](https://github.com/notsalter/RuangJiwa/pull/6) |
| Proposed Firebase owner rules and denial tests | [#7](https://github.com/notsalter/RuangJiwa/pull/7) |
| Adapter validation, mood clearing, verified deletion | [#8](https://github.com/notsalter/RuangJiwa/pull/8) |
| Form limits and pending only cancellation | [#14](https://github.com/notsalter/RuangJiwa/pull/14) |
| PWA install, updates, history safeguards | [#15](https://github.com/notsalter/RuangJiwa/pull/15) |
| Authenticated avatar rendering | [#16](https://github.com/notsalter/RuangJiwa/pull/16) |
| Hosting options and migration status docs | [#17](https://github.com/notsalter/RuangJiwa/pull/17) |
| Self-hosted Better Auth SQLite API | [#18](https://github.com/notsalter/RuangJiwa/pull/18) |
| README and migration record rewrite | [#19](https://github.com/notsalter/RuangJiwa/pull/19) |
| Unused files, IDE state and dead dependency removed | [#20](https://github.com/notsalter/RuangJiwa/pull/20) |
| Status record refreshed | [#21](https://github.com/notsalter/RuangJiwa/pull/21) |

Closed without merge, kept as evidence: #9, #10, #11, #12, #13 were superseded by the #14 to #16 milestones.

## Current verification

- Web: 222 unit/component tests, 5 dependency tests, 5 PWA policy tests, typecheck, builds at `/` and `/RuangJiwa/`, and an audit with 0 vulnerabilities.
- Firebase backend: a 14 case real browser suite was run against local emulators while the harness existed; it needed a runner that was never committed, so the suite is not part of the repository. Mood clearing and journal deletion verified actual stored state, and two avatar cases documented the residual risk described below.
- Proposed Firebase rules: 172 emulator tests. The rules are in the repository, not deployed.
- Self-hosted backend: 6 server route/auth tests, real `/api/health` and unauthenticated `401` smoke checks, TypeScript build, audit with 0 vulnerabilities. The adapter adds 8 tests on the web side.

Green CI for `web/**` covers typecheck, tests and builds. It does not test production Firebase, hosting, or real devices.

## Decisions on record

- Owner chose client-only avatar rendering with authenticated reads and explicitly accepted the residual download token risk. A token URL stays readable by anyone holding it.
- Owner chose Better Auth for the self-hosted path. There were no existing users, so no account migration is required.

## Open items before any promotion

- Hosting and TLS are not chosen, and deployment is not approved.
- Firebase production configuration, deployed rules, IAM, CORS and privacy policy are unreviewed.
- The historical Google API key alert is still open. Deleting a literal is not revocation.
- GitGuardian incident 41107195 concerns an old deterministic test fixture. The current test generates a per-run credential.
- Real device installation (iOS Safari, Android Chrome) is unverified.
- The legacy Expo app is gone from the tree. Restore it from the `legacy/expo-app` tag if the native path is ever resumed.
