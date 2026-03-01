# Roadmap [DRAFT]

## Phases

### Phase 0 — Foundation [DONE]
> Project scaffolding, auth, profiles

- [x] Django + DRF backend setup
- [x] React + Vite frontend setup
- [x] JWT authentication (sign up, sign in, auto-refresh)
- [x] User profile (view, edit)
- [x] Route protection (RoleGuard)
- [x] API response envelope standardization
- [x] Code quality gates (Pylint 10/10, ESLint, pre-push hooks)
- [x] Dev tooling (Silk, React Query Devtools, React Scan)

### Phase 0.5 — Domain Design [IN PROGRESS]
> Define the conceptual shape of the system before building

- [x] Spec kit created (all documentation files)
- [x] Actor model defined (Organiser, Host, Vendor, Goer, Admin/Ops)
- [x] Vendor classification framework (primary/standby, customer-facing/operational, essential/replaceable/non-substitutable)
- [x] Event lifecycle states defined (draft → scheduled → at-risk → substituted/postponed/cancelled → completed)
- [x] Business scenario inventory (vendor failure, cancellation, attendance, force majeure)
- [x] Customer-facing vs internal operational concerns separated
- [x] Abstract UI module mapping (what information visible to which actor)
- [x] Abstract backend responsibility areas (state machine, substitution engine, notification dispatch, audit trail)
- [ ] Resolve open questions in DOMAIN.md and SCENARIOS.md through discussion
- [ ] Finalize organiser-host relationship model
- [ ] Decide on event state machine implementation approach
- [ ] Decide on audit trail implementation approach

### Phase 1 — Events, Home Page & Showcase
> The core: create events, the home page experience, buy tickets, personal pages

**Backend — Infrastructure**:
- [x] Configure `MEDIA_ROOT`, `MEDIA_URL` in Django settings
- [x] Add media URL serving to `urls.py` for development
- [x] Add `/media` proxy to Vite config alongside `/api`
- [x] Image upload validation util (max 5 MB, JPEG/PNG/WebP)
- [x] Seed `EventCategory` data (12 categories) via data migration or management command

**Backend — Models & API**:
- [x] `apps/events` — Event (with ImageField for cover_image), EventCategory, EventInterest models
- [x] `api/events/` — CRUD endpoints (multipart/form-data for create/update), category listing
- [x] `api/events/:id/interest/` — Interest toggle endpoints
- [x] `api/feed/` — Enriched event feed endpoint (with vendors, needs, social proof, trending algorithm)
- [x] Trending algorithm: location proximity + goer interest history + interest_count
- [x] `apps/tickets` — Ticket model with ticket_type (standard/flexible)
- [x] `api/events/:id/tickets/` — Purchase endpoint with ticket type selection
- [x] `api/tickets/my/` — My tickets endpoint
- [x] Enhance `UserProfile` — headline, showcase_bio, avatar (ImageField), cover_photo (ImageField), location_city
- [x] `PATCH /api/profiles/me/` — Support multipart/form-data for avatar/cover_photo uploads
- [x] `api/profiles/:username/` — Public showcase endpoint
- [x] Event state management (at minimum: draft, scheduled, cancelled, completed)
- [x] Dual pricing on events (ticket_price_standard, ticket_price_flexible, refund_window_hours)
- [x] Denormalized counts on Event (interest_count, ticket_count)

**Frontend — Home Page**:
- [x] Hero section — featured event, full-bleed cover, social proof overlay (Basic implementation)
- [x] Category chip filter bar — horizontal scroll, sticky
- [x] Event Card component — cover, info, vendor avatars, need badges, social proof, dual CTA
- [x] Interest toggle — heart animation, optimistic update
- [x] Ticket Selection Sheet — standard vs flexible, bottom sheet (mobile) / dialog (desktop)
- [x] Infinite scroll with skeleton loading (Skeleton loading implemented)
- [x] Feed sorting (trending / newest / popular)
- [x] Install new shadcn/ui components: Badge, Avatar, Sheet, Dialog, Toggle, Tooltip

**Frontend — Other Pages**:
- [x] Browse Events page (`/events`) — grid, filters, search (Consolidated into Home page)
- [x] Event Detail page (`/events/:id`) — info, vendor lineup, buy ticket, needs list
- [x] Create Event page (`/events/create`) — adaptive form: Quick Create (single page, no vendors) or Detailed Create (multi-step, with vendor needs + dual pricing)
- [x] Manage Event page (`/events/:id/manage`) — edit, view attendees, interest count
- [x] User Showcase page (`/u/:username`) — public profile
- [x] Dashboard (`/dashboard`) — My Events, My Tickets, My Interested Events tabs
- [x] Enhanced profile editing (new fields + avatar/cover photo upload with preview)
- [x] Updated Navbar with full navigation
- [x] Route cleanup: reconcile existing routes (`/website`, `/website-preview`, `/profile`) with new structure (`/dashboard`, `/u/:username`, `/events/*`)

### Phase 2 — Vendor Marketplace
> Let vendors list services and respond to event needs

**Backend**:
- [x] `apps/vendors` — VendorService model
- [x] `api/vendors/` — Service CRUD + browse endpoints
- [x] `apps/needs` — EventNeed + NeedApplication models
- [x] `api/events/:id/needs/` — Need CRUD + apply + review endpoints
- [x] Vendor opt-in (`is_vendor` on UserProfile)
- [x] Vendor assignment with classification metadata (primary/standby, visibility, criticality)

**Frontend**:
- [x] Browse Vendors page (`/vendors`) — service grid, category filter
- [x] Vendor service creation form
- [x] Event needs section on Event Detail page
- [x] Apply-to-need modal/form
- [x] Organiser: review applications on Manage Event page
- [x] Organiser: vendor assignment with classification tags
- [x] Dashboard: My Services tab, My Applications tab
- [x] Vendor services on Showcase page
- [x] Host vendor invite flow from event needs (invite vendors to apply)
- [x] Vendor opportunities feed (`/vendor-opportunities`) with matching open needs + apply flow
- [x] Vendor portfolio route (`/vendors/portfolio/:vendorId`)

### Phase 3 — Demand Side (Event Requests)
> Let goers express what they want, let organisers respond to demand

**Backend**:
- [x] `apps/requests` — EventRequest + RequestUpvote models
- [x] `api/requests/` — CRUD + upvote + fulfill endpoints

**Frontend**:
- [x] Browse Requests page (`/requests`) — sorted by popularity
- [x] Create Request form (`/requests/create`)
- [x] Upvote interaction on request cards
- [x] Organiser: "I'm hosting this" → link event to request
- [x] Dashboard: My Requests tab

### Phase 4 — Advanced Discovery
> Smarter discovery beyond the core event feed (which ships in Phase 1)

- [x] Location-based event discovery (geolocation)
- [ ] Personalized event recommendations
- [x] Trending event requests surfaced on home page
- [x] Search improvements (full-text, autocomplete)
- [x] "Near you" and "This weekend" quick filters
- [x] Unified calendar route (`/calendar`) with month grid + timeline for hosting/attending/vendor request activity

### Phase 5 — Event Lifecycle Engine
> The decision and coordination layer that handles non-happy paths

**Target lifecycle narrative (v1)**:
1. Event created
2. Vendors sign up / are assigned
3. Attendees buy tickets
4. Event happens
5. Event cancelled (if required by real-world conditions)
6. Vendor paid (policy-driven outcome; see open policy item)
7. Event highlights posted / archived summary published

**Lifecycle states (planned)**:
- `draft` → `published` → `live` → `completed`
- Risk/exception overlays: `at_risk`, `postponed`, `cancelled`
- Finance overlays: `refund_pending`, `refund_completed`, `vendor_payout_pending`, `vendor_payout_completed`
- Content overlays: `highlights_pending`, `highlights_published`

**Transition checkpoints (planned)**:
- `published` requires: date/time, venue, pricing, host, minimum metadata
- `live` requires: start-time window reached and event not cancelled
- `completed` requires: end-time passed and no unresolved incident
- `cancelled` can occur from: `published`, `at_risk`, `postponed`, `live`
- `highlights_published` requires: `completed` or `cancelled` with postmortem summary

**Cancellation policy track (planned)**:
- Ticket side: automatic refund workflow based on ticket type + cutoff rules
- Vendor side: payout outcome based on contract status and cancellation timing
- Open policy item: what happens to vendor payout on cancellation is intentionally deferred for explicit business decision in a later policy pass.

**Backend**:
- [ ] Event state machine (full lifecycle: at-risk, substituted, postponed transitions)
- [ ] Standby vendor activation logic
- [ ] Vendor substitution materiality assessment
- [ ] Attendance threshold monitoring
- [ ] Notification dispatch (material changes → goers, operational changes → organiser only)
- [ ] Decision audit trail (all state transitions, who decided, why)
- [ ] Cancellation/postponement workflow with refund triggering
- [ ] Vendor payout policy engine for cancellation outcomes (TBD rules)
- [ ] Highlights publishing state + moderation workflow

**Frontend**:
- [ ] Organiser: event status dashboard with risk indicators
- [ ] Organiser: vendor substitution interface (standbys, materiality, actions)
- [ ] Organiser: event state transition controls (postpone, cancel)
- [x] DB-driven Alerts inbox (`/alerts`) for host/vendor/attendee actionable reminders (not notifications)
- [ ] Goer: notifications for material event changes
- [ ] Goer: refund/credit option when event is materially altered
- [ ] Decision history view (organiser + admin)
- [ ] Organiser: payout visibility panel (refunds + vendor payouts)
- [ ] Post-event highlights composer/publisher (host/admin)

**Detailed execution plan (Phase 5)**:
1. **State model foundation**
- Introduce canonical lifecycle enum(s) and transition guard service.
- Add transition API endpoint with server-side guardrails.
- Emit immutable audit records on every transition.
2. **Risk + substitution engine**
- Add at-risk detection inputs (vendor withdrawal, attendance thresholds, operational flags).
- Implement standby vendor activation flow with materiality scoring.
- Trigger organizer decision tasks when substitution is required.
3. **Cancellation + financial outcomes**
- Build cancellation orchestration endpoint (single command path).
- Trigger ticket refund workflow and expose processing states.
- Add vendor payout policy hook (initial placeholder strategy + feature flag).
4. **Notification layer**
- Implement role-aware notifications for goers/vendors/hosts.
- Separate material customer-facing notices from internal ops notices.
- Add delivery logs for traceability.
5. **Post-event closure**
- Auto-transition eligible events to completed.
- Add highlights workflow (`pending` → `published`) with optional moderation gate.
- Show closure checklist in organizer UI.
6. **Operational visibility**
- Ship decision history timeline and filterable audit trail UI.
- Add lifecycle health dashboard cards for organizer + ops/admin.
- Add manual override controls with strict permission + reason capture.

### Phase 6 — Operations & Admin
> Internal tooling for platform operations

- [ ] Operations dashboard (platform-wide event health, at-risk events)
- [ ] Event operations view (full audit trail per event)
- [ ] Manual override tools (force-cancel, force-refund, vendor reassignment)
- [ ] Dispute resolution interface

### Phase 7 — Polish & Production
> Production readiness, engagement, growth features

- [ ] Email verification + password reset (SMTP)
- [ ] Production file storage (S3 via Django Storages — dev uses local media/)
- [ ] Real payment integration (Stripe)
- [ ] Notifications (in-app + email)
- [ ] Social features (follow users, share events)
- [ ] AI content generation (event descriptions, vendor pitches)
- [ ] Production deployment (see DEPLOYMENT.md)
- [ ] Monitoring, error tracking, backups

## Phase Summary

| Phase | Focus | Key Deliverable |
| :--- | :--- | :--- |
| 0 | Foundation | Auth + profiles + quality gates |
| 0.5 | Domain Design | Spec kit, actor model, event lifecycle, business scenarios |
| 1 | Events, Home Page & Showcase | Home page, event cards, interest, tickets (standard/flexible), user pages |
| 2 | Vendor Marketplace | Services, event needs, vendor applications, classification |
| 3 | Demand Side | Event requests, upvotes, fulfillment |
| 4 | Advanced Discovery | Location-based, recommendations, search improvements |
| 5 | Event Lifecycle Engine | State machine, substitution logic, notifications, audit trail |
| 6 | Operations & Admin | Internal dashboards, overrides, dispute resolution |
| 7 | Polish & Production | Payments, email, S3 storage, deployment |

## Priorities

Phase 1-4 core delivery is mostly complete. The immediate priorities are finishing personalized recommendations (remaining Phase 4 item) and beginning Phase 5 lifecycle/operational logic.

Priority order moving forward:
1. [NEXT] Personalized event recommendations (user-signal ranking + For You feed mode)
2. [NEXT] Event lifecycle state machine foundation (Phase 5 backend)
3. [NEXT] Decision audit trail model + event transition logging
4. [NEXT] Organizer lifecycle controls UI (postpone/cancel/at-risk markers)
5. [NEXT] Notification dispatch rules for material event changes

## Timeline

<!-- TBD: Set deadlines as we start building -->

---

### Changelog

| Date | Change |
| :--- | :--- |
| 2026-02-28 | Initial draft with rough phase outline |
| 2026-02-28 | Re-phased around Host/Vendor/Goer model with detailed backend + frontend tasks |
| 2026-02-28 | Added Phase 0.5 (Domain Design), Phase 5 (Event Lifecycle Engine), Phase 6 (Operations & Admin). Renumbered phases. Updated terminology. |
| 2026-02-28 | Home page, interest, and ticket types folded into Phase 1. Phase 4 becomes Advanced Discovery. Updated priorities. |
| 2026-02-28 | Added media infrastructure tasks to Phase 1. EventCategory seed data. Quick Create vs Detailed Create event form. Trending algorithm. Route cleanup task. File uploads moved into Phase 1. |
| 2026-03-01 | Added DB-driven Alerts inbox (`/alerts`) with host/vendor/attendee actionable reminders and CTA routing. |
| 2026-02-28 | Phase 2 completed: Manage Event page, Service creation, Needs apply modal, Dashboard tabs, Category logic matching, application statuses, assigned vendor tag. |
| 2026-02-28 | Updated roadmap to reflect completion of Showcase features, request linking, and dashboard updates. |
| 2026-03-01 | Phase 4 discovery improvements shipped: geolocation-based filters, trending requests on home, broader search matching, autocomplete suggestions. |
| 2026-03-01 | Added host-to-vendor invite flow, vendor opportunities feed, vendor portfolio route, and unified calendar route with month grid + timeline. |
