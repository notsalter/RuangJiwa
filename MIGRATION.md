# RuangJiwa: gradual web/PWA migration

Tracking issue: [#1](https://github.com/notsalter/RuangJiwa/issues/1).

The replacement lives in `web/`. The legacy Expo source remains at the repository root. It has not been retired, and retaining it is not a claim that its dependencies or production deployment are healthy. The migration is **not complete or deployed**.

## Stack and capability decisions

Vite, Preact and TypeScript; vanilla CSS and system fonts; native History API routing; a small in-memory session/store; lazy Firebase Auth, Firestore Lite and Storage modules. `vite-plugin-pwa` builds a native static-shell service worker. No UI, chart, icon, state-management or query-library dependency was added for the migrated features.

This is a measured lightweight implementation, not a claim to be the smallest possible stack. The main bundle measurement excludes lazy Firebase chunks. See `web/docs/pwa.md` for build measurements and policy details.

- Offline means the static application shell, **not private records or durable journal drafts**.
- Worker updates require consent. Dirty journals block the consenting tab's reload; other tabs do not automatically reload.
- Reminders export user-requested `.ics` calendar events. There is no backend push scheduler or reliable background timer.
- Indonesian is the content language; English currently covers navigation only.
- Existing collection names are retained. Strict schemas reject invalid or incompatible legacy data; compatibility review is still required before rollout.

## GitHub history

Each milestone has focused commits and a PR. Dependent drafts state their predecessor; they must not be used to merge an unapproved predecessor merely because a later repair passes.

| Milestone | GitHub record | Status |
| --- | --- | --- |
| Web scaffold, manifest/icons, CI | [#2](https://github.com/notsalter/RuangJiwa/pull/2) | Merged |
| Scoped web dependency remediation | [#3](https://github.com/notsalter/RuangJiwa/pull/3) | Merged |
| Session, auth, five-tab shell, Home | [#4](https://github.com/notsalter/RuangJiwa/pull/4) | Open; not merged |
| Mood history/chart, journal CRUD, calendar export | [#5](https://github.com/notsalter/RuangJiwa/pull/5) | Open; not merged |
| Quizzes, consultations, profile, recommendations | [#6](https://github.com/notsalter/RuangJiwa/pull/6) | Open; avatar acceptance blocked |
| Proposed Firebase owner rules and denial tests | [#7](https://github.com/notsalter/RuangJiwa/pull/7) | Merged; rules not deployed |
| Adapter validation, mood clearing, verified deletion | [#8](https://github.com/notsalter/RuangJiwa/pull/8) | Reviewed draft; stacked on #6 |
| Form/schema alignment, pending-only cancellation | [#9](https://github.com/notsalter/RuangJiwa/pull/9) | Reviewed draft; stacked on #8 |
| Real Firebase browser tests and retained failures | [#10](https://github.com/notsalter/RuangJiwa/pull/10) | Reviewed test draft; stacked on #8; security check remains blocked |
| PWA installation/update controls, root/subpath routing, history safeguards | `web/pwa-final` | Reviewed source prepared as a draft on #9; no merge/deployment approval |
| Promote replacement and retire Expo | Not opened | Blocked on complete acceptance and owner decisions |

## Verification, not release approval

The assembled feature/form/PWA source gate passes 198 unit/component tests across 32 files, five dependency compatibility tests, TypeScript and production builds. Five separate PWA policy tests and `/` and `/RuangJiwa/` builds pass. The audited `web/` lockfile reports zero vulnerabilities; the separate legacy root audit is not clean.

Independent reviews froze exact source revisions and file hashes. They approved bounded adapter, form and PWA scopes, not blanket merging or production security. Native Chromium exercised draft/history/update safeguards with explicit backend fixtures. That is separate from Firebase persistence testing and native OS installation.

Real Auth/Firestore/Storage browser tests preserve all 14 identities. The untouched original source gives 10 passed/4 failed; repaired source gives **12 passed/2 failed, exit 1**, with no skipped failures. Parent and independent reviewer reran these results. Mood clearing verifies actual field absence, and journal deletion verifies actual absence and removed private views. The remaining failures are:

1. Avatar Storage/Auth writes succeed but the matching Firestore profile write fails for an emulator HTTP URL, leaving partial state.
2. An unauthenticated request holding the generated avatar download token receives HTTP 200, not the required 403. SDK owner-denial tests do not establish token-link privacy.

The proposed Firebase rule suite passes 172 local emulator tests. That does not prove deployed rules, bucket IAM, token privacy, production connectivity or operator policy.

## Decisions required before promotion

- Choose avatar delivery: retain client-only authenticated rendering with explicitly accepted residual token-link risk; add and verify a private backend/bucket path; or temporarily disable new uploads. No choice has been recorded, so avatar architecture changes are paused.
- Review real Firebase configuration, deployed rules, IAM/CORS, operator privacy policy and strict-schema compatibility. No production credentials have been requested or used for these tests.
- Resolve the historical Google API key exposure with the owner. Source removal and proposed-rule merges are not revocation.
- GitGuardian incident 41107195 flags the deterministic local emulator fixture in #10's history. The current test generates a cryptographic per-run password, but the historical finding still requires owner classification. No suppression or history rewrite occurred.
- Decide deployment and verify HTTPS/routing/manifest on the chosen host. Native OS installation and real iOS Safari remain unverified.

Keep the tracker open and Expo intact until these acceptance criteria are verified. A green source/build workflow does not override the failing browser gate.
