/** React Query hooks for events and feed data. */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { EventLifecycleState } from '@/types/events';

import {
  addEventHighlight,
  addEventReview,
  addHighlightComment,
  addHostVendorMessage,
  addReviewComment,
  cancelTicket,
  createEventSeries,
  deleteEvent,
  deleteEventReview,
  fetchCarouselEvents,
  fetchCategories,
  fetchEvent,
  fetchEventAttendees,
  fetchEventAutocomplete,
  fetchEventHighlights,
  fetchEventLifecycleHistory,
  fetchEventSeriesDetail,
  fetchEventSeriesList,
  fetchEventSeriesOccurrences,
  fetchEventStory,
  fetchFeaturedEvent,
  fetchFeed,
  fetchHighlightComments,
  fetchHighlightsFeed,
  fetchHostVendorMessages,
  fetchIconicHostsFeed,
  fetchMyEvents,
  fetchMyInterestedEvents,
  fetchMyTickets,
  fetchRecentlyViewed,
  fetchReviewComments,
  fetchTopVendorsFeed,
  fetchTrendingHighlights,
  fetchUpcomingFeed,
  generateEventSeriesOccurrences,
  purchaseTicket,
  recordEventView,
  toggleHighlightLike,
  toggleInterest,
  toggleReviewLike,
  transitionEventLifecycle,
  updateEventReview,
  updateEventSeries,
  updateEventTicketTiers,
  updateTicket,
  fetchPrivateMessages,
  addPrivateMessage,
  getOrCreatePrivateConversation,
} from './api';

export function useFeed(params: {
  category?: string;
  sort?: string;
  search?: string;
  location?: string;
  weekend?: boolean;
  online?: boolean;
  lat?: number;
  lng?: number;
  radius_km?: number;
  featured?: boolean;
  page?: number;
  page_size?: number;
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

export function useTrendingHighlights(pageSize = 20) {
  return useQuery({
    queryKey: ['feed', 'trending-highlights', pageSize],
    queryFn: () => fetchTrendingHighlights(pageSize),
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
    mutationFn: ({
      eventId,
      tiers,
      updateSeries,
    }: {
      eventId: number;
      tiers: Array<{
        name: string;
        price: string;
        capacity?: number | null;
        is_refundable: boolean;
        refund_percentage?: number;
        description?: string;
        admits?: number;
      }>;
      updateSeries?: boolean;
    }) => updateEventTicketTiers(eventId, tiers, updateSeries),
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
      tickets: Array<{
        tier_id?: number | null;
        guest_name?: string;
        is_18_plus: boolean;
      }>;
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
    queryFn: () =>
      Promise.resolve({ success: true, message: '', data: null, meta: {} }),
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
export function useEventHighlights(eventId: number, series = false) {
  return useQuery({
    queryKey: ['eventHighlights', eventId, series],
    queryFn: () => fetchEventHighlights(eventId, series),
    enabled: !!eventId,
  });
}

export function useToggleHighlightLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (highlightId: number) => toggleHighlightLike(highlightId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventHighlights'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['eventStory'] });
    },
  });
}

export function useHighlightComments(highlightId: number) {
  return useQuery({
    queryKey: ['highlightComments', highlightId],
    queryFn: () => fetchHighlightComments(highlightId),
    enabled: !!highlightId,
  });
}

export function useAddHighlightComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      highlightId,
      payload,
    }: {
      highlightId: number;
      payload: { text: string; parent?: number };
    }) => addHighlightComment(highlightId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['highlightComments', variables.highlightId],
      });
      queryClient.invalidateQueries({ queryKey: ['eventHighlights'] });
    },
  });
}

export function useHostVendorMessages(eventId: number) {
  return useQuery({
    queryKey: ['hostVendorMessages', eventId],
    queryFn: () => fetchHostVendorMessages(eventId),
    enabled: !!eventId,
    refetchInterval: 5000,
  });
}

export function useAddHostVendorMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      payload,
    }: {
      eventId: number;
      payload: { text: string };
    }) => addHostVendorMessage(eventId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['hostVendorMessages', variables.eventId],
      });
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

export function useUpdateEventReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, formData }: { reviewId: number; formData: FormData }) =>
      updateEventReview(reviewId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['eventStory'] });
    },
  });
}

export function useDeleteEventReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: number) => deleteEventReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['eventStory'] });
    },
  });
}

export function useToggleReviewLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: number) => toggleReviewLike(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['eventStory'] });
    },
  });
}

export function useReviewComments(reviewId: number | null) {
  return useQuery({
    queryKey: ['reviewComments', reviewId],
    queryFn: () => {
      if (!reviewId)
        return Promise.resolve({ success: true, message: '', data: [], meta: {} });
      return fetchReviewComments(reviewId);
    },
    enabled: !!reviewId,
  });
}

export function useAddReviewComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reviewId,
      payload,
    }: {
      reviewId: number;
      payload: { text: string; parent?: number };
    }) => addReviewComment(reviewId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['reviewComments', variables.reviewId],
      });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['eventStory'] });
    },
  });
}

// --- Private Chat ---

export function usePrivateMessages(conversationId?: number) {
  return useQuery({
    queryKey: ['private-messages', conversationId],
    queryFn: () => (conversationId ? fetchPrivateMessages(conversationId) : null),
    enabled: !!conversationId,
    refetchInterval: 5000,
  });
}

export function useAddPrivateMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      payload,
    }: {
      conversationId: number;
      payload: { text: string };
    }) => addPrivateMessage(conversationId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['private-messages', variables.conversationId],
      });
    },
  });
}

export function useGetOrCreatePrivateConversation() {
  return useMutation({
    mutationFn: ({
      eventId,
      targetUsername,
    }: {
      eventId: number;
      targetUsername: string;
    }) => getOrCreatePrivateConversation(eventId, targetUsername),
  });
}
