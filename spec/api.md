---
title: API Contract & Endpoints
status: living
last-updated: 2026-05-16
---

# API Contract & Endpoints

The envelope, auth, conventions, and the endpoint surface by domain. Endpoints are derived from `api/v1/*/urls.py`; the code is ground truth and live schema is at `/api/docs/` (drf-spectacular Swagger) and `/api/redoc/`.

## TL;DR

- Base path: **`/api/v1/`**. Auth: `Authorization: Bearer <access>`; default permission is authenticated, public endpoints are explicit.
- **Every** response is the envelope: success `{ success:true, message, data, meta }`; error `{ success:false, message, errors, error_code }`.
- Pagination is **manual** — list endpoints take `page`/`page_size` query params and return `meta:{page,page_size,total_count}`. The configured `StandardPagination` envelope is rarely the active path.
- `error_code` on caught DRF exceptions = the exception class name uppercased (e.g. `VALIDATIONERROR`, `NOTAUTHENTICATED`). Custom codes (e.g. `USERNAME_TAKEN`, `INVALID_CREDENTIALS`) are set explicitly in views.
- The root `/` returns a plain non-enveloped JSON; uncaught (non-DRF) exceptions fall through to Django's default 500 (not enveloped).

## Envelope

Defined in `core/responses.py`; DRF exceptions wrapped by `core/exceptions.custom_exception_handler`.

**Success** — `success_response(data, message="Success", meta=None, status=200)`:
```json
{ "success": true, "message": "...", "data": {}, "meta": {} }
```

**Error** — `error_response(message="Error", errors=None, error_code="ERROR", status=400)`:
```json
{ "success": false, "message": "...", "errors": { "field": ["detail"] }, "error_code": "..." }
```

**Paginated** (when DRF auto-pagination is the path; most lists build `meta` manually with the same shape):
```json
{ "success": true, "message": "List retrieved",
  "data": [], "meta": { "count": 0, "next": null, "previous": null } }
```

## Auth headers & lifecycle

- `Authorization: Bearer <access_token>`. Access token 24h, refresh 30d, refresh rotation on.
- Obtain tokens via `POST /api/v1/auth/signup/` or `signin/` (custom views — **not** the SimpleJWT `TokenObtainPair`). Refresh via `POST /api/v1/auth/token/refresh/`.
- Default DRF permission is `IsAuthenticated`. Public endpoints set `AllowAny` explicitly (signup/signin, public showcase, several feed/list reads).
- Dev only: `DevAuthentication` authenticates as `DEV_USER_EMAIL` with no credentials (development settings; never prod).

## Conventions

- Versioned under `/api/v1/`. New endpoints go in the matching `api/v1/<domain>/urls.py`.
- List filtering/sorting via explicit query params (e.g. `?category=`, `?sort=trending|newest`) — there is no generic filter backend.
- File uploads: `multipart/form-data`, `ImageField`, validated by `core.validators.validate_image_upload`. Media served at `/media/` (Vite-proxied in dev; only when `DEBUG`).
- URL ordering matters where specific segments precede `<str:...>` catch-alls (notably `profiles/`).

## Endpoints by domain

All paths relative to `/api/v1/`. Methods are per-view; list/create views are GET/POST, toggles POST/DELETE, detail views GET/PATCH/DELETE.

### auth
| Method | Path | Purpose |
|---|---|---|
| POST | `auth/signup/` | Register user + profile, returns `{user, access, refresh}` (public) |
| POST | `auth/signin/` | Authenticate, returns `{user, access, refresh}` (public) |
| GET | `auth/me/` | Current user |
| POST | `auth/token/refresh/` | SimpleJWT refresh |

### profiles
| GET/PATCH | `profiles/me/` | Own profile |
| GET | `profiles/activities/` | Own activity |
| GET | `profiles/by-id/<user_id>/` | Public showcase by id |
| GET | `profiles/<username>/` | Public showcase by username (catch-all, declared last) |

### events
Core: `"" ` (GET list / POST create), `events/<event_id>/` (detail), `events/autocomplete/`, `events/categories/`, `events/my/`, `events/my/interested/`.
Interest/attendance: `events/<event_id>/interest/`, `events/<event_id>/attendees/`, `events/<event_id>/view/`, `events/<event_id>/ticket_tiers/`, `events/<event_id>/addons/`.
Reviews/highlights: `events/<event_id>/highlights/`, `events/<event_id>/reviews/`, `events/highlights/<id>/like/`, `events/highlights/<id>/comments/`, `events/reviews/<id>/`, `events/reviews/<id>/like/`, `events/reviews/<id>/comments/`.
Lifecycle: `POST events/<event_id>/lifecycle/transition/`, `GET events/<event_id>/lifecycle/history/` (transition rules **not enforced** — see [domain.md](domain.md#event-lifecycle)).
Social/network: `events/friendships/`, `events/friendships/by-orbit-category/`, `events/friendships/by-user/<user_id>/by-category/`, `events/<event_id>/friendships/<target_username>/`, `events/network/people/`, `events/network/activity/`.
Messaging (legacy, parallel to `apps.chat`): `events/<event_id>/host-vendor-messages/`, `events/direct-messages/<target_username>/`, `events/conversations/`, `events/conversations/inbox/`, `events/conversations/<id>/messages/`, `events/<event_id>/get-or-create-conversation/`.

### event-series
`"" ` (list/create), `event-series/<series_id>/` (detail), `event-series/<series_id>/occurrences/`, `POST event-series/<series_id>/generate-occurrences/`.

### tickets
`GET tickets/my/`, `POST tickets/validate/`, `POST tickets/admit/`, `tickets/<pk>/` (detail), `POST tickets/events/<event_id>/` (purchase).

### feed
`feed/base/`, `feed/carousel/`, `feed/trending-highlights/`, `feed/recently-viewed/`, `feed/highlights/`, `feed/upcoming/`, `feed/iconic-hosts/`, `feed/top-vendors/`, `feed/` (composite).

### vendors
`"" ` (list/create), `vendors/my/`, `vendors/<service_id>/` (detail), `vendors/<service_id>/reviews/`.

### needs
`needs/events/<event_id>/` (list for event), `needs/<need_id>/` (detail), `POST needs/<need_id>/apply/`, `POST needs/<need_id>/invite/`, `needs/applications/<id>/review/`, `needs/applications/<id>/`, `GET needs/applications/my/`, `GET needs/invites/my/`, `GET needs/opportunities/all/`, `needs/opportunities/my/`, `needs/opportunities/potential/`.

### requests
`"" ` (GET list / POST create), `POST|DELETE requests/<id>/upvote/`, `POST|DELETE requests/<id>/wishlist/`.

### alerts
`alerts/` (composite), `alerts/event-overview/`. (No serializers — responses are hand-built dicts.)

### chat
`GET chat/conversations/`, `GET chat/thread-insights/?thread_key=` (Phase 2 — event threads return empty), `GET|POST chat/messages/?thread_key=`. `thread_key` namespaces: `user:<id>`, `event_public:<id>`, `event_vendor:<id>`, `special_group:<id>`.

When you add/change an endpoint, update this file and [backend.md](backend.md). Field shapes: [data-models.md](data-models.md).
