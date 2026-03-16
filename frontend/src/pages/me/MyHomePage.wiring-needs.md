# MyHomePage Wiring Needs

This document captures the decisions and inputs needed before wiring [`MyHomePage.tsx`](/Users/aakarshika/Dev/outgoing/frontend/src/pages/me/MyHomePage.tsx) to real user data.

## What I can infer from the references

From [`SearchPage.tsx`](/Users/aakarshika/Dev/outgoing/frontend/src/pages/search/SearchPage.tsx):

- The app already uses `useAuth()` for auth-aware behavior.
- The app already uses `useFeed()` and category hooks for event lists.
- The app already has opportunity APIs:
  - `fetchAllOpenOpportunities()`
  - `fetchMyPotentialOpportunities()`
  - `fetchMyVendorOpportunities()`
- The app already uses query-param-driven filtering and event/opportunity separation.

From [`HomePage.tsx`](/Users/aakarshika/Dev/outgoing/frontend/src/pages/home/HomePage.tsx):

- The app already switches behavior based on `isAuthenticated`.
- The app already renders feed-backed sections modularly.
- The app already has a pattern for personalized signed-in content.

From [`MyHomePage.tsx`](/Users/aakarshika/Dev/outgoing/frontend/src/pages/me/MyHomePage.tsx):

- The current screen is a visual mock with hardcoded sections:
  - next event
  - upcoming events
  - weekend filters
  - weekend events
  - contribution cards
  - groups
  - recommended events
- None of those sections are wired to user-specific APIs yet.

## Questions I need you to answer

### 1. Page purpose

What should `MyHomePage` be for?

- A personalized dashboard for the signed-in user

### 2. Auth behavior

What should happen if the user is not signed in?

- Redirect to sign-in

### 3. Data source for "next event"

Which real source should populate the top featured event card?

- Trending feed. `useFeed()` - it is already being used in SearchPage. use the same.

### 4. Data source for "upcoming events"

What exactly should the upcoming list represent?

- fetch from the same api as we are doing in CalendarPage.

### 5. "This weekend" filters and cards

What should the weekend/discovery strip be backed by?

- `useFeed()` with predefined filters

Should those chips be cosmetic or real filters?

### 6. "Contribute" / opportunity cards

Should this section reuse the opportunity logic already used in search?

- `fetchMyVendorOpportunities()`
- `fetchMyPotentialOpportunities()`
- both merged - see SearchPage

### 7. Groups section

What is a "group" in the current product model?

- Nothing. Replace with "Network" - does nothing.

### 8. Recommended events

Should this reuse:

- `useFeed()`

What is the desired ranking logic if no personalized API exists yet?

### 9. User identity and profile data

What user fields are available and intended for this page?

- check page user/:username . - get whatever you can.

This matters because `MyHomePage` likely should greet or tailor content to the signed-in user instead of showing generic copy.

### 10. Empty states

What should happen if the user has:

- no upcoming events
- no recommendations
- no opportunities
- no groups

PLACEHOLDERS all around .

### 11. Navigation behavior

What should clicking each card do?

- nothing right now.

### 12. Scope for first wiring pass

Which of these are required now versus acceptable as placeholders?

- Fully wire all sections
- Wire only event sections first
- Wire events + opportunities, leave groups static
- Ship auth gating and one personalized feed first

## Proposed implementation shape

If you want a first pragmatic pass, I would wire it in this order:

1. Auth gate using `useAuth()`.
2. Replace `nextEvent` and `upcomingEvents` with real user-event data.
3. Replace `contributionCards` with real opportunity data.
4. Replace `recommendedEvents` / weekend strips with `useFeed()`-backed discovery.
5. Leave `groups` static unless a real group model already exists.

## Minimum inputs I need from you to start

answered above.
