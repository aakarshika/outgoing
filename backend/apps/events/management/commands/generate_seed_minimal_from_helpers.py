from __future__ import annotations

import argparse
import json
import random
import string
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any, Iterable


HERE = Path(__file__).resolve().parent


def _read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _slugify(value: str) -> str:
    out = []
    prev_dash = False
    for ch in value.lower().strip():
        if ch.isalnum():
            out.append(ch)
            prev_dash = False
        else:
            if not prev_dash:
                out.append("-")
                prev_dash = True
    s = "".join(out).strip("-")
    return s or "user"


def _money(value: Decimal | int | float | str) -> str:
    if not isinstance(value, Decimal):
        value = Decimal(str(value))
    return f"{value.quantize(Decimal('0.01'))}"


def _utc(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _pick_int(rng: random.Random, lo: int, hi: int) -> int:
    if hi < lo:
        return lo
    return rng.randint(lo, hi)


def _pick_some(rng: random.Random, items: list[Any], k_min: int, k_max: int) -> list[Any]:
    if not items:
        return []
    k = _pick_int(rng, k_min, min(k_max, len(items)))
    if k <= 0:
        return []
    return rng.sample(items, k=k)


@dataclass
class User:
    username: str
    email: str
    password: str
    first_name: str
    last_name: str

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


class SeedBuilder:
    def __init__(
        self,
        *,
        rng: random.Random,
        filename_tag: str,
        base_users: list[dict[str, Any]],
        base_profiles: list[dict[str, Any]],
        event_categories: list[dict[str, Any]],
        service_categories: list[dict[str, Any]],
        event_titles: list[dict[str, Any]],
        application_seeds: list[dict[str, Any]],
        highlight_texts: dict[str, list[str]],
        reviews_seed: list[dict[str, Any]],
    ) -> None:
        self.rng = rng
        self.filename_tag = filename_tag

        # Users and profiles come from users_seed.json and must be reused.
        self._base_users = list(base_users)
        self._base_profiles = list(base_profiles)

        self.event_categories = event_categories
        self.service_categories = service_categories
        self.event_titles = event_titles
        self.application_seeds = application_seeds
        self.highlight_texts = highlight_texts
        self.reviews_seed = reviews_seed

        self.users_by_username: dict[str, User] = {}
        self.profiles: list[dict[str, Any]] = list(self._base_profiles)
        self.services: list[dict[str, Any]] = []
        self.events: list[dict[str, Any]] = []
        self.transitions: list[dict[str, Any]] = []
        self.ticket_tiers: list[dict[str, Any]] = []
        self.tickets: list[dict[str, Any]] = []
        self.event_needs: list[dict[str, Any]] = []
        self.need_apps: list[dict[str, Any]] = []
        self.need_invites: list[dict[str, Any]] = []
        self.event_highlights: list[dict[str, Any]] = []
        self.event_reviews: list[dict[str, Any]] = []

        self._ticket_counter = 0

        # Build user objects and simple role pools from the base users.
        self._role_users: dict[str, list[User]] = {"host": [], "vendor": [], "goer": []}
        self._role_index: dict[str, int] = {"host": 0, "vendor": 0, "goer": 0}

        for u in self._base_users:
            if not isinstance(u, dict):
                continue
            username = str(u.get("username") or "")
            email = str(u.get("email") or f"{username}@example.com")
            first_name = str(u.get("first_name") or "")
            last_name = str(u.get("last_name") or "")
            if not username:
                continue
            user_obj = User(
                username=username,
                email=email,
                password=str(u.get("password") or "password123"),
                first_name=first_name,
                last_name=last_name,
            )
            self.users_by_username[username] = user_obj

            role_key = last_name.lower()
            if role_key in self._role_users:
                self._role_users[role_key].append(user_obj)

        self._valid_event_category_slugs = self._compute_valid_event_category_slugs()

        self._event_title_by_category: dict[str, list[dict[str, str]]] = {}
        for block in self.event_titles:
            category = block.get("category")
            events = block.get("events") or []
            if isinstance(category, str) and isinstance(events, list):
                self._event_title_by_category[category] = [
                    {"name": e.get("name", ""), "description": e.get("description", "")}
                    for e in events
                    if isinstance(e, dict)
                ]

        self._apps_by_category: dict[str, list[dict[str, str]]] = {}
        for block in self.application_seeds:
            if not isinstance(block, dict):
                continue
            for category, apps in block.items():
                if not isinstance(category, str) or not isinstance(apps, list):
                    continue
                self._apps_by_category.setdefault(category, [])
                for app in apps:
                    if isinstance(app, dict):
                        self._apps_by_category[category].append(
                            {
                                "service": str(app.get("service", "")),
                                "service_team_name": str(app.get("service_team_name", "")),
                                "cover_letter_text": str(app.get("cover_letter_text", "")),
                            }
                        )

        self._reviews_by_category: dict[str, list[dict[str, Any]]] = {}
        for block in self.reviews_seed:
            category = block.get("category")
            reviews = block.get("reviews") or []
            if isinstance(category, str) and isinstance(reviews, list):
                self._reviews_by_category[category] = [r for r in reviews if isinstance(r, dict)]

        # Per-category pool to avoid reusing the same helper event titles twice.
        self._remaining_titles_by_category: dict[str, list[dict[str, str]]] = {
            cat: list(items) for cat, items in self._event_title_by_category.items()
        }

    def _compute_valid_event_category_slugs(self) -> list[str]:
        slugs_from_titles = {b.get("category") for b in self.event_titles if isinstance(b, dict)}
        slugs_from_titles = {s for s in slugs_from_titles if isinstance(s, str)}
        slugs_from_highlights = set(self.highlight_texts.keys())
        slugs_from_reviews = {
            b.get("category") for b in self.reviews_seed if isinstance(b, dict) and isinstance(b.get("category"), str)
        }
        slugs_from_apps = set()
        for block in self.application_seeds:
            if isinstance(block, dict):
                slugs_from_apps.update(block.keys())

        intersection = slugs_from_titles & slugs_from_highlights & slugs_from_reviews & slugs_from_apps
        if not intersection:
            # Fallback: at least use whatever we have titles for.
            intersection = slugs_from_titles or slugs_from_highlights or slugs_from_reviews
        return sorted(intersection)

    def build(self) -> dict[str, Any]:
        # For every host persona, create many events.
        host_pool = self._role_users.get("host") or [self._create_user(role_hint="host")]

        all_event_keys: list[str] = []
        host_event_keys: dict[str, list[str]] = {}

        for host in host_pool:
            self._ensure_profile(host.username)

            # Original spec: 1–5 events per host. Scale by 10x → 10–50.
            n_events = _pick_int(self.rng, 10, 50)
            for _ in range(n_events):
                if not self._valid_event_category_slugs:
                    break
                event_category = self.rng.choice(self._valid_event_category_slugs)
                ev_index = len(self.events) + 1
                ev_key = f"event_{self.filename_tag}_{ev_index}"
                all_event_keys.append(ev_key)
                host_event_keys.setdefault(host.username, []).append(ev_key)

                self._create_event(key=ev_key, host_username=host.username, category_slug=event_category)

                # Original spec: 0–7 highlights. Scale by 10x → 0–70.
                n_initial_hl = _pick_int(self.rng, 0, 70)
                for j in range(1, n_initial_hl + 1):
                    self._create_highlight(
                        event_key=ev_key,
                        category_slug=event_category,
                        author_username=host.username,
                        role="host",
                        key=f"hl_{self.filename_tag}_{ev_index}_{j}",
                    )

        # Attach needs/tickets flow to the first host's events.
        has_needs = bool(_pick_int(self.rng, 0, 1))
        first_host = host_pool[0] if host_pool else None

        if not has_needs:
            if all_event_keys and first_host is not None:
                self._transition_event(
                    all_event_keys[0],
                    actor=first_host.username,
                    to_state="published",
                    reason="No needs required",
                )
        else:
            primary_event_key = all_event_keys[0] if all_event_keys else None
            secondary_event_key = all_event_keys[1] if len(all_event_keys) > 1 else None

            if primary_event_key is not None and first_host is not None:
                primary_event_category = self._event_by_key(primary_event_key)["category"]
                self._create_needs_and_applications(
                    event_key=primary_event_key,
                    event_category_slug=primary_event_category,
                    host_username=first_host.username,
                    secondary_event_key_to_publish=secondary_event_key,
                )

        return self._to_seed_json()

    def _to_seed_json(self) -> dict[str, Any]:
        categories_minimal = [
            {"name": c["name"], "slug": c["slug"], "icon": c.get("icon", "")}
            for c in self.event_categories
            if isinstance(c, dict) and isinstance(c.get("slug"), str) and isinstance(c.get("name"), str)
        ]

        return {
            # Users and profiles are taken directly from users_seed.json so all references
            # in this generated file point to known personas.
            "users": list(self._base_users),
            "profiles": list(self.profiles),
            "categories": categories_minimal,
            "services": list(self.services),
            "events": list(self.events),
            "event_lifecycle_transitions": list(self.transitions),
            "event_ticket_tiers": list(self.ticket_tiers),
            "event_needs": list(self.event_needs),
            "need_applications": list(self.need_apps),
            "need_invites": list(self.need_invites),
            "tickets": list(self.tickets),
            "event_media": [],
            "event_highlights": list(self.event_highlights),
            "event_highlight_likes": [],
            "event_highlight_comments": [],
            "event_reviews": list(self.event_reviews),
            "event_review_media": [],
            "event_vendor_reviews": [],
            "vendor_reviews": [],
            "event_review_likes": [],
            "event_review_comments": [],
            "event_interests": [],
            "event_views": [],
        }

    def _create_user(self, *, role_hint: str) -> User:
        """Return an existing user from users_seed.json, cycling within the appropriate role group."""
        role = role_hint.lower()
        pool: list[User] = []
        if role in self._role_users and self._role_users[role]:
            pool = self._role_users[role]
        else:
            # Fallback: use all known users if no specific role pool exists.
            pool = list(self.users_by_username.values())

        if not pool:
            raise ValueError("No users available to assign for seeding.")

        idx = self._role_index.get(role, 0)
        user = pool[idx % len(pool)]
        self._role_index[role] = idx + 1
        return user

    def _ensure_profile(self, username: str) -> None:
        if any(p.get("user") == username for p in self.profiles):
            return
        self.profiles.append(
            {
                "user": username,
                "headline": "Seeded profile",
                "bio": "Seeded user profile for generated seed data.",
                "location_city": "New York",
                "avatar": "https://placehold.co/150x150/png",
                "cover_photo": "https://placehold.co/1200x400/png",
            }
        )

    def _create_vendor_service(self, vendor_username: str, service_category_id: str) -> str:
        key = f"svc_{vendor_username}"
        if any(s.get("key") == key for s in self.services):
            return key

        vendor = self.users_by_username[vendor_username]
        base_price = Decimal(_pick_int(self.rng, 120, 450))

        self.services.append(
            {
                "key": key,
                "vendor": vendor_username,
                "title": f"{vendor.first_name} {service_category_id.replace('_', ' ').title()} Service",
                "description": "Generated service offering for seeded vendor applications.",
                "category": service_category_id,
                "base_price": _money(base_price),
                "location_city": "New York",
                "portfolio_image": "https://placehold.co/900x600/png",
            }
        )
        return key

    def _create_event(self, *, key: str, host_username: str, category_slug: str) -> None:
        if any(e.get("key") == key for e in self.events):
            return

        # Try to take an unused title/description pair for this category.
        title_item = None
        remaining = self._remaining_titles_by_category.get(category_slug)
        if remaining:
            title_item = remaining.pop(0)

        if title_item:
            title = title_item.get("name") or "Community Event"
            description = title_item.get("description") or "A great event."
        else:
            title = "Community Event"
            description = "A great event."

        now = datetime.now(timezone.utc)
        start = now + timedelta(days=_pick_int(self.rng, 5, 40), hours=_pick_int(self.rng, 0, 12))
        duration_hours = _pick_int(self.rng, 2, 4)
        end = start + timedelta(hours=duration_hours)

        # Original spec: capacity 2–10. Scale by 10x → 20–100.
        capacity = _pick_int(self.rng, 20, 100)

        self.events.append(
            {
                "key": key,
                "slug": f"{self.filename_tag}-{_slugify(title)}-{key[-2:]}",
                "host": host_username,
                "category": category_slug,
                "title": title,
                "description": description,
                "location_name": f"{title} Venue",
                "location_address": f"{_pick_int(self.rng, 10, 999)} Main St, New York",
                "latitude": "40.712800",
                "longitude": "-74.006000",
                "start_time": _utc(start),
                "end_time": _utc(end),
                "capacity": capacity,
                "status": "draft",
                "lifecycle_state": "draft",
                "tags": [category_slug],
                "features": [],
                "check_in_instructions": "Show your QR ticket at entry.",
                "event_ready_message": "Event team is ready and welcoming attendees.",
                "cover_image": "/assets/default-event-img.png",
                "created_at": _utc(now - timedelta(days=_pick_int(self.rng, 1, 30))),
                "recurrence_rule": None,
                "series_id": None,
                "occurrence_index": None,
                "is_recurring": False,
            }
        )

        # Create one ticket tier per event
        tier_key = f"tier_{self.filename_tag}_{key.split('_')[-1]}"
        tier_capacity = capacity
        price = Decimal(_pick_int(self.rng, 10, 45))
        self.ticket_tiers.append(
            {
                "key": tier_key,
                "event": key,
                "name": "General Admission",
                "description": "Standard access",
                "admits": 1,
                "color": "#fde68a",
                "price": _money(price),
                "capacity": tier_capacity,
                "is_refundable": True,
                "refund_percentage": 100,
            }
        )

    def _event_by_key(self, event_key: str) -> dict[str, Any]:
        for e in self.events:
            if e.get("key") == event_key:
                return e
        raise KeyError(f"Unknown event key: {event_key}")

    def _tier_by_event(self, event_key: str) -> dict[str, Any]:
        for t in self.ticket_tiers:
            if t.get("event") == event_key:
                return t
        raise KeyError(f"No tier for event: {event_key}")

    def _transition_event(self, event_key: str, *, actor: str, to_state: str, reason: str) -> None:
        event = self._event_by_key(event_key)
        from_state = event.get("lifecycle_state", "draft")
        if from_state == to_state:
            return

        event["lifecycle_state"] = to_state
        if to_state != "draft":
            event["status"] = "published"

        self.transitions.append(
            {
                "event": event_key,
                "actor": actor,
                "from_state": from_state,
                "to_state": to_state,
                "reason": reason,
            }
        )

    def _create_needs_and_applications(
        self,
        *,
        event_key: str,
        event_category_slug: str,
        host_username: str,
        secondary_event_key_to_publish: str | None,
    ) -> None:
        # Original spec: 1–6 needs. Scale by 10x → 10–60.
        n_needs = _pick_int(self.rng, 10, 60)

        apps_seed_pool = self._apps_by_category.get(event_category_slug, [])
        if not apps_seed_pool:
            return

        published_secondary = False

        for need_idx in range(1, n_needs + 1):
            # Application helper snippets can be reused; just pick randomly from the pool.
            seed_app = self.rng.choice(apps_seed_pool)
            service_category_id = seed_app.get("service") or self.rng.choice(self._all_service_ids())

            need_key = f"need_{self.filename_tag}_{event_key.split('_')[-1]}_{need_idx}"
            need = {
                "key": need_key,
                "event": event_key,
                "title": f"{service_category_id.replace('_', ' ').title()} Needed",
                "description": "Generated need for seeded event.",
                "category": service_category_id,
                # Allowed values validated by seed_all: ['essential', 'non_substitutable', 'replaceable']
                "criticality": self.rng.choice(["essential", "non_substitutable", "replaceable"]),
                "budget_min": _money(Decimal(_pick_int(self.rng, 150, 300))),
                "budget_max": _money(Decimal(_pick_int(self.rng, 400, 1200))),
                "status": "open",
                "assigned_vendor": None,
            }
            self.event_needs.append(need)

            # Original spec: 1–2 vendors per need. Scale by 10x → 10–20.
            n_vendors = _pick_int(self.rng, 10, 20)
            accepted_any = False
            accepted_vendor_username: str | None = None

            for vendor_idx in range(1, n_vendors + 1):
                vendor = self._create_user(role_hint="vendor")
                self._ensure_profile(vendor.username)

                vendor_service_key = self._create_vendor_service(vendor.username, service_category_id)
                status = self.rng.choice(["accepted", "pending"])
                if accepted_any:
                    status = "pending"

                app_key = f"app_{self.filename_tag}_{need_key.split('_')[-2]}_{need_idx}_{vendor_idx}"
                proposed = Decimal(_pick_int(self.rng, 180, 700))
                message = seed_app.get("cover_letter_text") or "I would love to help with this need."
                self.need_apps.append(
                    {
                        "key": app_key,
                        "need": need_key,
                        "vendor": vendor.username,
                        "service": vendor_service_key,
                        "message": message,
                        "proposed_price": _money(proposed),
                        "status": status,
                    }
                )

                if status == "accepted":
                    accepted_any = True
                    accepted_vendor_username = vendor.username

            if accepted_any and accepted_vendor_username:
                need["status"] = "filled"
                need["assigned_vendor"] = accepted_vendor_username

                # If an application is accepted, publish the "second event" as per the spec.
                if secondary_event_key_to_publish and not published_secondary:
                    self._transition_event(
                        secondary_event_key_to_publish,
                        actor=host_username,
                        to_state="published",
                        reason="Vendor accepted need application",
                    )
                    published_secondary = True

                # Ticket selling happens on the event with the accepted application.
                self._sell_tickets_and_maybe_go_live(event_key=event_key, category_slug=event_category_slug, actor=host_username)

    def _all_service_ids(self) -> list[str]:
        ids: list[str] = []
        for group in self.service_categories:
            if not isinstance(group, dict):
                continue
            for item in group.get("items") or []:
                if isinstance(item, dict) and isinstance(item.get("id"), str):
                    ids.append(item["id"])
        return ids or ["other"]

    def _sell_tickets_and_maybe_go_live(self, *, event_key: str, category_slug: str, actor: str) -> None:
        event = self._event_by_key(event_key)
        capacity = int(event.get("capacity") or 0)
        if capacity <= 0:
            return

        self._transition_event(event_key, actor=actor, to_state="published", reason="Needs created and vendors applied")

        sold = _pick_int(self.rng, 1, capacity)
        tier = self._tier_by_event(event_key)
        price = tier.get("price", "20.00")

        goers: list[User] = []
        for _ in range(sold):
            goer = self._create_user(role_hint="goer")
            self._ensure_profile(goer.username)
            goers.append(goer)

            self._ticket_counter += 1
            barcode = f"{self.filename_tag.upper()}TK{self._ticket_counter:03d}"

            self.tickets.append(
                {
                    "event": event_key,
                    "goer": goer.username,
                    "tier": tier["key"],
                    "ticket_type": tier.get("name", "General Admission"),
                    "color": tier.get("color", "#fde68a"),
                    "guest_name": goer.full_name,
                    "is_18_plus": True,
                    "barcode": barcode,
                    "is_refundable": True,
                    "refund_percentage": 100,
                    "price_paid": str(price),
                    "status": "active",
                }
            )

        if sold > max(0, int(0.2 * capacity)):
            self._transition_event(event_key, actor=actor, to_state="event_ready", reason="Ticket sales threshold reached")

            # Mark some tickets used
            used_n = _pick_int(self.rng, 1, sold)
            used_indexes = set(self.rng.sample(range(sold), k=used_n))
            for idx, t in enumerate([t for t in self.tickets if t.get("event") == event_key][-sold:]):
                if idx in used_indexes:
                    t["status"] = "used"

            go_live = bool(_pick_int(self.rng, 0, 1))
            if go_live:
                self._transition_event(event_key, actor=actor, to_state="live", reason="Event is happening now")

                max_half = max(1, capacity // 2)
                n_high = _pick_int(self.rng, 1, min(max_half, len(goers)))
                n_rev = _pick_int(self.rng, 1, min(max_half, len(goers)))

                for i, g in enumerate(goers[:n_high], start=1):
                    self._create_highlight(
                        event_key=event_key,
                        category_slug=category_slug,
                        author_username=g.username,
                        role="goer",
                        key=f"hl_{self.filename_tag}_{event_key.split('_')[-1]}_live_{i}",
                    )

                for i, g in enumerate(goers[:n_rev], start=1):
                    self._create_review(
                        event_key=event_key,
                        category_slug=category_slug,
                        reviewer_username=g.username,
                        key=f"rv_{self.filename_tag}_{event_key.split('_')[-1]}_{i}",
                    )

    def _create_highlight(
        self,
        *,
        event_key: str,
        category_slug: str,
        author_username: str,
        role: str,
        key: str,
    ) -> None:
        texts = self.highlight_texts.get(category_slug) or ["Great event!"]
        text = self.rng.choice(texts)
        self.event_highlights.append(
            {
                "key": key,
                "event": event_key,
                "author": author_username,
                "role": role,
                "text": text,
                "media_file": "https://placehold.co/1000x700/png",
                "moderation_status": "approved",
            }
        )

    def _create_review(
        self,
        *,
        event_key: str,
        category_slug: str,
        reviewer_username: str,
        key: str,
    ) -> None:
        pool = self._reviews_by_category.get(category_slug) or []
        if pool:
            r = self.rng.choice(pool)
            text = str(r.get("comment") or "Great event.")
            rating = int(r.get("rating") or 5)
        else:
            text = "Great event."
            rating = 5

        self.event_reviews.append(
            {
                "key": key,
                "event": event_key,
                "reviewer": reviewer_username,
                "rating": rating,
                "text": text,
                "is_public": True,
            }
        )


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Generate seed_minimal-style JSON from helper seed files.")
    p.add_argument(
        "--helpers-dir",
        type=str,
        default=str(HERE / "seed-helper-data"),
        help="Directory containing helper seed JSON files.",
    )
    p.add_argument(
        "--seed-minimal-template",
        type=str,
        default=str(HERE / "seed_minimal.json"),
        help="Path to seed_minimal.json (used only for filename tag defaults).",
    )
    p.add_argument(
        "--output",
        type=str,
        default=str(HERE / "seed_minimal_generated.json"),
        help="Output JSON path.",
    )
    p.add_argument("--rng-seed", type=int, default=1337, help="Random seed for reproducibility.")
    p.add_argument(
        "--filename-tag",
        type=str,
        default="seed_minimal_generated.json",
        help="Tag used in generated keys/barcodes/slugs (should look like a seed filename).",
    )
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)

    helpers_dir = Path(args.helpers_dir).resolve()
    out_path = Path(args.output).resolve()

    event_categories = _read_json(helpers_dir / "event_categories.json")
    service_categories = _read_json(helpers_dir / "service_categories.json")
    event_titles = _read_json(helpers_dir / "event_title_seed.json")
    application_seeds = _read_json(helpers_dir / "services_applications_seed.json")
    highlight_texts = _read_json(helpers_dir / "event_highlights_seed.json")
    reviews_seed = _read_json(helpers_dir / "event_reviews_seed.json")
    users_seed = _read_json(helpers_dir / "users_seed.json")

    if not isinstance(event_categories, list):
        raise ValueError("event_categories.json must be a JSON list")
    if not isinstance(service_categories, list):
        raise ValueError("service_categories.json must be a JSON list")
    if not isinstance(event_titles, list):
        raise ValueError("event_title_seed.json must be a JSON list")
    if not isinstance(application_seeds, list):
        raise ValueError("services_applications_seed.json must be a JSON list")
    if not isinstance(highlight_texts, dict):
        raise ValueError("event_highlights_seed.json must be a JSON object")
    if not isinstance(reviews_seed, list):
        raise ValueError("event_reviews_seed.json must be a JSON list")
    if not isinstance(users_seed, dict):
        raise ValueError("users_seed.json must be a JSON object with 'users' and 'profiles'")

    base_users = users_seed.get("users") or []
    base_profiles = users_seed.get("profiles") or []
    if not isinstance(base_users, list) or not isinstance(base_profiles, list):
        raise ValueError("users_seed.json must contain 'users' and 'profiles' lists")

    rng = random.Random(args.rng_seed)
    builder = SeedBuilder(
        rng=rng,
        filename_tag=_slugify(args.filename_tag).replace("-", "_"),
        base_users=base_users,
        base_profiles=base_profiles,
        event_categories=event_categories,
        service_categories=service_categories,
        event_titles=event_titles,
        application_seeds=application_seeds,
        highlight_texts=highlight_texts,
        reviews_seed=reviews_seed,
    )

    seed_json = builder.build()

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(seed_json, f, indent=2, ensure_ascii=False)
        f.write("\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

