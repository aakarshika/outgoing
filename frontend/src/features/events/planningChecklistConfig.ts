import type { EventDetail } from '@/types/events';
import type { EventNeed } from '@/types/needs';

export type PlanningChecklistStatus = 'done' | 'todo' | 'warn';

export type PlanningChecklistVariant = 'host' | 'sales' | 'go_live' | 'go_ready' | 'live_event';
export type PlanningChecklistTextField = 'label' | 'due';

export type PlanningChecklistItem = {
  label: string;
  status: PlanningChecklistStatus;
  due: string;
  variant?: PlanningChecklistVariant;
  /** Which config rule produced this row (for filtering / ordering). */
  sourceRule?: PlanningChecklistRuleKey;
};

export type PlanningChecklistRuleKey =
  | 'event_details_complete'
  | 'event_is_published'
  | 'tickets_are_configured'
  | 'sales_threshold_looks_healthy'
  | 'event_needs_status'
  | 'cover_image_uploaded'
  | 'go_live'
  | 'go_ready'
  | 'live_event';

export type PlanningChecklistRuleGroup = 'core' | 'sales' | 'lifecycle';

export type PlanningChecklistContext = {
  event: EventDetail;
  eventNeeds: EventNeed[];
  totalSold: number;
  missingDetails: string[];
  isDetailsComplete: boolean;
  isPublished: boolean;
  hasTickets: boolean;
  soldCount: number;
  derivedCapacity: number;
  salesPercentage: number;
  hasSalesThreshold: boolean;
  isSalesHealthy: boolean;
  salesStatus: PlanningChecklistStatus;
  daysUntilEvent: number | null;
  isLiveMilestoneComplete: boolean;
  coreItemsDone: boolean;
  salesItemsDone: boolean;
};

/** Replace `{key}` tokens in a string (e.g. `{missingDetails}`). */
export function applyPlanningChecklistTemplate(
  template: string,
  vars: Record<string, string | number | null | undefined>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars[key];
    return v == null ? '' : String(v);
  });
}

export type PlanningChecklistEventNeedsCopy = {
  noNeedsDefined: { label: string; dueDone: string };
  slotFilled: {
    label: string;
    dueDoneWithVendor: string;
    dueDoneFallback: string;
  };
  overrideFilled: {
    label: string;
    dueDone: string;
  };
  pendingDecision: {
    label: string;
    duePending: string;
  };
  stillNeeded: {
    label: string;
    duePending: string;
  };
};

export type PlanningChecklistResolver = (
  context: PlanningChecklistContext,
  configItem: PlanningChecklistConfigItem,
) => PlanningChecklistItem | PlanningChecklistItem[] | null;

export type PlanningChecklistAttentionConfig = {
  pendingTitleField: PlanningChecklistTextField;
  pendingSubField: PlanningChecklistTextField;
  doneTitleField: PlanningChecklistTextField;
  doneSubField: PlanningChecklistTextField;
};

/**
 * Checklist rule registry + copy.
 * - `label` — row title in the checklist (same as before).
 * - `duePending` / `dueDone` — guidance text for unchecked / checked (`due` on `PlanningChecklistItem`).
 * - Rule-specific optional fields (`dueWithMetrics`, `eventNeedsCopy`, …) are documented per entry.
 */
export type PlanningChecklistConfigItem = {
  id: PlanningChecklistRuleKey;
  label: string;
  group: PlanningChecklistRuleGroup;
  resolver: PlanningChecklistRuleKey;
  enabled?: boolean;
  /** `due` when status is todo or warn. */
  duePending?: string;
  /** `due` when status is done. */
  dueDone?: string;
  /** Sales rule: `due` when capacity exists (pending or done). */
  dueWithMetrics?: string;
  /** Sales rule: `due` when there is no capacity and the item is not satisfied. */
  duePendingNoCapacity?: string;
  /** Sales rule: `due` when there is no capacity but the milestone is satisfied. */
  dueDoneNoCapacity?: string;
  /** Live-event rule: `due` when `lifecycle_state === 'live'`. */
  dueDoneLive?: string;
  /** Live-event rule: `due` when `lifecycle_state === 'completed'`. */
  dueDoneCompleted?: string;
  /** Event-needs rule: copy for dynamically generated rows. */
  eventNeedsCopy?: PlanningChecklistEventNeedsCopy;
};

// Reorder or remove entries here to control the checklist without touching the builder.
export const planningChecklistManagerConfig: readonly PlanningChecklistConfigItem[] = [
  {
    id: 'event_details_complete',
    label: 'Event details complete',
    group: 'core',
    resolver: 'event_details_complete',
    duePending: 'Still missing: {missingDetails}.',
    dueDone: 'Title, category, and location address are all in place.',
  },
  {
    id: 'event_is_published',
    label: 'Event is published',
    group: 'lifecycle',
    resolver: 'event_is_published',
    duePending: 'You are publish ready. Start collecting interest and selling tickets',
    dueDone: 'People can discover the event and make a decision.',
  },
  {
    id: 'tickets_are_configured',
    label: 'Tickets are configured',
    group: 'core',
    resolver: 'tickets_are_configured',
    duePending: 'Add at least one ticket tier so the event has a clear entry path.',
    dueDone: '{tierCount} ticket tier(s) are ready.',
  },
  {
    id: 'sales_threshold_looks_healthy',
    label: 'Sales threshold looks healthy',
    group: 'sales',
    resolver: 'sales_threshold_looks_healthy',
    dueWithMetrics:
      'Min 20% sold ({soldCount}/{derivedCapacity}). Now {salesPercentage}%.',
    duePendingNoCapacity: 'No ticket capacity cap is set. Atleast 1 guest required for event to happen',
    dueDoneNoCapacity: 'No capacity cap set. Minimum 1 ticket sold requirement is met.',
  },
  {
    id: 'event_needs_status',
    label: 'Event needs status',
    group: 'core',
    resolver: 'event_needs_status',
    eventNeedsCopy: {
      noNeedsDefined: {
        label: 'No external needs defined',
        dueDone: 'This event currently has no vendor or support dependencies.',
      },
      slotFilled: {
        label: '{title} slot filled',
        dueDoneWithVendor: '{vendor} confirmed for this role.',
        dueDoneFallback: 'Vendor confirmed and the slot is covered.',
      },
      overrideFilled: {
        label: '{title} covered by host',
        dueDone: 'You (host) are providing this service and are responsible for it.',
      },
      pendingDecision: {
        label: '{title} slot needs a decision',
        duePending: '{applicationCount} application(s) to review · {deadline}.',
      },
      stillNeeded: {
        label: '{title} still needed',
        duePending: 'No applicants for {title} yet',
      },
    },
  },
  {
    id: 'cover_image_uploaded',
    label: 'Cover photo and description are set',
    group: 'core',
    resolver: 'cover_image_uploaded',
    duePending:
      'Recommended. Add {missing} so guests know what to expect.',
    dueDone: 'The event has a visual anchor and clear details guests can rely on.',
  },
  {
    id: 'go_ready',
    label: 'Mark event ready',
    group: 'lifecycle',
    resolver: 'go_ready',
    duePending: 'All engines go! Send last minute instructions to your guests.',
    dueDone: 'You are perfectly ready to go live now.',
  },
  {
    id: 'go_live',
    label: 'Go Live, and start admitting guests',
    group: 'lifecycle',
    resolver: 'go_live',
    duePending: 'Go Live, and start admitting guests! Have fun!',
    dueDone: 'Tickets Closed. Needs are met. Event is Live. ',
  },
  {
    id: 'live_event',
    label: 'Live the event',
    group: 'lifecycle',
    resolver: 'live_event',
    dueDoneLive:
      "You are live. Nothing to do here but manage now, and celebrate later. Don't forget to add highlights, and return and tell us all about it!",
    dueDoneCompleted: 'All wrapped up here! Hope it went well.',
  },
] as const;

export const planningChecklistAttentionConfig: PlanningChecklistAttentionConfig = {
  pendingTitleField: 'due',
  pendingSubField: 'label',
  doneTitleField: 'label',
  doneSubField: 'due',
};
