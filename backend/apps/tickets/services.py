"""Business logic for ticket validation and admission.

These services are input-method agnostic — they work the same whether
the barcode is typed manually, scanned from a barcode, or read from a QR code.
"""

from django.utils import timezone

from apps.events.models import Event
from apps.tickets.models import Ticket
from apps.tickets.qr import InvalidQRTokenError, verify_qr_token


class TicketValidationError(Exception):
    """Raised when a ticket fails validation."""

    def __init__(self, message, error_code="INVALID_TICKET", status=400):
        self.message = message
        self.error_code = error_code
        self.status = status
        super().__init__(message)


def validate_ticket(barcode: str, event_id: int) -> dict:
    """Validate a ticket barcode against an event.

    Returns a dict with ticket info if valid.
    Raises TicketValidationError on any failure.
    """
    try:
        ticket = Ticket.objects.select_related(
            "goer", "goer__profile", "tier", "event"
        ).get(barcode=barcode)
    except Ticket.DoesNotExist:
        raise TicketValidationError(
            "Ticket not found. Please check the code and try again.",
            error_code="TICKET_NOT_FOUND",
            status=404,
        )

    if ticket.event_id != event_id:
        raise TicketValidationError(
            "This ticket does not belong to this event.",
            error_code="WRONG_EVENT",
        )

    if ticket.status == "used":
        used_at_str = ticket.used_at.strftime("%b %d, %Y at %I:%M %p") if ticket.used_at else "unknown time"
        raise TicketValidationError(
            f"This ticket has already been used ({used_at_str}).",
            error_code="ALREADY_USED",
        )

    if ticket.status == "cancelled":
        raise TicketValidationError(
            "This ticket has been cancelled.",
            error_code="CANCELLED",
        )

    if ticket.status == "refunded":
        raise TicketValidationError(
            "This ticket has been refunded.",
            error_code="REFUNDED",
        )

    return {
        "valid": True,
        "ticket_id": ticket.id,
        "barcode": ticket.barcode,
        "attendee_name": ticket.goer.get_full_name() or ticket.goer.username,
        "attendee_username": ticket.goer.username,
        "guest_name": ticket.guest_name,
        "ticket_type": ticket.ticket_type,
        "tier_name": ticket.tier.name if ticket.tier else ticket.ticket_type,
        "tier_color": ticket.tier.color if ticket.tier else ticket.color,
        "status": ticket.status,
        "purchased_at": ticket.purchased_at.isoformat(),
    }


def validate_qr_token(token: str, event_id: int) -> dict:
    """Validate a signed QR token against an event.
    
    Returns a dict with ticket info if valid.
    Raises TicketValidationError on any failure.
    """
    print(f"[DEBUG] validate_qr_token: verifying token with event_id={event_id}")
    try:
        payload = verify_qr_token(token)
        print(f"[DEBUG] validate_qr_token: payload decoded successfully: {payload}")
    except InvalidQRTokenError as e:
        raise TicketValidationError(
            f"Invalid QR code: {str(e)}",
            error_code="INVALID_QR_TOKEN",
            status=400,
        )
        
    token_event_id = payload.get("event_id")
    if token_event_id != event_id:
        raise TicketValidationError(
            "This QR code is for a different event.",
            error_code="WRONG_EVENT",
        )
        
    # Get barcode to reuse validate_ticket logic
    try:
        ticket = Ticket.objects.get(id=payload.get("ticket_id"))
    except Ticket.DoesNotExist:
        raise TicketValidationError(
            "Ticket not found for this QR code.",
            error_code="TICKET_NOT_FOUND",
            status=404,
        )
        
    return validate_ticket(ticket.barcode, event_id)


def admit_ticket(ticket_id: int, event_id: int, admitted_by_user) -> Ticket:
    """Mark a ticket as admitted (used).

    Sets status to 'used', records used_at timestamp and admitting user.
    Returns the updated Ticket instance.
    Raises TicketValidationError on failure.
    """
    try:
        ticket = Ticket.objects.select_related("goer", "tier", "event").get(
            pk=ticket_id
        )
    except Ticket.DoesNotExist:
        raise TicketValidationError(
            "Ticket not found.",
            error_code="TICKET_NOT_FOUND",
            status=404,
        )

    if ticket.event_id != event_id:
        raise TicketValidationError(
            "This ticket does not belong to this event.",
            error_code="WRONG_EVENT",
        )

    if ticket.status == "used":
        used_at_str = ticket.used_at.strftime("%b %d, %Y at %I:%M %p") if ticket.used_at else "unknown time"
        raise TicketValidationError(
            f"This ticket has already been admitted ({used_at_str}).",
            error_code="ALREADY_USED",
        )

    if ticket.status != "active":
        raise TicketValidationError(
            f"Cannot admit a ticket with status '{ticket.status}'.",
            error_code="INVALID_STATUS",
        )

    ticket.status = "used"
    ticket.used_at = timezone.now()
    ticket.admitted_by = admitted_by_user
    ticket.save(update_fields=["status", "used_at", "admitted_by", "updated_at"])

    return ticket
