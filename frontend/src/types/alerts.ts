/** Shared types for actionable alerts. */

import type { ApiResponse } from './events';

export type AlertPriority = 'low' | 'medium' | 'high';

/**
 * Optional structured context for rich, scrapbook-style alert UIs.
 * Backed by DB joins on events, vendors, applications, etc.
 */
export interface AlertMeta {
  // Minimal shape – concrete types live in their feature modules.
  // We keep this loose so backend can evolve without breaking the UI.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vendor?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  application?: any;
}

export interface AppAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  cta_label: string;
  cta_route: string;
  priority: AlertPriority;
  meta?: AlertMeta;
}

export type AlertsResponse = ApiResponse<AppAlert[]>;
