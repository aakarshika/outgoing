/** React Query hooks for needs data. */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  applyToNeed,
  createEventNeed,
  fetchEventNeeds,
  fetchMyApplications,
  fetchMyNeedInvites,
  fetchMyPotentialOpportunities,
  fetchMyVendorOpportunities,
  inviteVendorToNeed,
  reviewNeedApplication,
  updateNeedApplication,
} from './api';

export function useEventNeeds(eventId: number) {
  return useQuery({
    queryKey: ['eventNeeds', eventId],
    queryFn: () => fetchEventNeeds(eventId),
    enabled: !!eventId,
  });
}

export function useMyApplications() {
  return useQuery({
    queryKey: ['myApplications'],
    queryFn: fetchMyApplications,
  });
}

export function useCreateEventNeed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: number; payload: any }) =>
      createEventNeed(eventId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['eventNeeds', variables.eventId] });
    },
  });
}

export function useApplyToNeed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ needId, payload }: { needId: number; payload: any }) =>
      applyToNeed(needId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventNeeds'] });
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['myVendorOpportunities'] });
    },
  });
}

export function useReviewNeedApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      status,
    }: {
      applicationId: number;
      status: 'accepted' | 'rejected';
    }) => reviewNeedApplication(applicationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventNeeds'] });
    },
  });
}

export function useUpdateNeedApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      payload,
    }: {
      applicationId: number;
      payload: {
        service_id?: number | null;
        message?: string;
        proposed_price?: number | null;
      };
    }) => updateNeedApplication(applicationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      queryClient.invalidateQueries({ queryKey: ['eventNeeds'] });
    },
  });
}

export function useInviteVendorToNeed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      needId,
      payload,
    }: {
      needId: number;
      payload: { vendor_id: number; message?: string };
    }) => inviteVendorToNeed(needId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['myVendorOpportunities'] });
      queryClient.invalidateQueries({ queryKey: ['eventNeeds'] });
    },
  });
}

export function useMyVendorOpportunities() {
  return useQuery({
    queryKey: ['myVendorOpportunities'],
    queryFn: fetchMyVendorOpportunities,
  });
}

export function useMyPotentialOpportunities() {
  return useQuery({
    queryKey: ['myPotentialOpportunities'],
    queryFn: fetchMyPotentialOpportunities,
  });
}

export function useMyNeedInvites() {
  return useQuery({
    queryKey: ['myNeedInvites'],
    queryFn: fetchMyNeedInvites,
  });
}
