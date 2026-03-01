/** React Query hooks for events and feed data. */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchEventLifecycleHistory,
    fetchEventAutocomplete,
    fetchFeed,
    fetchFeaturedEvent,
    fetchCategories,
    fetchEvent,
    toggleInterest,
    purchaseTicket,
    fetchMyEvents,
    fetchMyTickets,
    transitionEventLifecycle,
    fetchEventAttendees,
} from './api';
import type { EventLifecycleState } from '@/types/events';

export function useFeed(params: {
    category?: string;
    sort?: string;
    search?: string;
    weekend?: boolean;
    lat?: number;
    lng?: number;
    radius_km?: number;
    page?: number;
}) {
    return useQuery({
        queryKey: ['feed', params],
        queryFn: () => fetchFeed(params),
    });
}

export function useFeaturedEvent() {
    return useQuery({
        queryKey: ['feed', 'featured'],
        queryFn: fetchFeaturedEvent,
    });
}

export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories,
        staleTime: 1000 * 60 * 30, // categories rarely change
    });
}

export function useEvent(eventId: number) {
    return useQuery({
        queryKey: ['event', eventId],
        queryFn: () => fetchEvent(eventId),
        enabled: !!eventId,
    });
}

export function useEventAttendees(eventId: number) {
    return useQuery({
        queryKey: ['eventAttendees', eventId],
        queryFn: () => fetchEventAttendees(eventId),
        enabled: !!eventId,
    });
}

export function useEventLifecycleHistory(eventId: number) {
    return useQuery({
        queryKey: ['eventLifecycleHistory', eventId],
        queryFn: () => fetchEventLifecycleHistory(eventId),
        enabled: !!eventId,
    });
}

export function useEventAutocomplete(query: string) {
    return useQuery({
        queryKey: ['eventAutocomplete', query],
        queryFn: () => fetchEventAutocomplete(query),
        enabled: query.trim().length >= 2,
        staleTime: 1000 * 30,
    });
}

export function useToggleInterest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ eventId, isInterested }: { eventId: number; isInterested: boolean }) =>
            toggleInterest(eventId, isInterested),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            queryClient.invalidateQueries({ queryKey: ['event'] });
        },
    });
}

export function useTransitionEventLifecycle() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            eventId,
            toState,
            reason,
        }: {
            eventId: number;
            toState: EventLifecycleState;
            reason?: string;
        }) =>
            transitionEventLifecycle(eventId, {
                to_state: toState,
                reason,
                metadata: { source: 'manage_event_ui' },
            }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
            queryClient.invalidateQueries({ queryKey: ['myEvents'] });
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            queryClient.invalidateQueries({
                queryKey: ['eventLifecycleHistory', variables.eventId],
            });
        },
    });
}

export function usePurchaseTicket() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ eventId, ticketType }: { eventId: number; ticketType: 'standard' | 'flexible' }) =>
            purchaseTicket(eventId, ticketType),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            queryClient.invalidateQueries({ queryKey: ['event'] });
            queryClient.invalidateQueries({ queryKey: ['myTickets'] });
        },
    });
}

export function useMyEvents() {
    return useQuery({
        queryKey: ['myEvents'],
        queryFn: fetchMyEvents,
    });
}

export function useMyTickets() {
    return useQuery({
        queryKey: ['myTickets'],
        queryFn: fetchMyTickets,
    });
}
