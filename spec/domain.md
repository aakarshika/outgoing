---
title: Domain — Entities & Business Rules
status: living
last-updated: 2026-05-16
---

# Domain — Entities & Business Rules

What the entities mean and the rules that govern them. Field-level detail is in [data-models.md](data-models.md). Rules that are declared but not enforced in code are marked as such.

## TL;DR

- An **Event** is the anchor. It has tickets (via tiers), interest, needs, reviews, highlights, and optionally belongs to an **EventSeries** (recurring).
- A **need** is something a host requires (DJ, food, gear…). An attendee/vendor **applies**; the host **accepts** — that is a contribution ("Chip In"). A co-host is just a zero-fee contribution.
- **Roles are behaviors**, enforced per-object at the API layer, never by an account-type flag.
- **Orbits**: attending the same event connects two users, scoped to the event's category.
- The **event lifecycle is declared but unguarded** today — any state → any state. The transition table exists in code but is bypassed.

## Actors (recap)

Goer (default) · Host (creator/runner of an event) · Vendor/Contributor (fills a need) · Admin (`is_staff`/`is_superuser`). One user can be all of them across different events. The Organiser-vs-Host split that older docs described has effectively collapsed to **Host** in the build. Full positioning in [vision.md](vision.md).

## Core entities (plain language)

- **Event** — a single happening. Has a host, category, location, start/end, capacity, ticket tiers, needs, interest, reviews, highlights. Carries both a legacy coarse `status` and a finer `lifecycle_state` (see lifecycle below). May belong to an `EventSeries`.
- **EventSeries** — a recurring container with a `recurrence_rule` (RRULE-like, e.g. `FREQ=WEEKLY;BYDAY=SU`), timezone, and defaults. One series → many Event occurrences.
- **EventCategory** — name/slug/icon (Lucide name). Drives discovery grouping and orbit scoping.
- **EventTicketTier** — a named priced tier on an event (price, capacity null=unlimited, `admits` count, refundability, refund %). Tickets are bought against a tier. The old flat `ticket_price_*` fields on Event/Series are **legacy** and superseded by tiers.
- **Ticket** — one attendee's admission (tier, guest name, 18+ flag, unique `barcode`, `qr_secret`, price paid, status). Status ∈ active/used/cancelled/refunded.
- **EventInterest** — a lightweight "I'm interested" signal. Unique per (event, user). Demand/social proof, not a commitment.
- **EventView** — recently-viewed tracking. Upsert per (event, user).
- **EventNeed** — something the host needs filled: category, **criticality** (essential / replaceable / non_substitutable), budget range, status (open / filled / cancelled / override_filled), assigned vendor.
- **NeedApplication** — a vendor/attendee applying to a need with a message and proposed price. Status ∈ pending/accepted/rejected/withdrawn. **Barcode + qr_secret are generated only once the application is `accepted`.** Unique per (need, vendor).
- **NeedInvite** — host-initiated invitation of a vendor to a need. Status ∈ pending/applied/dismissed. Unique per (need, vendor).
- **VendorService** — a marketplace listing by a user (category free-text, base price, portfolio image, visibility customer_facing/operational, active flag).
- **EventReview** — a goer's rating (1–5) + text on an event. Unique per (event, reviewer). May contain **EventVendorReview** sub-reviews (rating a specific vendor within that review). Likes + threaded comments exist.
- **EventHighlight** — user-posted media + text tied to an event, with `role` (host/goer) and `moderation_status` that **defaults to `approved`** (moderation is effectively off). Likes + threaded comments.
- **EventRequest** — demand signal: "I wish this event existed." Has upvotes (`RequestUpvote`) and wishlist intent (`RequestWishlist`, as goer/host/vendor). A host can fulfill it by linking an Event.
- **Friendship** — connection between two users. Normalized pair (lower id first), `request_sender`, status (pending/accepted/declined/cancelled), `met_at_event`, and an **`orbit_category`** derived from that event's category. Uniqueness is per (user1, user2, orbit_category) — the same two people can share multiple orbits.
- **UserProfile** — O2O with the stock Django `User` (there is **no custom user model**). Headline, showcase bio, avatar/cover, location, and per-field privacy booleans.
- **Chat** — `ChatMessage` (one row per message, exactly one recipient: a user, an event public chat, an event vendor group, or a special group; namespaced by `thread_key`). Legacy per-event message models in `apps.events` still exist in parallel.

## Business rules

### Roles are behaviors (not RBAC)

Any authenticated user is a Goer. Creating an event makes you that event's host; filling a need makes you that assignment's contributor. There is no account-type gate. Ownership is checked **per object inside views** (e.g. `if event.host != request.user → 403`), not via global permission classes. Only Admin is a real account attribute (Django staff/superuser). Implication: never gate a product capability by route or role flag — gate by object ownership at the API layer ([backend.md](backend.md), [conventions.md](conventions.md)).

### Chip In / contribution

A host declares **needs** on an event. A need has a category, a **criticality**, and a budget range; conceptually it also carries a reward (discount / free entry / cash) — the reward is product-level framing surfaced in the UI, while the persisted shape is the need + accepted application + proposed price. A user **applies** (`NeedApplication`); the host **accepts**. Acceptance is what mints the contributor's QR credentials. **A co-host is a zero-fee contribution** — there is no separate co-host model.

Vendor↔need eligibility is a **lowercase substring match** of `VendorService.category` against `EventNeed.category` (not an enum join) — keep that in mind when adding categories.

### Vendor classification (concept vs reality)

The conceptual model classifies a contribution on three axes: **Role** (Primary / Standby), **Visibility** (Customer-Facing / Operational), **Criticality** (Essential / Replaceable / Non-Substitutable). Of these, **Criticality** is persisted (`EventNeed.criticality`) and **Visibility** exists on `VendorService.visibility`. Role (Primary/Standby) and the substitution engine that would use it are **not built**. Treat the three-axis framework as design intent, not a schema.

### Event lifecycle

`Event` carries two fields:

- **`status`** (legacy, coarse): `draft`, `published`, `cancelled`, `completed`.
- **`lifecycle_state`** (finer): `draft`, `published`, `at_risk`, `postponed`, `event_ready`, `live`, `cancelled`, `completed`.

Visible-to-goer states are conceptually `published, at_risk, postponed, event_ready, live`. `at_risk` is *intended* to be internal-only, but note it is not currently hidden by any enforcement.

A transition table **is declared** in code (`Event.ALLOWED_LIFECYCLE_TRANSITIONS`):

```
draft       → {published, cancelled}
published   → {at_risk, postponed, event_ready, cancelled, completed}
at_risk     → {published, postponed, event_ready, cancelled}
postponed   → {published, event_ready, cancelled}
event_ready → {at_risk, live, cancelled, completed}
live        → {completed, cancelled}
cancelled   → {}        completed → {}
```

**It is not enforced.** `can_transition_to()` ignores the table with an explicit comment: *"Temporary product rule: allow transitions between any lifecycle states."* `transition_to()` only rejects unknown states, sets `lifecycle_state`, maps it back to the legacy `status` (`at_risk/postponed/event_ready/live → published`), and writes an immutable `EventLifecycleTransition` audit row. `save()` also force-syncs lifecycle from legacy status. **So today the lifecycle is a label with an audit trail, not a guarded state machine.** Document changes against this reality; if you re-enable enforcement, update this section.

### Recurring series

A series is a template; occurrences are independent Events. The intended rules: tickets, interest, reviews, and contributor confirmations are **per-occurrence**; needs may be cloned to a new occurrence as drafts only; nothing auto-carries goers or vendor confirmations forward; cancelling one occurrence does **not** cancel the series; story/highlights may aggregate at the series level. The `event-series/` endpoints (list/detail/occurrences/generate-occurrences) implement the container; per-occurrence isolation is a rule to uphold, not an enforced constraint.

### Orbits & network

- A friendship is only an Orbit member when `status == accepted`.
- `orbit_category` is derived from `met_at_event.category` on save; a friend appears in a category's orbit only when that matches the event's category.
- "Network activity" = a user **going** (active/used ticket), **hosting** (event host), or **servicing** (assigned vendor) — restricted to **published** events, one attendee per (event, user).

### Tickets & admission

Buying a ticket is per (event, goer) against a tier. `barcode` (unique, auto) and `qr_secret` are generated on save. Admission flips `status` to `used` and stamps `admitted_by`/`used_at`. Refundability and refund window come from the tier. Ticket purchase/admit/QR logic lives in `apps/tickets/services.py` (one of only two service layers in the codebase — see [backend.md](backend.md)).

### Uniqueness constraints (enforced)

One per pairing: `(event, goer)` ticket, `(event, user)` interest, `(event, user)` view, `(need, vendor)` application, `(need, vendor)` invite, `(event, reviewer)` review, `(event_review, vendor)` vendor sub-review, `(request, user)` upvote/wishlist, unique ticket `barcode`, `(participant1, participant2)` private conversation, `(user1, user2, orbit_category)` friendship. Chat enforces exactly-one-recipient via a DB check constraint.

See [data-models.md](data-models.md) for exact fields and enum values, and [conventions.md](conventions.md) for what not to do around these rules.
