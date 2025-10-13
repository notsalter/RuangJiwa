import { useQuery } from '@tanstack/react-query';
import * as Psychologists from '@/services/collections/psychologists';

export function usePsychologists() {
  return useQuery({
    queryKey: ['psychologists'],
    queryFn: () => Psychologists.list(),
  });
}
