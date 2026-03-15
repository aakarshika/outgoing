/** API functions for the events and feed domain. */

import client from '@/api/client';
import type {
  ApiResponse,
  EventAttendee,
  EventCategory,
  EventDetail,
  EventLifecycleState,
  EventLifecycleTransition,
  EventListItem,
  EventSearchSuggestion,
  EventSeries,
  EventSeriesDetail,
} from '@/types/events';

export interface AllChatsListItem {
  conversation_id: number;
  event_id: number | null;
  event_title: string | null;
  other_user_id: number | null;
  other_username: string | null;
  other_avatar: string | null;
  updated_at: string;
}

export interface AllChatsListResponse {
  management_group: {
    event_id: number;
    event_title: string;
    latest_message_at: string;
  }[];
  management: AllChatsListItem[];
  network: AllChatsListItem[];
}

// --- Feed ---

export async function fetchFeed(params: {
  category?: string;
  sort?: string;
  search?: string;
  location?: string;
  weekend?: boolean;
  online?: boolean; // Added online filter support
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
  const normalizedParams = {
    ...params,
    lifecycle_states: params.lifecycle_states?.join(','),
  };
  const { data } = await client.get<ApiResponse<EventListItem[]>>('/feed/', {
    params: normalizedParams,
  });
  return data;
}

export async function fetchFeaturedEvent() {
  const { data } = await client.get<ApiResponse<EventListItem>>('/feed/', {
    params: { featured: 'true' },
  });
  return data;
}

export async function fetchCarouselEvents() {
  const { data } = await client.get<ApiResponse<EventListItem[]>>('/feed/carousel/');
  return data;
}

export async function fetchRecentlyViewed(page_size = 20) {
  const { data } = await client.get<ApiResponse<EventListItem[]>>(
    '/feed/recently-viewed/',
    {
      params: { page_size },
    },
  );
  return data;
}

export async function fetchHighlightsFeed(page_size = 20) {
  const { data } = await client.get<ApiResponse<EventListItem[]>>('/feed/highlights/', {
    params: { page_size },
  });
  return data;
}

export async function fetchTrendingHighlights(page_size = 20) {
  const { data } = await client.get<ApiResponse<any[]>>('/feed/trending-highlights/', {
    params: { page_size },
  });
  return data;
}

export async function fetchUpcomingFeed(page_size = 20) {
  const { data } = await client.get<ApiResponse<EventListItem[]>>('/feed/upcoming/', {
    params: { page_size },
  });
  return data;
}

export async function fetchIconicHostsFeed(page_size = 50) {
  const { data } = await client.get<ApiResponse<any[]>>('/feed/iconic-hosts/', {
    params: { page_size },
  });
  return data;
}

export async function fetchTopVendorsFeed(page_size = 50) {
  const { data } = await client.get<ApiResponse<any[]>>('/feed/top-vendors/', {
    params: { page_size },
  });
  return data;
}

export async function recordEventView(eventId: number) {
  await client.post(`/events/${eventId}/view/`);
}

// --- Categories ---

export async function fetchCategories() {
  const { data } =
    await client.get<ApiResponse<EventCategory[]>>('/events/categories/');
  return data;
}

// --- Events ---

export async function fetchEvent(eventId: number) {
  const { data } = await client.get<ApiResponse<EventDetail>>(`/events/${eventId}/`);
  return data;
}

export async function fetchEvents(params: {
  category?: string;
  search?: string;
  page?: number;
  page_size?: number;
}) {
  const { data } = await client.get<ApiResponse<EventListItem[]>>('/events/', {
    params,
  });
  return data;
}

export async function fetchEventAttendees(eventId: number) {
  const { data } = await client.get<ApiResponse<EventAttendee[]>>(
    `/events/${eventId}/attendees/`,
  );
  return data;
}

export async function fetchEventStory(eventId: number) {
  const { data } = await client.get<ApiResponse<any>>(`/events/${eventId}/story/`);
  return data;
}

export async function fetchEventHighlights(eventId: number, series = false) {
  const { data } = await client.get<ApiResponse<any[]>>(
    `/events/${eventId}/highlights/`,
    { params: { series } },
  );
  return data;
}

export async function addEventHighlight(eventId: number, formData: FormData) {
  const { data } = await client.post<ApiResponse<any>>(
    `/events/${eventId}/highlights/`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return data;
}

export async function toggleHighlightLike(highlightId: number) {
  const { data } = await client.post<
    ApiResponse<{ liked: boolean; likes_count: number }>
  >(`/events/highlights/${highlightId}/like/`);
  return data;
}

export async function fetchHighlightComments(highlightId: number) {
  const { data } = await client.get<ApiResponse<any[]>>(
    `/events/highlights/${highlightId}/comments/`,
  );
  return data;
}

export async function addHighlightComment(
  highlightId: number,
  payload: { text: string; parent?: number },
) {
  const { data } = await client.post<ApiResponse<any>>(
    `/events/highlights/${highlightId}/comments/`,
    payload,
  );
  return data;
}

export async function fetchHostVendorMessages(eventId: number) {
  const { data } = await client.get<ApiResponse<any[]>>(
    `/events/${eventId}/host-vendor-messages/`,
  );
  return data;
}

export async function addHostVendorMessage(eventId: number, payload: { text: string }) {
  const { data } = await client.post<ApiResponse<any>>(
    `/events/${eventId}/host-vendor-messages/`,
    payload,
  );
  return data;
}

export async function addEventReview(eventId: number, formData: FormData) {
  const { data } = await client.post<ApiResponse<any>>(
    `/events/${eventId}/reviews/`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return data;
}

export async function transitionEventLifecycle(
  eventId: number,
  payload: {
    to_state: EventLifecycleState;
    reason?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const { data } = await client.post<
    ApiResponse<{ event: EventDetail; transition: EventLifecycleTransition | null }>
  >(`/events/${eventId}/lifecycle/transition/`, payload);
  return data;
}

export async function fetchEventLifecycleHistory(eventId: number) {
  const { data } = await client.get<ApiResponse<EventLifecycleTransition[]>>(
    `/events/${eventId}/lifecycle/history/`,
  );
  return data;
}

export async function fetchEventAutocomplete(query: string) {
  const { data } = await client.get<ApiResponse<EventSearchSuggestion[]>>(
    '/events/autocomplete/',
    {
      params: { q: query },
    },
  );
  return data;
}

export async function createEvent(formData: FormData) {
  const { data } = await client.post<ApiResponse<EventDetail>>('/events/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateEvent(eventId: number, formData: FormData) {
  const { data } = await client.patch<ApiResponse<EventDetail>>(
    `/events/${eventId}/`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return data;
}

export async function deleteEvent(eventId: number) {
  const { data } = await client.delete<ApiResponse<any>>(`/events/${eventId}/`);
  return data;
}

export async function updateEventTicketTiers(
  eventId: number,
  tiers: Array<{
    name: string;
    price: string;
    capacity?: number | null;
    is_refundable: boolean;
    refund_percentage?: number;
    description?: string;
    admits?: number;
  }>,
  updateSeries: boolean = false,
) {
  const { data } = await client.put<ApiResponse<any>>(
    `/events/${eventId}/ticket_tiers/`,
    tiers,
    {
      params: { update_series: updateSeries },
    },
  );
  return data;
}

// --- Interest ---

export async function toggleInterest(eventId: number, isInterested: boolean) {
  if (!isInterested) {
    const { data } = await client.delete<ApiResponse<{ interest_count: number }>>(
      `/events/${eventId}/interest/`,
    );
    return data;
  }
  const { data } = await client.post<ApiResponse<{ interest_count: number }>>(
    `/events/${eventId}/interest/`,
  );
  return data;
}

// --- Tickets ---

export async function purchaseTicket(
  eventId: number,
  payload: {
    tickets: Array<{
      tier_id?: number | null;
      guest_name?: string;
      is_18_plus: boolean;
    }>;
  },
) {
  const { data } = await client.post(`/tickets/events/${eventId}/`, payload);
  return data;
}

export async function updateTicket(ticketId: number, guestName: string) {
  const { data } = await client.patch(`/tickets/${ticketId}/`, {
    guest_name: guestName,
  });
  return data;
}

export async function cancelTicket(ticketId: number) {
  const { data } = await client.delete(`/tickets/${ticketId}/`);
  return data;
}

export async function fetchMyTickets() {
  const { data } = await client.get('/tickets/my/');
  return data;
}

export async function fetchMyEvents() {
  const { data } = await client.get('/events/my/');
  return data;
}

export async function fetchMyInterestedEvents() {
  const { data } = await client.get('/events/my/interested/');
  return data;
}

// --- Event Series ---

export async function fetchEventSeriesList() {
  const { data } = await client.get<ApiResponse<EventSeries[]>>('/event-series/');
  return data;
}

export async function createEventSeries(payload: any) {
  const { data } = await client.post<ApiResponse<EventSeries>>(
    '/event-series/',
    payload,
  );
  return data;
}

export async function fetchEventSeriesDetail(seriesId: number) {
  const { data } = await client.get<ApiResponse<EventSeriesDetail>>(
    `/event-series/${seriesId}/`,
  );
  return data;
}

export async function updateEventSeries(seriesId: number, payload: any) {
  const { data } = await client.patch<ApiResponse<EventSeriesDetail>>(
    `/event-series/${seriesId}/`,
    payload,
  );
  return data;
}

export async function fetchEventSeriesOccurrences(seriesId: number, params?: any) {
  const { data } = await client.get<ApiResponse<EventListItem[]>>(
    `/event-series/${seriesId}/occurrences/`,
    { params },
  );
  return data;
}

export async function generateEventSeriesOccurrences(seriesId: number, payload: any) {
  const { data } = await client.post<ApiResponse<EventListItem[]>>(
    `/event-series/${seriesId}/generate-occurrences/`,
    payload,
  );
  return data;
}

export async function updateEventReview(reviewId: number, formData: FormData) {
  const { data } = await client.patch<ApiResponse<any>>(
    `/events/reviews/${reviewId}/`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return data;
}

export async function deleteEventReview(reviewId: number) {
  const { data } = await client.delete<ApiResponse<any>>(
    `/events/reviews/${reviewId}/`,
  );
  return data;
}

export async function toggleReviewLike(reviewId: number) {
  const { data } = await client.post<
    ApiResponse<{ liked: boolean; likes_count: number }>
  >(`/events/reviews/${reviewId}/like/`);
  return data;
}

export async function fetchReviewComments(reviewId: number) {
  const { data } = await client.get<ApiResponse<any[]>>(
    `/events/reviews/${reviewId}/comments/`,
  );
  return data;
}

export async function addReviewComment(
  reviewId: number,
  payload: { text: string; parent?: number },
) {
  const { data } = await client.post<ApiResponse<any>>(
    `/events/reviews/${reviewId}/comments/`,
    payload,
  );
  return data;
}
export async function fetchPrivateMessages(conversationId: number) {
  const { data } = await client.get<ApiResponse<any[]>>(
    `/events/conversations/${conversationId}/messages/`,
  );
  return data;
}

export async function addPrivateMessage(
  conversationId: number,
  payload: { text: string },
) {
  const { data } = await client.post<ApiResponse<any>>(
    `/events/conversations/${conversationId}/messages/`,
    payload,
  );
  return data;
}

export async function fetchDirectMessages(targetUsername: string) {
  const { data } = await client.get<ApiResponse<any[]>>(
    `/events/direct-messages/${targetUsername}/`,
  );
  return data;
}

export interface FriendshipItem {
  id: number;
  user1: number;
  user2: number;
  user1_username: string;
  user2_username: string;
  request_sender: number;
  request_sender_username: string;
  request_message: string;
  status: string;
  accepted_at: string | null;
  met_at_event: number | null;
  met_at_event_title: string | null;
  created_at: string;
  updated_at: string;
}

export interface MyFriendshipsResponse {
  accepted: FriendshipItem[];
  pending_incoming: FriendshipItem[];
  pending_outgoing: FriendshipItem[];
}

export interface NetworkPerson {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  event_id?: number;
  event_title?: string;
}

export interface NetworkPeopleResponse {
  friends: NetworkPerson[];
  went_to_events_with: NetworkPerson[];
  hosts_met: NetworkPerson[];
  vendors_met: NetworkPerson[];
}

export async function fetchNetworkPeople(): Promise<NetworkPeopleResponse> {
  const { data } = await client.get<ApiResponse<NetworkPeopleResponse>>(
    '/events/network/people/',
  );
  const inner = (data as ApiResponse<NetworkPeopleResponse>)?.data;
  return (
    inner ?? {
      friends: [],
      went_to_events_with: [],
      hosts_met: [],
      vendors_met: [],
    }
  );
}

export interface NetworkActivityActor {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export interface NetworkActivityItem {
  kind: 'hosting' | 'going' | 'interested';
  actor: NetworkActivityActor;
  event_id: number;
  event_title: string;
  event_subtitle: string;
  happened_at: string;
}

export interface NetworkActivityResponse {
  activity: NetworkActivityItem[];
}

export async function fetchNetworkActivity(): Promise<NetworkActivityResponse> {
  const { data } = await client.get<ApiResponse<NetworkActivityResponse>>(
    '/events/network/activity/',
  );
  const inner = (data as ApiResponse<NetworkActivityResponse>)?.data;
  return inner ?? { activity: [] };
}

export async function fetchMyFriendships(): Promise<MyFriendshipsResponse> {
  const { data } = await client.get<ApiResponse<MyFriendshipsResponse>>(
    '/events/friendships/',
  );
  const inner = (data as ApiResponse<MyFriendshipsResponse>)?.data;
  return inner ?? { accepted: [], pending_incoming: [], pending_outgoing: [] };
}

export async function fetchAllChatsList() {
  const { data } = await client.get<ApiResponse<AllChatsListResponse>>(
    '/events/conversations/',
  );
  return data;
}

export async function addDirectMessage(
  targetUsername: string,
  payload: { text: string },
) {
  const { data } = await client.post<ApiResponse<any>>(
    `/events/direct-messages/${targetUsername}/`,
    payload,
  );
  return data;
}

export async function sendFriendRequest(
  eventId: number,
  targetUsername: string,
  payload: { request_message?: string },
) {
  const { data } = await client.post<ApiResponse<any>>(
    `/events/${eventId}/friendships/${targetUsername}/`,
    payload,
  );
  return data;
}

export async function fetchFriendRequestStatus(
  eventId: number,
  targetUsername: string,
) {
  const { data } = await client.get<ApiResponse<any | null>>(
    `/events/${eventId}/friendships/${targetUsername}/`,
  );
  return data;
}

export async function updateFriendRequest(
  eventId: number,
  targetUsername: string,
  payload: { action: 'accept' | 'withdraw' },
) {
  const { data } = await client.patch<ApiResponse<any>>(
    `/events/${eventId}/friendships/${targetUsername}/`,
    payload,
  );
  return data;
}

export async function getOrCreatePrivateConversation(
  eventId: number,
  targetUsername: string,
) {
  const { data } = await client.post<ApiResponse<any>>(
    `/events/${eventId}/get-or-create-conversation/`,
    { target_username: targetUsername },
  );
  return data;
}
