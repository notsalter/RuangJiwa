import React from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import * as Journals from '@/services/collections/journals';
import type { JournalEntry } from '@/models/types';
import { useAuth, type AuthState } from '@/store/auth';

const moodLabels: Record<string, string> = {
  very_sad: 'Sangat Sedih',
  sad: 'Sedih',
  neutral: 'Netral',
  happy: 'Senang',
  very_happy: 'Sangat Senang',
};

export default function JournalEntryDetail({ route, navigation }: any) {
  const queryClient = useQueryClient();
  const userId = useAuth((state: AuthState) => state.userId);
  const entryId: string | undefined = route?.params?.entryId;

  const { data, isLoading, error } = useQuery<JournalEntry | undefined>({
    queryKey: ['journal', entryId],
    queryFn: () => (entryId ? Journals.getById(entryId) : Promise.resolve(undefined)),
    enabled: !!entryId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => (entryId ? Journals.remove(entryId) : Promise.resolve()),
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['journals', userId] });
      }
      navigation.goBack();
    },
    onError: () => {
      Alert.alert('Gagal', 'Tidak dapat menghapus catatan. Coba lagi nanti.');
    },
  });

  const handleDelete = () => {
    Alert.alert('Hapus Catatan', 'Kamu yakin ingin menghapus catatan ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  };

  if (!entryId) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>Catatan tidak ditemukan.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>Memuat…</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ color: 'red' }}>Catatan tidak ditemukan atau sudah dihapus.</Text>
      </View>
    );
  }

  const created = data.createdAt ? new Date(data.createdAt) : undefined;
  const readableDate = created ? created.toLocaleString() : '';
  const moodEmoji: Record<string, string> = {
    very_sad: '😢',
    sad: '🙁',
    neutral: '😐',
    happy: '🙂',
    very_happy: '😄',
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="titleLarge">{data.title || 'Catatan'}</Text>
        <Button mode="text" onPress={() => navigation.navigate('JournalEntryEdit' as never, { entryId } as never)}>
          Edit
        </Button>
      </View>
      <Text style={{ color: '#6b7280' }}>{readableDate}</Text>
      <Chip icon={() => <Text style={{ fontSize: 18 }}>{moodEmoji[data.mood || 'neutral'] || '😐'}</Text>}>
        {moodLabels[data.mood || 'neutral'] || 'Netral'}
      </Chip>
      {data.prompt ? (
        <View style={{ backgroundColor: '#eef2ff', padding: 12, borderRadius: 8 }}>
          <Text variant="titleSmall" style={{ marginBottom: 4 }}>
            Prompt
          </Text>
          <Text>{data.prompt}</Text>
        </View>
      ) : null}
      <Text style={{ lineHeight: 24 }}>{data.content}</Text>
      <Button
        mode="contained"
        onPress={handleDelete}
        buttonColor="#dc2626"
        loading={deleteMutation.isPending}
        disabled={deleteMutation.isPending}
      >
        Hapus Catatan
      </Button>
    </ScrollView>
  );
}
