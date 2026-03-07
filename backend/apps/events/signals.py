from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import EventTicketTier

@receiver(post_save, sender=EventTicketTier)
def update_event_capacity_on_save(sender, instance, **kwargs):
    """Update event capacity when a ticket tier is saved."""
    instance.event.update_capacity_from_tiers()

@receiver(post_delete, sender=EventTicketTier)
def update_event_capacity_on_delete(sender, instance, **kwargs):
    """Update event capacity when a ticket tier is deleted."""
    instance.event.update_capacity_from_tiers()
