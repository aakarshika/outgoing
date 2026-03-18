import random
from datetime import datetime, timedelta, timezone
from io import StringIO

from django.core.management.base import BaseCommand
from django.utils import timezone as django_timezone

from apps.events.models import (
    Event,
    EventCategory,
    EventHighlight,
    EventHighlightComment,
    EventHighlightLike,
    EventInterest,
    EventLifecycleTransition,
    EventMedia,
    EventReview,
    EventReviewComment,
    EventReviewLike,
    EventTicketTier,
    EventView,
)
from apps.needs.models import EventNeed, NeedApplication, NeedInvite
from apps.tickets.models import Ticket
from apps.vendors.models import VendorService
from django.contrib.auth import get_user_model

User = get_user_model()

EVENT_ID = 120

MEDIA_SEED = [
    {
        "category": "gallery",
        "media_type": "image",
        "order": 1,
        "file": "https://placehold.co/1200x800/2a2a2a/ffffff?text=Soul+Session+1",
    },
    {
        "category": "gallery",
        "media_type": "image",
        "order": 2,
        "file": "https://placehold.co/1200x800/2a2a2a/ffffff?text=Soul+Session+2",
    },
    {
        "category": "gallery",
        "media_type": "image",
        "order": 3,
        "file": "https://placehold.co/1200x800/2a2a2a/ffffff?text=Soul+Session+3",
    },
    {
        "category": "highlight",
        "media_type": "image",
        "order": 4,
        "file": "https://placehold.co/1200x800/2a2a2a/ffffff?text=Live+Performance",
    },
    {
        "category": "highlight",
        "media_type": "image",
        "order": 5,
        "file": "https://placehold.co/1200x800/2a2a2a/ffffff?text=String+Arrangements",
    },
    {
        "category": "gallery",
        "media_type": "image",
        "order": 6,
        "file": "https://placehold.co/1200x800/2a2a2a/ffffff?text=Audience+Vibe",
    },
]

HIGHLIGHTS_SEED = [
    {
        "role": "goer",
        "text": "The string arrangements were absolutely breathtaking! Can't wait for the next session.",
        "has_media": True,
    },
    {
        "role": "goer",
        "text": "Such an intimate venue with incredible acoustics. The vocals gave me chills.",
        "has_media": False,
    },
    {
        "role": "goer",
        "text": "Best soul night in the city! The blend of contemporary and classic was perfect.",
        "has_media": True,
    },
    {
        "role": "host",
        "text": "Thank you all for coming! See you at the next Soul & Strings Session.",
        "has_media": False,
    },
]

REVIEWS_SEED = [
    {
        "rating": 5,
        "text": "Absolutely phenomenal evening. The string players were world-class and the vocals were soul-stirring. Highly recommend!",
    },
    {
        "rating": 5,
        "text": "One of the best live music experiences I've had. Intimate setting with amazing talent.",
    },
    {
        "rating": 4,
        "text": "Great vibes and music. Would love to see more seating options for future events.",
    },
]

NEEDS_SEED = [
    {
        "category": "dj",
        "title": "DJ for After-Party",
        "description": "Need a DJ to keep the vibes going after the main performance",
        "criticality": "optional",
        "budget_min": "150.00",
        "budget_max": "400.00",
        "status": "open",
    },
    {
        "category": "photography",
        "title": "Event Photographer",
        "description": "Capture the intimate moments and performances",
        "criticality": "essential",
        "budget_min": "200.00",
        "budget_max": "500.00",
        "status": "filled",
    },
    {
        "category": "catering",
        "title": "Refreshments Service",
        "description": "Provide light appetizers and drinks for attendees",
        "criticality": "essential",
        "budget_min": "300.00",
        "budget_max": "800.00",
        "status": "open",
    },
    {
        "category": "photo_booth",
        "title": "Photo Booth Rental",
        "description": "Fun photo booth for guest memories",
        "criticality": "optional",
        "budget_min": "100.00",
        "budget_max": "250.00",
        "status": "open",
    },
]

FEATURES_SEED = [
    {"name": "Live Music", "tag": "featured"},
    {"name": "DJ", "tag": "additional"},
    {"name": "Photo Booth", "tag": "additional"},
    {"name": "Refreshments", "tag": "additional"},
    {"name": "VIP Seating", "tag": "additional"},
]

TAGS_SEED = ["live-music", "soul", "strings", "evening", "intimate"]


class Command(BaseCommand):
    help = f"Seeds event {EVENT_ID} with detailed realistic data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--keep-existing",
            action="store_true",
            help="Keep existing data instead of wiping first",
        )

    def wipe_event_data(self):
        self.stdout.write(f"Wiping existing data for event {EVENT_ID}...")

        try:
            event = Event.objects.get(id=EVENT_ID)
        except Event.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"Event {EVENT_ID} does not exist!"))
            return False

        EventMedia.objects.filter(event=event).delete()
        EventHighlight.objects.filter(event=event).delete()
        EventReview.objects.filter(event=event).delete()
        EventNeed.objects.filter(event=event).delete()
        EventInterest.objects.filter(event=event).delete()
        EventView.objects.filter(event=event).delete()
        EventLifecycleTransition.objects.filter(event=event).delete()
        Ticket.objects.filter(event=event).delete()

        self.stdout.write(self.style.SUCCESS("Event data wiped successfully."))
        return True

    def handle(self, *args, **options):
        if not options.get("keep_existing"):
            if not self.wipe_event_data():
                return

        try:
            event = Event.objects.get(id=EVENT_ID)
        except Event.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"Event {EVENT_ID} does not exist!"))
            return

        now = django_timezone.now()
        rng = random.Random(120)

        rng = random.Random(120)

        self.seed_media(event)
        self.seed_highlights(event)
        self.seed_reviews(event)
        self.seed_needs(event)
        self.seed_interests(event)
        self.seed_views(event)
        self.seed_lifecycle(event)

        event.tags = TAGS_SEED
        event.features = FEATURES_SEED
        event.check_in_instructions = "Show your ticket confirmation at the entrance. Doors open 30 minutes before showtime."
        event.event_ready_message = (
            "The venue is set, performers are ready. Welcome to Soul & Strings Session!"
        )
        event.save(
            update_fields=[
                "tags",
                "features",
                "check_in_instructions",
                "event_ready_message",
            ]
        )

        self.stdout.write(self.style.SUCCESS(f"Event {EVENT_ID} seeded successfully!"))

    def seed_media(self, event):
        self.stdout.write("Seeding media...")
        for media_data in MEDIA_SEED:
            EventMedia.objects.create(
                event=event,
                media_type=media_data["media_type"],
                category=media_data["category"],
                order=media_data["order"],
                file=media_data["file"],
            )
        self.stdout.write(f"  Created {len(MEDIA_SEED)} media items")

    def seed_highlights(self, event):
        self.stdout.write("Seeding highlights...")
        users = list(User.objects.all()[:10])
        if not users:
            self.stdout.write(
                self.style.WARNING("  No users found, skipping highlights")
            )
            return

        created_highlights = []
        for i, hl_data in enumerate(HIGHLIGHTS_SEED):
            author = users[i % len(users)]
            role = hl_data["role"]
            highlight = EventHighlight.objects.create(
                event=event,
                author=author,
                role=role,
                text=hl_data["text"],
                media_file=MEDIA_SEED[i]["file"] if hl_data["has_media"] else None,
                moderation_status="approved",
            )
            created_highlights.append(highlight)

        for highlight in created_highlights[:3]:
            for user in random.sample(users, min(3, len(users))):
                EventHighlightLike.objects.create(highlight=highlight, user=user)

        for highlight in created_highlights[:2]:
            for user in random.sample(users, min(2, len(users))):
                EventHighlightComment.objects.create(
                    highlight=highlight,
                    author=user,
                    text=f"Great highlight! {random.choice(['👏', '❤️', '🔥', '✨'])}",
                )

        self.stdout.write(f"  Created {len(HIGHLIGHTS_SEED)} highlights")

    def seed_reviews(self, event):
        self.stdout.write("Seeding reviews...")
        users = list(User.objects.all()[:10])
        if not users:
            self.stdout.write(self.style.WARNING("  No users found, skipping reviews"))
            return

        for i, review_data in enumerate(REVIEWS_SEED):
            reviewer = users[i % len(users)]
            review = EventReview.objects.create(
                event=event,
                reviewer=reviewer,
                rating=review_data["rating"],
                text=review_data["text"],
                is_public=True,
            )

            for user in random.sample(users, min(3, len(users))):
                EventReviewLike.objects.create(review=review, user=user)

            if i < 2:
                for user in random.sample(users, min(2, len(users))):
                    EventReviewComment.objects.create(
                        review=review,
                        author=user,
                        text=f"Agree! {'Totally' if review_data['rating'] == 5 else 'Good point'}.",
                    )

        self.stdout.write(f"  Created {len(REVIEWS_SEED)} reviews")

    def seed_needs(self, event):
        self.stdout.write("Seeding needs...")
        users = list(User.objects.all()[:10])
        vendors = VendorService.objects.all()[:5]
        vendor_list = list(vendors)

        for i, need_data in enumerate(NEEDS_SEED):
            assigned_vendor = None
            if need_data["status"] == "filled" and vendor_list:
                assigned_vendor = vendor_list[i % len(vendor_list)].vendor

            need = EventNeed.objects.create(
                event=event,
                category=need_data["category"],
                title=need_data["title"],
                description=need_data["description"],
                criticality=need_data["criticality"],
                budget_min=need_data["budget_min"],
                budget_max=need_data["budget_max"],
                status=need_data["status"],
                assigned_vendor=assigned_vendor,
            )

            if need_data["status"] == "filled" and assigned_vendor:
                NeedApplication.objects.create(
                    need=need,
                    vendor=assigned_vendor,
                    message="I'd love to provide this service for your event!",
                    proposed_price=need_data["budget_max"],
                    status="accepted",
                )

        self.stdout.write(f"  Created {len(NEEDS_SEED)} needs")

    def seed_interests(self, event):
        self.stdout.write("Seeding interests...")
        users = list(User.objects.all()[:15])
        event_host = event.host
        interested_users = [u for u in users if u.id != event_host.id][:10]

        for user in interested_users:
            EventInterest.objects.create(event=event, user=user)

        event.interest_count = len(interested_users)
        event.save(update_fields=["interest_count"])
        self.stdout.write(f"  Created {len(interested_users)} interests")

    def seed_views(self, event):
        self.stdout.write("Seeding views...")
        users = list(User.objects.all()[:20])
        event_host = event.host
        viewing_users = [u for u in users if u.id != event_host.id][:20]

        for user in viewing_users:
            EventView.objects.create(event=event, user=user)

        self.stdout.write(f"  Created {len(viewing_users)} views")

    def seed_lifecycle(self, event):
        self.stdout.write("Seeding lifecycle transitions...")
        now = django_timezone.now()
        host = event.host

        EventLifecycleTransition.objects.create(
            event=event,
            actor=host,
            from_state="draft",
            to_state="published",
            reason="Event ready for review",
        )

        EventLifecycleTransition.objects.create(
            event=event,
            actor=host,
            from_state="published",
            to_state="event_ready",
            reason="All preparations complete",
        )

        EventLifecycleTransition.objects.create(
            event=event,
            actor=host,
            from_state="event_ready",
            to_state="live",
            reason="Event starting now",
        )

        self.stdout.write(self.style.SUCCESS("  Created 3 lifecycle transitions"))
