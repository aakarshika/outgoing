# Outgoing

**Event discovery, ticketing, and contributor platform for urban India.**

Outgoing is a full-stack web app that reimagines how people find and attend events. Beyond discovery and ticketing, it introduces a *chip-in* model — attendees can contribute a skill (DJ a set, photograph the night, bring equipment) in exchange for discounted or free entry. Hosts fill their needs. Attendees get access. Everyone wins.

Built for the Indian subcontinent market, with pricing, UX, and social mechanics designed for how urban communities actually plan their nights out.

---

## What it does

- **Browse & discover** events by vibe — Trending, Tonight, Free & Cheap, Online, and more
- **Chip In** — contribute a skill or resource to an event in exchange for a discount or free entry
- **Social graph (Orbits)** — automatically connects users who attended the same event; surfaces what your buddies are going to
- **Host management** — hosts create events, define contributor slots, manage applications, and track attendance
- **Smart cards** — event cards adapt their layout per context (time-sensitive events show time as hero, free events show price as hero, etc.)
- **Personalised recommendations** — surfaces events from hosts you've attended before, vendors you've seen, and events your network is attending

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript (strict), Vite 7, TailwindCSS, shadcn/ui + Radix |
| Backend | Django 5.2 (LTS), Django REST Framework, SimpleJWT |
| State | React Query (server state), React Context (auth) |
| Database | PostgreSQL (ephemeral dev setup via `reset_database.py`) |
| Quality | Pylint 10/10, ESLint, Black, isort — enforced via pre-push hooks |
| Debugging | Django Silk (query profiling), React Query Devtools, React Scan |

---

## Architecture
/outgoing
├── backend/               # Django + DRF
│   ├── config/            # Settings: Base, Dev, Prod
│   ├── core/              # Shared utils: unified response envelope, exceptions
│   ├── apps/              # Domain logic: models (profiles, events, opportunities)
│   └── api/               # Transport layer: serializers, views, URLs
├── frontend/              # React + Vite
│   ├── src/features/      # Domain features (auth, events, chip-in, orbits)
│   ├── src/components/    # Shared UI (shadcn/ui components)
│   └── src/hooks/         # Global hooks
└── spec/                  # Product specs and design decisions

**API contract:** Every response follows a strict `{ success, message, data, meta }` envelope — no ad-hoc shapes.

**Auth:** JWT with auto-refresh via Axios interceptor. Token expiry is handled transparently — no logout on 401.

---

## Local Setup

### Requirements
- Python 3.11
- Node.js v24 (via nvm)

### Backend

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python reset_database.py       # drops + recreates DB, seeds superuser
python manage.py runserver 8998
```

Django admin: http://localhost:8998/admin · `root` / `root`
API profiler (Silk): http://localhost:8998/silk/

### Frontend

```bash
cd frontend
nvm use          # picks up .nvmrc (Node v24)
npm install
npm run dev      # runs on localhost:5995, proxies /api → :8998
```

### Or just

```bash
make dev         # runs both concurrently
```

---

## Design decisions worth noting

**Ephemeral database in dev** — no migration files to manage. `reset_database.py` drops, recreates, and seeds from scratch. Fast to iterate, zero migration conflicts.

**Strict API envelope** — all responses share one shape. The frontend never needs to handle ad-hoc error formats or inconsistent data structures.

**Pre-push quality gates** — Pylint 10/10, Black, isort, and ESLint run automatically before every push. Nothing substandard gets in.

**Card layout system** — event cards are context-aware. The same card component promotes different fields to "hero" position depending on the active browse tab. Time is hero on Tonight. Price is hero on Free & Cheap. Buddy faces are hero on My Network. One component, six layouts.

**Social graph without explicit follows** — Orbits are auto-generated from shared event attendance. No follow requests, no social friction. Two people who attended the same event are automatically connected.

---

## Status

Active development. Core auth, event browsing, and host management are implemented. Chip-in application flow and Orbits social graph are in progress.

