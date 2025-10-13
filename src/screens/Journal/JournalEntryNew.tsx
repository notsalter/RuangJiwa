import React from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Button, Chip, Text, TextInput } from 'react-native-paper';
import { useAuth, type AuthState } from '@/store/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Journals from '@/services/collections/journals';
import { getRandomPrompt } from '@/data/journal';
import type { JournalEntry } from '@/models/types';

const moods: Array<{ id: 'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy'; label: string; emoji: string }> = [
  { id: 'very_sad', label: 'Sangat Sedih', emoji: '😢' },
  { id: 'sad', label: 'Sedih', emoji: '🙁' },
  { id: 'neutral', label: 'Netral', emoji: '😐' },
  { id: 'happy', label: 'Senang', emoji: '🙂' },
  { id: 'very_happy', label: 'Sangat Senang', emoji: '😄' },
];

export default function JournalEntryNew({ navigation }: any) {
  const userId = useAuth((state: AuthState) => state.userId);
  const queryClient = useQueryClient();
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [prompt, setPrompt] = React.useState<string | undefined>();
  const [mood, setMood] = React.useState<'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy'>('neutral');

  const createMutation = useMutation<JournalEntry, Error, Omit<JournalEntry, 'id'>>({
  mutationFn: (payload: Omit<JournalEntry, 'id'>) => Journals.create(payload),
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['journals', userId] });
      }
    },
    onError: () => {
      Alert.alert('Gagal', 'Tidak dapat menyimpan jurnal. Coba lagi nanti.');
    },
  });

  const handleSave = async () => {
    const trimmed = content.trim();
    if (!userId) {
      Alert.alert('Butuh Masuk', 'Masuk untuk menyimpan catatan jurnal.');
      return;
    }
    if (trimmed.length < 10) {
      Alert.alert('Isi Terlalu Singkat', 'Tuliskan minimal 10 karakter agar catatan lebih bermakna.');
      return;
    }

    await createMutation.mutateAsync({
      userId,
      title: title.trim() || undefined,
      content: trimmed,
      mood,
      prompt,
      createdAt: new Date().toISOString(),
      tags: [],
      isFavorite: false,
    });

    navigation.goBack();
    Alert.alert('Tersimpan', 'Catatan jurnal berhasil disimpan.');
  };

  const handleGeneratePrompt = () => {
    setPrompt(getRandomPrompt());
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text variant="titleLarge">Catatan Baru</Text>
      <TextInput label="Judul (opsional)" value={title} onChangeText={setTitle} autoCapitalize="sentences" />
      <View style={{ gap: 8 }}>
        <Text variant="titleMedium">Mood</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {moods.map(option => (
            <Chip
              key={option.id}
              selected={mood === option.id}
              onPress={() => setMood(option.id)}
              icon={() => <Text style={{ fontSize: 18 }}>{option.emoji}</Text>}
            >
              {option.label}
            </Chip>
          ))}
        </View>
      </View>
      {prompt ? (
        <View style={{ backgroundColor: '#eef2ff', padding: 12, borderRadius: 8 }}>
          <Text variant="titleSmall" style={{ marginBottom: 4 }}>
            Prompt
          </Text>
          <Text>{prompt}</Text>
          <Button mode="text" onPress={() => setPrompt(undefined)}>
            Sembunyikan prompt
          </Button>
        </View>
      ) : (
        <Button mode="text" onPress={handleGeneratePrompt}>
          Butuh inspirasi? Dapatkan prompt
        </Button>
      )}
      <TextInput
        label="Apa yang kamu rasakan hari ini?"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={8}
        textAlignVertical="top"
        style={{ minHeight: 160 }}
      />
      <Button mode="contained" onPress={handleSave} loading={createMutation.isPending} disabled={createMutation.isPending}>
        Simpan
      </Button>
    </ScrollView>
  );
}
