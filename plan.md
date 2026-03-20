# Chat Drawer Scope Reduction Plan

## Recommendation

Yes. I recommend reducing scope and making the drawer the only real chat-thread surface.

That means:

- stop using the old `ChatDrawer` implementation as a design/functionality reference
- stop making chat selection depend on `/chats/group/:eventId`, `/chats/private/:conversationId`, and `/chats/direct/:username`
- keep one shared drawer flow that can open from anywhere
- let the chats page become a list page that opens the same drawer as every other entry point

This is the lowest-risk refactor because it removes the split ownership between page state and route state.

## Clean Model

### Source of truth

The chat drawer context should become the single source of truth for:

- whether a chat is open
- which chat is open
- which mode is open (`group`, `direct`, `private`)

### Chats page

[`frontend/src/pages/chats/ChatsPage.tsx`](/Users/aakarshika/Dev/outgoing/frontend/src/pages/chats/ChatsPage.tsx) should only own:

- chat list loading
- search/filtering
- click-to-open behavior

It should no longer own thread rendering as part of the page layout.

### Drawer

[`frontend/src/pages/events/components/ChatDrawer.tsx`](/Users/aakarshika/Dev/outgoing/frontend/src/pages/events/components/ChatDrawer.tsx) should be replaced with the new thread UI based on the existing `ChatsPage` thread design, not on the old drawer design.

## URL Strategy

## Recommended default

Do not make URLs govern chat state.

Recommended behavior:

- opening a chat from anywhere opens the drawer only
- current page URL stays unchanged
- closing the drawer returns the user to the same page

Examples:

- `/chats` -> click a chat -> drawer opens, URL stays `/chats`
- `/network` -> click message -> drawer opens, URL stays `/network`
- `/manage` -> click chat -> drawer opens, URL stays `/manage`

This keeps routing simple and removes a lot of synchronization logic.

## If URLs are needed later

Your fallback idea is the right one:

- keep chat state drawer-driven
- add a small route-aware component only where needed
- that component reads a URL and opens the drawer on mount

So if later you want shareable links from the chats page, you can add something like:

- `/chats/:mode/:id`

and mount a lightweight opener component that:

1. resolves the route params into drawer params
2. calls `openChat(...)`
3. optionally redirects back to `/chats`

Important point: the route component should not own the chat UI. It should only translate URL -> drawer open.

That preserves the reduced architecture.

## Why this is better

- one thread implementation instead of page thread + drawer thread
- one state model instead of route state + local page state + drawer state
- less fragile close/back behavior
- easier to open the same chat UI from any surface in the app
- simpler follow-up work if you later replace the drawer shell again

## Revised Implementation Plan

1. Extract the current `ChatsPage` thread UI/logic into a reusable shared component.
2. Replace the existing drawer internals with that shared thread component.
3. Remove inline thread rendering from [`frontend/src/pages/chats/ChatsPage.tsx`](/Users/aakarshika/Dev/outgoing/frontend/src/pages/chats/ChatsPage.tsx).
4. Change chat selection on the chats page to call the global drawer context instead of navigating to thread URLs.
5. Leave other `openChat(...)` entry points using the same drawer.
6. Deprecate old thread-routing logic from the chats page.

## File Impact

- [`frontend/src/pages/chats/ChatsPage.tsx`](/Users/aakarshika/Dev/outgoing/frontend/src/pages/chats/ChatsPage.tsx)
  - remove inline thread rendering
  - remove route-selected-thread dependency
  - keep list/search/filter behavior
- [`frontend/src/pages/events/components/ChatDrawer.tsx`](/Users/aakarshika/Dev/outgoing/frontend/src/pages/events/components/ChatDrawer.tsx)
  - replace with the new thread UI
- [`frontend/src/features/events/ChatDrawerContext.tsx`](/Users/aakarshika/Dev/outgoing/frontend/src/features/events/ChatDrawerContext.tsx)
  - keep as the single chat state owner
- new shared component
  - likely `frontend/src/pages/chats/components/ChatThreadPanel.tsx`
- routing config
  - remove or stop relying on thread-specific chat routes if they are no longer needed

## Optional URL Bridge Later

If you want deep links later without reintroducing page-owned thread UI:

- keep `/chats` as the real chat page
- add optional routes only as drawer openers
- do not rebuild inline thread rendering

That is the right compromise if shareable URLs become necessary.

## Open Question

Do you want me to assume the thread-specific chat routes will be removed entirely now, or should I keep them temporarily as no-UI drawer opener routes for backward compatibility?
