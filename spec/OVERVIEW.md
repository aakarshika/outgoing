# Overview [DRAFT]

## What is Outgoing?

A **decision and coordination engine for events**, wrapped in a social marketplace.

Outgoing manages the full lifecycle of events — from creation through vendor coordination, ticket sales, and execution — including the complex non-happy paths when things change. It's where organisers coordinate with hosts and vendors, goers discover things to do, and the platform makes sure everyone is informed when plans shift.

It's not just an event listing. It's a network where every user has a showcase page, every event has a vendor lineup with contingency plans, and the system manages the decision logic when vendors drop out, attendance is low, or circumstances change.

## Vision

Make going out effortless — and make organizing reliable. Outgoing removes the friction between "I want to do something" and actually doing it, while giving organisers the tools to handle the operational complexity that events inevitably bring.

## The Actor Model

Outgoing has a richer actor model than a typical event platform. For full definitions, see [DOMAIN.md](./DOMAIN.md).

### Core Actors

| Actor | Role | Key responsibility |
| :--- | :--- | :--- |
| **Organiser** | Operational owner | Manages event setup, vendor coordination, execution, contingency |
| **Host** | Client / brand | The identity behind the event. May be same person as organiser. |
| **Vendor** | Service provider | Provides services to events. Classified by role, visibility, and criticality. |
| **Goer** | Attendee / customer | Discovers events, buys tickets, attends. May request events they want. |
| **Admin / Ops** | Internal operations | Overrides, dispute resolution, platform-wide monitoring. |

### Behavioral Flexibility

Users aren't locked into a single actor type. A person can organise an event on Saturday, offer DJ services on Sunday, and attend a workshop on Monday. In many cases, the organiser and host are the same person — the platform handles both simple and complex arrangements.

**Why "Goer"?** It's on-brand with "Outgoing" (going out), casual, and distinct from the generic "attendee."

## The Vendor Model

Vendors are more than service providers. They carry classification metadata that drives the system's decision logic:

- **Primary vs Standby** — confirmed vendors vs backup contingencies
- **Customer-Facing vs Operational** — visible to goers vs behind-the-scenes
- **Essential vs Replaceable vs Non-Substitutable** — determines what happens when they drop out

A headliner DJ who cancels triggers a completely different response than a security company swapping crews. See [DOMAIN.md](./DOMAIN.md) for the full classification framework and [SCENARIOS.md](./SCENARIOS.md) for how these classifications drive business decisions.

## Target Users

| Persona | Example | Primary behaviors |
| :--- | :--- | :--- |
| **The Social Explorer** | College student looking for weekend plans | Goer, occasionally organises casual events |
| **The Event Organiser** | Professional event planner or active community member | Organiser, coordinates vendors and logistics |
| **The Brand / Host** | Corporation, artist, venue, or personality | Host (the name on the event), may have a separate organiser |
| **The Service Provider** | DJ, caterer, photographer, decorator, security | Vendor, lists services, responds to event needs |
| **The Idea Person** | Someone who wishes a certain event existed | Goer (posts Event Requests for hosts to fulfill) |

## Core Value Propositions

1. **For Goers** — Discover events. See exactly who's performing/hosting. Buy tickets. Request events you wish existed. Get notified when things change.
2. **For Organisers** — Create and manage events with vendor coordination, standby planning, and operational dashboards. Handle changes without chaos.
3. **For Hosts** — Put your name on events. Delegate logistics to an organiser. Maintain your brand reputation.
4. **For Vendors** — List your services. Browse event needs. Get hired. Understand your role classification (primary/standby, customer-facing/operational).
5. **For Everyone** — A personal showcase page that highlights your activity across all roles.

## What Makes Outgoing Different

| Competitor | What Outgoing adds |
| :--- | :--- |
| Eventbrite / Luma | Vendor coordination, standby logic, event requests, social profiles |
| Meetup | Operational tooling, vendor marketplace, decision engine for disruptions |
| Partiful | Vendor needs, public discovery, not just private invites |
| Thumbtack / GigSalad | Events as the anchor (not just service hiring), full lifecycle management |

Outgoing sits at the intersection of **event discovery**, **service marketplace**, **operational coordination**, and **social network**.

## Product Principles

1. **One identity, many hats** — Users aren't siloed into roles. Your profile reflects everything you do.
2. **Both sides of the table** — Hosts post needs, vendors list services. Either side can initiate.
3. **Demand is signal** — Event Requests surface what people actually want. Hosts can act on real demand.
4. **Plan for things going wrong** — Standby vendors, vendor classification, and decision logic for when plans change.
5. **Customer-visible vs operational** — Not all changes are equal. The system knows which ones affect goers and which are internal adjustments.
6. **Low friction first** — Creating an event or listing a service should take under 2 minutes for the simple case.

---

### Changelog

| Date | Change |
| :--- | :--- |
| 2026-02-28 | Initial draft created from README and codebase analysis |
| 2026-02-28 | Rewrote with social marketplace positioning, three-sided model, Goer naming |
| 2026-02-28 | Evolved to decision engine framing. Richer actor model (Organiser/Host split, vendor classification, Admin/Ops). References to DOMAIN.md and SCENARIOS.md. |
