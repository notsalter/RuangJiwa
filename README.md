# RuangJiwa

## Overview
RuangJiwa is an Android application focused on mental health services, providing users with access to psychological consultations, guided meditation, mood tracking, and self-reflection tools.

## Features
- **User Authentication**: Secure user login and profile management with Firebase Authentication
- **Home Dashboard**: Personalized greetings and quick access to main features
- **Consultations**: Schedule and manage video/chat consultations with psychologists
- **Recommendations**: Personalized content recommendations for audio sessions, journals, and psychologists
- **Mood Tracking**: Track and monitor daily mood patterns
- **Journal**: Self-reflection and journaling tools

## Technical Stack
- **Language**: Java
- **Platform**: Android
- **Database/Backend**: Firebase
- **Architecture**: MVVM (Model-View-ViewModel)
- **UI Components**:
  - RecyclerView for list displays
  - ConstraintLayout for responsive UI design
  - Data Binding for view interactions
  - Fragment-based navigation

## Project Structure
The project follows the standard Android project structure with additional feature-specific packages:

```
app/
├── src/main/
│   ├── java/com/example/ruangjiwa/
│   │   ├── data/
│   │   │   ├── model/
│   │   │   │   ├── Consultation.java
│   │   │   │   ├── Recommendation.java
│   │   │   │   └── ...
│   │   ├── ui/
│   │   │   ├── home/
│   │   │   │   ├── HomeFragment.java
│   │   │   │   ├── ConsultationAdapter.java
│   │   │   │   └── RecommendationAdapter.java
│   │   │   └── ...
│   │   └── ...
│   ├── res/
│   │   ├── layout/
│   │   │   ├── fragment_home.xml
│   │   │   └── ...
│   │   └── ...
│   └── AndroidManifest.xml
└── ...
```

## Setup Instructions
1. Clone the repository
2. Open the project in Android Studio
3. Sync the project with Gradle files
4. Set up a Firebase project and add the `google-services.json` file to the app directory
5. Build and run the application on an emulator or physical device

## Requirements
- Android SDK 21+
- Android Studio 4.0+
- Firebase account
- Gradle 7.0+

## Dependencies
- AndroidX libraries
- Firebase Authentication
- Firebase Firestore
- Glide for image loading
- RecyclerView and CardView for UI components
- CircleImageView for profile pictures

## Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements
- Mental health resources and content providers
- Open source libraries used in this project
