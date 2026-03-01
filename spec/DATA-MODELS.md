# Data Models [DRAFT]

## Existing Models

### User (Django built-in `auth.User`)

Standard Django user model. Extended via a one-to-one `UserProfile`.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | int (PK) | Auto |
| username | varchar(150) | Unique |
| email | varchar(254) | |
| first_name | varchar(150) | |
| last_name | varchar(150) | |
| password | varchar(128) | Hashed |
| is_active | boolean | Default `True` |
| is_staff | boolean | Default `False` |
| date_joined | datetime | Auto |

### UserProfile (`apps.profiles`) — Enhanced

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | int (PK) | Auto |
| user | OneToOne → User | Cascade delete |
| phone_number | varchar | Existing |
| bio | text | Existing |
| headline | varchar(200) | **New** — short tagline shown on showcase |
| showcase_bio | text | **New** — longer rich-text bio for showcase page |
| avatar | ImageField | **New** — profile photo. Upload to `avatars/`. |
| cover_photo | ImageField | **New** — showcase page banner. Upload to `covers/`. |
| is_vendor | boolean | **New** — opted into vendor features. Default `False` |
| location_city | varchar(100) | **New** — user's city for discovery |
| created_at | datetime | Auto |
| updated_at | datetime | Auto |

---

## New Models

### Event (`apps.events`)

The core entity. Represents something happening at a place and time.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | int (PK) | Auto |
| host | FK → User | The user who created the event |
| series | FK → EventSeries | Nullable. If set, this event is an occurrence in a recurring series. |
| occurrence_index | int | Nullable. 1-based sequence inside a series (1,2,3...). |
| title | varchar(200) | |
| slug | SlugField | Auto-generated from title, unique |
| description | text | |
| category | FK → EventCategory | |
| location_name | varchar(200) | e.g. "The Blue Note" |
| location_address | varchar(300) | Full street address |
| latitude | DecimalField(9,6) | Nullable |
| longitude | DecimalField(9,6) | Nullable |
| start_time | datetime | |
| end_time | datetime | |
| capacity | int | Nullable (unlimited if null) |
| ticket_price_standard | Decimal(10,2) | Nullable (null = free event). Non-refundable price. |
| ticket_price_flexible | Decimal(10,2) | Nullable. Refundable price (typically a premium over standard). |
| refund_window_hours | int | Default 24. Hours before `start_time` that flexible tickets can be refunded. |
| cover_image | ImageField | Upload to `events/`. |
| status | varchar(20) | `draft` / `published` / `cancelled` / `completed` |
| tags | JSONField | Array of strings |
| interest_count | int | Default 0. Denormalized count of EventInterest records. |
| ticket_count | int | Default 0. Denormalized count of active Ticket records. |
| created_at | datetime | Auto |
| updated_at | datetime | Auto |

### EventSeries (`apps.events`)

Template-level recurring container. Holds recurring identity and defaults, not transactional participation.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | int (PK) | Auto |
| host | FK → User | Series owner |
| title | varchar(200) | Series name (e.g. "Sunday Pottery Basics") |
| slug | SlugField | Unique |
| description | text | Long-form series narrative |
| category | FK → EventCategory | Default category |
| recurrence_rule | varchar(255) | Human-safe recurrence expression / RRULE string |
| timezone | varchar(64) | e.g. `America/New_York` |
| default_location_name | varchar(200) | Nullable |
| default_location_address | varchar(300) | Nullable |
| default_capacity | int | Nullable |
| default_ticket_price_standard | Decimal(10,2) | Nullable |
| default_ticket_price_flexible | Decimal(10,2) | Nullable |
| is_active | boolean | Default `True` |
| created_at | datetime | Auto |
| updated_at | datetime | Auto |

### EventCategory (`apps.events`)

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | int (PK) | Auto |
| name | varchar(100) | |
| slug | SlugField | Unique |
| icon | varchar(50) | Lucide icon name for frontend |

**Seed data** (loaded via data migration or management command):

| Name | Slug | Icon (Lucide) |
| :--- | :--- | :--- |
| Music | `music` | `music` |
| Food & Drink | `food-drink` | `utensils` |
| Nightlife | `nightlife` | `moon` |
| Sports & Fitness | `sports-fitness` | `dumbbell` |
| Arts & Culture | `arts-culture` | `palette` |
| Tech & Innovation | `tech-innovation` | `cpu` |
| Workshops & Classes | `workshops-classes` | `book-open` |
| Outdoors & Adventure | `outdoors-adventure` | `mountain` |
| Comedy | `comedy` | `laugh` |
| Networking & Social | `networking-social` | `users` |
| Festivals | `festivals` | `party-popper` |
| Community | `community` | `heart-handshake` |

### EventNeed (`apps.needs`)

Something a host needs for their event. Vendors can apply to fulfill it.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | int (PK) | Auto |
| event | FK → Event | Cascade delete |
| title | varchar(200) | e.g. "DJ for Saturday night" |
| description | text | |
| category | varchar(100) | e.g. "DJ", "Catering", "Photography", "Decor" |
| budget_min | Decimal(10,2) | Nullable |
| budget_max | Decimal(10,2) | Nullable |
| status | varchar(20) | `open` / `fulfilled` / `closed` |
| created_at | datetime | Auto |

### EventSeriesNeedTemplate (`apps.needs`)

Reusable needs template for recurring series. Cloned into each occurrence as draft needs.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | int (PK) | Auto |
| series | FK → EventSeries | Cascade delete |
| title | varchar(200) | |
| description | text | |
| category | varchar(100) | |
| budget_min | Decimal(10,2) | Nullable |
| budget_max | Decimal(10,2) | Nullable |
| is_active | boolean | Default `True` |
| created_at | datetime | Auto |

### NeedApplication (`apps.needs`)

A vendor's pitch to fulfill an event need.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | int (PK) | Auto |
| need | FK → EventNeed | Cascade delete |
| vendor | FK → User | The vendor applying |
| vendor_service | FK → VendorService | Nullable — optionally link to a listed service |
| message | text | Cover letter / pitch |
| price_quote | Decimal(10,2) | |
| status | varchar(20) | `pending` / `accepted` / `rejected` |
| created_at | datetime | Auto |

### VendorService (`apps.vendors`)

A service or product a vendor offers, visible on their showcase and in browse.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | int (PK) | Auto |
| vendor | FK → User | |
| title | varchar(200) | e.g. "Wedding Photography Package" |
| description | text | |
| category | varchar(100) | e.g. "Photography", "Catering", "Music" |
| price_min | Decimal(10,2) | Nullable |
| price_max | Decimal(10,2) | Nullable |
| portfolio_images | JSONField | Array of image paths (uploaded to `portfolios/`). Managed via separate upload endpoint. |
| is_active | boolean | Default `True` |
| created_at | datetime | Auto |
| updated_at | datetime | Auto |

### Ticket (`apps.tickets`)

Represents a goer's attendance at an event.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | int (PK) | Auto |
| event | FK → Event | |
| goer | FK → User | The user attending |
| ticket_type | varchar(20) | `standard` (non-refundable) or `flexible` (refundable) |
| is_refundable | boolean | Derived from ticket_type. `True` for flexible, `False` for standard. |
| refund_deadline | datetime | Nullable. For flexible tickets: `event.start_time - event.refund_window_hours`. |
| price_paid | Decimal(10,2) | 0.00 for free events |
| status | varchar(20) | `active` / `used` / `cancelled` / `refunded` |
| purchased_at | datetime | Auto |

**Constraints**: unique_together on (event, goer) — one ticket per user per event.

### EventInterest (`apps.events`)

A lightweight "I'm interested" signal. Not a commitment — a social bookmark that drives social proof and demand signals.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | int (PK) | Auto |
| event | FK → Event | Cascade delete |
| user | FK → User | |
| created_at | datetime | Auto |

**Constraints**: unique_together on (event, user) — one interest per user per event.

### EventRequest (`apps.requests`)

The demand side: "I wish this event existed." Other users can upvote, hosts can fulfill.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | int (PK) | Auto |
| requester | FK → User | |
| title | varchar(200) | e.g. "Outdoor jazz night in Brooklyn" |
| description | text | |
| desired_date_start | date | Nullable |
| desired_date_end | date | Nullable |
| desired_location | varchar(200) | Nullable, free text |
| category | FK → EventCategory | Nullable |
| upvote_count | int | Denormalized counter, default 0 |
| status | varchar(20) | `open` / `picked_up` / `fulfilled` / `closed` |
| fulfilled_by | FK → Event | Nullable — links to the event that fulfills this request |
| created_at | datetime | Auto |

### RequestUpvote (`apps.requests`)

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | int (PK) | Auto |
| request | FK → EventRequest | Cascade delete |
| user | FK → User | |
| created_at | datetime | Auto |

**Constraints**: unique_together on (request, user) — one upvote per user per request.

---

## Co-Host Pattern

When an event has multiple hosts (e.g. a collaboration between two DJs co-hosting a night), the primary host is the `Event.host` field. Additional co-hosts are represented as **vendors with zero fee** — they apply to (or are assigned to) an EventNeed with `budget_min: 0` and `budget_max: 0`, offering their service/presence as the contribution.

This avoids a separate co-host model while reusing the vendor assignment infrastructure. Co-hosts appear in the vendor lineup as customer-facing vendors, which is correct — attendees see them as part of the event's identity.

---

## Entity Relationships

```
User ──1:1──▶ UserProfile
User ──1:N──▶ Event (as host)
User ──1:N──▶ EventSeries (as host)
User ──1:N──▶ VendorService (as vendor)
User ──1:N──▶ Ticket (as goer)
User ──1:N──▶ EventRequest (as requester)
User ──1:N──▶ NeedApplication (as vendor)
User ──1:N──▶ RequestUpvote
User ──1:N──▶ EventInterest

Event ──N:1──▶ EventCategory
Event ──N:1──▶ EventSeries (optional)
Event ──1:N──▶ EventNeed
Event ──1:N──▶ Ticket
Event ──1:N──▶ EventInterest

EventSeries ──N:1──▶ EventCategory
EventSeries ──1:N──▶ Event
EventSeries ──1:N──▶ EventSeriesNeedTemplate

EventNeed ──1:N──▶ NeedApplication
NeedApplication ──N:1──▶ VendorService (optional)

EventRequest ──N:1──▶ Event (fulfilled_by, optional)
EventRequest ──1:N──▶ RequestUpvote
```

## Django App Layout

| App | Models | Location |
| :--- | :--- | :--- |
| profiles | UserProfile | `apps/profiles/` (existing, enhanced) |
| events | Event, EventSeries, EventCategory, EventInterest | `apps/events/` (new) |
| needs | EventNeed, EventSeriesNeedTemplate, NeedApplication | `apps/needs/` (new) |
| vendors | VendorService | `apps/vendors/` (new) |
| tickets | Ticket | `apps/tickets/` (new) |
| requests | EventRequest, RequestUpvote | `apps/requests/` (new) |

## Database Strategy

- **Development**: SQLite, ephemeral (reset via `reset_database.py`)
- **Production**: Postgres (TBD — see DEPLOYMENT.md)

---

### Changelog

| Date | Change |
| :--- | :--- |
| 2026-02-28 | Initial draft with existing models + Event placeholder |
| 2026-02-28 | Full model definitions for all entities, enhanced UserProfile, ER diagram |
| 2026-02-28 | Added EventInterest model. Ticket gains ticket_type, is_refundable, refund_deadline. Event gains dual pricing (standard/flexible), interest_count, ticket_count, refund_window_hours. |
| 2026-02-28 | File fields → ImageField (avatar, cover_photo, cover_image). EventCategory seed data (12 categories). Co-host-as-vendor pattern. VendorService portfolio upload note. |
| 2026-03-01 | Added recurring data model extensions: EventSeries, Event.series linkage, occurrence index, and EventSeriesNeedTemplate for per-occurrence vendor signup. |
