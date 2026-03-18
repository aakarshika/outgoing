import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  LinearProgress,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { Check, MessageCircle } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  type QuickCreateAction,
  QuickCreateSpark,
  type QuickCreateSubmitPayload,
} from '@/components/events/QuickCreateSpark';
import { getCategoryLabel, VENDOR_CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/features/auth/hooks';
import { createEvent, updateEvent } from '@/features/events/api';
import { useChatDrawer } from '@/features/events/ChatDrawerContext';
import { useCategories, useEvent, useUpdateTicketTiers } from '@/features/events/hooks';
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

import { type EventFeature, FEATURE_ITEMS } from './manage/ManageDetailsSection';
import { AddNeedOverlay, EventDetailsOverlay, FeaturesOverlay, formatMoney, NeedActionDialog, ReviewApplicantsOverlay, TicketsOverlay } from './AddNeedOverlay';

export function getNeedVisuals(need: EventNeed) {
  const source = `${need.category} ${need.title}`.toLowerCase();
  if (source.includes('photo')) {
    return {
      icon: '📷',
      iconBg: '#E6F1FB',
      accent: '#378ADD',
    };
  }
  if (source.includes('music') || source.includes('dj')) {
    return {
      icon: '🎧',
      iconBg: '#EAF3DE',
      accent: '#1D9E75',
    };
  }
  if (
    source.includes('speaker') ||
    source.includes('audio') ||
    source.includes('sound')
  ) {
    return {
      icon: '🔊',
      iconBg: '#FAEEDA',
      accent: '#EF9F27',
    };
  }
  return {
    icon: '🧩',
    iconBg: '#F1EFE8',
    accent: '#534AB7',
  };
}
type ManageTab = 'details' | 'needs';


const lifecycleTheme = {
  draft: { label: 'Draft', background: '#FAEEDA', color: '#854F0B', step: 0 },
  published: { label: 'Published', background: '#E6F1FB', color: '#185FA5', step: 1 },
  event_ready: { label: 'Ready', background: '#EAF3DE', color: '#3B6D11', step: 2 },
  live: { label: 'Live', background: '#EAF3DE', color: '#3B6D11', step: 3 },
  completed: { label: 'Completed', background: '#EEEDFE', color: '#26215C', step: 4 },
  cancelled: { label: 'Cancelled', background: '#FCEBEB', color: '#A32D2D', step: 0 },
  postponed: { label: 'Postponed', background: '#FCEBEB', color: '#A32D2D', step: 0 },
  at_risk: { label: 'At Risk', background: '#FCEBEB', color: '#A32D2D', step: 1 },
} as const;

const createWorkspaceSteps = [
  { label: 'Details set' },
  { label: 'Tickets configured' },
  { label: 'Needs being filled' },
  { label: 'Ready to go' },
] as const;

const eventDetails = [
  { label: 'Date & time', value: 'Sat 15 Mar · 8:00 PM' },
  { label: 'Location', value: 'Indiranagar Social, Bengaluru' },
  { label: 'Category', value: 'Music' },
  { label: 'Format', value: 'In person · One-time' },
] as const;

const ticketRows = [
  {
    name: 'Early Bird',
    price: '₹250',
    sold: '20 / 20 sold',
    progress: 100,
    color: '#D85A30',
  },
  {
    name: 'Standard',
    price: '₹350',
    sold: '14 / 20 sold',
    progress: 70,
    color: '#D85A30',
  },
  {
    name: 'Contributor',
    price: 'Free',
    sold: '0 / 5 filled',
    progress: 0,
    color: '#1D9E75',
  },
] as const;

type EditableTicketTier = {
  id?: number | string;
  name: string;
  price: number | string;
  admits: number | string;
  max_passes_per_ticket: number | string;
  capacity: number | '' | null;
  description: string;
  refund_percentage?: number;
};

type EditableFeature = EventFeature & {
  outsourced?: boolean;
};
function formatDateLabel(dateString?: string | null) {
  if (!dateString) return 'Date TBD';
  const date = new Date(dateString);
  return `${date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })} · ${date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}


function WorkspaceCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        mt: 1.5,
        background: '#f9f9f9',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: '24px',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2.5,
          py: 1.75,
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}
      >
        {typeof action === 'string' ? (
          <Typography sx={{ fontSize: 12, color: '#D85A30', fontWeight: 600 }}>
            {action}
          </Typography>
        ) : (
          action || null
        )}
      </Stack>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Box>
  );
}
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
          <QuickCreateSpark
            categories={categories}
            layout="page"
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />

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

export function getNeedPresentation(need: EventNeed) {
  const acceptedApplication = need.applications.find(
    (application) => application.status === 'accepted',
  );
  if (need.status === 'filled') {
    return {
      statusLabel: 'Filled',
      statusBg: '#EAF3DE',
      statusColor: '#3B6D11',
      subtitle: acceptedApplication
        ? `${acceptedApplication.vendor_name} · confirmed`
        : 'Filled by vendor',
    };
  }
  if (need.status === 'override_filled') {
    return {
      statusLabel: 'Host override',
      statusBg: '#EEEDFE',
      statusColor: '#26215C',
      subtitle: 'Host will cover this need',
    };
  }
  if (need.application_count > 0) {
    return {
      statusLabel: `${need.application_count} pending`,
      statusBg: '#E6F1FB',
      statusColor: '#185FA5',
      subtitle: `${need.application_count} cover letters waiting`,
    };
  }
  return {
    statusLabel: 'Open',
    statusBg: '#FAEEDA',
    statusColor: '#854F0B',
    subtitle: 'No applicants yet',
  };
}

export default function PlanningWorkspacePage() {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { openChat } = useChatDrawer();
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
  const [isBrowseVendorsOpen, setIsBrowseVendorsOpen] = useState(false);
  const [isQuickCreating, setIsQuickCreating] = useState(false);
  const [outsourcedFeatures, setOutsourcedFeatures] = useState<Record<string, boolean>>(
    {},
  );
  const [editingNeed, setEditingNeed] = useState<EventNeed | null>(null);
  const [reviewingNeedId, setReviewingNeedId] = useState<number | null>(null);
  const [expandedNeedId, setExpandedNeedId] = useState<number | null>(null);
  const [actionDialog, setActionDialog] = useState<NeedActionDialogState | null>(null);

  const NeedsTab = () => {
    return (

      <Stack spacing={2.25}>
        {assignedVendors.length > 0 ? (
          <WorkspaceCard
            title="Co-organizers chat"
            action={
              <Button
                variant="contained"
                size="small"
                startIcon={<MessageCircle size={14} />}
                onClick={() =>
                  openChat({
                    title: 'HostVendorGroupChat',
                    mode: 'group',
                    eventId,
                  })
                }
                sx={{
                  borderRadius: '999px',
                  textTransform: 'none',
                  background: '#D85A30',
                  boxShadow: 'none',
                }}
              >
                Open chat
              </Button>
            }
          >
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {assignedVendors.map((application) => (
                <Chip
                  key={application.id}
                  avatar={
                    <Avatar>
                      {(application.vendor_name || '?').slice(0, 1).toUpperCase()}
                    </Avatar>
                  }
                  label={application.vendor_name}
                  sx={{ background: '#F1EFE8' }}
                />
              ))}
            </Stack>
          </WorkspaceCard>
        ) : null}

        <WorkspaceCard
          title="Needs board"
          action={
            <Button
              variant="text"
              onClick={() => {
                setEditingNeed(null);
                setIsAddNeedOpen(true);
              }}
              sx={{ textTransform: 'none', color: '#D85A30', fontWeight: 600 }}
            >
              + Add need
            </Button>
          }
        >
          <Stack spacing={1.2}>
            {eventNeeds.length === 0 ? (
              <Box
                sx={{
                  border: '0.5px dashed var(--color-border-secondary)',
                  borderRadius: '18px',
                  p: 2,
                  background: '#fffdfb',
                }}
              >
                <Typography
                  sx={{ fontSize: 13, color: 'var(--color-text-secondary)' }}
                >
                  No needs have been added yet.
                </Typography>
                {quickCreateNeedSeed ? (
                  <Typography sx={{ mt: 1, fontSize: 12, color: '#5A3909' }}>
                    Quick create seed: "{quickCreateNeedSeed}"
                  </Typography>
                ) : null}
              </Box>
            ) : null}

            {eventNeeds.map((need) => {
              const presentation = getNeedPresentation(need);
              const visuals = getNeedVisuals(need);
              const isExpanded = expandedNeedId === need.id;
              const acceptedApplications = (need.applications || []).filter(
                (application) => application.status === 'accepted',
              );
              return (
                <Box
                  key={need.id}
                  sx={{
                    border: '0.5px solid var(--color-border-tertiary)',
                    borderLeft: `3px solid ${visuals.accent}`,
                    borderRadius: '18px',
                    background: '#fffdfb',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    onClick={() =>
                      setExpandedNeedId((current) =>
                        current === need.id ? null : need.id,
                      )
                    }
                    sx={{
                      p: 1.5,
                      cursor: 'pointer',
                    }}
                  >
                    <Stack spacing={1.1}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        justifyContent="space-between"
                      >
                        <Stack direction="row" spacing={1.1} alignItems="center">
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: '11px',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: 15,
                              background: visuals.iconBg,
                              flexShrink: 0,
                            }}
                          >
                            {visuals.icon}
                          </Box>
                          <Box>
                            <Typography
                              sx={{
                                fontSize: 11,
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              {need.category}
                            </Typography>
                            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                              {need.title}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <Chip
                            label={`${need.application_count || 0} applications`}
                            sx={{ height: 24, fontSize: 11, background: '#F1EFE8' }}
                          />
                          <Chip
                            label={presentation.statusLabel.toLowerCase()}
                            sx={{
                              height: 24,
                              background: presentation.statusBg,
                              color: presentation.statusColor,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditingNeed(need);
                              setIsAddNeedOpen(true);
                            }}
                            sx={{ borderRadius: '999px', textTransform: 'none' }}
                          >
                            Edit
                          </Button>
                        </Stack>
                      </Stack>

                      {acceptedApplications.length > 0 ? (
                        <Stack
                          direction="row"
                          spacing={0.8}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {acceptedApplications.map((application) => (
                            <Chip
                              key={application.id}
                              avatar={
                                <Avatar>
                                  {(application.vendor_name || '?')
                                    .slice(0, 1)
                                    .toUpperCase()}
                                </Avatar>
                              }
                              label={application.vendor_name}
                              sx={{
                                height: 26,
                                fontSize: 12,
                                background: '#EAF3DE',
                              }}
                            />
                          ))}
                        </Stack>
                      ) : null}
                    </Stack>
                  </Box>

                  {isExpanded && need.application_count > 0 ? (
                    <Box
                      sx={{
                        px: 1.5,
                        pb: 1.5,
                        borderTop: '0.5px solid var(--color-border-tertiary)',
                        background: '#f9f9f9',
                      }}
                    >
                      <Stack spacing={1} sx={{ pt: 1.2 }}>
                        {(need.applications || []).map((application) => (
                          <Box
                            key={application.id}
                            sx={{
                              border: '0.5px solid var(--color-border-tertiary)',
                              borderRadius: '14px',
                              p: 1.15,
                            }}
                          >
                            <Stack spacing={0.9}>
                              <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                justifyContent="space-between"
                                spacing={0.75}
                              >
                                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                                  {application.vendor_name}
                                </Typography>
                                <Chip
                                  label={application.status}
                                  size="small"
                                  sx={{
                                    width: 'fit-content',
                                    textTransform: 'capitalize',
                                  }}
                                />
                              </Stack>
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  color: 'var(--color-text-secondary)',
                                }}
                              >
                                {application.message ||
                                  application.cover_letter ||
                                  'No cover letter provided.'}
                              </Typography>
                              {application.status === 'pending' ? (
                                <Stack direction="row" spacing={0.8}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={async () => {
                                      await reviewNeedApplicationMutation.mutateAsync(
                                        {
                                          applicationId: application.id,
                                          status: 'accepted',
                                        },
                                      );
                                      toast.success('Application accepted');
                                    }}
                                    sx={{
                                      textTransform: 'none',
                                      borderRadius: '999px',
                                      background: '#1D9E75',
                                      boxShadow: 'none',
                                    }}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={async () => {
                                      await reviewNeedApplicationMutation.mutateAsync(
                                        {
                                          applicationId: application.id,
                                          status: 'rejected',
                                        },
                                      );
                                      toast.success('Application rejected');
                                    }}
                                    sx={{
                                      textTransform: 'none',
                                      borderRadius: '999px',
                                    }}
                                  >
                                    Reject
                                  </Button>
                                </Stack>
                              ) : null}
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  ) : null}
                </Box>
              );
            })}
          </Stack>
        </WorkspaceCard>
      </Stack>
    )
  };

  const DetailsTab = () => {
    return (
      <Stack spacing={0}>
        <WorkspaceCard title="Event details">
          <Stack spacing={1}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 3,
              }}
            >
              {[
                {
                  label: 'Date & time',
                  value: detailRows.find(i => i.label === 'Date & time')?.value || formatDateLabel(event?.start_time),
                  icon: <span className="text-lg">📅</span>
                },
                {
                  label: 'Location',
                  value: detailRows.find(i => i.label === 'Location')?.value || event?.location_name || 'Location TBD',
                  icon: <span className="text-lg">📍</span>
                },
                {
                  label: 'Category',
                  value: detailRows.find(i => i.label === 'Category')?.value || event?.category?.name || 'Category TBD',
                  icon: <span className="text-lg">🏷️</span>
                },
                {
                  label: 'Format',
                  value: detailRows.find(i => i.label === 'Format')?.value || (event?.location_address === 'Online Event' ? 'Online' : 'In person'),
                  icon: <span className="text-lg">✨</span>
                },
              ].map((item) => (
                <Stack key={item.label} direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--color-background-secondary)',
                      border: '0.5px solid var(--color-border-tertiary)'
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Stack spacing={0.25}>
                    <Typography
                      sx={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 14,
                        color: 'var(--color-text-primary)',
                        fontWeight: 600,
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Stack>
                </Stack>
              ))}
            </Box>

            <Stack spacing={0.75}>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Description
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                {event?.description ||
                  'Add a description that tells people exactly what the event is, why it matters, and what they should expect.'}
              </Typography>
            </Stack>

            <Button
              variant="outlined"
              onClick={() => setIsDetailsOpen(true)}
              sx={{
                width: 'fit-content',
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                borderColor: 'var(--color-border-tertiary)',
                color: 'var(--color-text-primary)',
                '&:hover': {
                  borderColor: '#D85A30',
                  background: 'rgba(216, 90, 48, 0.04)'
                }
              }}
            >
              Edit details
            </Button>

            <Box
              sx={{
                mt: 1,
                borderTop: '0.5px solid var(--color-border-tertiary)',
                pt: 2.5,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={{ mb: 2 }}
              >
                <Typography sx={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 800 }}>
                  Features
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setIsFeaturesOpen(true)}
                  sx={{ textTransform: 'none', color: '#D85A30', fontWeight: 600 }}
                >
                  Edit features
                </Button>
              </Stack>
              <Stack direction="row" flexWrap="wrap" useFlexGap gap={1.5}>
                {editableFeatures.length > 0 ? (
                  editableFeatures.map((feature) => {
                    const item = FEATURE_ITEMS.find((i) => i.name === feature.name);
                    return (
                      <Box
                        key={feature.name}
                        title={feature.outsourced ? `${feature.name} (Outsourced)` : feature.name}
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: feature.outsourced ? '#FAECE7' : 'var(--color-background-secondary)',
                          border: '0.5px solid',
                          borderColor: feature.outsourced ? '#D85A30' : 'var(--color-border-tertiary)',
                          fontSize: 20,
                        }}
                      >
                        {item?.emoji || '✨'}
                      </Box>
                    );
                  })
                ) : (
                  <Typography
                    sx={{ fontSize: 13, color: 'var(--color-text-secondary)' }}
                  >
                    No features added yet.
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        </WorkspaceCard>

        <WorkspaceCard
          title="Tickets"
          action={
            <Button
              variant="text"
              onClick={() => setIsTicketsOpen(true)}
              sx={{ textTransform: 'none', color: '#D85A30', fontWeight: 600 }}
            >
              + Add ticket
            </Button>
          }
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.5,
              mb: 1.5,
            }}
          >
            {[
              { label: 'Total sold', value: String(totalSold) },
              { label: 'Revenue', value: formatMoney(ticketRevenue) },
            ].map((metric) => (
              <Box
                key={metric.label}
                sx={{
                  background: 'var(--color-background-secondary)',
                  borderRadius: '16px',
                  p: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    color: 'var(--color-text-secondary)',
                    mb: 0.5,
                  }}
                >
                  {metric.label}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  {metric.value}
                </Typography>
              </Box>
            ))}
          </Box>

          <Stack spacing={1.25}>
            {(realTicketRows.length > 0 ? realTicketRows : ticketRows).map(
              (ticket, index) => (
                <Stack
                  key={`${ticket.name}-${index}`}
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={{ xs: 1, sm: 1.5 }}
                  sx={{
                    py: 1.5,
                    borderBottom: '0.5px solid var(--color-border-tertiary)',
                    '&:last-of-type': { borderBottom: 'none', pb: 0 },
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 700, minWidth: { sm: 90 } }}
                    >
                      {ticket.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 13,
                        color: 'var(--color-text-secondary)',
                        ml: 'auto',
                        minWidth: { sm: 50 },
                      }}
                    >
                      {'price' in ticket && typeof ticket.price !== 'undefined'
                        ? formatMoney(ticket.price)
                        : ''}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ width: '100%', flex: 1 }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={
                          'progress' in ticket
                            ? ticket.progress
                            : ticket.capacity
                              ? Math.min(
                                100,
                                ((event?.ticket_tiers?.[index]?.sold_count || 0) /
                                  Number(ticket.capacity)) *
                                100,
                              )
                              : 0
                        }
                        sx={{
                          height: 6,
                          borderRadius: '999px',
                          backgroundColor: 'var(--color-background-secondary)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: '999px',
                            backgroundColor:
                              'color' in ticket ? ticket.color : '#D85A30',
                          },
                        }}
                      />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                        minWidth: 88,
                        textAlign: 'right',
                      }}
                    >
                      {'sold' in ticket
                        ? ticket.sold
                        : `${event?.ticket_tiers?.[index]?.sold_count || 0} / ${ticket.capacity || '∞'} sold`}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setIsTicketsOpen(true)}
                      sx={{
                        borderRadius: '999px',
                        textTransform: 'none',
                        flexShrink: 0,
                      }}
                    >
                      Edit
                    </Button>
                  </Stack>
                </Stack>
              ),
            )}
          </Stack>
          <Typography
            sx={{ mt: 1.25, fontSize: 11, color: 'var(--color-text-secondary)' }}
          >
            Min. threshold: 20 attendees ·{' '}
            <Box component="span" sx={{ color: '#3B6D11', fontWeight: 500 }}>
              Reached ✓
            </Box>
          </Typography>
        </WorkspaceCard>

        <WorkspaceCard
          title="Pre-event checklist"
          action={
            <Chip
              label={`${completedChecklistCount}/${checklistItems.length} ready`}
              sx={{
                height: 24,
                background:
                  completedChecklistCount === checklistItems.length
                    ? '#EAF3DE'
                    : '#F1EFE8',
                color:
                  completedChecklistCount === checklistItems.length
                    ? '#3B6D11'
                    : 'var(--color-text-primary)',
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          }
        >
          <Stack spacing={0}>
            {checklistItems.map((item, index) => {
              const isHighlightedMilestone =
                (item.variant === 'sales' ||
                  item.variant === 'go_live' ||
                  item.variant === 'live_event') &&
                item.status === 'done';
              return (
                <Stack
                  key={item.label}
                  direction="row"
                  spacing={1.1}
                  sx={{
                    py: isHighlightedMilestone ? 1.25 : 1,
                    px: isHighlightedMilestone ? 1.25 : 0,
                    mx: isHighlightedMilestone ? -1.25 : 0,
                    borderRadius: isHighlightedMilestone ? 10 : 0,
                    borderBottom:
                      index < checklistItems.length - 1 && !isHighlightedMilestone
                        ? '0.5px solid var(--color-border-tertiary)'
                        : 'none',
                  }}
                >
                  <Box
                    sx={{
                      width: isHighlightedMilestone ? 20 : 16,
                      height: isHighlightedMilestone ? 20 : 16,
                      borderRadius: isHighlightedMilestone ? 6 : 4,
                      border: '1.5px solid',
                      borderColor:
                        item.variant === 'host'
                          ? '#2563EB'
                          : item.status === 'done'
                            ? '#1D9E75'
                            : item.status === 'warn'
                              ? '#E24B4A'
                              : 'var(--color-border-secondary)',
                      background:
                        item.variant === 'host'
                          ? '#2563EB'
                          : item.status === 'done'
                            ? '#1D9E75'
                            : 'transparent',
                      display: 'grid',
                      placeItems: 'center',
                      mt: '2px',
                      flexShrink: 0,
                    }}
                  >
                    {item.status === 'done' ? (
                      <Check size={isHighlightedMilestone ? 12 : 10} color="#fff" />
                    ) : null}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: isHighlightedMilestone ? 14 : 13,
                      fontWeight: isHighlightedMilestone ? 600 : 400,
                      lineHeight: 1.4,
                      color:
                        item.status === 'warn'
                          ? '#A32D2D'
                          : item.variant === 'host'
                            ? '#1E40AF'
                            : item.status === 'done'
                              ? 'var(--color-text-secondary)'
                              : 'var(--color-text-primary)',
                      textDecoration:
                        item.status === 'done' ? 'line-through' : 'none',
                    }}
                  >
                    {item.label}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        </WorkspaceCard>
      </Stack>
    );
  }

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

  const lifecycle =
    lifecycleTheme[event?.lifecycle_state as keyof typeof lifecycleTheme] ||
    lifecycleTheme.draft;
  const activeProgressIndex = lifecycle.step;
  const detailRows = event
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
        value: `${event.location_address === 'Online Event' ? 'Online' : 'In person'
          } · One-time`,
      },
    ]
    : eventDetails;

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
  const reviewingNeed = reviewingNeedId
    ? eventNeeds.find((need) => need.id === reviewingNeedId) || null
    : null;
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
    setOutsourcedFeatures(
      Object.fromEntries(
        features.map((feature) => [feature.name, !!feature.outsourced]),
      ),
    );
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
      setReviewingNeedId(null);
      setIsBrowseVendorsOpen(false);
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
          <DetailsTab />
        ) : (
          <NeedsTab />
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
          initialFeatures={editableFeatures}
          onClose={() => setIsFeaturesOpen(false)}
          onSave={handleSaveFeatures}
        />
      ) : null}
      {isTicketsOpen ? (
        <TicketsOverlay
          initialCapacity={event.capacity ? String(event.capacity) : ''}
          initialTiers={realTicketRows}
          onClose={() => setIsTicketsOpen(false)}
          onSave={handleSaveTickets}
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
