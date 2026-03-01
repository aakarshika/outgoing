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
} from '@/types/events';

// --- Feed ---

export async function fetchFeed(params: {
    category?: string;
    sort?: string;
    search?: string;
    weekend?: boolean;
    lat?: number;
    lng?: number;
    radius_km?: number;
    featured?: boolean;
    page?: number;
    page_size?: number;
}) {
    const { data } = await client.get<ApiResponse<EventListItem[]>>('/feed/', { params });
    return data;
}

export async function fetchFeaturedEvent() {
    const { data } = await client.get<ApiResponse<EventListItem>>('/feed/', {
        params: { featured: 'true' },
    });
    return data;
}

// --- Categories ---

export async function fetchCategories() {
    const { data } = await client.get<ApiResponse<EventCategory[]>>('/events/categories/');
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
    const { data } = await client.get<ApiResponse<EventListItem[]>>('/events/', { params });
    return data;
}

export async function fetchEventAttendees(eventId: number) {
    const { data } = await client.get<ApiResponse<EventAttendee[]>>(`/events/${eventId}/attendees/`);
    return data;
}

export async function transitionEventLifecycle(
    eventId: number,
    payload: { to_state: EventLifecycleState; reason?: string; metadata?: Record<string, unknown> }
) {
    const { data } = await client.post<
        ApiResponse<{ event: EventDetail; transition: EventLifecycleTransition | null }>
    >(`/events/${eventId}/lifecycle/transition/`, payload);
    return data;
}

export async function fetchEventLifecycleHistory(eventId: number) {
    const { data } = await client.get<ApiResponse<EventLifecycleTransition[]>>(
        `/events/${eventId}/lifecycle/history/`
    );
    return data;
}

export async function fetchEventAutocomplete(query: string) {
    const { data } = await client.get<ApiResponse<EventSearchSuggestion[]>>('/events/autocomplete/', {
        params: { q: query },
    });
    return data;
}

export async function createEvent(formData: FormData) {
    const { data } = await client.post<ApiResponse<EventDetail>>('/events/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}

export async function updateEvent(eventId: number, formData: FormData) {
    const { data } = await client.patch<ApiResponse<EventDetail>>(`/events/${eventId}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}

// --- Interest ---

export async function toggleInterest(eventId: number, isInterested: boolean) {
    if (isInterested) {
        const { data } = await client.delete<ApiResponse<{ interest_count: number }>>(
            `/events/${eventId}/interest/`
        );
        return data;
    }
    const { data } = await client.post<ApiResponse<{ interest_count: number }>>(
        `/events/${eventId}/interest/`
    );
    return data;
}

// --- Tickets ---

export async function purchaseTicket(eventId: number, ticketType: 'standard' | 'flexible') {
    const { data } = await client.post(`/tickets/events/${eventId}/`, {
        ticket_type: ticketType,
    });
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
