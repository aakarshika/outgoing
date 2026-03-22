import json
import random
import mimetypes
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.db import transaction, connection

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
    Friendship,
)
from apps.needs.models import EventNeed, NeedApplication, NeedInvite
from apps.profiles.models import UserProfile
from apps.requests.models import EventRequest, RequestUpvote, RequestWishlist
from apps.tickets.models import Ticket
from apps.vendors.models import VendorReview, VendorService
from django.contrib.auth import get_user_model
User = get_user_model()

HERE = Path(__file__).resolve().parent
HELPERS_DIR = HERE / "seed-helper-data"
EVENT_CATEGORIES_PATH = HELPERS_DIR / "event_categories.json"
LIVE_EVENT_RATIO = 0.2
LIVE_EVENT_USED_TICKET_RATIO = 0.9
# Fraction of co-attendee pairs that become seeded friendships (rest skipped).
FRIENDSHIP_PAIR_KEEP_RATIO = 0.1


def _filename_for_image_url(url: str, fallback_stem: str):
    parsed = urllib.parse.urlparse(url)
    ext = Path(parsed.path).suffix
    if not ext:
        guess = mimetypes.guess_extension("image/jpeg") or ".jpg"
        ext = guess
    # normalize uncommon extensions
    if ext.lower() == ".jpe":
        ext = ".jpg"
    return f"{fallback_stem}{ext}"


def _download_image_bytes(url: str):
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "outgoing-seeder/1.0", "Accept": "image/*,*/*;q=0.8"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        content_type = resp.headers.get("Content-Type") or ""
        data = resp.read()
    return data, content_type


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


def _load_event_categories_by_slug():
    try:
        with open(EVENT_CATEGORIES_PATH, "r", encoding="utf-8") as f:
            cats = json.load(f) or []
    except Exception:
        return {}
    out = {}
    for c in cats:
        slug = (c or {}).get("slug")
        if not slug:
            continue
        out[slug] = {"name": c.get("name") or slug, "icon": c.get("icon") or "calendar"}
    return out


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
        parser.add_argument("--debug", action="store_true", help="Enable verbose debug logging.")

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

        Friendship.objects.all().delete()
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
        debug = bool(options.get("debug"))
        if debug:
            self.stdout.write(f"[seed_simple] input={input_path} no_wipe={bool(options.get('no_wipe'))}")
        
        if not input_path.exists():
            self.stderr.write(self.style.ERROR(f"Input file {input_path} does not exist."))
            return

        with open(input_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        category_defaults_by_slug = _load_event_categories_by_slug()

        if not options.get("no_wipe"):
            self.wipe_data()
        
        self.run_extra_sql()

        users_data = data.get("users", [])
        services_data = data.get("services", [])
        events_data = data.get("events", [])
        tiers_data = data.get("event_ticket_tiers", [])
        needs_data = data.get("event_needs", [])
        tickets_data = data.get("tickets", [])
        live_event_keys = set()
        if events_data:
            live_event_count = max(1, int(len(events_data) * LIVE_EVENT_RATIO))
            live_event_count = min(live_event_count, len(events_data))
            live_event_keys = {event["_key"] for event in rng.sample(events_data, live_event_count)}

        user_map = {}
        event_map = {}
        tier_map = {}
        live_event_ids = set()
        cover_bytes_cache = {}

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
                    is_live_event = e["_key"] in live_event_keys
                    if is_live_event:
                        # Start in ~1 hour so "tonight" feed (start_time_gte=now) includes them
                        start_time = now + timedelta(hours=1)
                        end_time = start_time + timedelta(hours=3)
                    else:
                        start_time, end_time = random_event_window_in_coming_month(rng, now)
                    event_status = "published" if is_live_event else e["status"]
                    event_lifecycle_state = "live" if is_live_event else e["lifecycle_state"]
                    # Depending on exact mandatory fields, add standard defaults for others
                    cat_defaults = category_defaults_by_slug.get(e["category"]) or {}
                    category_obj, _ = EventCategory.objects.get_or_create(
                        slug=e["category"],
                        defaults={
                            "name": cat_defaults.get("name") or e["category"].replace('-', ' ').title(),
                            "icon": cat_defaults.get("icon") or "calendar",
                        }
                    )

                    cover_image_url = e.get("cover_image")
                    cover_image_file = None
                    if isinstance(cover_image_url, str) and cover_image_url.startswith(("http://", "https://")):
                        try:
                            if debug:
                                self.stdout.write(
                                    f"[seed_simple] cover_download event_key={e.get('_key')} url={cover_image_url}"
                                )
                            if cover_image_url in cover_bytes_cache:
                                img_bytes, _content_type = cover_bytes_cache[cover_image_url]
                            else:
                                img_bytes, content_type = _download_image_bytes(cover_image_url)
                                cover_bytes_cache[cover_image_url] = (img_bytes, content_type)

                            if img_bytes:
                                filename = _filename_for_image_url(
                                    cover_image_url,
                                    fallback_stem=f"seed_{e.get('_key', 'event')}_cover",
                                )
                                cover_image_file = ContentFile(img_bytes, name=filename)
                                if debug:
                                    self.stdout.write(
                                        f"[seed_simple] cover_download_ok bytes={len(img_bytes)} content_type={content_type!r} filename={filename}"
                                    )
                        except Exception:
                            if debug:
                                import traceback
                                self.stdout.write(
                                    "[seed_simple] cover_download_fail event_key="
                                    + str(e.get("_key"))
                                    + "\n"
                                    + traceback.format_exc()
                                )
                            cover_image_file = None
                    elif debug and cover_image_url:
                        self.stdout.write(
                            f"[seed_simple] cover_skip_invalid_url event_key={e.get('_key')} cover_image={cover_image_url!r}"
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
                            "features": e.get("features", []),
                            "cover_image": cover_image_file,
                            "start_time": start_time,
                            "end_time": end_time,
                            "status": event_status,
                            "lifecycle_state": event_lifecycle_state,
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
                        if "features" in e and event.features != e.get("features"):
                            event.features = e.get("features") or []
                            fields_to_update.append("features")
                        # If we were able to download a cover image and the event doesn't already have one,
                        # populate it. (Avoid overwriting user-provided images.)
                        if cover_image_file and not event.cover_image:
                            event.cover_image = cover_image_file
                            fields_to_update.append("cover_image")
                            if debug:
                                self.stdout.write(
                                    f"[seed_simple] cover_saved_existing event_id={event.id} name={event.cover_image.name}"
                                )
                        if event.start_time != start_time:
                            event.start_time = start_time
                            fields_to_update.append("start_time")
                        if event.end_time != end_time:
                            event.end_time = end_time
                            fields_to_update.append("end_time")
                        if event.status != event_status:
                            event.status = event_status
                            fields_to_update.append("status")
                        if event.lifecycle_state != event_lifecycle_state:
                            event.lifecycle_state = event_lifecycle_state
                            fields_to_update.append("lifecycle_state")
                        if fields_to_update:
                            event.save(update_fields=fields_to_update)
                    if is_live_event:
                        live_event_ids.add(event.id)
                    event_map[e["_key"]] = event
                    if created and debug:
                        self.stdout.write(
                            f"[seed_simple] event_created id={event.id} key={e.get('_key')} cover_set={bool(event.cover_image)}"
                        )

            self.stdout.write("Seeding Event Tiers...")
            for t in tiers_data:
                event = event_map.get(t["event"])
                if not event or event.status == "draft":
                    continue
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
                if goer and tier and tier.event.status != "draft":
                    ticket_status = "active"
                    used_at = None
                    if tier.event_id in live_event_ids and rng.random() < LIVE_EVENT_USED_TICKET_RATIO:
                        ticket_status = "used"
                        used_at = now
                    Ticket.objects.create(
                        event=tier.event,
                        goer=goer,
                        tier=tier,
                        status=ticket_status,
                        used_at=used_at,
                    )

            self.stdout.write("Seeding Friendships (from used tickets)...")
            used_tickets = Ticket.objects.filter(status="used").select_related("event", "goer")
            event_goers = {}
            for tick in used_tickets:
                eid = tick.event_id
                if eid not in event_goers:
                    event_goers[eid] = []
                event_goers[eid].append(tick.goer)
            created_count = 0
            for event_id, goers in event_goers.items():
                if len(goers) < 2:
                    continue
                event = Event.objects.get(pk=event_id)
                seen_pairs = set()
                for i, a in enumerate(goers):
                    for b in goers[i + 1:]:
                        if a.id == b.id:
                            continue
                        pair = (min(a.id, b.id), max(a.id, b.id))
                        if pair in seen_pairs:
                            continue
                        seen_pairs.add(pair)
                        if rng.random() >= FRIENDSHIP_PAIR_KEEP_RATIO:
                            continue
                        user1, user2 = (a, b) if a.id < b.id else (b, a)
                        orbit_category = event.category
                        if orbit_category is None:
                            orbit_category, _ = EventCategory.objects.get_or_create(
                                slug="orbit-unknown",
                                defaults={"name": "Orbit Unknown", "icon": "Orbit"},
                            )
                        if Friendship.objects.filter(
                            user1=user1,
                            user2=user2,
                            orbit_category=orbit_category,
                        ).exists():
                            continue
                        Friendship.objects.create(
                            user1=user1,
                            user2=user2,
                            request_sender=user1,
                            status=Friendship.STATUS_ACCEPTED,
                            accepted_at=now,
                            met_at_event=event,
                            orbit_category=orbit_category,
                        )
                        created_count += 1
            self.stdout.write(f"  Created {created_count} friendships.")

        self.stdout.write(self.style.SUCCESS("Seeding complete!"))

    def run_extra_sql(self):
        """Execute extra SQL files to create views or other DB objects."""
        sql_path = Path(HERE).parents[3] / "event_view.sql"
        if not sql_path.exists():
            self.stdout.write(self.style.WARNING(f"SQL file not found at {sql_path}"))
            return

        self.stdout.write("Running extra SQL from event_view.sql...")
        with open(sql_path, "r", encoding="utf-8") as f:
            sql = f.read()

        # Drop view if exists and recreate
        sql = "DROP VIEW IF EXISTS event_overview;\n" + sql

        with connection.cursor() as cursor:
            try:
                # SQLite doesn't support multiple statements in one execute()
                # and CASADE is not supported.
                statements = [s.strip() for s in sql.split(";") if s.strip()]
                for statement in statements:
                    cursor.execute(statement)
                self.stdout.write(self.style.SUCCESS("Database view 'event_overview' created/updated."))
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"Error executing SQL: {e}"))
