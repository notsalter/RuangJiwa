# RuangJiwa Web (PWA)

The lightest-advanced rewrite of RuangJiwa: a static **PWA** you can install on
mobile, built with **Vite + Preact + TypeScript + vite-plugin-pwa**, with
Firebase (Auth/Firestore/Storage) as the unchanged backend.

## Stack (deliberately minimal)

| Concern | Choice | Why |
| --- | --- | --- |
| UI | Preact (~3 kB) | smallest full-featured reactive UI; no compat shim needed |
| Routing | preact-router (~1.5 kB) | declarative paths + params, enough for this app |
| Build | Vite 7 | fast, modern, zero-config TS |
| PWA | vite-plugin-pwa (Workbox) | service worker + manifest + autoUpdate, generated at build |
| Backend | firebase v10+ modular SDK | same project/collections as the RN app; lazy-loaded chunks |
| State | tiny hand-rolled store (`src/lib/store.ts`) | the app only needs a session store |
| i18n | tiny hand-rolled `t()` (`src/lib/i18n.ts`) | two flat dictionaries, no runtime dep |
| Data fetching | small `useQuery`-like hook (`src/lib/useResource.ts`) | replaces React Query for this CRUD surface |
| Styling | vanilla modern CSS (layers, custom properties, nesting) | zero runtime, zero build weight |
| Charts | inline SVG (`src/components/MoodChart.tsx`) | replaces victory-native |

Initial JS payload stays in the low tens of kB (gzipped); Firebase chunks load
only when auth/data features are used.

## Run

```bash
cd web
npm ci
cp .env.example .env   # fill VITE_FIREBASE_* from the Firebase console
npm run dev            # dev server
npm run build          # production build + service worker -> dist/
npm run preview        # serve dist/ locally
npm run typecheck
```

The build needs **no secrets**; Firebase initializes lazily at runtime from
`VITE_FIREBASE_*` env vars.

## PWA / mobile

- Installable (Add to Home Screen / install prompt in-app)
- `display: standalone`, portrait, theme color, maskable icons
- Offline app shell via service worker (precached assets + SPA navigation fallback)
- Web Notifications for mood/consultation reminders

Deploy `dist/` to any static host over HTTPS (GitHub Pages, Vercel, Netlify) —
service workers require HTTPS or localhost.

See `MIGRATION.md` at the repo root for the step-by-step transition plan and
issue #1 for the tracking checklist.
