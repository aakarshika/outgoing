import { getCategoryTheme } from '@/features/events/CategoricalBackground';
import { BaseFeedEventItem, EventDetail } from '@/types/events';
import { Box, Typography, Stack, Drawer } from '@mui/material';
import { useState } from 'react';


import { useCategories, useEvent } from '@/features/events/hooks';
import { buildPlanningChecklist, formatChecklistDeadline } from '@/features/events/planningChecklist';
import { useEventNeeds } from '@/features/needs/hooks';
import addons from './addons.json';
import ideas from './ideas.json';
import { HostEventChecklist } from './HostEventChecklist';
import { AttendingList } from './components/AttendingList';
import { PlanningCheckGrid } from './components/CheckGrid';
import { AllNeeds as AllNeedsList } from './components/AllNeeds';
import { getNeedVisuals, formatDateLabel } from './shared';
import type { PlanningChecklistItem } from '@/features/events/planningChecklist';
import { EventNeed } from '@/types/needs';
import { TICKET_COLORS } from '@/features/events/constants';
import { QuickEditEvent, QuickEditEventSubmitPayload } from '@/components/events/QuickEditEvent';
import { updateEvent } from '@/features/events/api';
import { toast } from 'sonner';

type PlanningSections = {
  HeroSectionEventStats: () => JSX.Element;
  AttentionItems: () => JSX.Element;
  CheckGrid: () => JSX.Element;
  AllNeeds: () => JSX.Element;
  AddOns: () => JSX.Element;
  Ideas: () => JSX.Element;
  Checklist: () => JSX.Element;
  Chat: () => JSX.Element;
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
  }: { eventId: number }): PlanningSections {

    const { data: eventResponse, isLoading: isEventLoading } = useEvent(eventId);
    const { data: needsResponse } = useEventNeeds(eventId);
  
    const event: EventDetail | BaseFeedEventItem | null = eventResponse?.data || null;
    const eventNeeds: EventNeed[] = needsResponse?.data || [];
  
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
    const collectedMoney = (() => {
      const tiers = eventDetail.ticket_tiers ?? [];
      const total = tiers.reduce((sum, t) => {
        const price = parseMoney(t.price);
        if (price === null) return sum;
        return sum + price * (t.sold_count ?? 0);
      }, 0);
      return total > 0 ? total : null;
    })();
  
    const isNeedRelatedChecklistItem = (item: PlanningChecklistItem) => {
      const label = item.label.toLowerCase();
      return (
        label === 'no external needs defined' ||
        /\bslot\b/.test(label) ||
        label.includes('still needed') ||
        label.includes('covered by host')
      );
    };

    const isLifecycleChecklistItem = (item: PlanningChecklistItem) =>
      item.variant === 'go_live' || item.variant === 'live_event';

    const checklistAttention3 = (() => {
      const needsAreNotMet = openNeedsCount > 0;
      return checklistItems
        .filter((item) => !isNeedRelatedChecklistItem(item))
        .filter((item) => (needsAreNotMet ? !isLifecycleChecklistItem(item) : true))
        .find((item) => item.status !== 'done') || null;
    })();

    const attention3Title = checklistAttention3?.label ?? '';
    const attention3Sub = checklistAttention3?.due ?? '';
  
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

    const pendingAppsIcon = firstPendingNeed ? getNeedVisuals(firstPendingNeed).icon : '🎙️';

    const pendingTitles = pendingNeeds.map((n) => n.title);

    const attention2Title =
      pendingTitles.length === 0
        ? 'contributors'
        : pendingTitles.length === 1
          ? pendingTitles[0]
          : pendingTitles.length === 2
            ? `${pendingTitles[0]} and ${pendingTitles[1]}  still open`
            : `${pendingTitles[0]}, ${pendingTitles[1]}, and ${pendingTitles.length - 2} others still open`;

  
    const attention2Sub = pendingNeeds.some((n) => n.application_count > 0)
      ? 'Some cover letters are waiting.'
      : 'No one has applied yet';
  
    const whenWhereSub = `${eventDetail.start_time ? formatDateLabel(eventDetail.start_time) : 'Date TBD'} · ${eventDetail.location_name || 'Location'}`;
  
    const ticketsTiers = eventDetail.ticket_tiers?.length ?? 0;
    const ticketsSold = goingCount;
  
    const needsSub = openNeedsCount
      ? `${pendingNeeds[0]?.title ? `${pendingNeeds[0].title} pending` : 'Needs pending'} · ${openNeedsCount} still open`
      : 'All needs handled';
  
    const salesNotDone = checklistItems.some((i) => i.status !== 'done');
  
    const addonItems = (addons as Array<any>).slice(0, 5);
    const ideasItems = (ideas as Array<any>).filter((i) => {
      const slug = event.category?.slug;
      return slug ? i.category === slug : true;
    });
  
  
const HeroSectionEventStats = () => {



    return (
      <>
      <Box
        sx={{
          mx: 2.1,
          mt: 1.4,
          mb: 1.5,
          borderRadius: '18px',
          background: `linear-gradient(135deg, ${categoryTheme.accent} 0%, ${categoryTheme.tape} 100%)`,
          px: 2.4,
          py: 1.7,
          color: '#fff',
        }}
      >
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.65)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            mb: 0.85,
          }}
        >
          {(event.category?.name || 'Event').toString()} · {eventDetail.location_name || 'Location'} ·{' '}
          {(daysUntilEvent ?? '—').toString()} days away
        </Typography>

        <Typography sx={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, lineHeight: 1.15, mb: 1 }}>
          {event.title}
        </Typography>

        <Stack direction="row" spacing={1.2} sx={{ mb: 1.4, alignItems: 'center' }}>
          <Typography
            sx={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.75)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.6,
            }}
          >
            📅 {eventDetail.start_time ? formatDateLabel(eventDetail.start_time) : 'Sat, Apr 5 · 8pm'}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.75)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.6,
            }}
          >
            👤 {eventDetail.capacity ? `${eventDetail.capacity} capacity` : '60 capacity'}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.2}>
          <Box sx={{ flex: 1, background: 'rgba(0,0,0,0.15)', borderRadius: 1.25, py: 1.05, textAlign: 'center' }}>
            <Typography sx={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800 }}>{goingCount}</Typography>
            <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', mt: 0.2 }}>going</Typography>
          </Box>
          <Box sx={{ flex: 1, background: 'rgba(0,0,0,0.15)', borderRadius: 1.25, py: 1.05, textAlign: 'center' }}>
            <Typography sx={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800 }}>
              {collectedMoney ? toCompactINR(collectedMoney) : '₹8.5k'}
            </Typography>
            <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', mt: 0.2 }}>collected</Typography>
          </Box>
          <Box sx={{ flex: 1, background: 'rgba(0,0,0,0.15)', borderRadius: 1.25, py: 1.05, textAlign: 'center' }}>
            <Typography sx={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800 }}>{openNeedsCount}</Typography>
            <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', mt: 0.2 }}>open needs</Typography>
          </Box>
        </Stack>
      </Box>

            </>

    );
  };

  const AttentionItems = () => (
    <AttendingList
      pendingApplicationsWithNeed={pendingApplicationsWithNeed}
      pendingAppsCount={pendingAppsCount}
      pendingAppsIcon={pendingAppsIcon}
      attentionAppTitle={attentionAppTitle}
      attentionAppSub={attentionAppSub}
      attention2Title={attention2Title}
      attention2Sub={attention2Sub}
      showChecklistAttention3={!!checklistAttention3}
      attention3Title={attention3Title}
      attention3Sub={attention3Sub}
    />
  );

  const CheckGrid = () => {


    const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
    const [isQuickCreateSubmitting, setIsQuickCreateSubmitting] = useState(false);
    const categories = useCategories();

  const handleQuickEditSubmit = async (
    action: 'plan' | 'post',
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
    return (
      <>
    <PlanningCheckGrid
      whenWhereSub={whenWhereSub}
      ticketsTiers={ticketsTiers}
      ticketsSold={ticketsSold}
      ticketsBadge={collectedMoney ? `${toCompactINR(collectedMoney)} in` : 'Ready'}
      openNeedsCount={openNeedsCount}
      needsSub={needsSub}
      salesNotDone={salesNotDone}
      setIsQuickCreateOpen={setIsQuickCreateOpen}
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
        </>
  )};

  const AllNeeds = () => <AllNeedsList eventNeeds={eventNeeds} />;
  const AddOns = () => {
    return (
      
      <Box sx={{ mx: 2.1, mt: 1.5 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
            {addonItems.map((addon, idx) => {
              const isFull = addonItems.length % 2 === 1 && idx === addonItems.length - 1;
              return (
                <Box
                  key={addon.slug || idx}
                  sx={{
                    background: '#fff',
                    borderRadius: '14px',
                    p: 2,
                    gridColumn: isFull ? 'span 2' : undefined,
                    border: '0.5px solid #F0EDE8',
                  }}
                >
                  <Typography sx={{ fontSize: 20, mb: 0.7 }}>{addon.icon}</Typography>
                  <Typography sx={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#1A1A1A', mb: 0.3 }}>
                    {addon.title}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: '#888780', lineHeight: 1.4 }}>
                    {addon.description}
                  </Typography>
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
      
      <Box sx={{ mx: 2.1, mt: 1.5 }}>
       <Box sx={{ display: 'flex',
                  height: 200,
                  gap: 1.0,
                  overflowX: 'auto',
                  pb: 0.5,
                  width: '100%',
                }}>
                <Typography sx={{ fontSize: 12, color: '#888780', mb: 1 }}>
                  Ideas to make your event more fun and memorable
                </Typography>
            {ideasItems.slice(0, 6).map((idea, idx) => (
              <Box
                key={idea.slug || idx}
                sx={{
                  
                  background: TICKET_COLORS[idx % TICKET_COLORS.length].dark,
                  borderRadius: '12px',
                    width: 'auto',
                    maxWidth: selectedIdea?.slug === idea.slug ? 200 : 150,
                    height: selectedIdea?.slug === idea.slug ? 200 : 170,
                    minWidth: selectedIdea?.slug === idea.slug ? 200 : 150,
                  textAlign: 'center',
                  border: '0.5px solid '+TICKET_COLORS[idx % TICKET_COLORS.length].dark,
                }}
                onClick={() => {
                  setSelectedIdea(idea);
                }}
              >
                <Typography sx={{ pt:1, fontSize: 40 }}>{idea.icon}</Typography>
                <Typography sx={{ px:2, fontFamily: 'Syne, sans-serif', fontSize: 15, width: '100%', textAlign: 'center', fontWeight: 700, color: '#eeeeee' }}>
                  {idea.title}
                </Typography>
                {(() => {
                  if (selectedIdea?.slug === idea.slug) {
                    return (
                      <Typography sx={{ fontSize: 11, color: '#eeeeee' }}>
                        &quot;{idea.description}&quot;
                      </Typography>
                    );
                  }
                })()}
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
      
      <Box sx={{ mx: 2.1, mt: 1.5 }}>
      <HostEventChecklist checklistItems={checklistItems} completedChecklistCount={completedChecklistCount} />
    </Box>
    );
  };
  const Chat = () => {
    return (
      
      <Box sx={{ mx: 2.1, mt: 1.5, mb: 2 }}>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.6,
            borderRadius: '14px',
            background: '#fff',
            border: '0.5px solid #F0EDE8',
          }}
        >
          <Box sx={{ width: 32, height: 32, borderRadius: '50%', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
            💬
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>
              Co-organiser chat · Priya
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#888780' }}>
              "Should we add a signature cocktail?"
            </Typography>
          </Box>
          <Box sx={{ background: '#D85A30', color: '#fff', fontSize: 10, fontWeight: 500, px: 1, py: 0.4, borderRadius: '999px' }}>
            2
          </Box>
        </Box>
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
  };
}