import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SignIn from '@/screens/Auth/SignIn';
import Register from '@/screens/Auth/Register';
import Home from '@/screens/Home/Home';
import ConsultationList from '@/screens/Consultation/ConsultationList';
import MoodHome from '@/screens/Mood/MoodHome';
import ProfileHome from '@/screens/Profile/ProfileHome';
import { useAuth } from '@/store/auth';
import { useTranslation } from 'react-i18next';
import ConsultationBooking from '@/screens/Consultation/ConsultationBooking';
import PsychologistDetail from '@/screens/Psychologist/PsychologistDetail';
import MoodEntryNew from '../screens/Mood/MoodEntryNew';
import MoodHistory from '@/screens/Mood/MoodHistory';
import MyConsultations from '@/screens/Consultation/MyConsultations';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const Auth = createNativeStackNavigator();
const ConsultationStack = createNativeStackNavigator();
const MoodStack = createNativeStackNavigator();

function MainTabs() {
  const { t } = useTranslation('common');
  return (
    <Tabs.Navigator>
      <Tabs.Screen name="Home" component={Home} options={{ title: t('home.title') }} />
      <Tabs.Screen name="Consultation" options={{ title: t('consultation.title') }} component={() => (
        <ConsultationStack.Navigator>
          <ConsultationStack.Screen name="ConsultationList" component={ConsultationList} options={{ title: t('consultation.title') }} />
          <ConsultationStack.Screen name="ConsultationBooking" component={ConsultationBooking} options={{ title: 'Booking' }} />
          <ConsultationStack.Screen name="PsychologistDetail" component={PsychologistDetail} options={{ title: 'Detail' }} />
          <ConsultationStack.Screen name="MyConsultations" component={MyConsultations} options={{ title: 'My Consultations' }} />
        </ConsultationStack.Navigator>
      )} />
      <Tabs.Screen name="Mood" options={{ title: t('mood.title') }} component={() => (
        <MoodStack.Navigator>
          <MoodStack.Screen name="MoodHome" component={MoodHome} options={{ title: t('mood.title') }} />
          <MoodStack.Screen name="MoodEntryNew" component={MoodEntryNew} options={{ title: 'New Entry' }} />
          <MoodStack.Screen name="MoodHistory" component={MoodHistory} options={{ title: 'History' }} />
        </MoodStack.Navigator>
      )} />
      <Tabs.Screen name="Profile" component={ProfileHome} options={{ title: t('profile.title') }} />
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
        <Stack.Screen name="AuthStack" component={() => (
          <Auth.Navigator>
            <Auth.Screen name="SignIn" component={SignIn} options={{ headerShown: false }} />
            <Auth.Screen name="Register" component={Register} />
          </Auth.Navigator>
        )} />
      )}
    </Stack.Navigator>
  );
}
