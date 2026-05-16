---
title: Outgoing — Spec Index
status: living
last-updated: 2026-05-16
---

# Outgoing — Spec Index

> Read this first. It is the entry point for any human or agent working in this repo.

## TL;DR

- **Outgoing** is an event discovery, ticketing, and contributor ("Chip In") platform for **urban India**. Full-stack web app.
- **Backend:** Django 5.2 + DRF + SimpleJWT, every response wrapped in a `{ success, message, data, meta }` envelope. `backend/`.
- **Frontend:** React 18 + Vite + TypeScript + React Query + Tailwind/shadcn (with some MUI). `frontend/`.
- **One DB story:** dev = SQLite, prod = Supabase Postgres (via `DATABASE_URL`). Single editable `0001_initial` migration per app — **no `0002_*` migrations** ([workflows.md](workflows.md)).
- **Honesty rule:** these docs describe what the code *does today*, not what it should do. WIP and known-broken things are called out, not hidden. See [conventions.md](conventions.md#known-reality-flags).

## What it is

A web app where people discover events, buy tickets, express interest, and post requests for events they want — and where attendees can **"Chip In"** (DJ, cook, photograph, supply gear, staff the door) in exchange for discounted/free entry or cash. Social connections ("Orbits") form automatically when two people attend the same event. Built for ₹ pricing and Indian cities. Full positioning in [vision.md](vision.md).

## Actors

- **Goer** — default for every user. Browses, buys tickets, expresses interest, posts event requests, attends.
- **Host** — creates and runs an event, defines needs/contributor slots, manages applications and admission.
- **Vendor / Contributor** — supplies a service to an event. "Vendor" = the service-listing concept; "Contributor / Chip In" = the same actor framed around an event need + reward.
- **Admin** — Django `is_staff` / `is_superuser`. Overrides and platform health.

Roles are **behaviors, not account types** — one person hosts on Saturday, DJs on Sunday, attends on Monday. See [domain.md](domain.md).

## Core entities

`Event` · `EventSeries` · `EventCategory` · `EventTicketTier` · `Ticket` · `EventNeed` · `NeedApplication` · `NeedInvite` · `VendorService` · `EventInterest` · `EventReview` · `EventHighlight` · `EventRequest` · `Friendship` · `UserProfile` · chat (`ChatMessage` + legacy event message models). Field-level detail in [data-models.md](data-models.md).

## Repo map

```
backend/        Django project (config/ settings, api/ transport, apps/ domain, core/ shared infra)
frontend/       React app (src/api client, src/features domain, src/pages routes, src/components UI)
spec/           This documentation set
Makefile        Dev entry points (make dev, make lint, make check)
```

Backend and frontend connect through the Vite dev proxy: `/api` and `/media` → Django on `:8998`; frontend runs on `:5995`. See [architecture.md](architecture.md).

## Spec index

| File | Purpose | Read when |
|---|---|---|
| [vision.md](vision.md) | What Outgoing is, why it exists, the bets | Onboarding; product decisions |
| [product.md](product.md) | Features by actor; what is live vs partial vs not built | Scoping any feature |
| [domain.md](domain.md) | Entities, business rules, event lifecycle, Chip In, Orbits | Before changing behavior |
| [architecture.md](architecture.md) | Stack, layout, how the pieces connect, known trade-offs | System-level changes |
| [backend.md](backend.md) | How to work in Django/DRF here; add an endpoint | Backend work |
| [frontend.md](frontend.md) | How to work in React/TS here; add a page/feature | Frontend work |
| [api.md](api.md) | Envelope contract, auth, endpoints by domain | Wiring client↔server |
| [data-models.md](data-models.md) | Every model, fields, enums, constraints | Data changes |
| [conventions.md](conventions.md) | Do's / don'ts + known reality flags | Always |
| [workflows.md](workflows.md) | Setup, make/seed commands, migrations, git flow | First run; PRs |

## Read order for an agent

1. This file → 2. [vision.md](vision.md) (1 min) → 3. [domain.md](domain.md) → 4. [architecture.md](architecture.md) → 5. the relevant side ([backend.md](backend.md) / [frontend.md](frontend.md)) → 6. [conventions.md](conventions.md) before writing code.

Code is ground truth. Where a doc and the code disagree, the code wins — fix the doc.
