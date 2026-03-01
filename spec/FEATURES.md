# Features [DRAFT]

## Feature Inventory

Status legend: `[DONE]` `[IN PROGRESS]` `[PLANNED]` `[IDEA]`

---

### Authentication & Identity

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Sign up (username, email, name, phone, password) | [DONE] | Auto-creates UserProfile |
| Sign in (JWT access + refresh) | [DONE] | |
| Token auto-refresh on 401 | [DONE] | Axios interceptor |
| Protected routes | [DONE] | RoleGuard component |
| Sign out | [PLANNED] | |
| Forgot password / reset | [PLANNED] | Requires SMTP |
| Email verification | [PLANNED] | Requires SMTP |
| OAuth (Google, Apple, etc.) | [IDEA] | |

---

### User Profile & Showcase

| Feature | Status | Notes |
| :--- | :--- | :--- |
| View/edit profile (phone, bio) | [DONE] | `/profile` route, PATCH endpoint |
| Account settings | [IN PROGRESS] | Settings section exists |
| Profile headline & showcase bio | [PLANNED] | New fields on UserProfile |
| Avatar & cover photo | [PLANNED] | Django ImageField, uploaded via multipart/form-data, stored in media/ |
| Vendor opt-in toggle | [PLANNED] | `is_vendor` boolean on profile |
| Location city | [PLANNED] | For discovery features |
| Public showcase page (`/u/:username`) | [PLANNED] | Shows hosted events, services, activity |
| Delete account | [IDEA] | |

---

### Organiser Capabilities

*Any authenticated user can organise an event. In simple cases, organiser = host.*

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Create event (title, description, date, location, price, category) | [PLANNED] | Two modes: **Quick Create** (no vendors) and **Detailed Create** (with vendor needs). See UI-UX.md. |
| Edit event | [PLANNED] | Organiser only |
| Cancel event | [PLANNED] | Sets status to `cancelled`, triggers refund flow |
| Event cover image | [PLANNED] | Django ImageField, uploaded via multipart/form-data |
| Event tags | [PLANNED] | JSONField on Event model |
| Event categories | [PLANNED] | EventCategory model |
| Designate a separate host | [PLANNED] | For when organiser != host |
| Post event needs ("need a DJ") | [PLANNED] | EventNeed model |
| Assign vendor classifications | [PLANNED] | Primary/standby, customer-facing/operational, criticality |
| Assign standby vendors | [PLANNED] | Pre-designated backup for each need |
| Review vendor applications for needs | [PLANNED] | Accept/reject flow |
| View attendee list | [PLANNED] | Via Ticket model |
| Manage event page (`/events/:id/manage`) | [PLANNED] | Unified organiser dashboard per event |
| Fulfill event requests | [PLANNED] | Link new event to an EventRequest |
| My hosted/organised events list | [PLANNED] | In personal dashboard |
| Event analytics | [IDEA] | Ticket sales, views, etc. |

---

### Event Lifecycle & Operations

*System-level capabilities for managing events through their full lifecycle. See [DOMAIN.md](./DOMAIN.md) and [SCENARIOS.md](./SCENARIOS.md).*

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Event state machine (draft → scheduled → completed) | [PLANNED] | Core states: draft, scheduled, at-risk, substituted, postponed, cancelled, completed |
| At-risk detection | [PLANNED] | Internal state when vendor fails, attendance low, etc. |
| Vendor substitution flow | [PLANNED] | Activate standby, assess materiality, notify if needed |
| Attendance threshold monitoring | [PLANNED] | Track ticket sales vs viability threshold |
| Postponement handling | [PLANNED] | Move date, re-poll vendors, notify attendees with refund option |
| Cancellation handling | [PLANNED] | Trigger refund flow, notify all parties |
| Decision audit trail | [PLANNED] | Record all state transitions, who decided, why |
| Refund/compensation logic | [PLANNED] | Downstream financial handling for cancellations/changes |
| Materiality assessment | [IDEA] | Classify whether a vendor change affects the attendee promise |

---

### Recurring Event Operations

*How recurring events are executed safely when each occurrence has new goers and vendor commitments.*

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Event series template | [DONE] | Series-level identity + recurrence rule + defaults |
| Occurrence generation | [DONE] | Auto-create upcoming event occurrences from a series |
| Per-occurrence ticketing enforcement | [DONE] | Tickets always scoped to one occurrence only |
| Per-occurrence vendor application enforcement | [DONE] | Vendors must apply/confirm each occurrence |
| Need template cloning (draft only) | [DONE] | Clone recurring needs without auto-confirming vendors |
| Prior-vendor re-invite flow | [PLANNED] | One-click invites to prior vendors to reapply |
| Occurrence-level cancellation/postponement | [PLANNED] | One occurrence can change without cancelling full series |
| Series pause/resume | [PLANNED] | Temporarily stop future occurrence generation |
| Series-level highlights/review aggregate | [DONE] | Aggregate proof while keeping operations per occurrence |

---

### Vendor Capabilities

*User must opt into vendor features via `is_vendor` on their profile. Vendor classification is per-event-assignment, not on the profile.*

| Feature | Status | Notes |
| :--- | :--- | :--- |
| List vendor services (title, description, category, price range) | [PLANNED] | VendorService model |
| Portfolio images on services | [PLANNED] | Separate upload endpoint, stored in media/portfolios/ |
| Edit/remove service listings | [PLANNED] | Owner only |
| Browse open event needs | [PLANNED] | Public, filterable by category |
| Apply to event needs (pitch + price quote) | [PLANNED] | NeedApplication model |
| Link existing service to application | [PLANNED] | Optional FK on NeedApplication |
| My applications list (with status) | [PLANNED] | In personal dashboard |
| My services list | [PLANNED] | In personal dashboard |
| Services visible on showcase page | [PLANNED] | Part of `/u/:username` |
| Standby vendor activation flow | [PLANNED] | Notification + confirmation when activated as backup |

---

### Goer Capabilities

*Any user can browse and attend events.*

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Browse events (list, filter, search) | [PLANNED] | `/events` page |
| Event detail page with vendor lineup | [PLANNED] | Shows customer-facing vendors only |
| "Interested" toggle on events | [PLANNED] | Heart button, increments interest_count. EventInterest model. Social bookmark + demand signal. |
| Social proof display (interested + going counts) | [PLANNED] | Visible on every Event Card. Numbers animate on change. |
| Buy ticket — standard (non-refundable) | [PLANNED] | Lower price tier. No refunds after purchase. |
| Buy ticket — flexible (refundable) | [PLANNED] | Premium price tier. Refundable up to N hours before event. |
| Ticket selection sheet (standard vs flexible) | [PLANNED] | Bottom sheet on mobile, dialog on desktop. |
| My tickets list | [PLANNED] | In personal dashboard |
| My interested events list | [PLANNED] | In personal dashboard |
| Post event request ("I wish this existed") | [PLANNED] | EventRequest model |
| Upvote event requests | [PLANNED] | RequestUpvote model |
| Browse event requests | [PLANNED] | `/requests` page |
| Browse vendor services | [PLANNED] | `/vendors` page |
| Notifications for material event changes | [PLANNED] | When customer-facing vendors change, event postponed/cancelled |
| Refund/credit option on material changes | [PLANNED] | Presented when event is materially altered |

---

### Goer Experience & Event Storytelling

*Experience features that make events feel alive before, during, and after attendance.*

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Dual event pages (Operations + Story) | [PLANNED] | Keep `/events/:id` transactional; add Story page for inspiration and context |
| Event Story page (`/events/:id/story`) | [PLANNED] | Upcoming details + live moments + post-event highlights |
| Event highlight feed (image/text/video) | [PLANNED] | Mixed media posts tied to event and timestamp |
| Host and goer highlight posting | [PLANNED] | Role-based permissions after event (and optional during live window) |
| Highlight moderation queue | [PLANNED] | Safety/quality checks for media and text |
| Recurring event series page | [PLANNED] | Past session highlights + next session CTA + progression narrative |
| Live event timeline updates | [IDEA] | Lightweight live updates during the event window |
| Event reviews (overall) | [PLANNED] | Post-event star rating + short written review |
| Vendor reviews (per event) | [PLANNED] | Rate specific participating vendors on service quality |
| Review credibility indicators | [IDEA] | Verified attendee badge, repeat attendee marker, helpful votes |
| Vendor spotlight blocks on Story page | [PLANNED] | Show vendor profiles/services as part of event charm |
| Similar next experiences rail | [PLANNED] | "If you liked this, try these this weekend" recommendations |

---

### Home Page & Discovery

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Home page — event-centric feed | [PLANNED] | Rich Event Cards with vendor lineups, needs, social proof |
| Hero section — featured/trending event | [PLANNED] | Selected by trending algorithm: location proximity + goer interest history + interest_count |
| Category chip filter bar | [PLANNED] | Horizontal scrollable, sticky on scroll, filters feed |
| Sort by trending / newest / popular | [PLANNED] | Query param on feed API |
| Infinite scroll with skeleton loading | [PLANNED] | Shimmer placeholders while loading |
| Event Card — vendor avatar row | [PLANNED] | Stacked avatars of confirmed customer-facing vendors |
| Event Card — open needs badges | [PLANNED] | Colorful pills, clickable for vendors to apply |
| Event Card — social proof bar | [PLANNED] | "42 interested · 18 going" with animated counts |
| Event Card — dual CTA (Interested + Get Tickets) | [PLANNED] | Heart toggle + primary ticket button |
| Location-based discovery | [PLANNED] | Used as input to trending algorithm. Browser geolocation (optional). |
| Recommended events | [PLANNED] | Powered by trending algorithm: proximity + interest match + interest_count |
| Trending requests | [IDEA] | Sorted by upvote_count |

---

### Admin & Operations

*Internal tooling for platform operations. Uses Django `is_staff` / `is_superuser`.*

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Django Admin panel | [DONE] | Built-in, all models registered |
| Operations dashboard (all events, risk overview) | [PLANNED] | Platform-wide health view |
| Event operations view (full audit trail) | [PLANNED] | Internal view per event |
| Manual override (force-cancel, force-refund) | [PLANNED] | Superuser only |
| Dispute resolution tools | [IDEA] | View history, contact parties |

---

### Social & Engagement

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Public user showcase pages | [PLANNED] | `/u/:username` |
| Follow users | [IDEA] | |
| Share events | [IDEA] | |
| Event comments / reviews | [IDEA] | |
| Notifications (in-app) | [PLANNED] | Material changes, application status, etc. |
| Notifications (email) | [IDEA] | Requires SMTP |

---

### Content Generation (AI)

| Feature | Status | Notes |
| :--- | :--- | :--- |
| AI event description generator | [IDEA] | OpenAI wrapper exists in `core/ai.py` |
| AI vendor pitch helper | [IDEA] | Help vendors write applications |

---

## Business Rule Themes

These themes must be preserved across all feature design. They are the principles that guide what the system builds and how it behaves. For full detail, see [DOMAIN.md](./DOMAIN.md).

1. **Role-based responsibility** — The system must distinguish who caused a change and who is affected. A vendor cancelling is different from a host cancelling.

2. **Materiality of change** — Not every vendor change is equal. Replacing operational staff is routine. Losing a headliner is critical. Features must classify impact.

3. **Customer reliance** — Some event promises are commercially important because goers relied on them. The system must distinguish between promises that drive ticket sales and background details.

4. **Substitution vs cancellation** — A replaced vendor may or may not mean the event has materially changed. Features must support a middle path between "everything is fine" and "event is cancelled."

5. **Threshold-based viability** — Low attendance triggers a business decision, not a fault condition. The system should surface signals without implying blame.

6. **Recoverability and traceability** — Every decision should be explainable and auditable. The audit trail is a first-class feature, not an afterthought.

---

## Key User Stories

### As an Organiser

```
As an Organiser,
I want to create an event, assign vendors with backup plans, and manage the event through its lifecycle,
so that I can handle disruptions gracefully and keep goers informed.

Acceptance Criteria:
- [ ] Can create event with all required fields
- [ ] Can assign vendors as primary or standby
- [ ] Can classify vendors by visibility and criticality
- [ ] Can review and accept/reject vendor applications
- [ ] Can see event health (at-risk indicators)
- [ ] Can handle vendor substitution with appropriate notifications
```

### As a Vendor

```
As a Vendor,
I want to list my services and apply to event needs,
so that I can get hired for events through the platform.

Acceptance Criteria:
- [ ] Can opt into vendor mode on profile
- [ ] Can create service listings with portfolio images
- [ ] Can browse open event needs
- [ ] Can apply to needs with a message and price quote
- [ ] Can track application status (pending/accepted/rejected)
- [ ] Am notified when activated as a standby
```

### As a Goer

```
As a Goer,
I want to browse events knowing who's performing/hosting, buy tickets, and be notified if something material changes,
so that I can trust what I'm buying and make informed decisions.

Acceptance Criteria:
- [ ] Can browse and filter events by category, date, location
- [ ] Can see customer-facing vendor lineup on event detail
- [ ] Can purchase/reserve a ticket
- [ ] Am notified of material changes (vendor swap, postponement, cancellation)
- [ ] Am offered refund/credit when event is materially altered
```

### As a Goer (Event Requests)

```
As a Goer,
I want to post a request for an event I wish existed,
so that an organiser might see the demand and create it.

Acceptance Criteria:
- [ ] Can create a request with title, description, desired date/location
- [ ] Other users can upvote the request
- [ ] Organisers can see popular requests
- [ ] When an organiser creates a matching event, they can link it to the request
```

### As a Goer (Highlights + Trust)

```
As a Goer,
I want to see highlights, reviews, and vendor credibility on a rich event story page,
so that I can decide quickly whether this event is worth my weekend.

Acceptance Criteria:
- [ ] Can view event highlights in mixed media format (image/text/video)
- [ ] Can view host history and participating vendor summaries from the same page
- [ ] Can read event-level and vendor-level reviews from prior occurrences
- [ ] Can post highlights after attending
- [ ] Can rate/review the event and vendors after completion
```

### As an Organiser (Recurring Series)

```
As an Organiser,
I want recurring events to be easy to run without auto-committing attendees or vendors,
so that each occurrence remains accurate and manageable.

Acceptance Criteria:
- [ ] Can define a recurring series template and generate occurrences
- [ ] Each occurrence has its own ticket list and attendee counts
- [ ] Vendor needs can be cloned from template, but vendors must re-confirm each occurrence
- [ ] Cancelling one occurrence does not automatically cancel the full series
- [ ] Can pause or resume future occurrence generation
```

---

### Changelog

| Date | Change |
| :--- | :--- |
| 2026-02-28 | Initial inventory from codebase analysis |
| 2026-02-28 | Reorganized around Host/Vendor/Goer capabilities, added user stories |
| 2026-02-28 | Added Event Lifecycle & Operations section, Admin & Operations section, business rule themes. Updated terminology (Host → Organiser where appropriate). Expanded vendor and goer features for lifecycle handling. |
| 2026-02-28 | Added Interested feature, ticket types (standard/flexible), social proof, home page and Event Card features. Renamed Discovery & Feed to Home Page & Discovery. |
| 2026-02-28 | Event creation: Quick Create vs Detailed Create modes. File uploads via ImageField. Trending algorithm: proximity + interest match + interest_count. Location-based discovery promoted to PLANNED. |
| 2026-03-01 | Added Goer Experience & Event Storytelling section: dual event surfaces, highlights, recurring series narrative, event/vendor reviews, and vendor spotlighting. |
| 2026-03-01 | Added Recurring Event Operations: series template, occurrence generation, per-occurrence goer/vendor enforcement, and organiser recurring user story. |
