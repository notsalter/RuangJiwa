# RuangJiwa React Native (Expo)

Bootstrap RN app per migration plan. Includes navigation, Paper theme, React Query, i18n, and Firebase stubs.

## Setup
1. Install Node LTS. 
2. In this folder:
```
npm install
```
3. Configure Firebase via env in app.json (EXPO_PUBLIC_*), or use `app.config.ts` to load `.env`.
4. Start:
```
npx expo start
```

## Structure
- src/navigation: root navigator with tabs
- src/screens: placeholder screens (Home, Consultation, Mood, Profile, Auth)
- src/services: Firebase init and collections
- src/hooks: React Query hooks
- src/i18n: i18next setup with ID/EN

## Next
- Wire auth state and guards
- Implement feature screens incrementally as per migration checklist
