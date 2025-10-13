import React from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useAuth, type AuthState } from '@/store/auth';
import { useQuizHistory } from '@/hooks/queries/useQuizHistory';
import type { QuizHistory as QuizHistoryModel } from '@/models/types';

function HistoryItem({ item }: { item: QuizHistoryModel }) {
  const takenAt = item.takenAt ? new Date(item.takenAt) : undefined;
  const readableDate = takenAt ? takenAt.toLocaleString() : 'Tanggal tidak tersedia';
  const categoryName =
    {
      low: 'Rendah',
      moderate: 'Sedang',
      high: 'Tinggi',
    }[item.category as 'low' | 'moderate' | 'high'] || item.category;

  return (
    <Card style={{ marginBottom: 10 }}>
      <Card.Title
        title={`Kategori: ${categoryName}`}
        subtitle={`${item.score} poin • ${readableDate}`}
      />
      <Card.Content>
        <Text>Jenis kuis: {item.quizType}</Text>
      </Card.Content>
    </Card>
  );
}

export default function QuizHistory() {
  const userId = useAuth((state: AuthState) => state.userId);
  const { data, isLoading, error, refetch, isRefetching } = useQuizHistory(userId || '');

  if (!userId) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text variant="titleLarge" style={{ marginBottom: 8 }}>
          Riwayat Kuis
        </Text>
        <Text>Masuk untuk melihat riwayat kuis kamu.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text variant="titleLarge" style={{ marginBottom: 8 }}>
        Riwayat Kuis
      </Text>
      {isLoading ? (
        <Text>Memuat…</Text>
      ) : error ? (
        <Text style={{ color: 'red' }}>Gagal memuat riwayat. Tarik untuk mencoba lagi.</Text>
      ) : !data || data.length === 0 ? (
        <Text>Belum ada riwayat kuis.</Text>
      ) : (
        <FlatList<QuizHistoryModel>
          data={data}
          keyExtractor={(item: QuizHistoryModel) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }: { item: QuizHistoryModel }) => <HistoryItem item={item} />}
        />
      )}
    </View>
  );
}
