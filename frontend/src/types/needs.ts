/** Shared types for the needs domain. */

import type { ApiResponse } from './events';

export interface NeedApplication {
    id: number;
    vendor_name: string;
    need_title?: string;
    event_title?: string;
    event_id?: number;
    service: number | null; // ID of the VendorService
    message: string;
    proposed_price: string | null;
    status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
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
    status: 'open' | 'filled' | 'cancelled';
    assigned_vendor: number | null;
    application_count: number;
    applications: NeedApplication[];
    created_at: string;
}

export type EventNeedListResponse = ApiResponse<EventNeed[]>;
export type NeedApplicationDetailResponse = ApiResponse<NeedApplication>;
