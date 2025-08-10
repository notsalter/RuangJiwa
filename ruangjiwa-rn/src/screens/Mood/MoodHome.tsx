import React from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { scheduleMoodReminder } from '@/services/notifications';

export default function MoodHome({ navigation }: any) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Text variant="titleLarge">Mood</Text>
      <Text>Track your mood and view history.</Text>
      <Button mode="outlined" onPress={() => scheduleMoodReminder()}>
        Schedule Daily Mood Reminder
      </Button>
      <Button style={{ marginTop: 8 }} mode="contained" onPress={() => navigation.navigate('MoodEntryNew')}>
        New Mood Entry
      </Button>
      <Button style={{ marginTop: 8 }} mode="text" onPress={() => navigation.navigate('MoodHistory')}>
        View History
      </Button>
    </View>
  );
}
