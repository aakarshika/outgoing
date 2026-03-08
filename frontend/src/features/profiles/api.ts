/** API functions for the profiles domain. */

import client from '@/api/client';
import type { ApiResponse } from '@/types/events';

export interface UserActivity {
  id: number;
  type: 'event_review' | 'vendor_review' | 'review_comment' | 'highlight_comment';
  title?: string;
  event_id?: number;
  service_id?: number;
  event_title?: string;
  target_title?: string;
  target_id?: number;
  rating?: number;
  text: string;
  created_at: string;
}

export interface MyActivitiesResponse {
  reviews: UserActivity[];
  comments: UserActivity[];
}

export async function fetchMyActivities() {
  const { data } = await client.get<ApiResponse<MyActivitiesResponse>>(
    '/profiles/activities/',
  );
  return data;
}
