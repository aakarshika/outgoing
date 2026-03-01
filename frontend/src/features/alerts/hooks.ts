/** React Query hooks for DB-driven alerts. */

import { useQuery } from '@tanstack/react-query';

import { fetchAlerts } from './api';

export function useAlerts() {
    return useQuery({
        queryKey: ['alerts'],
        queryFn: fetchAlerts,
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        refetchInterval: 1000 * 60,
    });
}
