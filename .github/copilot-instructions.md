# Copilot Instructions for RuangJiwa

## Project Overview
- **RuangJiwa** is an Android app for mental health services: consultations, quizzes, mood tracking, journaling, and recommendations.
- **Tech stack:** Java, Android, Firebase (Auth, Firestore, Storage), MVVM architecture, Data Binding, Fragment-based navigation.

## Architecture & Structure
- Main code in `app/src/main/java/com/example/ruangjiwa/`:
  - `data/model/`: Core models (Consultation, Psychologist, QuizHistory, MoodEntry, etc.)
  - `ui/`: Feature packages (home, consultation, mood, profile, etc.)
  - `utils/`: Helpers (e.g., NotificationHelper)
- UI uses RecyclerView adapters for lists (see `ConsultationAdapter`, `PsychologistAdapter`, `MoodHistoryAdapter`).
- Fragments are used for navigation and feature separation (e.g., `HomeFragment`, `ConsultationFragment`, `MoodFragment`).
- Firebase is the main backend for user/auth, quiz, and consultation data. Models require empty constructors for Firebase.

## Developer Workflows
- **Build:** Use Android Studio or `./gradlew build`.
- **Run:** Android Studio (preferred) or `./gradlew installDebug` for device/emulator.
- **Test:**
  - Unit tests: `app/src/test/java/` (run with `./gradlew test`)
  - Instrumented tests: `app/src/androidTest/java/` (run with `./gradlew connectedAndroidTest`)
- **Firebase setup:** Place `google-services.json` in `app/`.
- **Sync Gradle:** Always sync after dependency changes.

## Key Patterns & Conventions
- **MVVM:** ViewModels are not always explicit, but Fragments handle most logic and UI updates.
- **Adapters:** List adapters use inner ViewHolder classes and listener interfaces for click events (see `ConsultationAdapter.ConsultationListener`, `PsychologistAdapter.OnPsychologistClickListener`).
- **Data Binding:** Used for view inflation and UI updates.
- **Localization:** Indonesian language support throughout UI and quiz features.
- **Sample Data:** Use `SampleDataProvider` for mock/test data.
- **Quiz Feature:** Quiz logic and history are in `ConsultationFragment` and `QuizHistory` model. Results are categorized and stored in Firestore.
- **Notifications:** Use `NotificationHelper` for reminders (mood check-in, consultation).

## Integration Points
- **Firebase:** Auth, Firestore, Storage. Models must be compatible with Firebase serialization.
- **Glide:** For image loading in adapters and profile screens.
- **Material Components:** For UI elements (chips, buttons, dialogs).

## External Dependencies
- See `build.gradle.kts` and `app/build.gradle.kts` for all libraries.
- Main dependencies: AndroidX, Firebase, Glide, Material Components.

## Examples
- To add a new feature, create a package in `ui/`, a Fragment, and any needed adapters/models.
- To add a new quiz type, extend `QuizQuestion`, `QuizOption`, and update `ConsultationFragment` logic.
- To add a new notification, update `NotificationHelper`.

## References
- See `README.md` for setup, requirements, and feature details.
- See `SampleDataProvider` for mock/test data patterns.

---
**Feedback:** If any section is unclear or missing, please specify so it can be improved for future AI agents.
