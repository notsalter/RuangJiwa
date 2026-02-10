import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SignIn from '@/screens/Auth/SignIn';
import Register from '@/screens/Auth/Register';
import Home from '@/screens/Home/Home';
import ConsultationList from '@/screens/Consultation/ConsultationList';
import MoodHome from '@/screens/Mood/MoodHome';
import ProfileHome from '@/screens/Profile/ProfileHome';
import ProfileEdit from '@/screens/Profile/ProfileEdit';
import { useAuth } from '@/store/auth';
import { useTranslation } from 'react-i18next';
import ConsultationBooking from '@/screens/Consultation/ConsultationBooking';
import PsychologistDetail from '@/screens/Psychologist/PsychologistDetail';
import MoodEntryNew from '@/screens/Mood/MoodEntryNew';
import MoodHistory from '@/screens/Mood/MoodHistory';
import MyConsultations from '@/screens/Consultation/MyConsultations';
import QuizHome from '@/screens/Consultation/QuizHome';
import QuizTake from '@/screens/Consultation/QuizTake';
import QuizResult from '@/screens/Consultation/QuizResult';
import QuizHistory from '@/screens/Consultation/QuizHistory';
import JournalHome from '@/screens/Journal/JournalHome';
import JournalEntryNew from '@/screens/Journal/JournalEntryNew';
import JournalEntryDetail from '@/screens/Journal/JournalEntryDetail';
import JournalEntryEdit from '@/screens/Journal/JournalEntryEdit';
import {
  AuthStackParamList,
  ConsultationStackParamList,
  JournalStackParamList,
  MoodStackParamList,
  ProfileStackParamList,
} from './types';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const Auth = createNativeStackNavigator<AuthStackParamList>();
const ConsultationStack = createNativeStackNavigator<ConsultationStackParamList>();
const MoodStack = createNativeStackNavigator<MoodStackParamList>();
const JournalStack = createNativeStackNavigator<JournalStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function AuthStackNavigator() {
  return (
    <Auth.Navigator>
      <Auth.Screen name="SignIn" component={SignIn} options={{ headerShown: false }} />
      <Auth.Screen name="Register" component={Register} />
    </Auth.Navigator>
  );
}

function ConsultationStackNavigator() {
  return (
    <ConsultationStack.Navigator>
      <ConsultationStack.Screen name="ConsultationList" component={ConsultationList} options={{ title: 'Konsultasi' }} />
      <ConsultationStack.Screen name="ConsultationBooking" component={ConsultationBooking} options={{ title: 'Booking' }} />
      <ConsultationStack.Screen name="PsychologistDetail" component={PsychologistDetail} options={{ title: 'Detail' }} />
      <ConsultationStack.Screen name="MyConsultations" component={MyConsultations} options={{ title: 'My Consultations' }} />
      <ConsultationStack.Screen name="QuizHome" component={QuizHome} options={{ title: 'Kuis' }} />
      <ConsultationStack.Screen name="QuizTake" component={QuizTake} options={{ title: 'Kuis' }} />
      <ConsultationStack.Screen name="QuizResult" component={QuizResult} options={{ title: 'Hasil Kuis' }} />
      <ConsultationStack.Screen name="QuizHistory" component={QuizHistory} options={{ title: 'Riwayat Kuis' }} />
    </ConsultationStack.Navigator>
  );
}

function MoodStackNavigator() {
  const { t } = useTranslation('common');
  return (
    <MoodStack.Navigator>
      <MoodStack.Screen name="MoodHome" component={MoodHome} options={{ title: t('mood.title') }} />
      <MoodStack.Screen name="MoodEntryNew" component={MoodEntryNew} options={{ title: 'New Entry' }} />
      <MoodStack.Screen name="MoodHistory" component={MoodHistory} options={{ title: 'History' }} />
    </MoodStack.Navigator>
  );
}

function JournalStackNavigator() {
  const { t } = useTranslation('common');
  return (
    <JournalStack.Navigator>
      <JournalStack.Screen name="JournalHome" component={JournalHome} options={{ title: t('journal.title', { defaultValue: 'Jurnal' }) }} />
      <JournalStack.Screen name="JournalEntryNew" component={JournalEntryNew} options={{ title: 'Catatan Baru' }} />
      <JournalStack.Screen name="JournalEntryDetail" component={JournalEntryDetail} options={{ title: 'Detail Catatan' }} />
      <JournalStack.Screen name="JournalEntryEdit" component={JournalEntryEdit} options={{ title: 'Edit Catatan' }} />
    </JournalStack.Navigator>
  );
}

function ProfileStackNavigator() {
  const { t } = useTranslation('common');
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="ProfileHome" component={ProfileHome} options={{ title: t('profile.title') }} />
      <ProfileStack.Screen name="ProfileEdit" component={ProfileEdit} options={{ title: t('profile.editTitle', { defaultValue: 'Edit Profil' }) }} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  const { t } = useTranslation('common');
  return (
    <Tabs.Navigator>
      <Tabs.Screen name="Home" component={Home} options={{ title: t('home.title') }} />
      <Tabs.Screen
        name="Consultation"
        component={ConsultationStackNavigator}
        options={{ title: t('consultation.title'), headerShown: false }}
      />
      <Tabs.Screen
        name="Journal"
        component={JournalStackNavigator}
        options={{ title: t('journal.title', { defaultValue: 'Journal' }), headerShown: false }}
      />
      <Tabs.Screen
        name="Mood"
        component={MoodStackNavigator}
        options={{ title: t('mood.title'), headerShown: false }}
      />
      <Tabs.Screen name="Profile" component={ProfileStackNavigator} options={{ title: t('profile.title'), headerShown: false }} />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const userId = useAuth((s: { userId?: string }) => s.userId);
  const isSignedIn = !!userId;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isSignedIn ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="AuthStack" component={AuthStackNavigator} />
      )}
    </Stack.Navigator>
  );
}
