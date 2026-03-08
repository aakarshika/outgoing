/** Shared types for the events domain. */

export interface EventCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface EventHost {
  username: string;
  first_name: string;
  avatar: string | null;
}

export interface EventMedia {
  id: number;
  media_type: 'image' | 'video';
  category: 'gallery' | 'highlight';
  file: string;
  order: number;
  created_at: string;
}

export interface EventTicketTier {
  id: number;
  name: string;
  color: string;
  price: string;
  capacity: number | null;
  sold_count: number;
  is_refundable: boolean;
  refund_percentage: number;
  description: string;
  admits: number;
}

export interface EventListItem {
  id: number;
  host: EventHost;
  title: string;
  slug: string;
  category: EventCategory | null;
  location_name: string;
  location_address?: string;
  latitude?: number | null;
  longitude?: number | null;
  start_time: string;
  end_time: string;
  ticket_price_standard: string | null;
  ticket_price_flexible: string | null;
  cover_image: string | null;
  status: string;
  lifecycle_state: EventLifecycleState;
  capacity: number | null;
  interest_count: number;
  ticket_count: number;
  user_is_interested: boolean;
  user_has_ticket: boolean;
  series?: { id: number; name: string } | null;
  occurrence_index?: number | null;
  media?: EventMedia[];
  description?: string;
  reviews?: any[];
  average_rating?: number | null;
  ticket_tiers?: EventTicketTier[];
}

export interface EventSeriesNeedTemplate {
  id: number;
  title: string;
  description: string;
  category: string;
  criticality: string;
  budget_min: string | null;
  budget_max: string | null;
  created_at: string;
}

export interface EventSeries {
  id: number;
  host: EventHost;
  name: string;
  description: string;
  recurrence_rule: string;
  timezone: string;
  default_location_name: string;
  default_location_address: string;
  default_capacity: number | null;
  default_ticket_price_standard: string | null;
  default_ticket_price_flexible: string | null;
  created_at: string;
}

export interface EventSeriesDetail extends EventSeries {
  need_templates: EventSeriesNeedTemplate[];
}

export interface EventDetail extends EventListItem {
  description: string;
  location_address: string;
  event_ready_message: string;
  check_in_instructions: string;
  latitude: number | null;
  longitude: number | null;
  refund_window_hours: number;
  tags: string[];
  features?: { name: string; tag: 'featured' | 'additional' | 'extra' }[];
  tickets_remaining: number | null;
  created_at: string;
  highlights?: any[];
  reviews?: any[];
  average_rating?: number | null;
  participating_vendors?: any[];
  host_events_count?: number;
  user_tickets?: TicketInfo[];
  attendees?: AttendeeInfo[];
}

export type EventLifecycleState =
  | 'draft'
  | 'published'
  | 'at_risk'
  | 'postponed'
  | 'event_ready'
  | 'live'
  | 'cancelled'
  | 'completed';

export interface EventLifecycleTransition {
  id: number;
  from_state: EventLifecycleState;
  to_state: EventLifecycleState;
  reason: string;
  metadata: Record<string, unknown>;
  actor_username: string | null;
  created_at: string;
}

export interface TicketInfo {
  id: number;
  name: string;
  description: string;
  event_summary: {
    id: number;
    title: string;
    start_time: string;
    location_name: string;
  };
  ticket_type: string;
  guest_name?: string;
  barcode?: string;
  is_refundable: boolean;
  refund_deadline: string | null;
  price_paid: string;
  status: string;
  used_at?: string | null;
  purchased_at: string;
  updated_at: string;
  needs_aadhar_verification?: boolean;
  qr_token?: string;
}

export interface EventAttendee {
  id: number;
  user: EventHost;
  tier_id?: number;
  ticket_type: string;
  color?: string;
  guest_name?: string;
  barcode?: string;
  status: string;
  used_at?: string | null;
  price_paid?: string;
  purchased_at: string;
}

export interface AttendeeInfo {
  username: string;
  avatar: string | null;
  is_verified: boolean;
}

export interface EventSearchSuggestion {
  id: number;
  title: string;
  location_name: string;
  category_name: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: {
    page?: number;
    page_size?: number;
    total_count?: number;
  };
}
