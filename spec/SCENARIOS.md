# Business Scenarios [DRAFT]

This document inventories the major business scenarios the platform must eventually handle. Each scenario is described as a conceptual branch in business logic — not as a finalized workflow, API, or screen design. The purpose is to ensure that future technical design accounts for these paths.

For vendor classification definitions (primary/standby, customer-facing/operational, essential/replaceable/non-substitutable), see [DOMAIN.md](./DOMAIN.md).

---

## Scenario Categories

1. [Happy Path](#1-happy-path)
2. [Vendor Failure](#2-vendor-failure)
3. [Host and Organiser Actions](#3-host-and-organiser-actions)
4. [Attendance and Viability](#4-attendance-and-viability)
5. [Event Modification](#5-event-modification)
6. [External Disruption](#6-external-disruption)
7. [Post-Event](#7-post-event)

---

## 1. Happy Path

### 1.1 — Event Proceeds as Planned

All vendors confirmed. Attendance meets expectations. Event occurs on schedule.

- **Trigger**: Event date arrives, all conditions met.
- **Outcome**: Event moves to `Completed`. Feedback/review flows triggered.
- **Customer impact**: None (positive experience).
- **System responsibility**: Track completion, enable post-event actions (reviews, payouts).

---

## 2. Vendor Failure

### 2.1 — Primary Vendor Unavailable, Standby Available

A primary vendor drops out before the event. A pre-assigned standby vendor exists and is activated.

- **Trigger**: Primary vendor signals unavailability (or organiser marks them as dropped).
- **Decision**: Is the dropped vendor customer-facing? Essential? Non-substitutable?
- **Branch A** — Operational + Replaceable: Standby activated silently. No attendee notification. Event stays `Scheduled`.
- **Branch B** — Customer-Facing + Replaceable: Standby activated. Attendees notified of the change. Event moves through `Substituted` → `Scheduled`.
- **Branch C** — Customer-Facing + Non-Substitutable: Standby may not be an adequate replacement. Organiser must decide: proceed with substitute (and notify attendees with refund option) or escalate to postponement/cancellation.
- **Responsibility**: Organiser decides. Host may need to approve for customer-facing changes. Dropped vendor may bear contractual responsibility.

### 2.2 — Primary Vendor Unavailable, No Standby Available

A primary vendor drops out and there is no pre-assigned standby.

- **Trigger**: Primary vendor unavailable, no standby in the system for this need.
- **Decision**: Is the vendor essential?
- **Branch A** — Essential vendor lost: Event cannot proceed as configured. Organiser must find a replacement, postpone, or cancel. Event moves to `At-Risk`.
- **Branch B** — Non-essential vendor lost: Event can proceed without this service. Organiser decides whether to find a replacement or proceed without.
- **Escalation**: If the event remains at-risk beyond a threshold (time or severity), operations/admin may intervene.

### 2.3 — Standby Vendor Declines Activation

A standby is contacted but declines or is no longer available.

- **Trigger**: Standby vendor cannot fulfill the role when called upon.
- **Outcome**: Equivalent to 2.2 (no standby available). Organiser must find alternative or escalate.
- **System responsibility**: Record the standby's decline. Surface the gap to the organiser.

### 2.4 — Customer-Facing Essential Vendor Changes Before Event

A vendor who is customer-facing AND essential AND possibly non-substitutable changes close to the event date.

- **Trigger**: Major vendor change after tickets are sold.
- **Impact**: High. Attendees may have bought tickets specifically for this vendor's presence.
- **Decision tree**:
  - Can an adequate substitute be found? → Substitution flow with mandatory attendee notification + refund option.
  - No substitute possible? → Postpone or cancel. Full refund flow.
- **Key question**: Does the substitution materially change what was promised? If yes, attendees should have the choice to keep their ticket or get a refund.

### 2.5 — Operational Vendor Changes Without Attendee Impact

An operational (non-customer-facing) vendor changes.

- **Trigger**: Backend service provider swaps or becomes unavailable.
- **Impact**: None to attendees. Internal logistics adjustment only.
- **Outcome**: Organiser handles the swap. No attendee notification. Event stays `Scheduled`.
- **System responsibility**: Record the change for audit purposes.

---

## 3. Host and Organiser Actions

### 3.1 — Host Cancels

The host decides the event should not take place.

- **Trigger**: Host communicates cancellation.
- **Impact**: All attendees affected. All vendors affected.
- **Outcome**: Event moves to `Cancelled`. Refund flow triggered for all ticket holders. Vendor contracts may have cancellation terms.
- **Responsibility**: Host bears responsibility. Refund and compensation rules apply.
- **System responsibility**: Execute cancellation workflow, notify all parties, trigger refunds, record reason.

### 3.2 — Organiser Cancels

The organiser determines the event is not viable and cancels, potentially against the host's wishes or due to operational impossibility.

- **Trigger**: Organiser signals cancellation (e.g., cannot secure essential vendors, logistics failure).
- **Impact**: Same as host cancel for attendees. Responsibility attribution may differ.
- **Outcome**: Event moves to `Cancelled`. Refund flow triggered.
- **Key difference from 3.1**: Responsibility may fall on the organiser rather than the host. This matters for dispute resolution and liability.

### 3.3 — Host Requests Material Change

The host wants to significantly alter the event (different date, different venue, different theme).

- **Trigger**: Host requests a change that affects the attendee promise.
- **Decision**: Does this count as a "new event" or a "modified event"?
- **Branch A** — Minor change (time shift by an hour): Notification only. Attendees keep their tickets.
- **Branch B** — Material change (different city, different week): Attendees should have the option to keep or refund.
- **System responsibility**: Classify the change, determine notification requirements, manage any opt-out flow.

---

## 4. Attendance and Viability

### 4.1 — Insufficient Attendee Count

Ticket sales or RSVPs are below the threshold needed for the event to be viable.

- **Trigger**: Attendance count falls below a defined threshold as the event date approaches.
- **Decision**: This is a business decision, not a fault condition.
- **Options**:
  - Proceed anyway (accept lower turnout)
  - Extend the booking window / promote harder
  - Downsize (smaller venue, fewer vendors)
  - Postpone to allow more time for sales
  - Cancel
- **Responsibility**: Organiser/host decide. Low attendance is a viability signal, not a blame assignment.
- **System responsibility**: Surface the threshold status. Present options. Do not auto-cancel without human approval.

### 4.2 — Oversold / Capacity Exceeded

More bookings than capacity allows (edge case, should be prevented by the system).

- **Trigger**: Booking count exceeds capacity (race condition or manual override).
- **Outcome**: Waitlist or overflow handling. Some attendees may need to be refunded or transferred.
- **System responsibility**: Enforce capacity limits in the booking flow. If exceeded, flag for organiser resolution.

---

## 5. Event Modification

### 5.1 — Event Postponed

Event is moved to a later date rather than cancelled.

- **Trigger**: Organiser/host decides to delay (due to vendor issues, weather, low attendance, etc.).
- **Impact**: All existing ticket holders affected. Vendors must reconfirm availability.
- **Outcome**: Event moves to `Postponed`. Attendees notified with option to keep booking or request refund. Vendors re-polled for new date.
- **System responsibility**: Manage the postponement workflow. Track which attendees and vendors are confirmed for the new date.

### 5.2 — Event Scope Change (Downsize/Upsize)

Event parameters change significantly (venue size, vendor count, capacity).

- **Trigger**: Organiser adjusts event scope based on demand or operational constraints.
- **Decision**: Does this affect the attendee promise?
- **Branch A** — Downsize that doesn't affect attendee experience: Internal adjustment.
- **Branch B** — Downsize that changes venue/experience: Customer-facing notification needed.
- **Branch C** — Upsize: Generally positive. May open more tickets.

---

## 6. External Disruption

### 6.1 — Force Majeure

An uncontrollable external condition prevents the event (weather, regulation, emergency, infrastructure failure).

- **Trigger**: External event makes the event impossible or unsafe.
- **Impact**: No party is at fault. All parties affected.
- **Outcome**: Event postponed or cancelled. Refund/credit policies may differ from fault-based cancellations.
- **Responsibility**: No party bears fault. System should record the reason distinctly from party-initiated cancellations.
- **System responsibility**: Support a distinct cancellation reason. Potentially different refund rules for force majeure vs. voluntary cancellation.

### 6.2 — Regulatory or Legal Restriction

A new regulation or order prevents the event from proceeding.

- **Trigger**: External legal/regulatory action.
- **Outcome**: Similar to force majeure but may have different liability implications.
- **System responsibility**: Record the specific reason. Support downstream legal/compliance reporting.

---

## 7. Post-Event

### 7.1 — Successful Completion

Event completes as planned.

- **Outcome**: Enable reviews, feedback, vendor ratings. Trigger vendor payouts if applicable.

### 7.2 — Completion with Substitutions

Event completed but with material changes (vendor swaps, venue change).

- **Outcome**: Same as 7.1 but records should reflect what actually happened vs. what was originally promised. Partial refunds or credits may have been issued.

### 7.3 — Post-Event Dispute

An attendee or vendor raises a dispute after the event.

- **Trigger**: Complaint about experience, unfulfilled promise, or service quality.
- **Outcome**: Dispute resolution flow. Admin/operations involvement.
- **System responsibility**: Provide audit trail of what was promised, what changed, and what was communicated.

### 7.4 — Highlights Published by Host and Goers

After event completion, host and verified attendees publish recap content (images, short videos, text).

- **Trigger**: Event transitions to `Completed` (or enters post-event window).
- **Outcome**: Highlights appear on Event Story page and optionally in discovery surfaces.
- **System responsibility**: Enforce permissions, moderate content, preserve media attribution, and prevent off-topic spam.

### 7.5 — Recurring Workshop Builds Momentum Across Sessions

A recurring event (workshop/class) should not reset to zero social proof each time.

- **Trigger**: New occurrence created within a series.
- **Outcome**: Story page shows prior session highlights, reviews, and progression context.
- **System responsibility**: Link occurrences into a series timeline and surface prior proof ("what this is like") to reduce goer uncertainty.

### 7.5A — New Goers Per Occurrence

Each recurring occurrence receives a different attendee mix.

- **Trigger**: A new occurrence opens for booking.
- **Outcome**: Ticketing and interest begin from zero for that occurrence; no automatic attendee carry-over.
- **System responsibility**: Keep attendee records occurrence-scoped and avoid cross-occurrence enrollment.

### 7.5B — Vendors Re-Apply/Re-Confirm Per Occurrence

Recurring events may reuse vendor relationships, but each occurrence requires explicit reconfirmation.

- **Trigger**: A new occurrence is generated from series template.
- **Outcome**: Prior vendors can be invited quickly, but assignments remain unconfirmed until acceptance.
- **System responsibility**: Clone needs as draft/open and require occurrence-level vendor acceptance.

### 7.5C — Single Occurrence Canceled While Series Continues

One date in a recurring series fails (e.g. venue unavailable) but the series remains active.

- **Trigger**: Organiser cancels a specific occurrence.
- **Outcome**: Refund flow and notifications apply only to that occurrence; future occurrences stay scheduled.
- **System responsibility**: Isolate cancellation effects to the affected occurrence and preserve series continuity.

### 7.6 — Event and Vendor Reviews

Verified attendees submit event-level and vendor-level ratings after completion.

- **Trigger**: Event is completed and attendee verification conditions are met.
- **Outcome**: Aggregated ratings appear on event story surfaces and vendor profiles.
- **System responsibility**: Prevent duplicate/inauthentic reviews, support moderation/reporting, and separate event quality from vendor service quality.

---

## Responsibility Matrix (Conceptual)

When something goes wrong, who is responsible?

| Scenario | Primary responsibility | Secondary | Attendee remedy |
| :--- | :--- | :--- | :--- |
| Host cancels | Host | Organiser (communication) | Full refund |
| Organiser cancels (operational failure) | Organiser | Host (if contractual) | Full refund |
| Essential vendor drops, no substitute | Vendor (breach) | Organiser (contingency) | Refund or postponement |
| Non-substitutable vendor drops | Vendor (breach) | Organiser/host (promise management) | Refund option (attendee choice) |
| Low attendance → cancel | Organiser/host (business decision) | — | Full refund |
| Force majeure | No fault | — | Credit or refund (policy-dependent) |
| Operational vendor swap | Organiser (routine) | — | No action needed |
| Customer-facing vendor swap (replaceable) | Organiser | Vendor (if they dropped) | Notification, possibly refund option |

---

## Decision Automation vs Human Approval

Not all decisions should be automated. This framework outlines the conceptual split:

### Can Be Automated

- Enforcing capacity limits on ticket purchases
- Triggering "at-risk" status when a primary vendor is marked unavailable
- Sending templated notifications for minor changes (time shift, operational vendor swap)
- Calculating attendance threshold status
- Recording audit log entries for all state transitions

### Requires Human Approval

- Cancelling an event (organiser or admin must confirm)
- Accepting a substitute for a non-substitutable vendor
- Deciding between postponement and cancellation
- Issuing refunds above a certain threshold
- Overriding system recommendations
- Resolving disputes

### Requires Human Judgment (No Automation)

- Determining whether a specific substitution is "material"
- Assessing force majeure conditions
- Weighing reputational impact of a change
- Deciding on partial vs. full refund for borderline cases

---

## Open Questions for Future Design

These questions are intentionally left open. They should be resolved as the system matures:

- What are the exact attendance thresholds for viability? (Per-event configurable? Platform defaults?)
- How far in advance must a standby be designated?
- What is the notification SLA for material changes? (24 hours? 48 hours?)
- Should attendees be able to opt into "change alerts" for specific vendors?
- How does the refund amount change based on how close to the event date the cancellation occurs?
- Should vendors have SLA commitments in their profiles?
- How does the system handle multi-day events where only one day is affected?
- What happens to vendor payments when an event is cancelled — held in escrow? Auto-refunded?

---

### Changelog

| Date | Change |
| :--- | :--- |
| 2026-02-28 | Initial scenario inventory — vendor failure, cancellation, attendance, force majeure, post-event |
