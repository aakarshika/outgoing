# Architecture [DRAFT]

## System Overview

Outgoing is a decision and coordination engine for events, built as a full-stack web application. Frontend and backend are fully separated, communicating over a versioned REST API.

The backend is responsible for two distinct layers of logic:
1. **CRUD and marketplace** — creating events, managing profiles, browsing vendors, buying tickets
2. **Event lifecycle and decision engine** — state management, vendor substitution logic, risk assessment, notification triggering, audit trails

```
┌─────────────────────┐        ┌─────────────────────┐
│   Frontend (SPA)    │  HTTP  │   Backend (API)     │
│   React + Vite      │───────▶│   Django + DRF      │
│   Port 5995         │◀───────│   Port 8998         │
└─────────────────────┘        └──────────┬──────────┘
                                          │
                                          ▼
                                ┌─────────────────────┐
                                │   SQLite (Dev)      │
                                │   Postgres (Prod)   │
                                └─────────────────────┘
```

## Tech Stack

### Backend

| Layer | Technology | Notes |
| :--- | :--- | :--- |
| Language | Python 3.11 | Managed via brew |
| Framework | Django 5.2.11 LTS | |
| API | Django REST Framework 3.16.1 | |
| Auth | SimpleJWT | Access + Refresh tokens |
| Database | SQLite (dev), Postgres (prod) | Dev is ephemeral, reset via script |
| Docs | drf-spectacular | Swagger / OpenAPI |
| Profiling | Django Silk | Request + query profiling |
| AI | OpenAI API | Wrapper in `core/ai.py` |
| Quality | Pylint, Black, isort | 10/10 pylint target |

### Frontend

| Layer | Technology | Notes |
| :--- | :--- | :--- |
| Language | TypeScript (strict) | |
| Framework | React 18.3.1 | |
| Build | Vite 7.3.1 | |
| Styling | TailwindCSS | |
| UI Library | shadcn/ui + Radix | |
| Server State | React Query | |
| Auth State | Context API | |
| Routing | React Router DOM v6 | |
| Forms | React Hook Form + Zod | |
| HTTP | Axios | Interceptors for JWT refresh |

## Backend Architecture

### Directory Structure

```
backend/
├── media/                 # User uploads (git-ignored)
├── config/                # Settings (base, dev, prod), root URLs
├── apps/                  # Domain logic — models, business rules
│   ├── profiles/          # UserProfile (enhanced with showcase fields)
│   ├── events/            # Event, EventCategory, event lifecycle logic
│   ├── needs/             # EventNeed, NeedApplication
│   ├── vendors/           # VendorService, vendor classification
│   ├── tickets/           # Ticket, attendance tracking
│   ├── requests/          # EventRequest, RequestUpvote
│   └── content_generator/ # AI content generation (placeholder)
├── api/                   # Transport layer — serializers, views, URLs
│   └── v1/
│       ├── auth/          # Registration, login, token refresh
│       ├── profiles/      # Profile CRUD + public showcase
│       ├── events/        # Event CRUD + categories + lifecycle actions
│       ├── needs/         # Event needs + vendor applications
│       ├── vendors/       # Vendor service listings
│       ├── tickets/       # Ticket purchase + management
│       ├── requests/      # Event requests + upvotes
│       └── feed/          # Aggregated home feed
└── core/                  # Shared utilities
    ├── responses.py       # Standardized {success, message, data, meta}
    ├── serializers.py
    ├── exceptions.py
    └── ai.py
```

### Key Patterns

- Apps own models and business logic. API layer is transport only.
- All responses follow a unified envelope: `{ success, message, data, meta }`.
- JWT authentication is required by default on all endpoints.
- Database is ephemeral in dev — no migration files, reset via `reset_database.py`.
- Each new model MUST be registered in its app's `admin.py` immediately.

### Abstract Backend Responsibility Areas

Beyond CRUD, the backend must support these conceptual responsibility areas. These do not yet map 1:1 to Django apps or API endpoints — they represent **capabilities the system must have**.

| Responsibility Area | What It Does | Key Questions |
| :--- | :--- | :--- |
| **Event State Machine** | Manages transitions between event states (draft, scheduled, at-risk, substituted, postponed, cancelled, completed). | What conditions trigger each transition? Which transitions require human approval? |
| **Vendor Assignment & Classification** | Attaches vendors to events with role (primary/standby), visibility (customer-facing/operational), and criticality (essential/replaceable/non-substitutable) metadata. | How is classification set — organiser input? System inference? Both? |
| **Substitution Engine** | When a primary vendor fails, determines whether a standby exists, whether the substitution is material, and what actions are required. | What makes a substitution "material"? Who decides? |
| **Attendance Threshold Evaluation** | Monitors ticket sales against viability thresholds. Surfaces signals when attendance is low. | Are thresholds per-event? Platform defaults? Who acts on the signal? |
| **Recurring Series Orchestration** | Manages series templates, occurrence generation, and carry-forward defaults without carrying transactional commitments. | How far ahead are occurrences generated? How do we prevent duplicate generations? |
| **Notification Dispatch** | Determines who needs to be told what, when. Distinguishes between customer-facing notifications and internal operational alerts. | What changes trigger notifications? What's the SLA? |
| **Decision Audit Trail** | Records all state transitions, who initiated them, why, and what alternatives were considered. | What level of detail? Is this queryable for dispute resolution? |
| **Refund & Compensation Logic** | Handles downstream financial consequences of cancellations and material changes. | Automated vs manual? Refund policies per-event or platform-wide? |
| **Risk Assessment** | Evaluates event health based on vendor status, attendance, and external factors. Surfaces risk to organisers and admins. | How is risk scored? What thresholds trigger at-risk status? |

These responsibility areas will influence future app design, service layer architecture, and potentially background task infrastructure (Celery, etc.).

## Frontend Architecture

### Directory Structure

```
frontend/src/
├── api/                   # Axios client, interceptors
├── components/            # Shared UI
│   ├── ui/               # shadcn/ui primitives
│   └── Navbar.tsx        # Top navigation
├── features/              # Domain logic (context, hooks, API calls)
│   ├── auth/             # AuthContext, hooks, API calls (existing)
│   ├── events/           # Event API, hooks, types
│   ├── vendors/          # Vendor services, applications
│   ├── requests/         # Event requests, upvotes
│   ├── tickets/          # Ticket purchase, management
│   └── feed/             # Home feed aggregation
├── pages/                 # Route-level components
│   ├── home/             # Home feed page
│   ├── auth/             # Sign in, sign up (existing)
│   │   ├── signin/
│   │   └── signup/
│   ├── events/           # Browse, detail, create, manage
│   ├── requests/         # Browse requests, create request
│   ├── vendors/          # Browse vendor services
│   ├── showcase/         # Public user showcase (/u/:username)
│   ├── dashboard/        # Personal hub (my events, tickets, services)
│   └── profile/          # Edit profile/showcase (existing, enhanced)
│       └── sections/
├── routes/                # Route config, guards
├── theme/                 # Route-specific theming
├── types/                 # Shared TypeScript types
└── utils/                 # Utility functions
```

### Key Patterns

- Features encapsulate domain logic (context, hooks, API calls) per domain.
- Pages are route-level components, organized by URL structure.
- `RoleGuard` protects routes based on authentication state.
- Vite proxies `/api` requests to the backend.
- Each feature module exports its own API functions, hooks, and types.

## Data Flow

### General Request Cycle

```
User Action → React Component → Feature Hook (React Query)
  → Axios Client → Django View → Serializer → Model → DB
  ← Standardized Response {success, message, data, meta}
  ← React Query Cache → Component re-render
```

### Home Feed Flow

```
Page Load → GET /api/feed/
  → Backend aggregates: recent events + open needs + popular requests
  ← Mixed feed items with type discriminator
  → Frontend renders typed cards (EventCard, NeedCard, RequestCard)
```

### Vendor Application Flow

```
Vendor sees EventNeed → POST /api/events/:id/needs/:need_id/apply/
  → Creates NeedApplication (pending)
  → Organiser reviews in event manage page
  → Organiser accepts/rejects → PATCH application status
  → Vendor notified (future: notifications)
```

### Event Lifecycle Flow (Conceptual)

```
Organiser creates event → Draft
  → Adds vendors (primary + standby), sets details → Scheduled
  → Primary vendor drops out → At-Risk (internal)
  → Standby activated → Substituted
  → Is substitution material?
    → Yes: Notify goers, offer refund option → Scheduled (modified)
    → No: Internal swap only → Scheduled
  → Event date arrives → Completed
```

See [SCENARIOS.md](./SCENARIOS.md) for the full scenario inventory.

## File Storage

### Development — Django Media Files

All user-uploaded files (avatars, cover photos, event covers, portfolio images) use Django's `ImageField` / `FileField` and are stored locally on disk during development.

```
backend/
├── media/                    # User uploads (git-ignored)
│   ├── avatars/              # UserProfile.avatar
│   ├── covers/               # UserProfile.cover_photo
│   ├── events/               # Event.cover_image
│   └── portfolios/           # VendorService portfolio images
```

- **Django setting**: `MEDIA_ROOT = BASE_DIR / 'media'`, `MEDIA_URL = '/media/'`
- **Dev server**: Django's `static()` helper serves media files in development
- **Upload limits**: 5 MB per image, validated on both frontend and backend
- **Accepted formats**: JPEG, PNG, WebP
- **Frontend**: Uses `multipart/form-data` for any request that includes file uploads
- **Vite proxy**: Add `/media` proxy alongside `/api` to route media requests to Django in dev

### Production — Object Storage (Future)

Production will use S3-compatible object storage with Django Storages. The `ImageField` / `FileField` abstraction means the switch requires only a settings change, no code changes.

## Open Questions

<!-- TBD: Caching layer (Redis?) — especially for feed aggregation -->
<!-- TBD: Background tasks (Celery?) — for notifications, substitution logic, threshold checks -->
<!-- TBD: Search (Postgres full-text? Elasticsearch?) -->
<!-- TBD: Real-time (WebSockets for notifications, event status updates?) -->
<!-- TBD: How does the event state machine live in code? Django FSM? Custom? -->
<!-- TBD: Audit trail implementation — separate table? Django signals? Event sourcing? -->

---

### Changelog

| Date | Change |
| :--- | :--- |
| 2026-02-28 | Initial draft from codebase analysis |
| 2026-02-28 | Added all new apps, frontend feature modules, data flow diagrams |
| 2026-02-28 | Added abstract backend responsibility areas, event lifecycle flow, decision engine framing |
| 2026-02-28 | Resolved file storage: Django media files (ImageField) in dev, S3 in prod. Added media/ directory and proxy config. |
