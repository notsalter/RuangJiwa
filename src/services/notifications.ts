import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('mood-reminders', {
      name: 'Mood Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return status === 'granted';
}

export async function scheduleMoodReminder(hour = 20, minute = 0) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Mood Check-in',
      body: 'Bagaimana perasaanmu hari ini?',
    },
    trigger: {
      hour, minute, repeats: true,
      // @ts-ignore: expo-notifications typing
      channelId: 'mood-reminders'
    },
  });
}

export async function scheduleConsultationReminder(date: Date, title: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Pengingat Konsultasi',
      body: title,
    },
    trigger: date,
  });
}

export async function cancelAll() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
