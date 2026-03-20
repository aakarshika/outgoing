# Guest Landing Page Base Feed Redesign Plan

## Goal

Redesign `GuestLandingPage.tsx` so the guest home feed is driven by `useBaseFeed()` instead of `useFeed()`, with section-specific query presets and chip-driven filtering for the "Things to do" strip.

Card usage for the redesign:

- Things to do: `LargeEventCard` with `showNeeds={true}`
- Online events: `SmallEventCard`
- Nearby events: `SmallEventCard`

## Current State

`GuestLandingPage.tsx` currently:

- uses `useFeed({ sort: 'trending', page_size: 100 })`
- reuses the same response for nearby, online, and things-to-do
- applies most chip logic client-side with loose category and price heuristics
- does not use the richer `BaseFeedEventItem` fields like:
  - `needs`
  - `distance_km`
  - `event_popularity_score`
  - `min_ticket_price`

`TestFeedPage.tsx` already proves the real `useBaseFeed()` contract:

- sort: `popularity | distance | created | start_time`
- filters:
  - `online`
  - `status`
  - `start_time_gte`
  - `start_time_lte`
  - `categories`
  - `free_only`
  - `has_needs`
  - `lat`
  - `lng`

## Feed Strategy

Do not drive all guest sections from one large response. Use separate `useBaseFeed()` queries per section or chip preset.

Why:

- nearby and online want different query shapes
- things-to-do chips need different sort and filter combinations
- `useBaseFeed()` already supports most of the heavy lifting server-side
- it keeps the client ranking layer small and intentional

Recommended structure:

1. `useGuestFeedSectionConfigs()` or local config object in `GuestLandingPage.tsx`
2. one `useBaseFeed()` call for:
   - nearby section
   - online section
   - active things-to-do chip
3. a thin post-processing layer for filters the backend does not support directly

## Section Plan

### 1. Nearby Events

Use `useBaseFeed()` with a query shaped for in-person discovery.

Suggested params:

```ts
{
  sort: 'distance',
  status: ['published', 'event_ready', 'live'],
  start_time_gte: nowIso,
  lat,
  lng,
  page_size: 24,
}
```

Render:

- `SmallEventCard`
- max 8 to 12 cards in the strip

Notes:

- if guest location is unavailable, fall back to a secondary query:
  - `sort: 'popularity'`
  - no `lat/lng`
- label should probably change from "in your city" to a softer fallback like "Popular nearby" when coordinates are missing

### 2. Online Events

Use a separate base-feed query instead of filtering nearby data.

Suggested params:

```ts
{
  sort: 'popularity',
  online: true,
  status: ['published', 'event_ready', 'live'],
  start_time_gte: nowIso,
  page_size: 24,
}
```

Render:

- `SmallEventCard`
- cap to 8 to 12 cards

Optional refinement:

- switch sort to `start_time` if the section should feel more "what is happening soon"
- keep `popularity` if the section should feel more "best online picks"

### 3. Things To Do

This section should become chip-driven and use `LargeEventCard showNeeds={true}`.

Suggested behavior:

- default chip decides the base query
- chip click updates a config object
- query result may be lightly post-filtered and ranked before rendering
- cap to 4 to 8 cards depending on layout

## Things To Do Chip Mapping

Use a chip config map instead of a large `switch`.

Suggested shape:

```ts
type ThingsToDoChipConfig = {
  label: FilterChip;
  baseParams: BaseFeedParams;
  postFilter?: (item: BaseFeedEventItem) => boolean;
  rank?: (item: BaseFeedEventItem) => number;
  emptyStateCopy?: string;
};
```

### Chip: This weekend

Primary intent:

- upcoming weekend events
- balanced for relevance and attendance potential

Suggested query:

```ts
{
  sort: 'start_time',
  status: ['published', 'event_ready', 'live'],
  start_time_gte: weekendStartIso,
  start_time_lte: nextMondayIso,
  page_size: 32,
}
```

Suggested ranking:

- boost `event_popularity_score`
- boost items with `needs.length > 0`
- boost items with cover image

### Chip: Tonight

Primary intent:

- events starting today
- soonest first, with live events optionally pinned

Suggested query:

```ts
{
  sort: 'start_time',
  status: ['published', 'event_ready', 'live'],
  start_time_gte: nowIso,
  start_time_lte: tomorrowStartIso,
  page_size: 32,
}
```

Suggested local ranking:

- `live` first
- then earliest `start_time`
- then `event_popularity_score`

### Chip: Free

Primary intent:

- easy conversion for guests with low friction

Suggested query:

```ts
{
  sort: 'popularity',
  free_only: true,
  status: ['published', 'event_ready', 'live'],
  start_time_gte: nowIso,
  page_size: 32,
}
```

Suggested local ranking:

- popularity first
- then sooner `start_time`
- then needs-open boost

### Chip: Under $20

Primary intent:

- low-cost discovery

Backend support:

- no direct max-price filter exists in `useBaseFeed()`

Recommended approach:

1. query a broad upcoming pool
2. post-filter on `min_ticket_price`
3. sort by ascending `min_ticket_price`, then popularity

Suggested query:

```ts
{
  sort: 'popularity',
  status: ['published', 'event_ready', 'live'],
  start_time_gte: nowIso,
  page_size: 40,
}
```

Suggested post-filter:

```ts
item.min_ticket_price > 0 && item.min_ticket_price <= 20
```

Risk:

- confirm whether `min_ticket_price` is stored in dollars, cents, or local currency units before shipping this chip

### Chip: Outdoors

Primary intent:

- category-driven outdoor/sports exploration

Suggested query:

```ts
{
  sort: 'popularity',
  status: ['published', 'event_ready', 'live'],
  start_time_gte: nowIso,
  categories: ['outdoors', 'sports'],
  page_size: 32,
}
```

Implementation detail:

- do not hardcode slugs until they are verified from `useCategories()`
- map this chip to actual category slugs at runtime

### Chip: New in town

This chip is ambiguous and should not be implemented as a random category guess.

Possible meanings:

- newest events created recently
- newcomer-friendly social/community events
- events from new hosts

Recommended v1 if no product clarification arrives:

```ts
{
  sort: 'created',
  status: ['published', 'event_ready', 'live'],
  start_time_gte: nowIso,
  page_size: 32,
}
```

Optional local ranking:

- boost social/community categories
- demote stale events far in the future

### Chip: Contributor spots open

This is the strongest `useBaseFeed()` fit.

Suggested query:

```ts
{
  sort: 'popularity',
  has_needs: true,
  status: ['published', 'event_ready', 'live'],
  start_time_gte: nowIso,
  page_size: 32,
}
```

Render notes:

- use `LargeEventCard showNeeds={true}`
- this chip should rely on real `needs` data, not category heuristics

Suggested local ranking:

- more open needs first
- then popularity
- then sooner start time

## Shared Utility Work

Before wiring the page, extract or reuse common helpers instead of duplicating date logic.

Recommended helpers:

- `getFeedTimeRange()` from `searchUtils.ts`
- `getLowestTicketPrice()` style logic only where needed
- `isOnlineEvent()` only for fallback/local checks

Preferred cleanup:

- move date-window helpers needed by both guest and search into a shared utility, for example:
  - `frontend/src/features/events/feedWindows.ts`

Helpers to add:

- `getTonightRange()`
- `getWeekendRange()`
- `getUpcomingNowIso()`
- `buildThingsToDoChipConfig()`

## Implementation Sequence

### Phase 1. Swap the data model

- change guest home feed usage from `useFeed()` to `useBaseFeed()`
- update event typing from `EventListItem` to `BaseFeedEventItem` where those sections render cards
- remove `EventCard` and `ThingsToDoCard` from guest page once the real event cards are used

### Phase 2. Wire dedicated section queries

- nearby section gets its own base-feed params
- online section gets its own base-feed params
- things-to-do gets params from active chip config

### Phase 3. Add chip config and ranking

- replace the current `switch (activeFilter)` logic with a config map
- keep server-side filters primary
- use client-side ranking only for:
  - under-price thresholds
  - tie-breaking
  - ambiguous product heuristics like "New in town"

### Phase 4. Update rendering

- nearby section: `SmallEventCard`
- online section: `SmallEventCard`
- things-to-do section: `LargeEventCard showNeeds={true}`

### Phase 5. Empty/loading states

- loading state per section, not one shared spinner for all strips
- empty state copy should reflect chip intent:
  - "No free events right now"
  - "No contributor spots open right now"
  - "No outdoor events coming up"

## Sorting and Ranking Rules

Use server sort as the primary sort. Only apply local ranking after fetch when the UI intent is more specific than the API allows.

Good use of server sort:

- `distance` for nearby
- `start_time` for tonight and this weekend
- `created` for newness
- `popularity` for general conversion-focused discovery

Good use of local ranking:

- pin `live` events at the top for tonight
- promote cards with open needs in things-to-do
- sort "Under $20" by `min_ticket_price`
- boost events with images or stronger social proof

Avoid:

- fetching one large general pool and filtering everything locally
- using category-name string matching for contributor-needs logic
- mixing nearby and online from the same response

## Known Gaps To Confirm

1. Guest location source for nearby:
   - browser geolocation
   - stored search location
   - city-level fallback

2. Price units for `min_ticket_price`:
   - if values are not whole dollars, the "Under $20" chip needs a conversion rule

3. Meaning of "New in town":
   - newest events
   - newcomer-friendly events
   - new hosts

4. Category slugs for "Outdoors":
   - must be verified against `useCategories()`

## Questions To Edit

Please edit these answers directly in this file or send them back before implementation:

- Nearby source of truth:
  - [ ] Use browser geolocation if available
  - [x] Use stored search location first
  - [ ] Fall back to popularity without distance

- "New in town" should mean:
  - [x] Recently created events
  - [ ] Social / newcomer-friendly events
  - [ ] Events from new hosts

- "Under $20" should use:
  - [ ] Exact USD threshold on `min_ticket_price`
  - [ ] A different currency/threshold
  - [x] just compare price number. dont worry about currency. it will always be in rupees.

- Things-to-do default chip:
  - [ ] This weekend
  - [ ] Tonight
  - [x] Contributor spots open

## Recommended Starting Point

If implementation starts now without more product input, the safest v1 is:

- nearby: `useBaseFeed({ sort: 'distance' | fallback popularity })`
- online: `useBaseFeed({ online: true, sort: 'popularity' })`
- things to do:
  - `This weekend`
  - `Tonight`
  - `Free`
  - `Under $20`
  - `Outdoors`
  - `Contributor spots open`
- leave `New in town` disabled or mark it as pending clarification
