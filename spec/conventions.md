---
title: Conventions & Reality Flags
status: living
last-updated: 2026-05-16
---

# Conventions & Reality Flags

The rules to follow, and the honest list of what's currently off so you don't copy a wart or assume a guarantee that isn't there.

## TL;DR

- Wrap success and view-built errors in the `{ success, message, data, meta }` envelope. (Reality: auth **401s are not enveloped** — raw DRF `{detail}`. Known gap, see flags.)
- Models + logic in `apps/`; transport in `api/v1/`. One editable `0001_initial` per app — never `0002_*`.
- Roles are behaviors: gate by **object ownership in the view**, never by route or account flag.
- Chat opens as a single global drawer; URL stays unchanged.
- Several things are declared-but-not-enforced or inconsistent — see "Known reality flags". Don't build on them as if guaranteed.

## Do

- **Envelope always** — return via `core.responses.success_response` / `error_response`. Frontend reads `.data` from the returned envelope (no unwrapping interceptor).
- **Layering** — models and business logic in `apps/<domain>/`; views/serializers/urls in `api/v1/<domain>/`. Non-trivial logic → `apps/<domain>/services.py` (only `profiles`/`tickets` have one today; create one when needed).
- **Migrations** — edit the single `0001_initial.py` in place, then reset + reseed (`python manage.py chats`). See [workflows.md](workflows.md).
- **Register every new model** in its app's `admin.py` (admin is the ops UI).
- **Permissions** — set `permission_classes` explicitly per view; check object ownership inline (`if obj.owner != request.user → 403`). Mark public endpoints `AllowAny` explicitly.
- **Pagination/filtering** — match existing code: parse `page`/`page_size`/filter params from `query_params`, build `meta` by hand.
- **File uploads** — `multipart/form-data`, `ImageField`, validate via `core.validators.validate_image_upload`.
- **Frontend types** — import `ApiResponse<T>` from `src/types/api.ts` (canonical), not `src/api/types.ts`.
- **React Query** — per-domain `hooks.ts` wrapping `api.ts`; domain-prefixed array keys; invalidate on mutation.
- **New UI** — prefer Tailwind + the hand-maintained `components/ui` primitives.
- **Chat** — single global drawer, URL unchanged; new chat work targets `apps.chat` (`ChatMessage` + `thread_key`).
- **Ports** — backend `:8998`, frontend `:5995`. `make dev` runs both.

## Don't

- Don't return raw DRF `Response`/dicts, and don't add an interceptor that unwraps the envelope.
- Don't put business logic in `api/` (transport only).
- Don't create `0002_*`/`0003_*` migrations; don't `makemigrations` for incremental changes.
- Don't gate product capabilities by route or a role/account flag — gate per-object server-side. Only Admin (`is_staff`/`is_superuser`) is a real account attribute.
- Don't assume the event lifecycle state machine guards anything — it doesn't (see flags).
- Don't add `DjangoFilterBackend`, ViewSets, routers, or generics to "modernize" one endpoint — the codebase is 100% `APIView`; consistency wins.
- Don't extend the legacy event-messaging models; don't reference the old `ChatDrawer` as a design source.
- Don't add more MUI where Tailwind/shadcn fits; don't add more secrets to `localStorage`.
- Don't rely on lint/tests as a safety net — frontend lint disables most correctness rules and there are no tests anywhere.

## Known reality flags

These are true *today*. They're not aspirational TODOs in disguise — they describe current behavior. If you fix one, update the relevant spec doc.

1. **Event lifecycle is not guarded.** `Event.ALLOWED_LIFECYCLE_TRANSITIONS` is declared but `can_transition_to()` ignores it (explicit "temporary product rule: allow any transition"). Transitions are audited (`EventLifecycleTransition`) but not validated; `at_risk` is not actually hidden from goers by enforcement. [domain.md](domain.md#event-lifecycle)
2. **Two chat systems coexist.** Legacy `apps.events` (`EventHostVendorMessage`, `EventPrivateConversation/Message`, and the `events/conversations*` endpoints) runs in parallel with the newer unified `apps.chat`. New work → `apps.chat`. `chat/thread-insights/` is Phase 2 and returns empty for event threads.
3. **Dual UI stacks.** Tailwind + shadcn-style primitives *and* MUI/Emotion (auth pages are pure MUI). No single design system.
4. **Two `ApiResponse<T>` types.** `src/api/types.ts` (loose) vs `src/types/api.ts` (canonical `{success,message,data,meta}`). Use the canonical one.
5. **Configured-but-unused infra.** `django-filter` installed, never used. `StandardPagination` is the configured paginator but views paginate manually. `python-dotenv` is a dependency but settings never call `load_dotenv()` (Django does not auto-load `.env`).
6. **`apps.content_generator`** is an installed app with no models/views/tests — a stub.
7. **No automated tests** (backend or frontend); no test runner on the frontend. Frontend ESLint disables `no-explicit-any`, `no-unused-vars`, all `react-hooks/*`. Backend lint (black/isort/flake8/pylint) is real; "Pylint 10/10" is a tuned target, not a proven/CI-verified fact. `.ruff_cache/` at repo root is incidental — ruff is not in the pipeline.
8. **Envelope is not universal.** Authentication **401s bypass the envelope** and return raw DRF `{"detail": …}` (or SimpleJWT `{"detail","code","messages"}` for a bad token) — verified at runtime across multiple endpoints. View-built 400/404/403 are enveloped but with `error_code:"ERROR"` unless a custom code is set; `custom_exception_handler` rarely fires for common cases. Clients must key off HTTP status, not assume `success:false`. ([api.md](api.md) → "Error shapes")
9. **Auth warts.** `LoginSimple.tsx` stores `last_username`/`last_password` in plaintext `localStorage`. The 401-refresh interceptor uses bare `axios` and hard-redirects on failure. Login is custom (not SimpleJWT `TokenObtainPair`); only `TokenRefreshView` is wired.
10. **Tooling drift.** Makefile `reset-db` calls a nonexistent `reset_database.py` — the working reset is `python manage.py chats`. Many frontend routes are commented out in `routes.config.ts` though their backends may exist.
11. **Security defaults.** Default `SECRET_KEY` is an insecure placeholder; production CORS defaults to allow-all when unconfigured; `DevAuthentication` is a credential-free backdoor gated only by `DEV_USER_EMAIL` (development settings).

When in doubt, read the code and follow the neighbor. Cross-refs: [backend.md](backend.md), [frontend.md](frontend.md), [workflows.md](workflows.md).
