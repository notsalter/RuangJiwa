import React from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useAuth } from '@/store/auth';
import { useMoodHistory } from '@/hooks/queries/useMoodHistory';
import { VictoryAxis, VictoryChart, VictoryLine, VictoryTheme } from 'victory-native';

const moodToScore: Record<string, number> = {
  very_sad: 1,
  sad: 2,
  neutral: 3,
  happy: 4,
  very_happy: 5,
};

const moodEmoji: Record<string, string> = { very_sad: '😢', sad: '🙁', neutral: '😐', happy: '🙂', very_happy: '😄' };

function ChartSection({ points }: { points: Array<{ x: number; y: number }> }) {
  if (points.length <= 1) return null;
  return (
    <View style={{ backgroundColor: 'white', borderRadius: 8, padding: 4, marginBottom: 12 }}>
      <VictoryChart height={180} theme={VictoryTheme.material} padding={{ left: 40, right: 20, top: 10, bottom: 30 }}>
        <VictoryAxis tickFormat={() => ''} />
        <VictoryAxis dependentAxis tickValues={[1, 2, 3, 4, 5]} tickFormat={['😢', '🙁', '😐', '🙂', '😄']} style={{ tickLabels: { fontSize: 12 } }} />
        <VictoryLine data={points} interpolation="monotoneX" style={{ data: { stroke: '#4f46e5', strokeWidth: 2 } }} />
      </VictoryChart>
    </View>
  );
}

function HistoryItem({ item }: { item: any }) {
  const created = new Date(item.createdAt);
  const name = item.mood?.replaceAll('_', ' ') || 'neutral';
  return (
    <Card style={{ marginBottom: 10 }}>
      <Card.Title title={`${moodEmoji[item.mood] || '😐'}  ${name}`} subtitle={created.toLocaleString()} />
      {item.note ? (
        <Card.Content>
          <Text>{item.note}</Text>
        </Card.Content>
      ) : null}
    </Card>
  );
}

export default function MoodHistory() {
  const userId = useAuth(s => s.userId);
  const { data, isLoading, error, refetch, isRefetching } = useMoodHistory(userId || '');

  if (isLoading) {
    return (
      <View style={{ flex: 1, padding: 12 }}>
        <Text variant="titleLarge" style={{ marginBottom: 8 }}>Mood History</Text>
        <Text>Loading…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, padding: 12 }}>
        <Text variant="titleLarge" style={{ marginBottom: 8 }}>Mood History</Text>
        <Text style={{ color: 'red' }}>Failed to load</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={{ flex: 1, padding: 12 }}>
        <Text variant="titleLarge" style={{ marginBottom: 8 }}>Mood History</Text>
        <Text>No entries.</Text>
      </View>
    );
  }

  const chartData = data
    .slice()
    .reverse()
    .map((m: any, idx: number) => ({ x: idx + 1, y: moodToScore[m.mood] ?? 3 }));

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Text variant="titleLarge" style={{ marginBottom: 8 }}>Mood History</Text>
      <ChartSection points={chartData} />
      <FlatList
        data={data || []}
        keyExtractor={(item: { id: string }) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }: { item: any }) => <HistoryItem item={item} />}
      />
    </View>
  );
}
