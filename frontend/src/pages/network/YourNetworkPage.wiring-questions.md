# Your Network Page — Wiring (Answered from APIs & Models)

Answers inferred from the codebase: backend APIs, models, and `BuddyRequestPanel` / `ChatDrawer` behavior.

---

## 1. Data & backend

### 1.1 Network list (buddies)

- **Added:** `GET /events/friendships/` returns `{ accepted, pending_incoming, pending_outgoing }` (each list of `FriendshipSerializer`). Use `accepted` as the buddy list. Each item has `user1_username`, `user2_username`, `request_sender_username`, `met_at_event`, `met_at_event_title`, `status`, etc. “Other” user = the one that isn’t current user. Category / “events together” are **not** in the API yet; keep mock or derive later from events + categories + tickets.
- **Event detail** exposes `attendees` (from tickets with status active/used); categories come from **event categories**. So “category” and “events together” can be derived later from events + tickets the user and buddy share.

### 1.2 Pending / suggested buddy requests

- **Incoming/outgoing:** From `GET /events/friendships/`: `pending_incoming` and `pending_outgoing`. Each has `met_at_event` (id) for accept/withdraw.
- **Accept / withdraw / send:** Use **existing event-scoped API** with `event_id` = `met_at_event` from the friendship row. For **accept** and **withdraw** we have `met_at_event` from the list. For **send request** (suggested people) we don’t have an event yet — keep mock and “Send request” can open event detail or search to pick an event, then use `BuddyRequestPanel` there; or add a “send from network” flow later with a chosen event.
- **Suggested people:** No backend yet. Keep **mock** for now.

### 1.3 “Almost met”

- No endpoint. Keep **mock** for now. Later: derive from “users who attended same events (tickets used) but are not buddies”.

### 1.4 Activity feed (“Movement”)

- No dedicated API. Keep **mock**. Later: derive from events (who’s hosting / going) and tickets.

### 1.5 Stats (hero numbers)

- Use **real counts** where possible: e.g. “people in your orbit” = `accepted.length`; “shared nights out” / “plans moving” can stay mock or be derived later from events + tickets.

### 1.6 Network groups / “Circles”

- Keep **mock** counts for now. Later: derive from buddies + events (e.g. Hosts = buddies who have hosted).

### 1.7 “Your strongest pattern” / “Most of your energy…”

- **Static** copy for now.

---

## 2. Auth & empty states

### 2.1 Authentication

- Page is **protected**: use same pattern as other app routes (e.g. redirect to login if not authenticated). Use existing auth hooks.
- Show **same navbar** as rest of app (e.g. `SimpleNavbar`); “Your Network” already in nav.

### 2.2 Empty / loading

- **Empty state** when no buddies and no pending: e.g. “Start going to events to grow your network” + CTA to Search.
- **Loading:** Use skeleton/placeholders while `GET /events/friendships/` (and any other data) is loading.

---

## 3. Navigation & actions

### 3.1 Hero

- **“Search your people…”** → Navigate to **Search** (`/search`), optionally with a tab or query for “my network” if the search page supports it.
- **“Make a plan”** → Navigate to **Search** (`/search`) for events.

### 3.2 Buddy cards

- **“Join [Name]”** → Navigate to **event detail** `/events/:id` when we have `event_id` (from real data: e.g. first shared/upcoming event; mock data can use a placeholder id or link to search).
- **“Message”** → Use **user-level DMs**: `addDirectMessage(targetUsername, payload)`. No event required. Open a chat drawer or navigate to a messages view that uses `mode='direct'` and `targetUsername` (no `eventId`). If we later want BuddyRequestPanel in that flow, we need an event (e.g. met_at_event); for “Message” from network page we use **direct messages** only.
- **“Suggest an event”** → Navigate to **Search** (`/search`).
- **“Assign a need”** → Navigate to event’s planning workspace or vendor needs (e.g. `/events/:id/manage` when we have event context).

### 3.3 Request cards (incoming / suggested)

- **“Accept request”** → `updateFriendRequest(met_at_event_id, username, { action: 'accept' })`. Use `met_at_event` from the pending-incoming item. If `met_at_event` is null, fallback: e.g. open event detail or show “Accept from an event” (or skip).
- **“Not now” / “Ignore”** → For **incoming**: backend has no “decline”; we can hide or show “Not now” that just closes/dismisses, or add decline later. For **outgoing**: “Withdraw” via `updateFriendRequest(met_at_event_id, username, { action: 'withdraw' })`.
- **“Send request”** (suggested): No event_id on network page. Navigate to **Search** or event detail and use **BuddyRequestPanel** there (eventId + targetUsername). Or open a modal that lets user pick an event then send (future).
- **“Say hi first”** → Same as “Message”: open **direct** conversation with that user.

### 3.4 “Almost met”

- **“Say hi” / “Connect”** → Open **direct** message with that user (no event).

### 3.5 Activity

- **“See event” / “Join [Name]”** → Navigate to **event detail** `/events/:id` when we have event id in payload; mock data can use placeholder or link to search.

### 3.6 Section links

- **“See all 24”** → Same page; optionally scroll to full buddy list or set filter. No extra route for now.

---

## 4. Filtering & tabs

### 4.1 Category filters

- **Filter the buddy list** in the UI when we have category (e.g. from derived data). With only friendship list from API, no category yet — filters can be **UI-only** and apply when we have category (mock or future field). “Going this weekend” / “Hosting” same: apply when data exists.

### 4.2 Network groups (circles)

- Clicking a circle **filters the main list** by that type. Types/counts mock for now.

---

## 5. Event references

- **Event detail URL:** `/events/:id` (numeric id). Used for “Join”, “See event”, and for accept/withdraw/send buddy request when we have `met_at_event_id`.
- Buddy cards, activity, requests: when using **real** data, include `event_id` (and optionally slug) from API so links work.

---

## 6. Scope implemented

- **Auth:** Redirect or show login when not authenticated; use app navbar.
- **Data:** Use `GET /events/friendships/` for buddies and pending requests; stats from `accepted.length` where applicable; rest mock or derived later.
- **Navigation:** All hero, buddy, request, almost-met, and activity CTAs wired as above (Search, event detail, direct message, accept/withdraw with `met_at_event_id`).
- **Request actions:** Reuse same logic as **BuddyRequestPanel**: `useFriendRequestStatus(eventId, targetUsername)`, `useSendFriendRequest`, `useUpdateFriendRequest`; on network page, `eventId` = `met_at_event` from the list when available.
