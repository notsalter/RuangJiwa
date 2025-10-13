import React from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { Button, Card, FAB, Text } from 'react-native-paper';
import { useAuth, type AuthState } from '@/store/auth';
import { useJournalEntries } from '@/hooks/queries/useJournalEntries';
import type { JournalEntry } from '@/models/types';

export default function JournalHome({ navigation }: any) {
  const userId = useAuth((state: AuthState) => state.userId);
  const { data, isLoading, error, refetch, isRefetching } = useJournalEntries(userId || '');

  if (!userId) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text variant="titleLarge" style={{ marginBottom: 8 }}>
          Jurnal
        </Text>
        <Text>Masuk untuk menulis dan melihat catatan jurnalmu.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text variant="titleLarge">Jurnal</Text>
        <Button mode="text" onPress={() => navigation.navigate('JournalEntryNew')}>
          Tulis Baru
        </Button>
      </View>
      {isLoading ? (
        <Text>Memuat…</Text>
      ) : error ? (
        <Text style={{ color: 'red' }}>Gagal memuat jurnal. Tarik untuk mencoba lagi.</Text>
      ) : !data || data.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ marginBottom: 12 }}>Belum ada catatan. Mulai dengan menulis pengalaman hari ini.</Text>
          <Button mode="contained" onPress={() => navigation.navigate('JournalEntryNew')}>
            Tulis Catatan
          </Button>
        </View>
      ) : (
        <FlatList<JournalEntry>
          data={data}
          keyExtractor={(item: JournalEntry) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }: { item: JournalEntry }) => (
            <JournalListItem entry={item} onPress={() => navigation.navigate('JournalEntryDetail', { entryId: item.id })} />
          )}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
      <FAB icon="plus" style={{ position: 'absolute', right: 24, bottom: 24 }} onPress={() => navigation.navigate('JournalEntryNew')} />
    </View>
  );
}

function JournalListItem({ entry, onPress }: { entry: JournalEntry; onPress: () => void }) {
  const created = entry.createdAt ? new Date(entry.createdAt) : undefined;
  const readableDate = created ? created.toLocaleString() : '';
  const moodEmoji: Record<string, string> = {
    very_sad: '😢',
    sad: '🙁',
    neutral: '😐',
    happy: '🙂',
    very_happy: '😄',
  };

  return (
    <Card style={{ marginBottom: 12 }} onPress={onPress}>
      <Card.Title
        title={entry.title || 'Catatan'}
        subtitle={readableDate}
        left={() => (
          <View style={{ width: 36, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20 }}>{moodEmoji[entry.mood || 'neutral'] || '😐'}</Text>
          </View>
        )}
      />
      {entry.content ? (
        <Card.Content>
          <Text numberOfLines={2}>{entry.content}</Text>
        </Card.Content>
      ) : null}
    </Card>
  );
}
