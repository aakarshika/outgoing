/** Shared types for the events domain. */

import type { EventOverviewRow as AlertsEventOverviewRow } from '@/pages/alerts/utils';
import type { NeedApplication as EventNeedApplication } from './needs';

export interface EventCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface EventHost {
  id: number;
  username: string;
  first_name: string;
  avatar: string | null;
}

export interface EventAddon {
  id: number;
  addon_slug: string;
  description: string;
  created_at: string;
  updated_at: string;
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
  host: BaseFeedUser;
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
  /** @deprecated Use `lifecycle_state` for phase / visibility; synced legacy field from API. */
  status: string;
  lifecycle_state: EventLifecycleState;
  capacity: number | null;
  interest_count: number;
  ticket_count: number;
  user_is_interested: boolean;
  user_has_ticket: boolean;
  user_is_vendor: boolean;
  series?: { id: number; name: string } | null;
  occurrence_index?: number | null;
  media?: EventMedia[];
  description?: string;
  reviews?: any[];
  average_rating?: number | null;
  ticket_tiers?: EventTicketTier[];
  /**
   * When available, represents when the event was created.
   * Some list endpoints may omit this; callers should fall back to `start_time` if needed.
   */
  created_at?: string;
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
  category: EventCategory | null;
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
  user_applications?: VendorApplicationInfo[];
  attendees?: AttendeeInfo[];
  addons?: EventAddon[];
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

/** Public discovery: visible, bookable phases (omit draft and terminal states). */
export const DISCOVERABLE_LIFECYCLE_STATES: readonly EventLifecycleState[] = [
  'published',
  'event_ready',
  'live',
] as const;

export interface EventLifecycleTransition {
  id: number;
  from_state: EventLifecycleState;
  to_state: EventLifecycleState;
  reason: string;
  metadata: Record<string, unknown>;
  actor_username: string | null;
  created_at: string;
}

export type EventOverviewRow = AlertsEventOverviewRow;
export type NeedApplication = EventNeedApplication;

export interface VendorApplicationInfo {
  id: number;
  need_id: number;
  need_title: string;
  vendor_name: string;
  service_id: number | null;
  status: string;
  proposed_price: string | null;
  barcode?: string;
  qr_token?: string;
  admitted_at?: string | null;
}

export interface TicketInfo {
  tier_id: number;
  id: number;
  name: string;
  description: string;
  event_summary: EventDetail;
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
  attendee_name?: string;
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
  user_id: number;
  username: string;
  avatar: string | null;
  is_verified: boolean;
}

export interface EventSearchSuggestion extends Partial<EventListItem> {
  id: number;
  title: string;
  location_name: string;
  category_name: string | null;
  category_slug?: string | null;
  /**
   * Optional richer fields for search UI cards.
   * When available, these let us render full scrapbook cards directly
   * from autocomplete results.
   */
  start_time?: string;
  category?: EventCategory | null;
}

export type BaseFeedSort = 'popularity' | 'distance' | 'created' | 'start_time';

export interface BaseFeedParams {
  sort?: BaseFeedSort;
  online?: boolean;
  /** Filter by `Event.lifecycle_state` (comma-separated in the request). Preferred over `status`. */
  lifecycle_states?: EventLifecycleState[];
  /** @deprecated Prefer `lifecycle_states`; this maps to the coarse legacy `Event.status` column. */
  status?: string | string[];
  include_host_drafts?: boolean;
  start_time_gte?: string;
  start_time_lte?: string;
  category?: string;
  categories?: string[];
  free_only?: boolean;
  has_needs?: boolean;
  lat?: number;
  lng?: number;
  page?: number;
  page_size?: number;
}

export interface BaseFeedUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
}

export interface BaseFeedService {
  id: number;
  title: string;
  description: string;
  category: string;
  visibility: string;
  base_price: string | null;
  portfolio_image: string | null;
  location_city: string;
  is_active: boolean;
}

export interface BaseFeedNeedApplication {
  id: number;
  vendor: BaseFeedUser;
  service: BaseFeedService | null;
  message: string;
  proposed_price: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
  i_have_applied: boolean;
}

export interface BaseFeedAssignedVendor {
  user: BaseFeedUser;
  service: BaseFeedService | null;
  i_am_assigned_vendor: boolean;
}

export interface BaseFeedNeed {
  id: number;
  title: string;
  description: string;
  category: string;
  criticality: string;
  budget_min: string | null;
  budget_max: string | null;
  status: string;
  application_count: number;
  applications: BaseFeedNeedApplication[];
  i_have_applied: boolean;
  assigned_vendor: BaseFeedAssignedVendor | null;
  created_at: string;
}

export interface BaseFeedEventItem {
  id: number;
  title: string;
  subtitle: string;
  day: string;
  month: string;
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
  /** @deprecated Use `lifecycle_state` for phase / visibility; synced legacy field from API. */
  status: string;
  lifecycle_state: EventLifecycleState;
  capacity: number | null;
  interest_count: number;
  ticket_count: number;
  user_is_interested: boolean;
  user_has_ticket: boolean;
  user_is_vendor: boolean;
  series?: { id: number; name: string } | null;
  occurrence_index?: number | null;
  media?: EventMedia[];
  description?: string;
  reviews?: any[];
  average_rating?: number | null;
  ticket_tiers?: EventTicketTier[];
  event: EventListItem;
  needs: BaseFeedNeed[];
  host: BaseFeedUser;
  event_popularity_score: number;
  tickets_sold_count: number;
  saved_count: number;
  highlights_count: number;
  review_count: number;
  min_ticket_price: number;
  i_am_host: boolean;
  i_have_ticket: boolean;
  i_have_saved: boolean;
  distance_km: number | null;
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
