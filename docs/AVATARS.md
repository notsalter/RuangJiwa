# Authenticated avatar verification

## Decision and scope

The user's explicit decision keeps client-only uploads and accepts residual token-link risk. The normal app flow no longer stores or renders a download URL. This does not prove raw bytes require authentication on every request. No production access, deployment, token rotation, backend, Storage rule widening, package/lock/workflow changes or unrelated adapter repairs are included.

Base: `3422afaac57ed9ab88ee5b78d37b6a2c2b3c15d0`. The original browser file is recoverable unchanged with `git show <base>:web/e2e/browser.test.mjs`. Its SHA-256 and existing failure-log hashes are recorded in `avatar-baseline-manifest.json`. Those logs were not rewritten. Their original raw-token-403 failure remains a failure of strict privacy, not a fixed baseline.

## Executed gates

- Exact-lock `npm ci --ignore-scripts`: installed successfully, audit zero. Final `npm audit --json`: zero findings.
- Base `npm run check`: 198 tests, 32 files. Final: 214 tests, 35 files, TypeScript, five dependency regressions and production build passed.
- Separate PWA suite: five tests passed. No worker policy was changed.
- Real rules emulator: base plus new tests first failed the two newly allowed owned-path cases. After the single optional path field was added, all 185 tests passed (172 original + 13 avatar cases). Storage rules and HTTPS URL validation remain unchanged.
- Real Chromium + Auth/Firestore/Storage emulator: 14/14 scenarios passed under the explicitly revised client-only contract. Exact identity comparison retains 13 names and retitles only the original photo-save scenario. The Storage identity retains all eight exact cross-user/guest SDK denials, separately recording unauthenticated raw-token HTTP 200 with matching bytes as accepted risk, NOT strict-private green.
- Browser photo scenario verifies actual decoded `img src="blob:..."`, owner SDK path/bytes readback, no Firestore legacy URL fields, empty Auth durable photo URL, name-only legacy retention, explicit new-upload transition, replacement revocation, offline revocation, logout revocation, account-switch absence, restored authenticated rendering and no private cache URLs.

Local evidence outside git: `/root/.hermes/cache/scratch/avatar-check-final.log`, `avatar-pwa-final.log`, `avatar-audit-final.json`, `avatar-rules-red.log`, `avatar-rules-green.log`, `avatar-e2e-transition-final.log`; browser artifacts `/root/.hermes/cache/scratch/ruangjiwa-e2e-run-XFBbiZ`. Browser console/network evidence is retained, including deliberate missing legacy-object 404s, reset-session 400 and an aborted in-flight image request. No uncaught exceptions or production network attempts occurred.

## RED/repair evidence

Focused tests first caught the missing owned path, authenticated rendering, partial-error type and URL disposal behavior. SDK boundary tests cover MIME/size/path validation, lazy reads, stale owners, legacy parsing, exact deletes and non-atomic failure/retry behavior. UI hook tests cover replacement/logout/offline/account switch/unmount and stale reads.

Two integration repair cycles were needed, without restarting the task: bounded Firebase `getBlob` uses `Blob.slice`, dropping MIME, so authenticated allowlisted metadata is checked first and restores the type after exact-size validation; Auth emulator rejects explicit null photoURL, so name-only/no-existing-photo writes omit it and an intentional new-upload transition clears an existing URL with the empty string. Real readback confirms no durable URL after that transition. Initial failed browser runs and diagnostic logs remain in scratch; passing mocks were not substituted for browser results.

## Limits

The 5 MiB/MIME checks validate metadata and byte count, not image content signatures. Decode failures are visible and retryable. Failed multi-product saves may leave partial profile changes or orphaned objects. Replacing avatars does not delete old objects or revoke old tokens. Production CORS, IAM, deployed rules and actual token behavior remain unverified. All commits are local pending independent parent review.
