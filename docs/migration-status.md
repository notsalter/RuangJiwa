# RuangJiwa migration status

Tracking issue: #1. Current master: `b7d330410fd5ddee4047d923e76df57c7b1d98b8`.

## Merged implementation history

- #2: web scaffold, manifest/icons, CI
- #3: scoped web dependency remediation
- #4: session/auth/Home and five-tab shell
- #5: mood/journal/calendar export
- #6: quizzes, consultations, profile and recommendations
- #7: proposed Firebase owner rules and local denial suite
- #8: private write/read validation, mood clearing and verified journal deletion
- #14: schema-aligned forms and pending-only consultation cancellation
- #15: PWA install/update controls, static-shell worker, base-aware routing, dirty-history safeguards and pinned Pillow CI
- #16: authenticated avatar rendering with owned paths and temporary blob URLs

## Current verification

- 214 unit/component tests
- 5 dependency tests
- 5 PWA policy tests
- TypeScript and production builds at `/` and `/RuangJiwa/`
- web dependency audit: 0 vulnerabilities
- master push CI green at the current head
- proposed rules: 172 local emulator tests passed; rules are not deployed

## Open operational gates

- Secret-scanning alert #1 (`google_api_key`) remains open. Owner must revoke/restrict the key in Google Cloud and then resolve the alert. This assistant has not contacted Google Cloud and has not handled the key.
- GitGuardian incident 41107195 concerns a historical deterministic local test fixture. Current tests use per-run random credentials; owner classification remains required. No suppression or history rewrite was performed.
- Firebase production rules/configuration, IAM, CORS, privacy policy and legacy-data compatibility are unverified.
- Client-only avatar rendering was selected with accepted residual download-token risk. Production bucket behavior must still be reviewed.
- No hosting platform has been enabled. `docs/hosting-options.md` compares GitHub Pages, custom-domain Pages, Vercel/Netlify, Cloudflare Pages and generic static hosting. The recommended review path is GitHub Pages because the app already supports `/RuangJiwa/`.
- Expo remains in the repository. Native OS installation and real iOS Safari remain unverified.

Do not remove Expo or enable deployment until these operational gates are explicitly approved and tested.
