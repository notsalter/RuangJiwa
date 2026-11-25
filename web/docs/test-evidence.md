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

Core gate: `npm run check` passed with 11 unit/component tests, TypeScript and production build. Legacy root tsconfig lookup warning comes from Vite's config bundler, not executing Expo scripts.
