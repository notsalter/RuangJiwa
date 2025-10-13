import { useQuery } from '@tanstack/react-query';
import * as Moods from '@/services/collections/moods';

export function useMoodHistory(userId: string) {
  return useQuery({
    queryKey: ['moods', userId],
    queryFn: () => Moods.listForUser(userId),
    enabled: !!userId,
  });
}
