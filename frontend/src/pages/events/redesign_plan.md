# Event Details Page Redesign: "Digital Junk Journal" Plan

This document outlines the plan to redesign the Event Details page UI into a tactile "Teenage Scrapbook" aesthetic while keeping all existing business logic intact.

## 1. Aesthetic Identity
The core concept is to make the page feel like a physical notebook or scrapbook.

- **Background**: A "Graph Paper" texture (light grey/blue grid on off-white paper).
- **Typography**: 
    - **Headers**: "serif" (Bold, marker-style).
    - **Notes/Comments**: "Caveat" (Casual handwriting).
    - **Reading**: "Inter" (Clean sans-serif).
- **Styling Hooks**: 
    - Intentional rotations (tilted elements).
    - "Washi Tape" overlays for section headers.
    - Perforated edges and "punched" notches.
    - Tactile drop shadows.

## 2. Component-Level Changes

### A. The "Polaroid Pile" (Media Gallery)
Instead of a flat carousel, the images will look like a stack of Polaroids.
- Thick white borders.
- Random rotations (-4° to +4°).
- Hover effect: Image straightens and scales up.

### B. "Ticket Stubs" (Purchase Section)
Ticketing options will look like vintage perforated stubs.
- Dashed lines for "perforation".
- "ADMIT ONE" branding.
- Taped-on effect using semi-transparent overlays.

### C. "Classified Ads" (Vendor Needs)
Professional requests will use a high-contrast newspaper aesthetic.
- Heavy serif fonts for headers.
- Thin double-borders.
- Newsprint texture background.

### D. "Sticky Notes" (Review Feed)
User reviews will appear as scattered Post-its.
- Variety of pastel colors (Yellow, Pink, Blue).
- Handwritten text.
- Heavy corner shadows to simulate peeling paper.

## 3. Implementation Workflow

1. **Theme Initialization**: Create a `scrapbookTheme.ts` to centralize the MUI overrides and font definitions.
2. **Scaffold New Page**: Create `EventDetailPageNew.tsx` by copying the current logic and wrapping it in the new theme.
3. **Component Swap**: Incrementally replace standard UI blocks with the new "Scrapbook" versions:
    - `EventCarousel` → `PolaroidCarousel`
    - `EventLifecycleDetails` content → `TicketStubs` / `ClassifiedAds`
    - `Reviews` → `PostItReviews`
    - `Highlights` → `PolaroidHighlights`
4. **Style Polish**: Add the background pattern and "Washi Tape" accents.

## 4. Logic Parity Guarantee
The logic for visibility, state-based rendering, and API interactions will remain identical to `EventDetailPage.tsx`.
- Hooks used (`useEvent`, `useAuth`, etc.) will not change.
- Conditional rendering based on `event.lifecycle_state` will be preserved.
- Existing action handlers (`handleBuyTicket`, modals) will be reused.
