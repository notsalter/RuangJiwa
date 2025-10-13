import { useQuery } from '@tanstack/react-query';
import * as Journals from '@/services/collections/journals';

export function useJournalEntries(userId: string) {
  return useQuery({
    queryKey: ['journals', userId],
    queryFn: () => Journals.listForUser(userId),
    enabled: !!userId,
  });
}
