import React from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

interface QuizResultParams {
  quizId: string;
  quizTitle: string;
  score: number;
  categoryId: string;
  categoryTitle: string;
  description: string;
}

export default function QuizResult({ route, navigation }: any) {
  const params: QuizResultParams | undefined = route?.params?.result;

  React.useEffect(() => {
    if (!params) {
      navigation.popToTop();
    }
  }, [navigation, params]);

  if (!params) {
    return null;
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text variant="titleLarge">{params.quizTitle}</Text>
      <Card>
        <Card.Content>
          <Text variant="titleMedium">Kategori: {params.categoryTitle}</Text>
          <Text style={{ marginTop: 4 }}>Skor: {params.score}</Text>
          <Text style={{ marginTop: 12 }}>{params.description}</Text>
        </Card.Content>
      </Card>
      <Button mode="contained" onPress={() => navigation.navigate('QuizHistory')}>
        Lihat Riwayat
      </Button>
      <Button mode="text" onPress={() => navigation.navigate('ConsultationList')}>
        Kembali ke Konsultasi
      </Button>
    </View>
  );
}
