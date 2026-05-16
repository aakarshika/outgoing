---
title: Workflows — Setup, DB, Git
status: living
last-updated: 2026-05-16
---

# Workflows — Setup, DB, Git

Local setup, the make/seed commands that actually work, the migration workflow, and git flow.

## TL;DR

- `make dev` runs backend (`:8998`) + frontend (`:5995`) after killing those ports. HTTPS on by default; `make dev nossl` to disable.
- DB reset is **`cd backend && python manage.py chats`** (= `reset_db_schema --yes` + `seed_simple`). The Makefile `reset-db` target is **broken** (calls a nonexistent `reset_database.py`).
- One editable `0001_initial` per app — change models, edit that migration in place, reset+reseed. Never `0002_*`.
- Backend lint pipeline is real (black/isort/flake8/pylint). There are **no tests** — `make test` does not give you a safety net.
- Default branch for PRs is `main`; `dev` is the integration branch.

## Prerequisites

- Python ≥3.10 (venv at `backend/.venv`, Python 3.11), Node (`.nvmrc` present).
- Backend deps from `backend/pyproject.toml` (no `requirements.txt`). Frontend deps from `frontend/package.json`.
- No `.env` auto-loading — Django reads `os.environ` directly (`python-dotenv` is a dep but settings never call `load_dotenv()`). Export env vars in your shell or your process manager.

## Make commands (verified against the Makefile)

| Command | What it does |
|---|---|
| `make dev` | Kill ports, run backend + frontend (HTTPS on) |
| `make dev nossl` | Same, HTTPS off (or `VITE_NO_SSL=true`) |
| `make backend-dev` | `cd backend && .venv/bin/python manage.py runserver 8998` (dev settings auto) |
| `make frontend-dev` | `cd frontend && npm run dev` (Vite `:5995`) |
| `make dev-noauth email=<email>` | Dev mode with the `DevAuthentication` backdoor for that user |
| `make shell` | Django shell |
| `make seed-event-120` | Seed a detailed event (#120) |
| `make backend-lint` | `black . && isort . && flake8 . && pylint api apps core config` |
| `make frontend-lint` | `npm run lint` (eslint, `--max-warnings 0`) |
| `make lint` | both linters |
| `make backend-test` / `make test` | runs Django test / both — **discovers no real tests** (see below) |

Broken/misleading targets — don't rely on these:

- `make reset-db` → runs `backend/reset_database.py` which **does not exist**. Use the DB reset below instead.
- `make frontend-test` → `npm test`, but there is **no `test` script** in `package.json` (it will error). There is no frontend test runner.
- `make backend-test` → `manage.py test` discovers essentially nothing (only an empty stub). No backend test suite.

## Database workflow

One engine story: dev = local SQLite (`backend/db.sqlite3`); prod = Supabase Postgres via `DATABASE_URL`. Not in-memory. ([architecture.md](architecture.md#database-story-resolves-an-old-doc-conflict))

**Migrations are squashed to one file per first-party app.** `events` and `vendors` would cycle (`VendorReview.event` needs `Event` after `VendorService`), so:

- `vendors.0001_initial` — `VendorService` + `VendorReview` **without** `event`.
- `events.0001_initial` — all event models, then `AddFieldVendors` (`apps/events/migration_operations.py`) adds `VendorReview.event → events.Event`.
- All other first-party apps (`needs`, `profiles`, `requests`, `tickets`, `chat`, …) — `0001_initial` only. Django contrib migrations are untouched.

**When you change a first-party model:** edit that app's `0001_initial.py` to match `models.py`. **Do not add `0002_*`/`0003_*`.** Then reset + seed:

```bash
cd backend
python manage.py chats              # = reset_db_schema --yes + seed_simple
python manage.py chats --no-seed    # schema only
# manual equivalent:
python manage.py reset_db_schema --yes
python manage.py seed_simple        # supports --no-wipe to refresh data without dropping
```

`reset_db_schema` (`apps/events/management/commands/`) drops all tables (and SQLite views), migrates from zero; requires `--yes`. `chats` (`apps/chat/management/commands/`) is the solo-dev convenience wrapper. Other seed commands exist (`seed_all`, `seed_event_120`, `seed_simple`).

## Git flow

- Branches present: `main` (PR target / default), `dev` (integration), plus feature branches (e.g. `shivam-*`).
- Typical flow: feature branch → merge/PR into `dev` → PR `dev` → `main`. Recent work commits land on `dev`.
- Run `make lint` before pushing (the backend pipeline is the real gate; tests are not — there are none).
- Commit/push only when asked. If on the default branch, branch first.

## Environment variables

Read directly from the environment by `config/settings/*.py`:

| Var | Use |
|---|---|
| `DJANGO_SECRET_KEY` | secret key (defaults to an **insecure placeholder**) |
| `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS` | standard Django |
| `CORS_ALLOW_ALL_ORIGINS`, `CORS_ALLOWED_ORIGINS` | CORS (prod defaults to allow-all if unset) |
| `DATABASE_URL` | Supabase Postgres (unset → local SQLite) |
| `SUPABASE_URL`, `SUPABASE_BUCKET_NAME`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | S3-compatible media storage (else local FS) |
| `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-4o-mini`) | `core/ai.py` |
| `PEXELS_API_KEY` | image scripts |
| `DEV_USER_EMAIL` | `DevAuthentication` backdoor (development settings only) |
| `VITE_NO_SSL` | disable Vite HTTPS in dev |

Deployment: Vercel (`backend/vercel.json` → `index.py`, `config.settings.production`), Supabase Postgres + Supabase S3 + WhiteNoise static. Frontend proxied via `frontend/vercel.json` rewrites. Default admin seeded as `root`/`root` (dev only — change for any shared/prod use).
