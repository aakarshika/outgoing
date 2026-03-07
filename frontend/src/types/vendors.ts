/** Shared types for the vendors domain. */

import type { ApiResponse, EventListItem } from './events';

export interface VendorService {
  id: number;
  vendor_id: number;
  vendor_name: string;
  vendor_avatar: string | null;
  title: string;
  description: string;
  category: string;
  visibility: 'customer_facing' | 'operational';
  base_price: string | null;
  travel_radius_miles?: string | null;
  portfolio_url?: string | null;
  portfolio_image: string | null;
  location_city: string;
  is_active: boolean;
  created_at: string;
  avg_rating?: number;
  event_count?: number;
  reviews?: Array<{
    id: number;
    reviewer_username: string;
    reviewer_avatar: string | null;
    rating: number;
    text: string;
    created_at: string;
  }>;
  past_events?: EventListItem[];
}

export type VendorServiceListResponse = ApiResponse<VendorService[]>;
export type VendorServiceDetailResponse = ApiResponse<VendorService>;
