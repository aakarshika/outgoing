---
title: Product — Features & Current State
status: living
last-updated: 2026-05-16
---

# Product — Features & Current State

Features grouped by actor, reflecting the codebase today. Legend: ✅ live · 🟡 partial / inconsistent · 🔻 modeled but not exposed · ❌ not built.

## TL;DR

- Discovery, tickets, interest, event requests, needs/applications/invites, reviews, highlights, friendships/Orbits, and chat are all **implemented end to end**.
- The **event lifecycle state machine is declared but not enforced** — any state can transition to any state (a temporary product rule in code). Treat lifecycle as a label, not a guarded workflow.
- There are **two chat systems** side by side: legacy per-event message models in `apps.events`, and a newer unified `apps.chat` (`ChatMessage` + `thread_key`). Chat "thread insights" is Phase 2 and partly stubbed.
- Large parts of the **frontend route map are commented out** (alerts, dashboard, calendar, create-event, standalone vendors/requests pages). Backend endpoints for many of these exist; the UI doesn't.
- `apps.content_generator` is an **empty installed stub**. No automated tests exist (backend or frontend).

## Goer

| Capability | Status | Notes |
|---|---|---|
| Browse / feed (base, carousel, trending highlights, recently-viewed, upcoming, iconic hosts, top vendors) | ✅ | `feed/` endpoints; `pages/home`, `/test-feed` |
| Intent tabs (Trending / Tonight / Free & Cheap / Chip In / Online / My Network) | 🟡 | Concept is the product spine; feed endpoints + filters back it, tab coverage in UI is uneven |
| Event detail (operations + story/highlights surfaces) | ✅ | `EventDetailV2` at `/events/:id`; gallery at `/events/:id/gallery` |
| Express interest | ✅ | `EventInterest`, unique per (event, user); drives social proof |
| Buy ticket (tiers, guest name, 18+, QR) | ✅ | `EventTicketTier` + `Ticket`; purchase/validate/admit endpoints |
| Recently viewed | ✅ | `EventView`, upsert per (event, user) |
| Post / upvote / wishlist event requests | ✅ | `EventRequest`, `RequestUpvote`, `RequestWishlist`; no standalone page route (commented out) — surfaced inline |
| Reviews (event + per-vendor sub-reviews) + likes/comments | ✅ | `EventReview`, `EventVendorReview`, like/comment models |
| Highlights (post, like, threaded comments) | ✅ | `EventHighlight`; `moderation_status` defaults to `approved` (moderation effectively off) |
| Profile / public showcase | ✅ | `UserProfile` with privacy flags; `/user/:username`, `/profile/settings-new` |

## Host

| Capability | Status | Notes |
|---|---|---|
| Create / edit event | ✅ | `EventListCreateView`, `EventDetailView` |
| Manage workspace (`/events/:id/manage`) | ✅ | Host-only via `RoleGuard` |
| Define needs (category, criticality, budget) | ✅ | `EventNeed`; criticality ∈ essential/replaceable/non_substitutable |
| Review applications, accept/reject | ✅ | `NeedApplication`; QR generated only when status becomes `accepted` |
| Invite vendors to a need | ✅ | `NeedInvite` |
| Ticket tiers | ✅ | `EventTicketTier` (price, capacity, refundability, admits) |
| Admit attendees / contributors (QR) | ✅ | `tickets/admit/`, `tickets/validate/` |
| Recurring series (rule, occurrences, generate) | 🟡 | `EventSeries` + `event-series/` endpoints exist; per-occurrence isolation is the design rule (see [domain.md](domain.md)) |
| Lifecycle transitions + audit history | 🟡 | Endpoints + `EventLifecycleTransition` audit log exist, **but transition rules are not enforced** — see below |
| At-risk / substitution / threshold automation | ❌ | Concept only. Not built. Do not assume any automation exists |

## Vendor / Contributor

| Capability | Status | Notes |
|---|---|---|
| List a `VendorService` (visibility, price, portfolio) | ✅ | `vendors/` endpoints; portfolio page `/vendors/portfolio/:vendorId` |
| Discover & apply to needs | ✅ | `needs/opportunities/*`, `needs/<id>/apply/` |
| Receive & respond to invites | ✅ | `NeedInvite`, `needs/invites/my/` |
| QR for accepted contribution / admission | ✅ | Barcode/qr_secret on accepted `NeedApplication` |
| Vendor reviews | ✅ | `VendorReview` (in `apps.vendors`) + `EventVendorReview` (sub-review within an event review) |
| Standalone vendor create/browse pages | 🔻 | Backend exists; frontend routes commented out in `routes.config.ts` |

## Social (Orbits) & Chat

| Capability | Status | Notes |
|---|---|---|
| Friendships (request → accept/decline/cancel) | ✅ | `Friendship`; normalized pair, status transitions handled in views |
| Orbits (category-scoped connection from shared attendance) | ✅ | `Friendship.orbit_category` derived from event category |
| "My Network" — people + activity | ✅ | `events/network/people/`, `events/network/activity/`; activity = going \| hosting \| servicing, published events only |
| Chat — unified | ✅ | `apps.chat`: one `ChatMessage` row per message, namespaced `thread_key` (`user:` / `event_public:` / `event_vendor:` / `special_group:`) |
| Chat — legacy event messaging | 🟡 | `EventHostVendorMessage`, `EventPrivateConversation/Message` in `apps.events` still present and wired. Two systems coexist |
| Chat thread insights | 🟡 | `chat/thread-insights/` is Phase 2; event threads return empty |
| Chat UX | ✅ | Opens as a single global drawer; URL stays unchanged (deliberate — do not route-govern chat) |

## Admin

Django admin only (`/admin/`). No custom admin UI. Admin = `is_staff` / `is_superuser`. Convention: register every new model in its app's `admin.py`.

## Notable not-built / WIP

- **Lifecycle enforcement** — `Event.ALLOWED_LIFECYCLE_TRANSITIONS` is defined but `can_transition_to()` ignores it (`# Temporary product rule: allow transitions between any lifecycle states`). Transitions are recorded in the audit log but not validated. See [domain.md](domain.md#event-lifecycle).
- **`apps.content_generator`** — installed app, empty `models.py`/`views.py`/`tests.py`. There is an OpenAI wrapper at `core/ai.py` used elsewhere; the app itself is a stub.
- **Frontend routes commented out** — `/alerts`, `/dashboard`, `/calendar`, `/events/create`, `/vendors`, `/vendors/create`, `/services/:id`, `/requests`, `/profile`, `/browse`. Some have working backend endpoints (e.g. `alerts/`); the pages are not wired.
- **No tests** anywhere — backend or frontend. Stated plainly so no one assumes a safety net.
- **Lint is permissive on the frontend** (most correctness rules disabled); strict-ish on the backend. See [workflows.md](workflows.md).

Cross-references: rules behind these features → [domain.md](domain.md); data shapes → [data-models.md](data-models.md); endpoints → [api.md](api.md).
