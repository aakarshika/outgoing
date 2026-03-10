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
        # Check NeedApplication fallback
        from apps.needs.models import NeedApplication
        try:
            app = NeedApplication.objects.select_related("vendor", "need", "service").get(barcode=barcode)
        except NeedApplication.DoesNotExist:
            raise TicketValidationError(
                "Ticket not found. Please check the code and try again.",
                error_code="TICKET_NOT_FOUND",
                status=404,
            )
            
        if app.need.event_id != event_id:
            raise TicketValidationError(
                "This vendor pass does not belong to this event.",
                error_code="WRONG_EVENT",
            )
            
        if app.admitted_at is not None:
            used_at_str = app.admitted_at.strftime("%b %d, %Y at %I:%M %p")
            raise TicketValidationError(
                f"This vendor pass has already been used ({used_at_str}).",
                error_code="ALREADY_USED",
            )
            
        return {
            "valid": True,
            "is_vendor": True,
            "ticket_id": app.id,
            "barcode": app.barcode,
            "attendee_name": app.vendor.get_full_name() or app.vendor.username,
            "attendee_username": app.vendor.username,
            "guest_name": app.vendor.username,
            "ticket_type": app.need.title,
            "tier_name": app.service.title if app.service else "Service",
            "tier_color": "#8b5cf6",
            "status": "active" if not app.admitted_at else "used",
            "purchased_at": app.created_at.isoformat(),
        }

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
        "is_vendor": False,
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
        
    if payload.get("is_vendor"):
        from apps.needs.models import NeedApplication
        try:
            app = NeedApplication.objects.select_related("need").get(id=payload.get("application_id"))
        except NeedApplication.DoesNotExist:
            raise TicketValidationError(
                "Vendor application not found for this QR code.",
                error_code="TICKET_NOT_FOUND",
                status=404,
            )
        return validate_ticket(app.barcode, event_id)
        
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


def admit_ticket(ticket_id: int, event_id: int, admitted_by_user, is_vendor: bool = False) -> dict:
    """Mark a ticket or vendor pass as admitted (used).

    Sets status to 'used', records used_at timestamp and admitting user.
    Returns the ticket payload dict.
    Raises TicketValidationError on failure.
    """
    if is_vendor:
        from apps.needs.models import NeedApplication
        try:
            app = NeedApplication.objects.select_related("vendor", "need", "service").get(
                pk=ticket_id
            )
        except NeedApplication.DoesNotExist:
            raise TicketValidationError(
                "Vendor application not found.",
                error_code="TICKET_NOT_FOUND",
                status=404,
            )

        if app.need.event_id != event_id:
            raise TicketValidationError(
                "This pass does not belong to this event.",
                error_code="WRONG_EVENT",
            )

        if app.admitted_at is not None:
            used_at_str = app.admitted_at.strftime("%b %d, %Y at %I:%M %p")
            raise TicketValidationError(
                f"This vendor pass has already been admitted ({used_at_str}).",
                error_code="ALREADY_USED",
            )

        if app.status != "accepted":
            raise TicketValidationError(
                f"Cannot admit an application with status '{app.status}'.",
                error_code="INVALID_STATUS",
            )

        app.admitted_at = timezone.now()
        app.admitted_by = admitted_by_user
        app.save(update_fields=["admitted_at", "admitted_by"])

        return {
            "id": app.id,
            "barcode": app.barcode,
            "status": "used",
            "used_at": app.admitted_at.isoformat(),
            "ticket_type": app.need.title,
            "guest_name": app.vendor.get_full_name() or app.vendor.username,
            "event_summary": app.need.event.to_dict(),
        }

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

    return {
        "id": ticket.id,
        "barcode": ticket.barcode,
        "status": ticket.status,
        "used_at": ticket.used_at.isoformat() if ticket.used_at else None,
        "ticket_type": ticket.ticket_type,
        "guest_name": ticket.guest_name,
        "event_summary": ticket.event.to_dict(),
    }
