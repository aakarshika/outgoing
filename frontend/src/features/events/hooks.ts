/** React Query hooks for events and feed data. */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { EventLifecycleState } from '@/types/events';

import {
  addEventHighlight,
  addEventReview,
  createEventSeries,
  deleteEvent,
  fetchCarouselEvents,
  fetchCategories,
  fetchEvent,
  fetchEventAttendees,
  fetchEventAutocomplete,
  fetchEventLifecycleHistory,
  fetchEventSeriesDetail,
  fetchEventSeriesList,
  fetchEventSeriesOccurrences,
  fetchEventStory,
  fetchFeaturedEvent,
  fetchFeed,
  fetchHighlightsFeed,
  fetchIconicHostsFeed,
  fetchMyEvents,
  fetchMyInterestedEvents,
  fetchMyTickets,
  fetchRecentlyViewed,
  fetchTopVendorsFeed,
  fetchUpcomingFeed,
  generateEventSeriesOccurrences,
  purchaseTicket,
  updateEventTicketTiers,
  updateTicket,
  cancelTicket,
  recordEventView,
  toggleInterest,
  transitionEventLifecycle,
  updateEventSeries,
} from './api';

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

export function useCarouselEvents() {
  return useQuery({
    queryKey: ['feed', 'carousel'],
    queryFn: fetchCarouselEvents,
  });
}

export function useRecentlyViewed() {
  return useQuery({
    queryKey: ['feed', 'recently-viewed'],
    queryFn: () => fetchRecentlyViewed(20),
    staleTime: 1000 * 60, // refresh every minute
  });
}

export function useHighlightsFeed() {
  return useQuery({
    queryKey: ['feed', 'highlights'],
    queryFn: () => fetchHighlightsFeed(20),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpcomingFeed() {
  return useQuery({
    queryKey: ['feed', 'upcoming'],
    queryFn: () => fetchUpcomingFeed(20),
    staleTime: 1000 * 60 * 5,
  });
}

export function useIconicHostsFeed() {
  return useQuery({
    queryKey: ['feed', 'iconic-hosts'],
    queryFn: () => fetchIconicHostsFeed(10),
    staleTime: 1000 * 60 * 5,
  });
}

export function useTopVendorsFeed() {
  return useQuery({
    queryKey: ['feed', 'top-vendors'],
    queryFn: () => fetchTopVendorsFeed(10),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRecordEventView(eventId: number) {
  return useMutation({
    mutationFn: () => recordEventView(eventId),
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
    mutationFn: ({
      eventId,
      isInterested,
    }: {
      eventId: number;
      isInterested: boolean;
    }) => toggleInterest(eventId, isInterested),
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

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: number) => deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      queryClient.invalidateQueries({ queryKey: ['eventSeriesOccurrences'] });
    },
  });
}

export function useUpdateTicketTiers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, tiers, updateSeries }: { eventId: number; tiers: Array<{ name: string, price: string, capacity?: number | null, is_refundable: boolean, refund_percentage?: number, description?: string, admits?: number }>, updateSeries?: boolean }) =>
      updateEventTicketTiers(eventId, tiers, updateSeries),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function usePurchaseTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      tickets,
    }: {
      eventId: number;
      tickets: Array<{ tier_id?: number | null, guest_name?: string, is_18_plus: boolean }>;
    }) => purchaseTicket(eventId, { tickets }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['myTickets'] });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, guestName }: { ticketId: number; guestName: string }) =>
      updateTicket(ticketId, guestName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTickets'] });
    },
  });
}

export function useCancelTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: number) => cancelTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTickets'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
    },
  });
}

export function useMyEvents() {
  return useQuery({
    queryKey: ['myEvents'],
    queryFn: fetchMyEvents,
  });
}

export function useMyInterestedEvents() {
  return useQuery({
    queryKey: ['myInterestedEvents'],
    queryFn: fetchMyInterestedEvents,
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
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
    },
  });
}

export function useAddEventReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, formData }: { eventId: number; formData: FormData }) =>
      addEventReview(eventId, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['eventStory', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
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
      queryClient.invalidateQueries({
        queryKey: ['eventSeriesDetail', variables.seriesId],
      });
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
      queryClient.invalidateQueries({
        queryKey: ['eventSeriesOccurrences', variables.seriesId],
      });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
