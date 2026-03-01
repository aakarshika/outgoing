/** React Query hooks for event requests. */

import { useQuery } from '@tanstack/react-query';

import { fetchRequests } from './api';

export function useRequests(params: {
    category?: string;
    sort?: 'trending' | 'newest';
    page?: number;
    page_size?: number;
}) {
    return useQuery({
        queryKey: ['requests', params],
        queryFn: () => fetchRequests(params),
    });
}
