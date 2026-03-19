import json
import math
import random
import os
import urllib.parse
import urllib.request
from pathlib import Path
from datetime import datetime, timedelta, timezone

from django.core.management.base import BaseCommand

HERE = Path(__file__).resolve().parent
HELPERS_DIR = HERE / "seed-helper-data"
PEXELS_CACHE_PATH = HELPERS_DIR / "pexels_cover_images_cache.json"
EVENT_TITLES_MD_PATH = HERE / "eventTitle.md"
LATLONGS_MD_PATH = HERE / "latlongs.md"
EVENT_CATEGORIES_PATH = HELPERS_DIR / "event_categories.json"
SEED_CENTER_LAT = 39.37
SEED_CENTER_LNG = -76.57
SEED_RADIUS_MILES = 200
PAID_TIER_PRICES = [15, 25, 35, 50, 75, 100]

FEATURE_POOL = [
    "Food",
    "Non-Alcoholic Drinks",
    "Alcoholic Drinks",
    "Music",
    "DJ",
    "Live Band",
    "Games",
    "Photo Booth",
    "Surprise Gifts",
    "Educational Activities",
    "Group Activities",
    "Networking",
    "Dance Floor",
    "Workshops",
    "Art",
    "Karaoke",
    "Bonfire",
    "Fireworks",
    "Pool",
    "Outdoor Seating",
    "Indoor Seating",
    "Decorations",
    "Themed Costumes",
    "Raffle",
    "Trivia",
    "Kids Zone",
    "Pet-Friendly",
    "Open Bar",
    "VIP Lounge",
    "Parking",
]


def random_point_within_radius(rng, center_lat, center_lng, radius_miles):
    """Generate a lat/lng within radius_miles of the given center."""
    earth_radius_miles = 3958.8
    distance = radius_miles * math.sqrt(rng.random())
    bearing = rng.uniform(0, 2 * math.pi)

    lat1 = math.radians(center_lat)
    lng1 = math.radians(center_lng)
    angular_distance = distance / earth_radius_miles

    lat2 = math.asin(
        math.sin(lat1) * math.cos(angular_distance)
        + math.cos(lat1) * math.sin(angular_distance) * math.cos(bearing)
    )
    lng2 = lng1 + math.atan2(
        math.sin(bearing) * math.sin(angular_distance) * math.cos(lat1),
        math.cos(angular_distance) - math.sin(lat1) * math.sin(lat2),
    )

    lng2 = (lng2 + 3 * math.pi) % (2 * math.pi) - math.pi
    return round(math.degrees(lat2), 6), round(math.degrees(lng2), 6)


def random_event_window_in_coming_month(rng, now):
    """Return start/end datetimes constrained to the next 30 days."""
    month_end = now + timedelta(days=30)

    # Keep at least one hour for duration by reserving room before month_end.
    latest_start = month_end - timedelta(hours=1)
    total_start_seconds = max(1, int((latest_start - now).total_seconds()))
    start_time = now + timedelta(seconds=rng.randint(1, total_start_seconds))

    # Event duration stays short and end_time never exceeds month_end.
    max_duration_seconds = max(3600, int((month_end - start_time).total_seconds()))
    duration_seconds = rng.randint(3600, min(max_duration_seconds, 48 * 3600))
    end_time = start_time + timedelta(seconds=duration_seconds)
    return start_time, end_time


def _get_pexels_api_key():
    # Support both spellings since `.env.example` historically used PEXEL_API_KEY.
    env_key = os.environ.get("PEXELS_API_KEY") or os.environ.get("PEXEL_API_KEY")
    if env_key:
        return env_key

    # This repo doesn't automatically load `backend/.env` into process env for management commands,
    # so fall back to parsing it directly for local dev.
    try:
        backend_dir = HERE.parents[3]
        env_path = backend_dir / ".env"
        if not env_path.exists():
            return None
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k = k.strip()
            if k not in {"PEXELS_API_KEY", "PEXEL_API_KEY"}:
                continue
            v = v.strip().strip('"').strip("'")
            if v:
                return v
    except Exception:
        return None
    return None


def pexels_image_urls(query: str, api_key: str | None, per_page: int = 30):
    """Return a list of image URLs from Pexels for the given query."""
    if not api_key:
        return [], "Missing API key"

    params = {
        "query": query,
        "per_page": max(1, min(80, per_page)),
        "orientation": "landscape",
        "size": "large",
    }
    url = "https://api.pexels.com/v1/search?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": api_key,
            "Accept": "application/json",
            "User-Agent": "outgoing-seed-generator/1.0",
        },
        method="GET",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        return [], f"{type(exc).__name__}: {exc}"

    photos = payload.get("photos") or []
    if not photos:
        return [], "No photos returned"

    urls = []
    seen = set()
    for p in photos:
        src = (p or {}).get("src") or {}
        url = src.get("large") or src.get("large2x") or src.get("original") or src.get("landscape")
        if url and url not in seen:
            seen.add(url)
            urls.append(url)

    if not urls:
        return [], "No src URL in photo results"
    return urls, None


def normalize_cached_cover_urls(value):
    """Support legacy string cache values and new list values."""
    if isinstance(value, str) and value:
        return [value]
    if isinstance(value, list):
        out = []
        seen = set()
        for item in value:
            if isinstance(item, str) and item and item not in seen:
                seen.add(item)
                out.append(item)
        return out
    return []


def _parse_markdown_table(md_text: str):
    """
    Parse a simple GitHub-style markdown table into list[dict].
    Assumes the first row is header, second row is separator.
    """
    lines = [ln.strip() for ln in (md_text or "").splitlines() if ln.strip()]
    table_lines = [ln for ln in lines if "|" in ln]
    if len(table_lines) < 2:
        return []

    def split_row(row: str):
        s = row.strip()
        if s.startswith("|"):
            s = s[1:]
        if s.endswith("|"):
            s = s[:-1]
        return [c.strip() for c in s.split("|")]

    headers = split_row(table_lines[0])
    out = []
    for raw in table_lines[1:]:
        # Skip separator rows like: | --- | --- |
        if set(raw.replace("|", "").replace(" ", "")) <= {"-"}:
            continue
        cols = split_row(raw)
        # Tolerate short/long rows
        if not any(cols):
            continue
        row = {}
        for i, h in enumerate(headers):
            if not h:
                continue
            row[h] = cols[i] if i < len(cols) else ""
        out.append(row)
    return out


def _load_event_categories():
    with open(EVENT_CATEGORIES_PATH, "r", encoding="utf-8") as f:
        cats = json.load(f) or []
    slug_to_cat = {}
    for c in cats:
        slug = (c or {}).get("slug")
        if not slug:
            continue
        slug_to_cat[slug] = {"name": c.get("name") or slug, "icon": c.get("icon") or "calendar"}
    return slug_to_cat


def _load_event_rows_from_md():
    """
    Load event rows from `eventTitle.md`.
    Expected columns: Category, Title, Description
    """
    md = EVENT_TITLES_MD_PATH.read_text(encoding="utf-8")
    rows = _parse_markdown_table(md)
    out = []
    for r in rows:
        cat = (r.get("Category") or r.get("category") or "").strip()
        title = (r.get("Title") or r.get("title") or "").strip()
        desc = (r.get("Description") or r.get("description") or "").strip()
        if not title:
            continue
        out.append({"category": cat, "title": title, "description": desc})
    return out


def _load_latlong_rows_from_md():
    """
    Load location rows from `latlongs.md`.
    Expected columns: Location Name, Location Address, Latitude, Longitude
    """
    md = LATLONGS_MD_PATH.read_text(encoding="utf-8")
    rows = _parse_markdown_table(md)
    out = []
    for r in rows:
        name = (r.get("Location Name") or r.get("location name") or "").strip()
        addr = (r.get("Location Address") or r.get("location address") or "").strip()
        lat_raw = (r.get("Latitude") or r.get("latitude") or "").strip()
        lng_raw = (r.get("Longitude") or r.get("longitude") or "").strip()
        if not (name or addr or lat_raw or lng_raw):
            continue
        try:
            lat = float(lat_raw) if lat_raw else None
        except Exception:
            lat = None
        try:
            lng = float(lng_raw) if lng_raw else None
        except Exception:
            lng = None
        out.append({"location_name": name or None, "location_address": addr or None, "latitude": lat, "longitude": lng})
    return out


def _random_features_for_event(rng: random.Random):
    # ~70% of events get a features list; among those, choose 0–4.
    if rng.random() >= 0.7:
        return None
    k = rng.randint(0, 4)
    if k <= 0:
        return []
    picked = rng.sample(FEATURE_POOL, min(k, len(FEATURE_POOL)))
    # Bias toward 'featured' so UI looks good by default.
    tags = ["featured", "featured", "additional", "extra"]
    return [{"name": name, "tag": rng.choice(tags)} for name in picked]


class Command(BaseCommand):
    help = "Generates a simple JSON seed dataset strictly adhering to seed_description.md and counts.md."

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            type=str,
            default=str(HERE / "seed_simple_generated.json"),
            help="Output JSON path.",
        )
        parser.add_argument("--rng-seed", type=int, default=1337, help="Random seed for reproducibility.")
        parser.add_argument("--debug", action="store_true", help="Enable verbose debug logging.")

    def handle(self, *args, **options):
        rng = random.Random(options["rng_seed"])
        out_path = Path(options["output"]).resolve()
        debug = bool(options.get("debug"))
        pexels_api_key = _get_pexels_api_key()
        if debug:
            self.stdout.write(f"[generate_seed_simple] output={out_path}")
            self.stdout.write(
                "[generate_seed_simple] pexels_api_key="
                + ("present" if pexels_api_key else "missing (set PEXELS_API_KEY or PEXEL_API_KEY)")
            )

        # Load helper data
        with open(HELPERS_DIR / "users_seed.json", "r", encoding="utf-8") as f:
            users_seed = json.load(f)
        with open(HELPERS_DIR / "service_categories.json", "r", encoding="utf-8") as f:
            service_categories = json.load(f)

        slug_to_event_category = _load_event_categories()
        md_events = _load_event_rows_from_md()
        md_locations = _load_latlong_rows_from_md()
        if debug:
            self.stdout.write(
                f"[generate_seed_simple] md_events={len(md_events)} md_locations={len(md_locations)} categories={len(slug_to_event_category)}"
            )

        base_users = users_seed.get("users", [])
        
        # Flatten service category IDs
        all_service_ids = []
        for group in service_categories:
            for item in group.get("items", []):
                if "id" in item:
                    all_service_ids.append(item["id"])

        # Datastores for generated data
        out_users = []
        out_services = []
        out_events = []
        out_event_ticket_tiers = []
        out_event_needs = []
        out_tickets = []

        # Cache Pexels results by query (category slug) so generation is stable + cheap.
        # Cache values are lists of URLs (legacy string values are normalized).
        pexels_cache = {}
        if PEXELS_CACHE_PATH.exists():
            try:
                with open(PEXELS_CACHE_PATH, "r", encoding="utf-8") as f:
                    pexels_cache = json.load(f) or {}
            except Exception:
                pexels_cache = {}
        pexels_cache = {
            k: normalize_cached_cover_urls(v)
            for k, v in pexels_cache.items()
            if normalize_cached_cover_urls(v)
        }
        if debug:
            self.stdout.write(
                f"[generate_seed_simple] cache_path={PEXELS_CACHE_PATH} loaded_keys={len(pexels_cache)}"
            )

        # Rotate cover images per category to avoid every event in one category using the same image.
        cover_index_by_category = {}

        # --- Phase 1: Users ---
        hosts = []
        vendors = []
        goers = []

        # Parse base users from users_seed
        for u in base_users:
            username = u.get("username", "")
            if not username:
                continue
            
            # Simple role derivation from username pattern or just splitting
            # The counts.md says: pick hosts from users_seed, pick vendors from users_seed
            # We'll distribute them arbitrarily if not specified, but typically 'host' or 'vendor' is in the name.
            role = "user"
            if "host" in username.lower():
                role = "host"
            elif "vendor" in username.lower():
                role = "vendor"

            first_last = username.split('_') if '_' in username else username.split('-')
            first_name = first_last[0] if len(first_last) > 0 else username
            last_name = first_last[1] if len(first_last) > 1 else username

            user_obj = {
                "username": username,
                "email": f"{username}@outgoing.com",
                "password": "password123",
                "first_name": first_name.capitalize(),
                "last_name": last_name.capitalize()
            }
            out_users.append(user_obj)

            if role == "host":
                hosts.append(user_obj)
            else:
                vendors.append(user_obj) # If not host, treat as vendor for seed purposes

        # If zero hosts or vendors, just artificially split the base users!
        if not hosts and out_users:
            hosts = out_users[:len(out_users)//2]
            vendors = out_users[len(out_users)//2:]

        # Goers
        for i in range(1, 61):
            username = f"goer_{i}"
            goer_obj = {
                "username": username,
                "email": f"{username}@outgoing.com",
                "password": "password123",
                "first_name": "Goer",
                "last_name": str(i)
            }
            out_users.append(goer_obj)
            goers.append(goer_obj)

        now = datetime.now(timezone.utc)
        
        # --- Phase 2: Events & Tiers ---
        valid_event_slugs = list(slug_to_event_category.keys())
        if not valid_event_slugs:
            valid_event_slugs = ["arts", "comedy", "music"]

        event_counter = 1
        for idx, ev in enumerate(md_events):
            host = hosts[idx % len(hosts)] if hosts else None
            if not host:
                continue

            cat = (ev.get("category") or "").strip()
            if cat not in slug_to_event_category:
                # Keep deterministic but valid
                cat = valid_event_slugs[idx % len(valid_event_slugs)]

            start_time, end_time = random_event_window_in_coming_month(rng, now)
            capacity = rng.randint(20, 40)

            loc = md_locations[idx] if idx < len(md_locations) else None
            if loc and (loc.get("latitude") is not None) and (loc.get("longitude") is not None):
                location_name = loc.get("location_name") or f"{ev['title']} Venue"
                location_address = loc.get("location_address") or ""
                latitude = loc.get("latitude")
                longitude = loc.get("longitude")
            else:
                # If MD list is short/mismatched, remaining events are online.
                location_name = "Online"
                location_address = "Online Event"
                latitude = None
                longitude = None

            event_key = f"evt_{event_counter}"
            is_published = rng.random() < 0.7
            status = "published" if is_published else "draft"

            cover_query = cat
            cached_urls = pexels_cache.get(cover_query, [])

            # Ensure we have a useful pool per category. If the cache is empty or only has one
            # URL, refresh from Pexels (when key is present) so same-category events can vary.
            if pexels_api_key and len(cached_urls) < 2:
                q = cover_query.replace("-", " ")
                if debug:
                    self.stdout.write(f"[generate_seed_simple] pexels_fetch query={q!r}")
                urls, err = pexels_image_urls(q, pexels_api_key, per_page=30)
                if urls:
                    pexels_cache[cover_query] = urls
                    cached_urls = urls
                if debug:
                    if urls:
                        self.stdout.write(
                            f"[generate_seed_simple] pexels_ok query={q!r} count={len(urls)}"
                        )
                    else:
                        self.stdout.write(f"[generate_seed_simple] pexels_fail query={q!r} err={err}")

            # Deterministic cycling per category keeps variation but still stable per RNG seed.
            if cached_urls:
                idx = cover_index_by_category.get(cover_query, 0)
                cover_url = cached_urls[idx % len(cached_urls)]
                cover_index_by_category[cover_query] = idx + 1
            else:
                cover_url = None

            event_obj = {
                "_key": event_key, # used internally for relation linking
                "host": host["username"],
                "category": cat,
                "title": ev["title"],
                "description": ev.get("description", ""),
                "location_name": location_name,
                "location_address": location_address,
                "latitude": latitude,
                "longitude": longitude,
                "start_time": start_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "end_time": end_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                # URL string; `seed_simple.py` will download and save into ImageField.
                "cover_image": cover_url,
                "status": status,
                "lifecycle_state": status,
                "capacity": capacity
            }
            features = _random_features_for_event(rng)
            if features is not None:
                event_obj["features"] = features
            out_events.append(event_obj)

            # Tiers
            num_tiers = rng.randint(1, 3)
            tier_names = ["General", "Premium", "VIP", "Adults + 1 Child"]
            tier_cap = capacity // num_tiers
            has_paid_tier = rng.random() < 0.7
            for t_idx in range(num_tiers):
                if has_paid_tier and t_idx > 0:
                    price = rng.choice(PAID_TIER_PRICES)
                elif has_paid_tier and num_tiers == 1:
                    price = rng.choice(PAID_TIER_PRICES)
                else:
                    price = 0

                tier_obj = {
                    "_key": f"{event_key}_tier_{t_idx}",
                    "event": event_key,
                    "name": tier_names[t_idx],
                    "price": price,
                    "capacity": tier_cap
                }
                out_event_ticket_tiers.append(tier_obj)

            # --- Phase 3: Event Needs ---
            num_needs = rng.randint(2, 6)
            need_categories = rng.sample(all_service_ids, min(num_needs, len(all_service_ids)))
            for nc in need_categories:
                need_obj = {
                    "event": event_key,
                    "category": nc,
                    "title": None,
                    "status": "pending",
                    "assigned_vendor": None
                }
                out_event_needs.append(need_obj)

            event_counter += 1

        # --- Phase 4: Vendor Services ---
        for vendor in vendors:
            num_services = rng.randint(4, 8)
            picked_services = rng.sample(all_service_ids, min(num_services, len(all_service_ids)))
            for svc_cat in picked_services:
                svc_obj = {
                    "vendor": vendor["username"],
                    "title": f"Service {svc_cat} by {vendor['username']}", # Title required for vendors per instructions
                    "description": "",
                    "category": svc_cat,
                    "location_city": "New York"
                }
                out_services.append(svc_obj)

        # --- Phase 5: Tickets ---
        # Track how many tickets are sold per tier
        tier_sold_counts = {t["_key"]: 0 for t in out_event_ticket_tiers}

        for goer in goers:
            for ev in out_events:
                if rng.random() < 0.3:
                    # Filter tiers for this event that still have capacity
                    ev_tiers = [
                        t for t in out_event_ticket_tiers 
                        if t["event"] == ev["_key"] and tier_sold_counts[t["_key"]] < t.get("capacity", float('inf'))
                    ]
                    
                    if ev_tiers:
                        tier = rng.choice(ev_tiers)
                        ticket_obj = {
                            "goer": goer["username"],
                            "tier": tier["_key"]
                        }
                        out_tickets.append(ticket_obj)
                        tier_sold_counts[tier["_key"]] += 1

        result = {
            "users": out_users,
            "services": out_services,
            "events": out_events,
            "event_ticket_tiers": out_event_ticket_tiers,
            "event_needs": out_event_needs,
            "tickets": out_tickets
        }

        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)

        # Persist cache for subsequent runs (keeps images stable across regen).
        try:
            HELPERS_DIR.mkdir(parents=True, exist_ok=True)
            with open(PEXELS_CACHE_PATH, "w", encoding="utf-8") as f:
                json.dump(pexels_cache, f, indent=2)
        except Exception:
            pass
        if debug:
            non_null = sum(1 for v in pexels_cache.values() if v)
            self.stdout.write(
                f"[generate_seed_simple] cache_saved keys={len(pexels_cache)} non_null={non_null}"
            )
            
        self.stdout.write(self.style.SUCCESS(f"Successfully generated seed data at {out_path}"))
