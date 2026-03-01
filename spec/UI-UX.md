# UI / UX [DRAFT]

## Design System

### Foundation

| Property | Value | Notes |
| :--- | :--- | :--- |
| Component Library | shadcn/ui + Radix Primitives | |
| Styling | TailwindCSS | |
| Theme | Dark mode | Primary theme |
| Typography | <!-- TBD --> | |
| Color Palette | <!-- TBD --> | |
| Spacing Scale | Tailwind defaults | |
| Border Radius | <!-- TBD --> | |

### Component Inventory

Currently available shadcn/ui components:
- Button
- Card
- Form
- Input
- Label
- Skeleton
- Sonner (toast notifications)

Planned additions:
- Badge (for tags, statuses, vendor classifications)
- Dialog / Sheet (for modals, side panels)
- Select / Combobox (for category filters)
- Tabs (for dashboard sections)
- Avatar (for user profiles)
- Dropdown Menu (for navbar user menu)
- Textarea (for descriptions, pitches)
- Separator
- Alert (for event status changes, at-risk warnings)
- Empty State (custom component for empty lists)

---

## Page Inventory

### Public Pages (No Auth)

| Route | Page | Description |
| :--- | :--- | :--- |
| `/` | Home Page | Event-centric feed with hero section, category filter, and rich Event Cards showing vendor lineups, open needs, and social proof. See [Home Page Design](#home-page-design) below. |
| `/signin` | Sign In | [DONE] Username + password login |
| `/signup` | Sign Up | [DONE] Registration form |
| `/events` | Browse Events | Grid/list of published events. Filter by category, date, location. Search. |
| `/events/:id` | Event Operations Detail | Transaction page: full event info, vendor signup/application, ticket purchase, and operational details. |
| `/events/:id/story` | Event Story Page | Experience page: upcoming narrative, live moments, highlights, host history, vendor spotlight, reviews. |
| `/requests` | Browse Requests | List of event requests sorted by popularity. Upvote button. |
| `/vendors` | Browse Vendors | Grid of vendor services by category. |
| `/u/:username` | User Showcase | Public profile page — bio, hosted events, vendor services, activity. |

### Authenticated Pages

| Route | Page | Description |
| :--- | :--- | :--- |
| `/events/create` | Create Event | Adaptive form: Quick Create (single page, no vendors) or Detailed Create (multi-step, with vendor needs). |
| `/events/:id/manage` | Manage Event | Organiser dashboard: edit details, vendor assignments, needs, applications, attendees, event status. |
| `/requests/create` | Create Request | Form to post an event request. |
| `/dashboard` | My Dashboard | Personal hub with tabs: My Events, My Tickets, My Services, My Requests, My Applications. |
| `/profile` | Edit Profile | [DONE, enhanced] Edit showcase settings, avatar, bio, vendor toggle. |
| `/profile/user-info` | User Info | [DONE] |
| `/profile/settings` | Account Settings | [IN PROGRESS] |

### Internal / Operations Pages (Admin)

| Route | Page | Description |
| :--- | :--- | :--- |
| `/admin` | Django Admin | Existing Django admin panel for superusers. |
| `/ops/events` | Operations Dashboard | [PLANNED] Platform-wide event health, at-risk events, pending decisions. |
| `/ops/events/:id` | Event Operations View | [PLANNED] Internal view with full status history, vendor assignments, audit trail. |

---

## Navigation

### Top Navbar

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo]   Browse Events   Requests   Vendors   |  Dashboard  [Avatar ▼] │
└──────────────────────────────────────────────────────────────┘
```

**Unauthenticated**:
- Logo / Home
- Browse Events
- Requests
- Vendors
- Sign In | Sign Up (right side)

**Authenticated**:
- Logo / Home
- Browse Events
- Requests
- Vendors
- Dashboard
- Avatar dropdown → Profile, Settings, Sign Out (right side)

### Dashboard Sidebar / Tabs

```
My Dashboard
├── My Events (organising/hosting)
├── My Tickets (attending as goer)
├── My Services (vending)
├── My Requests (posted)
└── My Applications (vendor bids)
```

### Event Manage Page Tabs

```
Manage: [Event Title]
├── Details (edit event info)
├── Vendors (assignments, primary/standby, classification)
├── Needs (open needs + review applications)
├── Attendees (ticket holders, attendance count)
└── Status (event state, risk indicators, history)
```

---

## User Flows

### Sign Up → First Experience

```
Sign Up Form → Auto Login → Home Feed
  ↳ User sees events, needs, and requests
  ↳ Can immediately browse, buy tickets, or post requests
  ↳ Can opt into vendor mode via Profile to list services
```

### Organiser Creates an Event

The form adapts based on whether vendors are needed. This keeps simple events fast to create while supporting complex multi-vendor events when needed.

**Quick Create (no vendors)**:
```
Dashboard → "Create Event" button
  → Single page: Title, description, category, date/time, location, pricing, cover image
  → "Need vendors?" toggle → No
  → Publish → Event live on feed immediately
```

**Detailed Create (with vendors)**:
```
Dashboard → "Create Event" button
  → Step 1: Title, description, category, tags
  → Step 2: Date, time, location
  → Step 3: Capacity, ticket pricing (standard + flexible), cover image
  → "Need vendors?" toggle → Yes
  → Step 4: Add needs (DJ, catering, etc. — with category, budget range)
  → Publish as Draft or Scheduled
  → Manage page: review vendor applications, assign vendors, then go live
```

The form is intentionally abstract for Phase 1 — fields and steps will be refined as we iterate.

### Vendor Applies to a Need

```
Home Feed (sees need card) → Click → Event Detail page
  → Scrolls to Needs section → "Apply" on an open need
  → Modal/form: write message, set price quote, link service
  → Submit → Application appears in vendor's dashboard
  → Organiser reviews → Accepts/Rejects
```

### Vendor Lists a Service

```
Profile → Enable "I'm a vendor" toggle
  → Dashboard → My Services → "Add Service"
  → Form: title, description, category, price range, portfolio images
  → Save → Service appears on showcase page + vendor browse
```

### Goer Buys a Ticket

```
Browse Events or Home Feed → Click event card
  → Event Detail page → "Get Ticket" button
  → Confirmation → Ticket created (no real payment yet)
  → Ticket appears in Dashboard → My Tickets
```

### Goer Posts an Event Request

```
Requests page → "Request an Event" button
  → Form: title, description, desired date range, location, category
  → Submit → Request appears in browse + feed
  → Other users upvote → Organiser sees demand → Creates event
  → Organiser links event to request → Request marked "fulfilled"
```

---

## Home Page Design

The home page is **event-centric**. Every card is an event, and each card is a self-contained window into the event's world: who's behind it, what it still needs, how many people are in, and what you can do about it. It should feel like scrolling through a living marketplace.

### Layout: Three Zones

```
+------------------------------------------------------------------+
|  Navbar                                                          |
+------------------------------------------------------------------+
|                                                                  |
|  [Hero Section] — Featured/trending event, full-width, immersive |
|  Big cover image, title overlay, "120 interested · 45 going"     |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  [Category Chips] — Horizontal scroll, sticky on scroll          |
|  ( All )  ( Music )  ( Food )  ( Sports )  ( Tech )  ...        |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  [Event Feed] — Responsive grid of Event Cards                   |
|  3-col desktop / 2-col tablet / 1-col mobile                     |
|  Infinite scroll with skeleton loading                           |
|                                                                  |
+------------------------------------------------------------------+
```

**1. Hero Section** — The single most compelling event right now. Full-bleed cover image with gradient overlay. Title, date, location overlaid in large type. Social proof prominent ("120 interested, 45 going"). Category badge. One-click "Interested" and "Get Tickets" buttons. Selected by `GET /api/feed/?featured=true`.

Hero selection uses the **trending algorithm**: a simple weighted score of (1) location proximity to the user, (2) category match against the user's interest history, and (3) raw `interest_count`. When location is unavailable, proximity is omitted and the other two factors determine the pick.

**2. Category Chips** — Horizontal scrollable filter bar. Tapping a category filters the feed below. "All" selected by default. Chips use Lucide icons from `EventCategory.icon`. Sticky on scroll with backdrop blur.

Categories: Music, Food & Drink, Nightlife, Sports & Fitness, Arts & Culture, Tech & Innovation, Workshops & Classes, Outdoors & Adventure, Comedy, Networking & Social, Festivals, Community.

**3. Event Feed** — Responsive grid of rich Event Cards. Infinite scroll with skeleton loading states. Powered by `GET /api/feed/?sort=trending&category=&page=`.

### Responsive Behavior

- **Desktop** (>= 1024px): 3-column grid, hero section full-width
- **Tablet** (>= 768px): 2-column grid, hero section full-width
- **Mobile** (< 768px): Single column, cards full-width. Category chips are swipeable. Hero section becomes a tall card

---

## Card Components

### Event Card (Primary Component)

The most important component on the platform. Information-dense but not cluttered.

```
+----------------------------------------------+
|  [Cover Image — 16:9 ratio]                  |
|                                    [Category] |  badge overlay, top-right
|                                               |
|  [Price]                                      |  bottom-left overlay: "$25" or "Free"
+----------------------------------------------+
|                                               |
|  Event Title That Can Be Two Lines            |
|  Sat, Mar 15 · 8:00 PM                       |
|  The Blue Note, NYC                           |
|                                               |
|  Vendors:                                     |
|  (Avatar) (Avatar) (Avatar) +2                |  stacked avatars of confirmed vendors
|                                               |
|  Needs:                                       |
|  [Looking for DJ] [Need Security]             |  colorful need badges, clickable
|                                               |
+----------------------------------------------+
|  42 interested  ·  18 going                   |  social proof bar
|                                               |
|  [♡ Interested]          [Get Tickets →]      |  dual CTA row
+----------------------------------------------+
```

**Cover Image Zone**: 16:9 aspect ratio. Gradient overlay at bottom for text legibility (stronger in dark mode). Category badge (pill shape) top-right corner. Price badge bottom-left ("$25", "$25-30", or "Free" in green).

**Info Zone**: Event title (max 2 lines, truncate with ellipsis). Date formatted friendly ("Sat, Mar 15 at 8 PM"). Location name only (not full address).

**Vendor Row**: Stacked avatar circles (like GitHub contributor avatars) of confirmed customer-facing vendors. Up to 3 avatars + "+N" overflow. Hovering/tapping shows vendor name + category tooltip. Hidden if no customer-facing vendors confirmed.

**Needs Row**: Colorful pill badges for open (unfulfilled) EventNeeds. Each badge shows the need category ("Looking for DJ", "Need Catering"). Max 3 visible + "+N more". Clickable — vendors can tap to see the need detail and apply. Hidden if no open needs.

**Social Proof Bar**: Two numbers side by side: "42 interested" and "18 going". Numbers animate on change (count up/down). Always visible, even at zero — creates urgency.

**Action Row**:
- **Interested** (left) — Toggle button with heart icon. Fills on click with a pulse micro-animation. Prompts sign-in if not authenticated.
- **Get Tickets** (right) — Primary CTA button. Opens the Ticket Selection Sheet.

### Need Card

Used in event detail pages and potentially in vendor-focused views.

- Event title (context)
- Need title
- Category badge (e.g. "DJ", "Catering")
- Budget range
- "Apply" CTA (for vendors)

### Request Card

Used on the `/requests` browse page.

- Title
- Description (truncated)
- Desired date/location
- Upvote count + upvote button
- Requester avatar + name
- Category badge

---

## Ticket Selection Sheet

Opens when a goer clicks "Get Tickets" on an Event Card or Event Detail page. Uses Sheet (bottom sheet) on mobile, Dialog (modal) on desktop.

```
+----------------------------------------------+
|  Get Tickets — Event Title                    |
|                                          [X]  |
+----------------------------------------------+
|                                               |
|  +-----------------------------------------+ |
|  | Standard (Non-Refundable)       $25.00  | |
|  | No refunds after purchase               | |
|  +-----------------------------------------+ |
|                                               |
|  +-----------------------------------------+ |
|  | Flexible (Refundable)           $30.00  | |
|  | Full refund up to 24h before event      | |
|  +-----------------------------------------+ |
|                                               |
|  [Confirm — $25.00]                          |
|                                               |
+----------------------------------------------+
```

- Two selectable ticket type cards with radio-button behavior
- Standard selected by default
- Confirm button shows the price of the selected type
- For free events, the sheet is skipped — single "Confirm" action
- If only one price tier exists (e.g. no flexible option), show only that tier

---

## UI Polish (The "Kickass" Factor)

### Animations and Micro-Interactions

- **Interest heart**: Pulse animation on toggle (scale up briefly, fill with color). Use `framer-motion` or CSS keyframes.
- **Count animations**: Numbers roll/count up when they change (like a scoreboard).
- **Card hover**: Subtle lift (translateY -2px) + shadow increase on desktop hover.
- **Skeleton loading**: Shimmer effect on card placeholders while data loads. Use existing `Skeleton` component.
- **Category chip selection**: Smooth background fill transition on active state.
- **Infinite scroll**: New cards fade in from below as they load.

### Dark Mode Specifics

- Cards use a subtle glass effect (semi-transparent background with backdrop blur).
- Cover images have a stronger gradient overlay for text contrast.
- Need badges use vibrant colors that pop against the dark card background.
- The interest heart glows slightly when active (subtle box-shadow).

### New shadcn/ui Components Needed

- **Badge** — for category, needs, price tags
- **Avatar** — for vendor avatars (stacked row)
- **Sheet** (bottom sheet) — for ticket selection on mobile
- **Dialog** — for ticket selection on desktop
- **Toggle** — for the interest button
- **Tooltip** — for vendor avatar hover

---

## Abstract UI Module Mapping

Beyond specific pages, the platform needs these categories of UI surfaces. This is a conceptual mapping of **what information must be visible to which actor**, independent of final screen layouts.

### Goer-Facing Surfaces

| Surface | What the goer sees | What is hidden |
| :--- | :--- | :--- |
| Event listing / detail | Title, date, location, price, customer-facing vendors, host | Operational vendors, standby assignments, at-risk status |
| Vendor lineup | Customer-facing vendors only (DJ, performer, caterer if branded) | Operational vendors (security, AV, cleaning) |
| Event status | Scheduled, "Updated" (after substitution), Postponed, Cancelled | At-risk (internal), substitution decision process |
| Change notifications | Material changes only (vendor swap that affects promise, date change, venue change) | Operational swaps, internal logistics |
| Refund / rebooking | Options presented when event is cancelled or materially changed | Internal refund policy logic |

### Organiser-Facing Surfaces

| Surface | What the organiser sees |
| :--- | :--- |
| Event configuration | Full event details, all fields editable |
| Vendor management | All vendors (primary + standby), all classifications, application pipeline |
| Event status dashboard | Current state, risk indicators, attendance vs threshold, vendor health |
| Substitution interface | When a vendor drops: available standbys, materiality assessment, action options |
| Attendee management | Ticket holders, attendance count, communication tools |
| Decision log | History of all status changes, vendor swaps, and who decided what |

### Admin / Operations Surfaces

| Surface | What ops sees |
| :--- | :--- |
| Platform health dashboard | All events, filtered by status (at-risk, pending decisions) |
| Event operations view | Full audit trail, all actor actions, override capabilities |
| Dispute resolution | Attendee complaints, vendor disputes, evidence from audit trail |
| Manual override tools | Force-cancel, force-refund, reassign vendor, change event state |

### Key Abstract UI Questions

These questions should be resolved as UI design matures:

- Which vendors appear on the public event page? (Only customer-facing? Or all with an "operational" label?)
- When a vendor is substituted, what does the goer see? (A "lineup updated" banner? A detailed change log? Just the new name?)
- When should the UI present refund, credit, or confirmation choices to goers?
- How does the organiser's manage page surface risk? (Color-coded status? Alert banners? A dedicated risk tab?)
- What event state changes trigger a modal/interstitial vs a quiet notification?

---

## Responsive Design

- Mobile-first approach using Tailwind breakpoints
- Navbar collapses to hamburger menu on mobile
- Event/vendor/request cards stack vertically on small screens
- Dashboard tabs become a dropdown or bottom nav on mobile
- Event creation form is full-width on mobile

## Accessibility

- Radix Primitives provide keyboard navigation and ARIA attributes
- All interactive elements have visible focus states
- Color contrast meets WCAG AA standards (verify with dark theme)
- Image alt text on event covers and avatars
- Form inputs have proper labels and error messaging

---

### Changelog

| Date | Change |
| :--- | :--- |
| 2026-02-28 | Initial draft from codebase analysis |
| 2026-02-28 | Full page inventory, navigation, user flows, card components |
| 2026-02-28 | Added abstract UI module mapping per actor, operations pages, event manage tabs expanded, key UI questions |
| 2026-02-28 | Full home page design (hero, category chips, event feed). Detailed Event Card component spec. Ticket Selection Sheet. UI polish section (animations, dark mode, new components). |
| 2026-02-28 | Event creation: Quick Create vs Detailed Create modes. Trending algorithm for hero selection. Concrete category list with Lucide icons. |
| 2026-03-01 | Split event surfaces in page inventory: transactional Event Operations page (`/events/:id`) and experiential Event Story page (`/events/:id/story`). |
