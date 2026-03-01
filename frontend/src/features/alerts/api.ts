/** API functions for DB-driven alerts. */

import client from '@/api/client';
import type { AlertsResponse } from '@/types/alerts';

export async function fetchAlerts() {
    const { data } = await client.get<AlertsResponse>('/alerts/');
    return data;
}
