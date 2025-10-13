import React from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { quizzes } from '@/data/quizzes';

export default function QuizHome({ navigation }: any) {
  return (
    <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
      <Text variant="titleLarge">Kuis Kesehatan Mental</Text>
      <Text style={{ marginBottom: 8 }}>
        Pilih kuis yang ingin kamu jalani untuk memahami kondisi emosionalmu.
      </Text>
      {quizzes.map(quiz => (
        <Card key={quiz.id}>
          <Card.Title title={quiz.title} subtitle={quiz.description} />
          <Card.Actions>
            <Button mode="contained" onPress={() => navigation.navigate('QuizTake', { quizId: quiz.id })}>
              Mulai
            </Button>
          </Card.Actions>
        </Card>
      ))}
      <View style={{ marginTop: 16 }}>
        <Button mode="text" onPress={() => navigation.navigate('QuizHistory')}>
          Lihat Riwayat Kuis
        </Button>
      </View>
    </ScrollView>
  );
}
