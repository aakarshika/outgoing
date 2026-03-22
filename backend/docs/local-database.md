# Local database (solo dev)

## Squashed migrations (project apps)

**First-party** migrations are **one file per app** (`0001_initial` each). `events` ↔ `vendors` would cycle if `VendorReview.event` lived only in `vendors` (needs `Event` after `VendorService`). That’s broken by:

- `vendors.0001_initial`: `VendorService` + `VendorReview` **without** `event`
- `events.0001_initial`: all event models, then `**AddFieldVendors`** (see `apps/events/migration_operations.py`) adds `VendorReview.event` → `events.Event`


| App                                        | Migrations                                                           |
| ------------------------------------------ | -------------------------------------------------------------------- |
| `vendors`                                  | `0001_initial` only                                                  |
| `events`                                   | `0001_initial` only (includes cross-app add of `VendorReview.event`) |
| `needs`, `profiles`, `requests`, `tickets` | `0001_initial` each                                                  |


**Django contrib** (`admin`, `auth`, `contenttypes`, `sessions`) is unchanged.

When you change models: run `python manage.py makemigrations` (or edit these files if you prefer the “rewrite initial” workflow), then reset + seed below.

## Reset schema + seed (no incremental migrate)

Drops **all** tables (and SQLite views), runs `**migrate` from zero**, empty schema:

```bash
cd backend
python manage.py reset_db_schema --yes
python manage.py seed_simple
```

`reset_db_schema` lives at `apps/events/management/commands/reset_db_schema.py` (SQLite / Postgres / MySQL). It requires `--yes`.

`seed_simple` still supports `--no-wipe` if you only want to refresh data without dropping tables.

## Why `vendors` has two files

`Event` references `VendorService`, and `VendorReview` references `Event`. Django cannot apply a single migration for both apps without a cycle, so `VendorReview.event` is added in `vendors.0002` **after** `events.0001_initial`.