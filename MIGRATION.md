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

## Invariants

- Firestore collection names and document shapes unchanged.
- No secrets in code or git: Firebase config via `VITE_FIREBASE_*` env vars only.
- Every PR: typecheck + production build green in `web-ci` before merge.
