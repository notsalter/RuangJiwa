import React from 'react';
import { View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useAuth } from '@/store/auth';
import { create } from '@/services/collections/moods';

export default function MoodEntryNew({ navigation }: any) {
  const userId = useAuth(s => s.userId);
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  async function save(mood: 'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy') {
    if (!userId) return;
    setSaving(true);
    try {
      await create({ userId, mood, note, createdAt: new Date().toISOString() });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text variant="titleLarge">Mood Entry</Text>
      <TextInput label="Catatan" value={note} onChangeText={setNote} multiline numberOfLines={3} />
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Button disabled={saving} onPress={() => save('very_sad')}>😢</Button>
        <Button disabled={saving} onPress={() => save('sad')}>🙁</Button>
        <Button disabled={saving} onPress={() => save('neutral')}>😐</Button>
        <Button disabled={saving} onPress={() => save('happy')}>🙂</Button>
        <Button disabled={saving} onPress={() => save('very_happy')}>😄</Button>
      </View>
    </View>
  );
}
