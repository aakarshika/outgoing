/** Shared types for the needs domain. */

import type { ApiResponse } from './events';

export interface NeedApplication {
  vendor_id: string;
  id: number;
  need_id: number;
  vendor_name: string;
  need_title?: string;
  event_title?: string;
  event_id?: number;
  service: number | null; // ID of the VendorService
  message: string;
  cover_letter?: string;
  proposed_price: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  barcode?: string;
  qr_token?: string;
  admitted_at?: string | null;
  created_at: string;
}

export interface EventNeed {
  id: number;
  title: string;
  description: string;
  category: string;
  criticality: 'essential' | 'replaceable' | 'non_substitutable';
  budget_min: string | null;
  budget_max: string | null;
  status: 'open' | 'pending' | 'filled' | 'cancelled' | 'override_filled';
  assigned_vendor: number | null;
  application_count: number;
  applications: NeedApplication[];
  created_at: string;
}

export interface NeedInvite {
  id: number;
  need: number;
  need_title: string;
  event_id: number;
  event_title: string;
  vendor: number;
  invited_by_username: string;
  message: string;
  status: 'pending' | 'applied' | 'dismissed';
  created_at: string;
}

export interface VendorOpportunity {
  need_id: number;
  event_id: number;
  event_title: string;
  event_start_time: string;
  event_location_name: string;
  need_title: string;
  need_description: string;
  category: string;
  criticality: 'essential' | 'replaceable' | 'non_substitutable';
  budget_min: string | null;
  budget_max: string | null;
  is_invited: boolean;
}

export type EventNeedListResponse = ApiResponse<EventNeed[]>;
export type NeedApplicationDetailResponse = ApiResponse<NeedApplication>;
export type NeedInviteDetailResponse = ApiResponse<NeedInvite>;
export type VendorOpportunityListResponse = ApiResponse<VendorOpportunity[]>;
