# RuangJiwa migration status

Tracking issue: #1.

## Merged implementation history

| PR | Delivered |
| --- | --- |
| #2 | web scaffold, manifest, icons, CI |
| #3 | scoped web dependency remediation |
| #4 | session, auth, five tab shell and Home |
| #5 | mood, journal and calendar export |
| #6 | quizzes, consultations, profile and recommendations |
| #7 | proposed Firebase owner rules and local denial suite |
| #8 | private write/read validation, mood clearing and verified journal deletion |
| #14 | schema aligned forms and pending only consultation cancellation |
| #15 | PWA install and update controls, static shell worker, base aware routing, dirty history safeguards, pinned Pillow CI |
| #16 | authenticated avatar rendering with owned paths and temporary blob URLs |
| #17 | hosting options and this status record |
| #18 | self-hosted Hono, Better Auth and Drizzle SQLite API with cookie sessions |
| #19 | README and migration record rewrite |
| #20 | removal of unused artifacts, IDE state and the unused `preact-router` dependency |
| #21 | status record refresh |
| #22 | legacy Expo app retired, its last revision tagged `legacy/expo-app` |
| #23 | dead exports dropped and stale doc links repaired |

Closed without merge and superseded: #9, #10, #11, #12, #13.

## Current verification

- 222 web unit and component tests
- 5 dependency compatibility tests
- 5 PWA policy tests
- TypeScript and production builds at `/` and `/RuangJiwa/`
- web dependency audit: 0 vulnerabilities
- server: 6 route and auth tests, TypeScript build, audit 0
- proposed Firebase rules: 172 local emulator tests passed; the rules are not deployed
- `web-ci` runs for changes under `web/**` only, so `server/**` is not covered by remote CI yet

## Open operational gates

- Secret scanning alert #1 (`google_api_key`) remains open. The owner has to revoke or restrict the key in Google Cloud and then resolve the alert. No contact with Google Cloud was made and the key was never handled.
- GitGuardian incident 41107195 concerns a historical deterministic local test fixture. Current tests use per run random credentials. Owner classification is still required. No suppression and no history rewrite was performed.
- Firebase production rules, configuration, IAM, CORS, privacy policy and legacy data compatibility are unverified.
- Client only avatar rendering was selected with the residual download token risk accepted. Production bucket behaviour still needs review.
- No hosting platform has been enabled. `docs/hosting-options.md` compares GitHub Pages, custom domain Pages, Vercel/Netlify, Cloudflare Pages and generic static hosting.
- The self-hosted API is not deployed. Host, TLS and email delivery for password reset are undecided, and `TRUSTED_PROXIES` must match the real proxy before any deployment.
- Real iOS Safari and Android Chrome installation remain unverified. The legacy Expo app was retired and its last revision is tagged `legacy/expo-app`.

Do not enable deployment until these gates are explicitly approved and tested.
