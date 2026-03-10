from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

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

User = get_user_model()

DEFAULT_JSON_FILE = Path(__file__).with_name("seed_minimal.json")


def _choice_values(choices: list[tuple[str, str]]) -> set[str]:
    return {value for value, _ in choices}


@dataclass
class SeedContext:
    users: dict[str, Any] = field(default_factory=dict)
    categories: dict[str, EventCategory] = field(default_factory=dict)
    services: dict[str, VendorService] = field(default_factory=dict)
    series: dict[str, EventSeries] = field(default_factory=dict)
    events: dict[str, Event] = field(default_factory=dict)
    tiers: dict[str, EventTicketTier] = field(default_factory=dict)
    needs: dict[str, EventNeed] = field(default_factory=dict)
    applications: dict[str, NeedApplication] = field(default_factory=dict)
    reviews: dict[str, EventReview] = field(default_factory=dict)
    highlights: dict[str, EventHighlight] = field(default_factory=dict)
    requests: dict[str, EventRequest] = field(default_factory=dict)


class Command(BaseCommand):
    help = "JSON-driven seeding with strict relationship and constraint validation."

    def add_arguments(self, parser):
        parser.add_argument(
            "--data-file",
            type=str,
            default=str(DEFAULT_JSON_FILE),
            help="Path to seed JSON file.",
        )
        parser.add_argument(
            "--no-wipe",
            action="store_true",
            help="Do not wipe existing data before seeding.",
        )

    def _fail(self, message: str):
        raise CommandError(message)

    def _parse_decimal(self, value: Any, field_name: str) -> Decimal | None:
        if value is None or value == "":
            return None
        try:
            return Decimal(str(value))
        except Exception as exc:
            self._fail(f"Invalid decimal for '{field_name}': {value} ({exc})")

    def _parse_dt(self, value: str, field_name: str) -> datetime:
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except Exception as exc:
            self._fail(f"Invalid datetime for '{field_name}': {value} ({exc})")
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, timezone.get_current_timezone())
        return dt

    def _expect(self, payload: dict[str, Any], required: list[str], path: str):
        for key in required:
            if key not in payload:
                self._fail(f"Missing required key '{key}' at {path}")

    def _expect_choice(self, value: str, allowed: set[str], path: str):
        if value not in allowed:
            self._fail(
                f"Invalid value '{value}' at {path}. Allowed: {sorted(allowed)}"
            )

    def _resolve(self, mapping: dict[str, Any], key: str, path: str):
        obj = mapping.get(key)
        if obj is None:
            self._fail(f"Unknown reference '{key}' at {path}")
        return obj

    def _set_file_field(self, model_cls: Any, obj_id: int, field_name: str, value: str | None):
        if value:
            model_cls.objects.filter(pk=obj_id).update(**{field_name: value})

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

    def _load_json(self, path: Path) -> dict[str, Any]:
        if not path.exists():
            self._fail(f"Seed file not found: {path}")
        try:
            return json.loads(path.read_text())
        except json.JSONDecodeError as exc:
            self._fail(f"Invalid JSON in {path}: {exc}")

    def _seed_users(self, data: dict[str, Any], ctx: SeedContext):
        for index, row in enumerate(data.get("users", [])):
            path = f"users[{index}]"
            self._expect(row, ["username", "email", "password"], path)
            user, _ = User.objects.update_or_create(
                username=row["username"],
                defaults={
                    "email": row["email"],
                    "first_name": row.get("first_name", ""),
                    "last_name": row.get("last_name", ""),
                    "is_staff": bool(row.get("is_staff", False)),
                    "is_superuser": bool(row.get("is_superuser", False)),
                    "is_active": bool(row.get("is_active", True)),
                },
            )
            user.set_password(row["password"])
            user.save()
            ctx.users[user.username] = user

    def _seed_profiles(self, data: dict[str, Any], ctx: SeedContext):
        for index, row in enumerate(data.get("profiles", [])):
            path = f"profiles[{index}]"
            self._expect(row, ["user"], path)
            user = self._resolve(ctx.users, row["user"], f"{path}.user")
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.phone_number = row.get("phone_number", "")
            profile.bio = row.get("bio", "")
            profile.headline = row.get("headline", "")
            profile.showcase_bio = row.get("showcase_bio", "")
            profile.aadhar_number = row.get("aadhar_number", "")
            profile.privacy_name = bool(row.get("privacy_name", True))
            profile.privacy_email = bool(row.get("privacy_email", False))
            profile.privacy_hosted_events = bool(row.get("privacy_hosted_events", True))
            profile.privacy_serviced_events = bool(row.get("privacy_serviced_events", True))
            profile.privacy_events_attending = bool(row.get("privacy_events_attending", True))
            profile.privacy_events_attended = bool(row.get("privacy_events_attended", True))
            profile.allow_private_messages = bool(row.get("allow_private_messages", True))
            profile.location_city = row.get("location_city", "")
            profile.save()
            self._set_file_field(UserProfile, profile.pk, "avatar", row.get("avatar"))
            self._set_file_field(
                UserProfile, profile.pk, "cover_photo", row.get("cover_photo")
            )
            self._set_file_field(
                UserProfile, profile.pk, "aadhar_image", row.get("aadhar_image")
            )

    def _seed_categories(self, data: dict[str, Any], ctx: SeedContext):
        for index, row in enumerate(data.get("categories", [])):
            path = f"categories[{index}]"
            self._expect(row, ["slug", "name", "icon"], path)
            category, _ = EventCategory.objects.update_or_create(
                slug=row["slug"],
                defaults={"name": row["name"], "icon": row["icon"]},
            )
            ctx.categories[category.slug] = category

    def _seed_services(self, data: dict[str, Any], ctx: SeedContext):
        for index, row in enumerate(data.get("services", [])):
            path = f"services[{index}]"
            self._expect(row, ["key", "vendor", "title", "description", "category"], path)
            vendor = self._resolve(ctx.users, row["vendor"], f"{path}.vendor")
            service, _ = VendorService.objects.update_or_create(
                vendor=vendor,
                title=row["title"],
                defaults={
                    "description": row["description"],
                    "category": row["category"],
                    "visibility": row.get("visibility", "customer_facing"),
                    "base_price": self._parse_decimal(row.get("base_price"), f"{path}.base_price"),
                    "location_city": row.get("location_city", ""),
                    "is_active": bool(row.get("is_active", True)),
                },
            )
            self._set_file_field(
                VendorService, service.pk, "portfolio_image", row.get("portfolio_image")
            )
            ctx.services[row["key"]] = service

    def _seed_series(self, data: dict[str, Any], ctx: SeedContext):
        for index, row in enumerate(data.get("series", [])):
            path = f"series[{index}]"
            self._expect(row, ["key", "host", "name"], path)
            host = self._resolve(ctx.users, row["host"], f"{path}.host")
            series, _ = EventSeries.objects.update_or_create(
                host=host,
                name=row["name"],
                defaults={
                    "description": row.get("description", ""),
                    "recurrence_rule": row.get("recurrence_rule", ""),
                    "timezone": row.get("timezone", "UTC"),
                    "default_location_name": row.get("default_location_name", ""),
                    "default_location_address": row.get("default_location_address", ""),
                    "default_capacity": row.get("default_capacity"),
                    "default_ticket_price_standard": self._parse_decimal(
                        row.get("default_ticket_price_standard"),
                        f"{path}.default_ticket_price_standard",
                    ),
                    "default_ticket_price_flexible": self._parse_decimal(
                        row.get("default_ticket_price_flexible"),
                        f"{path}.default_ticket_price_flexible",
                    ),
                },
            )
            ctx.series[row["key"]] = series

    def _seed_series_need_templates(self, data: dict[str, Any], ctx: SeedContext):
        criticality_allowed = _choice_values(EventSeriesNeedTemplate.CRITICALITY_CHOICES)
        for index, row in enumerate(data.get("series_need_templates", [])):
            path = f"series_need_templates[{index}]"
            self._expect(row, ["series", "title"], path)
            series = self._resolve(ctx.series, row["series"], f"{path}.series")
            criticality = row.get("criticality", "replaceable")
            self._expect_choice(criticality, criticality_allowed, f"{path}.criticality")
            EventSeriesNeedTemplate.objects.update_or_create(
                series=series,
                title=row["title"],
                defaults={
                    "description": row.get("description", ""),
                    "category": row.get("category", "other"),
                    "criticality": criticality,
                    "budget_min": self._parse_decimal(row.get("budget_min"), f"{path}.budget_min"),
                    "budget_max": self._parse_decimal(row.get("budget_max"), f"{path}.budget_max"),
                },
            )

    def _seed_events(self, data: dict[str, Any], ctx: SeedContext):
        status_allowed = _choice_values(Event.STATUS_CHOICES)
        lifecycle_allowed = _choice_values(Event.LIFECYCLE_CHOICES)
        for index, row in enumerate(data.get("events", [])):
            path = f"events[{index}]"
            self._expect(
                row,
                [
                    "key",
                    "host",
                    "category",
                    "title",
                    "description",
                    "location_name",
                    "start_time",
                    "end_time",
                ],
                path,
            )
            host = self._resolve(ctx.users, row["host"], f"{path}.host")
            category = self._resolve(ctx.categories, row["category"], f"{path}.category")
            series = None
            if row.get("series"):
                series = self._resolve(ctx.series, row["series"], f"{path}.series")

            status = row.get("status", "draft")
            lifecycle_state = row.get("lifecycle_state", status)
            self._expect_choice(status, status_allowed, f"{path}.status")
            self._expect_choice(lifecycle_state, lifecycle_allowed, f"{path}.lifecycle_state")

            slug = row.get("slug") or row["key"].replace("_", "-")
            event, _ = Event.objects.update_or_create(
                slug=slug,
                defaults={
                    "host": host,
                    "title": row["title"],
                    "description": row["description"],
                    "category": category,
                    "series": series,
                    "occurrence_index": row.get("occurrence_index"),
                    "location_name": row["location_name"],
                    "location_address": row.get("location_address", ""),
                    "check_in_instructions": row.get("check_in_instructions", ""),
                    "event_ready_message": row.get("event_ready_message", ""),
                    "latitude": self._parse_decimal(row.get("latitude"), f"{path}.latitude"),
                    "longitude": self._parse_decimal(row.get("longitude"), f"{path}.longitude"),
                    "start_time": self._parse_dt(row["start_time"], f"{path}.start_time"),
                    "end_time": self._parse_dt(row["end_time"], f"{path}.end_time"),
                    "capacity": row.get("capacity"),
                    "ticket_price_standard": self._parse_decimal(
                        row.get("ticket_price_standard"), f"{path}.ticket_price_standard"
                    ),
                    "ticket_price_flexible": self._parse_decimal(
                        row.get("ticket_price_flexible"), f"{path}.ticket_price_flexible"
                    ),
                    "refund_window_hours": int(row.get("refund_window_hours", 24)),
                    "status": status,
                    "lifecycle_state": lifecycle_state,
                    "tags": row.get("tags", []),
                    "features": row.get("features", []),
                },
            )
            self._set_file_field(Event, event.pk, "cover_image", row.get("cover_image"))
            ctx.events[row["key"]] = event

    def _seed_lifecycle_transitions(self, data: dict[str, Any], ctx: SeedContext):
        lifecycle_allowed = _choice_values(Event.LIFECYCLE_CHOICES)
        for index, row in enumerate(data.get("event_lifecycle_transitions", [])):
            path = f"event_lifecycle_transitions[{index}]"
            self._expect(row, ["event", "from_state", "to_state"], path)
            event = self._resolve(ctx.events, row["event"], f"{path}.event")
            actor = None
            if row.get("actor"):
                actor = self._resolve(ctx.users, row["actor"], f"{path}.actor")
            self._expect_choice(row["from_state"], lifecycle_allowed, f"{path}.from_state")
            self._expect_choice(row["to_state"], lifecycle_allowed, f"{path}.to_state")
            EventLifecycleTransition.objects.get_or_create(
                event=event,
                actor=actor,
                from_state=row["from_state"],
                to_state=row["to_state"],
                reason=row.get("reason", ""),
                defaults={"metadata": row.get("metadata", {})},
            )

    def _seed_ticket_tiers(self, data: dict[str, Any], ctx: SeedContext):
        for index, row in enumerate(data.get("event_ticket_tiers", [])):
            path = f"event_ticket_tiers[{index}]"
            self._expect(row, ["key", "event", "name", "price"], path)
            event = self._resolve(ctx.events, row["event"], f"{path}.event")
            tier, _ = EventTicketTier.objects.update_or_create(
                event=event,
                name=row["name"],
                defaults={
                    "description": row.get("description", ""),
                    "admits": int(row.get("admits", 1)),
                    "color": row.get("color", "gray"),
                    "price": self._parse_decimal(row["price"], f"{path}.price") or Decimal("0"),
                    "capacity": row.get("capacity"),
                    "is_refundable": bool(row.get("is_refundable", False)),
                    "refund_percentage": int(row.get("refund_percentage", 100)),
                },
            )
            if tier.refund_percentage < 0 or tier.refund_percentage > 100:
                self._fail(f"refund_percentage must be 0..100 at {path}.refund_percentage")
            ctx.tiers[row["key"]] = tier

    def _seed_needs(self, data: dict[str, Any], ctx: SeedContext):
        status_allowed = _choice_values(EventNeed.STATUS_CHOICES)
        criticality_allowed = _choice_values(EventNeed.CRITICALITY_CHOICES)
        for index, row in enumerate(data.get("event_needs", [])):
            path = f"event_needs[{index}]"
            self._expect(row, ["key", "event", "title"], path)
            event = self._resolve(ctx.events, row["event"], f"{path}.event")
            status = row.get("status", "open")
            criticality = row.get("criticality", "replaceable")
            self._expect_choice(status, status_allowed, f"{path}.status")
            self._expect_choice(criticality, criticality_allowed, f"{path}.criticality")

            assigned_vendor = None
            if row.get("assigned_vendor"):
                assigned_vendor = self._resolve(
                    ctx.users, row["assigned_vendor"], f"{path}.assigned_vendor"
                )

            need, _ = EventNeed.objects.update_or_create(
                event=event,
                title=row["title"],
                defaults={
                    "description": row.get("description", ""),
                    "category": row.get("category", "other"),
                    "criticality": criticality,
                    "budget_min": self._parse_decimal(row.get("budget_min"), f"{path}.budget_min"),
                    "budget_max": self._parse_decimal(row.get("budget_max"), f"{path}.budget_max"),
                    "status": status,
                    "assigned_vendor": assigned_vendor,
                },
            )
            ctx.needs[row["key"]] = need

    def _seed_need_applications(self, data: dict[str, Any], ctx: SeedContext):
        status_allowed = _choice_values(NeedApplication.STATUS_CHOICES)
        for index, row in enumerate(data.get("need_applications", [])):
            path = f"need_applications[{index}]"
            self._expect(row, ["key", "need", "vendor"], path)
            need = self._resolve(ctx.needs, row["need"], f"{path}.need")
            vendor = self._resolve(ctx.users, row["vendor"], f"{path}.vendor")
            service = None
            if row.get("service"):
                service = self._resolve(ctx.services, row["service"], f"{path}.service")
            status = row.get("status", "pending")
            self._expect_choice(status, status_allowed, f"{path}.status")

            application, _ = NeedApplication.objects.update_or_create(
                need=need,
                vendor=vendor,
                defaults={
                    "service": service,
                    "message": row.get("message", ""),
                    "proposed_price": self._parse_decimal(
                        row.get("proposed_price"), f"{path}.proposed_price"
                    ),
                    "status": status,
                    "admitted_at": self._parse_dt(row["admitted_at"], f"{path}.admitted_at") if row.get("admitted_at") else None,
                    "admitted_by": self._resolve(ctx.users, row["admitted_by"], f"{path}.admitted_by") if row.get("admitted_by") else None,
                },
            )
            ctx.applications[row["key"]] = application

    def _seed_need_invites(self, data: dict[str, Any], ctx: SeedContext):
        status_allowed = _choice_values(NeedInvite.STATUS_CHOICES)
        for index, row in enumerate(data.get("need_invites", [])):
            path = f"need_invites[{index}]"
            self._expect(row, ["need", "vendor", "invited_by"], path)
            need = self._resolve(ctx.needs, row["need"], f"{path}.need")
            vendor = self._resolve(ctx.users, row["vendor"], f"{path}.vendor")
            invited_by = self._resolve(ctx.users, row["invited_by"], f"{path}.invited_by")
            status = row.get("status", "pending")
            self._expect_choice(status, status_allowed, f"{path}.status")

            NeedInvite.objects.update_or_create(
                need=need,
                vendor=vendor,
                defaults={
                    "invited_by": invited_by,
                    "message": row.get("message", ""),
                    "status": status,
                },
            )

    def _seed_tickets(self, data: dict[str, Any], ctx: SeedContext):
        status_allowed = _choice_values(Ticket.STATUS_CHOICES)
        for index, row in enumerate(data.get("tickets", [])):
            path = f"tickets[{index}]"
            self._expect(row, ["event", "goer"], path)
            event = self._resolve(ctx.events, row["event"], f"{path}.event")
            goer = self._resolve(ctx.users, row["goer"], f"{path}.goer")
            tier = None
            if row.get("tier"):
                tier = self._resolve(ctx.tiers, row["tier"], f"{path}.tier")
            status = row.get("status", "active")
            self._expect_choice(status, status_allowed, f"{path}.status")

            unique_filters: dict[str, Any]
            if row.get("barcode"):
                unique_filters = {"barcode": row["barcode"]}
            else:
                unique_filters = {
                    "event": event,
                    "goer": goer,
                    "tier": tier,
                    "guest_name": row.get("guest_name", ""),
                }

            ticket, _ = Ticket.objects.update_or_create(
                **unique_filters,
                defaults={
                    "event": event,
                    "goer": goer,
                    "tier": tier,
                    "ticket_type": row.get("ticket_type", tier.name if tier else "standard"),
                    "color": row.get("color", tier.color if tier else "gray"),
                    "guest_name": row.get("guest_name", ""),
                    "is_18_plus": bool(row.get("is_18_plus", True)),
                    "is_refundable": bool(row.get("is_refundable", False)),
                    "refund_percentage": int(row.get("refund_percentage", 100)),
                    "price_paid": self._parse_decimal(row.get("price_paid"), f"{path}.price_paid")
                    or (tier.price if tier else Decimal("0")),
                    "status": status,
                    "used_at": self._parse_dt(row["used_at"], f"{path}.used_at") if row.get("used_at") else None,
                    "admitted_by": self._resolve(ctx.users, row["admitted_by"], f"{path}.admitted_by") if row.get("admitted_by") else None,
                },
            )
            if row.get("refund_deadline"):
                ticket.refund_deadline = self._parse_dt(
                    row["refund_deadline"], f"{path}.refund_deadline"
                )
                ticket.save(update_fields=["refund_deadline", "updated_at"])

    def _seed_event_media(self, data: dict[str, Any], ctx: SeedContext):
        media_type_allowed = _choice_values(EventMedia.MEDIA_TYPE_CHOICES)
        category_allowed = _choice_values(EventMedia.CATEGORY_CHOICES)
        for index, row in enumerate(data.get("event_media", [])):
            path = f"event_media[{index}]"
            self._expect(row, ["event", "file"], path)
            event = self._resolve(ctx.events, row["event"], f"{path}.event")
            media_type = row.get("media_type", "image")
            category = row.get("category", "gallery")
            self._expect_choice(media_type, media_type_allowed, f"{path}.media_type")
            self._expect_choice(category, category_allowed, f"{path}.category")
            order = int(row.get("order", 0))
            media, _ = EventMedia.objects.get_or_create(
                event=event,
                media_type=media_type,
                category=category,
                order=order,
            )
            self._set_file_field(EventMedia, media.pk, "file", row.get("file"))

    def _seed_event_highlights(self, data: dict[str, Any], ctx: SeedContext):
        role_allowed = _choice_values(EventHighlight.ROLE_CHOICES)
        moderation_allowed = _choice_values(EventHighlight.MODERATION_CHOICES)
        for index, row in enumerate(data.get("event_highlights", [])):
            path = f"event_highlights[{index}]"
            self._expect(row, ["event", "author"], path)
            event = self._resolve(ctx.events, row["event"], f"{path}.event")
            author = self._resolve(ctx.users, row["author"], f"{path}.author")
            role = row.get("role", "goer")
            moderation = row.get("moderation_status", "approved")
            self._expect_choice(role, role_allowed, f"{path}.role")
            self._expect_choice(moderation, moderation_allowed, f"{path}.moderation_status")
            highlight = EventHighlight.objects.create(
                event=event,
                author=author,
                role=role,
                text=row.get("text", ""),
                moderation_status=moderation,
            )
            self._set_file_field(
                EventHighlight, highlight.pk, "media_file", row.get("media_file")
            )
            if row.get("key"):
                ctx.highlights[row["key"]] = highlight

    def _seed_event_highlight_likes(self, data: dict[str, Any], ctx: SeedContext):
        for index, row in enumerate(data.get("event_highlight_likes", [])):
            path = f"event_highlight_likes[{index}]"
            self._expect(row, ["highlight", "user"], path)
            highlight = self._resolve(ctx.highlights, row["highlight"], f"{path}.highlight")
            user = self._resolve(ctx.users, row["user"], f"{path}.user")
            EventHighlightLike.objects.get_or_create(highlight=highlight, user=user)

    def _seed_event_highlight_comments(self, data: dict[str, Any], ctx: SeedContext):
        keyed_comments: dict[str, EventHighlightComment] = {}
        for index, row in enumerate(data.get("event_highlight_comments", [])):
            path = f"event_highlight_comments[{index}]"
            self._expect(row, ["highlight", "author", "text"], path)
            highlight = self._resolve(ctx.highlights, row["highlight"], f"{path}.highlight")
            author = self._resolve(ctx.users, row["author"], f"{path}.author")
            parent = None
            if row.get("parent"):
                parent = self._resolve(keyed_comments, row["parent"], f"{path}.parent")
            comment = EventHighlightComment.objects.create(
                highlight=highlight,
                author=author,
                parent=parent,
                text=row["text"],
            )
            if row.get("key"):
                keyed_comments[row["key"]] = comment

    def _seed_event_reviews(self, data: dict[str, Any], ctx: SeedContext):
        for index, row in enumerate(data.get("event_reviews", [])):
            path = f"event_reviews[{index}]"
            self._expect(row, ["key", "event", "reviewer", "rating"], path)
            event = self._resolve(ctx.events, row["event"], f"{path}.event")
            reviewer = self._resolve(ctx.users, row["reviewer"], f"{path}.reviewer")
            rating = int(row["rating"])
            if rating < 1 or rating > 5:
                self._fail(f"rating must be 1..5 at {path}.rating")
            review, _ = EventReview.objects.update_or_create(
                event=event,
                reviewer=reviewer,
                defaults={
                    "rating": rating,
                    "text": row.get("text", ""),
                    "is_public": bool(row.get("is_public", True)),
                },
            )
            ctx.reviews[row["key"]] = review

    def _seed_event_review_media(self, data: dict[str, Any], ctx: SeedContext):
        for index, row in enumerate(data.get("event_review_media", [])):
            path = f"event_review_media[{index}]"
            self._expect(row, ["review", "file"], path)
            review = self._resolve(ctx.reviews, row["review"], f"{path}.review")
            media, _ = EventReviewMedia.objects.get_or_create(review=review)
            self._set_file_field(EventReviewMedia, media.pk, "file", row.get("file"))

    def _seed_event_vendor_reviews(self, data: dict[str, Any], ctx: SeedContext):
        for index, row in enumerate(data.get("event_vendor_reviews", [])):
            path = f"event_vendor_reviews[{index}]"
            self._expect(row, ["event_review", "vendor_service", "rating"], path)
            event_review = self._resolve(ctx.reviews, row["event_review"], f"{path}.event_review")
            vendor_service = self._resolve(
                ctx.services, row["vendor_service"], f"{path}.vendor_service"
            )
            rating = int(row["rating"])
            if rating < 1 or rating > 5:
                self._fail(f"rating must be 1..5 at {path}.rating")
            EventVendorReview.objects.update_or_create(
                event_review=event_review,
                vendor=vendor_service,
                defaults={"rating": rating, "text": row.get("text", "")},
            )

    def _seed_vendor_reviews(self, data: dict[str, Any], ctx: SeedContext):
        for index, row in enumerate(data.get("vendor_reviews", [])):
            path = f"vendor_reviews[{index}]"
            self._expect(row, ["vendor_service", "reviewer", "rating"], path)
            vendor_service = self._resolve(
                ctx.services, row["vendor_service"], f"{path}.vendor_service"
            )
            reviewer = self._resolve(ctx.users, row["reviewer"], f"{path}.reviewer")
            event = None
            if row.get("event"):
                event = self._resolve(ctx.events, row["event"], f"{path}.event")
            rating = int(row["rating"])
            if rating < 1 or rating > 5:
                self._fail(f"rating must be 1..5 at {path}.rating")
            VendorReview.objects.get_or_create(
                vendor_service=vendor_service,
                reviewer=reviewer,
                event=event,
                rating=rating,
                text=row.get("text", ""),
            )

    def _seed_event_review_likes(self, data: dict[str, Any], ctx: SeedContext):
        for index, row in enumerate(data.get("event_review_likes", [])):
            path = f"event_review_likes[{index}]"
            self._expect(row, ["review", "user"], path)
            review = self._resolve(ctx.reviews, row["review"], f"{path}.review")
            user = self._resolve(ctx.users, row["user"], f"{path}.user")
            EventReviewLike.objects.get_or_create(review=review, user=user)

    def _seed_event_review_comments(self, data: dict[str, Any], ctx: SeedContext):
        keyed_comments: dict[str, EventReviewComment] = {}
        for index, row in enumerate(data.get("event_review_comments", [])):
            path = f"event_review_comments[{index}]"
            self._expect(row, ["review", "author", "text"], path)
            review = self._resolve(ctx.reviews, row["review"], f"{path}.review")
            author = self._resolve(ctx.users, row["author"], f"{path}.author")
            parent = None
            if row.get("parent"):
                parent = self._resolve(keyed_comments, row["parent"], f"{path}.parent")
            comment = EventReviewComment.objects.create(
                review=review,
                author=author,
                parent=parent,
                text=row["text"],
            )
            if row.get("key"):
                keyed_comments[row["key"]] = comment

    def _seed_interests_views(self, data: dict[str, Any], ctx: SeedContext):
        for index, row in enumerate(data.get("event_interests", [])):
            path = f"event_interests[{index}]"
            self._expect(row, ["event", "user"], path)
            event = self._resolve(ctx.events, row["event"], f"{path}.event")
            user = self._resolve(ctx.users, row["user"], f"{path}.user")
            EventInterest.objects.get_or_create(event=event, user=user)

        for index, row in enumerate(data.get("event_views", [])):
            path = f"event_views[{index}]"
            self._expect(row, ["event", "user"], path)
            event = self._resolve(ctx.events, row["event"], f"{path}.event")
            user = self._resolve(ctx.users, row["user"], f"{path}.user")
            EventView.objects.get_or_create(event=event, user=user)

    def _seed_requests(self, data: dict[str, Any], ctx: SeedContext):
        status_allowed = _choice_values(EventRequest.STATUS_CHOICES)
        for index, row in enumerate(data.get("event_requests", [])):
            path = f"event_requests[{index}]"
            self._expect(row, ["key", "requester", "title", "description"], path)
            requester = self._resolve(ctx.users, row["requester"], f"{path}.requester")
            category = None
            if row.get("category"):
                category = self._resolve(ctx.categories, row["category"], f"{path}.category")
            fulfilled_event = None
            if row.get("fulfilled_event"):
                fulfilled_event = self._resolve(
                    ctx.events, row["fulfilled_event"], f"{path}.fulfilled_event"
                )
            status = row.get("status", "open")
            self._expect_choice(status, status_allowed, f"{path}.status")

            req, _ = EventRequest.objects.update_or_create(
                requester=requester,
                title=row["title"],
                defaults={
                    "description": row["description"],
                    "category": category,
                    "location_city": row.get("location_city", ""),
                    "status": status,
                    "fulfilled_event": fulfilled_event,
                },
            )
            ctx.requests[row["key"]] = req

        wishlist_allowed = _choice_values(RequestWishlist.WISHLIST_AS_CHOICES)

        for index, row in enumerate(data.get("request_upvotes", [])):
            path = f"request_upvotes[{index}]"
            self._expect(row, ["request", "user"], path)
            request = self._resolve(ctx.requests, row["request"], f"{path}.request")
            user = self._resolve(ctx.users, row["user"], f"{path}.user")
            RequestUpvote.objects.get_or_create(request=request, user=user)

        for index, row in enumerate(data.get("request_wishlists", [])):
            path = f"request_wishlists[{index}]"
            self._expect(row, ["request", "user", "wishlist_as"], path)
            request = self._resolve(ctx.requests, row["request"], f"{path}.request")
            user = self._resolve(ctx.users, row["user"], f"{path}.user")
            wishlist_as = row["wishlist_as"]
            self._expect_choice(wishlist_as, wishlist_allowed, f"{path}.wishlist_as")
            RequestWishlist.objects.update_or_create(
                request=request,
                user=user,
                defaults={"wishlist_as": wishlist_as},
            )

    def _sync_counters(self, ctx: SeedContext):
        for event in ctx.events.values():
            event.interest_count = EventInterest.objects.filter(event=event).count()
            event.ticket_count = Ticket.objects.filter(event=event).count()
            event.save(update_fields=["interest_count", "ticket_count", "updated_at"])

        for need in ctx.needs.values():
            need.application_count = NeedApplication.objects.filter(need=need).count()
            need.save(update_fields=["application_count"])

        for req in ctx.requests.values():
            req.upvote_count = RequestUpvote.objects.filter(request=req).count()
            req.save(update_fields=["upvote_count"])

    @transaction.atomic
    def handle(self, *args, **options):
        data_file = Path(options["data_file"]).expanduser().resolve()
        payload = self._load_json(data_file)

        if not options["no_wipe"]:
            self.wipe_data()

        ctx = SeedContext()

        self.stdout.write(f"Seeding from {data_file} ...")

        self._seed_users(payload, ctx)
        self._seed_profiles(payload, ctx)
        self._seed_categories(payload, ctx)
        self._seed_services(payload, ctx)
        self._seed_series(payload, ctx)
        self._seed_series_need_templates(payload, ctx)
        self._seed_events(payload, ctx)
        self._seed_lifecycle_transitions(payload, ctx)
        self._seed_ticket_tiers(payload, ctx)
        self._seed_needs(payload, ctx)
        self._seed_need_applications(payload, ctx)
        self._seed_need_invites(payload, ctx)
        self._seed_tickets(payload, ctx)
        self._seed_event_media(payload, ctx)
        self._seed_event_highlights(payload, ctx)
        self._seed_event_highlight_likes(payload, ctx)
        self._seed_event_highlight_comments(payload, ctx)
        self._seed_event_reviews(payload, ctx)
        self._seed_event_review_media(payload, ctx)
        self._seed_event_vendor_reviews(payload, ctx)
        self._seed_vendor_reviews(payload, ctx)
        self._seed_event_review_likes(payload, ctx)
        self._seed_event_review_comments(payload, ctx)
        self._seed_interests_views(payload, ctx)
        self._seed_requests(payload, ctx)
        self._sync_counters(ctx)

        self.stdout.write(self.style.SUCCESS("Database seeded successfully from JSON."))
