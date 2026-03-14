# Home Page Renewed

## Objective

Build a new home page file and reorder sections using existing section UIs, existing cards, and existing APIs first. Add placeholders where data/API is missing. Keep visuals consistent with current scrapbook/comic style.

## UI Guardrails (Must Follow)

- Do not change internals of existing cards:
  - `ScrapbookEventCard`
  - `HostCard`
  - `VendorBusinessCard`
- Reuse existing feed UI patterns:
  - `HorizontalScrapbookList`
  - existing feed sections/components from home page modules
- Keep top hero and bedroom carousel unchanged.
- Home page should be available to everyone (no auth wall for page access).
- New map section is placeholder-only in this phase:
  - comic-themed border
  - slightly skewed window
  - bordered on larger screens
  - mobile: full width with no border
- Use placeholders when new API is needed (no backend changes in this phase).

## Confirmed Behavior

- Top and bottom `Relevant / Trending / Nearby` sections are the same component behavior.
- No alternate styling/title needed between the two repeated filter sections.
- `Online / Offline`:
  - online if `location_address === "Online Event"`
  - otherwise offline
- `Online / Offline` visible for signed-out users as well.
- `Going` and `Saved`:
  - use existing dashboard data sources
  - if same event appears in both, show in both
  - empty messages:
    - Going: `start browsing to find what to do`
    - Saved: `Your likes and save the dates will appear here.`
- Two CTA cards always visible:
  - services CTA -> `/dashboard/services/opportunities`
  - events CTA -> `/dashboard/events`
- Highlight strip section 1: keep current behavior; no changes.
- Memories strip section 2:
  - source: all user-added highlights (auth-only)
  - hide section when signed out
  - when empty, show prompt and route to `/dashboard/tickets`
- Iconic hosts and vendors: separate sections, no randomization.

## Implementation Phases

### Phase 1 - New Home Page Shell + Reorder + Placeholders

1. Create a new home page file (`Home Page Renewed`) without modifying card internals.
2. Reuse existing sections from current home modules.
3. Reorder sections based on new flow.
4. Add filter-button labels where needed.
5. Add placeholder sections for any missing data/API.
6. Skip full wiring for:
   - Going
   - Saved
   - My Services
   - My Events

### Phase 2 - Wire New Sections With Existing APIs

1. Add new sections fully.
2. Wire `Going`, `Saved`, `My Services`, `My Events` from existing dashboard APIs.
3. Keep feed UI style unchanged by passing event/service data into existing list/card components.

### Phase 3 - Section-Level Enhancements (No Card Redesign)

1. Add/complete filter controls in section wrappers (example: generic feed wrappers).
2. Preserve existing card visuals and interaction style.
3. Keep API usage frontend-only; leave unsupported behavior as placeholders.

## Pending Clarifications

- Final exact top-to-bottom section order for all blocks in renewed page.
in gave the final order in the homeplan.md
- Whether current legacy sections not listed in the new plan should be fully removed immediately.
leave it for the old home page.
- Exact visual spec for second film strip variant (color/skew values).
blue and skew - mirrored of current, skew amount low

put the new home page at /
and move old one to /oldhome
