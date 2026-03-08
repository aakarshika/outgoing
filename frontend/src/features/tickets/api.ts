/** API client functions for ticket validation and admission. */

import client from '@/api/client';
import { ApiResponse } from '@/types/events';

export interface TicketValidationResult {
    valid: boolean;
    ticket_id: number;
    barcode: string;
    attendee_name: string;
    attendee_username: string;
    guest_name: string;
    ticket_type: string;
    tier_name: string;
    tier_color: string;
    status: string;
    price_paid: string;
    purchased_at: string;
}

export interface TicketAdmitResult {
    id: number;
    barcode: string;
    status: string;
    used_at: string;
    ticket_type: string;
    guest_name: string;
    event_summary: {
        id: number;
        title: string;
        start_time: string;
        location_name: string;
    };
}

/** Validate a ticket barcode for a specific event. */
export async function validateTicket({
    barcode,
    token,
    eventId,
}: {
    barcode?: string;
    token?: string;
    eventId: number;
}): Promise<ApiResponse<TicketValidationResult>> {
    const res = await client.post('/tickets/validate/', {
        barcode,
        token,
        event_id: eventId,
    });
    return res.data;
}

/** Admit a ticket holder — marks ticket as used. */
export async function admitTicket(
    ticketId: number,
    eventId: number,
): Promise<ApiResponse<TicketAdmitResult>> {
    const res = await client.post('/tickets/admit/', {
        ticket_id: ticketId,
        event_id: eventId,
    });
    return res.data;
}
