# PWA deployment, drafts and verification

## Shell integration

`App.tsx` mounts `PwaControls` once in the permanent shell and passes real journal dirty state through its required `hasUnsavedChanges` prop. Dirty create/edit drafts disable the explicit reload action; cancellation, successful save or consented navigation can clear that state. Controls register the worker only in production. There is no injected registration script, `workbox-window` client, notification permission request, push subscription or background reminder scheduler.

The shell's links and route matching use `import.meta.env.BASE_URL`. Personal records require an online authenticated session. The offline view is a code shell, not an offline journal database. Worker caching does not prove Firebase authorization or SDK persistence policy.

## Deployment

```sh
# Domain root
VITE_BASE_PATH=/ npm run build

# Repository deployment
VITE_BASE_PATH=/RuangJiwa/ npm run build
```

Unset or empty selects `/`; a missing trailing slash is added. Only absolute path segments containing letters, digits, `_` or `-` are accepted. URLs, query strings, fragments, encoded separators, whitespace, duplicate slashes and dot segments fail the build. Vite assets, manifest identity/start/scope/icons, Apple icon, worker scope and app links resolve under the same base.

Serve over HTTPS (localhost also works), with JavaScript and manifest MIME types and a static index rewrite for app routes on first visit. Do not rewrite API/auth handlers to the SPA. Serve `sw.js` with revalidation or `Cache-Control: no-cache`. Never deploy personalized or server-rendered `index.html` as the cached shell. Hosting configuration and real device installation require separate validation.

## Cache and update policy

`injectManifest` compiles a native worker. Build-time and worker-time allowlists admit only static `index.html`, generated manifest, favicon, approved PNG icons and bundled `assets/*.js`/`assets/*.css`. Precache requests omit credentials and reject redirects, failed and opaque responses. Cache revisions cover manifest entry revisions; activation deletes only older caches bearing this deployment's `ruangjiwa-shell` prefix.

The fetch listener ignores non-GET, cross-origin, out-of-scope, query/hash-bearing, Authorization-bearing and Range requests. API/auth/session/data/emulator segments, Firebase `/__/auth`, emulator `/v1` and `/v2`, and identity/secure-token paths are excluded, including encoded path segments. Non-navigation responses are served only for exact static manifest URLs. There is no runtime response caching and query parameters are not stripped. Eligible extensionless navigations receive the static index; excluded navigations fail normally offline. A static asset cache miss uses the network without adding its response; a missing offline index returns a plain 503 message.

- Chromium installation is offered only after a real `beforeinstallprompt` event. Prompt acceptance is not installation proof; `appinstalled` or standalone display mode changes that state.
- iPhone/iPad guidance is manual Safari **Bagikan > Tambahkan ke Layar Utama**, not an automated install button. Other unsupported browsers receive browser-menu guidance.
- Installation detection uses display mode, iOS `navigator.standalone` and `appinstalled`, without persistent installation tracking.
- New workers wait. Neither install nor activation calls `clients.claim()`. Only an explicit update click sends `skipWaiting()`; only the consenting tab reloads after that worker activates.
- Save drafts in all tabs before activation. Other tabs are not automatically reloaded. Normal browser lifecycle can activate a waiting worker when all old clients close.
- Registration/update/install errors show a retry action. Returning to a visible online tab checks for updates; there is no polling timer.

## Native history and unsaved journals

App-owned entries carry a namespaced traversal-series ID and entry index in `history.state`. Initial indexing preserves unrelated object fields; restoration never rewrites existing destination entries. Declining a dirty Back/Forward traversal runs `history.go(previousIndex - destinationIndex)`. The restoration `popstate` is suppressed without re-prompting or unmounting the editor. This preserves multi-entry traversal distance and future entries; pushing a replacement Journal entry would instead delete Forward history.

Indices are local to an App-owned series, not guessed absolute browser-history positions. Entries from other documents, scripts or older sessions can be missing metadata or belong to another series:

- When a cancellable same-document Navigation API event is available, unknown native entry keys are checked before traversal. Declining cancels that event; accepting allows the real entry without overwriting its state. `NavigationDestination.getState()` is not used to infer `history.state`: those APIs have distinct state stores.
- Without pre-traversal cancellation, `popstate` cannot safely restore an unindexed destination. The native URL/state remain untouched, the dirty editor stays mounted, and a visible warning explains the mismatch. Saving/cancelling the draft resumes rendering the actual destination. **Muat halaman tujuan** performs a native document navigation, guarded by the editor's `beforeunload` handler.
- Cross-document Back, native document links, reload and closing a dirty page rely on browser `beforeunload`. Browsers can suppress that prompt, especially on mobile; this is not durable draft storage or a guarantee against process termination.

## Verification and current gate

```sh
npm ci
npm run check
node --test tests/pwa.test.mjs
npm audit
VITE_BASE_PATH=/RuangJiwa/ npm run build
```

`npm run check` includes typecheck, source tests, dependency compatibility and the root build, but not the PWA Node suite. CI now runs `node --test tests/pwa.test.mjs` as a separate step immediately after dependency compatibility. Node tests need native TypeScript stripping (Node 22.18+); the icon check needs Python with Pillow.

The original PWA integration passed 58 source tests. The four history regressions and the corrected native-traversal integration test fail against the immutable pre-repair source and pass after repair. Independent review verified all 62 source tests on the isolated PWA branch, five dependency tests, five PWA tests and root/subpath builds. This draft also includes the separately reviewed adapter and form repairs from its predecessor: the assembled source gate passes 198 tests across 32 files, five dependency checks, typecheck and build. The web dependency audit reports zero vulnerabilities; this is not a claim about the legacy Expo dependencies. The inherited root Expo tsconfig warning remains during builds.

Scratch-only real Chromium checks at both `/` and `/RuangJiwa/` passed:

- Home > Mood > Journal > dirty Back refusal > cancel draft > Back returns to Mood, then Forward returns to Journal.
- Repeated refusals, `history.go(-2)`, Back/Forward acceptance and `history.go(2)` preserve the stack, future entries, unrelated state and the refused draft.
- Unknown same-document entries can be declined repeatedly and accepted without state loss; real cross-document Back uses `beforeunload` and retains the draft on refusal.
- Actual production shell registration, all app tabs/quiz links, dirty link/Back/reload refusal, failed create/edit saves and offline return retain the editor.
- A real waiting update remains blocked for dirty/in-flight edits; keyboard Enter activates an enabled update and reloads only the consenting tab.
- Actual CacheStorage contains exactly 14 approved static keys per deployment. Offline shell navigation works; API/auth/query/out-of-scope navigations bypass the worker. No page errors or shell overflow at 320, 390 and 720 CSS pixels were observed.

These PWA browser checks use the real App, Session, Journal and controls with an explicitly supplied backend fixture, not Firebase. Separate real Firebase emulator browser tests are documented in the migration tracker: 12 of 14 pass, while avatar persistence and bearer-token privacy remain blocked. That result does not prove production enforcement. Live Firebase operations, native operating-system installation and real iOS Safari remain unverified. Earlier component-only checks exercised synthetic install/error/retry/iOS detection, focus/44px controls and 200% text; synthetic events are not native install evidence.

The assembled `/RuangJiwa/` build measured a 3,283-byte generated worker (1,576 bytes gzip) and a 64,302-byte main JS bundle (22,387 bytes gzip). These are build measurements, not field-performance comparisons or the complete lazily loaded Firebase payload. No Lighthouse or Web Vitals score was measured.

## Design scope

Controls retain the approved indigo identity, inherited system typography and calm ENERGY 1 / RHYTHM 2 / MOTION 1 direction. Inline status preserves draft visibility; spacing separates installation guidance from update actions. No new artwork, font download, modal, decoration or motion was added. The unindexed-history warning uses native alert/link semantics and existing shell styling. These statements concern this PWA/history scope, not unrelated feature UI or authorization guarantees.
