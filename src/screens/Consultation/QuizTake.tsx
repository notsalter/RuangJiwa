import React from 'react';
import { Alert, View } from 'react-native';
import { Button, Card, RadioButton, Text } from 'react-native-paper';
import { calculateScore, getQuizDefinition, resolveCategory, type QuizOption } from '@/data/quizzes';
import * as QuizHistoryService from '@/services/collections/quizHistory';
import { useAuth, type AuthState } from '@/store/auth';

export default function QuizTake({ route, navigation }: any) {
  const userId = useAuth((state: AuthState) => state.userId);
  const quizId: string | undefined = route?.params?.quizId;
  const quiz = React.useMemo(() => (quizId ? getQuizDefinition(quizId) : undefined), [quizId]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<number[]>([]);
  const [selectedValue, setSelectedValue] = React.useState<number | undefined>();
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (quiz) {
      setAnswers(new Array(quiz.questions.length).fill(-1));
      setCurrentIndex(0);
      setSelectedValue(undefined);
    }
  }, [quiz]);

  React.useEffect(() => {
    if (!quiz) {
      navigation.goBack();
    }
  }, [quiz, navigation]);

  React.useEffect(() => {
    if (quiz && quiz.questions.length > 0) {
      const value = answers[currentIndex];
      setSelectedValue(value >= 0 ? value : undefined);
    }
  }, [answers, currentIndex, quiz]);

  if (!quiz) {
    return null;
  }

  const question = quiz.questions[currentIndex];

  const onSelect = (value: number) => {
    setSelectedValue(value);
    setAnswers((prev: number[]) => {
      const next = [...prev];
      next[currentIndex] = value;
      return next;
    });
  };

  const goBack = () => {
    if (currentIndex === 0) {
      navigation.goBack();
      return;
    }
    setCurrentIndex((index: number) => index - 1);
  };

  const goForward = () => {
    if (selectedValue === undefined) {
      Alert.alert('Lengkapi Jawaban', 'Pilih salah satu jawaban sebelum melanjutkan.');
      return;
    }

    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((index: number) => index + 1);
      return;
    }

    submit();
  };

  const submit = async () => {
    if (selectedValue === undefined) {
      Alert.alert('Lengkapi Jawaban', 'Pilih salah satu jawaban sebelum mengirim.');
      return;
    }

    if (!userId) {
      Alert.alert('Butuh Masuk', 'Masuk untuk menyimpan hasil kuis.');
      return;
    }

    const allAnswered = answers.every((value: number) => value >= 0);
    if (!allAnswered) {
      Alert.alert('Lengkapi Jawaban', 'Jawab semua pertanyaan sebelum mengirim.');
      return;
    }

    const totalScore = calculateScore(answers);
    const category = resolveCategory(totalScore, quiz.categories);

    setSaving(true);
    try {
      await QuizHistoryService.add({
        userId,
        quizType: quiz.id,
        score: totalScore,
        category: category.id,
        takenAt: new Date().toISOString(),
      });
      navigation.replace('QuizResult', {
        result: {
          quizId: quiz.id,
          quizTitle: quiz.title,
          score: totalScore,
          categoryId: category.id,
          categoryTitle: category.title,
          description: category.description,
        },
      });
    } catch (error) {
      Alert.alert('Gagal Menyimpan', 'Periksa koneksi internetmu dan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text variant="titleLarge">{quiz.title}</Text>
      <Text>{`Pertanyaan ${currentIndex + 1} dari ${quiz.questions.length}`}</Text>
      <Card>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 12 }}>
            {question.prompt}
          </Text>
          <RadioButton.Group
            onValueChange={(value: string) => onSelect(Number(value))}
            value={selectedValue !== undefined ? String(selectedValue) : ''}
          >
            {question.options.map((option: QuizOption) => (
              <RadioButton.Item
                key={`${question.id}_${option.id}`}
                label={option.label}
                value={String(option.value)}
                position="trailing"
              />
            ))}
          </RadioButton.Group>
        </Card.Content>
      </Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <Button mode="outlined" onPress={goBack} disabled={saving}>
          Kembali
        </Button>
        <Button mode="contained" onPress={goForward} loading={saving} disabled={saving}>
          {currentIndex === quiz.questions.length - 1 ? 'Selesai' : 'Berikutnya'}
        </Button>
      </View>
    </View>
  );
}
