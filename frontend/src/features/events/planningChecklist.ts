import type { EventDetail } from '@/types/events';
import type { EventNeed } from '@/types/needs';

export type PlanningChecklistItem = {
  label: string;
  status: 'done' | 'todo' | 'warn';
  due: string;
  variant?: 'host' | 'sales' | 'go_live' | 'live_event';
};

export function formatChecklistDeadline(daysUntilEvent: number | null) {
  if (daysUntilEvent === null) return 'Before the event starts';
  if (daysUntilEvent <= 0) return 'Event day';
  if (daysUntilEvent === 1) return '24h before event';
  if (daysUntilEvent === 2) return '48h before event';
  return `${daysUntilEvent} days before event`;
}

export function buildPlanningChecklist(
  event: EventDetail,
  eventNeeds: EventNeed[],
  totalSold = event.ticket_count ?? 0,
): PlanningChecklistItem[] {
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

  const needChecklistItems: PlanningChecklistItem[] =
    eventNeeds.length === 0
      ? [
          {
            label: 'No external needs defined',
            status: 'done',
            due: 'This event currently has no vendor or support dependencies.',
          },
        ]
      : eventNeeds.map((need) => {
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
              status: daysUntilEvent !== null && daysUntilEvent <= 3 ? 'warn' : 'todo',
              due: `${need.application_count} application(s) to review · ${formatChecklistDeadline(daysUntilEvent)}.`,
            };
          }
          return {
            label: `${need.title} still needed`,
            status: daysUntilEvent !== null && daysUntilEvent <= 3 ? 'warn' : 'todo',
            due: `No applicants yet · ${formatChecklistDeadline(daysUntilEvent)}.`,
          };
        });

  const isLiveMilestoneComplete =
    event.lifecycle_state === 'live' || event.lifecycle_state === 'completed';

  const nonMilestoneChecklistItems: PlanningChecklistItem[] = [
    {
      label: 'Event details complete',
      status: isDetailsComplete ? 'done' : 'todo',
      due: isDetailsComplete
        ? 'Title, description, category, time, and location are all in place.'
        : `Still missing: ${missingDetails.join(', ')}.`,
    },
    {
      label: 'Event is published',
      status: isPublished ? 'done' : 'todo',
      due: isPublished
        ? 'People can discover the event and make a decision.'
        : 'Publish when the essentials feel trustworthy enough to sell.',
    },
    {
      label: 'Tickets are configured',
      status: hasTickets ? 'done' : 'todo',
      due: hasTickets
        ? `${event.ticket_tiers?.length || 0} ticket tier(s) are ready.`
        : 'Add at least one ticket tier so the event has a clear entry path.',
    },
    ...needChecklistItems,
    {
      label: 'Cover image is uploaded',
      status: event.cover_image ? 'done' : 'todo',
      due: event.cover_image
        ? 'The event already has a visual anchor people can trust.'
        : 'Recommended. A strong cover image improves trust and click-through.',
    },
  ];

  const allNonMilestoneItemsDone = nonMilestoneChecklistItems.every(
    (item) => item.status === 'done',
  );
  const goLiveDone =
    isLiveMilestoneComplete || (allNonMilestoneItemsDone && salesStatus === 'done');
  const salesDone = salesStatus === 'done' || goLiveDone || isLiveMilestoneComplete;
  const baseChecklistItems: PlanningChecklistItem[] = [
    ...nonMilestoneChecklistItems.slice(0, 3),
    {
      label: 'Sales threshold looks healthy',
      status: salesDone ? 'done' : salesStatus,
      due: salesDone
        ? hasSalesThreshold
          ? `Min 20% sold (${soldCount}/${derivedCapacity}). Now ${salesPercentage.toFixed(0)}%.`
          : 'Readiness milestone reached for this event.'
        : hasSalesThreshold
          ? `Min 20% sold (${soldCount}/${derivedCapacity}). Now ${salesPercentage.toFixed(0)}%.`
          : 'Set capacity to track readiness against ticket sales.',
      variant: 'sales',
    },
    ...nonMilestoneChecklistItems.slice(3),
  ];
  const lifecycleItems: PlanningChecklistItem[] = [];

  lifecycleItems.push({
    label: 'Go Live, and start admitting guests',
    status: goLiveDone ? 'done' : 'todo',
    due: goLiveDone
      ? 'You are perfectly ready to go live now.'
      : 'Finish the checklist above before going live.',
    variant: 'go_live',
  });

  if (event.lifecycle_state === 'live') {
    lifecycleItems.push({
      label: 'Live the event',
      status: 'done',
      due: "You are live. Nothing to do here but manage now, and celebrate later. Don't forget to add highlights, and return and tell us all about it!",
      variant: 'live_event',
    });
  } else if (event.lifecycle_state === 'completed') {
    lifecycleItems.push({
      label: 'Live the event',
      status: 'done',
      due: 'All wrapped up here! Hope it went well.',
      variant: 'live_event',
    });
  }

  return [...baseChecklistItems, ...lifecycleItems];
}

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
