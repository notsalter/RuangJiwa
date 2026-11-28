# Test evidence

Boundary mocks replace Firebase/network operations only. Session state, selectors, validation and Preact components execute real application code. No production backend connection is claimed.

## Session, auth and Home

- RED: config stub yielded `{}` rather than null, accepted JavaScript photos and returned empty error feedback. Three assertions failed. GREEN: three configuration/safe-error tests passed.
- RED: session lacked `start`; two race tests failed. GREEN: account switch and pending mutation/query results stay isolated; logout clears state before signout resolves.
- RED: Home greeting returned an empty string. GREEN: real date selectors exclude canceled/completed/past/invalid consultation entries and select latest mood.
- RED: scaffold lacked the configuration heading and signup control. GREEN: native form labels, registration boundary call, safe errors, signed-in Home and logout component tests passed.
- RED: navigation translation returned an empty string. GREEN: Indonesian/English/fallback assertions passed.
- RED: Firebase adapter was absent; write authorization test failed. GREEN: adapter prevents cross-owner update/delete and stale-user creation before any write.
- RED: emulator opt-in returned false for an explicit demo environment. GREEN: only the exact explicit demo-project opt-in succeeds.

## Mood, calendar and journals

- RED: empty mood options and series failed both assertions. GREEN: five legacy values/emoji, validated draft, chronological real-data chart points passed.
- RED: empty ICS failed calendar format assertions. GREEN: future-date validation, UTC start/end, field escaping and calendar-owned alarm passed.
- RED: mood page lacked radio labels. GREEN: save draft, read recorded history/chart, prepare and download ICS component interaction passed.
- RED: journal stub did not reject short content and returned no search matches. GREEN: trimmed length validation, tags deduplication, prompts, favorite filtering and date order passed.
- RED: journal page lacked content controls. GREEN: create, read, update, favorite, explicit deletion confirmation and trimmed-short-content rejection component interactions passed.

## Quizzes, consultations and profile

- RED: empty quiz definitions and scoring stub failed. GREEN: both original five-question sets and all 0/6/7/12/13/15 category boundaries passed.
- RED: quiz page lacked its selection control. GREEN: incomplete answers rejected, real scores saved to quizHistory, informal result and history rendered.
- RED: consultation draft accepted past/invalid times. GREEN: explicit future datetime, pending-not-confirmed status and cancellable status checks passed.
- RED: consultation page lacked directory detail control. GREEN: actual boundary directory/detail, unsafe-photo rejection, future request, cancellation confirmation and confirmed-only ICS passed.
- RED: profile validation returned no feedback for a blank name. GREEN: name bounds, MIME and 5 MB limits passed.
- RED: profile page lacked name controls. GREEN: current Auth email readonly, name/photo save and password reset feedback passed.
- RED: offline Session lacked setOnline. GREEN: no queries/profile refreshes while offline and stale profiles cannot restore after clear. Initial auth stays pending until observed.
- RED: mood history hid records older than the chart window. GREEN: all 20 test records remain visible while the chart uses 14.
- RED: record decoder returned null for a valid document. GREEN: document-id precedence and runtime schema validation prevent malformed values entering UI.
- RED: writes reported success without readback. GREEN: create/update/delete exact-target verification and Auth/users profile readback passed.

Final gate: `npm run check` passed with 35 unit/component tests across 22 files, TypeScript and production build. `npm run test:coverage` measured statements 82.49%, branches 77.98%, functions 79.09%, lines 82.93%. Firebase SDK boundary coverage is partial; emulator/network integration belongs to the parent. Earlier commits passed 11 and 19 tests respectively. Legacy root tsconfig lookup warning comes from Vite's config bundler, not executing Expo scripts.
