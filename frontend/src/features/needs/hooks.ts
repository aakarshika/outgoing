/** React Query hooks for needs data. */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchEventNeeds,
    fetchMyApplications,
    createEventNeed,
    applyToNeed,
    reviewNeedApplication,
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
        },
    });
}

export function useReviewNeedApplication() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ applicationId, status }: { applicationId: number; status: 'accepted' | 'rejected' }) =>
            reviewNeedApplication(applicationId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['eventNeeds'] });
        },
    });
}
