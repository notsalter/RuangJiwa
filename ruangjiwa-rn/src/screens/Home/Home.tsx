import React from 'react';
import { View, FlatList } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { usePsychologists } from '@/hooks/queries/usePsychologists';

export default function Home() {
  const { data, isLoading, error } = usePsychologists();
  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Text variant="titleLarge" style={{ marginBottom: 8 }}>RuangJiwa</Text>
      {isLoading ? (
        <Text>Loading…</Text>
      ) : error ? (
        <Text style={{ color: 'red' }}>Failed to load</Text>
      ) : (data?.length ?? 0) === 0 ? (
        <Text>No psychologists found.</Text>
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item: { id: string }) => item.id}
          renderItem={({ item }: { item: { id: string; name: string; specialization?: string } }) => (
            <Card style={{ marginBottom: 10 }}>
              <Card.Title title={item.name} subtitle={item.specialization} />
            </Card>
          )}
        />
      )}
    </View>
  );
}
