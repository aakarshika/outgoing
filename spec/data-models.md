---
title: Data Models
status: living
last-updated: 2026-05-16
---

# Data Models

Every model by app: key fields, relationships, enums (exact values), constraints. Source of truth is `apps/<app>/models.py`; this mirrors it. Frontend TS mirrors live in `frontend/src/types/` (and `features/auth/api.ts` for `User`).

## TL;DR

- **No custom user model** — stock `auth.User`; profile is `profiles.UserProfile` (O2O).
- `apps.events` is the heavyweight (21 models): events, series, tiers, media, interest, lifecycle audit, reviews/highlights + likes/comments, friendships, **two legacy messaging models**, addons.
- Enum values below are exact `choices` values. Legacy fields are marked.
- `apps.content_generator` has **no models** (empty stub). `core` has no models.

## Conventions

User FKs point at `settings.AUTH_USER_MODEL` (stock User). `created_at` = `auto_now_add`, `updated_at` = `auto_now` where present. Slugs/barcodes/qr_secrets are auto-generated in `save()`.

## apps.profiles

**UserProfile** — `user` O2O→User (`related_name="profile"`); `phone_number`, `bio`, `headline`, `showcase_bio`; `avatar`/`cover_photo`/`aadhar_image` (ImageField, validated); `aadhar_number`, `location_city`; privacy booleans: `privacy_name`(T), `privacy_email`(F), `privacy_hosted_events`(T), `privacy_serviced_events`(T), `privacy_events_attending`(T), `privacy_events_attended`(T), `allow_private_messages`(T).

## apps.events

- **EventCategory** — `name`, `slug` (unique), `icon` (Lucide name).
- **EventSeries** — `host`→User; `name`, `description`, `recurrence_rule`, `timezone`(UTC), `default_location_*`, `default_capacity`, `default_ticket_price_standard/flexible` (**legacy**).
- **EventSeriesNeedTemplate** — `series`→EventSeries; `title`, `description`, `category`("other"), `criticality` ∈ `essential|replaceable|non_substitutable` (default `replaceable`), `budget_min/max`.
- **Event** — `host`→User; `title`, `slug`(unique, auto), `description`; `category`→EventCategory (SET_NULL); `series`→EventSeries; `occurrence_index`; `location_name/address`, `check_in_instructions`, `event_ready_message`, `latitude/longitude`; `start_time`, `end_time`; `capacity`; `ticket_price_standard/flexible` (**legacy**, superseded by tiers); `refund_window_hours`(24); `cover_image`; `tags` (JSON list); `features` (JSON list of `{name,tag}`); `interest_count`, `ticket_count`.
  - `status` (**legacy coarse**) ∈ `draft|published|cancelled|completed`.
  - `lifecycle_state` ∈ `draft|published|at_risk|postponed|event_ready|live|cancelled|completed`. `ALLOWED_LIFECYCLE_TRANSITIONS` and `VISIBLE_LIFECYCLE_STATES` are declared **but transitions are not enforced** ([domain.md](domain.md#event-lifecycle)).
- **EventTicketTier** — `event`→Event; `name`, `description`, `admits`(1), `color`("gray"), `price`(0), `capacity`(null=unlimited), `max_passes_per_ticket`(6), `is_refundable`(F), `refund_percentage`(100).
- **EventMedia** — `event`; `media_type` ∈ `image|video`; `category` ∈ `gallery|highlight`; `file`, `order`.
- **EventInterest** — `event`+`user`; `unique_together(event,user)`.
- **EventLifecycleTransition** — `event`; `actor`→User (SET_NULL); `from_state`/`to_state`; `reason`; `metadata` (JSON). Immutable audit log.
- **EventHighlight** — `event`; `author`→User; `role` ∈ `host|goer` (default goer); `text`; `media_file`; `moderation_status` ∈ `pending|approved|rejected` (**default `approved`** — moderation effectively off).
- **EventReview** — `event`+`reviewer`; `rating` 1–5; `text`; `is_public`(T); `unique_together(event,reviewer)`.
- **EventReviewMedia** — `review`→EventReview; `file`.
- **EventVendorReview** — `event_review`→EventReview; `vendor`→`vendors.VendorService`; `rating` 1–5; `unique_together(event_review,vendor)`.
- **EventView** — `event`+`user`; `last_viewed_at` (auto_now); `unique_together` (upsert "recently viewed").
- **EventHighlightLike** — `highlight`+`user`, unique.
- **EventHighlightComment** — `highlight`, `author`, `parent` self-FK (threaded), `text`.
- **EventReviewLike** — `review`+`user`, unique.
- **EventReviewComment** — `review`, `author`, `parent` self-FK, `text`.
- **EventHostVendorMessage** (**legacy chat**) — `event`, `sender`, `text`.
- **EventPrivateConversation** (**legacy chat**) — optional `event`; `participant1`/`participant2`→User (normalized order); `UniqueConstraint(participant1,participant2)`.
- **EventPrivateMessage** (**legacy chat**) — `conversation`, `sender`, `text`, `is_read`(F).
- **Friendship** — `user1`/`user2`/`request_sender`→User; `request_message`; `status` ∈ `pending|accepted|declined|cancelled` (default pending); `accepted_at`; `met_at_event`→Event (SET_NULL); `orbit_category`→EventCategory (PROTECT). `save()` normalizes user order and derives `orbit_category` from `met_at_event.category`. Constraints: `unique_friendship_pair(user1,user2,orbit_category)`, check `friendship_users_must_differ`.
- **EventAddon** — `event`; `addon_slug`; `description`; `unique_together(event,addon_slug)`.

## apps.tickets

**Ticket** — `event`; `goer`→User; `tier`→`events.EventTicketTier` (SET_NULL); `ticket_type` (default "standard"; `TICKET_TYPE_CHOICES` ∈ `standard|flexible` is defined but the field has **no `choices=`** — unenforced); `color`; `guest_name`; `is_18_plus`; `barcode` (unique, auto 12-char); `qr_secret` (auto); `is_refundable`; `refund_percentage`(100); `refund_deadline`; `price_paid`; `status` ∈ `active|used|cancelled|refunded` (default active); `used_at`; `admitted_by`→User (SET_NULL); `purchased_at`, `updated_at`. Purchase/admit/QR logic in `apps/tickets/services.py`.

## apps.vendors

- **VendorService** — `vendor`→User; `title`, `description`, `category` (free text); `visibility` ∈ `customer_facing|operational` (default customer_facing); `base_price`; `portfolio_image`; `location_city`; `is_active`(T).
- **VendorReview** — `vendor_service`→VendorService; `reviewer`→User; `event`→`events.Event` (SET_NULL — field added cross-app via `apps/events/migration_operations.py::AddFieldVendors` to break the events↔vendors cycle); `rating` 1–5; `text`; `is_public`(T).

## apps.needs

- **EventNeed** — `event`; `title`, `description`, `category`("other"); `criticality` ∈ `essential|replaceable|non_substitutable` (default replaceable); `budget_min/max`; `status` ∈ `open|filled|cancelled|override_filled` (default open); `assigned_vendor`→User (SET_NULL); `application_count`.
- **NeedApplication** — `need`; `vendor`→User; `service`→VendorService (SET_NULL); `message`; `proposed_price`; `status` ∈ `pending|accepted|rejected|withdrawn` (default pending); `barcode`/`qr_secret` auto-generated **only when `status=="accepted"`**; `admitted_at`, `admitted_by`→User; `unique_together(need,vendor)`.
- **NeedInvite** — `need`; `vendor`→User; `invited_by`→User; `message`; `status` ∈ `pending|applied|dismissed` (default pending); `unique_together(need,vendor)`.

## apps.requests

- **EventRequest** — `requester`→User; `title`, `description`; `category`→EventCategory (SET_NULL); `location_city`; `upvote_count`; `fulfilled_event`→`events.Event` (SET_NULL); `status` ∈ `open|fulfilled|closed` (default open); ordered by `-upvote_count, -created_at`.
- **RequestUpvote** — `request`+`user`, `unique_together`.
- **RequestWishlist** — `request`+`user`; `wishlist_as` ∈ `goer|host|vendor`; `unique_together(request,user)`.

## apps.chat (custom `db_table` names)

- **ChatSpecialGroup** (`chat_special_group`) — `name`, `created_by`→User.
- **ChatSpecialGroupMember** (`chat_special_group_member`) — `group`+`user`, unique `chat_special_group_member_group_user_uniq`.
- **ChatMessage** (`chat_message`) — `sender`→User; exactly one of `recipient_user`→User / `recipient_event_public_chat_event`→Event / `recipient_event_vendor_group_event`→Event / `recipient_special_group`→ChatSpecialGroup; `body`; `thread_key` (CharField 256, index `(thread_key,-created_at)`). Check constraint `chat_message_single_recipient_shape` enforces exactly-one-recipient. `thread_key` parsing in `apps/chat/thread_key.py`.

## apps.content_generator

No models — empty installed stub. (OpenAI usage is `core/ai.py`, used elsewhere; the app itself is unused.)

## Text ER overview

```
User 1—1 UserProfile
User 1—* Event(host) ; Event *—1 EventCategory ; Event *—1 EventSeries(opt)
Event 1—* EventTicketTier ; EventTicketTier 1—* Ticket *—1 User(goer)
Event 1—* EventNeed 1—* NeedApplication *—1 User(vendor) ; NeedApplication *—1 VendorService
Event 1—* EventNeed 1—* NeedInvite
User 1—* VendorService 1—* VendorReview ; VendorReview *—1 Event(opt)
Event 1—* EventInterest/EventView/EventHighlight/EventReview (each unique per user)
EventReview 1—* EventVendorReview *—1 VendorService
Friendship *—* User (pair) , scoped by orbit_category→EventCategory , met_at_event→Event
EventRequest *—1 User(requester) , →EventCategory , 1—* RequestUpvote/RequestWishlist , →fulfilled_event
ChatMessage *—1 User(sender) , →(one of) User|Event(public)|Event(vendor)|ChatSpecialGroup
```

Legacy/duplicate to be aware of: `Event.ticket_price_*` & `EventSeries.default_ticket_price_*` (superseded by `EventTicketTier`); `Ticket.ticket_type` (no `choices=`); the three `EventHostVendorMessage`/`EventPrivateConversation`/`EventPrivateMessage` models duplicate what `apps.chat` does — new chat work goes in `apps.chat` ([conventions.md](conventions.md)).
