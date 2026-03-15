# Needs Overlay Wiring: Current Reality And Remaining Decisions

This is the reduced version of the earlier question list after checking the actual models, serializers, and current UI code.

Bottom line: the current needs system is intentionally narrow. The richer overlay can exist visually, but most of its fields do not have a real backend home yet.

Relevant files checked:
- [`backend/apps/needs/models.py`](/Users/aakarshika/Dev/outgoing/backend/apps/needs/models.py)
- [`backend/api/v1/needs/serializers.py`](/Users/aakarshika/Dev/outgoing/backend/api/v1/needs/serializers.py)
- [`backend/api/v1/needs/views.py`](/Users/aakarshika/Dev/outgoing/backend/api/v1/needs/views.py)
- [`frontend/src/types/needs.ts`](/Users/aakarshika/Dev/outgoing/frontend/src/types/needs.ts)
- [`frontend/src/types/events.ts`](/Users/aakarshika/Dev/outgoing/frontend/src/types/events.ts)
- [`frontend/src/types/vendors.ts`](/Users/aakarshika/Dev/outgoing/frontend/src/types/vendors.ts)
- [`frontend/src/components/events/ManageNeedsTab.tsx`](/Users/aakarshika/Dev/outgoing/frontend/src/components/events/ManageNeedsTab.tsx)

## What the current system already answers

### 1. Current backend need model is small and explicit

Today, a real need supports:
- `title`
- `description`
- `category`
- `criticality`
- `budget_min`
- `budget_max`
- `status`
- `assigned_vendor`
- `application_count`

There is no current backend support for:
- role type separate from category
- slots / number of openings
- fill deadline
- compensation option sets
- discount / free-entry / hybrid reward modeling
- per-need ticket thresholds
- per-need decision deadline
- cancellation terms
- agreement text / generated wording
- draft status for needs

Conclusion:
- the overlay is currently richer than the actual data model
- most of that richness will require backend work before it can persist truthfully

### 2. Current create/update payload is already known

From the serializers and existing create UI, the real v1 payload is:

```ts
type NeedCreatePayload = {
  title: string;
  description: string;
  category: string;
  criticality: 'essential' | 'replaceable' | 'non_substitutable';
  budget_min: string | null;
  budget_max: string | null;
  update_series?: boolean;
};

type NeedUpdatePayload = {
  title?: string;
  description?: string;
  category?: string;
  criticality?: 'essential' | 'replaceable' | 'non_substitutable';
  budget_min?: string | null;
  budget_max?: string | null;
  status?: 'open' | 'filled' | 'cancelled' | 'override_filled';
};
```

### 3. Application flow is basic and single-need oriented

What exists today:
- vendor applies to a need with:
  - `service_id`
  - `message`
  - `proposed_price`
- host can:
  - accept application
  - reject application
  - invite vendor to need
  - use host override via need status

What does not exist yet:
- richer vendor assignment metadata
- multi-slot acceptance logic
- compensation agreements
- per-assignment cancellation rules
- any sign of multiple accepted applicants per need

Practical interpretation:
- one need should be treated like one fillable assignment for now
- `pending` is best treated as derived UI state, not a real backend status

### 4. Vendor invite flow is narrow but real

`NeedInviteCreateView` only needs:
- `need_id`
- `vendor_id`
- optional `message`

Also important:
- invite only works when need status is `open`
- backend checks that the target user has at least one active `VendorService`

### 5. Events, tickets, and services are richer than needs

Event/ticket side already supports:
- event capacity
- ticket tiers
- refund percentages
- admits / max passes
- lifecycle states
- series support

Vendor services already support:
- title
- description
- category
- visibility
- base price
- portfolio

So the current mismatch is real:
- events/tickets are detailed
- needs are not

## Best answers to the original overlay questions

These are my best current answers without inventing backend behavior.

### Role type vs title vs category

Best mapping for v1:
- role type picker -> backend `category`
- short editable label -> backend `title`
- long explanatory text -> backend `description`

This is the cleanest mapping and aligns with the current contract.

### Suggested wording and generated vendor-facing copy

Best answer:
- helper UI only
- do not persist

There is no backend field for either one today.

### Slots and fill deadline

Best answer:
- not supported today
- treat each need as one fillable opening
- do not persist fill deadline

### Compensation model

Best answer:
- the only real persisted compensation in v1 is `budget_min` and `budget_max`
- all richer compensation choices are UI-only unless backend expands

### Thresholds, decision deadline, cancellation rules

Best answer:
- not supported as need fields today
- do not persist them from the overlay

If they matter operationally, they need new backend fields and a clear ownership model.

### Create vs edit

Best answer:
- same overlay can handle both
- create/edit should use the narrow payload above
- accepted-application locking is a product decision, not something the current model answers for us

### Status model

Best answer:
- real statuses remain:
  - `open`
  - `filled`
  - `cancelled`
  - `override_filled`
- `pending` should stay derived from `open + application_count > 0`
- invite should not introduce a new persisted status

### Review applicants

Best answer:
- `Approve` maps to `useReviewNeedApplication({ status: 'accepted' })`
- `Reject` maps to `useReviewNeedApplication({ status: 'rejected' })`
- current system behaves like one accepted result per need, not multi-slot acceptance

### Host override

Best answer:
- keep using `status = 'override_filled'`
- undo should most likely restore `open`

The exact effect on existing applications is still a product decision.

## Recommended shipping approach

If I wire the overlay today without backend changes, the safest truthful implementation is this:

### Persist for real
- save only:
  - `title`
  - `description`
  - `category`
  - `criticality`
  - `budget_min`
  - `budget_max`

### Edit for real
- edit only those same fields plus `status`

### UI-only sections
- slots
- fill deadline
- compensation option selector
- threshold / decision deadline
- cancellation policy
- generated vendor-facing wording

This would be the cleanest v1 because it matches the real contract instead of inventing persistence.

## The only questions that still matter

These are the only decisions I still need from you before wiring the overlay for real.

### 1. Shipping target

Should I ship:

- `Option A`: real wiring only for the current backend fields, while keeping the richer sections visible but UI-only
- `Option B`: block and wait for backend expansion, because you want the full overlay to persist for real

This is the main unblocker.

### 2. Category vs title

For v1, should I map the overlay like this:

- selected role type -> backend `category`
- short host-editable label -> backend `title`
- long explanation -> backend `description`

This is my recommendation unless you want a different title model.

### 3. Compensation for v1

Since backend only supports `budget_min` / `budget_max`, what should I do with the compensation section right now?

- reduce the real saved value to budget only
- keep all the option cards visible, but treat them as non-persisted UI

I recommend this unless backend is changing immediately.

### 4. Criticality default

Should the overlay expose `criticality` directly, or should I default it silently?

If default:
- use `replaceable`

If exposed:
- I should add a real control for:
  - `essential`
  - `replaceable`
  - `non_substitutable`

### 5. Edit restrictions after applications exist

If a need already has applications, should hosts still be allowed to edit:
- title
- description
- category
- budget
- criticality

My default assumption would be:
- yes, editable while no application is accepted
- probably lock or warn after an application is accepted

### 6. `Save draft` button

The overlay UI currently has `Save draft`.

But there is no draft state in the backend for needs.

Should `Save draft` for now mean:
- just close the overlay with no persistence
- or should I remove/rename it because that would be misleading

## My recommendation

I recommend:

1. Wire the overlay now using the real narrow payload.
2. Keep the richer sections visible but clearly non-persisted.
3. Add a small note in the code that these sections are awaiting backend fields.
4. Expand the backend later once the exact contracts are agreed.

## The shortest version

If you want to answer this in one message, these 5 answers are enough:

1. `Option A` or `Option B`
2. Should role type map to `category` and short label map to `title`? - yes
3. Should compensation save only as `budget_min` / `budget_max` for now? - no. i want the new design. 
4. Should `criticality` be exposed or default to `replaceable`? - remove field from ui.
5. After applications exist, which fields should be locked, if any? - none. later
