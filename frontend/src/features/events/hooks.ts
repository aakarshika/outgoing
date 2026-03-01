/** React Query hooks for events and feed data. */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchFeed,
    fetchFeaturedEvent,
    fetchCategories,
    fetchEvent,
    toggleInterest,
    purchaseTicket,
    fetchMyEvents,
    fetchMyTickets,
    fetchEventAttendees,
} from './api';

export function useFeed(params: {
    category?: string;
    sort?: string;
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
