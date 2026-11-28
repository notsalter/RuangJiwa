# Setup and deployment

Everything needed to run, test and host RuangJiwa. Deployment itself is **not approved yet**; the hosting section exists for owner review.

## Requirements

- Node.js 22 or later and npm.
- No `.env` file is required to build. Without complete Firebase configuration the app still opens, but login is visibly unavailable.

## Run the app

```sh
cd web
npm ci
cp .env.example .env      # add your Firebase web identifiers
npm run dev
```

## Tests and builds

```sh
npm run check             # typecheck + unit/component tests + dependency tests + build
npm run test:coverage
VITE_BASE_PATH=/RuangJiwa/ npm run build
```

`npm run check` is the gate CI runs. It typechecks, runs 222 unit and component tests, runs the 5 dependency compatibility tests, and builds the PWA shell. The 5 PWA policy tests run separately with `node --test tests/pwa.test.mjs`, and CI provisions a pinned Pillow for them.

Firebase SDK modules load lazily. Firestore Lite performs one-shot online queries with no IndexedDB cache. The service worker caches static application assets, not private responses. A production build works at `/` or under a subpath such as `/RuangJiwa/`; see [PWA.md](PWA.md) for the base and cache rules.

## Environment variables

| Variable | Scope | Notes |
| --- | --- | --- |
| `VITE_FIREBASE_*` | web | Six Firebase web identifiers. Build-time values, not secrets; access control lives in security rules. |
| `VITE_BACKEND` | web | `http` selects the self-hosted API instead of Firebase. Any other value keeps Firebase. |
| `VITE_API_URL` | web | Base URL of the self-hosted API. Required by `VITE_BACKEND=http`. Must be `https:` unless the host is loopback, and must not embed credentials; anything else is rejected and the app falls back to Firebase. |
| `VITE_FIREBASE_EMULATORS` | web | Local emulator opt-in. Requires `VITE_FIREBASE_PROJECT_ID=demo-ruangjiwa` exactly, plus all normal identifiers. Never enable for deployment. |
| `VITE_BASE_PATH` | web | Build base: `/` (default) or `/RuangJiwa/`. |
| `BETTER_AUTH_SECRET` | server | Required, at least 32 characters. `openssl rand -base64 32`. |
| `DB_URL`, `DB_AUTH_TOKEN` | server | SQLite URL, default `file:./data/ruangjiwa.db`. A remote `libsql://` endpoint is accepted only with a token. |
| `DATA_DIR` | server | Avatar directory, default `./data/avatars`. Keep it outside the public web root. |
| `WEB_ORIGIN`, `TRUSTED_ORIGINS` | server | Exact browser origin for credentialed CORS, and the Better Auth origin list. Never `*`. |
| `TRUSTED_PROXIES` | server | Comma-separated proxy IPs or CIDRs. Forwarded IP headers are ignored unless this is set, so rate-limit identity cannot be spoofed by a client. |
| `AUTH_URL`, `PORT`, `NODE_ENV` | server | Public API origin, HTTP port, and `production` to enable the Secure cookie attribute. |

## Run the self-hosted backend

Optional. The client defaults to Firebase, so nothing here is required to use the app.

```sh
cd server
npm ci
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
npm run migrate
npm run dev                 # http://localhost:3000
```

Then build or run the web app with `VITE_BACKEND=http` and `VITE_API_URL`. Sessions are HTTP-only cookies, so no token is stored in the browser; avatars are served only to their owner through an authenticated route; password reset answers `501 auth/reset-not-configured` until email delivery is configured. Operational detail, the systemd unit, SQLite backup and Caddy TLS examples live in [../server/README.md](../server/README.md).

## Deployment

Scope: static hosting for `web/dist`, plus the optional API host. The client itself needs no backend; Firebase is called directly from the browser.

| Option | Fit | Cost | Notes |
| --- | --- | --- | --- |
| GitHub Pages (recommended for review) | Best fit for the static client | Free for public repositories | Uses the existing repository, keeps history with the code, and supports project pages at `/RuangJiwa/`, which the app already builds for. HTTPS and service workers work on Pages. |
| GitHub Pages with a custom domain | Clean root URL | Domain cost | Needs DNS and a `CNAME`. The root base build already works. |
| Vercel or Netlify static hosting | Good previews per pull request | Free tier is sufficient | Both handle SPA fallback and headers. Adds a second platform to manage. |
| Cloudflare Pages | Good CDN | Free tier | Same static-only model. |
| Any static host and CDN | Acceptable | Varies | Must meet all five requirements below. |
| A VPS with Caddy and systemd | Best fit for the self-hosted API | Existing server | Recommended for `server/`; keep SQLite on local disk and back it up. |

Any host must meet:

1. HTTPS only; service workers do not register on plain HTTP.
2. `Cache-Control: no-cache` for `index.html` and `sw.js`; long-lived immutable caching for hashed assets.
3. `application/manifest+json` for the manifest.
4. SPA fallback to `index.html` for client routes, without rewriting asset requests or API handlers.
5. No server-side secrets. Firebase configuration is supplied through build-time `VITE_*` values.

Recommended next step after approval: add a workflow that builds `web/` and publishes `web/dist` to the chosen host, kept pull-request scoped until the environment is explicitly enabled. Before enabling: deploy the reviewed Firebase rules, verify bucket IAM and CORS, set authorized domains, and complete the secret-alert remediation.

Blockers before any production enablement: the open secret scanning alert for the historical Google API key, the unresolved GitGuardian classification, unverified Firebase production configuration and rules, the unverified self-hosted API deployment, and unverified real-device installation. [MIGRATION.md](MIGRATION.md) tracks them.
