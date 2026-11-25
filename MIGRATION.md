# RuangJiwa: React Native → Web PWA migration

Tracking issue: **#1**. The rewrite lands as a series of PRs into `master` so
every step is reviewable and the history stays gradual and documented. The
legacy Expo app at the repo root stays working until the final PR.

## Target stack

Vite 7 + Preact + TypeScript + preact-router + vite-plugin-pwa (Workbox),
Firebase modular SDK (lazy, env-based config), hand-rolled i18n/store/data
hooks, vanilla modern CSS. Same Firestore collections and document shapes —
no backend change. Details in `web/README.md`.

## Steps

- [ ] `web/scaffold` — web/ base, PWA manifest+icons, CI, this file
- [ ] `web/shell-i18n` — router, tab shell, theme, i18n, Home
- [ ] `web/auth` — Firebase auth, sign in/up, route guard, profile
- [ ] `web/mood-journal` — mood tracking + history + reminders, journal CRUD
- [ ] `web/quiz-consult` — quiz engine/results/history, consultations, recommendations, profile
- [ ] `web/pwa-polish` — install prompt, offline shell, docs
- [ ] `chore/retire-expo` — remove legacy RN app, move `web/` to repo root, resolve secret-scanning alert

## Approved client-only avatar transition

The owner chose authenticated client-side Storage reads and ephemeral object-URL rendering while retaining uploads, explicitly accepting residual bearer-token link risk. This decision waives only the previous raw-token-403 acceptance criterion; it does not mean token privacy was fixed. No backend, feature disabling, production deployment or token rotation is authorized.

The existing 14 browser scenarios remain, with the photo-save identity explicitly retitled for owned-path/blob delivery. The Storage scenario retains all eight exact authenticated SDK denials and separately records HTTP 200 as accepted risk characterization, not strict-private green. The original browser source and failure evidence are immutable baseline artifacts; see `web/docs/avatar-authenticated.md` for manifests and actual verification.

## Invariants

- Firestore collection names stay unchanged. The approved avatar transition adds the optional owned `profileImagePath` field and removes legacy URL fields only upon a new upload.
- No secrets in code or git: Firebase config via `VITE_FIREBASE_*` env vars only.
- Every PR: typecheck + production build green in `web-ci` before merge.
