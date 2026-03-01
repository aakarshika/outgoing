/** Shared types for actionable alerts. */

import type { ApiResponse } from './events';

export type AlertPriority = 'low' | 'medium' | 'high';

export interface AppAlert {
    id: string;
    type: string;
    title: string;
    message: string;
    cta_label: string;
    cta_route: string;
    priority: AlertPriority;
}

export type AlertsResponse = ApiResponse<AppAlert[]>;
