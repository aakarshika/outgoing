# Network Activity Redesign Plan

## Goal

Redesign network activity to return:

- A list of events
- Include only events that have friend activity for the current user
- Grouped by `event.category`
- Each event includes relevant attendees (friends) with activity labels

Friends are only:

- Accepted friends
- Friendship qualifies for "friend" orbit membership only when `friendship.orbit_category` matches the event category

`includes` means the friend has at least one of:

- Going (has active/used ticket)
- Hosting (event host)
- Servicing (assigned vendor on an event need)

For each included event:

- `relevant_attendees` should include all friend attendees who are active in that event
- They can come from any orbit categories (not restricted to event category for attendee listing)
- Each attendee includes their activity (`going`, `hosting`, `servicing`)

---

## Desired API Contract

### Endpoint

- Reuse `GET /events/network/activity/` (recommended, non-breaking URL)
- Replace payload shape (or version behind query param during migration)

### Response shape (proposed)

```json
{
  "groups": [
    {
      "orbit_category_slug": "music",
      "orbit_category_name": "Music",
      "events": [
        {
          "event_id": 123,
          "title": "Indie Jam Night",
          "subtitle": "Sat · 8:00 PM · Indiranagar",
          "start_time": "2026-03-21T20:00:00Z",
          "relevant_attendees": [
            {
              "user_id": 11,
              "username": "alice",
              "first_name": "Alice",
              "last_name": "R",
              "avatar": "https://...",
              "role": "friend",
              "activity_type": "going"
            },
            {
              "user_id": 22,
              "username": "bob",
              "first_name": "Bob",
              "last_name": "",
              "avatar": "https://...",
              "role": "friend",
              "activity_type": "hosting"
            },
            {
              "user_id": 31,
              "username": "carol",
              "first_name": "Carol",
              "last_name": "",
              "avatar": "https://...",
              "role": "friend",
              "activity_type": "servicing"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Backend Design

### 1) Define friend universe

For current user:

- `friend_ids`: accepted friendships only
- also build friend->orbit_category set for avatar/orbit-aware metadata

No host/vendor network pools are needed.

### 2) Build event-level candidate sets

Identify events where at least one friend is active:

- `going_event_ids`: tickets (`active`/`used`) by friend users
- `servicing_event_ids`: event needs with assigned vendor in friend users
- `hosting_event_ids`: events hosted by friend users

Union to `candidate_event_ids`.

### 3) Fetch event records

Single event query:

- `Event.objects.filter(id__in=candidate_event_ids, status="published")`
- `select_related("category", "host")`

### 4) Build attendees per event

For each event, attach users that match any rule:

- Friend with ticket -> `role: friend`, `activity_type: going`
- Friend as host -> `role: friend`, `activity_type: hosting`
- Friend as assigned vendor -> `role: friend`, `activity_type: servicing`

Deduping policy:

- One attendee entry per `(event_id, user_id)`
- Priority for role/activity if multiple matches:
  - `hosting` > `servicing` > `going` (or return array of activities)
  - Recommended: return `activities: ["hosting", "going"]` to avoid data loss

### 5) Group by category

Group events by:

- `event.category.slug` (event category only)
- fallback `"other"` when missing category

Sort:

- Groups alphabetically, `"other"` last
- Events in group by recency (`start_time` desc or latest relevant activity desc)

### 6) Output serializer

Create explicit serializers for:

- attendee item
- event item
- category group

Avoid legacy `kind` activity feed format once cutover completes.

---

## Frontend Design

### 1) API types

In `frontend/src/features/events/api.ts`:

- Add `NetworkActivityEventGroupResponse`
- Remove dependency on flat `NetworkActivityItem[]`

### 2) Source transform

In `YourNetworkPage`:

- Stop merging by flat `(event_id, kind)`
- Consume grouped events directly from API
- Map backend group -> `NetworkActivityGroup` UI model
- Map backend event -> `ActivityItem` (with embedded relevant attendees list)

### 3) Rendering

In `NetworkActivitySection`:

- Render per category group
- Render event cards from grouped event list
- For each event, show attendee avatars from `relevant_attendees`
- Use `FriendAvatar` for each attendee user
- Show activity sentence in card, e.g.:
  - `x, y, z are going`
  - `h is hosting`
  - `s is servicing this event`

---

## Migration Strategy

### Phase A (safe rollout)

1. Add new backend response format behind query flag:
   - `/events/network/activity/?v=2`
2. Update frontend to consume `v=2` while keeping old parser as fallback.
3. QA with seeded data.

### Phase B (cleanup)

1. Remove old flat activity response code.
2. Remove old frontend merge helpers and obsolete types.
3. Keep only grouped-by-category event model.

---

## Validation Checklist

### Backend checks

- [ ] Only friends are considered as relevant attendees
- [ ] Event is included only when at least one friend has activity in it
- [ ] No duplicate attendee per event
- [ ] Event grouping key comes from `event.category`
- [ ] Query count remains controlled (no N+1)

### Frontend checks

- [ ] Groups match backend category buckets exactly
- [ ] Event cards show friend attendees and their activity labels correctly
- [ ] Avatar rings reflect orbit categories correctly
- [ ] Empty states work when no groups/events

---

## Open Decisions

1. Should pending friendships be excluded entirely? (recommended: yes, only accepted)
2. Should private/unpublished events be excluded? (recommended: yes)
3. Event sorting basis:
   - event start time
   - latest attendee activity timestamp
4. If friend has multiple activities in same event, should API return one priority activity or full activity array?

---

## Estimated Implementation Steps

1. Add backend `v2` builder + serializers.
2. Add frontend `v2` API types + hook.
3. Update `YourNetworkPage` mapping logic.
4. Update `NetworkActivitySection` to event-first render.
5. Remove legacy flat activity code after verification.
