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
    fetchEventStory,
    addEventHighlight,
    addEventReview,
    fetchEventSeriesList,
    createEventSeries,
    fetchEventSeriesDetail,
    updateEventSeries,
    fetchEventSeriesOccurrences,
    generateEventSeriesOccurrences,
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

export function useEventStory(eventId: number) {
    return useQuery({
        queryKey: ['eventStory', eventId],
        queryFn: () => fetchEventStory(eventId),
        enabled: !!eventId,
    });
}

export function useAddEventHighlight() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ eventId, formData }: { eventId: number; formData: FormData }) =>
            addEventHighlight(eventId, formData),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['eventStory', variables.eventId] });
        },
    });
}

export function useAddEventReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ eventId, payload }: { eventId: number; payload: { rating: number; text: string } }) =>
            addEventReview(eventId, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['eventStory', variables.eventId] });
        },
    });
}

// --- Event Series ---

export function useEventSeriesList() {
    return useQuery({
        queryKey: ['eventSeriesList'],
        queryFn: fetchEventSeriesList,
    });
}

export function useEventSeriesDetail(seriesId: number) {
    return useQuery({
        queryKey: ['eventSeriesDetail', seriesId],
        queryFn: () => fetchEventSeriesDetail(seriesId),
        enabled: !!seriesId,
    });
}

export function useEventSeriesOccurrences(seriesId: number, params?: any) {
    return useQuery({
        queryKey: ['eventSeriesOccurrences', seriesId, params],
        queryFn: () => fetchEventSeriesOccurrences(seriesId, params),
        enabled: !!seriesId,
    });
}

export function useCreateEventSeries() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createEventSeries,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['eventSeriesList'] });
            queryClient.invalidateQueries({ queryKey: ['myEvents'] });
        },
    });
}

export function useUpdateEventSeries() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ seriesId, payload }: { seriesId: number; payload: any }) =>
            updateEventSeries(seriesId, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['eventSeriesDetail', variables.seriesId] });
            queryClient.invalidateQueries({ queryKey: ['eventSeriesList'] });
        },
    });
}

export function useGenerateEventSeriesOccurrences() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ seriesId, payload }: { seriesId: number; payload: any }) =>
            generateEventSeriesOccurrences(seriesId, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['eventSeriesOccurrences', variables.seriesId] });
            queryClient.invalidateQueries({ queryKey: ['myEvents'] });
            queryClient.invalidateQueries({ queryKey: ['feed'] });
        },
    });
}
