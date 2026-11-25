# Local browser E2E evidence

**Repaired non-photo scope: 12/12 passed. FULL browser gate: FAILED, 12/14 passed, exit 1.**
No production requests, publication or deployment. Avatar policy remains paused pending owner approval; its two failures are not skipped or relabeled as passes. Parent independent review is still required before publication.

## Reproduce

Run from `web/` after `npm ci --ignore-scripts`. The Node runner is separate from Vitest (`e2e/**` is excluded there, not removed):

```sh
npm run check
node e2e/run.mjs
```

Prerequisites: Node, Java suitable for the Firebase emulators, and scratch-only tools:

- `$E2E_BROWSER_TOOLS`: package with `@playwright/test@1.65.1` and `firebase-tools@15.37.0`.
- `$E2E_RULES_TOOLS`: package with `@firebase/rules-unit-testing@6.0.0` and `firebase@13.4.0` (tested overrides: `@grpc/grpc-js@1.14.7`, `glob@14.0.6`, `minimatch@11.0.9`).
- `$PLAYWRIGHT_BROWSERS_PATH`: Chromium installed by the above Playwright version.

Defaults are `~/.hermes/cache/scratch/ruangjiwa-{browser-tools,rules-tools,browsers}`. Provision these separately; application manifests/lockfiles are unchanged. Use `E2E_SCRATCH_DIR` for private artifacts, never the repository.

The runner rejects arguments, strips inherited Firebase/Google/Cloud SDK configuration, builds with fixed dummy values, and uses only `demo-ruangjiwa`. Auth/Firestore/Storage bind to `127.0.0.1:9099/8085/9199`, hub/logging to `4400/4500`, Firestore websocket to `9150`, and the built browser app to `4178`. It checks occupied ports and never kills another owner's process. Browser traffic outside loopback is blocked. The separately owned PWA review is not part of this result.

## Assertions and results

All original **14 test names and ordering are retained**, with no skips. Only the existing journal create/edit case and deletion case changed; the other 12 bodies, including both photo failures, are byte-identical to the copied original.

- Journal create/edit now selects `happy`, reads it through the real owner SDK, then edits via the DOM to `Tanpa mood` (empty value). Actual Firestore SDK readback must lack its own `mood` property, not contain `null`, `undefined` or the old value. Title/content/createdAt/favorite/tags checks remain.
- Original deletion line 363 waited for the confirmation button to become enabled after it had been removed. An unchanged run on fixed source reproduced `expect(locator).toBeEnabled() failed`, element not found, at `browser.test.mjs:363:74`. The corrected wait requires `Jurnal dihapus.` and confirmation-button absence. Admin readback is `null`; detail/read button are absent and alerts are empty.
- All 33 Firestore cross-user/guest denial assertions and all 8 Storage denial assertions still execute unchanged.
- Photo upload persists a Storage object and Auth photo URL, but Firestore has no matching URL; HTTP 400 and the access-denied DOM alert remain. The unchanged photo-save test fails waiting for success.
- The separate unauthenticated download-token request returns HTTP **200**, while its unchanged assertion requires **403**. This privacy failure remains a failing test, not a successful denial.

| Run | Source | Passed / total | Exit |
| --- | --- | --- | --- |
| Parent original RED | pre-deletion repair | 11 / 14 | 1 |
| Copied original, unchanged stale wait | `8f33ae4` | 11 / 14 | 1 |
| Identical final tests/runner, isolated original base | `5af4279` | 10 / 14 | 1 |
| Final repaired browser suite | `8f33ae4` | 12 / 14 | 1 |

The isolated base uses its untouched application source, separate dependencies/build/root, and the same proposed rules copied from the fixed tree. The mood regression fails specifically with `Actual owner SDK readback must have no mood property after DOM selects Tanpa mood` (`true !== false`); deletion also fails its success-feedback assertion. Thus fixing the stale wait does not hide the original deletion bug. No application source was changed for this work.

Normal `npm run check` passed: typecheck, **24 Vitest files / 146 tests**, **5 dependency tests**, and build. `npm ci --ignore-scripts` reported 502 installed packages and zero vulnerabilities.

## Private evidence

Raw emulator logs, observations and screenshots may contain disposable download/reset tokens. They remain in scratch and must not be committed.

Final RED artifacts: `ruangjiwa-e2e-run-M4ISpQ`; final repaired artifacts: `ruangjiwa-e2e-run-kzlebX`. The private `ruangjiwa-browser-evidence/manifest.json` records every run's exact ordered identity/status set, counts, exit code and every artifact's SHA-256. Relative names are under `~/.hermes/cache/scratch/`.

Final top-level runner-log SHA-256:

- Base RED: `47d87caf62418ebe7c0726d8bd3cf3e246354ed77eb104728f16a8a5d8d467a8`
- Repaired, full gate still failed: `ae2f248db49b35eb36d5b72670ea37535b6533eea267aa5273ad95e4138c1dcc`
