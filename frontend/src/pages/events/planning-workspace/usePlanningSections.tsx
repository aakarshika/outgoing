import { getCategoryTheme } from '@/features/events/CategoricalBackground';
import { BaseFeedEventItem, EventDetail, type EventLifecycleState } from '@/types/events';
import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Stack, Drawer, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';


import {
  useCategories,
  useEvent,
  useHostVendorMessages,
  useMyFriendships,
  usePrivateMessages,
  useTransitionEventLifecycle,
} from '@/features/events/hooks';
import { ChatDrawer } from '../components/ChatDrawer';
import { buildPlanningChecklist, formatChecklistDeadline } from '@/features/events/planningChecklist';
import { useEventNeeds } from '@/features/needs/hooks';
import addons from './addons.json';
import ideas from './ideas.json';
import { HostEventChecklist } from './HostEventChecklist';
import { AttentionList, type ChecklistAttentionPayload } from './components/AttentionList';
import { PlanningCheckGrid } from './components/CheckGrid';
import { AllNeeds as AllNeedsList } from './components/AllNeeds';
import { getCategoryVisuals } from '@/constants/categories';
import { formatDateLabel, totalCapacityFromTiers } from './shared';
import type { PlanningChecklistItem } from '@/features/events/planningChecklist';
import { EventNeed } from '@/types/needs';
import { TICKET_COLORS } from '@/features/events/constants';
import { QuickEditEvent, QuickEditEventSubmitPayload } from '@/components/events/QuickEditEvent';
import { updateEvent, updateEventTicketTiers, saveEventAddonDescription } from '@/features/events/api';
import { updateEventNeed, createEventNeed } from '@/features/needs/api';
import { toast } from 'sonner';
import { TicketsTiersDetails } from './components/TicketsTiersDetails';
import { QuickEditTicket } from './components/QuickEditTicket';
import type { QuickEditTicketTierPayload } from './components/QuickEditTicket';
import { QuickEditNeed, QuickEditNeedPayload } from './components/QuickEditNeed';
import { CalendarDays, Check, ChevronRight, MapPin, Tag, Trash2, Users } from 'lucide-react';
import { FEATURE_ITEMS, TAG_COLORS } from '@/pages/events/manage/ManageDetailsSection';
import type { PlanningChecklistRuleKey } from '@/features/events/planningChecklistConfig';
import { useNavigate } from 'react-router-dom';
import { LiveAttendanceCompactStep } from '../components/manage-redesign/LiveAttendanceCompactStep';

type PlanningSections = {
  HeroSectionEventStats: () => JSX.Element;
  AttentionItems: () => JSX.Element;
  CheckGrid: () => JSX.Element;
  AllNeeds: () => JSX.Element;
  AddOns: () => JSX.Element;
  Ideas: () => JSX.Element;
  Checklist: () => JSX.Element;
  Chat: () => JSX.Element;
  Tickets: () => JSX.Element;
};


const parseMoney = (input: string | number | null | undefined) => {
  if (input === null || typeof input === 'undefined') return null;
  if (typeof input === 'number') return input;

  const raw = String(input).replace(/,/g, '').replace(/₹/g, '').trim();
  if (!raw) return null;

  const isK = raw.toLowerCase().includes('k');
  const isL = raw.toLowerCase().includes('l');
  const isM = raw.toLowerCase().includes('m');

  const num = Number(raw.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(num)) return null;
  if (isL) return num * 1_00_000;
  if (isM) return num * 1_000_000;
  if (isK) return num * 1_000;
  return num;
};

const toCompactINR = (value: number) => {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1).replace(/\.0$/, '')}L`;
  if (abs >= 1_000) return `₹${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
};

export function usePlanningSections({
  eventId,
  routeCardKey,
  routeFlashToken,
}: {
  eventId: number;
  routeCardKey: 'whenWhere' | 'tickets' | 'needs' | 'guestList' | null;
  routeFlashToken: number;
}): PlanningSections {
  const navigate = useNavigate();

  const { data: eventResponse, isLoading: isEventLoading, refetch: refetchEvent } = useEvent(eventId);
  const { data: needsResponse } = useEventNeeds(eventId);

  const event: EventDetail | BaseFeedEventItem | null = eventResponse?.data || null;
  const eventNeeds: EventNeed[] = needsResponse?.data || [];
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isLiveAttendanceOpen, setIsLiveAttendanceOpen] = useState(false);
  const [isQuickCreateSubmitting, setIsQuickCreateSubmitting] = useState(false);
  const [lifecycleActionResolver, setLifecycleActionResolver] = useState<PlanningChecklistRuleKey | null>(null);
  const [isLifecycleDialogOpen, setIsLifecycleDialogOpen] = useState(false);
  const [isLifecycleSubmitting, setIsLifecycleSubmitting] = useState(false);
  const transitionLifecycle = useTransitionEventLifecycle();

  const isLoading = isEventLoading && !event;

  const LoadingSection = () => (
    <Box sx={{ mt: 1.5, p: 3, borderRadius: 3, background: '#f9f9f9' }}>
      <Typography sx={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
        Loading event…
      </Typography>
    </Box>
  );

  const NotFoundSection = () => (
    <Box sx={{ mt: 1.5, p: 3, borderRadius: 3, background: '#f9f9f9' }}>
      <Typography sx={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
        Event not found.
      </Typography>
    </Box>
  );

  if (isLoading) {
    return {
      HeroSectionEventStats: LoadingSection,
      AttentionItems: LoadingSection,
      CheckGrid: LoadingSection,
      AllNeeds: LoadingSection,
      AddOns: LoadingSection,
      Ideas: LoadingSection,
      Checklist: LoadingSection,
      Chat: LoadingSection,
      Tickets: LoadingSection,
    };
  }

  if (!event) {
    return {
      HeroSectionEventStats: NotFoundSection,
      AttentionItems: NotFoundSection,
      CheckGrid: NotFoundSection,
      AllNeeds: NotFoundSection,
      AddOns: NotFoundSection,
      Ideas: NotFoundSection,
      Checklist: NotFoundSection,
      Chat: NotFoundSection,
      Tickets: NotFoundSection,
    };
  }

  const eventDetail = event as EventDetail;
  const categoryTheme = getCategoryTheme(event.category ?? undefined);

  const startDate = eventDetail.start_time ? new Date(eventDetail.start_time) : null;
  const daysUntilEvent =
    startDate === null
      ? null
      : Math.max(
        0,
        Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      );

  const checklistItems: PlanningChecklistItem[] = buildPlanningChecklist(
    eventDetail,
    eventNeeds,
    eventDetail.ticket_count ?? 0,
  );
  const completedChecklistCount = checklistItems.filter((i) => i.status === 'done').length;

  const pendingNeeds = eventNeeds.filter((n) => n.status === 'open' || n.status === 'pending');
  const openNeedsCount = pendingNeeds.length;

  const goingCount = eventDetail.ticket_count ?? 0;
  const salesCapacity = totalCapacityFromTiers(eventDetail.ticket_tiers);
  const salesMinRequired =
    salesCapacity != null && salesCapacity > 0 ? Math.max(1, Math.ceil(salesCapacity * 0.2)) : 1;
  const salesProgressPct =
    salesCapacity != null && salesCapacity > 0
      ? Math.min((goingCount / salesCapacity) * 100, 100)
      : Math.min((goingCount / salesMinRequired) * 100, 100);
  const salesIsReady = goingCount >= salesMinRequired;
  const collectedMoney = (() => {
    const tiers = eventDetail.ticket_tiers ?? [];
    const total = tiers.reduce((sum, t) => {
      const price = parseMoney(t.price);
      if (price === null) return sum;
      return sum + price * (t.sold_count ?? 0);
    }, 0);
    // Keep this as a number so `0` sales correctly renders `₹0`
    // (instead of falling back to a hardcoded placeholder).
    return total;
  })();

  // "Lifecycle" vs "Core" here is based on planning checklist rule group, not `variant`.
  // - lifecycle: event_is_published, go_ready, go_live, live_event
  // - sales: sales_threshold_looks_healthy
  // - core: event_details_complete, tickets_are_configured, cover_image_uploaded
  const lifecycleRuleKeys = new Set(['event_is_published', 'go_ready', 'go_live', 'live_event']);
  const salesRuleKeys = new Set(['sales_threshold_looks_healthy']);
  const coreRuleKeys = new Set(['event_details_complete', 'tickets_are_configured', 'cover_image_uploaded']);

  const firstPendingLifecycleAttention = checklistItems.find(
    (i) => i.status !== 'done' && i.sourceRule != null && lifecycleRuleKeys.has(i.sourceRule),
  );

  const firstPendingSalesAttention = checklistItems.find(
    (i) => i.status !== 'done' && i.sourceRule != null && salesRuleKeys.has(i.sourceRule),
  );

  const firstPendingCoreAttention = checklistItems.find(
    (i) => i.status !== 'done' && i.sourceRule != null && coreRuleKeys.has(i.sourceRule),
  );

  const checklistAttention: ChecklistAttentionPayload[] = [];
  if (firstPendingLifecycleAttention) {
    checklistAttention.push({
      kind: 'lifecycle',
      due: firstPendingLifecycleAttention.due,
      resolver: firstPendingLifecycleAttention.sourceRule ?? undefined,
    });
  }
  if (firstPendingSalesAttention) {
    checklistAttention.push({
      kind: 'sales',
      due: firstPendingSalesAttention.due,
      resolver: firstPendingSalesAttention.sourceRule ?? undefined,
      soldCount: goingCount,
      capacity: salesCapacity,
      minRequired: salesMinRequired,
      progressPct: salesProgressPct,
      isReady: salesIsReady,
    });
  }
  if (firstPendingCoreAttention) {
    // Core checklist attention is rendered with the "default" UI styling.
    checklistAttention.push({
      kind: 'default',
      due: firstPendingCoreAttention.due,
      resolver: firstPendingCoreAttention.sourceRule ?? undefined,
    });
  }

  const lifecycleActionCopy = (() => {
    if (lifecycleActionResolver === 'event_is_published') {
      return {
        title: 'Publish this event?',
        body: 'This will move your event from Draft to Published so people can discover it.',
        cta: 'Publish event',
        nextLifecycleState: 'published',
      } as const;
    }
    if (lifecycleActionResolver === 'go_ready') {
      return {
        title: 'Mark event ready?',
        body: 'This will move your event from Published to Event Ready so you can prepare to go live.',
        cta: 'Mark as event ready',
        nextLifecycleState: 'event_ready',
      } as const;
    }

    if (lifecycleActionResolver === 'go_live') {
      return {
        title: 'Go Live?',
        body: 'This will move your event from Event Ready to Live and mark the event as currently running.',
        cta: 'Go Live!',
        nextLifecycleState: 'live',
      } as const;
    }
    if (lifecycleActionResolver === 'live_event') {
      return {
        title: 'Complete this event?',
        body: 'This will move your event from Live to Completed.',
        cta: 'Complete event',
        nextLifecycleState: 'completed',
      } as const;
    }
    if (eventDetail.lifecycle_state === 'completed') {
      return {
        title: 'Complete.',
        body: 'Completed.',
        cta: 'Completed.',
        nextLifecycleState: 'none',
      } as const;
    }
    return null;
  })();

  const checklistLifecycleActionLabel = (() => {
    if (firstPendingLifecycleAttention?.sourceRule === 'event_is_published') return 'Publish event';
    if (firstPendingLifecycleAttention?.sourceRule === 'go_ready') return 'Mark event ready';
    if (firstPendingLifecycleAttention?.sourceRule === 'go_live') return 'Go live';
    if (firstPendingLifecycleAttention?.sourceRule === 'live_event') return 'Complete event';
    return 'Continue';
  })();

  const handleChecklistLifecycleAction = (resolver?: PlanningChecklistRuleKey) => {
    setLifecycleActionResolver(resolver ?? null);
    setIsLifecycleDialogOpen(true);
  };

  const handleConfirmLifecycleAction = async () => {
    if (!lifecycleActionCopy) {
      setIsLifecycleDialogOpen(false);
      return;
    }
    setIsLifecycleSubmitting(true);
    try {
      await transitionLifecycle.mutateAsync({
        eventId,
        toState: lifecycleActionCopy.nextLifecycleState as EventLifecycleState,
        reason: 'planning_checklist',
      });
      await refetchEvent();
      toast.success(`Event moved to ${lifecycleActionCopy.nextLifecycleState.replace('_', ' ')}.`);
      setIsLifecycleDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not update event lifecycle');
    } finally {
      setIsLifecycleSubmitting(false);
    }
  };

  const pendingApplicationsWithNeed = eventNeeds.flatMap((need) =>
    (need.applications || [])
      .filter((application) => application.status === 'pending')
      .map((application) => ({ need, application })),
  );

  const pendingAppsCount = pendingApplicationsWithNeed.length;
  const firstPendingApplication = pendingApplicationsWithNeed[0];
  const firstPendingNeed = firstPendingApplication?.need ?? null;

  const attentionAppTitle = firstPendingApplication
    ? `${firstPendingApplication.application.vendor_name} wants to provide ${firstPendingNeed?.category || 'participate'}`
    : 'No pending applications';
  const attentionAppSub = pendingAppsCount
    ? `${pendingAppsCount} pending application${pendingAppsCount === 1 ? '' : 's'} waiting to review · ${formatChecklistDeadline(daysUntilEvent)}.`
    : `No one has applied yet · ${formatChecklistDeadline(daysUntilEvent)}.`

  const pendingAppsIcon = firstPendingNeed ? getCategoryVisuals(firstPendingNeed.category).icon : '🎙️';

  const pendingTitles = pendingNeeds.map((n) => n.title);

  const needsAttentionTitle =
    pendingTitles.length === 0 ? 'No open needs' : pendingTitles.join(', ');


  const needsAttentionSub = pendingNeeds.some((n) => n.application_count > 0)
    ? 'Some cover letters are waiting.'
    : 'No one has applied yet';

  const whenWhereSub = `${eventDetail.start_time ? formatDateLabel(eventDetail.start_time) : 'Date TBD'} · ${eventDetail.location_name || 'Location'}`;

  const ticketsTiers = eventDetail.ticket_tiers?.length ?? 0;
  const ticketsSold = goingCount;
  const capacityFromTiers = totalCapacityFromTiers(eventDetail.ticket_tiers);
  const minAttendeesExplicit =
    Number((eventDetail as { min_attendees?: number }).min_attendees) || 0;
  /** Overall threshold: explicit API value, or 20% of capped tier total when capacity is known. */
  const effectiveMinParticipants =
    minAttendeesExplicit > 0
      ? minAttendeesExplicit
      : capacityFromTiers != null && capacityFromTiers > 0
        ? Math.max(1, Math.ceil(capacityFromTiers * 0.2))
        : 0;

  const needsSub = openNeedsCount
    ? `${pendingNeeds[0]?.title ? `${pendingNeeds[0].title} pending` : 'Needs pending'} · ${openNeedsCount} still open`
    : eventNeeds.length === 0
      ? 'Add details to find quick help with your event'
      : 'All needs handled';

  // Guest-list eligibility is based on ticket capacity + minimum threshold.
  // If capacity is `0` or unknown/unbounded, we treat the minimum threshold as `1`.
  const salesNotDone = !salesIsReady;

  const addonItems = (addons as Array<any>).slice(0, 5);
  const ideasItems = (ideas as Array<any>).filter((i) => {
    const slug = event.category?.slug;
    return slug ? i.category === slug : true;
  });


  const PlanningHeroStatsPanel = () => (
    <Box
      sx={{
        mx: 1.75,
        mt: 1.75,
        mb: 0.75,
        borderRadius: '18px',
        background: event.cover_image
          ? 'none'
          : `linear-gradient(135deg, ${categoryTheme.accent} 0%, ${categoryTheme.tape} 100%)`,
        px: 2.5,
        py: 2.2,
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 7,
          background: `linear-gradient(180deg, ${categoryTheme.accent} 0%, ${categoryTheme.tape} 100%)`,
          zIndex: 3,
        },
      }}
    >
      {event.cover_image && (
        <>
          <Box
            component="img"
            src={event.cover_image}
            alt={event.title}
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, rgba(24, 24, 24, 0.45) 0%, rgba(24, 24, 24, 0.65) 100%)',
              zIndex: 1,
            }}
          />
        </>
      )}

      <Box sx={{ position: 'relative', zIndex: 2, pl: 1 }}>
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            mb: 0.75,
          }}
        >
          {(event.category?.name || 'Event').toString()} · {eventDetail.location_name || 'Location'} ·{' '}
          {(daysUntilEvent ?? '—').toString()} days away
        </Typography>

        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 24,
            fontWeight: 800,
            lineHeight: 1.15,
            mb: 1.5,
          }}
        >
          {event.title}
        </Typography>

        <Stack direction="row" spacing={1.5} sx={{ mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography
            sx={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            📅 {eventDetail.start_time ? formatDateLabel(eventDetail.start_time) : 'Sat, Apr 5 · 8pm'}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            👥 Guest list & RSVPs
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Box
            sx={{
              flex: 1,
              background: 'rgba(0,0,0,0.25)',
              backdropFilter: 'blur(4px)',
              borderRadius: '10px',
              py: 1.25,
              textAlign: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 20,
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.15,
              }}
            >
              {capacityFromTiers != null
                ? `${goingCount} / ${capacityFromTiers}`
                : `${goingCount} / —`}
            </Typography>
            <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', mt: 0.25 }}>
              sold / capacity
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              background: 'rgba(0,0,0,0.25)',
              backdropFilter: 'blur(4px)',
              borderRadius: '10px',
              py: 1.25,
              textAlign: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 20,
                fontWeight: 800,
                color: '#fff',
              }}
            >
              {Number.isFinite(collectedMoney) ? toCompactINR(collectedMoney) : '—'}
            </Typography>
            <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', mt: 0.25 }}>
              collected
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              background: 'rgba(0,0,0,0.25)',
              backdropFilter: 'blur(4px)',
              borderRadius: '10px',
              py: 1.25,
              textAlign: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 20,
                fontWeight: 800,
                color: '#fff',
              }}
            >
              {openNeedsCount}
            </Typography>
            <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', mt: 0.25 }}>
              open needs
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );

  const HeroSectionEventStats = () => <PlanningHeroStatsPanel />;

  const AttentionItems = () => (
    <>
      <AttentionList
        hasDefinedEventNeeds={eventNeeds.length > 0}
        pendingApplicationsWithNeed={pendingApplicationsWithNeed}
        pendingAppsCount={pendingAppsCount}
        pendingAppsIcon={pendingAppsIcon}
        attentionAppTitle={attentionAppTitle}
        attentionAppSub={attentionAppSub}
        needsAttentionTitle={needsAttentionTitle}
        needsAttentionSub={needsAttentionSub}
        checklistAttention={checklistAttention}
        checklistLifecycleActionLabel={checklistLifecycleActionLabel}
        onChecklistLifecycleAction={handleChecklistLifecycleAction}
        onChecklistSalesAction={() => navigate(`/events/${eventId}/manage/tickets`)}
        onChecklistCoreAction={() => setIsQuickCreateOpen(true)}
      />
      <Dialog
        open={isLifecycleDialogOpen}
        onClose={() => {
          if (isLifecycleSubmitting) return;
          setIsLifecycleDialogOpen(false);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {lifecycleActionCopy?.title || 'Confirm lifecycle update'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            {lifecycleActionCopy?.body || 'Are you sure you want to update this event lifecycle state?'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setIsLifecycleDialogOpen(false)}
            disabled={isLifecycleSubmitting}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={() => void handleConfirmLifecycleAction()}
            disabled={isLifecycleSubmitting || !lifecycleActionCopy}
            sx={{ textTransform: 'none', borderRadius: 999 }}
          >
            {isLifecycleSubmitting ? 'Updating...' : lifecycleActionCopy?.cta || 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  const CheckGrid = () => {
    const categories = useCategories();




    const handleQuickEditSubmit = async (
      action: 'plan' | 'post' | 'tickets-more' | 'needs-more',
      payload: QuickEditEventSubmitPayload,
    ) => {
      setIsQuickCreateSubmitting(true);
      const formData = new FormData();
      formData.set('title', payload.title);
      formData.set(
        'description',
        payload.description.trim() ||
        'Planning is underway. More details are coming soon.',
      );
      formData.set('category_id', String(payload.categoryId));
      formData.set('start_time', payload.startTimeIso);
      formData.set('end_time', payload.endTimeIso);
      formData.set('status', action === 'post' ? 'published' : 'draft');

      if (payload.locationMode === 'online') {
        formData.set('location_name', payload.onlineUrl || 'Online Event');
        formData.set('location_address', 'Online Event');
      } else {
        formData.set('location_name', payload.locationName);
        formData.set('location_address', payload.locationAddress);
        if (payload.latitude) formData.set('latitude', payload.latitude);
        if (payload.longitude) formData.set('longitude', payload.longitude);
      }

      if (payload.capacity) {
        formData.set('capacity', payload.capacity);
      }
      if (payload.ticketPriceStandard !== null) {
        formData.set('ticket_price_standard', payload.ticketPriceStandard);
      }
      if (payload.features.length > 0) {
        formData.set('features', JSON.stringify(payload.features));
      }
      if (payload.coverFile) {
        formData.set('cover_image', payload.coverFile);
      }

      try {
        const result = await updateEvent(eventId, formData);

        setIsQuickCreateOpen(false);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Could not create this event');
        throw error;
      } finally {
        setIsQuickCreateSubmitting(false);
      }
    };

    const WhenWhereExpanded = () => {
      const isOnline = eventDetail.location_address === 'Online Event';
      const whereLabel = isOnline
        ? (eventDetail.location_name?.trim() || 'Online')
        : [eventDetail.location_name, eventDetail.location_address]
            .filter((s) => typeof s === 'string' && s.trim().length > 0)
            .join(' · ') || 'Venue TBD';

      const whenLabel = eventDetail.start_time
        ? eventDetail.end_time
          ? `${formatDateLabel(eventDetail.start_time)} – ${formatDateLabel(eventDetail.end_time)}`
          : formatDateLabel(eventDetail.start_time)
        : 'Date TBD';

      const recapItems = [
        {
          label: 'When',
          value: whenLabel,
          Icon: CalendarDays,
          accent: categoryTheme.tape,
          color: categoryTheme.accent,
          fullWidth: false,
        },
        {
          label: 'Where',
          value: whereLabel,
          Icon: MapPin,
          accent: categoryTheme.tape,
          color: categoryTheme.accent,
          fullWidth: false,
        },
        {
          label: 'Category',
          value: eventDetail.category?.name ?? 'Not set',
          Icon: Tag,
          accent: categoryTheme.accent,
          color: '#fff',
          fullWidth: true,
        },
      ] as const;

      const descriptionClipped =
        eventDetail.description?.trim() ||
        `Happening at ${whereLabel}. Add a description so guests know what to expect.`;

      return (
        <Stack
          spacing={1.25}
          sx={{
            borderLeft: `3px solid ${categoryTheme.accent}`,
            pl: 1.25,
            ml: 0.25,
          }}
        >
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}
          >
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.09em',
                color: '#888780',
                pl: 0.25,
              }}
            >
              When & where
            </Typography>
            <Typography
              onClick={() => setIsQuickCreateOpen(true)}
              sx={{ fontSize: 12, color: '#D85A30', fontWeight: 500, cursor: 'pointer' }}
            >
              + Edit
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: 1,
            }}
          >
            {recapItems.map(({ label, value, Icon, accent, color, fullWidth }) => (
              <Box
                key={label}
                sx={{
                  borderRadius: '20px',
                  px: 1.15,
                  py: 1.05,
                  gridColumn: fullWidth ? { xs: '1', sm: '1 / -1' } : undefined,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      flexShrink: 0,
                      borderRadius: '12px',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: accent,
                      color,
                    }}
                  >
                    <Icon size={16} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'rgba(66, 50, 28, 0.5)',
                        mb: 0.35,
                      }}
                    >
                      {label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 700,
                        lineHeight: 1.5,
                        color: '#2B2118',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {value}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Box>
          <Box sx={{ px: 1.15 }}>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(66, 50, 28, 0.5)',
                mb: 0.5,
              }}
            >
              Description
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                lineHeight: 1.65,
                color: 'rgba(66, 50, 28, 0.72)',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {descriptionClipped}
            </Typography>
          </Box>
        </Stack>
      );
    };

    const GuestListExpanded = () => {
      const guestsComing = goingCount;
      const minThreshold = salesMinRequired;
      const isReady = guestsComing >= minThreshold;
      const moreNeeded = Math.max(minThreshold - guestsComing, 0);

      return (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 220,
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 0.75,
              px: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.09em',
                color: '#888780',
              }}
            >
              Guests coming
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 38,
                fontWeight: 900,
                color: '#1A1A1A',
                lineHeight: 1,
              }}
            >
              {guestsComing}
            </Typography>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 900,
                color: isReady ? '#3B6D11' : '#D85A30',
              }}
            >
              Ready to Go live
            </Typography>
            {!isReady && (
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#5F5E5A' }}>
                Need {moreNeeded} more guest{moreNeeded === 1 ? '' : 's'}
              </Typography>
            )}
          </Box>

          <Box sx={{ pt: 2 }}>
            <Button
              fullWidth
              variant="contained"
              disableElevation
              onClick={() => setIsLiveAttendanceOpen(true)}
              disabled={!isReady}
              sx={{
                textTransform: 'none',
                borderRadius: 999,
                py: 1.2,
                fontWeight: 800,
              }}
            >
              admit guests.
            </Button>
          </Box>
        </Box>
      );
    };

    return (
      <>
        <PlanningCheckGrid
          whenWhereSub={whenWhereSub}
          ticketsTiers={ticketsTiers}
          ticketsSold={ticketsSold}
          totalCapacity={capacityFromTiers}
          minimumParticipants={effectiveMinParticipants}
          openNeedsCount={openNeedsCount}
          needsSub={needsSub}
          salesNotDone={salesNotDone}
          setIsQuickCreateOpen={setIsQuickCreateOpen}
          routeExpandedCard={routeCardKey}
          routeFlashToken={routeFlashToken}
          renderWhenWhereSection={WhenWhereExpanded}
          renderTicketsSection={Tickets}
          renderNeedsSection={AllNeeds}
          renderGuestListSection={GuestListExpanded}
          onGuestListExpandedChange={(expanded) => {
            navigate(expanded ? `/events/${eventId}/manage/admit` : `/events/${eventId}/manage`, { replace: true });
          }}
        />

        <Drawer
          anchor="bottom"
          open={isQuickCreateOpen}
          onClose={() => setIsQuickCreateOpen(false)}
          PaperProps={{
            sx: {
              background: 'transparent',
              boxShadow: 'none',
              height: '100dvh',
              maxHeight: '100dvh',
            },
          }}
        >
          <Box sx={{ height: '100dvh' }}>
            <QuickEditEvent event={eventDetail}
              categories={categories.data?.data ?? []}
              layout="sheet"
              isSubmitting={isQuickCreateSubmitting}
              onSubmit={handleQuickEditSubmit}
              onClose={() => setIsQuickCreateOpen(false)}
            />
          </Box>
        </Drawer>

{/* here - LiveAttendanceStep drawer */}


<Drawer
          anchor="bottom"
          open={isLiveAttendanceOpen}
          onClose={() => setIsLiveAttendanceOpen(false)}
          PaperProps={{
            sx: {
              background: 'transparent',
              boxShadow: 'none',
              height: '100dvh',
              maxHeight: '100dvh',
            },
          }}
        >
          <Box sx={{ height: '100dvh' }}>
            <LiveAttendanceCompactStep
              event={eventDetail}
              readonly={false}
              onClose={() => setIsLiveAttendanceOpen(false)}
            />
          </Box>
        </Drawer>

      </>
    )
  };

  const AllNeeds = () => {
    const [quickEditNeedId, setQuickEditNeedId] = useState<number | null | 'new'>(null);
    const [isSaving, setIsSaving] = useState(false);

    const editingNeed = quickEditNeedId === 'new' 
      ? null 
      : eventNeeds.find(n => n.id === quickEditNeedId) || null;

    const handleSaveNeed = async (payload: QuickEditNeedPayload) => {
      setIsSaving(true);
      try {
        if (quickEditNeedId === 'new') {
          await createEventNeed(eventId, payload);
          toast.success('Need created');
        } else if (quickEditNeedId) {
          await updateEventNeed(quickEditNeedId, payload);
          toast.success('Need updated');
        }
        setQuickEditNeedId(null);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Could not save need');
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <Box>
        <AllNeedsList
          eventNeeds={eventNeeds}
          onEditNeed={(id) => setQuickEditNeedId(id === null ? 'new' : id)}
        />

        <Drawer
          anchor="bottom"
          open={quickEditNeedId !== null}
          onClose={() => setQuickEditNeedId(null)}
          PaperProps={{
            sx: {
              background: 'transparent',
              boxShadow: 'none',
              height: '100dvh',
              maxHeight: '100dvh',
            },
          }}
        >
          <Box sx={{ height: '100dvh' }}>
            <QuickEditNeed
              need={editingNeed}
              onClose={() => setQuickEditNeedId(null)}
              onSave={handleSaveNeed}
              isSubmitting={isSaving}
            />
          </Box>
        </Drawer>
      </Box>
    );
  };


  const Tickets = (
  ) => {
    const [quickCreateTicketOpenId, setQuickCreateTicketOpenId] = useState<number | null>(null);
    const tiers = eventDetail.ticket_tiers ?? [];
    const totalTierCapacity = totalCapacityFromTiers(tiers);
    const soldCount = goingCount;
    const spotsLeft =
      totalTierCapacity != null ? Math.max(totalTierCapacity - soldCount, 0) : null;
    const progressPct =
      totalTierCapacity && totalTierCapacity > 0
        ? Math.min((soldCount / totalTierCapacity) * 100, 100)
        : 0;
    const minReached =
      effectiveMinParticipants > 0 && soldCount >= effectiveMinParticipants;

    const handleSaveTickets = async (tiers: QuickEditTicketTierPayload[]) => {
      try {
        await updateEventTicketTiers(eventId, tiers);
        toast.success('Ticket tiers updated');
        setQuickCreateTicketOpenId(null);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Could not update ticket tiers');
      }
    }

    return (
      <Box>
        <Box sx={{ mb: 1, px: 0.15 }}>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
              color: '#888780',
              mb: 0.65,
            }}
          >
            Ticket status
          </Typography>
          <Box
            sx={{
              height: 6,
              bgcolor: '#ECE9E2',
              borderRadius: 999,
              overflow: 'hidden',
              mb: 0.5,
            }}
          >
            <Box
              sx={{
                height: 6,
                width: `${progressPct}%`,
                borderRadius: 999,
                bgcolor: categoryTheme.accent,
              }}
            />
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 11,
              color: '#5F5E5A',
              mb: effectiveMinParticipants > 0 ? 0.7 : 0,
            }}
          >
            <span>
              {totalTierCapacity != null
                ? `${soldCount} of ${totalTierCapacity} spots filled`
                : `${soldCount} sold · unlimited`}
            </span>
            <span>{spotsLeft != null ? `${spotsLeft} left` : 'open'}</span>
          </Box>
          {effectiveMinParticipants > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                bgcolor: minReached ? '#EAF3DE' : categoryTheme.tape,
                borderRadius: '10px',
                px: 1.05,
                py: 0.55,
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: minReached ? '#3B6D11' : categoryTheme.accent,
                }}
              >
                {minReached ? 'Min. required reached' : 'Min. required'}
              </Typography>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: minReached ? '#3B6D11' : '#5F5E5A',
                }}
              >
                {minReached
                  ? `${effectiveMinParticipants}+ confirmed`
                  : `${effectiveMinParticipants} needed`}
              </Typography>
            </Box>
          )}
        </Box>
        {/* list of tickets nd dtails like how many sold , edit button on each and add button at the top. */}
        <TicketsTiersDetails
          event={eventDetail}
          setEditingTicketId={setQuickCreateTicketOpenId}
        />

        {eventDetail.features && eventDetail.features.length > 0 && (
          <Box sx={{ mx: 2.1, mt: 1.5 }}>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.09em',
                color: '#888780',
                mb: 1.25,
                pl: 0.25,
              }}
            >
              Event Features
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {eventDetail.features.map((feature) => {
                const item = FEATURE_ITEMS.find((fi) => fi.name === feature.name);
                const colors = TAG_COLORS[feature.tag];
                return (
                  <Box
                    key={feature.name}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1.25,
                      py: 0.6,
                      borderRadius: '999px',
                      fontSize: 11,
                      fontWeight: 600,
                      background: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <span>{item?.emoji || '•'}</span>
                    <span>{feature.name}</span>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        <Drawer
          anchor="bottom"
          open={quickCreateTicketOpenId !== null}
          onClose={() => setQuickCreateTicketOpenId(null)}
          PaperProps={{
            sx: {
              background: 'transparent',
              boxShadow: 'none',
              height: '100dvh',
              maxHeight: '100dvh',
            },
          }}
        >
          <Box sx={{ height: '100dvh' }}>
            <QuickEditTicket
              event={eventDetail}
              ticketId={quickCreateTicketOpenId}
              onClose={() => setQuickCreateTicketOpenId(null)}
              onSave={handleSaveTickets as any}
            />
          </Box>
        </Drawer>
      </Box>
    );
  }



  const AddOns = () => {
    const [expandedAddon, setExpandedAddon] = useState<string | null>(null);
    const [localDescriptions, setLocalDescriptions] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});

    // Initialize local descriptions from eventDetail.addons
    useEffect(() => {
      if (eventDetail.addons) {
        const initial = eventDetail.addons.reduce((acc, addon) => {
          acc[addon.addon_slug] = addon.description;
          return acc;
        }, {} as Record<string, string>);
        setLocalDescriptions(prev => ({ ...prev, ...initial }));
      }
    }, [eventDetail.addons]);

    const handleSave = async (e: React.MouseEvent, slug: string) => {
      e.stopPropagation();
      try {
        setIsSaving(prev => ({ ...prev, [slug]: true }));
        await saveEventAddonDescription(eventDetail.id, slug, localDescriptions[slug] || "");
        setExpandedAddon(null);
        toast.success('Add-on description saved');
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to save add-on description");
      } finally {
        setIsSaving(prev => ({ ...prev, [slug]: false }));
      }
    };

    if (!addons || addons.length === 0) return <Box />;

    return (
      <Box sx={{ mx: 1.75, mt: 1.75 }}>
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            color: '#888780',
            mb: 1.25,
            pl: 0.25,
          }}
        >
          Add-ons
        </Typography>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1.25,
        }}>
          {addons.map((addon, idx) => {
            const isExpanded = expandedAddon === addon.slug;
            // Span 2 columns if expanded OR if it's the last odd item in the list
            const gridSpan = isExpanded ? 'span 2' : (addons.length % 2 === 1 && idx === addons.length - 1 ? 'span 2' : undefined);

            return (
              <Box
                key={addon.slug}
                onClick={() => setExpandedAddon(isExpanded ? null : addon.slug)}
                sx={{
                  background: '#fff',
                  borderRadius: '14px',
                  p: 1.75,
                  gridColumn: gridSpan,
                  border: '0.5px solid #F0EDE8',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: 0,
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: '#D85A30',
                  },
                  ...(localDescriptions[addon.slug] && {
                    borderColor: 'rgba(216, 90, 48, 0.4)',
                    backgroundColor: 'rgba(216, 90, 48, 0.02)',
                  })
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
                  
                <Typography
                  sx={{
                    display: 'inline-flex',
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#1A1A1A',
                    mb: 0.35,
                    lineHeight: 1.3,
                  }}
                >
                  <Typography sx={{ fontSize: 24, pr: 1 }}>
                    {addon.icon}</Typography>

                  {addon.title}
                </Typography>
                  {isExpanded && (
                    <Button
                      size="small"
                      onClick={(e) => handleSave(e, addon.slug)}
                      disabled={isSaving[addon.slug]}
                      sx={{
                        minWidth: 0,
                        p: 0.5,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.04)',
                        color: 'rgba(0,0,0,0.6)',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.08)',
                          color: 'black',
                        }
                      }}
                    >
                      <Check size={16} />
                    </Button>
                  )}
                </Box>


                {!isExpanded && (
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: localDescriptions[addon.slug] ? '#D85A30' : '#888780',
                      lineHeight: 1.35,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontStyle: localDescriptions[addon.slug] ? 'italic' : 'normal',
                    }}
                  >
                    {localDescriptions[addon.slug] ? ("\"" + localDescriptions[addon.slug] + "\"") : addon.description}
                  </Typography>
                )}
                {isExpanded && (
                  <Box sx={{ mt: 1 }}>
                    <Typography sx={{ fontSize: 11, color: '#888780', lineHeight: 1.35, mb: 1.5 }}>
                      {addon.description}
                    </Typography>
                    <Box onClick={(e) => e.stopPropagation()}>
                      <textarea
                        value={localDescriptions[addon.slug] || ""}
                        onChange={(e) => setLocalDescriptions(prev => ({
                          ...prev,
                          [addon.slug]: e.target.value
                        }))}
                        placeholder={`Describe the ${addon.title.toLowerCase()} for the guests before check in`}
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1.5px solid #F0EDE8',
                          fontSize: '12px',
                          fontFamily: 'inherit',
                          outline: 'none',
                          resize: 'none',
                          background: '#FDFDFD',
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };
  const Ideas = () => {
    const [selectedIdea, setSelectedIdea] = useState<any>(null);
    return (
      <Box sx={{ mt: 1.75, mx: 1.75 }}>
        <Box
          sx={{
            display: 'flex',
            height: 200,
            gap: 1.0,
            overflowX: 'auto',
            pb: 0.5,
            width: '100%',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >

        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            color: '#888780',
            mb: 1.25,
            pl: 0.25,
          }}
        >
          Ideas to make your event more fun
        </Typography>
          {ideasItems.slice(0, 10).map((idea, idx) => (
            <Box
              key={idea.slug || idx}
              sx={{
                background: TICKET_COLORS[idx % TICKET_COLORS.length].dark,
                borderRadius: '14px',
                width: 'auto',
                maxWidth: selectedIdea?.slug === idea.slug ? 200 : 150,
                height: selectedIdea?.slug === idea.slug ? 200 : 170,
                minWidth: selectedIdea?.slug === idea.slug ? 200 : 150,
                textAlign: 'center',
                border: '0.5px solid ' + TICKET_COLORS[idx % TICKET_COLORS.length].dark,
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                px: 1.5,
              }}
              onClick={() => {
                setSelectedIdea(selectedIdea?.slug === idea.slug ? null : idea);
              }}
            >
              <Typography sx={{ fontSize: 40, mb: 1 }}>{idea.icon}</Typography>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 15,
                  width: '100%',
                  textAlign: 'center',
                  fontWeight: 700,
                  color: '#eeeeee',
                  lineHeight: 1.2,
                }}
              >
                {idea.title}
              </Typography>
              {selectedIdea?.slug === idea.slug && (
                <Typography sx={{ fontSize: 11, color: '#eeeeee', mt: 1, fontStyle: 'italic' }}>
                  &quot;{idea.description}&quot;
                </Typography>
              )}
            </Box>
          ))}
          {ideasItems.length === 0 ? (
            <Typography sx={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              No ideas for this category.
            </Typography>
          ) : null}
        </Box>
      </Box>
    );
  };
  const Checklist = () => {
    return (

      <Box id="section-checklist" sx={{ mx: 2.1, mt: 1.5 }}>
        <HostEventChecklist checklistItems={checklistItems} completedChecklistCount={completedChecklistCount} />
      </Box>
    );
  };
  const Chat = () => {
    const { data: messagesData } = useHostVendorMessages(eventId);
    const messages = messagesData?.data || [];
    const lastMessages = messages.slice(-3).reverse();

    return (
      <Box sx={{ mx: 1.75, mt: 1.75, mb: 2 }}>
        <Box
          onClick={() => setIsChatDrawerOpen(true)}
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 2,
            py: 1.25,
            borderRadius: '14px',
            background: '#fff',
            border: '0.5px solid #F0EDE8',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: '#fdfdfd',
              borderColor: 'rgba(216, 90, 48, 0.2)',
              boxShadow: '0 4px 12px rgba(86, 58, 28, 0.04)',
            },
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '10px',
              background: '#FAECE7',
              color: '#D85A30',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            💬
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', mb: 0.25 }}>
              Organisers Chat
            </Typography>
            {lastMessages.length > 0 ? (
              <Stack spacing={0.25}>
                {lastMessages.map((msg: any, idx: number) => (
                  <Typography
                    key={msg.id || idx}
                    sx={{
                      fontSize: 12,
                      color: '#888780',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.4,
                    }}
                  >
                    <Box component="span" sx={{ fontWeight: 600, color: '#5F5E5A' }}>
                      @{msg.sender_username}:
                    </Box>{' '}
                    {msg.text}
                  </Typography>
                ))}
              </Stack>
            ) : (
              <Typography sx={{ fontSize: 12, color: '#888780' }}>
                No messages yet. Click to start the conversation.
              </Typography>
            )}
          </Box>
          {messages.length > 0 && (
            <Box
              sx={{
                background: '#FAECE7',
                color: '#D85A30',
                fontSize: 10,
                fontWeight: 700,
                px: 1,
                py: 0.4,
                borderRadius: '8px',
                ml: 1,
              }}
            >
              {messages.length}
            </Box>
          )}
        </Box>

        <ChatDrawer
          isOpen={isChatDrawerOpen}
          onClose={() => setIsChatDrawerOpen(false)}
          mode="group"
          eventId={eventId}
          title="Organisers Chat"
          subtitle="Host + vendor team communication"
        />
      </Box>
    );
  };


  return {
    HeroSectionEventStats,
    AttentionItems,
    CheckGrid,
    AllNeeds,
    AddOns,
    Ideas,
    Checklist,
    Chat,
    Tickets,
  };
}