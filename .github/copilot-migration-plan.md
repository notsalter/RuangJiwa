# RuangJiwa Android → React Native Migration Plan

This plan turns the existing Android (Java, MVVM, Fragments, Firebase) app into a cross‑platform React Native app with equivalent features and UX. It’s tailored to RuangJiwa’s structure and Firebase integrations.

## Goals and Scope
- Preserve feature parity: consultations, quizzes, mood tracking, journaling, recommendations, profile/auth.
- Reuse Firebase backend (Auth, Firestore, Storage); no backend rewrite.
- Modern RN stack with clear navigation, state, testing, and CI/CD.
- Non-goals: drastic redesigns; backend schema changes (except small additions if needed for parity).

## Current App Inventory (Android)
- Packages: `app/src/main/java/com/example/ruangjiwa/`
	- data/model: Consultation, Psychologist, QuizHistory, MoodEntry, etc.
	- ui: home, consultation, mood, profile, adapters for RecyclerView.
	- utils: NotificationHelper, SampleDataProvider.
- Navigation: Fragment-based (`HomeFragment`, `ConsultationFragment`, `MoodFragment`, `ProfileFragment`).
- Integrations: Firebase Auth/Firestore/Storage, Glide, Material Components, Localization (ID).

## Tech Decisions (RN)
- Bootstrap: Prefer Expo (EAS) for speed and OTA updates. Use bare RN CLI only if a required native module isn’t supported by Expo.
- UI: React Native + React Native Paper (Material Design) + React Native Vector Icons.
- Navigation: React Navigation (stack + bottom tabs + native stack).
- State: React Query for server/cache data; Zustand or Redux Toolkit for app/session state.
- Forms: React Hook Form + Zod (validation).
- i18n: i18next + react-i18next + react-native-localize; default Indonesian with EN as secondary.
- Firebase: `firebase` JS SDK (modular v9+) with `@react-native-firebase/app` only if native features are needed; for Expo-managed use `expo-dev-client` if any custom native module is required.
- Notifications: `expo-notifications` (Expo) or `@react-native-firebase/messaging` + `react-native-push-notification` (bare) mapped from NotificationHelper.
- Images: Built-in Image or `react-native-fast-image` (bare) as Glide analogue; for Expo, prefer Image/Expo Image.
- Testing: Jest + React Native Testing Library; Detox for E2E (bare) or Maestro (cross-platform) if using Expo managed.

## Architecture Mapping
- Fragments → Screens (React components).
- RecyclerView + Adapters → FlatList/SectionList with item renderers.
- ViewModels logic → Hooks + React Query + thin services; keep Firebase calls in a `services/` layer.
- Data Binding → Props/state; minimal global state to avoid over-sharing.
- NotificationHelper → notifications service (schedule, cancel, channels).

## Navigation Mapping
- AppNavigator (Root):
	- AuthStack: SignIn, Register, ForgotPassword.
	- MainTabs:
		- HomeStack: Home, PsychologistDetail, ConsultationBooking.
		- ConsultationStack: ConsultationList, ConsultationDetail, Chat/Call placeholder.
		- MoodStack: MoodHome, MoodEntryNew, MoodHistory.
		- ProfileStack: ProfileHome, EditProfile, Settings, About.

## Data Model Mapping (Java → TypeScript)
Represent Firestore docs with TS types. Keep fields compatible with current collections.

Example interfaces (adjust to actual fields in `data/model/`):

```ts
// models/types.ts
export type TimestampISO = string; // store as ISO string in UI layer; convert to Firestore Timestamp on write

export interface Psychologist {
	id: string;
	name: string;
	specialization?: string;
	photoUrl?: string;
	rating?: number;
	bio?: string;
}

export interface Consultation {
	id: string;
	userId: string;
	psychologistId: string;
	status: 'pending' | 'confirmed' | 'completed' | 'canceled';
	scheduledAt?: TimestampISO;
	notes?: string;
}

export interface QuizHistory {
	id: string;
	userId: string;
	quizType: string; // e.g., depression, anxiety
	score: number;
	category: string; // e.g., low, moderate, high
	takenAt: TimestampISO;
}

export interface MoodEntry {
	id: string;
	userId: string;
	mood: 'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy';
	note?: string;
	createdAt: TimestampISO;
}
```

## Firebase Integration Plan
- Auth: Email/password; support Google sign‑in if present in Android app.
- Firestore: Preserve collection names and document shapes; add converters in a thin data layer.
- Storage: Profile photos, attachments.
- Security: Reuse Firebase Security Rules; review for RN requirements (same user claims).
- Offline: React Query cache + Firestore offline persistence (optional).

Data layer skeleton:
- `services/firebase.ts`: initialize app, exports `auth`, `db`, `storage`.
- `services/collections/*.ts`: CRUD per entity (e.g., `consultations.ts`).
- `hooks/queries/*.ts`: useQuery/useMutation wrappers.

## Feature-by-Feature Migration
1) Home
- Recreate feed/cards; fetch psychologists list; show next consultation and last mood.

2) Consultation
- List/search psychologists; detail screen; booking flow; Firestore writes to `consultations`.
- Replace RecyclerView adapters with FlatList + memoized item components.

3) Quiz
- Port question sets and scoring; categorize results same as Android.
- Persist to `quizHistory` with timestamp and category; show history list and detail.

4) Mood Tracking
- Mood entry component (chips/emojis), optional note, scheduled reminders.
- History list with filters and charts (Victory Native/Recharts wrapper).

5) Journaling
- Rich text is optional; start with plain text and date; sync with Firestore.

6) Recommendations
- Reuse same algorithm or rules; compute on-device from quiz/mood.

7) Profile
- View/edit profile, avatar upload to Storage, update Auth displayName/photo.

## Notifications Mapping (from NotificationHelper)
- Local reminders for mood check‑ins and consultation reminders.
- Expo: `expo-notifications` schedules with channels; background handler for receipt.
- Bare: FCM with `@react-native-firebase/messaging` for push + local scheduling.

## Localization
- Move Indonesian strings to `locales/id/*.json` with keys; optionally `locales/en/*.json`.
- Wrap screens with i18next provider; ensure RTL safety if needed later.

## Testing Strategy
- Unit: Pure functions (quiz scoring, recommendation rules) with Jest.
- Component: Screen rendering and flows with Testing Library.
- Integration: Firestore mocks (firebase emulators or mock layer) for CRUD.
- E2E: Detox (bare) or Maestro (works with Expo managed) for critical flows.

## CI/CD
- Lint, typecheck, test on PR.
- Build preview (Expo EAS or Gradle/Xcode) on main; distribute to testers.

## Migration Strategy & Rollout
- Strangler approach: build RN app alongside Android; reuse same Firebase project.
- Beta testers validate parity; phased rollout on Play Store; add iOS after parity.

## Risks & Mitigations
- Notification behavior differences → Decide early on Expo vs bare; POC reminders.
- Performance on large lists → Use FlatList with getItemLayout, keyExtractor, and virtualization.
- Firebase SDK size → Use modular imports; enable Hermes.
- Native dependencies mismatch → Keep a compatibility spreadsheet; avoid niche libs.

## Milestones & Timeline (indicative)
- Week 1–2: Env setup, data layer, auth, navigation, base theme.
- Week 3–4: Consultation + Psychologists + Profile.
- Week 5: Quiz engine + history.
- Week 6: Mood tracking + notifications.
- Week 7: Journaling + recommendations.
- Week 8: Polish, tests, accessibility, beta.

## Acceptance Criteria (Definition of Done)
- Screen-by-screen parity with Android flows and validations.
- Auth flows stable; Firestore operations succeed and are resilient offline.
- Notifications scheduled correctly and cancel on changes.
- Localization complete (ID baseline) and dates/numbers formatted.
- 80%+ unit coverage for pure logic (quiz/recommendations) and smoke tests for screens.
- Builds run green on CI; beta testers complete predefined scenarios without blockers.

## Work Backlog Checklist
- [ ] Decide Expo vs bare RN; spike notifications feasibility.
- [ ] Create RN repo; baseline navigation, theme, lint, TS config.
- [ ] Firebase init (Auth/Firestore/Storage); environment handling (.env, app.json/app.config.js).
- [ ] Models/types scaffolding; adapters from Firestore.
- [ ] Home screens and widgets.
- [ ] Psychologists list/detail + images.
- [ ] Consultation create/list/detail.
- [ ] Quiz engine + results + history.
- [ ] Mood entry + history + charts.
- [ ] Journaling CRUD.
- [ ] Recommendations computation and display.
- [ ] Profile view/edit + avatar upload.
- [ ] Notifications mapping and schedules.
- [ ] Localization files (ID, EN) and wiring.
- [ ] Tests (unit, component), emulator-based sanity checks.
- [ ] CI/CD wiring and beta distribution.

## Library Reference (shortlist)
- Navigation: `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`.
- UI: `react-native-paper`, `react-native-safe-area-context`, `react-native-gesture-handler`, `react-native-reanimated`.
- State/Data: `@tanstack/react-query`, `zustand` or `@reduxjs/toolkit`.
- Forms/Validation: `react-hook-form`, `zod`.
- Firebase: `firebase` (modular), optionally `@react-native-firebase/*` on bare.
- Notifications: `expo-notifications` (Expo) or `@react-native-firebase/messaging` + local notifications.
- i18n: `i18next`, `react-i18next`, `react-native-localize`.
- Charts: `victory-native` or `react-native-svg-charts`.

---
Quick Start (reference only; adapt per chosen stack):
- Expo: `npx create-expo-app@latest ruangjiwa-rn` → add React Navigation, React Query, i18n, firebase.
- Bare RN: `npx @react-native-community/cli init ruangjiwa` → add libs above; configure Android/iOS projects.

Keep this plan updated as tasks complete; link PRs/issues to each checklist item.
