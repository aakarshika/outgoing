/** API functions for event requests. */

import client from '@/api/client';
import type { EventRequestsResponse } from '@/types/requests';

export async function fetchRequests(params: {
    category?: string;
    sort?: 'trending' | 'newest';
    page?: number;
    page_size?: number;
}) {
    const { data } = await client.get<EventRequestsResponse>('/requests/', { params });
    return data;
}
