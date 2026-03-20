import { getCategoryTheme } from '@/features/events/CategoricalBackground';
import { BaseFeedEventItem, EventDetail } from '@/types/events';
import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Stack, Drawer, Button } from '@mui/material';


import { useCategories, useEvent, useHostVendorMessages, useMyFriendships, usePrivateMessages } from '@/features/events/hooks';
import { ChatDrawer } from '../components/ChatDrawer';
import { buildPlanningChecklist, formatChecklistDeadline } from '@/features/events/planningChecklist';
import { useEventNeeds } from '@/features/needs/hooks';
import addons from './addons.json';
import ideas from './ideas.json';
import { HostEventChecklist } from './HostEventChecklist';
import { AttentionList } from './components/AttentionList';
import { PlanningCheckGrid } from './components/CheckGrid';
import { AllNeeds as AllNeedsList } from './components/AllNeeds';
import { getCategoryVisuals } from '@/constants/categories';
import { formatDateLabel } from './shared';
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
import { ChevronRight, Trash2, Users, Check } from 'lucide-react';
import { FEATURE_ITEMS, TAG_COLORS } from '@/pages/events/manage/ManageDetailsSection';

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
}: { eventId: number }): PlanningSections {

  const { data: eventResponse, isLoading: isEventLoading } = useEvent(eventId);
  const { data: needsResponse } = useEventNeeds(eventId);

  const event: EventDetail | BaseFeedEventItem | null = eventResponse?.data || null;
  const eventNeeds: EventNeed[] = needsResponse?.data || [];
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

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

  const pendingAppsIcon = firstPendingNeed ? getCategoryVisuals(firstPendingNeed.category).icon : '🎙️';

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

            <Stack direction="row" spacing={1.5} sx={{ mb: 2, alignItems: 'center' }}>
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
                👥 {eventDetail.capacity ? `${eventDetail.capacity} capacity` : '60 capacity'}
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
                  }}
                >
                  {goingCount}
                </Typography>
                <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', mt: 0.25 }}>
                  going
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
                  {collectedMoney ? toCompactINR(collectedMoney) : '₹8.5k'}
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
      </>
    );
  };

  const AttentionItems = () => (
    <AttentionList
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
          onTicketsClick={() => document.getElementById('section-tickets')?.scrollIntoView({ behavior: 'smooth' })}
          onNeedsClick={() => document.getElementById('section-needs')?.scrollIntoView({ behavior: 'smooth' })}
          onChecklistClick={() => document.getElementById('section-checklist')?.scrollIntoView({ behavior: 'smooth' })}
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
      <Box id="section-needs">
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
      <Box id="section-tickets">
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
                  <Typography sx={{ fontSize: 22 }}>{addon.icon}</Typography>
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

                <Typography
                  sx={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#1A1A1A',
                    mb: 0.35,
                    lineHeight: 1.3,
                  }}
                >
                  {addon.title}
                </Typography>

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