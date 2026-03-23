import type { EventDetail, EventTicketTier } from '@/types/events';
import type { EventNeed } from '@/types/needs';

import {
  applyPlanningChecklistTemplate as tpl,
  type PlanningChecklistConfigItem,
  type PlanningChecklistContext,
  type PlanningChecklistItem,
  planningChecklistManagerConfig,
  type PlanningChecklistRuleKey,
} from './planningChecklistConfig';

export function formatChecklistDeadline(daysUntilEvent: number | null) {
  if (daysUntilEvent === null) return 'Before the event starts';
  if (daysUntilEvent <= 0) return 'Event day';
  if (daysUntilEvent === 1) return '24h before event';
  if (daysUntilEvent === 2) return '48h before event';
  return `${daysUntilEvent} days before event`;
}

function buildContext(
  event: EventDetail,
  eventNeeds: EventNeed[],
  totalSold = event.ticket_count ?? 0,
): PlanningChecklistContext {
  const missingDetails = [
    // Index 0: basic details check (title, category, location_address only).
    (() => {
      const missing: string[] = [];
      if (!event.title?.trim()) missing.push('title');
      if (!event.category?.id) missing.push('category');
      if (!event.location_address?.trim()) missing.push('location address');
      return missing.length === 0 ? null : missing.join(', ');
    })(),
  ].filter((x): x is string => Boolean(x));

  const isPublished = (() => {
    const { lifecycle_state } = event;
    // Once an event reaches "published", it should stay discoverable for subsequent
    // lifecycle states in this checklist flow (event_ready -> live -> completed).
    return (
      lifecycle_state === 'published' ||
      lifecycle_state === 'event_ready' ||
      lifecycle_state === 'live' ||
      lifecycle_state === 'completed'
    );
  })();
  const hasTickets = (event.ticket_tiers?.length || 0) > 0;
  const soldCount = event.ticket_count ?? totalSold;
  const derivedCapacity =
    event.ticket_tiers?.reduce(
      (sum: number, tier: EventTicketTier) => sum + (Number(tier.capacity) || 0),
      0,
    ) ||
    0;
  const salesPercentage = derivedCapacity > 0 ? (soldCount / derivedCapacity) * 100 : 0;
  const hasSalesThreshold = derivedCapacity > 0;
  const minimumSalesRequired = hasSalesThreshold ? Math.ceil(derivedCapacity * 0.2) : 1;
  const isSalesHealthy = soldCount >= minimumSalesRequired;
  const startDate = event.start_time ? new Date(event.start_time) : null;
  const daysUntilEvent = startDate
    ? Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const salesStatus: PlanningChecklistItem['status'] = isSalesHealthy
    ? 'done'
    : daysUntilEvent !== null && daysUntilEvent <= 3
      ? 'warn'
      : 'todo';

  return {
    event,
    eventNeeds,
    totalSold,
    missingDetails,
    isDetailsComplete: missingDetails.length === 0,
    isPublished,
    hasTickets,
    soldCount,
    derivedCapacity,
    salesPercentage,
    hasSalesThreshold,
    isSalesHealthy,
    salesStatus,
    daysUntilEvent,
    isLiveMilestoneComplete:
      event.lifecycle_state === 'live' || event.lifecycle_state === 'completed',
    coreItemsDone: false,
    salesItemsDone: false,
  };
}

function simpleDue(
  cfg: PlanningChecklistConfigItem,
  done: boolean,
  varsDone: Record<string, string | number> = {},
  varsPending: Record<string, string | number> = {},
) {
  return done ? tpl(cfg.dueDone ?? '', varsDone) : tpl(cfg.duePending ?? '', varsPending);
}

function ruleEventDetails(ctx: PlanningChecklistContext, cfg: PlanningChecklistConfigItem): PlanningChecklistItem {
  const ok = ctx.isDetailsComplete;
  return {
    label: cfg.label,
    status: ok ? 'done' : 'todo',
    due: simpleDue(cfg, ok, {}, { missingDetails: ctx.missingDetails.join(', ') }),
  };
}

function rulePublished(ctx: PlanningChecklistContext, cfg: PlanningChecklistConfigItem): PlanningChecklistItem {
  const ok = ctx.isPublished;
  return { label: cfg.label, status: ok ? 'done' : 'todo', due: simpleDue(cfg, ok) };
}

function ruleTickets(ctx: PlanningChecklistContext, cfg: PlanningChecklistConfigItem): PlanningChecklistItem {
  const ok = ctx.hasTickets;
  return {
    label: cfg.label,
    status: ok ? 'done' : 'todo',
    due: simpleDue(cfg, ok, { tierCount: ctx.event.ticket_tiers?.length || 0 }),
  };
}

function ruleSales(ctx: PlanningChecklistContext, cfg: PlanningChecklistConfigItem): PlanningChecklistItem {
  const isDone = ctx.salesStatus === 'done' || ctx.isLiveMilestoneComplete;
  let due: string;
  if (ctx.hasSalesThreshold) {
    due = tpl(cfg.dueWithMetrics ?? '', {
      soldCount: ctx.soldCount,
      derivedCapacity: ctx.derivedCapacity,
      salesPercentage: ctx.salesPercentage.toFixed(0),
    });
  } else {
    due = isDone
      ? tpl(cfg.dueDoneNoCapacity ?? '', {})
      : tpl(cfg.duePendingNoCapacity ?? '', {});
  }
  return { label: cfg.label, status: isDone ? 'done' : ctx.salesStatus, due, variant: 'sales' };
}

function ruleEventNeeds(
  ctx: PlanningChecklistContext,
  cfg: PlanningChecklistConfigItem,
): PlanningChecklistItem[] {
  const copy = cfg.eventNeedsCopy;
  if (!copy) return [];

  if (ctx.eventNeeds.length === 0) {
    return [{ label: copy.noNeedsDefined.label, status: 'done', due: copy.noNeedsDefined.dueDone }];
  }

  return ctx.eventNeeds.map((need) => {
    const accepted = need.applications.find((a) => a.status === 'accepted');
    const deadline = formatChecklistDeadline(ctx.daysUntilEvent);
    const urgent = ctx.daysUntilEvent !== null && ctx.daysUntilEvent <= 3;

    if (need.status === 'filled') {
      return {
        label: tpl(copy.slotFilled.label, { title: need.title }),
        status: 'done' as const,
        due: accepted
          ? tpl(copy.slotFilled.dueDoneWithVendor, { vendor: accepted.vendor_name })
          : copy.slotFilled.dueDoneFallback,
      };
    }
    if (need.status === 'override_filled') {
      return {
        label: tpl(copy.overrideFilled.label, { title: need.title }),
        status: 'done' as const,
        due: copy.overrideFilled.dueDone,
        variant: 'host' as const,
      };
    }
    if (need.application_count > 0) {
      return {
        label: tpl(copy.pendingDecision.label, { title: need.title }),
        status: urgent ? 'warn' : 'todo',
        due: tpl(copy.pendingDecision.duePending, {
          applicationCount: need.application_count,
          deadline,
          title: need.title,
        }),
      };
    }
    return {
      label: tpl(copy.stillNeeded.label, { title: need.title }),
      status: urgent ? 'warn' : 'todo',
      due: tpl(copy.stillNeeded.duePending, { deadline, title: need.title }),
    };
  });
}

function ruleCover(ctx: PlanningChecklistContext, cfg: PlanningChecklistConfigItem): PlanningChecklistItem {
  // Cover image checklist is linked to having a description too:
  // if either is missing, we keep this row in "todo".
  const coverPhotoMissing = !ctx.event.cover_image;
  const descriptionMissing = !ctx.event.description?.trim();
  const ok = !coverPhotoMissing && !descriptionMissing;
  const missing = (() => {
    if (coverPhotoMissing && descriptionMissing) return 'cover photo and description';
    if (coverPhotoMissing) return 'a cover photo';
    return 'a description';
  })();

  const due = ok ? (cfg.dueDone ?? '') : tpl(cfg.duePending ?? '', { missing });
  return { label: cfg.label, status: ok ? 'done' : 'todo', due };
}


function ruleGoReady(ctx: PlanningChecklistContext, cfg: PlanningChecklistConfigItem): PlanningChecklistItem {
  if (ctx.event.lifecycle_state === 'draft') {
    return {
      label: cfg.label,
      status: 'todo',
      due: tpl(cfg.label ?? '', {}),
      variant: 'go_ready',
    };
  }

  // Milestone satisfied once host has moved past "published" into ready / live / done.
  const ok =
    ctx.event.lifecycle_state === 'event_ready' ||
    ctx.event.lifecycle_state === 'live' ||
    ctx.event.lifecycle_state === 'completed';
  return {
    label: cfg.label,
    status: ok ? 'done' : 'todo',
    due: ok ? tpl(cfg.dueDone ?? '', {}) : tpl(cfg.duePending ?? '', {}),
    variant: 'go_ready',
  };
}
function ruleGoLive(ctx: PlanningChecklistContext, cfg: PlanningChecklistConfigItem): PlanningChecklistItem {
  if (
    ctx.event.lifecycle_state === 'draft' ||
    ctx.event.lifecycle_state === 'published' ||
    ctx.event.lifecycle_state === 'event_ready'
  ) {
    return {
      label: cfg.label,
      status: 'todo',
      due: tpl(cfg.label ?? '', {}),
      variant: 'go_live',
    };
  }
  // Only complete once the event is actually live (or wrapped up).
  const ok =
    ctx.event.lifecycle_state === 'live' || ctx.event.lifecycle_state === 'completed';
  return {
    label: cfg.label,
    status: ok ? 'done' : 'todo',
    due: ok ? tpl(cfg.dueDone ?? '', {}) : tpl(cfg.duePending ?? '', {}),
    variant: 'go_live',
  };
}
function ruleLiveEvent(
  ctx: PlanningChecklistContext,
  cfg: PlanningChecklistConfigItem,
): PlanningChecklistItem | null {
  if(ctx.event.lifecycle_state === 'draft' || ctx.event.lifecycle_state === 'published' || ctx.event.lifecycle_state === 'event_ready' ) {
    return { label: cfg.label, 
      status: 'todo', 
      due: tpl(cfg.label ?? '', {}),
      variant: 'live_event',
    }
  }
  const ok = (
    ctx.event.lifecycle_state === 'completed'
  );
  return {
    label: cfg.label,
    status: ok ? 'done' : 'todo',
    due: ok ? tpl(cfg.dueDoneCompleted ?? '', {}) : tpl(cfg.dueDoneLive ?? '', {}),
    variant: 'live_event',
  };
}

type RuleOut = PlanningChecklistItem | PlanningChecklistItem[] | null;

const rules: Record<PlanningChecklistRuleKey, (ctx: PlanningChecklistContext, cfg: PlanningChecklistConfigItem) => RuleOut> =
  {
    event_details_complete: ruleEventDetails,
    event_is_published: rulePublished,
    tickets_are_configured: ruleTickets,
    sales_threshold_looks_healthy: ruleSales,
    event_needs_status: ruleEventNeeds,
    cover_image_uploaded: ruleCover,
    go_ready: ruleGoReady,
    go_live: ruleGoLive,
    live_event: ruleLiveEvent,
  };

function flatRule(out: RuleOut): PlanningChecklistItem[] {
  if (out == null) return [];
  return Array.isArray(out) ? out : [out];
}

/** Core + sales completion for `go_live` (same grouping as config `group` field). */
function coreAndSalesDone(ctx: PlanningChecklistContext) {
  let coreOk = true;
  let salesOk = true;
  for (const cfg of planningChecklistManagerConfig) {
    if (cfg.enabled === false) continue;
    const g = cfg.group;
    if (g !== 'core' && g !== 'sales') continue;
    const items = flatRule(rules[cfg.resolver](ctx, cfg));
    const allDone = items.length === 0 || items.every((i) => i.status === 'done');
    if (g === 'core' && !allDone) coreOk = false;
    if (g === 'sales' && !allDone) salesOk = false;
  }
  return { coreItemsDone: coreOk, salesItemsDone: salesOk };
}

export function buildPlanningChecklist(
  event: EventDetail,
  eventNeeds: EventNeed[],
  totalSold = event.ticket_count ?? 0,
): PlanningChecklistItem[] {
  const base = buildContext(event, eventNeeds, totalSold);
  const { coreItemsDone, salesItemsDone } = coreAndSalesDone(base);
  const withLifecycle: PlanningChecklistContext = { ...base, coreItemsDone, salesItemsDone };

  const items: PlanningChecklistItem[] = [];
  for (const cfg of planningChecklistManagerConfig) {
    if (cfg.enabled === false) continue;
    // `go_live` and `go_ready` depend on aggregated `coreItemsDone` / `salesItemsDone`,
    // which are computed in `coreAndSalesDone()` above.
    const ctx = cfg.resolver === 'go_live' || cfg.resolver === 'go_ready' ? withLifecycle : base;
    for (const row of flatRule(rules[cfg.resolver](ctx, cfg))) {
      items.push({ ...row, sourceRule: cfg.id });
    }
  }
  return items;
}

export type { PlanningChecklistItem } from './planningChecklistConfig';

export function getFirstPendingChecklistItem(
  event: EventDetail,
  eventNeeds: EventNeed[],
  totalSold = event.ticket_count ?? 0,
) {
  return (
    buildPlanningChecklist(event, eventNeeds, totalSold).find((item) => item.status !== 'done') || null
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
          (item.variant === 'sales' || item.variant === 'go_live' || item.variant === 'go_ready' || item.variant === 'live_event'),
      ) || null
  );
}
