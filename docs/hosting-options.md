# Hosting options for the RuangJiwa web PWA

Scope: static hosting for `web/dist` only. No backend is required by the client itself; Firebase is called directly from the browser. Deployment itself is **not approved yet** — this document exists for owner review.

The build already supports both bases, so either URL shape works:

- repository root: `/`
- GitHub Pages project site: `/RuangJiwa/`

Verified locally: production builds pass at both `VITE_BASE_PATH=/` (default) and `VITE_BASE_PATH=/RuangJiwa/`, with the manifest, icons, service worker and navigation resolved under the configured base.

## Options

| Option | Fit | Cost | Notes |
| --- | --- | --- | --- |
| **GitHub Pages (recommended for review)** | Best fit | Free for public repos | Uses the existing repo, keeps history with the code, supports project pages at `/RuangJiwa/` which the app already builds for. HTTPS and service workers work on Pages. Custom domain optional. |
| GitHub Pages with custom domain | Good if you want a clean root URL | Domain cost only | Requires DNS and a `CNAME` file in the deployed branch/source. Root base `/` build already works. |
| Vercel / Netlify static hosting | Good DX, previews per PR | Free tier sufficient | Both handle SPA fallback and custom headers easily. Adds a second platform to manage. |
| Cloudflare Pages | Good CDN, free tier | Free | Also fine; same static-only model. |
| Any static host + CDN | Acceptable | Varies | Must serve HTTPS, correct MIME for `.webmanifest` (`application/manifest+json`), and SPA fallback to `index.html`. |

## Requirements any host must meet

1. HTTPS only; service workers do not register on plain HTTP.
2. `Cache-Control: no-cache` for `index.html` and `sw.js`; long-lived immutable caching for hashed assets is fine.
3. `application/manifest+json` MIME for `manifest.webmanifest`.
4. SPA fallback to `index.html` for client routes, without rewriting asset requests.
5. No server-side secrets. Firebase config is supplied through build-time `VITE_FIREBASE_*` values, not committed secrets.

## Recommended next step after approval

Add a small workflow that builds `web/` and uploads `web/dist` to GitHub Pages (or deploy to the chosen host). Keep it PR-scoped until you explicitly approve enabling the environment. Before enabling: deploy the reviewed Firebase rules, verify bucket IAM/CORS, set authorized domains, and complete the secret-alert remediation.

## Current blockers before any production enablement

- Secret-scanning alert #1 (`google_api_key`, opened 2025-06-18) is still **open**. The key must be revoked/restricted in Google Cloud and the alert resolved by the owner. Removing a literal from code or rewriting history is not sufficient and was not done.
- GitGuardian incident 41107195 covers an old deterministic local-emulator test fixture in retained branch history. Current code generates per-run random credentials. Owner classification is still required; no suppression was performed.
- Firebase production rules/config/IAM/CORS/privacy policy and legacy-data compatibility remain unverified.
- Avatar token-link residual risk is accepted for the client-only design only after production verification of bucket IAM/CORS.
- Native OS install and real iOS Safari behavior are unverified.
