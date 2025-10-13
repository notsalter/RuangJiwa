import React from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useAuth } from '@/store/auth';
import { useConsultations } from '@/hooks/queries/useConsultations';
import { update as updateConsultation } from '@/services/collections/consultations';

export default function MyConsultations() {
  const userId = useAuth(s => s.userId);
  const { data, isLoading, error, refetch, isRefetching } = useConsultations(userId || '');

  async function cancel(id: string) {
    await updateConsultation(id, { status: 'canceled' });
    refetch();
  }

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Text variant="titleLarge" style={{ marginBottom: 8 }}>My Consultations</Text>
      {isLoading ? (
        <Text>Loading…</Text>
      ) : error ? (
        <Text style={{ color: 'red' }}>Failed to load</Text>
      ) : (data?.length ?? 0) === 0 ? (
        <Text>No consultations yet.</Text>
      ) : (
        <FlatList
          data={data || []}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          keyExtractor={(item: any, index) => item.id ?? String(index)}
          renderItem={({ item }: { item: any }) => (
            <Card style={{ marginBottom: 10 }}>
              <Card.Title title={`Status: ${item.status}`} subtitle={new Date(item.scheduledAt).toLocaleString()} />
              <Card.Content>
                {item.notes ? <Text>{item.notes}</Text> : null}
              </Card.Content>
              {item.status === 'pending' ? (
                <Card.Actions>
                  <Button onPress={() => cancel(item.id)}>Cancel</Button>
                </Card.Actions>
              ) : null}
            </Card>
          )}
        />
      )}
    </View>
  );
}
