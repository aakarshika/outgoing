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
