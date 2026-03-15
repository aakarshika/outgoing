# Planning Workspace Migration Questions

This document compares the old host flow in [`ManageForHostPage.tsx`](/Users/aakarshika/Dev/outgoing/frontend/src/pages/events/ManageForHostPage.tsx) with the new UI-only planning workspace in [`PlanningWorkspacePage.tsx`](/Users/aakarshika/Dev/outgoing/frontend/src/pages/events/PlanningWorkspacePage.tsx).

## What is missing functionally right now

The new page is currently UI-only. Compared to the old host flow, it is missing these functional capabilities:

- Event loading from the backend via `useEvent(id)`.
- Host permission enforcement and redirect if the current user is not the event host.
- Category loading via `useCategories()`.
- Lifecycle-aware default step routing based on `event.lifecycle_state`.
- Multi-step route flow:
  - `basic-details`
  - `publish`
  - `services-prep`
  - `event-readiness`
  - `live-attendance`
  - `wrap-up`
- Step tab navigation and step-to-step progression.
- Real form state seeded from backend event data.
- Dirty-state tracking and save button enable/disable logic.
- Save/update submission through `updateEvent(...)`.
- Ticket tier persistence through `useUpdateTicketTiers()`.
- Ticket capacity validation logic.
- Cover image upload and image compression before save.
- Quick vs advanced input mode for event setup.
- Event features/tag editing and persistence.
- When/where editing:
  - online vs offline mode
  - online URL
  - venue/address refs
  - browser geolocation
  - reverse geocoding
- Event duration editing.
- Recurrence editing:
  - recurring toggle
  - frequency
  - days
  - RRULE generation
  - occurrence preview
  - series occurrence generation
- Apply-to-series behavior for draft occurrences.
- Series timeline / occurrence switching.
- Publish step behavior.
- Services prep behavior.
- Event readiness behavior.
- Live attendance behavior.
- Wrap-up behavior.
- Query cache refresh / patching after save.
- Toast success/error handling around real mutations.

## Questions I need answered

### 1. Scope

Should `/events/:id/manage` fully replace [`ManageForHostPage.tsx`](/Users/aakarshika/Dev/outgoing/frontend/src/pages/events/ManageForHostPage.tsx), or is it only a new lightweight planning surface for part of the host workflow?

-fully replace


### 2. Routing model

Do you want the new page to stay as a single-page workspace, or should it preserve the old step-based route model under `/events/:id/manage/...`?

If step routes should remain, what should the new URLs be?

- leave old be.

### 3. Lifecycle mapping

In the old page, lifecycle state changes which step opens by default.

Should the new page:

- always open the same workspace. 

### 4. Event loading and permissions

Should `/events/:id/manage` immediately load the real event and enforce host-only access exactly like the old page?

If not exactly, what should the unauthorized behavior be? 

- redirect to /

### 5. Details editing

Should the new workspace own all of the old “Info” editing capabilities?

That includes:

- title
- category
- description
- cover image
- event features
- when/where
- capacity
- ticket tiers

Or do you want some of those to stay in a separate editor?

- everything must be here together.

### 6. Quick vs advanced mode

The old page had both `quick` and `advanced` input modes.

Do you still want those in the new manage experience, or should the new workspace have only one editing mode?

- no modes. single page. 

### 7. Tickets

The new tickets card is summary-only right now.

Should it support the old ticket editing behavior:

- add/edit/remove tiers
- capacity auto-balancing on the last tier
- refund fields
- admits / pass count fields
- total capacity validation

everything must be there and the look of the new ticket section will also be tickety but not too much. including color scheme.
when add ticket is clicked, open a little form that also looks tickety.

### 8. Needs board

The new needs board and add-need overlay are UI only.

What should the actual need workflow be?

- create new need
- edit existing need
- review applicants
- assign vendor/friend
- mark filled/open/pending
- set cancellation rules
- set thresholds per need

Do all of those belong in this workspace?

- create new / edit existing need - on the needs overlay.
- review applicants - new overlay. 
- assign vendor/friend - assign/invite button will open a little confirmation box right there with an optional message.
- on this section top right will be a button "browse vendors" - new overlay
- mark filled/open/pending - - - host override functionality will also be there with a similar box that i had.
- set cancellation rules - on add/edit need overlay.
- set thresholds per need - on add/edit need overlay.

- another feature - After selecting the basic section, there will be the "features" section - simple add from dropdown - no type for features needed.
- here when user has added the features, they can mark it as "I need it outsourced". - functionality will be implemented later.

### 9. Vendor search / friend assignment

The old page’s “services prep” step likely has real sourcing / assignment logic.

Should the “Find vendors & friends” card:

- reuse that exact logic
- reuse only the data contracts
- be a simpler assignment surface
- stay UI-only for now

### 10. Series support

The old page supports recurring events and series occurrence generation.

Do you want recurrence and series management inside the new `/events/:id/manage` page?

If yes:

- Should “Apply to all drafts” remain?
- Should the series timeline remain?
- Should switching between occurrences remain?

### 11. Publish / readiness / live / wrap-up

The old page has distinct functional steps after setup.

Should the new workspace absorb these workflows:

- publish
- readiness checklist
- live attendance
- wrap-up

Or should `/events/:id/manage` only cover planning/pre-event work?

### 12. Save model

How should save work in the new page?

- autosave per section
- explicit “Save” button
- save draft only
- section-level save buttons

And should tickets / needs save separately from event details, like the old page effectively does?

### 13. Section edit boundaries

Right now the new UI presents these as cards:

- Event details
- Tickets
- Needs board
- Pre-event checklist
- Find vendors & friends
- Co-organiser chat

Which of these should become editable first, and which can stay read-only placeholders?

### 14. Checklist source of truth

The old flow had functional state across steps. The new checklist is mocked.

Should checklist items be:

- derived from actual event completeness
- manually managed
- lifecycle-driven
- partly derived and partly manual

### 15. Chat

The co-organiser chat card is UI-only.

Should this connect to any existing chat system, or is that out of scope for now?

### 16. Existing components reuse

Do you want me to reuse old components where possible from the old host flow, or should I keep the new page visually distinct and only port over logic/data contracts?

This matters because there are two migration strategies:

- embed/adapt old functional components into the new workspace
- rebuild each section on top of the new UI using the same APIs and hooks

### 17. Old page retirement

Once the missing behaviors are migrated, should the old host route:

- redirect to `/events/:id/manage`
- remain available temporarily
- keep some advanced functions the new workspace will not own

## Recommended decisions to unblock implementation

If you want the cleanest next step, I need answers to these first:

1. Is `/events/:id/manage` replacing the old host flow or only part of it?
2. Should the new page preserve the old step/lifecycle behavior?
3. Which sections must become functional first:
   - event details
   - tickets
   - needs
   - publish/readiness/live/wrap-up
4. Whether recurrence/series support must stay in scope.
5. Whether to reuse old components directly or only port their logic.
