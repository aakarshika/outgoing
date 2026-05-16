---
title: Architecture
status: living
last-updated: 2026-05-16
---

# Architecture

System design, stack, layout, and the trade-offs you'll actually hit.

## TL;DR

- **Backend:** Django 5.2.11 + DRF 3.16 + SimpleJWT. `apps/` owns models + business logic; `api/v1/` is the transport layer (views/serializers/urls). Every response uses the `{ success, message, data, meta }` envelope.
- **Frontend:** React 18 + Vite 7 + TS + React Query 5 + axios + Tailwind/shadcn (+ MUI in places). Feature modules under `src/features/`, route pages under `src/pages/`.
- **Connection:** Vite dev proxy sends `/api` and `/media` to Django on `:8998`; frontend on `:5995` (HTTPS via basic-ssl). Prod proxying via Vercel rewrites.
- **DB:** one engine story — `dj-database-url`, defaults to local **SQLite**, prod uses **Supabase Postgres** via `DATABASE_URL`. Single editable `0001_initial` per app; no incremental migrations ([workflows.md](workflows.md)).
- **Known trade-offs:** state machine declared but bypassed; two chat systems; dual UI stacks (Tailwind+MUI); `django-filter` installed but unused; manual pagination despite a configured paginator; no tests.

## Stack & why

| Layer | Choice | Version | Why |
|---|---|---|---|
| Web framework | Django | 5.2.11 | Batteries-included; admin doubles as the ops UI |
| API | DRF | 3.16.1 | Serializers + class-based views; schema via drf-spectacular |
| Auth | djangorestframework-simplejwt | 5.5.1 | Stateless JWT; refresh rotation on |
| DB access | dj-database-url + psycopg2 | — | One config path, swap engine by env var |
| Storage | django-storages + boto3 | — | Supabase S3-compatible in prod; local FS in dev |
| Deploy | Vercel (`@vercel/python`) | — | `index.py` entry, `config.settings.production` |
| UI framework | React | 18.3 | — |
| Build | Vite | 7.x | Fast dev, proxy, basic-ssl for LAN HTTPS |
| Server state | @tanstack/react-query | 5.x | Caching/invalidation; no Redux/Zustand |
| HTTP | axios | 1.6 | Interceptors for JWT + 401 refresh |
| Styling | Tailwind 3 + shadcn-style primitives | — | Plus MUI/Emotion in some pages (see trade-offs) |

## Repo layout

### Backend (`backend/`)

```
config/          settings/{base,development,production}.py, urls.py, wsgi.py
api/             transport only — api/v1/<domain>/{urls,views,serializers}.py
                 domains: auth profiles events tickets feed vendors needs requests alerts chat
apps/            domain + models + business logic
                 profiles events tickets vendors needs requests chat content_generator(stub)
core/            shared infra: responses.py (envelope), exceptions.py, pagination.py,
                 authentication.py (dev backdoor), serializers.py, ai.py (OpenAI wrapper)
manage.py        defaults to config.settings.development
index.py         Vercel entrypoint → config.settings.production
```

`api/` contains **no models**. Models live only under `apps/`. `core` is an installed app with no models (pure infra).

### Frontend (`frontend/src/`)

```
api/         client.ts (axios instance + interceptors), types.ts
features/     domain modules: <domain>/{api.ts, hooks.ts, components} (auth/ also AuthContext)
pages/        route-target page components (lazy-loaded)
routes/       routes.config.ts (central route table), AppRoutes.tsx, RoleGuard.tsx
components/   shared UI; components/ui = hand-maintained shadcn-style primitives
types/        shared TS types mirroring backend serializers
theme/        ThemeProvider/BackgroundProvider/ThemeWrapper (runtime + per-route theme)
lib/          utils.ts (cn helper)
```

Hybrid structure: **feature-based** for domain/data (`features/`), **layer-based** for routing/shared UI (`pages/`, `components/`).

## How the pieces connect

1. Browser hits the Vite dev server on `:5995`.
2. Vite proxies `/api/*` and `/media/*` to Django on `:8998` (`changeOrigin: false`, intentional so Django builds absolute media URLs against the frontend origin).
3. axios `client` (baseURL `/api`) attaches `Authorization: Bearer <token>` from `localStorage`.
4. Django returns the envelope; the frontend **does not** unwrap it in an interceptor — each `features/<domain>/api.ts` function returns the full envelope and consumers read `.data`.
5. On `401`, the axios response interceptor calls `POST /api/auth/token/refresh/` once (`_retry` guard); on failure it clears tokens and hard-redirects to `/signin`.

Production: `frontend/vercel.json` rewrites proxy to the deployed backend; backend on Vercel with Supabase Postgres + Supabase S3 storage + WhiteNoise static.

## Key patterns

- **Envelope everywhere** — `core/responses.py` `success_response`/`error_response`; DRF exceptions wrapped by `core/exceptions.custom_exception_handler`. See [api.md](api.md).
- **apps own logic, api is transport** — see [backend.md](backend.md). Logic is mostly fat-in-views; only `apps/profiles/services.py` and `apps/tickets/services.py` are real service layers.
- **JWT auto-refresh** — single interceptor, access 24h / refresh 30d, rotation on.
- **Per-resource React Query hooks** — `features/<domain>/hooks.ts` wrapping `features/<domain>/api.ts`; array query keys (`['event', id]`, `['feed', params]`).
- **Central route table** — `routes.config.ts` → `RoleGuard` gates by auth/role; product capability is gated per-object server-side, not by route.

## Database story (resolves an old doc conflict)

There is **one** story. `config/settings/base.py` uses `dj_database_url.config(default="sqlite:///…/db.sqlite3", conn_max_age=0)`. No `DATABASE_URL` → local SQLite. `DATABASE_URL` set → Supabase Postgres (`conn_max_age=0` is required for Supabase's transaction-mode pooler). It is **not in-memory**. "Ephemeral" refers to the *migration workflow* (single `0001_initial` per app, wipe-and-reseed), not the engine. Details in [workflows.md](workflows.md).

## Known architectural trade-offs

These are real and load-bearing — don't design around assumptions they break:

- **Lifecycle state machine declared but bypassed** — `Event.ALLOWED_LIFECYCLE_TRANSITIONS` exists; `can_transition_to()` ignores it ("temporary product rule: allow any transition"). See [domain.md](domain.md#event-lifecycle).
- **Two chat systems** — legacy per-event models in `apps.events` (`EventHostVendorMessage`, `EventPrivateConversation/Message`) and the newer unified `apps.chat` (`ChatMessage` + `thread_key`). New chat work goes in `apps.chat`.
- **Dual UI stacks** — Tailwind + shadcn-style primitives *and* MUI/Emotion, mixed per page (auth pages are pure MUI). New UI should prefer Tailwind/shadcn.
- **Configured-but-unused infra** — `django-filter` installed, never used (filtering is manual via `request.query_params`); `StandardPagination` configured but views paginate manually and build `meta` by hand.
- **Two conflicting `ApiResponse<T>` types** on the frontend (`src/api/types.ts` loose vs `src/types/api.ts` canonical) — use `src/types/api.ts`.
- **No automated tests** anywhere; frontend lint disables most correctness rules. Be conservative.

Full do/don't list and the complete reality-flag inventory: [conventions.md](conventions.md).
