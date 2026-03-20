import {
  Box,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { getCategoryLabel, VENDOR_CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/features/auth/hooks';
import { createEvent, updateEvent } from '@/features/events/api';
import { useChatDrawer } from '@/features/events/ChatDrawerContext';
import { useCategories, useEvent, useUpdateTicketTiers } from '@/features/events/hooks';
import type {
  QuickCreateAction,
  QuickCreateSubmitPayload,
} from '@/components/events/QuickCreateSpark';
import {
  buildPlanningChecklist,
  type PlanningChecklistItem as ChecklistItem,
} from '@/features/events/planningChecklist';
import {
  useCreateEventNeed,
  useEventNeeds,
  useReviewNeedApplication,
  useUpdateEventNeed,
} from '@/features/needs/hooks';
import type { EventNeed } from '@/types/needs';
import { compressImage } from '@/utils/image';

import {
  AddNeedOverlay,
  EventDetailsOverlay,
  FeaturesOverlay,
  NeedActionDialog,
  TicketsOverlay,
} from './AddNeedOverlay';
import { EventDetailsTab } from './planning-workspace/EventDetailsTab';
import { EventNeedsTab } from './planning-workspace/EventNeedsTab';
import {
  type EditableFeature,
  type EditableTicketTier,
  eventDetailsFallback,
  formatDateLabel,
  WorkspaceCard,
} from './planning-workspace/shared';
type ManageTab = 'details' | 'needs';

const createWorkspaceSteps = [
  { label: 'Details set' },
  { label: 'Tickets configured' },
  { label: 'Needs being filled' },
  { label: 'Ready to go' },
] as const;

function CreateWorkspaceLanding({
  categories,
  isSubmitting,
  onSubmit,
}: {
  categories: Array<{ id: number; name: string; slug?: string }>;
  isSubmitting: boolean;
  onSubmit: (
    action: QuickCreateAction,
    payload: QuickCreateSubmitPayload,
  ) => Promise<void>;
}) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        maxWidth: '1240px',
        mx: 'auto',

        background: 'var(--color-background-tertiary)',
      }}
    >
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: 2.5,
          background: '#f9f9f9',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
        >
          <Box>
            <Typography sx={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              New planning workspace
            </Typography>
            <Typography
              sx={{ fontFamily: 'Syne, sans-serif', fontSize: 30, fontWeight: 800 }}
            >
              Start with the spark.
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.8} flexWrap="wrap">
            {['Draft', 'Published', 'Live', 'Past'].map((status, index) => (
              <Chip
                key={status}
                label={status}
                sx={{
                  background: index === 0 ? '#FAECE7' : '#F1EFE8',
                  color: index === 0 ? '#712B13' : 'var(--color-text-secondary)',
                  fontWeight: 700,
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2, md: 3 }, py: 2.5 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ mb: 2 }}>
          {createWorkspaceSteps.map((step, index) => (
            <Box
              key={step.label}
              sx={{
                flex: 1,
                px: 1.4,
                py: 1.2,
                borderRadius: '18px',
                border: '0.5px solid var(--color-border-tertiary)',
                background: index === 0 ? '#fffdf9' : '#f9f9f9',
              }}
            >
              <Typography sx={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                Milestone {index + 1}
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700, mt: 0.35 }}>
                {step.label}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              xl: 'minmax(0, 1.2fr) minmax(360px, 0.8fr)',
            },
            gap: 2,
            alignItems: 'start',
          }}
        >

          <Stack spacing={1.5}>
            {[
              {
                title: 'Event Details',
                text: 'Name, description, time, place, category, cover photo, and recurrence all live here once the event exists.',
                accent: '#FAECE7',
              },
              {
                title: 'Tickets',
                text: 'Free, standard, early bird, VIP, contributor. Capacity and thresholds sit alongside live sales progress.',
                accent: '#EEEDFE',
              },
              {
                title: 'Needs Board',
                text: 'That one quick-create help line becomes the bridge into explicit asks, vendor outreach, and role tracking.',
                accent: '#FAEEDA',
              },
              {
                title: 'Co-organiser Space',
                text: 'The floating chat stays one tap away so the workspace can stay clean while the conversation keeps moving.',
                accent: '#EAF3DE',
              },
            ].map((item) => (
              <WorkspaceCard key={item.title} title={item.title}>
                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: '16px',
                    background: item.accent,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {item.text}
                  </Typography>
                </Box>
              </WorkspaceCard>
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

export default function PlanningWorkspacePage() {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openChat } = useChatDrawer();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const eventId = Number(id || 0);
  const isCreateMode = !id;
  const pathSegments = useMemo(
    () => location.pathname.split('/').filter(Boolean),
    [location.pathname],
  );

  const manageSegmentIndex = pathSegments.lastIndexOf('manage');
  const routeTab =
    manageSegmentIndex >= 0 ? pathSegments[manageSegmentIndex + 1] : undefined;
  const activeTab: ManageTab = routeTab === 'needs' ? 'needs' : 'details';
  const [isAddNeedOpen, setIsAddNeedOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [isTicketsOpen, setIsTicketsOpen] = useState(false);
  const [isQuickCreating, setIsQuickCreating] = useState(false);
  const [outsourcedFeatures, setOutsourcedFeatures] = useState<Record<string, boolean>>(
    {},
  );
  const [editingNeed, setEditingNeed] = useState<EventNeed | null>(null);
  const [expandedNeedId, setExpandedNeedId] = useState<number | null>(null);
  const [actionDialog, setActionDialog] = useState<NeedActionDialogState | null>(null);

  type NeedActionDialogState = {
    type: 'assign' | 'invite' | 'override';
    needId: number;
    applicationId?: number;
    nextNeedStatus?: 'override_filled' | 'open';
    title: string;
    description: string;
    confirmLabel: string;
    placeholder: string;
    targetLabel: string;
  };
  const {
    data: eventResponse,
    isLoading: isEventLoading,
    refetch: refetchEvent,
  } = useEvent(eventId);
  const { data: categoryResponse } = useCategories();
  const { data: needsResponse } = useEventNeeds(eventId);

  // Auto-open edit need overlay if editNeedId is provided in URL
  useEffect(() => {
    const editNeedId = searchParams.get('editNeedId');
    if (editNeedId && needsResponse?.data) {
      const need = needsResponse.data.find(
        (n: EventNeed) => n.id === Number(editNeedId),
      );
      if (need) {
        setEditingNeed(need);
        setIsAddNeedOpen(true);
        // Clear the param after opening
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('editNeedId');
        setSearchParams(nextParams, { replace: true });
      }
    }
  }, [searchParams, needsResponse?.data, setSearchParams]);
  const createNeedMutation = useCreateEventNeed();
  const updateTicketTiers = useUpdateTicketTiers();
  const updateNeedMutation = useUpdateEventNeed();
  const reviewNeedApplicationMutation = useReviewNeedApplication();

  const event = eventResponse?.data;
  const eventNeeds = needsResponse?.data || [];
  const categories = (categoryResponse?.data || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
  }));
  const quickCreateNeedSeed = useMemo(() => {
    if (typeof window === 'undefined' || !eventId) return '';
    return window.sessionStorage.getItem(`outgoing.quickCreateNeeds.${eventId}`) || '';
  }, [eventId]);

  useEffect(() => {
    if (!isEventLoading && event && user && user.username !== event.host.username) {
      navigate('/', { replace: true });
    }
  }, [event, isEventLoading, navigate, user]);

  useEffect(() => {
    if (isCreateMode || !id) return;
    if (routeTab === 'details' || routeTab === 'needs') return;
    navigate(`/events/${id}/manage/details`, { replace: true });
  }, [id, isCreateMode, navigate, routeTab]);

  useEffect(() => {
    if (!event?.features) return;
    setOutsourcedFeatures((current) => {
      const next = { ...current };
      (event.features || []).forEach((feature) => {
        if (next[feature.name] === undefined) next[feature.name] = false;
      });
      return next;
    });
  }, [event?.features]);

  const detailRows: Array<{ label: string; value: string }> = event
    ? [
        { label: 'Date & time', value: formatDateLabel(event.start_time) },
        {
          label: 'Location',
          value:
            event.location_address === 'Online Event'
              ? 'Online event'
              : event.location_name || 'Location TBD',
        },
        { label: 'Category', value: event.category?.name || 'Uncategorized' },
        {
          label: 'Format',
          value: `${event.location_address === 'Online Event' ? 'Online' : 'In person'} · One-time`,
        },
      ]
    : [...eventDetailsFallback];

  const editableFeatures: EditableFeature[] = (event?.features || []).map(
    (feature) => ({
      name: feature.name,
      tag: feature.tag || 'additional',
      outsourced: outsourcedFeatures[feature.name] || false,
    }),
  );

  const totalSold = (event?.ticket_tiers || []).reduce(
    (sum: number, tier: any) => sum + (tier.sold_count || 0),
    0,
  );
  const ticketRevenue = (event?.ticket_tiers || []).reduce((sum: number, tier: any) => {
    const sold = tier.sold_count || 0;
    const price = Number(tier.price || 0);
    return sum + sold * price;
  }, 0);
  const realTicketRows: EditableTicketTier[] = (event?.ticket_tiers || []).map(
    (tier: any) => ({
      id: tier.id,
      name: tier.name,
      price: tier.price,
      admits: tier.admits ?? 1,
      max_passes_per_ticket: tier.max_passes_per_ticket ?? 6,
      capacity: tier.capacity === null ? '' : tier.capacity,
      description: tier.description || '',
      refund_percentage: tier.refund_percentage || 100,
    }),
  );
  const checklistItems = useMemo<ChecklistItem[]>(() => {
    if (!event) return [];
    return buildPlanningChecklist(event, eventNeeds, totalSold);
  }, [event, eventNeeds, totalSold]);
  const completedChecklistCount = checklistItems.filter(
    (item) => item.status === 'done',
  ).length;
  const assignedVendors = useMemo(() => {
    const accepted = eventNeeds.flatMap((need) =>
      (need.applications || []).filter(
        (application) => application.status === 'accepted',
      ),
    );
    return accepted.filter(
      (application, index, list) =>
        list.findIndex(
          (entry) =>
            (entry.vendor_id || entry.vendor_name) ===
            (application.vendor_id || application.vendor_name),
        ) === index,
    );
  }, [eventNeeds]);

  const handleSaveDetails = async (payload: {
    title: string;
    categoryId: string;
    description: string;
    coverFile: File | null;
    startTime: string;
    durationHours: string;
    locationMode: 'offline' | 'online';
    locationName: string;
    locationAddress: string;
    onlineUrl: string;
    latitude: string;
    longitude: string;
  }) => {
    if (!event) return;
    const formData = new FormData();
    formData.set('title', payload.title);
    formData.set('description', payload.description);
    formData.set('category_id', payload.categoryId);

    const startDate = new Date(payload.startTime);
    const durationMs = Math.max(1, Number(payload.durationHours) || 2) * 60 * 60 * 1000;
    const endDate = new Date(startDate.getTime() + durationMs);
    formData.set('start_time', startDate.toISOString());
    formData.set('end_time', endDate.toISOString());

    if (payload.locationMode === 'online') {
      formData.set('location_name', payload.onlineUrl);
      formData.set('location_address', 'Online Event');
    } else {
      formData.set('location_name', payload.locationName);
      formData.set('location_address', payload.locationAddress);
      if (payload.latitude) formData.set('latitude', payload.latitude);
      if (payload.longitude) formData.set('longitude', payload.longitude);
    }

    if (payload.coverFile) {
      try {
        const compressed = await compressImage(payload.coverFile, {
          newFileName: 'event_cover',
        });
        formData.set('cover_image', compressed);
      } catch {
        formData.set('cover_image', payload.coverFile);
      }
    }

    await updateEvent(event.id, formData);
    await queryClient.invalidateQueries({ queryKey: ['event', event.id] });
    await queryClient.invalidateQueries({ queryKey: ['feed'] });
    toast.success('Event details updated');
  };

  const handleSaveFeatures = async (features: EditableFeature[]) => {
    if (!event) return;
    const formData = new FormData();
    formData.set(
      'features',
      JSON.stringify(
        features.map((feature) => ({
          name: feature.name,
          tag: 'additional',
        })),
      ),
    );
    await updateEvent(event.id, formData);
    await queryClient.invalidateQueries({ queryKey: ['event', event.id] });
    toast.success('Features updated');
  };

  const handleSaveTickets = async (payload: {
    capacity: string;
    tiers: EditableTicketTier[];
  }) => {
    if (!event) return;
    const totalCapacityVal = payload.capacity ? parseInt(payload.capacity, 10) : null;
    if (totalCapacityVal !== null) {
      const sumManualCapacities = payload.tiers
        .slice(0, -1)
        .reduce((sum, tier) => sum + (Number(tier.capacity) || 0), 0);
      if (sumManualCapacities > totalCapacityVal) {
        toast.error('Ticket tier capacities exceed total event capacity.');
        return;
      }
    }

    if (payload.capacity) {
      const eventForm = new FormData();
      eventForm.set('capacity', payload.capacity);
      await updateEvent(event.id, eventForm);
    }

    const tiersToSave = payload.tiers.map((tier, index) => {
      const isLastTier = index === payload.tiers.length - 1;
      let calculatedCapacity =
        tier.capacity === '' || tier.capacity === null ? null : Number(tier.capacity);
      if (isLastTier && totalCapacityVal !== null && calculatedCapacity === null) {
        const sumOthers = payload.tiers
          .slice(0, -1)
          .reduce((sum, item) => sum + (Number(item.capacity) || 0), 0);
        calculatedCapacity = Math.max(0, totalCapacityVal - sumOthers);
      }
      const mapped: any = {
        name: tier.name,
        price: Number(tier.price || 0).toFixed(2),
        capacity: calculatedCapacity,
        is_refundable: true,
        refund_percentage: tier.refund_percentage || 100,
        description: tier.description || '',
        admits: Number(tier.admits || 1),
        max_passes_per_ticket: Number(tier.max_passes_per_ticket || 6),
      };
      if (tier.id) mapped.id = tier.id;
      return mapped;
    });

    await updateTicketTiers.mutateAsync({
      eventId: event.id,
      tiers: tiersToSave,
      updateSeries: false,
    } as any);
    await refetchEvent();
    toast.success('Tickets updated');
  };

  const handleSaveNeed = async (payload: {
    title: string;
    description: string;
    category: string;
    budgetMin: string;
    budgetMax: string;
    updateSeries: boolean;
  }) => {
    if (!event) return;

    try {
      if (editingNeed) {
        await updateNeedMutation.mutateAsync({
          needId: editingNeed.id,
          payload: {
            title: payload.title,
            description: payload.description,
            category: payload.category,
            budget_min: payload.budgetMin || null,
            budget_max: payload.budgetMax || null,
          },
        });
        toast.success('Need updated');
      } else {
        await createNeedMutation.mutateAsync({
          eventId: event.id,
          payload: {
            title: payload.title,
            description: payload.description,
            category: payload.category,
            criticality: 'replaceable',
            budget_min: payload.budgetMin || null,
            budget_max: payload.budgetMax || null,
            update_series: payload.updateSeries,
          },
        });
        toast.success('Need created');
      }

      setIsAddNeedOpen(false);
      setEditingNeed(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not save this need');
    }
  };

  const handleCreateFromWorkspace = async (
    action: QuickCreateAction,
    payload: QuickCreateSubmitPayload,
  ) => {
    setIsQuickCreating(true);
    try {
      const formData = new FormData();
      formData.set('title', payload.title);
      formData.set('description', payload.description);
      formData.set('category_id', String(payload.categoryId));
      formData.set('location_name', payload.locationName);
      formData.set('location_address', payload.locationAddress);
      formData.set('start_time', payload.startTimeIso);
      formData.set('end_time', payload.endTimeIso);
      formData.set('status', action === 'post' ? 'published' : 'draft');
      if (payload.capacity) {
        formData.set('capacity', payload.capacity);
      }
      if (payload.ticketPriceStandard) {
        formData.set('ticket_price_standard', payload.ticketPriceStandard);
      }
      if (payload.features.length > 0) {
        formData.set('features', JSON.stringify(payload.features));
      }
      if (payload.coverFile) {
        formData.set('cover_image', payload.coverFile);
      }

      const result = await createEvent(formData);
      const totalCapacityVal = payload.capacity ? parseInt(payload.capacity, 10) : null;
      const tiersToSave = payload.ticketTiers.map((tier, index) => {
        const isLastTier = index === payload.ticketTiers.length - 1;
        let calculatedCapacity =
          tier.capacity === '' || tier.capacity === null ? null : Number(tier.capacity);

        if (isLastTier && totalCapacityVal !== null) {
          const sumOthers = payload.ticketTiers
            .slice(0, -1)
            .reduce((sum, item) => sum + (Number(item.capacity) || 0), 0);
          calculatedCapacity = Math.max(0, totalCapacityVal - sumOthers);
        }

        return {
          name: tier.name || 'General Admission',
          price: Number(tier.price || 0).toFixed(2),
          capacity: calculatedCapacity,
          is_refundable: true,
          description: tier.description || '',
          admits: Number(tier.admits || 1),
          max_passes_per_ticket: Number(tier.max_passes_per_ticket || 6),
        };
      });

      if (tiersToSave.length > 0) {
        await updateTicketTiers.mutateAsync({
          eventId: result.data.id,
          tiers: tiersToSave,
          updateSeries: false,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      await queryClient.invalidateQueries({ queryKey: ['feed'] });

      if (payload.needsSeed) {
        window.sessionStorage.setItem(
          `outgoing.quickCreateNeeds.${result.data.id}`,
          payload.needsSeed,
        );
      }

      if (action === 'plan') {
        toast.success('Draft created. Keep building it.');
        navigate(`/events/${result.data.id}/manage`);
      } else {
        toast.success('Event posted');
        navigate(`/events-new/${result.data.id}`);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not create this event');
      throw error;
    } finally {
      setIsQuickCreating(false);
    }
  };

  const handleConfirmNeedAction = async (_message: string) => {
    if (!actionDialog) return;
    try {
      if (actionDialog.type === 'override') {
        await updateNeedMutation.mutateAsync({
          needId: actionDialog.needId,
          payload: { status: actionDialog.nextNeedStatus || 'override_filled' },
        });
        toast.success(
          actionDialog.nextNeedStatus === 'open'
            ? 'Host override removed'
            : 'Host override saved',
        );
      } else if (actionDialog.type === 'assign' && actionDialog.applicationId) {
        await reviewNeedApplicationMutation.mutateAsync({
          applicationId: actionDialog.applicationId,
          status: 'accepted',
        });
        toast.success('Need assigned');
      } else {
        toast.success('Invite flow stays UI-only for now');
      }
      setActionDialog(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not update this need');
    }
  };

  if (isCreateMode) {
    return (
      <CreateWorkspaceLanding
        categories={categories}
        isSubmitting={isQuickCreating}
        onSubmit={handleCreateFromWorkspace}
      />
    );
  }

  if (isEventLoading || !event) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress sx={{ color: '#D85A30' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'var(--color-background-tertiary)' }}>
      <Box
        sx={{
          background: '#f9f9f9',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          px: { xs: 2, md: 3 },
          py: 1,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, nextTab: ManageTab) =>
            navigate(`/events/${eventId}/manage/${nextTab}`)
          }
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#D85A30',
              height: 3,
              borderRadius: '8px 8px 0 0',
            },
          }}
        >
          <Tab
            value="details"
            label="Event details"
            sx={{
              minHeight: 44,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 14,
            }}
          />
          <Tab
            value="needs"
            label="Needs"
            sx={{
              minHeight: 44,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 14,
            }}
          />
        </Tabs>
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 3 }, py: 3 }}>
        {activeTab === 'details' ? (
          <EventDetailsTab
            checklistItems={checklistItems}
            completedChecklistCount={completedChecklistCount}
            detailRows={detailRows}
            editableFeatures={editableFeatures}
            event={event}
            realTicketRows={realTicketRows}
            ticketRevenue={ticketRevenue}
            totalSold={totalSold}
            onOpenDetails={() => setIsDetailsOpen(true)}
            onOpenFeatures={() => setIsFeaturesOpen(true)}
            onOpenTickets={() => setIsTicketsOpen(true)}
          />
        ) : (
          <EventNeedsTab
            assignedVendors={assignedVendors}
            eventNeeds={eventNeeds}
            expandedNeedId={expandedNeedId}
            quickCreateNeedSeed={quickCreateNeedSeed}
            onAddNeed={() => {
              setEditingNeed(null);
              setIsAddNeedOpen(true);
            }}
            onEditNeed={(need) => {
              setEditingNeed(need);
              setIsAddNeedOpen(true);
            }}
            onOpenChat={() =>
              openChat({
                title: event?.title || 'Event group chat',
                subtitle: 'Host + vendor group chat',
                badgeLabel: 'Group',
                mode: 'group',
                eventId,
              })
            }
            onToggleNeed={(needId) =>
              setExpandedNeedId((current) => (current === needId ? null : needId))
            }
            onReviewApplication={async (applicationId, status) => {
              await reviewNeedApplicationMutation.mutateAsync({
                applicationId,
                status,
              });
              toast.success(
                status === 'accepted' ? 'Application accepted' : 'Application rejected',
              );
            }}
          />
        )}
      </Container>

      {isDetailsOpen ? (
        <EventDetailsOverlay
          event={event}
          categories={categories}
          onClose={() => setIsDetailsOpen(false)}
          onSave={handleSaveDetails}
        />
      ) : null}
      {isFeaturesOpen ? (
        <FeaturesOverlay
          initialFeatures={editableFeatures as any}
          onClose={() => setIsFeaturesOpen(false)}
          onSave={handleSaveFeatures as any}
        />
      ) : null}
      {isTicketsOpen ? (
        <TicketsOverlay
          initialCapacity={event.capacity ? String(event.capacity) : ''}
          initialTiers={realTicketRows as any}
          onClose={() => setIsTicketsOpen(false)}
          onSave={handleSaveTickets as any}
        />
      ) : null}
      {isAddNeedOpen ? (
        <AddNeedOverlay
          eventTitle={event.title}
          eventDateLabel={formatDateLabel(event.start_time)}
          initialBudgetHint={
            event.ticket_price_standard || event.ticket_tiers?.[0]?.price || null
          }
          initialNeed={editingNeed}
          canApplyToSeries={Boolean(event.series?.id)}
          isSaving={createNeedMutation.isPending || updateNeedMutation.isPending}
          onSave={handleSaveNeed}
          onClose={() => {
            setIsAddNeedOpen(false);
            setEditingNeed(null);
          }}
        />
      ) : null}
      {actionDialog ? (
        <NeedActionDialog
          state={actionDialog}
          onClose={() => setActionDialog(null)}
          onConfirm={handleConfirmNeedAction}
        />
      ) : null}
    </Box>
  );
}
