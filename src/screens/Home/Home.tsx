import React from 'react';
import { ScrollView, View, FlatList, StyleSheet } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useAuth, type AuthState } from '@/store/auth';
import { useConsultations } from '@/hooks/queries/useConsultations';
import { useMoodHistory } from '@/hooks/queries/useMoodHistory';
import { useRecommendations } from '@/hooks/queries/useRecommendations';
import { usePsychologists } from '@/hooks/queries/usePsychologists';
import type { RecommendationItem, Psychologist } from '@/models/types';
import type { Consultation } from '@/services/collections/consultations';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function formatDateTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

const moodEmoji: Record<string, string> = {
  very_sad: '😢',
  sad: '🙁',
  neutral: '😐',
  happy: '🙂',
  very_happy: '😄',
};

function formatMoodLabel(mood?: string) {
  if (!mood) return 'Netral';
  return mood
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function Home({ navigation }: any) {
  const userId = useAuth((state: AuthState) => state.userId);
  const { data: consultations } = useConsultations(userId || '');
  const { data: moods } = useMoodHistory(userId || '');
  const { data: recommendations, isLoading: loadingRecommendations } = useRecommendations();
  const { data: psychologists } = usePsychologists();

  const nextConsultation = React.useMemo(() => {
    if (!consultations || consultations.length === 0) {
      return undefined;
    }
    type WithDate = Consultation & { scheduledAtDate: Date };
    const enriched: WithDate[] = consultations
      .filter((item: Consultation) => Boolean(item.scheduledAt))
      .map((item: Consultation) => ({ ...item, scheduledAtDate: new Date(item.scheduledAt as string) }));
    return enriched
      .filter((item: WithDate) => !Number.isNaN(item.scheduledAtDate.getTime()) && item.scheduledAtDate.getTime() >= Date.now())
      .sort((a: WithDate, b: WithDate) => a.scheduledAtDate.getTime() - b.scheduledAtDate.getTime())[0];
  }, [consultations]);

  const lastMood = moods && moods.length > 0 ? moods[0] : undefined;
  const greeting = getGreeting();
  const psychologistName = React.useMemo(() => {
    if (!nextConsultation || !psychologists) {
      return undefined;
    }
  const match = (psychologists as Psychologist[] | undefined)?.find((item: Psychologist) => item.id === nextConsultation.psychologistId);
    return match?.name;
  }, [nextConsultation, psychologists]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.section}>
        <Card.Content>
          <Text variant="titleMedium">{greeting}</Text>
          <Text variant="headlineMedium" style={styles.sectionSpacing}>Apa kabar hari ini?</Text>
          <View style={styles.actionsRow}>
            <Button mode="contained" onPress={() => navigation.navigate('Mood', { screen: 'MoodEntryNew' })}>
              Catat Mood
            </Button>
            <Button mode="text" onPress={() => navigation.navigate('Consultation', { screen: 'ConsultationList' })}>
              Konsultasi
            </Button>
            <Button mode="text" onPress={() => navigation.navigate('Journal', { screen: 'JournalEntryNew' })}>
              Tulis Jurnal
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Content>
          <Text variant="titleMedium">Konsultasi Berikutnya</Text>
          {nextConsultation ? (
            <View style={styles.sectionSpacing}>
              <Text variant="titleLarge">{formatDateTime(nextConsultation.scheduledAt)}</Text>
              <Text>{`Psikolog: ${psychologistName || nextConsultation.psychologistId}`}</Text>
            </View>
          ) : (
            <Text style={styles.muted}>Belum ada jadwal. Booking konsultasi untuk tetap terhubung dengan psikolog.</Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Content>
          <Text variant="titleMedium">Mood Terakhir</Text>
          {lastMood ? (
            <View style={styles.sectionSpacing}>
              <Text variant="headlineMedium">{moodEmoji[lastMood.mood] || '😐'} {formatMoodLabel(lastMood.mood)}</Text>
              {lastMood.note ? <Text style={styles.muted}>{lastMood.note}</Text> : null}
              <Text style={styles.muted}>Dicatat pada {formatDateTime(lastMood.createdAt)}</Text>
            </View>
          ) : (
            <Text style={styles.muted}>Belum ada catatan mood. Mulai catat untuk memahami pola emosimu.</Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium">Rekomendasi Untukmu</Text>
            <Button mode="text" onPress={() => navigation.navigate('Mood', { screen: 'MoodHistory' })}>
              Lihat Semua
            </Button>
          </View>
          {loadingRecommendations ? (
            <Text>Memuat…</Text>
          ) : (
            <FlatList<RecommendationItem>
              data={recommendations || []}
              keyExtractor={(item: RecommendationItem) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }: { item: RecommendationItem }) => (
                <RecommendationCard item={item} onPress={() => handleRecommendationPress(item, navigation)} />
              )}
              contentContainerStyle={styles.horizontalList}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            />
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

function handleRecommendationPress(item: RecommendationItem, navigation: any) {
  switch (item.type) {
    case 'journal':
      navigation.navigate('Journal', { screen: 'JournalEntryNew' });
      break;
    case 'psychologist':
      navigation.navigate('Consultation', { screen: 'ConsultationList' });
      break;
    case 'audio':
    case 'article':
    default:
      navigation.navigate('Mood', { screen: 'MoodHistory' });
  }
}

function RecommendationCard({ item, onPress }: { item: RecommendationItem; onPress: () => void }) {
  return (
    <Card style={styles.recommendationCard} onPress={onPress}>
      <Card.Content>
        <Text variant="titleMedium" numberOfLines={2}>{item.title}</Text>
        {item.subtitle ? <Text style={styles.muted}>{item.subtitle}</Text> : null}
        <Text style={styles.tag}>{item.type.toUpperCase()}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    rowGap: 16,
  },
  section: {
    borderRadius: 16,
  },
  sectionSpacing: {
    marginTop: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    columnGap: 12,
    rowGap: 12,
    flexWrap: 'wrap',
  },
  muted: {
    color: '#6b7280',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  horizontalList: {
    paddingVertical: 4,
  },
  recommendationCard: {
    width: 220,
  },
  tag: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    color: '#6366f1',
  },
});
