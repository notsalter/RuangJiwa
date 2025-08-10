import { useQuery } from '@tanstack/react-query';
import * as Consultations from '@/services/collections/consultations';

export function useConsultations(userId: string) {
  return useQuery({
    queryKey: ['consultations', userId],
    queryFn: () => Consultations.listForUser(userId),
    enabled: !!userId,
  });
}
