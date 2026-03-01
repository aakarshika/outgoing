# Domain Model [DRAFT]

This document defines the conceptual shape of Outgoing at an abstract planning level. It captures major actors, relationships, system responsibilities, and the event lifecycle without locking in implementation details. Both UI and backend planning can reference this as the source of business logic truth.

---

## Platform Identity

Outgoing is a **decision and coordination engine** for events — not just a booking UI or event listing.

The platform manages the full lifecycle of events where an **organiser** coordinates with a **host**, multiple **vendors**, and **attendees**. It must handle happy paths (event goes as planned) and non-happy paths (vendor drops out, attendance is low, host cancels, force majeure) with appropriate decision-making, communication, and resolution.

The system should be thought of as managing **stateful event lifecycles with conditional transitions** based on business rules and actor actions.

---

## Core Actors

### Organiser

The operational owner. Manages event setup, vendor coordination, scheduling, and execution. The organiser is the person doing the work of making an event happen.

- Creates and configures events
- Recruits and assigns vendors
- Monitors event readiness and risk
- Handles substitutions, postponements, cancellations
- Manages attendee communications (via the system)

An organiser may work on behalf of a host, or may be the host themselves.

### Host

The client, brand, or person on whose behalf the event is being run. The host is the "why" of the event — the name on the marquee.

- May be the same person as the organiser, or may be a separate party
- Represents the commercial or reputational identity of the event
- Has authority over high-level event decisions (proceed, cancel, rebrand)
- May be a contractual counterparty to vendors and attendees

The distinction matters because an organiser coordinates logistics, while a host owns the brand promise.

### Vendor

A service provider attached to the event. Vendors are classified along three dimensions:

**By role:**

| Classification | Meaning | Example |
| :--- | :--- | :--- |
| **Primary** | The confirmed, active vendor for a need | The DJ booked for the party |
| **Standby** | A backup vendor activated if the primary fails | A backup DJ on call |

**By visibility:**

| Classification | Meaning | Example |
| :--- | :--- | :--- |
| **Customer-facing** | Visible to attendees, part of the event promise | DJ, performer, celebrity host, branded caterer |
| **Operational** | Behind the scenes, not part of attendee expectations | Security, AV technician, cleaning crew |

**By replaceability:**

| Classification | Meaning | Example |
| :--- | :--- | :--- |
| **Essential** | The event cannot proceed without this vendor | Venue provider, main performer |
| **Replaceable** | Can be swapped without materially changing the event | One caterer for another of similar quality |
| **Non-substitutable** | This specific vendor IS the draw; replacing them changes the event's identity | A celebrity DJ, a specific chef |

These three dimensions are independent. A vendor can be primary + customer-facing + non-substitutable (the headliner DJ) or primary + operational + replaceable (the security team).

### Attendee / Goer

A person who views, RSVPs, books, or pays for access to an event.

- Browses and discovers events
- Makes booking decisions based on the event, host, AND specific vendors
- Has expectations that were commercially relied upon (especially around customer-facing vendors)
- May be entitled to refunds, credits, or acknowledgement if the event materially changes
- Can post event requests ("I wish this existed")

The system must recognize that attendees may make booking decisions based on the presence of **specific vendors** — not just the host or event theme.

### Internal Admin / Operations

A system user responsible for overrides, approvals, and exception handling that falls outside normal actor permissions.

- Resolves disputes and edge cases
- Performs manual overrides (force-cancel, force-refund, reassign vendor)
- Monitors platform-wide event health and risk
- Has audit access to all decisions and state transitions

---

## Organiser-Host Relationship

In many cases, the organiser and host are the same person. In more complex events, they are separate:

| Scenario | Organiser | Host |
| :--- | :--- | :--- |
| Someone throws their own birthday party | Same person | Same person |
| An event planner organizes a corporate launch | The planner | The corporation |
| A promoter puts on a show featuring an artist | The promoter | The artist / brand |
| A community member organizes a neighbourhood event | The community member | The community / no distinct host |

The platform should support both cases without forcing unnecessary complexity on simple events. When organiser = host, the UI should feel like a single role.

### Co-Hosts

When an event has multiple hosts (e.g. two DJs co-hosting a night, or a brand collaborating with a local venue), the **primary host** is the `Event.host` — the person who created the event and has full management rights.

Additional co-hosts are represented as **vendors with zero fee**. They are assigned to (or apply to) an EventNeed with a zero budget, offering their presence/service as the contribution rather than payment. This means:

- Co-hosts appear in the vendor lineup as customer-facing vendors — which is correct, since attendees see them as part of the event's identity
- The existing vendor assignment infrastructure handles co-host coordination (applications, acceptance, classification)
- No separate co-host model is needed
- Co-hosts can be classified as customer-facing + non-substitutable, reflecting their importance to the event's identity

---

## Vendor Classification Framework

Every vendor assigned to an event carries three classification tags. These classifications drive downstream business logic:

```
Vendor Assignment
├── Role:          Primary | Standby
├── Visibility:    Customer-Facing | Operational
└── Criticality:   Essential | Replaceable | Non-Substitutable
```

### Why This Matters

The combination of these tags determines:
- **What happens when a vendor drops out** (see SCENARIOS.md)
- **Whether attendees need to be notified** of a change
- **Whether a substitution still counts as the "same event"**
- **Who bears responsibility** for the disruption
- **What remedies are available** (swap, postpone, cancel, refund)

| Scenario | Classification | Impact |
| :--- | :--- | :--- |
| Headliner DJ cancels | Primary + Customer-Facing + Non-Substitutable | High impact. Attendees booked for this DJ. May require event cancellation or full refunds. |
| Security company swaps crews | Primary + Operational + Replaceable | Low impact. Attendees don't know or care. Internal swap only. |
| Backup caterer activated | Standby + Customer-Facing + Replaceable | Medium impact. Food changes but event proceeds. May require notification. |
| Venue becomes unavailable | Primary + Operational + Essential | Critical. Event cannot proceed at this location. Must relocate or cancel. |

---

## Event Lifecycle

Events move through a series of states. Not all transitions are linear — events can move backward (rescheduled) or sideways (substituted).

### Major Event States

| State | Meaning |
| :--- | :--- |
| **Draft** | Event is being configured. Not visible to attendees. |
| **Scheduled** | Event is published and accepting bookings. All critical vendors confirmed. |
| **At-Risk** | One or more conditions threaten the event's viability (vendor failure, low attendance, etc.). Internal visibility only. |
| **Substituted** | A material change has occurred (vendor swap, venue change) but the event proceeds. May require attendee notification. |
| **Postponed** | Event is delayed to a future date. Existing bookings may be preserved or refunded. |
| **Cancelled** | Event will not take place. Triggers refund/compensation flows. |
| **Completed** | Event occurred as planned (or with accepted substitutions). |

### State Transitions (Conceptual)

```
Draft → Scheduled
  (all essential vendors confirmed, event details complete)

Scheduled → At-Risk
  (vendor failure, low attendance approaching threshold, host uncertainty)

At-Risk → Scheduled
  (standby activated, risk resolved)

At-Risk → Substituted
  (vendor replaced, material change accepted by organiser)

At-Risk → Postponed
  (organiser/host decides to delay)

At-Risk → Cancelled
  (unrecoverable: no standby, essential vendor lost, host/organiser cancels)

Substituted → Scheduled
  (attendees notified, event proceeds under modified terms)

Postponed → Scheduled
  (new date confirmed, vendors re-confirmed)

Postponed → Cancelled
  (unable to reschedule)

Scheduled → Completed
  (event takes place)

Cancelled → [terminal]
  (triggers refund/communication flows)

Completed → [terminal]
  (triggers review/feedback flows)
```

### What Triggers At-Risk?

- A primary vendor becomes unavailable
- Attendance falls below a viability threshold
- Host signals intent to cancel or change scope
- External force majeure conditions arise
- A non-substitutable customer-facing vendor is lost

### At-Risk Is Internal

The "At-Risk" state is an **internal operational state**, not visible to attendees. From the attendee perspective, the event is either scheduled, changed (substituted), postponed, or cancelled. The at-risk state gives the organiser and operations team time to resolve the issue before it becomes customer-visible.

---

## System Responsibilities

The platform should eventually support the ability to:

| Responsibility | Description |
| :--- | :--- |
| **Event lifecycle management** | Create, configure, publish, modify, and close events through defined states |
| **Vendor assignment** | Attach vendors to events by category and role, with classification metadata |
| **Vendor substitution** | Activate standbys, manage swap logic, determine whether substitution is material |
| **Attendance tracking** | Track commitments, thresholds, and viability signals |
| **Decision support** | Present organisers/admins with the information needed to decide: proceed, substitute, postpone, or cancel |
| **Communication** | Notify affected parties of changes, with content appropriate to the change's materiality |
| **Refund and compensation** | Handle downstream financial consequences of cancellations and material changes |
| **Audit trail** | Record all state transitions, decisions, and who made them |

---

## Customer-Facing vs Internal Operational Concerns

A critical design principle: not all information and not all changes are equal. The system must distinguish between what attendees see and what operations teams manage.

### Customer-Facing (Visible to Attendees)

- Event details (title, date, location, price)
- Customer-facing vendor lineup (DJ, performer, host name)
- Event status changes that affect their booking (postponed, cancelled, venue changed)
- Refund/credit/rebooking options
- Notifications about material changes

### Internal / Operational (Not Visible to Attendees)

- At-risk status
- Standby vendor assignments
- Operational vendor details (security, AV, cleaning)
- Vendor application and selection process
- Attendance threshold calculations
- Internal communications between organiser, host, and vendors
- Audit logs and decision trails

### The Boundary Question

The key design challenge is determining **when an internal operational change becomes a customer-facing change**. Guiding principle:

> A change is customer-facing when it affects something the attendee **commercially relied upon** when making their booking decision.

Examples:
- Replacing the headliner DJ → Customer-facing (people bought tickets for that DJ)
- Swapping security companies → Internal (attendees don't know or care)
- Changing the menu slightly → Borderline (depends on whether the menu was a selling point)
- Moving to a different venue of similar quality → Customer-facing (location was part of the decision)

---

## Recurring Event Domain Model

Recurring events (workshops/classes/weekly sessions) are modeled as **one series with many occurrences**.

### Core Rule: Per-Occurrence Participation

Even when series branding is stable, attendance and staffing are occurrence-specific:

- **Goers are per occurrence**: tickets, interest, check-in, and reviews belong to a single occurrence.
- **Vendors are per occurrence**: vendors must apply/confirm for each occurrence; no automatic carry-over.
- **Operational decisions are per occurrence**: substitution, postponement, cancellation, and refunds are decided at occurrence level.

### Series vs Occurrence Responsibilities

| Level | What Lives Here | What Does NOT Live Here |
| :--- | :--- | :--- |
| **Series** | Name, brand story, long description, recurrence rule, default needs template, host identity | Actual attendee list, actual vendor assignments, live status |
| **Occurrence** | Date/time, venue, ticketing, needs, applications, assignments, lifecycle status, highlights/reviews | Global recurring rule definition |

### Carry-Forward Policy (Template, Not Commitments)

Recurring events need speed, but not accidental commitments:

- Previous occurrence vendors can be **invited quickly** to the next occurrence.
- Need definitions can be **cloned as draft**.
- Nothing is considered confirmed until vendors explicitly accept for that occurrence.
- Goers are never auto-enrolled into future occurrences.

### Story Continuity Without Operational Coupling

Series pages can aggregate highlights/reviews across occurrences to build excitement, while operations remain isolated per occurrence. This prevents cross-contamination of refunds, tickets, or vendor obligations.

---

## Business Rule Themes

These themes must be preserved in all future design decisions. They are the principles that should guide schema design, API behavior, UI logic, and operational tooling.

### 1. Role-Based Responsibility

The system must distinguish **who caused a change** and **who is affected**. A vendor cancelling is different from a host cancelling is different from force majeure. Each has different responsibility and remedy implications.

### 2. Materiality of Change

Not every vendor change is equal. Replacing an operational vendor is routine. Losing a non-substitutable headliner can kill an event. The system must classify changes by their impact on attendee expectations.

### 3. Customer Reliance

Some event promises are commercially important because attendees **relied on them**. "Come see DJ X" creates a stronger obligation than "refreshments will be served." The system should distinguish between promises that drive ticket sales and background operational details.

### 4. Substitution vs Cancellation

A replaced vendor may or may not mean the event has materially changed. The system must support a middle path between "everything is fine" and "event is cancelled" — the event can proceed in a **modified form** with appropriate attendee notification.

### 5. Threshold-Based Viability

Low attendance may trigger a business decision (postpone, downsize, or cancel) — but it's **not necessarily a fault condition**. The system should support viability checks without implying blame.

### 6. Recoverability and Traceability

Decisions should eventually be **explainable and auditable**. If an event was cancelled, the system should be able to answer: why, when, who decided, what alternatives were considered, and what remedies were offered.

---

### Changelog

| Date | Change |
| :--- | :--- |
| 2026-02-28 | Initial conceptual domain model — actors, vendor classification, event lifecycle, business rule themes |
| 2026-02-28 | Added co-host pattern: additional hosts modeled as zero-fee vendors through the existing vendor assignment system. |
| 2026-03-01 | Added recurring event domain model: series vs occurrence split, per-occurrence goer/vendor participation, and carry-forward policy. |
