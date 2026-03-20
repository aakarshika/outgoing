import type { EventDetail } from '@/types/events';
import type { EventNeed } from '@/types/needs';

export type PlanningChecklistStatus = 'done' | 'todo' | 'warn';

export type PlanningChecklistVariant = 'host' | 'sales' | 'go_live' | 'live_event';

export type PlanningChecklistItem = {
  label: string;
  status: PlanningChecklistStatus;
  due: string;
  variant?: PlanningChecklistVariant;
};

export type PlanningChecklistRuleKey =
  | 'event_details_complete'
  | 'event_is_published'
  | 'tickets_are_configured'
  | 'sales_threshold_looks_healthy'
  | 'event_needs_status'
  | 'cover_image_uploaded'
  | 'go_live'
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

export type PlanningChecklistResolver = (
  context: PlanningChecklistContext,
) => PlanningChecklistItem | PlanningChecklistItem[] | null;

export type PlanningChecklistConfigItem = {
  id: PlanningChecklistRuleKey;
  label: string;
  group: PlanningChecklistRuleGroup;
  resolver: PlanningChecklistRuleKey;
  enabled?: boolean;
};

// Reorder or remove entries here to control the checklist without touching the builder.
export const planningChecklistManagerConfig: PlanningChecklistConfigItem[] = [
  {
    id: 'event_details_complete',
    label: 'Event details complete',
    group: 'core',
    resolver: 'event_details_complete',
  },
  {
    id: 'event_is_published',
    label: 'Event is published',
    group: 'core',
    resolver: 'event_is_published',
  },
  {
    id: 'tickets_are_configured',
    label: 'Tickets are configured',
    group: 'core',
    resolver: 'tickets_are_configured',
  },
  {
    id: 'sales_threshold_looks_healthy',
    label: 'Sales threshold looks healthy',
    group: 'sales',
    resolver: 'sales_threshold_looks_healthy',
  },
  {
    id: 'event_needs_status',
    label: 'Event needs status',
    group: 'core',
    resolver: 'event_needs_status',
  },
  {
    id: 'cover_image_uploaded',
    label: 'Cover image is uploaded',
    group: 'core',
    resolver: 'cover_image_uploaded',
  },
  {
    id: 'go_live',
    label: 'Go Live, and start admitting guests',
    group: 'lifecycle',
    resolver: 'go_live',
  },
  {
    id: 'live_event',
    label: 'Live the event',
    group: 'lifecycle',
    resolver: 'live_event',
  },
] as const;
