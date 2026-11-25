# PWA deployment and update policy

## Wire the controls once

The feature shell must mount this component once, preferably in Settings or a stable app-level status area:

```tsx
import { PwaControls } from './pwa/PwaControls';

<PwaControls hasUnsavedChanges={hasUnsavedJournalChanges} />
```

`hasUnsavedChanges` is required. Connect it to real dirty editor state, including edits waiting to save. Do not hard-code it to `false` while a journal editor can hold a draft. The component imports its own CSS and registers the service worker only in a production build. Mount it early and keep it mounted so native installation events are not missed. If controls live only in a lazily visited Settings screen, hoist `usePwa()` into the permanent shell and present its state there instead.

There is no injected registration script, `workbox-window` client bundle, notification permission request, scheduled reminder, push subscription or backend in this module. Until the component or hook is mounted, the build emits the worker and manifest but the app does not register the worker.

## Deployment base

```sh
# Domain root
VITE_BASE_PATH=/ npm run build

# Repository deployment
VITE_BASE_PATH=/RuangJiwa/ npm run build
```

An unset or empty value selects `/`. A missing trailing slash is added. Only absolute path segments containing letters, digits, `_` or `-` are accepted. URLs, query strings, fragments, encoded separators, whitespace, duplicate slashes and dot segments fail the build.

The config actually imports `normalizeBasePath`, `createManifest` and the static path allowlist. Vite assets, manifest identity/start/scope/icons, Apple icon and registration scope resolve under the same deployment base. Router links and route matching in the feature app must also respect `import.meta.env.BASE_URL`; this module does not edit the router.

Serve over HTTPS (localhost works for development checks), with JavaScript and manifest MIME types and a static index rewrite for eligible app routes on first visit. Never rewrite API or auth handlers to the SPA. Serve `sw.js` with revalidation or `Cache-Control: no-cache`. Do not deploy personalized or server-rendered `index.html`: the only cached HTML is the build's static shell. Production deployments, Firebase access rules and real device installability still require separate checks.

## What is cached

`injectManifest` compiles a small native worker rather than Workbox runtime routing. Build-time and worker-time allowlists admit only:

- Static `index.html`, generated manifest and favicon.
- Known approved PNG icons.
- Bundled `assets/*.js` and `assets/*.css`.

Precache requests omit credentials and reject redirects, failed responses and opaque responses. The cache version includes all manifest entry revisions. Cache activation removes only older caches with this deployment's `ruangjiwa-shell` prefix, not arbitrary caches on the origin.

The fetch listener ignores non-GET, cross-origin, out-of-scope, query/hash-bearing, Authorization-bearing and Range requests. API/auth/session/data/emulator segments, Firebase `/__/auth`, emulator `/v1` and `/v2`, and identity/secure-token paths are explicitly excluded, including encoded path segments. Non-navigation requests are served only when their exact URL is in the static manifest. There is no runtime response caching. Query parameters are never silently stripped.

Eligible extensionless navigation paths receive the precached static index. Auth/API paths and query-sensitive navigation bypass the worker and therefore fail normally when offline. A cache miss for a static asset uses the network without adding that response to the cache. A missing offline index returns a plain, truthful 503 message.

This is offline code-shell support, not an offline journal database, session cache or security guarantee. Firebase SDK persistence, authorization and any feature-level storage are outside this worker's policy.

## Install and update behavior

- Chromium-style installation is offered only after a real `beforeinstallprompt` event. The one-shot event is consumed by a native button. Accepting the prompt is not treated as proof of installation; `appinstalled` or standalone display mode updates that state.
- iPhone/iPad users see Safari **Bagikan > Tambahkan ke Layar Utama** instructions and no automated install button. Availability still depends on the actual browser/device. Desktop Safari and other browsers get truthful browser-menu guidance if no native event exists.
- `display-mode: standalone`, iOS `navigator.standalone`, and `appinstalled` are observed without persistent installation tracking.
- A new worker waits. Neither installation nor activation calls `clients.claim()`. `skipWaiting()` is sent only by an explicit update click, never a timer or background update event.
- Dirty editors disable the reload action. Clear/save drafts in all tabs before activating a new worker. Other tabs are not automatically reloaded. The current tab reloads only after its requested worker reaches `activated`.
- The browser can activate a waiting worker after all old clients close, according to its normal lifecycle. That is not an automatic reload of an open editor.
- Registration/update/install errors are visible with a retry button. Returning to a visible tab checks for updates when online; there is no polling interval.

## Verification

```sh
npm ci
node --test tests/pwa.test.mjs
npm run typecheck
npm run build
```

The Node tests use native TypeScript stripping (Node 22.18+ or newer), real Vite subpath builds and an executable generated-worker harness. The pixel check also needs Python with Pillow. Tests cover invalid base values, manifest/HTML paths, install detection, component bundling, actual generated worker install/fetch/message/cleanup behavior, omitted precache credentials, auth/emulator/API/query bypass and exact approved Apple icon pixels.

A separate scratch-only Chromium harness mounted the actual component against the built worker and recorded:

- Actual shell-only cache contents and offline navigation success.
- Offline API/query navigation failure, with no shell substitution.
- Dirty draft retained while an update waited; reload button disabled.
- Keyboard Enter on an enabled update activated the worker and reloaded.
- Deferred install action, dismissed prompt, rejected prompt/error/retry and `appinstalled` UI state.
- iOS user-agent instructions with no fake install button.
- No horizontal overflow at 320, 390 and 720 CSS pixels, or at 200% text size.
- A visible 3px keyboard focus outline, 44px button height and no page errors.

Native operating-system installation and real iOS Safari were not exercised. The existing feature router is intentionally untouched; its integration and subpath route rendering belong to the feature shell.

### Measured size, not a superlative

On the unchanged scaffold dependency baseline, the built root worker was **3,004 bytes**, **1,512 bytes gzip**, with **9 actual cached shell files**. The scratch component harness (Preact, controls and minimal editor combined) was **18,380 bytes JS**, **7,461 bytes gzip**; its CSS was **1,083 bytes**, **489 bytes gzip**. These are local build measurements, not a comparison with other apps or a field-performance claim. Rebuild after integrating the feature app to measure the final bundle. No Lighthouse or Web Vitals score was measured.

## Design and delivery gate

Approved direction: indigo identity, ENERGY 1 / RHYTHM 2 / MOTION 1.

- Indigo action color reuses the approved app identity; it does not introduce a new logo or palette.
- Inline status and grouped update controls keep drafts visible without a modal, focus theft or an overlay hiding the editor.
- Inherited system typography avoids a font download and matches the shell.
- Spacing separates installation guidance from the draft-sensitive update action; restrained radii distinguish the container from buttons.
- No icons, gradients, shadows or motion are added. Existing Apple artwork is only alpha-composited onto opaque indigo.

Scope of the gate is the new controls and changed HTML/config, not the feature agent's untouched UI.

- Hard gate PASS: owned copy has no em dashes, fabricated claims, fake data or dead controls; native actions/error/retry were clicked, install support is event-driven, and iOS is manual only.
- Accessibility PASS: visible named buttons/status/error semantics, 44px targets, focus outline, mobile reflow and 200% text exercised. Computed white/indigo contrast is 6.29:1; ink/white 17.74:1; muted/white 4.83:1. There is no custom modal, image content or animation in the controls.
- Purpose gate PASS: identity/typography/layout/spacing reasons are recorded above; no unapproved artwork or decorative effects added.
- Liveliness PASS: declared calm dials, one primary update/install action at a time, structural spacing and repeated approved indigo action treatment.
- Craftsmanship PASS: real build/typecheck/tests and Chromium click-through passed, error/dirty/installed/unsupported states are present. Real device install and final feature routing are explicitly unverified rather than claimed.

Known baseline: `npm ci` reported 8 audit vulnerabilities (4 moderate, 4 high) and the root Expo tsconfig warning appears during build. Package and lock files are deliberately unchanged because the parent is implementing the separate dependency/security fix.
