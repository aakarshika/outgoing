/** React Query hooks for profiles domain. */

import { useQuery } from '@tanstack/react-query';

import { fetchMyActivities } from './api';

export function useMyActivities() {
  return useQuery({
    queryKey: ['myActivities'],
    queryFn: fetchMyActivities,
  });
}
