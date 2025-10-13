import React from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';

export default function PsychologistDetail({ route, navigation }: any) {
  const { psychologist } = route.params || {};
  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text variant="titleLarge">{psychologist?.name || 'Detail'}</Text>
      {psychologist?.specialization ? <Text>{psychologist.specialization}</Text> : null}
      <Button mode="contained" onPress={() => navigation.navigate('ConsultationBooking', { psychologistId: psychologist?.id, psychologistName: psychologist?.name })}>
        Book
      </Button>
    </View>
  );
}
