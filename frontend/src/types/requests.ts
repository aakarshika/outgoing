/** Shared types for event requests. */

import type { ApiResponse, EventCategory } from './events';

export interface EventRequest {
  id: number;
  requester_name: string;
  title: string;
  description: string;
  category: EventCategory | null;
  location_city: string;
  upvote_count: number;
  status: string;
  user_has_upvoted: boolean;
  user_wishlist_as: 'goer' | 'host' | 'vendor' | null;
  created_at: string;
}

export type EventRequestsResponse = ApiResponse<EventRequest[]>;
