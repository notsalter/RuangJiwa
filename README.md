# RuangJiwa

A private journal, mood tracker and reflection app built as a lightweight, installable web PWA. Mobile first, Indonesian content, small bundle, no tracking.

Development is ongoing. Nothing is deployed yet, and this repository is the source of truth for what actually works.

## What it does

- Email and password sign in
- Journal entries with prompts, moods, tags, favorites and search
- Mood check-ins with a 14 day chart
- Two short reflection quizzes (stress and anxiety) with stored history
- Psychologist directory and consultation requests
- Profile editing with an optional avatar
- Calendar exports (`.ics`) for reminders
- Install to home screen, offline app shell, and safe update prompts

## Stack

| Layer | Choice |
| --- | --- |
| UI | Preact + TypeScript + vanilla CSS, system fonts |
| Build | Vite, `vite-plugin-pwa` (Workbox), static shell only |
| Routing | Native History API with a small router |
| Data | Pluggable `Backend` interface |
| Backend A (default) | Firebase Auth + Firestore Lite + Storage |
| Backend B | Self-hosted Hono + Better Auth + Drizzle + SQLite (`server/`) |

One UI, two interchangeable data backends. Firebase stays the default; the self-hosted API is opt in through environment variables.

## Repository layout

```
web/        The PWA. This is the app you run and deploy.
server/     Optional self-hosted API (Hono, Better Auth, Drizzle, SQLite).
docs/       Migration status, hosting options, security notes.
```

## Run it locally

```sh
cd web
npm ci
cp .env.example .env      # add your Firebase web identifiers
npm run dev
```

Tests and production build:

```sh
npm run check             # typecheck + unit/component tests + dependency checks + build
npm run test:coverage
```

The build works at `/` or under a subpath, for example `VITE_BASE_PATH=/RuangJiwa/`.

## Self-hosted backend (optional)

```sh
cd server
npm ci
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
npm run migrate
npm run dev
```

Then set `VITE_BACKEND=http` and `VITE_API_URL` for the web app. See [`server/README.md`](server/README.md) for environment variables, the systemd unit, SQLite backup and Caddy TLS examples.

Notes:

- Sessions are HTTP only cookies. No tokens are stored in the browser.
- Avatars are served only to their owner through an authenticated route.
- Password reset needs SMTP. Until it is configured the API answers with an explicit `501 auth/reset-not-configured` rather than pretending the mail was sent.

## Configuration

Firebase web identifiers are build time values, not secrets. Access control belongs in Firestore and Storage rules. Never commit real environment files.

## Docs

- [MIGRATION.md](MIGRATION.md) - how the rewrite was delivered
- [docs/migration-status.md](docs/migration-status.md) - current state and open items
- [docs/hosting-options.md](docs/hosting-options.md) - deployment options and requirements
- [web/README.md](web/README.md) - app details, features and limits
- [web/docs/pwa.md](web/docs/pwa.md) - service worker, install and update policy
- [web/docs/avatar-authenticated.md](web/docs/avatar-authenticated.md) - avatar delivery and its residual risk

## Status and known limits

- Not deployed. Hosting, TLS and production email are not configured.
- GitHub Actions runs typecheck, unit tests, PWA checks and both builds for changes under `web/`.
- The legacy Expo app was retired in favour of the PWA. Its last revision is tagged [`legacy/expo-app`](https://github.com/notsalter/RuangJiwa/releases/tag/legacy%2Fexpo-app).
- Avatar links in the Firebase backend are bearer URLs. That residual risk is documented and accepted for the current design; the self-hosted backend avoids it by serving images through an authenticated route.

## License

No license file is included. All rights reserved unless the owner states otherwise.
