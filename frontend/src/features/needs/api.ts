/** API functions for the needs domain. */

import client from '@/api/client';
import type {
  EventNeed,
  EventNeedListResponse,
  NeedApplication,
  NeedApplicationDetailResponse,
  NeedInvite,
  NeedInviteDetailResponse,
  VendorOpportunityListResponse,
} from '@/types/needs';

export async function fetchEventNeeds(eventId: number) {
  const { data } = await client.get<EventNeedListResponse>(`/needs/events/${eventId}/`);
  return data;
}

export async function fetchMyApplications() {
  const { data } = await client.get<{ success: boolean; data: NeedApplication[] }>(
    '/needs/applications/my/',
  );
  return data;
}

export async function createEventNeed(eventId: number, payload: any) {
  const { data } = await client.post<{
    success: boolean;
    data: EventNeed;
    message: string;
  }>(`/needs/events/${eventId}/`, payload);
  return data;
}

export async function applyToNeed(
  needId: number,
  payload: {
    service_id?: number | null;
    message?: string;
    proposed_price?: number | null;
  },
) {
  const { data } = await client.post<NeedApplicationDetailResponse>(
    `/needs/${needId}/apply/`,
    payload,
  );
  return data;
}

export async function reviewNeedApplication(
  applicationId: number,
  status: 'accepted' | 'rejected',
) {
  const { data } = await client.patch<NeedApplicationDetailResponse>(
    `/needs/applications/${applicationId}/review/`,
    { status },
  );
  return data;
}

export async function updateNeedApplication(
  applicationId: number,
  payload: {
    service_id?: number | null;
    message?: string;
    proposed_price?: number | null;
  },
) {
  const { data } = await client.patch<NeedApplicationDetailResponse>(
    `/needs/applications/${applicationId}/`,
    payload,
  );
  return data;
}

export async function inviteVendorToNeed(
  needId: number,
  payload: { vendor_id: number; message?: string },
) {
  const { data } = await client.post<NeedInviteDetailResponse>(
    `/needs/${needId}/invite/`,
    payload,
  );
  return data;
}

export async function fetchMyVendorOpportunities() {
  const { data } = await client.get<VendorOpportunityListResponse>(
    '/needs/opportunities/my/',
  );
  return data;
}

export async function fetchMyPotentialOpportunities() {
  const { data } = await client.get<VendorOpportunityListResponse>(
    '/needs/opportunities/potential/',
  );
  return data;
}

export async function fetchMyNeedInvites() {
  const { data } = await client.get<{ success: boolean; data: NeedInvite[] }>(
    '/needs/invites/my/',
  );
  return data;
}

export async function updateEventNeed(
  needId: number,
  payload: {
    status?: 'open' | 'filled' | 'cancelled' | 'override_filled';
    title?: string;
    description?: string;
    category?: string;
    criticality?: string;
    budget_min?: string | null;
    budget_max?: string | null;
  },
) {
  const { data } = await client.patch<{
    success: boolean;
    data: EventNeed;
    message: string;
  }>(`/needs/${needId}/`, payload);
  return data;
}
