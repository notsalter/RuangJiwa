import React from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { usePsychologists } from '@/hooks/queries/usePsychologists';

export default function ConsultationList({ navigation }: any) {
  const { data, isLoading, error } = usePsychologists();
  return (
    <View style={{ flex: 1, padding: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text variant="titleLarge">Pilih Psikolog</Text>
        <Button mode="text" onPress={() => navigation.navigate('MyConsultations')}>My Consultations</Button>
      </View>
      {isLoading ? (
        <Text>Loading…</Text>
      ) : error ? (
        <Text style={{ color: 'red' }}>Failed to load</Text>
      ) : (data?.length ?? 0) === 0 ? (
        <Text>Belum ada psikolog.</Text>
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item: { id: string }) => item.id}
          renderItem={({ item }: { item: { id: string; name: string; specialization?: string } }) => (
            <Card style={{ marginBottom: 10 }}>
              <Pressable onPress={() => navigation.navigate('PsychologistDetail', { psychologist: item })}>
                <Card.Title title={item.name} subtitle={item.specialization} />
              </Pressable>
              <Card.Content>
                <Button mode="contained" onPress={() => navigation.navigate('ConsultationBooking', { psychologistId: item.id, psychologistName: item.name })}>
                  Book
                </Button>
              </Card.Content>
            </Card>
          )}
        />
      )}
    </View>
  );
}
