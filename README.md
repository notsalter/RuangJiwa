# RuangJiwa

## Overview
RuangJiwa is an Android application focused on mental health services, providing users with access to psychological consultations, guided meditation, mood tracking, and self-reflection tools.

## Features
- **User Authentication**: Secure user login and profile management with Firebase Authentication
- **Home Dashboard**: Personalized greetings and quick access to main features
- **Consultations**: Schedule and manage video/chat consultations with psychologists
- **Quick Mental Health Quiz**: Take a short 7-question mental health assessment based on validated clinical tools with personalized feedback and result history tracking
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
│   │   │   │   ├── QuizQuestion.java
│   │   │   │   ├── QuizOption.java
│   │   │   │   ├── QuizResult.java
│   │   │   │   ├── QuizHistory.java
│   │   │   │   ├── Recommendation.java
│   │   │   │   └── ...
│   │   ├── ui/
│   │   │   ├── consultation/
│   │   │   │   ├── ConsultationFragment.java
│   │   │   │   ├── QuizHistoryAdapter.java
│   │   │   │   └── ...
│   │   │   ├── home/
│   │   │   │   ├── HomeFragment.java
│   │   │   │   └── ...
│   │   │   └── ...
│   │   └── ...
│   ├── res/
│   │   ├── layout/
│   │   │   ├── fragment_quiz.xml
│   │   │   ├── fragment_history.xml
│   │   │   ├── item_quiz_history.xml
│   │   │   ├── item_quiz_option.xml
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
- Firebase Storage
- Glide for image loading
- RecyclerView and CardView for UI components
- CircleImageView for profile pictures
- Material Components for Android

## Mental Health Quiz Feature Details
The Quick Mental Health Quiz is a brief mental wellness assessment tool based on validated clinical questionnaires (PHQ-9 and GAD-7). 

### Key Functionality
- 7 questions assessing different aspects of mental well-being
- Simple multiple-choice format (4 options per question)
- Automatic calculation of results with three categories (Low, Moderate, High distress)
- Results with personalized recommendations based on score
- Firebase integration for storing and retrieving quiz history
- Complete Indonesian language localization

### Implementation Notes
- Data is stored securely in Firebase Firestore
- Quiz results are tied to user accounts for privacy
- History view provides chronological list of past assessments
- Responsive design works across different Android devices
- Built with Fragment-based architecture for seamless integration

### User Flow
1. Start quiz from consultation section
2. Answer 7 questions about mental well-being
3. Receive immediate categorized results
4. Access support resources based on results
5. View history of past quiz attempts

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
- PHQ-9 and GAD-7 questionnaires (simplified and adapted)
- Open source libraries used in this project
