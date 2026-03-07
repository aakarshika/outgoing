from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Ticket

@receiver(post_save, sender=Ticket)
def update_event_ticket_count_on_save(sender, instance, created, **kwargs):
    """Update event ticket_count when a ticket is created or status changes."""
    # We always re-calculate or just adjust if we know the change.
    # Re-calculating is safer.
    event = instance.event
    active_count = event.tickets.filter(status__in=["active", "used"]).count()
    if event.ticket_count != active_count:
        event.ticket_count = active_count
        event.save(update_fields=["ticket_count"])

@receiver(post_delete, sender=Ticket)
def update_event_ticket_count_on_delete(sender, instance, **kwargs):
    """Update event ticket_count when a ticket is deleted."""
    event = instance.event
    active_count = event.tickets.filter(status__in=["active", "used"]).count()
    if event.ticket_count != active_count:
        event.ticket_count = active_count
        event.save(update_fields=["ticket_count"])
