# API Specification [DRAFT]

## Conventions

- **Base URL**: `/api/`
- **Auth**: JWT Bearer token required on all endpoints unless marked `[Public]`
- **Response envelope**: All responses follow this structure:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { },
  "meta": { }
}
```

- **Error responses** return `success: false` with appropriate HTTP status codes.
- **Pagination**: List endpoints return `meta.page`, `meta.page_size`, `meta.total_count`.
- **Filtering**: List endpoints accept query params documented per-endpoint.
- **File uploads**: Endpoints that accept file uploads use `multipart/form-data` instead of JSON. These are noted with `[File Upload]`.

---

## Authentication Endpoints

### `POST /api/auth/signup/` [Public]

Create a new user account. Auto-creates `UserProfile`.

**Request**:
```json
{
  "username": "string",
  "email": "string",
  "first_name": "string",
  "last_name": "string",
  "phone_number": "string",
  "password": "string"
}
```

**Response** `201`:
```json
{
  "success": true,
  "message": "Account created",
  "data": {
    "access": "jwt-access-token",
    "refresh": "jwt-refresh-token"
  }
}
```

### `POST /api/auth/signin/` [Public]

Authenticate and receive tokens.

**Request**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "access": "jwt-access-token",
    "refresh": "jwt-refresh-token"
  }
}
```

### `GET /api/auth/me/`

Get current authenticated user info.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string"
  }
}
```

### `POST /api/auth/token/refresh/` [Public]

Refresh an expired access token.

**Request**:
```json
{
  "refresh": "jwt-refresh-token"
}
```

**Response** `200`:
```json
{
  "access": "new-jwt-access-token"
}
```

---

## Profile Endpoints

### `GET /api/profiles/me/`

Get current user's profile (private, full data).

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "phone_number": "string",
    "bio": "string",
    "headline": "string",
    "showcase_bio": "string",
    "avatar": "url",
    "cover_photo": "url",
    "is_vendor": false,
    "location_city": "string",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
}
```

### `PATCH /api/profiles/me/` [File Upload]

Update current user's profile. All fields optional. Use `multipart/form-data` when uploading avatar or cover photo; JSON otherwise.

**Request** (partial, `multipart/form-data` if files included):

| Field | Type | Notes |
| :--- | :--- | :--- |
| phone_number | string | |
| bio | string | |
| headline | string | |
| showcase_bio | string | |
| avatar | file (image) | JPEG/PNG/WebP, max 5 MB |
| cover_photo | file (image) | JPEG/PNG/WebP, max 5 MB |
| is_vendor | boolean | |
| location_city | string | |

**Response** `200`: Same shape as GET. Image fields return full URL paths.

### `GET /api/profiles/:username/` [Public]

Public showcase page data for a user. Returns their profile info plus their public activity.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "username": "string",
    "first_name": "string",
    "last_name": "string",
    "headline": "string",
    "showcase_bio": "string",
    "avatar": "url",
    "cover_photo": "url",
    "location_city": "string",
    "hosted_events": [ ],
    "vendor_services": [ ],
    "is_vendor": false
  }
}
```

---

## Event Endpoints

### `GET /api/events/` [Public]

List/search events. Enriched with social proof, vendor lineup, and open needs for card rendering.

**Query params**: `?category=`, `?status=published`, `?start_after=`, `?start_before=`, `?search=`, `?page=`, `?page_size=`

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "host": { "username": "string", "avatar": "url" },
      "title": "string",
      "slug": "string",
      "category": { "id": 1, "name": "string", "slug": "string", "icon": "string" },
      "location_name": "string",
      "start_time": "datetime",
      "end_time": "datetime",
      "ticket_price_standard": "25.00",
      "ticket_price_flexible": "30.00",
      "cover_image": "url",
      "status": "published",
      "capacity": 100,
      "interest_count": 42,
      "ticket_count": 18,
      "confirmed_vendors": [
        { "username": "djmike", "avatar": "url", "category": "DJ" },
        { "username": "chefanna", "avatar": "url", "category": "Catering" }
      ],
      "open_needs": [
        { "id": 3, "title": "Security team", "category": "Security", "status": "open" }
      ],
      "user_is_interested": false,
      "user_has_ticket": false
    }
  ],
  "meta": { "page": 1, "page_size": 20, "total_count": 85 }
}
```

Note: `user_is_interested` and `user_has_ticket` are only present when the request is authenticated. `confirmed_vendors` includes only customer-facing vendors with accepted applications.

### `POST /api/events/` [File Upload]

Create a new event. Authenticated user becomes the host. Use `multipart/form-data` to include cover image upload.

**Request** (`multipart/form-data`):

| Field | Type | Notes |
| :--- | :--- | :--- |
| title | string | Required |
| description | string | Required |
| category_id | int | Required |
| location_name | string | Required |
| location_address | string | Required |
| latitude | decimal | Optional |
| longitude | decimal | Optional |
| start_time | datetime | Required |
| end_time | datetime | Required |
| capacity | int | Optional (null = unlimited) |
| ticket_price_standard | decimal | Optional (null = free) |
| ticket_price_flexible | decimal | Optional |
| refund_window_hours | int | Default 24 |
| cover_image | file (image) | Optional. JPEG/PNG/WebP, max 5 MB |
| status | string | `draft` or `published`. Default `draft` |
| tags | JSON string | Array of strings, sent as JSON-encoded string in multipart |

**Response** `201`: Full event object.

### `GET /api/events/:id/` [Public]

Event detail. Includes needs summary and ticket availability.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "host": { "username": "string", "first_name": "string", "avatar": "url" },
    "title": "string",
    "slug": "string",
    "description": "string",
    "category": { "id": 1, "name": "string", "icon": "string" },
    "location_name": "string",
    "location_address": "string",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "start_time": "datetime",
    "end_time": "datetime",
    "capacity": 100,
    "ticket_price_standard": "25.00",
    "ticket_price_flexible": "30.00",
    "refund_window_hours": 24,
    "tickets_remaining": 58,
    "interest_count": 42,
    "ticket_count": 18,
    "cover_image": "url",
    "status": "published",
    "tags": ["music", "outdoor"],
    "confirmed_vendors": [
      { "username": "djmike", "first_name": "Mike", "avatar": "url", "category": "DJ" }
    ],
    "needs": [
      { "id": 1, "title": "string", "category": "string", "status": "open", "application_count": 3 }
    ],
    "user_is_interested": false,
    "user_has_ticket": false,
    "created_at": "datetime"
  }
}
```

### `PATCH /api/events/:id/`

Update event. Host only.

**Request**: Partial event fields. **Response** `200`: Updated event object.

### `DELETE /api/events/:id/`

Cancel event (sets status to `cancelled`). Host only.

**Response** `200`: Confirmation message.

### `GET /api/events/categories/` [Public]

List all event categories.

**Response** `200`:
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Music", "slug": "music", "icon": "music" }
  ]
}
```

### `GET /api/events/my/`

List events the authenticated user is hosting.

**Query params**: `?status=`

**Response** `200`: Array of event summary objects.

---

## Event Interest Endpoints

### `POST /api/events/:id/interest/`

Mark interest in an event. Authenticated user. Increments the event's `interest_count`.

**Request**: Empty body.

**Response** `201`:
```json
{
  "success": true,
  "data": {
    "interest_count": 43
  }
}
```

**Errors**: `409` if already interested.

### `DELETE /api/events/:id/interest/`

Remove interest from an event. Authenticated user. Decrements the event's `interest_count`.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "interest_count": 42
  }
}
```

**Errors**: `404` if not currently interested.

---

## Event Need Endpoints

### `GET /api/events/:id/needs/` [Public]

List needs for an event.

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "DJ for Saturday night",
      "description": "string",
      "category": "DJ",
      "budget_min": "200.00",
      "budget_max": "500.00",
      "status": "open",
      "application_count": 3,
      "created_at": "datetime"
    }
  ]
}
```

### `POST /api/events/:id/needs/`

Create a need on an event. Host only.

**Request**:
```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "budget_min": "200.00",
  "budget_max": "500.00"
}
```

**Response** `201`: Need object.

### `PATCH /api/events/:id/needs/:need_id/`

Update a need. Host only.

### `POST /api/events/:id/needs/:need_id/apply/`

Apply to fulfill a need. Authenticated vendor.

**Request**:
```json
{
  "message": "string",
  "price_quote": "350.00",
  "vendor_service_id": 1
}
```

**Response** `201`: Application object.

### `GET /api/events/:id/needs/:need_id/applications/`

List applications for a need. Host only.

**Response** `200`: Array of application objects with vendor info.

### `PATCH /api/events/:id/needs/:need_id/applications/:app_id/`

Accept or reject an application. Host only.

**Request**:
```json
{
  "status": "accepted"
}
```

**Response** `200`: Updated application. If accepted, need status changes to `fulfilled`.

---

## Ticket Endpoints

### `POST /api/events/:id/tickets/`

Purchase/reserve a ticket for an event. Authenticated user.

**Request**:
```json
{
  "ticket_type": "standard"
}
```

`ticket_type` must be `standard` (non-refundable) or `flexible` (refundable). Price is determined by the event's `ticket_price_standard` or `ticket_price_flexible`. For free events, type is ignored.

**Response** `201`:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "event": { "id": 1, "title": "string" },
    "ticket_type": "standard",
    "is_refundable": false,
    "refund_deadline": null,
    "price_paid": "25.00",
    "status": "active",
    "purchased_at": "datetime"
  }
}
```

**Errors**: `400` if sold out, `400` if already has ticket, `400` if invalid ticket_type.

### `GET /api/tickets/my/`

List all tickets for the authenticated user across all events.

**Query params**: `?status=active`, `?upcoming=true`

**Response** `200`: Array of ticket objects with event summary.

---

## Vendor Service Endpoints

### `GET /api/vendors/` [Public]

Browse vendor services.

**Query params**: `?category=`, `?search=`, `?page=`

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "vendor": { "username": "string", "first_name": "string", "avatar": "url" },
      "title": "Wedding Photography",
      "description": "string",
      "category": "Photography",
      "price_min": "500.00",
      "price_max": "2000.00",
      "portfolio_images": ["url", "url"],
      "is_active": true
    }
  ],
  "meta": { "page": 1, "page_size": 20, "total_count": 34 }
}
```

### `POST /api/vendors/services/`

Create a vendor service listing. User must have `is_vendor: true`.

**Request** (JSON):
```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "price_min": "500.00",
  "price_max": "2000.00"
}
```

**Response** `201`: Service object.

### `POST /api/vendors/services/:id/images/` [File Upload]

Upload a portfolio image to a vendor service. Owner only. Use `multipart/form-data`.

**Request**: `image` field (file, JPEG/PNG/WebP, max 5 MB).

**Response** `201`:
```json
{
  "success": true,
  "data": {
    "url": "/media/portfolios/filename.jpg",
    "portfolio_images": ["/media/portfolios/a.jpg", "/media/portfolios/b.jpg"]
  }
}
```

### `DELETE /api/vendors/services/:id/images/`

Remove a portfolio image. Owner only.

**Request**: `{ "url": "/media/portfolios/filename.jpg" }`

**Response** `200`: Updated `portfolio_images` array.

### `PATCH /api/vendors/services/:id/`

Update a service listing. Owner only.

### `DELETE /api/vendors/services/:id/`

Remove a service listing. Owner only.

### `GET /api/vendors/my/services/`

List authenticated user's vendor services.

### `GET /api/vendors/my/applications/`

List authenticated user's need applications (as a vendor).

**Query params**: `?status=`

**Response** `200`: Array of application objects with event/need context.

---

## Event Request Endpoints

### `GET /api/requests/` [Public]

Browse event requests.

**Query params**: `?category=`, `?status=open`, `?sort=popular`, `?page=`

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "requester": { "username": "string", "avatar": "url" },
      "title": "Outdoor jazz night in Brooklyn",
      "description": "string",
      "desired_date_start": "2026-04-01",
      "desired_date_end": "2026-04-30",
      "desired_location": "Brooklyn, NY",
      "category": { "id": 1, "name": "Music" },
      "upvote_count": 42,
      "status": "open",
      "user_has_upvoted": false,
      "created_at": "datetime"
    }
  ],
  "meta": { "page": 1, "page_size": 20, "total_count": 15 }
}
```

### `POST /api/requests/`

Create an event request. Authenticated user.

**Request**:
```json
{
  "title": "string",
  "description": "string",
  "desired_date_start": "2026-04-01",
  "desired_date_end": "2026-04-30",
  "desired_location": "string",
  "category_id": 1
}
```

**Response** `201`: Request object.

### `POST /api/requests/:id/upvote/`

Upvote a request. Authenticated user.

**Response** `201`: `{ "upvote_count": 43 }`

### `DELETE /api/requests/:id/upvote/`

Remove upvote. Authenticated user.

**Response** `200`: `{ "upvote_count": 42 }`

### `PATCH /api/requests/:id/fulfill/`

Link an event to this request as its fulfillment. Host of the linked event only.

**Request**:
```json
{
  "event_id": 5
}
```

**Response** `200`: Updated request with `status: "fulfilled"` and `fulfilled_by` event summary.

---

## Feed Endpoint

### `GET /api/feed/` [Public]

Home feed. Returns events enriched with vendor lineups, open needs, and social proof — everything needed to render Event Cards.

**Query params**:
- `?category=` — filter by category slug
- `?featured=true` — returns only the single featured/trending event (for hero section)
- `?sort=trending|newest|popular` — sort order (default: `trending`)
- `?lat=` / `?lng=` — user's location for proximity sorting (optional, used by `trending`)
- `?page=` / `?page_size=` — pagination (default page_size: 20)

**Trending algorithm** (for `sort=trending` and `featured=true`): A simple weighted score combining:
1. **Location proximity** — events closer to the user's lat/lng are boosted (if provided)
2. **Interest match** — events in categories the user has previously shown interest in (EventInterest history) are boosted
3. **Interest count** — higher `interest_count` relative to recency

This is deliberately simple for Phase 1 and will be refined over time.

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "host": { "username": "string", "avatar": "url" },
      "title": "string",
      "slug": "string",
      "category": { "id": 1, "name": "string", "slug": "string", "icon": "string" },
      "location_name": "string",
      "start_time": "datetime",
      "end_time": "datetime",
      "ticket_price_standard": "25.00",
      "ticket_price_flexible": "30.00",
      "cover_image": "url",
      "status": "published",
      "capacity": 100,
      "interest_count": 42,
      "ticket_count": 18,
      "confirmed_vendors": [
        { "username": "djmike", "avatar": "url", "category": "DJ" }
      ],
      "open_needs": [
        { "id": 3, "title": "Security team", "category": "Security", "status": "open" }
      ],
      "user_is_interested": false,
      "user_has_ticket": false
    }
  ],
  "meta": { "page": 1, "page_size": 20, "total_count": 85 }
}
```

Each item in `data` is a fully enriched event object suitable for rendering an Event Card. `user_is_interested` and `user_has_ticket` are only present for authenticated requests.

---

## Error Codes

| HTTP Status | Meaning |
| :--- | :--- |
| 400 | Bad request / validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (e.g. not the host, not a vendor) |
| 404 | Not found |
| 409 | Conflict (e.g. already has ticket, already upvoted) |
| 500 | Server error |

## Auto-Generated Docs

- Swagger UI: `http://localhost:8998/api/docs/`
- ReDoc: `http://localhost:8998/api/redoc/`

---

### Changelog

| Date | Change |
| :--- | :--- |
| 2026-02-28 | Initial draft with existing auth + profile endpoints |
| 2026-02-28 | Full API surface: events, needs, tickets, vendors, requests, feed |
| 2026-02-28 | Added interest endpoints. Enriched event listing with social proof, vendors, needs. Updated ticket purchase with ticket_type. Dual pricing on events. Event-centric feed endpoint. |
| 2026-02-28 | File upload convention (multipart/form-data). Profile and event creation accept image uploads. Vendor portfolio image upload/delete endpoints. Trending algorithm defined. Feed accepts lat/lng. |
