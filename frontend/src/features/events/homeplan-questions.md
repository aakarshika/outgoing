# Home Page Reorder - Questions + Brief Plan

## Brief Plan

Rebuild the home page as a config-driven sequence of modular sections so we can reorder quickly and add new sections without hardcoding layout logic. The implementation will introduce new section IDs, add the new filter/map/gallery/user-personalized blocks, and gate auth-dependent sections with safe empty states. Existing feed and card components will be reused where possible, and backend/API gaps will be explicitly resolved before wiring final UI behavior.

## Questions To Finalize Before Implementation

1. What is the exact final top-to-bottom order for signed-in users? -
   home page is for everyone. no auth.
2. Should the top "Relevant / Trending / Nearby" block and the bottom repeated block use the same data behavior or different behavior?
   same. exact same component.
3. If both filter blocks are identical, do you want different titles/styling to avoid repetition fatigue?
   no.
   Do not change inside any of the cards. just the home page.

### Filter Behavior

6. What does "Relevant" mean exactly (recommended, interest-based, location-based, category-based, recency-based)?
7. If "Relevant" needs personalization, should it only appear for authenticated users?
8. Should "Trending" map to current `sort=trending`, or do you want a new ranking rule?
9. Should "Nearby" use location permission only, or also allow manual city entry?
10. What should happen in "Nearby" if permission is denied (CTA only, manual fallback, or both)?
11. For each filter section, should the default selected tab be fixed (which one) or remembered per user?
12. Should tab selection be reflected in URL params for shareable state?

answers 6 - 12 - Only use the existing FeedSection component. it takes input as a list of events. fetch these events from the existing apis for fetching feed. no change there. if it is missing, ignore it.

13. Should "Browse all" route to one universal browse page or filter-specific URLs?
    /search/ - will implement later.
14. For "Online / Offline", should "Offline" mean `online=false`, or "has physical location coordinates/address"?
    ONLINE / OFFLINE only means the type of event. if the location_address of the event has value "Online Event" then online else offline.
15. Should "Online / Offline" appear for signed-out users too?
    YES.

### Going / Saved / User Data

16. Confirm "Going" source: purchased tickets only, or tickets + RSVP/interested?
    all. use the existing api from dashboard -> tickets - will return an events list. use the list for the feedsection ui..
17. Confirm "Saved" source: liked/interested events only?
    all. use the existing api from dashboard -> saved. same as tickets.
18. If an event appears in both "Going" and "Saved", should it show in both tabs or be deduped globally?
    both
19. If "Going" is empty, should we show only the empty card or also fallback recommendations beneath it?
    message "start browsing to find what to do "
20. If "Saved" is empty, should empty state CTA point to `/`, `/browse`, or a specific discovery page?
    message "Your likes and save the dates will appear here."

### New CTA Cards

21. For the "Start hosting" and "Find gigs" dual cards, should both always show, or only when the user has no hosted events/services?
    always
22. What qualifies as "has hosting activity" (any created event, or only published/completed)?
    any created event
23. What qualifies as "has services" (any service draft, or only active customer-facing services)?
    any created service
24. Should these cards appear for signed-out users?
    the tab will not be there if there are no events or services. duh.
25. What are final CTA destinations (exact routes) for both cards?
    for services - take to /dashboard/services/opportunities
    for events - to /dashboard/events

### Map Section -

26. Should map section be shown to signed-out users? yes, if they enabled location for that moment.
    do all the following later. only show placeholder for now.
    it will be comic themed border and slightly skewed window. with borders all around. in mobile view for responsive - will take full width with no borders 27. Confirm map data rule: include events starting in 0-30 days plus all currently "live" events. 28. How should "live" be defined technically (event lifecycle state, start/end window, or explicit flag)? 29. Do you want map points clustered when dense, or always individual markers? 30. Should clicking a marker open quick card, event drawer, or navigate immediately to event detail? 31. What should happen when location is not allowed for map section? 32. Should map support manual location search if geolocation is unavailable? 33. Are category colors already standardized, or should we define a new legend mapping? 34. Do you want a visible legend for category colors? 35. Any required map library preference (existing stack-compatible choice)? 36. Any performance constraints for marker count (cap, pagination, viewport fetch)?

### Highlights / Film Strips

37. For "Highlight film strip - section 1", should source be trending highlights, curated list, or latest highlights?
    its already there. do not change.
38. For "Memories - section 2", should source be all highlights user has ever added (auth-only), or global archive when signed out?
    all highlights user has ever added (auth-only) - remove section for no auth
39. If user has zero memories, should this section hide or show a prompt to upload highlights?
    show prompt. take to /dashboard/tickets
40. Confirm style difference for second strip: exact color theme and skew direction.
41. Should both strips have distinct titles/subtitles?

### Your Events / Your Services

42. Should "Your events | Your services" be completely removed when both are empty (as noted), or shown with onboarding CTAs?
43. In this combined section, do you want two tabs ("Your Events", "Your Services") or two stacked blocks?
44. Confirm event source for "Your Events": all my events, or only upcoming/published?
45. Confirm service card type: use `VendorBusinessCard` exactly as-is or custom compact variant?
46. If user is not a vendor, should "Your Services" tab be hidden or show a "create service" CTA?

### Iconic Hosts and Vendors

47. Should "iconic hosts and vendors" be a combined section with tabs, or two separate horizontal carousels?
    separate
48. Confirm randomization rule: truly random each load, daily shuffle, or deterministic seeded order?
    . no random.
49. Should we keep current top-rated ranking and only randomize display order, or switch selection to random source entirely?
50. How many cards should this section display per load?

USE THE EXISTING apis. placeholder if new api is needed.

### Product / UX / Tech Constraints

CREATE A NEW "HOME PAGE RENEWED" file. do not update this one. 51. Do you want to preserve all existing sections not listed in the new plan, or only the listed ones?
remove existing. 52. Should we keep current hero and bedroom carousel unchanged at the top?
yes 53. Any required loading skeleton style for new sections? 54. Any analytics events needed for tab switches, map interactions, and CTA clicks? 55. Should this rollout be behind a feature flag for staged release? 56. Is backend work allowed in this phase, or must we ship frontend-only with current endpoints?
no backend. frontend only. 57. What is the priority if scope is too large for one PR (which sections first)? 1. create new homepage file. reuse all sections from previous one.
use all existing apis and HorizontalScrollableList and SrapbookEventcard, Hostcard and VendorBusinesscard.
apply - reordering + placeholders for new sections
add labels for filter buttons.
skip going, saved, myservices, my events. 2. new sections
add new sections
wire going, saved, myservices, my events. - data from dashboard and ui from feed section. 3. do any changes if needed inside the sections. add filter buttons. for example generic feed section needs filters but no change in ui.
