---
title: Vision & Positioning
status: stable
last-updated: 2026-05-16
---

# Vision & Positioning

## TL;DR

- Outgoing is an event discovery, ticketing, and **contributor** platform built for **urban India** — its pricing (₹), UX, and social mechanics assume how Indian cities actually plan a night out.
- The core differentiator is **"Chip In"**: attendees can supply a skill or resource to an event (DJ, food, photography, gear, venue, staffing) for discounted/free entry or cash. Hosts fill needs; attendees get access; everyone wins.
- The second differentiator is **Orbits**: social connections form automatically when two people attend the same event — no follow requests, no friction.
- A user is not a fixed type. **Roles are behaviors.** One identity, many hats: host one night, contribute the next, attend the one after.
- Outgoing sits at the intersection of *discovery* + *contributor marketplace* + *operational coordination* + *light social graph* — no single incumbent covers all four.

## Why Outgoing exists

Going out in an Indian city is a coordination problem dressed up as a fun problem. A house party needs a sound setup and someone who can actually DJ. A rooftop gig needs a photographer and someone to run the door. A supper club needs a cook and a space. Today that coordination happens in fragmented WhatsApp threads, and the people with the skills (the friend who DJs, the friend with a camera) are invisible to the hosts who need them and get nothing for showing up.

Meanwhile attendees want two things existing tools don't combine: a way to *discover* what's happening near them tonight, and a way to *participate* beyond just buying a ticket.

Outgoing's bet is that **the contributor is a first-class actor**, not an afterthought. Make it trivial for a host to declare "I need a DJ, here's the reward" and for an attendee to say "I'll do it" — and the same platform that handles discovery and tickets also handles the coordination that today lives nowhere.

## The core model

### Chip In

An event has **needs** (a DJ slot, catering, a photographer, equipment, a venue, staffing). A need carries a **reward** — a discount, free entry, or cash. Any user can **apply** to fill a need; the host reviews and accepts. A filled need is, mechanically, a vendor/contributor assignment against that event.

This is one mechanism wearing two names:
- **Vendor** — the marketplace framing: a person lists a `VendorService` and gets hired.
- **Contributor / Chip In** — the event framing: an attendee fills a host's need for a reward.

Same plumbing, different doorway. A "co-host" is just a zero-fee contributor assignment — there is no separate co-host concept.

### Orbits

When two users both attend the same event, they become connected. Connections are scoped to a **category** ("orbit category" derived from the event's category) — the people you met at music nights are a different orbit from the people you met at workshops. There are no public follower counts and no follow requests as the primary mechanism; shared experience is the graph. Orbits power the "My Network" surface and personalize discovery (events your orbit is going to / hosting / contributing to).

### Roles are behaviors

There is no "host account" or "vendor account." Every authenticated user is a Goer by default. Create an event → you are its host. List a service / fill a need → you are a contributor for that assignment. Permissions are enforced per-object at the API layer (is this *your* event?), not by an account-type flag. This is the platform's central flexibility and the reason discovery, contribution, and hosting can live in one app without role silos.

## Target market

Urban India. Pricing is in **₹** with discovery tiers tuned to it (Free, Under ₹200, Under ₹500). Geography and copy assume Indian cities and neighborhoods (e.g. Bangalore — Indiranagar, Koramangala). This is a deliberate constraint, not a localization layer bolted on later: the price points, the "Chip In for entry" economics, and the neighborhood-dense discovery all assume this market.

## Experience model

The intended goer loop:

**Discover → Evaluate → Attend → Relive → Return.**

- **Discover** — intent-based browse surfaces (e.g. Trending, Tonight, Free & Cheap, Chip In, Online, My Network), plus event *requests* (demand as a first-class signal: "I wish this existed").
- **Evaluate** — an event has two surfaces: a transactional view ("how do I get in / chip in?") and an experiential view (highlights, reviews, social proof — "why should I care?").
- **Attend** — tickets with tiers, QR admission, contributor admission.
- **Relive** — post-event highlights and reviews aggregate the night.
- **Return** — Orbits and demand signals pull the user back for the next one.

## Differentiation

| Compared to | What Outgoing adds |
|---|---|
| Eventbrite / Luma | Contributor coordination and a light social graph on top of discovery + ticketing |
| Meetup | A real contributor marketplace and host operations tooling, not just groups |
| Partiful | Public discovery, not only private invites |
| Thumbtack / GigSalad | The event is the anchor; contribution is tied to a specific night, not generic service hiring |

No incumbent owns *discovery + contributor marketplace + operational coordination + social graph* together. That intersection is the position.

## Scope

The vision above is the product thesis; not all of it is built. The contributor/needs/tickets/interest/requests/friendships/chat core is implemented. Richer lifecycle automation (at-risk detection, substitution materiality scoring, notification SLAs) is a design target — its state machine exists in code but is currently bypassed by a temporary "allow any transition" rule. [product.md](product.md) has the precise live/partial/not-built breakdown; [domain.md](domain.md) describes how the lifecycle actually behaves today.
