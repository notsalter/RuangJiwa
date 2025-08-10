import { useQuery } from '@tanstack/react-query';
import * as QuizHistory from '@/services/collections/quizHistory';

export function useQuizHistory(userId: string) {
  return useQuery({
    queryKey: ['quizHistory', userId],
    queryFn: () => QuizHistory.listForUser(userId),
    enabled: !!userId,
  });
}
