**outgoing**

**Browse & Filter System**

_Product Specification Document_

Version 1.0 · Outgoing Product Team · 2026

# **1\. Overview**

This document defines the complete filter system for the Outgoing Browse All page. It specifies what each filter means, which result types (Events, Opportunities, People) it applies to, which card type is shown per result, and how the card layout adapts based on the active tab and filters.

The Browse All page serves one primary goal: help a user find something worth going to - or a way to get in cheaper. Filters should reduce friction, not add it. Every filter combination must produce a coherent, useful result set.

# **2\. Tabs - Primary Navigation**

Tabs represent the user's intent. Each tab sets a default filter state and determines which result types are shown and how cards are ranked and composed.

**Tab Definitions**

| **Tab**           | **What it shows**                                                                                                    | **Result types**                  | **Card emphasis**                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------- |
| Trending          | Events buzzing in the user's city right now. Ranked by RSVP velocity (how fast people are joining) + buddy activity. | Events · Opportunities (if viral) | Attendee count, buzz indicator, buddy faces                                |
| Tonight / Weekend | Time-sensitive events happening in the next 48-72 hours. Default sort: soonest first.                                | Events                            | Time is hero - large, prominent. Date shown first on card.                 |
| Free & Cheap      | Events under ₹500 OR with a discount available through contributing. Contributor gigs that pay cash.                 | Events · Opportunities            | Price / reward is hero. Discount badge prominent. Needs block highlighted. |
| Chip In           | Contributor opportunities only. Roles the host needs filled in exchange for discount or cash.                        | Opportunities only                | Role title and reward are hero. Event is secondary context.                |
| Online            | Events hosted digitally - video call, stream, Discord, etc. No location dependency.                                  | Events (online only)              | Platform shown. No venue. Join link CTA replaces map pin.                  |
| My Network        | Events at least one buddy has RSVPd to, or events hosted by someone the user has attended before.                    | Events · People                   | Buddy faces and names are hero. 'Join Rahul' CTA.                          |

# **3\. Filter Groups**

Filters appear below the tabs and stack across three rows: When, Category, and Format & Price. Filters within a group are OR logic. Filters across groups are AND logic.

_→ Example: 'Tonight' AND 'Music' AND 'Under ₹500' - narrows to music events tonight under ₹500._

_→ Example: 'Music' OR 'Arts' (within category group) - shows events in either category._

## **3.1 When**

**Filter: When**

| **Filter**       | **What it does**                                                  | **Affects**           |
| ---------------- | ----------------------------------------------------------------- | --------------------- |
| **Tonight**      | Events starting between now and midnight of the current day.      | Events, Opportunities |
| **Tomorrow**     | Events on the calendar day after today.                           | Events, Opportunities |
| **This weekend** | Saturday and Sunday of the current week. Default on Trending tab. | Events, Opportunities |
| **Next week**    | Monday-Sunday of the following calendar week.                     | Events, Opportunities |
| **Pick a date**  | Opens a date picker. User selects a specific date or range.       | Events, Opportunities |

## **3.2 Category**

**Filter: Category**

| **Filter**        | **What it does**                                                          | **Affects**                                    |
| ----------------- | ------------------------------------------------------------------------- | ---------------------------------------------- |
| **Music**         | Concerts, open mics, DJ nights, live bands, vinyl events.                 | Events, Opportunities (DJ / Sound)             |
| **Food & Drinks** | Supper clubs, food crawls, tasting sessions, potlucks, pop-up kitchens.   | Events, Opportunities (Catering)               |
| **Outdoors**      | Hikes, cycling, treks, park events, nature walks, adventure sports.       | Events, Opportunities (Equipment)              |
| **Arts**          | Workshops, exhibitions, open studios, graffiti, pottery, film screenings. | Events, Opportunities (Photography)            |
| **Tech**          | Hackathons, build-in-public sessions, talks, demos, networking.           | Events, Opportunities (AV / Streaming)         |
| **Sports**        | Pickup games, tournaments, run clubs, martial arts, skating.              | Events, Opportunities (Venue / Equipment)      |
| **Comedy**        | Stand-up, open mic, improv nights.                                        | Events                                         |
| **Wellness**      | Yoga, breathwork, sound baths, meditation, fitness.                       | Events, Opportunities (Venue / Instructor)     |
| **Workshop**      | Skill-based sessions - cooking class, coding bootcamp, art lesson.        | Events, Opportunities (Materials / Instructor) |

## **3.3 Format & Price**

**Filter: Format & Price**

| **Filter**             | **What it does**                                                                            | **Affects**           |
| ---------------------- | ------------------------------------------------------------------------------------------- | --------------------- |
| **In person**          | Events with a physical location. Shows map pin on card.                                     | Events, Opportunities |
| **Online**             | Events hosted digitally. Hides location, shows platform and join link.                      | Events, Opportunities |
| **Free**               | Zero cost to attend. No ticket price. No contribution required.                             | Events                |
| **Under ₹200**         | Ticket price is ₹200 or less. Does not include contribution discounts.                      | Events                |
| **Under ₹500**         | Ticket price is ₹500 or less.                                                               | Events                |
| **Discount available** | Events where a contributor role exists that reduces ticket price. Includes free-entry gigs. | Events, Opportunities |

## **3.4 Contributor Role (Chip In tab only)**

**Filter: Contributor Role**

| **Filter**          | **What it does**                                                    | **Affects**   |
| ------------------- | ------------------------------------------------------------------- | ------------- |
| **Any role**        | Default. Shows all open contributor slots regardless of type.       | Opportunities |
| **DJ / Music**      | Sound, playlist curation, live music, DJ set.                       | Opportunities |
| **Food & Catering** | Cook, bake, supply food, cater a spread.                            | Opportunities |
| **Photography**     | Event photographer, videographer, reel creator.                     | Opportunities |
| **Equipment**       | Bring chairs, tables, projector, speakers, props, chart paper, etc. | Opportunities |
| **Venue**           | Offer a space - terrace, garden, studio, hall.                      | Opportunities |
| **Staffing**        | Help at the door, manage RSVP, coordinate logistics.                | Opportunities |
| **Other**           | Anything the host defines that doesn't fit above categories.        | Opportunities |

# **4\. Result Types**

The Browse All page can return three types of results depending on the active tab and applied filters. Each result type has a distinct card layout.

| **Result type**       | **Definition**                                                                                                                      | **Appears on**                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Event                 | A happening with a date, location/format, host, and optionally a ticket price. May have contributor slots.                          | All tabs except Chip In only                                                    |
| Opportunity (Chip In) | A specific contributor role tied to an event. Has a reward (discount %, cash, or free entry). May show the parent event as context. | Chip In tab · Free & Cheap tab (discount gigs) · surfaced inline on Event cards |
| Person (Buddy)        | A buddy from the user's network. Shown in My Network tab. Linked to events they are attending or interested in.                     | My Network tab only                                                             |

# **5\. Card Designs by Result Type**

## **5.1 Event Card**

The event card is the primary card type. Its layout adapts based on the active tab - certain fields are visually promoted (larger, bolder, higher up) while others are de-emphasised or hidden.

**Event Card - Universal Fields (always present)**

| **Field**           | **Description**                                                                                                                                         | **Visibility**    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Left border colour  | Coral (#D85A30) = In person. Teal (#1D9E75) = Online. Always visible.                                                                                   | All               |
| Format pill         | Small pill top-right: 'In person' or 'Online'. Matches border colour.                                                                                   | All               |
| Category label      | Small uppercase label: MUSIC, FOOD & DRINKS, etc. Top-left.                                                                                             | All               |
| Event title         | Syne font, bold. Always present.                                                                                                                        | All               |
| Date & time         | Footer of card. Format: 'Tonight · 8pm' or 'Sat · 7pm'.                                                                                                 | All               |
| Attendee count      | Small pill: '42 going'. Green background.                                                                                                               | All               |
| Known host / vendor | Only shown if user has attended a host's event before, or interacted with a vendor. e.g. 'Hosted by Pinky' or 'Nani is catering'. Purple dot indicator. | All - conditional |
| Buddy faces         | Avatar strip + names. Only shown if ≥1 buddy is attending. e.g. 'Rahul & Aditi going'.                                                                  | All - conditional |

**Event Card - Tab-Specific Emphasis**

| **Tab**           | **Emphasis rules**                                                                                                                                                   | **Promoted fields**                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Trending          | Attendee count is hero - large and prominent. Buddy faces shown if present. Trending badge ('🔥 Trending') shown if velocity is high.                                | Attendee count · Buddy faces · Trending badge  |
| Tonight / Weekend | Time is hero - date/time moves to top of card, rendered large. Countdown shown if < 3 hours away ('Starting in 2h'). Location shown below title.                     | Date/time · Countdown · Location               |
| Free & Cheap      | Price is hero. 'Free' in green or price in bold at top. Discount badge prominent if contributor role reduces price. Needs block shown if discount available.         | Price · Discount badge · Needs block           |
| Online            | Platform label shown (e.g. 'Zoom', 'YouTube Live', 'Discord'). Location field hidden. 'Join' CTA replaces 'View event'. No map pin.                                  | Platform · Join CTA · No location              |
| My Network        | Buddy context is hero - buddy faces and names at top of card, above title. 'Join Rahul ↗' CTA replaces standard 'View event'. Host/vendor known-badge if applicable. | Buddy faces top · Join CTA · Known host/vendor |

**Event Card - Optional Fields (shown only when applicable)**

| **Field**         | **Rules**                                                                                                                                         | **Condition**                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Event photo       | Only shown if host has uploaded one. If missing, image area is hidden entirely - card starts with category + title. No placeholder.               | When uploaded                  |
| Short description | 1-2 line blurb. Shown if provided by host. Truncated at 2 lines with ellipsis.                                                                    | When provided                  |
| Needs block       | Amber highlight. 'Needs a DJ - free entry if you fill the slot'. Shown only if at least one contributor slot is open AND host has made it public. | When slot is open & advertised |
| Price             | Shown in card footer. Hidden if event is free (replaced by 'Free' in green).                                                                      | When price > 0                 |

## **5.2 Opportunity Card (Chip In)**

Used exclusively on the Chip In tab and in the Free & Cheap tab when discount gigs are surfaced. The contributor role and reward are the primary information - the event is secondary context.

**Opportunity Card - Fields**

| **Field**         | **Description**                                                                                                                  | **Visibility** |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Left border       | Always amber (#EF9F27). Visually distinct from event cards.                                                                      | Always         |
| Role icon         | Coloured icon block: music note for DJ, plate for catering, camera for photography, etc.                                         | Always         |
| Role title        | Bold. e.g. 'Rooftop Vinyl Night needs a DJ'. Syne font.                                                                          | Always         |
| Event context     | Smaller text below title: event name, date, location, slots open.                                                                | Always         |
| Reward            | Right-aligned. Large and bold. e.g. 'Free in', '₹800', '40% off'. Amber colour.                                                  | Always         |
| Reward label      | Small muted label below reward: 'upon delivery', 'if you fill it', 'ticket discount'.                                            | Always         |
| Known host badge  | Purple dot + text: 'Hosted by Pinky - you've attended before'. Only if user has history with host.                               | Conditional    |
| Repeat gig badge  | Green pill: 'You DJ'd here before ✓'. Shown if user has filled the same role type for this host previously. Signals familiarity. | Conditional    |
| New gig indicator | No badge. Absence of repeat badge = new opportunity. Implicit distinction.                                                       | Default state  |

_→ Repeat gig vs new gig: The system tracks whether a user has previously fulfilled a contributor role for a specific host. If yes, a green 'You've done this before ✓' badge appears. If no, the card looks standard. This creates a natural sense of returning vs discovering._

## **5.3 Person Card (My Network tab)**

Shown on the My Network tab. Represents a buddy from the user's auto-generated social graph - formed when two users attended the same event.

**Person Card - Fields**

| **Field**     | **Description**                                                                                                          | **Visibility**                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Avatar        | Initials circle with colour based on user. e.g. 'R' in coral for Rahul.                                                  | Always                             |
| Buddy name    | Full name. Bold.                                                                                                         | Always                             |
| Context tag   | How they know each other. e.g. 'Tech buddy · met at Anthill Hackathon 2025'. Auto-generated from shared event.           | Always                             |
| Activity line | What the buddy is doing. e.g. 'Going to Indie Night at Koramangala Social tonight' or 'Interested in Graffiti Workshop'. | Always                             |
| CTA button    | 'Join \[Name\] ↗' if buddy is confirmed going. 'Go together ↗' if buddy is only interested.                              | Always                             |
| Shared events | Small text: 'You've been to 3 events together'. Shown if multiple shared events exist.                                   | Conditional - if ≥ 2 shared events |

# **6\. Recommendation Logic**

Beyond search and filters, Outgoing surfaces personalised results based on user history. These appear as labelled sections within the Browse All results.

**'From hosts you know'**

Trigger: User has attended ≥ 1 event by this host.

Placement: Pinned section at top of results, above trending. Shown on all tabs except Chip In and My Network.

Card type: Standard event card with known host badge ('Hosted by Pinky') shown prominently.

Ranking: Most recent host activity first. If multiple known hosts have upcoming events, ranked by recency of user's last attendance.

**'\[Vendor\] is at this event'**

Trigger: A vendor (DJ, caterer, photographer) the user has previously seen at an event is listed as a contributor on a new event.

Placement: Inline on the event card. Not a separate section - surfaced as a known-vendor badge.

Card display: 'Nani is catering' shown below title with purple dot. Only appears if that vendor's involvement is confirmed by the host.

**'Your buddies are going'**

Trigger: ≥ 1 buddy has confirmed attendance or expressed interest in an event.

Placement: Inline on event card - avatar strip below description. Also surfaced as a dedicated section on the My Network tab.

Card display: Buddy faces + names. CTA changes to 'Join \[Name\] ↗' instead of generic 'View event'.

# **7\. Filter Behaviour Rules**

- Filters persist across tabs within a session. If a user selects 'Music' and switches from Trending to Tonight, Music remains selected.
- Switching tabs resets the 'When' filter to that tab's default (e.g. Tonight / Weekend tab defaults to 'Tonight').
- If a filter combination returns 0 results, show a friendly empty state: 'Nothing here right now - try removing a filter or check back later.'
- The Chip In tab locks result type to Opportunities only. Category and When filters still apply. Format & Price filters are hidden on Chip In tab.
- The My Network tab locks result type to People + their associated Events. All other filters are hidden except When.
- 'Discount available' filter on Free & Cheap tab surfaces both Event cards (with the needs block visible) and standalone Opportunity cards.
- Known host / vendor / buddy badges are always computed from user history - they are not filterable but are always displayed when applicable.

# **8\. Card Field Visibility Matrix**

Quick reference: which card fields are visible per tab.

| **Card Field**        | **Trending** | **Tonight** | **Free & Cheap** | **Chip In** | **Online** | **My Network** |
| --------------------- | ------------ | ----------- | ---------------- | ----------- | ---------- | -------------- |
| Photo (if uploaded)   | ✓            | ✓           | ✓                | -           | ✓          | ✓              |
| Title                 | ✓            | ✓           | ✓                | ✓           | ✓          | ✓              |
| Description           | ✓            | ✓           | ✓                | -           | ✓          | ✓              |
| Date / Time (hero)    | -            | **HERO**    | -                | ✓           | -          | -              |
| Attendee count (hero) | **HERO**     | ✓           | ✓                | -           | ✓          | ✓              |
| Price / Reward (hero) | -            | -           | **HERO**         | **HERO**    | -          | -              |
| Needs / Chip In block | if open      | if open     | **HERO**         | -           | if open    | if open        |
| Location              | ✓            | ✓           | ✓                | ✓           | -          | ✓              |
| Platform (online)     | -            | -           | -                | -           | ✓          | -              |
| Buddy faces (hero)    | if present   | if present  | -                | -           | -          | **HERO**       |
| Known host/vendor     | if known     | if known    | if known         | if known    | if known   | if known       |
| Repeat gig badge      | -            | -           | -                | ✓           | -          | -              |

_HERO = promoted to top of card, rendered large. ✓ = present. - = hidden. 'if present/known/open' = conditional._

outgoing · Browse & Filter Specification · v1.0 · 2026