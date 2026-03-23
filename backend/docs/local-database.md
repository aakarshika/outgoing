# Local database (solo dev)

## Squashed migrations (project apps)

**First-party** migrations are **one file per app** (`0001_initial` each). `events` ↔ `vendors` would cycle if `VendorReview.event` lived only in `vendors` (needs `Event` after `VendorService`). That’s broken by:

- `vendors.0001_initial`: `VendorService` + `VendorReview` **without** `event`
- `events.0001_initial`: all event models, then **`AddFieldVendors`** (see `apps/events/migration_operations.py`) adds `VendorReview.event` → `events.Event`


| App                                        | Migrations                                                           |
| ------------------------------------------ | -------------------------------------------------------------------- |
| `vendors`                                  | `0001_initial` only                                                  |
| `events`                                   | `0001_initial` only (includes cross-app add of `VendorReview.event`) |
| `needs`, `profiles`, `requests`, `tickets`, `chat`, … | `0001_initial` each (only file; edit in place when models change)      |


**Django contrib** (`admin`, `auth`, `contenttypes`, `sessions`) is unchanged.

When you change first-party models: **edit that app’s `0001_initial.py`** to match `models.py`. Do **not** add `0002_*` / `0003_*`. Then reset + seed below (no incremental migrate as the default path).

## Reset schema + seed (no incremental migrate)

Drops **all** tables (and SQLite views), runs **`migrate` from zero**, empty schema:

```bash
cd backend
python manage.py chats
```

Same as `reset_db_schema --yes` followed by `seed_simple`. Schema only (no seed):

```bash
python manage.py chats --no-seed
```

Manual equivalent:

```bash
cd backend
python manage.py reset_db_schema --yes
python manage.py seed_simple
```

`reset_db_schema` lives at `apps/events/management/commands/reset_db_schema.py` (SQLite / Postgres / MySQL). It requires `--yes`.

`chats` lives at `apps/chat/management/commands/chats.py` — convenience wrapper for the solo workflow.

`seed_simple` still supports `--no-wipe` if you only want to refresh data without dropping tables.
