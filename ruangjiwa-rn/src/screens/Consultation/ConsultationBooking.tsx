import React from 'react';
import { View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useAuth } from '@/store/auth';
import { create as createConsultation } from '@/services/collections/consultations';

export default function ConsultationBooking({ route, navigation }: any) {
  const userId = useAuth(s => s.userId);
  const { psychologistId, psychologistName } = route.params || {};
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  async function book() {
    if (!userId || !psychologistId) return;
    setSaving(true);
    try {
      await createConsultation({
        userId,
        psychologistId,
        status: 'pending',
        scheduledAt: new Date().toISOString(),
        notes,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text variant="titleLarge">Booking</Text>
      {psychologistName ? <Text>{psychologistName}</Text> : null}
      <TextInput label="Catatan" value={notes} onChangeText={setNotes} multiline numberOfLines={4} />
      <Button mode="contained" loading={saving} disabled={saving} onPress={book}>Konfirmasi</Button>
    </View>
  );
}
