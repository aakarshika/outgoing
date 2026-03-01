/** Shared types for the vendors domain. */

import type { ApiResponse } from './events';

export interface VendorService {
    id: number;
    vendor_name: string;
    vendor_avatar: string | null;
    title: string;
    description: string;
    category: string;
    visibility: 'customer_facing' | 'operational';
    base_price: string | null;
    portfolio_image: string | null;
    location_city: string;
    is_active: boolean;
    created_at: string;
}

export type VendorServiceListResponse = ApiResponse<VendorService[]>;
export type VendorServiceDetailResponse = ApiResponse<VendorService>;
