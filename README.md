# RuangJiwa (React Native)

This repository now hosts the fully migrated RuangJiwa mobile app, rebuilt with **Expo + React Native**. The legacy Android (Java) project has been removed as part of the migration milestone.

The React Native app delivers consultations, quizzes, journaling, mood tracking, recommendations, and profile management with Firebase as the backend.

## Getting Started

1. Install the latest **Node.js LTS** and **npm**.
2. Install dependencies:
	```bash
	npm install
	```
3. Configure Firebase keys. You can either:
	- set `EXPO_PUBLIC_*` variables in `app.json`, or
	- create a `.env` file and load it inside `app.config.ts` (this file is ignored by Git).
4. Launch the development server:
	```bash
	npx expo start
	```

### Useful Scripts

- `npm start` &rarr; Expo dev server (same as `npx expo start`)
- `npm run android` / `npm run ios` &rarr; build and run on device or simulator
- `npm run typecheck` &rarr; TypeScript project validation
- `npm run lint` &rarr; placeholder (wire up ESLint when ready)

## Project Structure

```
src/
  data/                  // static datasets (quizzes, journal prompts, recommendations)
  hooks/queries/         // React Query hooks per Firestore collection
  i18n/                  // i18next setup with EN + ID locales
  models/                // shared TypeScript models
  navigation/            // stack + tab navigators and route types
  providers/             // global providers (Auth)
  screens/               // feature screens (Auth, Consultation, Home, Journal, Mood, Profile)
  services/              // Firebase init + Firestore/Storage helpers + notifications
  store/                 // Zustand stores (auth session)
App.tsx                  // App root providers and navigation container
```

## Firebase & Authentication

- `src/services/firebase.ts` bootstraps Firebase using the Expo config.
- `src/services/collections/*` wraps Firestore CRUD logic (consultations, moods, journals, users, etc.).
- `src/store/auth.ts` + `src/providers/AuthProvider.tsx` keep the signed-in user and profile cached in Zustand.

Run the Firebase Emulator Suite or point to production credentials depending on your workflow.

## Localization

- i18next is pre-wired with English (`en`) and Indonesian (`id`) strings.
- Add/modify translations inside `src/i18n/locales/{en,id}/common.json` and reference them via `useTranslation('common')`.

## Testing & Quality

- `npm run typecheck` is available and runs on CI (add ESLint/Jest when ready).
- See `.github/copilot-migration-plan.md` for the remaining follow-up tasks (tests, CI wiring).

## Notes

- The legacy Android directories (`app/`, `gradle/`, etc.) have been deleted.
- If you opened the project before this migration, clear old IDE caches and reopen the folder as a pure React Native workspace.
