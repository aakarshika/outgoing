import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

# We explicitly import the models after Django has booted
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
    EventReviewMedia,
    EventSeries,
    EventSeriesNeedTemplate,
    EventTicketTier,
    EventVendorReview,
    EventView,
)
from apps.needs.models import EventNeed, NeedApplication, NeedInvite
from apps.profiles.models import UserProfile
from apps.requests.models import EventRequest, RequestUpvote, RequestWishlist
from apps.tickets.models import Ticket
from apps.vendors.models import VendorReview, VendorService
from django.contrib.auth import get_user_model
User = get_user_model()

HERE = Path(__file__).resolve().parent


def normalize_need_status(raw_status):
    """Map legacy/generated need statuses into valid EventNeed statuses."""
    if raw_status == "pending":
        return "open"
    if raw_status in {"open", "filled", "cancelled", "override_filled"}:
        return raw_status
    return "open"


def fallback_need_title(category):
    """Derive a usable title when the seed payload omits one."""
    return str(category).replace("_", " ").replace("-", " ").title()


def random_event_window_in_coming_month(rng, now):
    """Return start/end datetimes constrained to the next 30 days."""
    month_end = now + timedelta(days=30)

    # Keep at least one hour for duration by reserving room before month_end.
    latest_start = month_end - timedelta(hours=1)
    total_start_seconds = max(1, int((latest_start - now).total_seconds()))
    start_time = now + timedelta(seconds=rng.randint(1, total_start_seconds))

    # End time remains in-window and always after start_time.
    max_duration_seconds = max(3600, int((month_end - start_time).total_seconds()))
    duration_seconds = rng.randint(3600, min(max_duration_seconds, 48 * 3600))
    end_time = start_time + timedelta(seconds=duration_seconds)
    return start_time, end_time

class Command(BaseCommand):
    help = "Seeds database using seed_simple_generated.json."

    def add_arguments(self, parser):
        parser.add_argument(
            "--input",
            type=str,
            default=str(HERE / "seed_simple_generated.json"),
            help="Input JSON path.",
        )
        parser.add_argument(
            "--no-wipe",
            action="store_true",
            help="Do not wipe existing data before seeding.",
        )

    def wipe_data(self):
        self.stdout.write("Wiping existing data...")
        RequestWishlist.objects.all().delete()
        RequestUpvote.objects.all().delete()
        EventRequest.objects.all().delete()

        VendorReview.objects.all().delete()
        EventVendorReview.objects.all().delete()
        EventReviewMedia.objects.all().delete()
        EventReview.objects.all().delete()

        EventHighlight.objects.all().delete()
        EventMedia.objects.all().delete()
        EventLifecycleTransition.objects.all().delete()
        EventInterest.objects.all().delete()
        EventView.objects.all().delete()

        Ticket.objects.all().delete()
        NeedInvite.objects.all().delete()
        NeedApplication.objects.all().delete()
        EventNeed.objects.all().delete()
        EventTicketTier.objects.all().delete()

        Event.objects.all().delete()
        EventSeriesNeedTemplate.objects.all().delete()
        EventSeries.objects.all().delete()
        VendorService.objects.all().delete()

        UserProfile.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        EventCategory.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("Data wiped successfully."))

    def handle(self, *args, **options):
        input_path = Path(options["input"]).resolve()
        rng = random.Random()
        now = datetime.now(timezone.utc)
        
        if not input_path.exists():
            self.stderr.write(self.style.ERROR(f"Input file {input_path} does not exist."))
            return

        with open(input_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if not options.get("no_wipe"):
            self.wipe_data()

        users_data = data.get("users", [])
        services_data = data.get("services", [])
        events_data = data.get("events", [])
        tiers_data = data.get("event_ticket_tiers", [])
        needs_data = data.get("event_needs", [])
        tickets_data = data.get("tickets", [])

        user_map = {}
        event_map = {}
        tier_map = {}

        with transaction.atomic():
            self.stdout.write("Seeding Users...")
            for u in users_data:
                user, created = User.objects.get_or_create(
                    username=u["username"],
                    defaults={
                        "email": u["email"],
                        "first_name": u["first_name"],
                        "last_name": u["last_name"],
                    }
                )
                if created:
                    user.set_password(u["password"])
                    user.save()
                user_map[u["username"]] = user

            self.stdout.write("Seeding Services...")
            for s in services_data:
                vendor = user_map.get(s["vendor"])
                if vendor:
                    VendorService.objects.get_or_create(
                        vendor=vendor,
                        title=s["title"],
                        defaults={
                            "description": s["description"],
                            "category": s["category"],
                            "location_city": s["location_city"],
                            "base_price": 0, # Add a default if the model strictly requires it
                        }
                    )

            self.stdout.write("Seeding Events...")
            for e in events_data:
                host = user_map.get(e["host"])
                if host:
                    start_time, end_time = random_event_window_in_coming_month(rng, now)
                    # Depending on exact mandatory fields, add standard defaults for others
                    category_obj, _ = EventCategory.objects.get_or_create(
                        slug=e["category"],
                        defaults={
                            "name": e["category"].replace('-', ' ').title(),
                            "icon": "calendar",
                        }
                    )
                    event, created = Event.objects.get_or_create(
                        host=host,
                        title=e["title"],
                        defaults={
                            "category": category_obj,
                            "description": e.get("description", ""),
                            "location_name": e.get("location_name", "Default Venue"),
                            "location_address": e.get("location_address", ""),
                            "latitude": e.get("latitude"),
                            "longitude": e.get("longitude"),
                            "cover_image": e.get("cover_image"),
                            "start_time": start_time,
                            "end_time": end_time,
                            "status": e["status"],
                            "lifecycle_state": e["lifecycle_state"],
                            "capacity": e["capacity"],
                            "slug": f"evt-{host.username}-{e['title'].replace(' ', '-').lower()}"[:50], # Default required by Event model
                        }
                    )
                    if not created:
                        fields_to_update = []
                        if e.get("latitude") is not None and event.latitude != e.get("latitude"):
                            event.latitude = e.get("latitude")
                            fields_to_update.append("latitude")
                        if e.get("longitude") is not None and event.longitude != e.get("longitude"):
                            event.longitude = e.get("longitude")
                            fields_to_update.append("longitude")
                        if e.get("cover_image") and event.cover_image.name != e.get("cover_image"):
                            event.cover_image = e.get("cover_image")
                            fields_to_update.append("cover_image")
                        if event.start_time != start_time:
                            event.start_time = start_time
                            fields_to_update.append("start_time")
                        if event.end_time != end_time:
                            event.end_time = end_time
                            fields_to_update.append("end_time")
                        if fields_to_update:
                            event.save(update_fields=fields_to_update)
                    event_map[e["_key"]] = event

            self.stdout.write("Seeding Event Tiers...")
            for t in tiers_data:
                event = event_map.get(t["event"])
                if event:
                    tier, created = EventTicketTier.objects.get_or_create(
                        event=event,
                        name=t["name"],
                        defaults={
                            "price": t["price"],
                            "capacity": t["capacity"]
                        }
                    )
                    if not created:
                        fields_to_update = []
                        if tier.price != t["price"]:
                            tier.price = t["price"]
                            fields_to_update.append("price")
                        if tier.capacity != t["capacity"]:
                            tier.capacity = t["capacity"]
                            fields_to_update.append("capacity")
                        if fields_to_update:
                            tier.save(update_fields=fields_to_update)
                    tier_map[t["_key"]] = tier

            self.stdout.write("Seeding Event Needs...")
            for n in needs_data:
                event = event_map.get(n["event"])
                if event:
                    vendor = user_map.get(n["assigned_vendor"]) if n.get("assigned_vendor") else None
                    EventNeed.objects.create(
                        event=event,
                        category=n["category"],
                        title=n["title"] or fallback_need_title(n["category"]),
                        status=normalize_need_status(n.get("status")),
                        assigned_vendor=vendor,
                    )

            self.stdout.write("Seeding Tickets...")
            for t in tickets_data:
                goer = user_map.get(t["goer"])
                tier = tier_map.get(t["tier"])
                if goer and tier:
                    Ticket.objects.create(
                        event=tier.event,
                        goer=goer,
                        tier=tier,
                        status="active"
                    )

        self.stdout.write(self.style.SUCCESS("Seeding complete!"))
