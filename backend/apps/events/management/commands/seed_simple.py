import json
import random
import mimetypes
import urllib.parse
import urllib.request
import hashlib
from datetime import datetime, timedelta, timezone
from pathlib import Path

from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.db import transaction, connection
from django.contrib.auth.hashers import make_password

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

from apps.events.management.commands.generate_seed_simple import (
    _get_pexels_api_key,
    normalize_cached_cover_urls,
    pexels_image_urls,
)

User = get_user_model()

HERE = Path(__file__).resolve().parent
HELPERS_DIR = HERE / "seed-helper-data"
EVENT_CATEGORIES_PATH = HELPERS_DIR / "event_categories.json"
EVENT_HIGHLIGHTS_SEED_PATH = HELPERS_DIR / "event_highlights_seed.json"
PEXELS_CACHE_PATH = HELPERS_DIR / "pexels_cover_images_cache.json"
LIVE_EVENT_RATIO = 0.2
LIVE_EVENT_USED_TICKET_RATIO = 0.9
# Fraction of co-attendee pairs that become seeded friendships (rest skipped).
FRIENDSHIP_PAIR_KEEP_RATIO = 0.3
# Each ticket goer independently posts a highlight with this probability.
HIGHLIGHT_PER_GOER_PROBABILITY = 0.3
# Among created highlights, this fraction get a Pexels image (download like event covers).
HIGHLIGHT_WITH_IMAGE_PROBABILITY = 0.5


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


def _stable_hex(s: str) -> str:
    return hashlib.sha1((s or "").encode("utf-8")).hexdigest()[:12]


def _existing_storage_name(instance, field_name: str, filename: str) -> str | None:
    """
    If the file already exists in the configured storage backend, return the
    fully resolved storage name (including upload_to path). Otherwise None.
    """
    f = instance._meta.get_field(field_name)
    storage_name = f.generate_filename(instance, filename)
    try:
        if f.storage.exists(storage_name):
            return storage_name
    except Exception:
        # If storage is unavailable, fall back to downloading.
        return None
    return None


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


def random_event_window_in_past_month(rng, now):
    """Return start/end datetimes constrained to the previous 30 days."""
    month_start = now - timedelta(days=30)

    # Keep at least one hour for duration by reserving room from month_start.
    earliest_start = month_start + timedelta(hours=1)
    total_start_seconds = max(1, int((now - earliest_start).total_seconds()))
    start_time = earliest_start + timedelta(seconds=rng.randint(0, total_start_seconds))

    # Keep duration short (1-48 hours) but always within the past window.
    max_duration_seconds = max(3600, int((now - start_time).total_seconds()))
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


def _load_event_highlights_by_category():
    """category_slug -> list of highlight text strings."""
    try:
        with open(EVENT_HIGHLIGHTS_SEED_PATH, "r", encoding="utf-8") as f:
            raw = json.load(f) or {}
    except Exception:
        return {}
    out = {}
    for slug, lines in raw.items():
        if not slug or not isinstance(lines, list):
            continue
        texts = [str(t).strip() for t in lines if isinstance(t, str) and str(t).strip()]
        if texts:
            out[str(slug)] = texts
    return out


def _load_pexels_cache():
    raw = {}
    if PEXELS_CACHE_PATH.exists():
        try:
            with open(PEXELS_CACHE_PATH, "r", encoding="utf-8") as f:
                raw = json.load(f) or {}
        except Exception:
            raw = {}
    return {
        k: normalize_cached_cover_urls(v)
        for k, v in raw.items()
        if normalize_cached_cover_urls(v)
    }


def _next_pexels_image_url(slug, pexels_cache, rot_by_slug, api_key, *, debug, log_write):
    """
    Pick next image URL for a category slug (same cache + API pattern as generate_seed_simple covers).
    Mutates pexels_cache when fetching from API. Returns (url_or_none, cache_was_mutated).
    """
    if not slug:
        return None, False
    mutated = False
    cached_urls = list(normalize_cached_cover_urls(pexels_cache.get(slug)))
    if api_key and len(cached_urls) < 2:
        q = slug.replace("-", " ")
        urls, err = pexels_image_urls(q, api_key, per_page=30)
        if urls:
            pexels_cache[slug] = urls
            cached_urls = urls
            mutated = True
        elif debug:
            log_write(f"[seed_simple] pexels_fail highlight query={q!r} err={err}")
    if not cached_urls:
        return None, mutated
    idx = rot_by_slug.get(slug, 0)
    url = cached_urls[idx % len(cached_urls)]
    rot_by_slug[slug] = idx + 1
    return url, mutated


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
        parser.add_argument(
            "--skip-images",
            action="store_true",
            help="Skip downloading/saving cover + highlight images (much faster).",
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

    def _seed_fresh_db_fast(
        self,
        *,
        users_data,
        services_data,
        events_data,
        tiers_data,
        needs_data,
        tickets_data,
        live_event_keys,
        category_defaults_by_slug,
        highlights_by_category,
        skip_images: bool,
        debug: bool,
        now,
        rng,
    ):
        """
        Fast seeding path intended for the default workflow (wipe DB then seed).

        Key idea: avoid per-row get_or_create() calls and avoid scanning DB tables
        we just created. Use bulk_create where possible, and build relationships
        from the in-memory seed payload.
        """
        cover_bytes_cache = {}
        pexels_cache = _load_pexels_cache()
        pexels_rot_by_slug = {}
        pexels_api_key = _get_pexels_api_key()
        pexels_cache_dirty = False

        # --- Categories (bulk) ---
        all_category_slugs = {e.get("category") for e in (events_data or []) if e.get("category")}
        all_category_slugs.add("orbit-unknown")
        cat_objs = []
        for slug in sorted(all_category_slugs):
            defaults = category_defaults_by_slug.get(slug) or {}
            cat_objs.append(
                EventCategory(
                    slug=slug,
                    name=defaults.get("name") or slug.replace("-", " ").title(),
                    icon=defaults.get("icon") or "calendar",
                )
            )
        EventCategory.objects.bulk_create(cat_objs, ignore_conflicts=True)
        category_map = EventCategory.objects.filter(slug__in=list(all_category_slugs)).in_bulk(
            field_name="slug"
        )
        orbit_unknown = category_map.get("orbit-unknown")

        # --- Users (bulk) ---
        self.stdout.write("Seeding Users...")
        user_objs = []
        usernames = []
        for u in users_data:
            usernames.append(u["username"])
            user_objs.append(
                User(
                    username=u["username"],
                    email=u.get("email") or "",
                    first_name=u.get("first_name") or "",
                    last_name=u.get("last_name") or "",
                    password=make_password(u.get("password") or ""),
                )
            )
        User.objects.bulk_create(user_objs, ignore_conflicts=True)
        user_map = User.objects.filter(username__in=usernames).in_bulk(field_name="username")

        # --- Vendor services (bulk) ---
        self.stdout.write("Seeding Services...")
        svc_objs = []
        for s in services_data:
            vendor = user_map.get(s["vendor"])
            if not vendor:
                continue
            svc_objs.append(
                VendorService(
                    vendor=vendor,
                    title=s["title"],
                    description=s.get("description") or "",
                    category=s.get("category"),
                    location_city=s.get("location_city") or "",
                    base_price=0,
                )
            )
        if svc_objs:
            VendorService.objects.bulk_create(svc_objs)

        # --- Events (bulk, with optional cover downloads) ---
        self.stdout.write("Seeding Events...")
        event_objs = []
        event_keys = []
        event_key_to_seed = {}
        live_event_ids = set()

        for e in events_data:
            host = user_map.get(e["host"])
            if not host:
                continue
            seed_key = e["_key"]
            event_keys.append(seed_key)
            event_key_to_seed[seed_key] = e

            is_live_event = seed_key in live_event_keys
            raw_status = e.get("status") or "published"
            if raw_status == "draft":
                raw_status = "published"
            is_completed_event = raw_status == "completed"
            if is_live_event:
                start_time = now + timedelta(hours=1)
                end_time = start_time + timedelta(hours=3)
                event_status = "published"
                event_lifecycle_state = "live"
            elif is_completed_event:
                start_time, end_time = random_event_window_in_past_month(rng, now)
                event_status = "completed"
                event_lifecycle_state = "completed"
            else:
                start_time, end_time = random_event_window_in_coming_month(rng, now)
                event_status = "published"
                event_lifecycle_state = "published"

            category_obj = category_map.get(e["category"])

            cover_image_file = None
            if not skip_images:
                cover_image_url = e.get("cover_image")
                if isinstance(cover_image_url, str) and cover_image_url.startswith(("http://", "https://")):
                    try:
                        filename = _filename_for_image_url(
                            cover_image_url,
                            fallback_stem=f"seed_{seed_key}_cover",
                        )
                        # Prefer reusing an existing file already in storage.
                        tmp_ev = Event(host=host, title=e["title"])
                        existing_name = _existing_storage_name(tmp_ev, "cover_image", filename)
                        if existing_name:
                            cover_image_file = existing_name
                        else:
                            if cover_image_url in cover_bytes_cache:
                                img_bytes, _content_type = cover_bytes_cache[cover_image_url]
                            else:
                                img_bytes, content_type = _download_image_bytes(cover_image_url)
                                cover_bytes_cache[cover_image_url] = (img_bytes, content_type)
                            if img_bytes:
                                cover_image_file = ContentFile(img_bytes, name=filename)
                    except Exception:
                        cover_image_file = None

            ev = Event(
                host=host,
                title=e["title"],
                category=category_obj,
                description=e.get("description", "") or "",
                location_name=e.get("location_name", "Default Venue") or "Default Venue",
                location_address=e.get("location_address", "") or "",
                latitude=e.get("latitude"),
                longitude=e.get("longitude"),
                features=e.get("features", []) or [],
                cover_image=cover_image_file,
                start_time=start_time,
                end_time=end_time,
                status=event_status,
                lifecycle_state=event_lifecycle_state,
                capacity=e["capacity"],
                slug=f"evt-{host.username}-{e['title'].replace(' ', '-').lower()}"[:50],
            )
            # Stash seed key for later mapping.
            ev._seed_key = seed_key  # type: ignore[attr-defined]
            event_objs.append(ev)

        if event_objs:
            Event.objects.bulk_create(event_objs)

        event_map = {getattr(ev, "_seed_key"): ev for ev in event_objs}
        for seed_key, ev in event_map.items():
            if seed_key in live_event_keys:
                live_event_ids.add(ev.id)

        # --- Tiers (bulk) ---
        self.stdout.write("Seeding Event Tiers...")
        tier_objs = []
        tier_keys = []
        for t in tiers_data:
            ev = event_map.get(t["event"])
            if not ev or ev.status == "draft":
                continue
            tier = EventTicketTier(
                event=ev,
                name=t["name"],
                price=t["price"],
                capacity=t["capacity"],
            )
            tier._seed_key = t["_key"]  # type: ignore[attr-defined]
            tier_objs.append(tier)
            tier_keys.append(t["_key"])
        if tier_objs:
            EventTicketTier.objects.bulk_create(tier_objs)
        tier_map = {getattr(t, "_seed_key"): t for t in tier_objs}

        # --- Needs (bulk) ---
        self.stdout.write("Seeding Event Needs...")
        need_objs = []
        for n in needs_data:
            ev = event_map.get(n["event"])
            if not ev:
                continue
            vendor = user_map.get(n["assigned_vendor"]) if n.get("assigned_vendor") else None
            need_objs.append(
                EventNeed(
                    event=ev,
                    category=n["category"],
                    title=n["title"] or fallback_need_title(n["category"]),
                    status=normalize_need_status(n.get("status")),
                    assigned_vendor=vendor,
                )
            )
        if need_objs:
            EventNeed.objects.bulk_create(need_objs)

        # --- Tickets (bulk) ---
        self.stdout.write("Seeding Tickets...")
        ticket_objs = []
        used_ticket_goers_by_event_id = {}
        goers_by_event_id = {}
        for t in tickets_data:
            goer = user_map.get(t["goer"])
            tier = tier_map.get(t["tier"])
            if not goer or not tier or tier.event.status == "draft":
                continue
            ticket_status = "active"
            used_at = None
            if tier.event.status == "completed":
                ticket_status = "used"
                used_at = now
            elif tier.event_id in live_event_ids and rng.random() < LIVE_EVENT_USED_TICKET_RATIO:
                ticket_status = "used"
                used_at = now
            ticket_objs.append(
                Ticket(
                    event=tier.event,
                    goer=goer,
                    tier=tier,
                    status=ticket_status,
                    used_at=used_at,
                )
            )

            eid = tier.event_id
            if eid not in goers_by_event_id:
                goers_by_event_id[eid] = set()
            goers_by_event_id[eid].add(goer)

            if ticket_status == "used":
                if eid not in used_ticket_goers_by_event_id:
                    used_ticket_goers_by_event_id[eid] = []
                used_ticket_goers_by_event_id[eid].append(goer)

        if ticket_objs:
            Ticket.objects.bulk_create(ticket_objs)

        # --- Highlights (bulk, optional images) ---
        self.stdout.write("Seeding Event Highlights (from ticket goers)...")
        highlight_objs = []
        highlight_with_image_count = 0
        for eid, goers in goers_by_event_id.items():
            ev = next((e for e in event_map.values() if e.id == eid), None)
            if not ev:
                continue
            if ev.lifecycle_state not in {"live", "completed"}:
                continue
            slug = ev.category.slug if ev.category_id else None
            pool = highlights_by_category.get(slug) if slug else None
            if not pool:
                continue
            for goer in goers:
                if rng.random() >= HIGHLIGHT_PER_GOER_PROBABILITY:
                    continue
                media_file = None
                if (not skip_images) and (rng.random() < HIGHLIGHT_WITH_IMAGE_PROBABILITY):
                    img_url, mutated = _next_pexels_image_url(
                        slug,
                        pexels_cache,
                        pexels_rot_by_slug,
                        pexels_api_key,
                        debug=debug,
                        log_write=self.stdout.write,
                    )
                    if mutated:
                        pexels_cache_dirty = True
                    if img_url:
                        try:
                            # Deterministic name so we can reuse across seed runs.
                            stem = f"seed_hl_{getattr(ev, '_seed_key', ev.id)}_u{goer.id}_{_stable_hex(img_url)}"
                            filename = _filename_for_image_url(img_url, fallback_stem=stem)

                            tmp_hl = EventHighlight(event=ev, author=goer, role="goer", text="")
                            existing_name = _existing_storage_name(tmp_hl, "media_file", filename)
                            if existing_name:
                                media_file = existing_name
                            else:
                                if img_url in cover_bytes_cache:
                                    img_bytes, _content_type = cover_bytes_cache[img_url]
                                else:
                                    img_bytes, content_type = _download_image_bytes(img_url)
                                    cover_bytes_cache[img_url] = (img_bytes, content_type)
                                if img_bytes:
                                    media_file = ContentFile(img_bytes, name=filename)
                        except Exception:
                            media_file = None
                if media_file is not None:
                    highlight_with_image_count += 1
                highlight_objs.append(
                    EventHighlight(
                        event=ev,
                        author=goer,
                        role="goer",
                        text=rng.choice(pool),
                        media_file=media_file,
                    )
                )
        if highlight_objs:
            EventHighlight.objects.bulk_create(highlight_objs)
        self.stdout.write(
            f"  Created {len(highlight_objs)} highlights "
            f"({highlight_with_image_count} with images)."
        )

        # --- Friendships (bulk) ---
        self.stdout.write("Seeding Friendships (from used tickets)...")
        friendship_objs = []
        friendship_keys = set()
        created_count = 0
        for eid, goers in used_ticket_goers_by_event_id.items():
            if len(goers) < 2:
                continue
            ev = next((e for e in event_map.values() if e.id == eid), None)
            if not ev:
                continue
            orbit_category = ev.category or orbit_unknown
            seen_pairs = set()
            for i, a in enumerate(goers):
                for b in goers[i + 1 :]:
                    if a.id == b.id:
                        continue
                    pair = (min(a.id, b.id), max(a.id, b.id))
                    if pair in seen_pairs:
                        continue
                    seen_pairs.add(pair)
                    if rng.random() >= FRIENDSHIP_PAIR_KEEP_RATIO:
                        continue
                    user1, user2 = (a, b) if a.id < b.id else (b, a)
                    key = (user1.id, user2.id, orbit_category.id if orbit_category else None)
                    if key in friendship_keys:
                        continue
                    friendship_keys.add(key)
                    friendship_objs.append(
                        Friendship(
                            user1=user1,
                            user2=user2,
                            request_sender=user1,
                            status=(
                                Friendship.STATUS_ACCEPTED
                                if rng.random() < 0.5
                                else Friendship.STATUS_PENDING
                            ),
                            accepted_at=now,
                            met_at_event=ev,
                            orbit_category=orbit_category,
                        )
                    )
                    created_count += 1
        if friendship_objs:
            # Extra safety: if the model has additional unique constraints we missed,
            # don't fail the seed run.
            Friendship.objects.bulk_create(friendship_objs, ignore_conflicts=True)
        self.stdout.write(f"  Created {created_count} friendships.")

        if pexels_cache_dirty:
            try:
                HELPERS_DIR.mkdir(parents=True, exist_ok=True)
                with open(PEXELS_CACHE_PATH, "w", encoding="utf-8") as f:
                    json.dump(pexels_cache, f, indent=2)
            except Exception:
                pass

    def handle(self, *args, **options):
        input_path = Path(options["input"]).resolve()
        rng = random.Random()
        now = datetime.now(timezone.utc)
        debug = bool(options.get("debug"))
        skip_images = bool(options.get("skip_images"))
        if debug:
            self.stdout.write(f"[seed_simple] input={input_path} no_wipe={bool(options.get('no_wipe'))}")
        
        if not input_path.exists():
            self.stderr.write(self.style.ERROR(f"Input file {input_path} does not exist."))
            return

        with open(input_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        category_defaults_by_slug = _load_event_categories_by_slug()
        highlights_by_category = _load_event_highlights_by_category()

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
            # Only choose non-completed events as "live". If the generator accidentally marks
            # something as completed, we never want it to become live.
            eligible_for_live = [
                e for e in events_data if (e.get("status") not in {"completed", "draft"})
            ]
            if eligible_for_live:
                live_event_count = max(1, int(len(events_data) * LIVE_EVENT_RATIO))
                live_event_count = min(live_event_count, len(eligible_for_live))
                live_event_keys = {
                    event["_key"] for event in rng.sample(eligible_for_live, live_event_count)
                }

        user_map = {}
        event_map = {}
        tier_map = {}
        live_event_ids = set()
        cover_bytes_cache = {}
        pexels_cache = _load_pexels_cache()
        pexels_rot_by_slug = {}
        pexels_api_key = _get_pexels_api_key()
        pexels_cache_dirty = False

        with transaction.atomic():
            # Fast path: when we're wiping, the DB is empty; bulk_create is safe and far faster.
            # Keep the slower get_or_create path for --no-wipe runs where we must avoid duplicates.
            if not options.get("no_wipe"):
                self._seed_fresh_db_fast(
                    users_data=users_data,
                    services_data=services_data,
                    events_data=events_data,
                    tiers_data=tiers_data,
                    needs_data=needs_data,
                    tickets_data=tickets_data,
                    live_event_keys=live_event_keys,
                    category_defaults_by_slug=category_defaults_by_slug,
                    highlights_by_category=highlights_by_category,
                    skip_images=skip_images,
                    debug=debug,
                    now=now,
                    rng=rng,
                )
                # Skip the legacy path below.
                return

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

                    raw_status = e.get("status") or "published"
                    # Hard guarantee: no draft events in seeded data.
                    if raw_status == "draft":
                        raw_status = "published"

                    is_completed_event = raw_status == "completed"
                    if is_live_event:
                        # Start in ~1 hour so "tonight" feed includes them.
                        start_time = now + timedelta(hours=1)
                        end_time = start_time + timedelta(hours=3)
                        event_status = "published"
                        event_lifecycle_state = "live"
                    elif is_completed_event:
                        start_time, end_time = random_event_window_in_past_month(rng, now)
                        event_status = "completed"
                        event_lifecycle_state = "completed"
                    else:
                        start_time, end_time = random_event_window_in_coming_month(rng, now)
                        event_status = "published"
                        event_lifecycle_state = "published"
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
                    if tier.event.status == "completed":
                        ticket_status = "used"
                        used_at = now
                    elif tier.event_id in live_event_ids and rng.random() < LIVE_EVENT_USED_TICKET_RATIO:
                        ticket_status = "used"
                        used_at = now
                    Ticket.objects.create(
                        event=tier.event,
                        goer=goer,
                        tier=tier,
                        status=ticket_status,
                        used_at=used_at,
                    )

            self.stdout.write("Seeding Event Highlights (from ticket goers)...")
            event_goers_for_highlights = {}
            for tick in Ticket.objects.select_related("event", "event__category", "goer"):
                ev = tick.event
                # Only attach highlights to events that are currently live or already completed.
                if ev.lifecycle_state not in {"live", "completed"}:
                    continue
                eid = ev.id
                if eid not in event_goers_for_highlights:
                    event_goers_for_highlights[eid] = {"event": ev, "goers": set()}
                event_goers_for_highlights[eid]["goers"].add(tick.goer)
            highlight_count = 0
            highlight_with_image_count = 0
            for _eid, payload in event_goers_for_highlights.items():
                event = payload["event"]
                slug = event.category.slug if event.category_id else None
                pool = highlights_by_category.get(slug) if slug else None
                if not pool:
                    continue
                for goer in payload["goers"]:
                    if rng.random() >= HIGHLIGHT_PER_GOER_PROBABILITY:
                        continue
                    media_file = None
                    if rng.random() < HIGHLIGHT_WITH_IMAGE_PROBABILITY:
                        img_url, mutated = _next_pexels_image_url(
                            slug,
                            pexels_cache,
                            pexels_rot_by_slug,
                            pexels_api_key,
                            debug=debug,
                            log_write=self.stdout.write,
                        )
                        if mutated:
                            pexels_cache_dirty = True
                        if img_url:
                            try:
                                if debug:
                                    self.stdout.write(
                                        f"[seed_simple] highlight_download event_id={event.id} url={img_url}"
                                    )
                                if img_url in cover_bytes_cache:
                                    img_bytes, _content_type = cover_bytes_cache[img_url]
                                else:
                                    img_bytes, content_type = _download_image_bytes(img_url)
                                    cover_bytes_cache[img_url] = (img_bytes, content_type)
                                if img_bytes:
                                    # Deterministic filename: no random suffix.
                                    stem = f"seed_hl_e{event.id}_u{goer.id}_{_stable_hex(img_url)}"
                                    filename = _filename_for_image_url(
                                        img_url, fallback_stem=stem
                                    )
                                    media_file = ContentFile(img_bytes, name=filename)
                                    if debug:
                                        self.stdout.write(
                                            f"[seed_simple] highlight_download_ok bytes={len(img_bytes)} "
                                            f"content_type={content_type!r}"
                                        )
                            except Exception:
                                if debug:
                                    import traceback

                                    self.stdout.write(
                                        "[seed_simple] highlight_download_fail\n"
                                        + traceback.format_exc()
                                    )
                                media_file = None
                    EventHighlight.objects.create(
                        event=event,
                        author=goer,
                        role="goer",
                        text=rng.choice(pool),
                        media_file=media_file,
                    )
                    highlight_count += 1
                    if media_file is not None:
                        highlight_with_image_count += 1
            self.stdout.write(
                f"  Created {highlight_count} highlights "
                f"({highlight_with_image_count} with images)."
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
                            status=(
                                Friendship.STATUS_ACCEPTED
                                if rng.random() < 0.5
                                else Friendship.STATUS_PENDING
                            ),
                            accepted_at=now,
                            met_at_event=event,
                            orbit_category=orbit_category,
                        )
                        created_count += 1
            self.stdout.write(f"  Created {created_count} friendships.")

        if pexels_cache_dirty:
            try:
                HELPERS_DIR.mkdir(parents=True, exist_ok=True)
                with open(PEXELS_CACHE_PATH, "w", encoding="utf-8") as f:
                    json.dump(pexels_cache, f, indent=2)
            except Exception:
                pass

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
