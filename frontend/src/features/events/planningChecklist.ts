import type { EventDetail } from '@/types/events';
import type { EventNeed } from '@/types/needs';

import {
  type PlanningChecklistContext,
  type PlanningChecklistItem,
  planningChecklistManagerConfig,
  type PlanningChecklistResolver,
  type PlanningChecklistRuleGroup,
} from './planningChecklistConfig';

export function formatChecklistDeadline(daysUntilEvent: number | null) {
  if (daysUntilEvent === null) return 'Before the event starts';
  if (daysUntilEvent <= 0) return 'Event day';
  if (daysUntilEvent === 1) return '24h before event';
  if (daysUntilEvent === 2) return '48h before event';
  return `${daysUntilEvent} days before event`;
}

function createPlanningChecklistContext(
  event: EventDetail,
  eventNeeds: EventNeed[],
  totalSold = event.ticket_count ?? 0,
): PlanningChecklistContext {
  const isOnline = event.location_address === 'Online Event';
  const missingDetails = [
    !event.title?.trim() ? 'title' : null,
    !event.description?.trim() ? 'description' : null,
    !event.category?.id ? 'category' : null,
    !event.start_time ? 'start time' : null,
    isOnline
      ? !event.location_name?.trim()
        ? 'join link'
        : null
      : !event.location_name?.trim() && !event.location_address?.trim()
        ? 'location'
        : null,
  ].filter(Boolean);

  const isDetailsComplete = missingDetails.length === 0;
  const isPublished =
    event.lifecycle_state !== 'draft' && event.lifecycle_state !== 'cancelled';
  const hasTickets = (event.ticket_tiers?.length || 0) > 0;
  const soldCount = event.ticket_count ?? totalSold;
  const derivedCapacity =
    event.capacity ||
    event.ticket_tiers?.reduce((sum: number, tier: any) => {
      return sum + (Number(tier.capacity) || 0);
    }, 0) ||
    0;
  const salesPercentage = derivedCapacity > 0 ? (soldCount / derivedCapacity) * 100 : 0;
  const hasSalesThreshold = derivedCapacity > 0;
  const isSalesHealthy = hasSalesThreshold && salesPercentage >= 20;
  const startDate = event.start_time ? new Date(event.start_time) : null;
  const daysUntilEvent = startDate
    ? Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const salesStatus: PlanningChecklistItem['status'] = isSalesHealthy
    ? 'done'
    : daysUntilEvent !== null && daysUntilEvent <= 3
      ? 'warn'
      : 'todo';
  const isLiveMilestoneComplete =
    event.lifecycle_state === 'live' || event.lifecycle_state === 'completed';

  return {
    event,
    eventNeeds,
    totalSold,
    missingDetails,
    isDetailsComplete,
    isPublished,
    hasTickets,
    soldCount,
    derivedCapacity,
    salesPercentage,
    hasSalesThreshold,
    isSalesHealthy,
    salesStatus,
    daysUntilEvent,
    isLiveMilestoneComplete,
    coreItemsDone: false,
    salesItemsDone: false,
  };
}

const checklistResolvers: Record<string, PlanningChecklistResolver> = {
  event_details_complete: (context) => ({
    label: 'Event details complete',
    status: context.isDetailsComplete ? 'done' : 'todo',
    due: context.isDetailsComplete
      ? 'Title, description, category, time, and location are all in place.'
      : `Still missing: ${context.missingDetails.join(', ')}.`,
  }),
  event_is_published: (context) => ({
    label: 'Event is published',
    status: context.isPublished ? 'done' : 'todo',
    due: context.isPublished
      ? 'People can discover the event and make a decision.'
      : 'Publish when the essentials feel trustworthy enough to sell.',
  }),
  tickets_are_configured: (context) => ({
    label: 'Tickets are configured',
    status: context.hasTickets ? 'done' : 'todo',
    due: context.hasTickets
      ? `${context.event.ticket_tiers?.length || 0} ticket tier(s) are ready.`
      : 'Add at least one ticket tier so the event has a clear entry path.',
  }),
  sales_threshold_looks_healthy: (context) => ({
    label: 'Sales threshold looks healthy',
    status:
      context.salesStatus === 'done' || context.isLiveMilestoneComplete
        ? 'done'
        : context.salesStatus,
    due:
      context.salesStatus === 'done' || context.isLiveMilestoneComplete
        ? context.hasSalesThreshold
          ? `Min 20% sold (${context.soldCount}/${context.derivedCapacity}). Now ${context.salesPercentage.toFixed(0)}%.`
          : 'Readiness milestone reached for this event.'
        : context.hasSalesThreshold
          ? `Min 20% sold (${context.soldCount}/${context.derivedCapacity}). Now ${context.salesPercentage.toFixed(0)}%.`
          : 'Set capacity to track readiness against ticket sales.',
    variant: 'sales',
  }),
  event_needs_status: (context) =>
    context.eventNeeds.length === 0
      ? [
          {
            label: 'No external needs defined',
            status: 'done',
            due: 'This event currently has no vendor or support dependencies.',
          },
        ]
      : context.eventNeeds.map((need) => {
          const acceptedApplication = need.applications.find(
            (application) => application.status === 'accepted',
          );
          if (need.status === 'filled') {
            return {
              label: `${need.title} slot filled`,
              status: 'done',
              due: acceptedApplication
                ? `${acceptedApplication.vendor_name} confirmed for this role.`
                : 'Vendor confirmed and the slot is covered.',
            };
          }
          if (need.status === 'override_filled') {
            return {
              label: `${need.title} covered by host`,
              status: 'done',
              due: 'You (host) are providing this service and are responsible for it.',
              variant: 'host',
            };
          }
          if (need.application_count > 0) {
            return {
              label: `${need.title} slot needs a decision`,
              status:
                context.daysUntilEvent !== null && context.daysUntilEvent <= 3
                  ? 'warn'
                  : 'todo',
              due: `${need.application_count} application(s) to review · ${formatChecklistDeadline(context.daysUntilEvent)}.`,
            };
          }
          return {
            label: `${need.title} still needed`,
            status:
              context.daysUntilEvent !== null && context.daysUntilEvent <= 3
                ? 'warn'
                : 'todo',
            due: `No applicants yet · ${formatChecklistDeadline(context.daysUntilEvent)}.`,
          };
        }),
  cover_image_uploaded: (context) => ({
    label: 'Cover image is uploaded',
    status: context.event.cover_image ? 'done' : 'todo',
    due: context.event.cover_image
      ? 'The event already has a visual anchor people can trust.'
      : 'Recommended. A strong cover image improves trust and click-through.',
  }),
  go_live: (context) => ({
    label: 'Go Live, and start admitting guests',
    status:
      context.isLiveMilestoneComplete ||
      (context.coreItemsDone && context.salesItemsDone)
        ? 'done'
        : 'todo',
    due:
      context.isLiveMilestoneComplete ||
      (context.coreItemsDone && context.salesItemsDone)
        ? 'You are perfectly ready to go live now.'
        : 'Finish the checklist above before going live.',
    variant: 'go_live',
  }),
  live_event: (context) => {
    if (context.event.lifecycle_state === 'live') {
      return {
        label: 'Live the event',
        status: 'done',
        due: "You are live. Nothing to do here but manage now, and celebrate later. Don't forget to add highlights, and return and tell us all about it!",
        variant: 'live_event',
      };
    }

    if (context.event.lifecycle_state === 'completed') {
      return {
        label: 'Live the event',
        status: 'done',
        due: 'All wrapped up here! Hope it went well.',
        variant: 'live_event',
      };
    }

    return null;
  },
};

function resolveChecklistGroup(
  context: PlanningChecklistContext,
  group: PlanningChecklistRuleGroup,
) {
  return planningChecklistManagerConfig
    .filter((item) => item.enabled !== false && item.group === group)
    .flatMap((item) => {
      const result = checklistResolvers[item.resolver](context);
      if (!result) return [];
      return Array.isArray(result) ? result : [result];
    });
}

export function buildPlanningChecklist(
  event: EventDetail,
  eventNeeds: EventNeed[],
  totalSold = event.ticket_count ?? 0,
): PlanningChecklistItem[] {
  const baseContext = createPlanningChecklistContext(event, eventNeeds, totalSold);
  const coreItems = resolveChecklistGroup(baseContext, 'core');
  const salesItems = resolveChecklistGroup(baseContext, 'sales');
  const lifecycleContext: PlanningChecklistContext = {
    ...baseContext,
    coreItemsDone: coreItems.every((item) => item.status === 'done'),
    salesItemsDone:
      salesItems.length === 0 || salesItems.every((item) => item.status === 'done'),
  };
  const lifecycleItems = resolveChecklistGroup(lifecycleContext, 'lifecycle');

  return [...coreItems, ...salesItems, ...lifecycleItems];
}

export type { PlanningChecklistItem } from './planningChecklistConfig';

export function getFirstPendingChecklistItem(
  event: EventDetail,
  eventNeeds: EventNeed[],
  totalSold = event.ticket_count ?? 0,
) {
  return (
    buildPlanningChecklist(event, eventNeeds, totalSold).find(
      (item) => item.status !== 'done',
    ) || null
  );
}

export function getChecklistFocusItem(
  event: EventDetail,
  eventNeeds: EventNeed[],
  totalSold = event.ticket_count ?? 0,
) {
  const items = buildPlanningChecklist(event, eventNeeds, totalSold);
  const firstPending = items.find((item) => item.status !== 'done');
  if (firstPending) return firstPending;
  return (
    [...items]
      .reverse()
      .find(
        (item) =>
          item.status === 'done' &&
          (item.variant === 'sales' ||
            item.variant === 'go_live' ||
            item.variant === 'live_event'),
      ) || null
  );
}
