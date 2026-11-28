# Migration record

How the RuangJiwa rewrite was delivered, what is verified, and what is still open. Tracking issue: [#1](https://github.com/notsalter/RuangJiwa/issues/1).

The app lives in `web/`, with an optional self-hosted API in `server/`. The legacy Expo app has been retired; its last revision is tagged `legacy/expo-app`. Nothing is deployed.

## What was built

- Vite, Preact, TypeScript, vanilla CSS and system fonts. No UI, chart, icon, state or query library was added for the migrated features.
- Native History API routing that works at `/` and under a subpath such as `/RuangJiwa/`.
- A static-shell service worker: offline app shell only, never private data. Updates ask for consent, and an unsaved journal draft blocks reload.
- A pluggable `Backend` interface: Firebase (default) or the self-hosted HTTP API (`VITE_BACKEND=http`).
- Reminders export `.ics` calendar files. There is no push scheduler.
- Indonesian content. English currently covers navigation labels only.

## Merged history

| Milestone | Pull request |
| --- | --- |
| Web scaffold, manifest, icons, CI | [#2](https://github.com/notsalter/RuangJiwa/pull/2) |
| Scoped web dependency remediation | [#3](https://github.com/notsalter/RuangJiwa/pull/3) |
| Session, auth, five tab shell and Home | [#4](https://github.com/notsalter/RuangJiwa/pull/4) |
| Mood, journal and calendar export | [#5](https://github.com/notsalter/RuangJiwa/pull/5) |
| Quizzes, consultations, profile, recommendations | [#6](https://github.com/notsalter/RuangJiwa/pull/6) |
| Proposed Firebase owner rules and denial tests | [#7](https://github.com/notsalter/RuangJiwa/pull/7) |
| Adapter validation, mood clearing, verified deletion | [#8](https://github.com/notsalter/RuangJiwa/pull/8) |
| Form limits and pending-only cancellation | [#14](https://github.com/notsalter/RuangJiwa/pull/14) |
| PWA install, updates, history safeguards | [#15](https://github.com/notsalter/RuangJiwa/pull/15) |
| Authenticated avatar rendering | [#16](https://github.com/notsalter/RuangJiwa/pull/16) |
| Hosting options and status record | [#17](https://github.com/notsalter/RuangJiwa/pull/17) |
| Self-hosted Better Auth SQLite API | [#18](https://github.com/notsalter/RuangJiwa/pull/18) |
| README and migration record rewrite | [#19](https://github.com/notsalter/RuangJiwa/pull/19) |
| Unused files, IDE state and dead dependency removed | [#20](https://github.com/notsalter/RuangJiwa/pull/20) |
| Status record refreshed | [#21](https://github.com/notsalter/RuangJiwa/pull/21) |
| Legacy Expo app retired (tagged `legacy/expo-app`) | [#22](https://github.com/notsalter/RuangJiwa/pull/22) |
| Dead exports dropped, stale doc links repaired | [#23](https://github.com/notsalter/RuangJiwa/pull/23) |
| Cleanup milestones recorded | [#24](https://github.com/notsalter/RuangJiwa/pull/24) |

Closed without merge and superseded by the #14 to #16 milestones: #9, #10, #11, #12, #13.

## Current verification

- Web: 222 unit and component tests, 5 dependency tests, 5 PWA policy tests, typecheck, builds at `/` and `/RuangJiwa/`, audit with 0 vulnerabilities.
- Firebase backend: a 14 case real browser suite was run against local emulators while the harness existed; it needed a runner that was never committed, so the suite is not part of the repository. Mood clearing and journal deletion verified actual stored state, and two avatar cases documented the residual risk in [AVATARS.md](AVATARS.md).
- Proposed Firebase rules: 172 emulator tests, recorded in [FIREBASE_RULES.md](FIREBASE_RULES.md). The rules are in the repository, not deployed.
- Self-hosted backend: 6 server route and auth tests, real `/api/health` and unauthenticated `401` smoke checks, TypeScript build, audit with 0 vulnerabilities. The adapter adds 11 tests on the web side.
- Self-hosted backend end to end: a browser signed in against the real API on loopback and read its own seven moods, three journals and one quiz result, which rendered on Home, Mood and Journal. That run found two adapter defects that the mocked tests could not see, both fixed in #26. The screenshots in the [README](../README.md) come from that session.

CI for `web/**` covers typecheck, tests and builds. It does not test production Firebase, hosting, or real devices, and `server/**` has no CI trigger yet.

## Decisions on record

- Client-only avatar rendering with authenticated reads was chosen, and the residual download token risk accepted. A token URL stays readable by anyone holding it.
- Better Auth was chosen for the self-hosted path. There were no existing users, so no account migration was required.
- The legacy Expo app was retired rather than kept as a parallel client. The web app is the only client, and the tag above restores the old one if that is ever reversed.

## Open items before any promotion

- Hosting and TLS are not chosen, and deployment is not approved. See [SETUP.md](SETUP.md).
- Firebase production configuration, deployed rules, IAM, CORS and privacy policy are unreviewed.
- Secret scanning alert #1 (`google_api_key`) remains open. The owner has to revoke or restrict the key in Google Cloud and then resolve the alert. No contact with Google Cloud was made and the key was never handled.
- GitGuardian incident 41107195 concerns a historical deterministic local test fixture. Current tests use per run random credentials. Owner classification is still required. No suppression and no history rewrite was performed.
- The self-hosted API is not deployed. Host and TLS are undecided, email delivery for password reset is unconfigured, and `TRUSTED_PROXIES` must match the real proxy before any deployment.
- Real device installation (iOS Safari, Android Chrome) is unverified.
