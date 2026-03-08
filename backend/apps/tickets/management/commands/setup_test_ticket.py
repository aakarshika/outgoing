import random
import string
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.events.models import Event, EventCategory, EventTicketTier
from apps.tickets.models import Ticket
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates a test event and a ticket for end-to-end verification of the Ticket Entry System'

    def handle(self, *args, **options):
        self.stdout.write("Setting up test data...")

        # 1. Ensure Category
        category, _ = EventCategory.objects.get_or_create(name="Music", defaults={"slug": "music"})

        # 2. Ensure Host
        host, created = User.objects.get_or_create(
            username="host_tester",
            defaults={"email": "host@test.com", "first_name": "Host", "last_name": "Tester"}
        )
        if created:
            host.set_password("pass123")
            host.save()
            self.stdout.write(f"Created host user: {host.username} / pass123")

        # 3. Ensure Buyer
        buyer, created = User.objects.get_or_create(
            username="buyer_tester",
            defaults={"email": "buyer@test.com", "first_name": "Buyer", "last_name": "Tester"}
        )
        if created:
            buyer.set_password("pass123")
            buyer.save()
            self.stdout.write(f"Created buyer user: {buyer.username} / pass123")

        # 4. Create Event
        event = Event.objects.create(
            host=host,
            title="End-to-End Test Concert",
            description="A test event for ticket validation.",
            category=category,
            location_name="Test Venue",
            location_address="123 Test St",
            start_time=timezone.now() + timedelta(days=1),
            end_time=timezone.now() + timedelta(days=1, hours=3),
            status="published",
            lifecycle_state="published"
        )
        self.stdout.write(f"Created event: {event.title} (ID: {event.id})")

        # 5. Create Ticket Tier
        tier = EventTicketTier.objects.create(
            event=event,
            name="General Admission",
            price=500.00,
            capacity=100
        )

        # 6. Create Ticket
        ticket = Ticket.objects.create(
            event=event,
            goer=buyer,
            tier=tier,
            ticket_type=tier.name,
            color=tier.color,
            price_paid=tier.price,
            status="active"
        )
        
        self.stdout.write(self.style.SUCCESS(f"\n--- SUCCESS ---"))
        self.stdout.write(f"Test Ticket Created!")
        self.stdout.write(f"Buyer: {buyer.username}")
        self.stdout.write(self.style.WARNING(f"BARCODE: {ticket.barcode}"))
        self.stdout.write(f"\nInstructions for End-to-End Testing:")
        self.stdout.write(f"1. Login as 'host_tester' on the frontend.")
        self.stdout.write(f"2. Go to /events/{event.id}/manage")
        self.stdout.write(f"3. Click the 'Entry' tab.")
        self.stdout.write(f"4. Enter the barcode: {ticket.barcode}")
        self.stdout.write(f"5. Click Validate, then Admit.")
        self.stdout.write(f"6. Check 'Attendees' tab to see it updated!")
