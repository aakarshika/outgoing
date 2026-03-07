# Page Component + Seed Data Requirements

Purpose: seed planning for pages you shared (`EventDetailPageNew` and `DashboardPage`).

> Notes
> - Table names below use Django default db table naming (`<app_label>_<model>`).
> - If your serializers rename fields (e.g., `reviewer_username`, `event_summary`), seed the source table columns listed here; serializer fields are derived from those.

---

## Page: EventDetailPageNew

### Components (with children)
- `EventDetailPageNew`
  - `ThemeProvider`
  - `CategoricalBackground`
  - `StatusBannerSection`
    - `Highlighter`
    - `CuteTimer`
  - `HeroSection`
    - `WhenWhereCard`
      - `EventLocationMap`
    - `HeroAutoGallery`
      - `Media`
    - `HostCard`
    - `WashiTape`
    - `Chip`
  - `DetailsSection`
    - `WashiTape`
    - `CheckInMemo`
    - `Chip`
  - `TicketsSection`
    - `PurchasedTicketStack`
      - `CapacityInfographic`
    - `TicketStub`
      - `TermsDialog`
      - `CapacityInfographic`
  - `AttendanceSection` *(currently returns `null`; infographic is not rendered)*
    - `CapacityInfographic` *(dead path until `return null` is removed)*
  - `ServicesSection`
    - `ClassifiedAd`
      - `VendorBusinessCard` (when need is filled)
    - `Avatar`
    - `Rating`
  - `MemoryBoxSection`
    - `PolaroidFrame`
      - `Media`
  - `ReviewsSection`
    - `PostItNote`
  - Modals / overlays:
    - `ApplyToNeedModal`
    - `HighlightComposer`
    - `ReviewComposer`
    - `TicketingServiceModal`
    - `TicketManagementModal`
    - `TicketConfirmationModal`
    - `QuickBuyPopup`

### Data requirements (tables + columns + constraints)

| Component / UI use | Table (model) | Required columns | Constraints / notes for seeding |
|---|---|---|---|
| Base event payload (`useEvent`) | `events_event` (`Event`) | `id`, `host_id`, `title`, `description`, `category_id`, `series_id`, `location_name`, `location_address`, `latitude`, `longitude`, `start_time`, `end_time`, `capacity`, `ticket_count`, `lifecycle_state`, `status`, `cover_image`, `features`, `check_in_instructions`, `interest_count` | `lifecycle_state` must be one of: `draft/published/at_risk/postponed/event_ready/live/cancelled/completed`; `features` is JSON list of `{name, tag}` where tag is used as `featured/additional/extra` in UI grouping. |
| Category theme + labels | `events_eventcategory` (`EventCategory`) | `id`, `name`, `slug`, `icon` | `slug` unique; `icon` should match supported frontend icon name. |
| Host identity shown in hero/top | `auth_user` (AUTH_USER_MODEL) | `id`, `username` | `username` displayed across page (`isHost` check uses username equality). |
| Host avatar/details | `profiles_userprofile` (`UserProfile`) | `user_id`, `avatar`, `headline`, `bio`, `location_city` | Profile is optional in DB, but missing avatar/bio yields sparse host card/review UI. |
| Recurrence chips/timer (`occurrences`) | `events_eventseries` (`EventSeries`) | `id`, `host_id`, `recurrence_rule`, `timezone`, `name` | `recurrence_rule` format expected like `FREQ=WEEKLY;BYDAY=SU`; if blank, recurrence summary is omitted. |
| Recurrence list items | `events_event` (`Event`) | `id`, `series_id`, `start_time`, `title` | Need 2+ events sharing same `series_id` for occurrence chips to render. |
| Ticket tiers for stubs/stack | `events_eventtickettier` (`EventTicketTier`) | `id`, `event_id`, `name`, `description`, `color`, `price`, `capacity`, `is_refundable`, `refund_percentage`, `admits` | `capacity = NULL` means unlimited; `refund_percentage` should be 0–100; tier name must match `tickets.ticket_type` if UI groups by type. |
| User tickets for manage/stack | `tickets_ticket` (`Ticket`) | `id`, `event_id`, `goer_id`, `tier_id`, `ticket_type`, `color`, `guest_name`, `is_18_plus`, `is_refundable`, `refund_percentage`, `price_paid`, `status`, `updated_at`, `purchased_at`, `barcode` | `status` one of `active/used/cancelled/refunded`; `barcode` unique; cancelled ticket cards show refunded amount using `price_paid * refund_percentage/100` when refundable. |
| Highlights grid + gallery CTA | `events_eventhighlight` (`EventHighlight`) | `id`, `event_id`, `author_id`, `text`, `media_file`, `role`, `moderation_status`, `created_at` | `moderation_status` should be `approved` to appear in normal feeds; UI expects author username via relation (`author.username`). |
| Event reviews list | `events_eventreview` (`EventReview`) | `id`, `event_id`, `reviewer_id`, `rating`, `text`, `is_public`, `created_at` | `rating` must be 1..5; unique pair `(event_id, reviewer_id)` enforced. |
| Vendor sub-reviews inside review notes | `events_eventvendorreview` (`EventVendorReview`) | `id`, `event_review_id`, `vendor_id`, `rating`, `text`, `created_at` | `rating` must be 1..5; unique pair `(event_review_id, vendor_id)` enforced. |
| Service providers panel (open/filled needs) | `needs_eventneed` (`EventNeed`) | `id`, `event_id`, `title`, `description`, `category`, `criticality`, `budget_min`, `budget_max`, `status`, `assigned_vendor_id`, `application_count`, `created_at` | `status` one of `open/filled/cancelled`; `criticality` one of `essential/replaceable/non_substitutable`; only non-cancelled are displayed by page filter. |
| Applications used by `ClassifiedAd` filled card + eligibility | `needs_needapplication` (`NeedApplication`) | `id`, `need_id`, `vendor_id`, `service_id`, `message`, `proposed_price`, `status`, `created_at` | `status` one of `pending/accepted/rejected/withdrawn`; one accepted app is used as assigned vendor card in filled needs; unique `(need_id, vendor_id)`. |
| “My services” eligibility check | `vendors_vendorservice` (`VendorService`) | `id`, `vendor_id`, `title`, `description`, `category`, `is_active`, `portfolio_image`, `base_price`, `location_city`, `created_at` | Eligibility compares `service.category` with `need.category` using lowercase substring matching; seed categories accordingly (e.g., `photographer` vs `photo`). |
| Participating vendor cards/avatars | `vendors_vendorservice` + `profiles_userprofile` | `vendor_services.id`, `vendor_services.title`, `vendor_services.category`, `userprofile.avatar` | API usually denormalizes `vendor_name`, `vendor_avatar`, `rating`; ensure linked user/profile data exists to avoid blanks. |
| Interest heart state/count | `events_eventinterest` (`EventInterest`) | `id`, `event_id`, `user_id`, `created_at` | Unique `(event_id, user_id)`; UI toggles by authenticated user and may surface `user_is_interested` derived field. |
| Recently viewed / view tracking side effects | `events_eventview` (`EventView`) | `id`, `event_id`, `user_id`, `last_viewed_at` | Unique `(event_id, user_id)`; updated via upsert-style writes. |

---

## Page: DashboardPage

### Components (with children)
- `DashboardPage`
  - Tabs: `My Events`, `My Tickets`, `Services`
  - Shared local components:
    - `LoadingSkeleton`
    - `EmptyState`
  - `EventNeedsSummary`
  - `TicketManagementModal`
  - `EditApplicationModal`
  - `VendorBusinessCard`
  - `OpportunitiesTab`
    - `NeedCard`
      - `WashiTape`
      - `Button`
      - `ApplyToNeedModal` (from parent tab state)

### Data requirements (tables + columns + constraints)

| Component / UI use | Table (model) | Required columns | Constraints / notes for seeding |
|---|---|---|---|
| My Events list (`useMyEvents`) | `events_event` (`Event`) | `id`, `host_id`, `title`, `start_time`, `location_name`, `cover_image`, `lifecycle_state` | List is scoped to current host; badge uses same lifecycle enum as Event Detail page. |
| Needs summary badge in each event row | `needs_eventneed` (`EventNeed`) | `id`, `event_id`, `status` | Summary components generally count by status (`open/filled/cancelled`). |
| My Tickets grid (`useMyTickets`) | `tickets_ticket` (`Ticket`) | `id`, `event_id`, `goer_id`, `ticket_type`, `price_paid`, `status`, `is_refundable`, `refund_percentage`, `updated_at` | Cancelled overlay and refunded display rely on `status`, `is_refundable`, `refund_percentage`. |
| Ticket event card data (`ticket.event_summary`) | `events_event` (`Event`) | `id`, `title`, `location_name`, `cover_image` | API denormalizes into `event_summary`; seed source event rows. |
| Ticket manage modal grouping | `tickets_ticket` (`Ticket`) | `id`, `event_id` | Modal groups tickets by `event_summary.id` and sets `initialIndex` by ticket id match. |
| Services list (`useMyServices`) | `vendors_vendorservice` (`VendorService`) | `id`, `vendor_id`, `title`, `category`, `portfolio_image`, `created_at`, `is_active` | `vendor_name` / `avg_rating` are often serializer-derived; ensure linked user/review data for realistic cards. |
| Service applications list (`useMyApplications`) | `needs_needapplication` (`NeedApplication`) | `id`, `service_id`, `need_id`, `vendor_id`, `message`, `status`, `created_at` | Pending apps show Edit action; statuses are strict enum (`pending/accepted/rejected/withdrawn`). |
| Application event labels (`event_title`, links) | `events_event` (`Event`) | `id`, `title` | Needed for denormalized application list fields. |
| Application need labels (`need_title`) | `needs_eventneed` (`EventNeed`) | `id`, `title`, `event_id` | Must reference the same event/application chain for links and labels to align. |
| OpportunitiesTab relevant feed (`useMyVendorOpportunities`) | `needs_eventneed` + joins | `eventneed.id`, `title`, `description`, `category`, `criticality`, `budget_min`, `budget_max`, `status`; plus related `event.id`, `event.title`, `event.start_time`, `event.location_name` | Feed expects denormalized `need_id`, `need_title`, `event_*`; only open opportunities should be included for actionability. |
| OpportunitiesTab invite badge | `needs_needinvite` (`NeedInvite`) | `id`, `need_id`, `vendor_id`, `invited_by_id`, `status`, `created_at` | `is_invited` badge is derived from invite presence/status for current vendor. |
| OpportunitiesTab potential feed (`useMyPotentialOpportunities`) | `needs_eventneed` + `events_event` | Same base columns as relevant feed | Represents categories outside current vendor services; depends on category mismatch logic. |
| Service category chips in opportunities hero | `vendors_vendorservice` (`VendorService`) | `id`, `vendor_id`, `category` | Category labels shown after transformation (`getCategoryLabel`). |

---

## Constraint checklist for quick seed validation

Use this as a pre-seed sanity list:

- `events_event.lifecycle_state` uses only allowed values: `draft`, `published`, `at_risk`, `postponed`, `event_ready`, `live`, `cancelled`, `completed`.
- `needs_eventneed.status` uses only `open`, `filled`, `cancelled`.
- `needs_eventneed.criticality` uses only `essential`, `replaceable`, `non_substitutable`.
- `needs_needapplication.status` uses only `pending`, `accepted`, `rejected`, `withdrawn`.
- `tickets_ticket.status` uses only `active`, `used`, `cancelled`, `refunded`.
- `events_eventreview.rating` and `events_eventvendorreview.rating` are integers in `[1, 5]`.
- Uniqueness respected:
  - `events_eventreview(event_id, reviewer_id)`
  - `events_eventvendorreview(event_review_id, vendor_id)`
  - `needs_needapplication(need_id, vendor_id)`
  - `events_eventinterest(event_id, user_id)`
  - `events_eventview(event_id, user_id)`
  - `tickets_ticket.barcode` unique
