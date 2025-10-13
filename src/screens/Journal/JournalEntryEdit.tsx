import React from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Button, Chip, Text, TextInput } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Journals from '@/services/collections/journals';
import type { JournalEntry } from '@/models/types';
import { useAuth, type AuthState } from '@/store/auth';
import { getRandomPrompt } from '@/data/journal';

const moods: Array<{ id: 'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy'; label: string; emoji: string }> = [
  { id: 'very_sad', label: 'Sangat Sedih', emoji: '😢' },
  { id: 'sad', label: 'Sedih', emoji: '🙁' },
  { id: 'neutral', label: 'Netral', emoji: '😐' },
  { id: 'happy', label: 'Senang', emoji: '🙂' },
  { id: 'very_happy', label: 'Sangat Senang', emoji: '😄' },
];

export default function JournalEntryEdit({ route, navigation }: any) {
  const userId = useAuth((state: AuthState) => state.userId);
  const queryClient = useQueryClient();
  const entryId: string | undefined = route?.params?.entryId;

  const { data, isLoading, error } = useQuery<JournalEntry | undefined>({
    queryKey: ['journal', entryId],
    queryFn: () => (entryId ? Journals.getById(entryId) : Promise.resolve(undefined)),
    enabled: !!entryId,
  });

  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [mood, setMood] = React.useState<'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy'>('neutral');
  const [prompt, setPrompt] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (data) {
      setTitle(data.title ?? '');
      setContent(data.content ?? '');
      setMood((data.mood as typeof mood) || 'neutral');
      setPrompt(data.prompt);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<JournalEntry>) => (entryId ? Journals.update(entryId, payload) : Promise.resolve()),
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['journals', userId] });
      }
      if (entryId) {
        queryClient.invalidateQueries({ queryKey: ['journal', entryId] });
      }
      navigation.goBack();
      Alert.alert('Tersimpan', 'Perubahan jurnal berhasil disimpan.');
    },
    onError: () => {
      Alert.alert('Gagal', 'Tidak dapat menyimpan perubahan. Coba lagi nanti.');
    },
  });

  const handleSave = () => {
    const trimmed = content.trim();
    if (trimmed.length < 10) {
      Alert.alert('Isi Terlalu Singkat', 'Tuliskan minimal 10 karakter agar catatan lebih bermakna.');
      return;
    }
    updateMutation.mutate({
      title: title.trim() || undefined,
      content: trimmed,
      mood,
      prompt,
    });
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

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text variant="titleLarge">Edit Catatan</Text>
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
      ) : null}
      {!prompt ? (
        <Button mode="text" onPress={() => setPrompt(getRandomPrompt())}>
          Butuh inspirasi? Dapatkan prompt
        </Button>
      ) : null}
      <TextInput
        label="Cerita Kamu"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={8}
        textAlignVertical="top"
        style={{ minHeight: 160 }}
      />
      <Button mode="contained" onPress={handleSave} loading={updateMutation.isPending} disabled={updateMutation.isPending}>
        Simpan
      </Button>
    </ScrollView>
  );
}
