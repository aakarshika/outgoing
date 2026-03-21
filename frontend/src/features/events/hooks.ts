/** React Query hooks for events and feed data. */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BaseFeedParams, EventLifecycleState } from '@/types/events';

import {
  addDirectMessage,
  addEventHighlight,
  addEventReview,
  addHighlightComment,
  addHostVendorMessage,
  addPrivateMessage,
  addReviewComment,
  cancelTicket,
  createEventSeries,
  deleteEvent,
  deleteEventReview,
  fetchAllChatsList,
  fetchConversationInbox,
  fetchCarouselEvents,
  fetchCategories,
  fetchBaseFeed,
  fetchDirectMessages,
  fetchEvent,
  fetchEventAttendees,
  fetchEventAutocomplete,
  fetchEventHighlights,
  fetchEventLifecycleHistory,
  fetchEventOverviewRows,
  fetchEventSeriesDetail,
  fetchEventSeriesList,
  fetchEventSeriesOccurrences,
  fetchFeaturedEvent,
  fetchFeed,
  fetchFriendRequestStatus,
  fetchHighlightComments,
  fetchHighlightsFeed,
  fetchHostVendorMessages,
  fetchIconicHostsFeed,
  fetchMyEvents,
  fetchMyFriendships,
  fetchMyFriendshipsByOrbitCategory,
  fetchMyInterestedEvents,
  fetchMyTickets,
  fetchNetworkActivity,
  fetchNetworkPeople,
  fetchPrivateMessages,
  fetchRecentlyViewed,
  fetchReviewComments,
  fetchTopVendorsFeed,
  fetchTrendingHighlights,
  fetchUpcomingFeed,
  generateEventSeriesOccurrences,
  getOrCreatePrivateConversation,
  purchaseTicket,
  recordEventView,
  sendFriendRequest,
  toggleHighlightLike,
  toggleInterest,
  toggleReviewLike,
  transitionEventLifecycle,
  updateEventReview,
  updateEventSeries,
  updateEventTicketTiers,
  updateFriendRequest,
  updateTicket,
} from './api';

function updateHighlightCollection(
  items: any[] | undefined,
  highlightId: number,
  updater: (highlight: any) => any,
) {
  if (!Array.isArray(items)) return items;

  let didChange = false;
  const nextItems = items.map((item) => {
    if (item?.id !== highlightId) return item;
    didChange = true;
    return updater(item);
  });

  return didChange ? nextItems : items;
}

function updateHighlightInCachedData(
  cachedData: any,
  highlightId: number,
  updater: (highlight: any) => any,
) {
  if (!cachedData) return cachedData;

  if (Array.isArray(cachedData)) {
    return updateHighlightCollection(cachedData, highlightId, updater);
  }

  if (Array.isArray(cachedData.data)) {
    const nextData = updateHighlightCollection(cachedData.data, highlightId, updater);
    if (nextData === cachedData.data) return cachedData;
    return { ...cachedData, data: nextData };
  }

  return cachedData;
}

function isHighlightQueryKey(queryKey: readonly unknown[]) {
  return queryKey.some((part) => String(part).includes('highlight'));
}

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
  lifecycle_states?: EventLifecycleState[];
  start_time_gte?: string;
  start_time_lte?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery({
    queryKey: ['feed', params],
    queryFn: () => fetchFeed(params),
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
}

export function useBaseFeed(params: BaseFeedParams = {}) {
  return useQuery({
    queryKey: ['feed', 'base', params],
    queryFn: () => fetchBaseFeed(params),
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
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

const trendingHighlightsOrderByPageSize = new Map<number, number[]>();

export function useTrendingHighlights(pageSize = 20) {
  return useQuery({
    queryKey: ['feed', 'trending-highlights', pageSize],
    queryFn: () => fetchTrendingHighlights(pageSize),
    staleTime: 1000 * 60 * 5,
    select: (response) => {
      const items = (response?.data || []) as any[];
      if (!items.length) return response;

      const storedOrder = trendingHighlightsOrderByPageSize.get(pageSize);
      if (!storedOrder) {
        trendingHighlightsOrderByPageSize.set(
          pageSize,
          items.map((item) => item?.id).filter((id): id is number => typeof id === 'number'),
        );
        return response;
      }

      const itemById = new Map<number, any>();
      for (const item of items) {
        if (item?.id != null) itemById.set(item.id, item);
      }

      const ordered: any[] = [];
      for (const id of storedOrder) {
        const item = itemById.get(id);
        if (item) ordered.push(item);
      }

      const remaining = items.filter((item) => !storedOrder.includes(item?.id));
      return { ...response, data: [...ordered, ...remaining] };
    },
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
    queryFn: () => fetchIconicHostsFeed(50),
    staleTime: 1000 * 60 * 5,
  });
}

export function useTopVendorsFeed() {
  return useQuery({
    queryKey: ['feed', 'top-vendors'],
    queryFn: () => fetchTopVendorsFeed(50),
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
        max_passes_per_ticket?: number;
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
      queryClient.invalidateQueries({ queryKey: ['hostVendorMessages'] });
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
    onMutate: async (highlightId) => {
      await queryClient.cancelQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey.includes('Highlights'),
      });
      await queryClient.cancelQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey.includes('highlights'),
      });

      const touchedQueries = queryClient
        .getQueryCache()
        .findAll()
        .filter((query) => {
          const key = query.queryKey;
          return Array.isArray(key) && isHighlightQueryKey(key);
        })
        .map((query) => [query.queryKey, query.state.data] as const);

      touchedQueries.forEach(([queryKey]) => {
        queryClient.setQueryData(queryKey, (current: any) =>
          updateHighlightInCachedData(current, highlightId, (highlight) => {
            const currentlyLiked = Boolean(highlight.user_has_liked);
            const nextLiked = !currentlyLiked;

            return {
              ...highlight,
              user_has_liked: nextLiked,
              likes_count: Math.max(
                0,
                (Number(highlight.likes_count) || 0) + (nextLiked ? 1 : -1),
              ),
            };
          }),
        );
      });

      return { touchedQueries };
    },
    onError: (_error, _highlightId, context) => {
      context?.touchedQueries?.forEach(
        ([queryKey, data]: readonly [readonly unknown[], any]) => {
          queryClient.setQueryData(queryKey, data);
        },
      );
    },
    onSuccess: (response, highlightId) => {
      queryClient
        .getQueryCache()
        .findAll()
        .filter((query) => {
          const key = query.queryKey;
          return Array.isArray(key) && isHighlightQueryKey(key);
        })
        .forEach((query) => {
          queryClient.setQueryData(query.queryKey, (current: any) =>
            updateHighlightInCachedData(current, highlightId, (highlight) => ({
              ...highlight,
              user_has_liked: response?.data?.liked ?? highlight.user_has_liked,
              likes_count: response?.data?.likes_count ?? highlight.likes_count,
            })),
          );
        });

      queryClient.invalidateQueries({ queryKey: ['eventHighlights'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['eventStory'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'trending-highlights'] });
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
      queryClient
        .getQueryCache()
        .findAll()
        .filter((query) => {
          const key = query.queryKey;
          return Array.isArray(key) && isHighlightQueryKey(key);
        })
        .forEach((query) => {
          queryClient.setQueryData(query.queryKey, (current: any) =>
            updateHighlightInCachedData(
              current,
              variables.highlightId,
              (highlight) => ({
                ...highlight,
                comments_count: (Number(highlight.comments_count) || 0) + 1,
              }),
            ),
          );
        });
      queryClient.invalidateQueries({ queryKey: ['eventHighlights'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'trending-highlights'] });
    },
  });
}

export function useHostVendorMessages(eventId: number, enabled = true) {
  return useQuery({
    queryKey: ['hostVendorMessages', eventId],
    queryFn: () => fetchHostVendorMessages(eventId),
    enabled: !!eventId && enabled,
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
      queryClient.invalidateQueries({ queryKey: ['conversation-inbox'] });
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
      queryClient.invalidateQueries({ queryKey: ['conversation-inbox'] });
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

export function useDirectMessages(targetUsername?: string) {
  return useQuery({
    queryKey: ['direct-messages', targetUsername],
    queryFn: () => (targetUsername ? fetchDirectMessages(targetUsername) : null),
    enabled: !!targetUsername,
    refetchInterval: 5000,
  });
}

export function useAllChatsList(enabled = true) {
  return useQuery({
    queryKey: ['all-chats-list'],
    queryFn: fetchAllChatsList,
    enabled,
    refetchInterval: 10000,
  });
}

export function useConversationInbox(enabled = true) {
  return useQuery({
    queryKey: ['conversation-inbox'],
    queryFn: fetchConversationInbox,
    enabled,
    refetchInterval: 10000,
  });
}

export function useEventOverviewRows(enabled = true) {
  return useQuery({
    queryKey: ['event-overview-rows'],
    queryFn: fetchEventOverviewRows,
    enabled,
    refetchInterval: 30000,
  });
}

export function useAddDirectMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      targetUsername,
      payload,
    }: {
      targetUsername: string;
      payload: { text: string };
    }) => addDirectMessage(targetUsername, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['direct-messages', variables.targetUsername],
      });
      queryClient.invalidateQueries({ queryKey: ['conversation-inbox'] });
    },
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      targetUsername,
      payload,
    }: {
      eventId: number;
      targetUsername: string;
      payload: { request_message?: string };
    }) => sendFriendRequest(eventId, targetUsername, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          'friend-request-status',
          variables.eventId,
          variables.targetUsername,
        ],
      });
      queryClient.invalidateQueries({ queryKey: ['my-friendships'] });
      queryClient.invalidateQueries({ queryKey: ['my-friendships-by-orbit'] });
    },
  });
}

export function useMyFriendships(enabled = true) {
  return useQuery({
    queryKey: ['my-friendships'],
    queryFn: () => fetchMyFriendships(),
    enabled,
  });
}

export function useMyFriendshipsByOrbitCategory(enabled = true) {
  return useQuery({
    queryKey: ['my-friendships-by-orbit'],
    queryFn: () => fetchMyFriendshipsByOrbitCategory(),
    enabled,
  });
}

export function useNetworkPeople(enabled = true) {
  return useQuery({
    queryKey: ['network-people'],
    queryFn: () => fetchNetworkPeople(),
    enabled,
  });
}

export function useNetworkActivity(enabled = true) {
  return useQuery({
    queryKey: ['network-activity'],
    queryFn: () => fetchNetworkActivity(),
    enabled,
  });
}

export function useFriendRequestStatus(
  eventId?: number,
  targetUsername?: string | null,
) {
  return useQuery({
    queryKey: ['friend-request-status', eventId, targetUsername],
    queryFn: () =>
      eventId && targetUsername
        ? fetchFriendRequestStatus(eventId, targetUsername)
        : null,
    enabled: !!eventId && !!targetUsername,
  });
}

export function useUpdateFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      targetUsername,
      payload,
    }: {
      eventId: number;
      targetUsername: string;
      payload: { action: 'accept' | 'withdraw' | 'unfriend' };
    }) => updateFriendRequest(eventId, targetUsername, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          'friend-request-status',
          variables.eventId,
          variables.targetUsername,
        ],
      });
      queryClient.invalidateQueries({ queryKey: ['my-friendships'] });
      queryClient.invalidateQueries({ queryKey: ['my-friendships-by-orbit'] });
    },
  });
}
