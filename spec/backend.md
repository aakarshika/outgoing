---
title: Backend — Working in Django/DRF
status: living
last-updated: 2026-05-16
---

# Backend — Working in Django/DRF

How this Django/DRF codebase is actually organized and how to add to it without fighting it.

## TL;DR

- Views are **100% class-based `APIView`** — no ViewSets, no generics, no routers, no `@api_view`. HTTP methods are explicit `get/post/patch/delete` returning the envelope.
- **Models + logic live in `apps/<domain>/`. Transport (views/serializers/urls) lives in `api/v1/<domain>/`.** No models in `api/`.
- Business logic is mostly **fat-in-views**. Only `apps/profiles/services.py` and `apps/tickets/services.py` are real service layers — follow that split for non-trivial logic.
- Every response goes through `core.responses.success_response` / `error_response`. Never return a raw `Response`/dict.
- Ownership/permission is checked **manually inside views** per object, not via permission classes.

## Layout

```
apps/<domain>/
  models.py          domain models (the only place models live)
  admin.py           register every model here
  signals.py         (events, tickets) if present
  services.py        (profiles, tickets only) non-trivial logic
  management/commands/  seed/reset commands
api/v1/<domain>/
  urls.py            path() list, no routers
  views.py           APIView subclasses
  serializers.py     ModelSerializer / Serializer (alerts has none — manual dicts)
core/
  responses.py       success_response(data, message, meta, status)
                     error_response(message, errors, error_code, status)
  exceptions.py      custom_exception_handler — wraps DRF exceptions in the envelope
  pagination.py      StandardPagination (configured but rarely the active path)
  authentication.py  DevAuthentication (env-gated dev backdoor)
```

Domains: `auth profiles events tickets feed vendors needs requests alerts chat`. `apps.content_generator` is an empty stub — ignore it.

## The view pattern

Every endpoint is an `APIView` with explicit method handlers and explicit `permission_classes`:

```python
class EventDetailView(APIView):
    permission_classes = [IsAuthenticated]  # or [AllowAny] for public reads

    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        return success_response(EventSerializer(event).data)

    def patch(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        if event.host != request.user:                      # manual object ownership
            return error_response("Not your event", status=403, error_code="FORBIDDEN")
        ...
        return success_response(EventSerializer(event).data, message="Updated")
```

- Default permission is `IsAuthenticated` (DRF setting). Public endpoints set `permission_classes = [AllowAny]` explicitly. Method-mixed access uses `get_permissions()` (public GET, auth POST) — see `RequestListCreateView`.
- **Ownership is never a permission class** — it's an inline `if obj.owner != request.user` check returning a 403 envelope. Keep doing this; it matches the "roles are behaviors, gate per-object" rule ([domain.md](domain.md)).

## Serializers

- Under `api/v1/<domain>/serializers.py`. Mostly `ModelSerializer`; separate `*CreateSerializer` for writes; heavy `SerializerMethodField` and `source=` (e.g. `requester_name = CharField(source="requester.username")`); nested read serializers.
- `alerts/` has **no serializers** — it builds dicts by hand. Don't treat that as the norm; new domains should use serializers.
- `drf_spectacular` `@extend_schema` is used inconsistently (auth/profiles have it; most don't). Adding it where you touch code is welcome but not enforced.

## Pagination & filtering (read this before adding a list endpoint)

- `core.pagination.StandardPagination` is the configured `DEFAULT_PAGINATION_CLASS`, **but almost no view uses DRF auto-pagination**. In practice list views parse `page`/`page_size` from `request.query_params` by hand and return `meta={"page", "page_size", "total_count"}`.
- `django-filter` is installed but **never imported anywhere**. Filtering/sorting is manual (`?category=`, `?sort=trending|newest` read from `query_params`).
- Match the surrounding code: manual params + manual `meta`. Don't introduce `DjangoFilterBackend` for one endpoint.

## Auth

- **Stock `django.contrib.auth.models.User`** — there is no custom user model. Profile data is `apps.profiles.UserProfile` (O2O, `related_name="profile"`), auto-created on signup.
- Signup/signin are **custom views** (`api/v1/auth/`), not `TokenObtainPairView`. Only `TokenRefreshView` is wired (`auth/token/refresh/`). Tokens minted via `apps.profiles.services.get_tokens_for_user`. Access 24h, refresh 30d, rotation on.
- Dev backdoor: `core.authentication.DevAuthentication` authenticates as `DEV_USER_EMAIL` with no credentials, **development settings only** (`make dev-noauth email=...`). Never enable in prod.
- No OTP/social auth. `phone_number` is just a profile field.

## How to add an endpoint

1. Model change? Edit the model in `apps/<domain>/models.py`, register it in that app's `admin.py`. **Edit the existing `0001_initial` migration in place — do not create `0002_*`** ([workflows.md](workflows.md)). Then reset+reseed the DB.
2. Add/extend a serializer in `api/v1/<domain>/serializers.py`.
3. Add an `APIView` in `api/v1/<domain>/views.py` with explicit `permission_classes`, explicit method handlers, manual ownership checks, returning `success_response`/`error_response`.
4. Wire it in `api/v1/<domain>/urls.py` with `path()`. URL ordering matters where specific paths precede `<str:...>` catch-alls (see `profiles/urls.py`).
5. Non-trivial logic → a function in `apps/<domain>/services.py` (create one if the domain doesn't have it; only profiles/tickets do today). Keep transaction boundaries there.
6. Update [api.md](api.md) and, if data changed, [data-models.md](data-models.md).

## Anti-patterns (don't)

- Don't return raw DRF `Response`/dicts — always the envelope via `core.responses`.
- Don't put business logic in `api/` — that layer is transport. Logic belongs in `apps/`.
- Don't add `0002_*`/`0003_*` migrations. One editable `0001_initial` per app.
- Don't gate product capabilities with custom permission classes or by route — check object ownership inline.
- Don't add `DjangoFilterBackend`/ViewSets/routers to "modernize" one endpoint — consistency beats local cleanliness here.
- Don't assume the lifecycle state machine guards transitions — it doesn't ([domain.md](domain.md#event-lifecycle)).

## Run / lint

```
make backend-dev     # runserver on :8998 (dev settings auto-selected)
make backend-lint    # black . && isort . && flake8 . && pylint api apps core config
make shell           # Django shell
```

Lint pipeline is **black + isort + flake8 + pylint** (configs in `backend/pyproject.toml`, `.flake8`, `.pylintrc`). `.pylintrc` disables many Django/DRF false positives and enables scoring — it is tuned toward a 10/10 score but no recorded score/CI proves it; treat "Pylint 10/10" as a target, not a guarantee. The repo-root `.ruff_cache/` is incidental — **ruff is not in the pipeline**. There are **no tests** (`make backend-test` discovers essentially nothing). DB workflow and seed commands: [workflows.md](workflows.md).
