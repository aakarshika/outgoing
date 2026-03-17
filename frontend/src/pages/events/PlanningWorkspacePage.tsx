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
  TextField,
  Typography,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, MessageCircle, Plus, Search } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import {
  canUseBrowserGeolocation,
  getCurrentCoordinates,
  reverseGeocodeCoordinates,
} from '@/utils/geolocation';
import { compressImage } from '@/utils/image';

import { type EventFeature, FEATURE_ITEMS } from './manage/ManageDetailsSection';

const progressSteps = [
  { label: 'Details set', status: 'done', value: 'check' },
  { label: 'Tickets configured', status: 'done', value: 'check' },
  { label: 'Needs being filled', status: 'active', value: '2' },
  { label: 'Ready to go', status: 'todo', value: '4' },
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

const chatRows = [
  { type: 'system', text: 'Karan confirmed the DJ slot ✓' },
  {
    type: 'incoming',
    avatar: 'A',
    color: '#534AB7',
    text: '3 photog applications came in, you seen them?',
  },
  {
    type: 'outgoing',
    avatar: 'P',
    color: '#D85A30',
    text: 'Checking now — the Priya one looks good',
  },
  { type: 'system', text: '34 tickets sold · ₹9,450 collected' },
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

type VendorSuggestion = {
  id: string;
  name: string;
  tag: string;
  avatar: string;
  color: string;
  action: 'Assign' | 'Invite';
  accent: boolean;
  source: 'Your people' | 'Community';
  blurb: string;
  recommendedNeedId: string;
};

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

const vendorSuggestions: VendorSuggestion[] = [
  {
    id: 'karan',
    name: 'Karan Mehta',
    tag: 'Music buddy · brought sound to 2 events',
    avatar: 'K',
    color: '#534AB7',
    action: 'Assign',
    accent: true,
    source: 'Your people',
    blurb:
      'Already understands your pacing and setup style. Best for roles where trust matters more than discovery.',
    recommendedNeedId: 'dj-music',
  },
  {
    id: 'priya',
    name: 'Priya Nair',
    tag: 'Art buddy · photographer at 3 events',
    avatar: 'P',
    color: '#1D9E75',
    action: 'Assign',
    accent: true,
    source: 'Your people',
    blurb:
      'A strong fit when you want fast coordination and a clean visual record without a long briefing.',
    recommendedNeedId: 'photographer',
  },
  {
    id: 'rohan',
    name: 'Rohan DJ',
    tag: 'DJ · contributed to 8 events on Outgoing',
    avatar: 'R',
    color: '#D85A30',
    action: 'Invite',
    accent: false,
    source: 'Community',
    blurb:
      'Useful when you need reliability from the broader network and do not already have someone lined up.',
    recommendedNeedId: 'dj-music',
  },
  {
    id: 'samir',
    name: 'Samir Audio',
    tag: 'Sound support · speaker rental and setup',
    avatar: 'S',
    color: '#185FA5',
    action: 'Invite',
    accent: false,
    source: 'Community',
    blurb:
      'A practical option for setup-heavy roles where transport, equipment, and punctuality matter more than vibe.',
    recommendedNeedId: 'speakers',
  },
];

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

function inputSx() {
  return {
    '& .MuiOutlinedInput-root': {
      borderRadius: '16px',
      background: 'var(--color-background-primary)',
    },
  };
}

function toDatetimeLocalValue(dateString?: string | null) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function formatMoney(value?: string | number | null) {
  const numeric = Number(value || 0);
  if (Number.isNaN(numeric)) return '₹0';
  return `₹${numeric.toLocaleString()}`;
}

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
        background: 'rgb(255, 253, 251)',
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
          px: 2,
          py: 1.5,
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}
        >
          {title}
        </Typography>
        {typeof action === 'string' ? (
          <Typography sx={{ fontSize: 12, color: '#D85A30', fontWeight: 500 }}>
            {action}
          </Typography>
        ) : (
          action || null
        )}
      </Stack>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Box>
  );
}

const featuredNeedCategories = [
  {
    id: 'dj',
    label: 'DJ / Music',
    emoji: '🎧',
    tint: '#FAECE7',
    border: '#D85A30',
    text: '#712B13',
  },
  {
    id: 'photography',
    label: 'Photography',
    emoji: '📷',
    tint: '#E6F1FB',
    border: '#4A87C6',
    text: '#204D74',
  },
  {
    id: 'catering',
    label: 'Food & catering',
    emoji: '🍽️',
    tint: '#FAEEDA',
    border: '#C38A18',
    text: '#704707',
  },
  {
    id: 'lighting_audio',
    label: 'Lighting / audio',
    emoji: '🔊',
    tint: '#EEEDFE',
    border: '#534AB7',
    text: '#26215C',
  },
  {
    id: 'venue_rental',
    label: 'Venue',
    emoji: '🏠',
    tint: '#EAF3DE',
    border: '#5A8A28',
    text: '#33540F',
  },
  {
    id: 'staffing',
    label: 'Staffing',
    emoji: '👥',
    tint: '#F1EFE8',
    border: '#8F6942',
    text: '#4F3A26',
  },
] as const;

const compensationDesignOptions = [
  {
    id: 'free-entry',
    title: 'Free entry',
    subtitle: 'Good when the role is lightweight and the person also wants to attend.',
    detail: 'Best for friends, collaborators, and community contributors.',
    tint: '#FAECE7',
    border: '#D85A30',
    text: '#712B13',
  },
  {
    id: 'cash',
    title: 'Cash payment',
    subtitle: 'Use this when you want the role to feel clearly professional.',
    detail: 'Most direct option for specialists who are coming to work, not hang.',
    tint: '#E1F5EE',
    border: '#1D9E75',
    text: '#085041',
  },
  {
    id: 'discount',
    title: 'Discounted ticket',
    subtitle: 'Useful when you want some commitment without covering the full ticket.',
    detail: 'This keeps the event paid while still recognising the contribution.',
    tint: '#FAEEDA',
    border: '#C38A18',
    text: '#704707',
  },
  {
    id: 'hybrid',
    title: 'Mix and match',
    subtitle: 'For cases where a little cash plus access feels fairest.',
    detail: 'We will wire the exact combination rules in the next backend pass.',
    tint: '#EEEDFE',
    border: '#534AB7',
    text: '#26215C',
  },
] as const;

const allVendorCategoryOptions = VENDOR_CATEGORIES.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    group: group.group,
  })),
);

function AddNeedOverlay({
  onClose,
  onSave,
  eventTitle,
  eventDateLabel,
  initialBudgetHint,
  initialNeed,
  canApplyToSeries,
  isSaving,
}: {
  onClose: () => void;
  onSave: (payload: {
    title: string;
    description: string;
    category: string;
    budgetMin: string;
    budgetMax: string;
    updateSeries: boolean;
  }) => Promise<void>;
  eventTitle?: string;
  eventDateLabel?: string;
  initialBudgetHint?: string | null;
  initialNeed?: EventNeed | null;
  canApplyToSeries?: boolean;
  isSaving?: boolean;
}) {
  const overlayTitle = initialNeed ? 'Edit need' : 'Add a need';
  const eventLabel = eventTitle || 'Rooftop Vinyl Night';
  const [category, setCategory] = useState(initialNeed?.category || '');
  const [title, setTitle] = useState(initialNeed?.title || '');
  const [description, setDescription] = useState(initialNeed?.description || '');
  const [budgetMin, setBudgetMin] = useState(initialNeed?.budget_min || '');
  const [budgetMax, setBudgetMax] = useState(initialNeed?.budget_max || '');
  const [updateSeries, setUpdateSeries] = useState(false);
  const [selectedCompStyles, setSelectedCompStyles] = useState<string[]>(
    initialNeed ? ['cash'] : ['free-entry', 'cash'],
  );

  const activeCategory = featuredNeedCategories.find((item) => item.id === category);
  const activeCategoryLabel = category
    ? getCategoryLabel(category)
    : 'Pick a role type';
  const displayDateLabel = eventDateLabel || 'Date TBD';
  const budgetAnchor = initialBudgetHint || budgetMin || budgetMax || null;
  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  const previewTitle =
    trimmedTitle ||
    (category ? `${getCategoryLabel(category)} needed` : 'Your role brief');
  const previewDescription =
    trimmedDescription ||
    'Describe the timing, expected output, and what “done well” looks like so the right people can self-select quickly.';
  const canSubmit = Boolean(trimmedTitle && category);
  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '18px',
      background: 'rgba(255,255,255,0.9)',
      alignItems: 'flex-start',
      '& fieldset': {
        borderColor: 'rgba(143, 105, 66, 0.22)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(216, 90, 48, 0.42)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#D85A30',
      },
    },
    '& .MuiInputBase-input': {
      fontSize: 14,
      lineHeight: 1.5,
    },
  } as const;

  const handleCategoryChange = (nextCategory: string) => {
    setCategory(nextCategory);
    if (!title.trim()) {
      setTitle(getCategoryLabel(nextCategory));
    }
  };

  const handleToggleCompStyle = (styleId: string) => {
    setSelectedCompStyles((current) =>
      current.includes(styleId)
        ? current.filter((item) => item !== styleId)
        : [...current, styleId],
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    await onSave({
      title: trimmedTitle,
      description: trimmedDescription,
      category,
      budgetMin: budgetMin.trim(),
      budgetMax: budgetMax.trim(),
      updateSeries,
    });
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgb(255, 251, 249)',
        overflowY: 'auto',
        p: { xs: 2, md: 3 },
      }}
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 1120, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Box
            onClick={onClose}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              fontSize: 14,
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} />
            Needs board
          </Box>
          <Chip
            label={initialNeed ? 'Editing live brief' : 'Fast brief'}
            sx={{
              height: 24,
              background: '#FAECE7',
              color: '#712B13',
              fontWeight: 700,
              fontSize: 11,
            }}
          />
        </Stack>

        <Box
          sx={{
            borderRadius: '28px',
            p: { xs: 2.25, md: 3 },
            background:
              'linear-gradient(135deg, rgba(250,236,231,0.98) 0%, rgba(255,251,247,0.96) 52%, rgba(238,237,254,0.88) 100%)',
            border: '0.5px solid rgba(143, 105, 66, 0.18)',
            boxShadow: '0 24px 60px rgba(79, 58, 38, 0.08)',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
          >
            <Stack spacing={1.1} sx={{ maxWidth: 720 }}>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: { xs: 28, md: 34 },
                  lineHeight: 1.05,
                  letterSpacing: '-0.04em',
                  fontWeight: 800,
                  color: '#2B2118',
                }}
              >
                {overlayTitle}
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                  color: 'rgba(66, 50, 28, 0.76)',
                  maxWidth: 620,
                  lineHeight: 1.6,
                }}
              >
                Save the role brief and the real budget now. Keep the richer offer
                design visible so the team can align on intent without forcing every
                detail into the first backend contract.
              </Typography>
            </Stack>
            <Stack
              spacing={0.85}
              sx={{
                px: 1.6,
                py: 1.4,
                minWidth: { xs: '100%', md: 260 },
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.72)',
                border: '0.5px solid rgba(143, 105, 66, 0.18)',
              }}
            >
              <Typography sx={{ fontSize: 11, color: 'rgba(66, 50, 28, 0.62)' }}>
                {eventLabel}
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#2B2118',
                }}
              >
                {previewTitle}
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'rgba(66, 50, 28, 0.68)' }}>
                {displayDateLabel}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'minmax(0, 1.55fr) minmax(300px, 0.95fr)',
            },
            gap: 2,
            alignItems: 'start',
            mt: 2,
          }}
        >
          <Box>
            <WorkspaceCard title="Start with the role" action="These fields save now">
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--color-text-secondary)',
                  mb: 0.9,
                }}
              >
                Role type
              </Typography>
              <Typography
                sx={{
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.55,
                  mb: 1.5,
                }}
              >
                Pick the role first. That gives the need a clean category, makes search
                clearer, and keeps the rest of the form moving fast.
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr 1fr',
                    md: 'repeat(3, minmax(0, 1fr))',
                  },
                  gap: 1.1,
                  mb: 1.6,
                }}
              >
                {featuredNeedCategories.map((item) => {
                  const isActive = category === item.id;
                  return (
                    <Box
                      key={item.id}
                      onClick={() => handleCategoryChange(item.id)}
                      sx={{
                        px: 1.5,
                        py: 1.25,
                        borderRadius: '18px',
                        border: '1px solid',
                        borderColor: isActive
                          ? item.border
                          : 'rgba(143, 105, 66, 0.18)',
                        background: isActive ? item.tint : 'rgba(255,255,255,0.88)',
                        color: isActive ? item.text : 'var(--color-text-primary)',
                        cursor: 'pointer',
                        transition: 'all 140ms ease',
                        boxShadow: isActive
                          ? '0 10px 24px rgba(79, 58, 38, 0.08)'
                          : 'none',
                        '&:hover': {
                          borderColor: item.border,
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      <Typography sx={{ fontSize: 18, mb: 0.55 }}>
                        {item.emoji}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}
                      >
                        {item.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              <TextField
                select
                fullWidth
                label="Or choose another category"
                value={category}
                onChange={(event) => handleCategoryChange(event.target.value)}
                sx={{ ...fieldSx, mb: 1.5 }}
              >
                {allVendorCategoryOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.group} · {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1.2fr' },
                  gap: 1.5,
                }}
              >
                <TextField
                  label="Short label"
                  placeholder="Photography help"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  helperText="This becomes the visible need title on the board."
                  fullWidth
                  required
                  sx={fieldSx}
                />
                <TextField
                  label="Describe exactly what success looks like"
                  placeholder="Low-light crowd shots, a few portraits, and edited delivery within 48 hours."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  fullWidth
                  multiline
                  minRows={4}
                  sx={fieldSx}
                />
              </Box>

              {canApplyToSeries && !initialNeed ? (
                <Box
                  sx={{
                    mt: 1.6,
                    px: 1.5,
                    py: 1.25,
                    borderRadius: '18px',
                    background: '#F1EFE8',
                    border: '0.5px solid rgba(143, 105, 66, 0.14)',
                  }}
                >
                  <Stack direction="row" spacing={1.2} alignItems="flex-start">
                    <Checkbox
                      checked={updateSeries}
                      onChange={(event) => setUpdateSeries(event.target.checked)}
                      sx={{
                        mt: -0.7,
                        color: '#8F6942',
                        '&.Mui-checked': { color: '#D85A30' },
                      }}
                    />
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        Apply this need to the full series
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: 'var(--color-text-secondary)',
                          lineHeight: 1.5,
                        }}
                      >
                        Use this when the role will likely repeat across draft and
                        published occurrences.
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ) : null}
            </WorkspaceCard>

            <WorkspaceCard
              title="Frame the compensation"
              action="Design now, persist budget"
            >
              <Typography
                sx={{
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.55,
                }}
              >
                The offer design below matches the new UI direction. In this pass, the
                backend still saves only the budget range, so use the cards to express
                intent and the amount fields to store the real contract we have today.
              </Typography>

              <Box
                sx={{
                  mt: 1.6,
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 1.1,
                }}
              >
                {compensationDesignOptions.map((option) => {
                  const isActive = selectedCompStyles.includes(option.id);
                  return (
                    <Box
                      key={option.id}
                      onClick={() => handleToggleCompStyle(option.id)}
                      sx={{
                        p: 1.5,
                        borderRadius: '18px',
                        border: '1px solid',
                        borderColor: isActive
                          ? option.border
                          : 'rgba(143, 105, 66, 0.16)',
                        background: isActive ? option.tint : 'rgba(255,255,255,0.92)',
                        cursor: 'pointer',
                        transition: 'all 140ms ease',
                        '&:hover': {
                          borderColor: option.border,
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: isActive
                                ? option.text
                                : 'var(--color-text-primary)',
                            }}
                          >
                            {option.title}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 12,
                              color: 'var(--color-text-secondary)',
                              lineHeight: 1.45,
                              mt: 0.45,
                            }}
                          >
                            {option.subtitle}
                          </Typography>
                        </Box>
                        <Chip
                          label={isActive ? 'Included' : 'Optional'}
                          sx={{
                            height: 24,
                            background: isActive ? 'rgba(255,255,255,0.72)' : '#F6F3EE',
                            color: isActive ? option.text : 'rgba(66, 50, 28, 0.62)',
                            fontWeight: 700,
                            fontSize: 10,
                          }}
                        />
                      </Stack>
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: isActive ? option.text : 'rgba(66, 50, 28, 0.68)',
                          lineHeight: 1.5,
                          mt: 1,
                        }}
                      >
                        {option.detail}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              <Box
                sx={{
                  mt: 1.6,
                  px: 1.5,
                  py: 1.35,
                  borderRadius: '18px',
                  background: '#F8F4EF',
                  border: '0.5px solid rgba(143, 105, 66, 0.16)',
                }}
              >
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  spacing={1}
                  sx={{ mb: 1.2 }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Amount saved right now
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 13,
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.5,
                        mt: 0.35,
                      }}
                    >
                      This is the part that actually persists in the current API
                      contract.
                    </Typography>
                  </Box>
                  {budgetAnchor ? (
                    <Chip
                      label={`Event reference ${formatMoney(budgetAnchor)}`}
                      sx={{
                        alignSelf: 'flex-start',
                        height: 26,
                        background: '#EEEDFE',
                        color: '#26215C',
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    />
                  ) : null}
                </Stack>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 1.25,
                  }}
                >
                  <TextField
                    label="Budget min"
                    placeholder="0"
                    value={budgetMin}
                    onChange={(event) => setBudgetMin(event.target.value)}
                    type="number"
                    fullWidth
                    sx={fieldSx}
                  />
                  <TextField
                    label="Budget max"
                    placeholder="350"
                    value={budgetMax}
                    onChange={(event) => setBudgetMax(event.target.value)}
                    type="number"
                    fullWidth
                    sx={fieldSx}
                  />
                </Box>
              </Box>
            </WorkspaceCard>

            <WorkspaceCard
              title="Next backend pass"
              action="Visible, not persisted yet"
            >
              <Typography
                sx={{
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.55,
                }}
              >
                These planning notes stay visible here so the team can design the fuller
                vendor agreement without overwhelming the save flow today.
              </Typography>
              <Box
                sx={{
                  mt: 1.5,
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                  gap: 1.1,
                }}
              >
                {[
                  {
                    title: 'Slots and fill deadline',
                    text: 'Use this when one role needs multiple people or when the host wants a clear latest-by date.',
                    accent: '#FAECE7',
                    color: '#712B13',
                  },
                  {
                    title: 'Threshold and decision timing',
                    text: 'This matters when vendors need to know how ticket sales affect whether the event proceeds.',
                    accent: '#EEEDFE',
                    color: '#26215C',
                  },
                  {
                    title: 'Cancellation terms',
                    text: 'Good agreements explain what happens if the event is called off and who carries the risk.',
                    accent: '#FAEEDA',
                    color: '#704707',
                  },
                ].map((item) => (
                  <Box
                    key={item.title}
                    sx={{
                      p: 1.4,
                      borderRadius: '18px',
                      background: item.accent,
                      border: '0.5px solid rgba(143, 105, 66, 0.14)',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: item.color,
                        mb: 0.55,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 12, lineHeight: 1.55, color: item.color }}
                    >
                      {item.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </WorkspaceCard>
          </Box>

          <Box sx={{ position: { lg: 'sticky' }, top: { lg: 24 } }}>
            <WorkspaceCard
              title="Live preview"
              action={initialNeed ? 'Updating existing need' : 'Ready to post'}
            >
              <Stack spacing={1.4}>
                <Box
                  sx={{
                    p: 1.6,
                    borderRadius: '20px',
                    background: activeCategory?.tint || '#F8F4EF',
                    border: '0.5px solid rgba(143, 105, 66, 0.14)',
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 0.9 }}
                  >
                    <Chip
                      label={activeCategoryLabel}
                      sx={{
                        height: 24,
                        background: 'rgba(255,255,255,0.74)',
                        color: activeCategory?.text || 'var(--color-text-primary)',
                        fontWeight: 700,
                        fontSize: 10,
                      }}
                    />
                    {initialNeed ? (
                      <Chip
                        label={initialNeed.status.replace('_', ' ')}
                        sx={{
                          height: 24,
                          background: '#fff',
                          color: 'rgba(66, 50, 28, 0.72)',
                          fontSize: 10,
                          textTransform: 'capitalize',
                        }}
                      />
                    ) : null}
                  </Stack>
                  <Typography
                    sx={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 22,
                      lineHeight: 1.1,
                      fontWeight: 800,
                      color: '#2B2118',
                    }}
                  >
                    {previewTitle}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1,
                      fontSize: 13,
                      lineHeight: 1.65,
                      color: 'rgba(66, 50, 28, 0.78)',
                    }}
                  >
                    Looking for {activeCategoryLabel.toLowerCase()} support for{' '}
                    {eventLabel} on {displayDateLabel}. {previewDescription}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '18px',
                    background: 'rgba(255,255,255,0.82)',
                    border: '0.5px solid rgba(143, 105, 66, 0.16)',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--color-text-secondary)',
                      mb: 0.8,
                    }}
                  >
                    What persists today
                  </Typography>
                  <Stack spacing={0.8}>
                    <Typography
                      sx={{ fontSize: 13, color: 'var(--color-text-primary)' }}
                    >
                      Category: {activeCategoryLabel}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 13, color: 'var(--color-text-primary)' }}
                    >
                      Title: {previewTitle}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 13, color: 'var(--color-text-primary)' }}
                    >
                      Budget:{' '}
                      {budgetMin || budgetMax
                        ? `${budgetMin || '0'} - ${budgetMax || budgetMin || '0'}`
                        : 'No budget saved yet'}
                    </Typography>
                  </Stack>
                </Box>

                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '18px',
                    background: '#F8F4EF',
                    border: '0.5px solid rgba(143, 105, 66, 0.16)',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--color-text-secondary)',
                      mb: 0.9,
                    }}
                  >
                    Offer framing
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {selectedCompStyles.length > 0 ? (
                      selectedCompStyles.map((styleId) => {
                        const option = compensationDesignOptions.find(
                          (item) => item.id === styleId,
                        );
                        if (!option) return null;
                        return (
                          <Chip
                            key={styleId}
                            label={`${option.title} · design intent`}
                            sx={{
                              background: option.tint,
                              color: option.text,
                              fontWeight: 700,
                              fontSize: 10,
                            }}
                          />
                        );
                      })
                    ) : (
                      <Typography
                        sx={{ fontSize: 12, color: 'var(--color-text-secondary)' }}
                      >
                        Select any offer styles you want visible in the brief.
                      </Typography>
                    )}
                  </Stack>
                  <Typography
                    sx={{
                      fontSize: 12,
                      lineHeight: 1.55,
                      color: 'var(--color-text-secondary)',
                      mt: 1.1,
                    }}
                  >
                    These choices help shape the conversation now. We will wire the
                    exact compensation contract and cancellation logic in the next
                    backend pass.
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr' },
                    gap: 1,
                  }}
                >
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={onClose}
                    sx={{
                      borderRadius: '999px',
                      py: 1.35,
                      textTransform: 'none',
                      borderWidth: '1.5px',
                      color: 'var(--color-text-primary)',
                      borderColor: 'var(--color-border-primary)',
                    }}
                  >
                    Close for now
                  </Button>
                  <Button
                    type="submit"
                    disabled={!canSubmit || !!isSaving}
                    variant="contained"
                    sx={{
                      borderRadius: '999px',
                      py: 1.35,
                      textTransform: 'none',
                      background: '#D85A30',
                      boxShadow: 'none',
                      '&:hover': {
                        background: '#C44C24',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {isSaving
                      ? initialNeed
                        ? 'Saving need...'
                        : 'Posting need...'
                      : initialNeed
                        ? 'Save need'
                        : 'Post need'}
                  </Button>
                </Box>
              </Stack>
            </WorkspaceCard>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function EventDetailsOverlay({
  event,
  categories,
  onClose,
  onSave,
}: {
  event: any;
  categories: Array<{ id: number; name: string }>;
  onClose: () => void;
  onSave: (payload: {
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
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(event.title || '');
  const [categoryId, setCategoryId] = useState(String(event.category?.id || ''));
  const [description, setDescription] = useState(event.description || '');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    event.cover_image || null,
  );
  const [startTime, setStartTime] = useState(toDatetimeLocalValue(event.start_time));
  const [durationHours, setDurationHours] = useState(
    event.start_time && event.end_time
      ? String(
          Math.max(
            1,
            Math.round(
              (new Date(event.end_time).getTime() -
                new Date(event.start_time).getTime()) /
                (1000 * 60 * 60),
            ),
          ),
        )
      : '2',
  );
  const [locationMode, setLocationMode] = useState<'offline' | 'online'>(
    event.location_address === 'Online Event' ? 'online' : 'offline',
  );
  const [locationName, setLocationName] = useState(
    event.location_address === 'Online Event' ? '' : event.location_name || '',
  );
  const [locationAddress, setLocationAddress] = useState(
    event.location_address === 'Online Event' ? '' : event.location_address || '',
  );
  const [onlineUrl, setOnlineUrl] = useState(
    event.location_address === 'Online Event' ? event.location_name || '' : '',
  );
  const [latitude, setLatitude] = useState(
    event.latitude ? String(event.latitude) : '',
  );
  const [longitude, setLongitude] = useState(
    event.longitude ? String(event.longitude) : '',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const handleUseCurrentLocation = async () => {
    if (!canUseBrowserGeolocation()) {
      toast.error('Location needs HTTPS in production. It should work on localhost.');
      return;
    }

    setIsDetectingLocation(true);
    try {
      const coords = await getCurrentCoordinates();
      setLatitude(coords.latitude.toFixed(6));
      setLongitude(coords.longitude.toFixed(6));
      const reverse = await reverseGeocodeCoordinates(
        coords.latitude,
        coords.longitude,
      );
      if (reverse) {
        setLocationName(reverse.venueName);
        setLocationAddress(reverse.displayAddress);
      }
    } catch {
      toast.error('Could not access your location.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(24, 18, 12, 0.38)',
        overflowY: 'auto',
        p: { xs: 2, md: 3 },
      }}
    >
      <Box sx={{ maxWidth: 820, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Box
            onClick={onClose}
            sx={{
              fontSize: 14,
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            ← Event details
          </Box>
          <Typography
            sx={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800 }}
          >
            Edit event details
          </Typography>
        </Stack>

        <WorkspaceCard title="Everything important lives here together">
          <Typography
            sx={{
              fontSize: 13,
              display: 'none',
              color: 'var(--color-text-secondary)',
              mb: 2,
            }}
          >
            This section controls the core information people use to decide whether they
            trust, understand, and show up for the event.
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              sx={inputSx()}
            />
            <TextField
              select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              fullWidth
              sx={inputSx()}
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={String(category.id)}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={4}
              helperText="All the sentences here matter. This is the line between vague interest and a confident RSVP."
              sx={inputSx()}
            />

            <Box>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: 'var(--color-text-secondary)',
                  mb: 0.75,
                }}
              >
                Cover image
              </Typography>
              {coverPreview ? (
                <Box
                  component="img"
                  src={coverPreview}
                  alt="Cover preview"
                  sx={{
                    width: '100%',
                    height: 180,
                    objectFit: 'cover',
                    borderRadius: '18px',
                    mb: 1,
                  }}
                />
              ) : null}
              <Button
                component="label"
                variant="outlined"
                sx={{ borderRadius: '999px', textTransform: 'none' }}
              >
                {coverPreview ? 'Replace cover image' : 'Add cover image'}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setCoverFile(file);
                    if (file) {
                      setCoverPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </Button>
            </Box>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Start date & time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText="Hosts set the start time. The frontend calculates the end time from duration."
                sx={inputSx()}
              />
              <TextField
                label="Duration (hours)"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                fullWidth
                helperText="This controls the end time automatically."
                sx={inputSx()}
              />
            </Stack>

            <Box>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: 'var(--color-text-secondary)',
                  mb: 0.75,
                }}
              >
                Format
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  label="In person"
                  onClick={() => setLocationMode('offline')}
                  sx={{
                    background:
                      locationMode === 'offline'
                        ? '#FAECE7'
                        : 'var(--color-background-primary)',
                    color:
                      locationMode === 'offline'
                        ? '#712B13'
                        : 'var(--color-text-primary)',
                    border: '0.5px solid',
                    borderColor:
                      locationMode === 'offline'
                        ? '#D85A30'
                        : 'var(--color-border-secondary)',
                  }}
                />
                <Chip
                  label="Online"
                  onClick={() => setLocationMode('online')}
                  sx={{
                    background:
                      locationMode === 'online'
                        ? '#E1F5EE'
                        : 'var(--color-background-primary)',
                    color:
                      locationMode === 'online'
                        ? '#085041'
                        : 'var(--color-text-primary)',
                    border: '0.5px solid',
                    borderColor:
                      locationMode === 'online'
                        ? '#1D9E75'
                        : 'var(--color-border-secondary)',
                  }}
                />
              </Stack>
            </Box>

            {locationMode === 'offline' ? (
              <>
                <TextField
                  label="Venue name"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  fullWidth
                  sx={inputSx()}
                />
                <TextField
                  label="Address"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  fullWidth
                  sx={inputSx()}
                />
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    label="Latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    fullWidth
                    sx={inputSx()}
                  />
                  <TextField
                    label="Longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    fullWidth
                    sx={inputSx()}
                  />
                </Stack>
                <Button
                  variant="outlined"
                  onClick={handleUseCurrentLocation}
                  disabled={isDetectingLocation}
                  sx={{
                    borderRadius: '999px',
                    width: 'fit-content',
                    textTransform: 'none',
                  }}
                >
                  {isDetectingLocation ? 'Detecting location…' : 'Use current location'}
                </Button>
              </>
            ) : (
              <TextField
                label="Online event URL"
                value={onlineUrl}
                onChange={(e) => setOnlineUrl(e.target.value)}
                fullWidth
                helperText="If this is online, the join link becomes the primary location signal."
                sx={inputSx()}
              />
            )}
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ borderRadius: '999px', py: 1.35, textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true);
                try {
                  await onSave({
                    title,
                    categoryId,
                    description,
                    coverFile,
                    startTime,
                    durationHours,
                    locationMode,
                    locationName,
                    locationAddress,
                    onlineUrl,
                    latitude,
                    longitude,
                  });
                  onClose();
                } finally {
                  setIsSaving(false);
                }
              }}
              sx={{
                borderRadius: '999px',
                py: 1.35,
                textTransform: 'none',
                background: '#D85A30',
                boxShadow: 'none',
              }}
            >
              {isSaving ? 'Saving details…' : 'Save details'}
            </Button>
          </Stack>
        </WorkspaceCard>
      </Box>
    </Box>
  );
}

function FeaturesOverlay({
  initialFeatures,
  onClose,
  onSave,
}: {
  initialFeatures: EditableFeature[];
  onClose: () => void;
  onSave: (features: EditableFeature[]) => Promise<void>;
}) {
  const [features, setFeatures] = useState<EditableFeature[]>(initialFeatures);
  const [selected, setSelected] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(24, 18, 12, 0.38)',
        overflowY: 'auto',
        p: { xs: 2, md: 3 },
      }}
    >
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Box
            onClick={onClose}
            sx={{
              fontSize: 14,
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            ← Features
          </Box>
          <Typography
            sx={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800 }}
          >
            Add the things people will care about
          </Typography>
        </Stack>
        <WorkspaceCard title="Features">
          <Typography
            sx={{
              fontSize: 13,
              display: 'none',
              color: 'var(--color-text-secondary)',
              mb: 2,
            }}
          >
            Keep this simple. Pick from the dropdown, add the feature, and mark it if
            you expect it to be outsourced later.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
            <TextField
              select
              label="Add a feature"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              fullWidth
              sx={inputSx()}
            >
              {FEATURE_ITEMS.filter(
                (item) => !features.some((feature) => feature.name === item.name),
              ).map((item) => (
                <MenuItem key={item.name} value={item.name}>
                  {item.emoji} {item.name}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              onClick={() => {
                if (!selected) return;
                setFeatures([
                  ...features,
                  { name: selected, tag: 'additional', outsourced: false },
                ]);
                setSelected('');
              }}
              sx={{
                borderRadius: '999px',
                px: 2.5,
                textTransform: 'none',
                background: '#D85A30',
                boxShadow: 'none',
              }}
            >
              Add feature
            </Button>
          </Stack>

          <Stack spacing={1}>
            {features.map((feature) => (
              <Box
                key={feature.name}
                sx={{
                  border: '0.5px solid var(--color-border-tertiary)',
                  borderRadius: '16px',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    flex: 1,
                  }}
                >
                  {feature.name}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Checkbox
                    checked={!!feature.outsourced}
                    onChange={(e) =>
                      setFeatures((current) =>
                        current.map((item) =>
                          item.name === feature.name
                            ? { ...item, outsourced: e.target.checked }
                            : item,
                        ),
                      )
                    }
                  />
                  <Typography
                    sx={{ fontSize: 12, color: 'var(--color-text-secondary)' }}
                  >
                    I need it outsourced
                  </Typography>
                </Stack>
                <Button
                  variant="text"
                  onClick={() =>
                    setFeatures((current) =>
                      current.filter((item) => item.name !== feature.name),
                    )
                  }
                  sx={{ textTransform: 'none', color: '#D85A30' }}
                >
                  Remove
                </Button>
              </Box>
            ))}
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ borderRadius: '999px', py: 1.35, textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true);
                try {
                  await onSave(features);
                  onClose();
                } finally {
                  setIsSaving(false);
                }
              }}
              sx={{
                borderRadius: '999px',
                py: 1.35,
                textTransform: 'none',
                background: '#D85A30',
                boxShadow: 'none',
              }}
            >
              {isSaving ? 'Saving features…' : 'Save features'}
            </Button>
          </Stack>
        </WorkspaceCard>
      </Box>
    </Box>
  );
}

function TicketsOverlay({
  initialCapacity,
  initialTiers,
  onClose,
  onSave,
}: {
  initialCapacity: string;
  initialTiers: EditableTicketTier[];
  onClose: () => void;
  onSave: (payload: { capacity: string; tiers: EditableTicketTier[] }) => Promise<void>;
}) {
  const [capacity, setCapacity] = useState(initialCapacity);
  const [tiers, setTiers] = useState<EditableTicketTier[]>(
    initialTiers.length > 0
      ? initialTiers
      : [
          {
            name: 'General Admission',
            price: 0,
            admits: 1,
            max_passes_per_ticket: 6,
            capacity: '',
            description: '',
            refund_percentage: 100,
          },
        ],
  );
  const [isSaving, setIsSaving] = useState(false);

  const totalCapacityNum = Number(capacity) || 0;
  const lastTierAutoCapacity = useMemo(() => {
    if (!totalCapacityNum || tiers.length === 0) return null;
    const sumOthers = tiers
      .slice(0, -1)
      .reduce((sum, tier) => sum + (Number(tier.capacity) || 0), 0);
    return Math.max(0, totalCapacityNum - sumOthers);
  }, [tiers, totalCapacityNum]);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(24, 18, 12, 0.38)',
        overflowY: 'auto',
        p: { xs: 2, md: 3 },
      }}
    >
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Box
            onClick={onClose}
            sx={{
              fontSize: 14,
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            ← Tickets
          </Box>
          <Typography
            sx={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800 }}
          >
            Ticket manager
          </Typography>
        </Stack>
        <WorkspaceCard title="Tickets & capacity">
          <Typography
            sx={{
              fontSize: 13,
              display: 'none',
              color: 'var(--color-text-secondary)',
              mb: 2,
            }}
          >
            Every ticket communicates value. Price, capacity, refund logic, admits, and
            pass limits should all read clearly at a glance.
          </Typography>

          <TextField
            label="Total event capacity"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            helperText="Leave blank for unlimited. If you set a total cap, the last tier inherits remaining capacity."
            fullWidth
            sx={{ ...inputSx(), mb: 2 }}
          />

          <Stack spacing={2}>
            {tiers.map((tier, index) => {
              const isLastTier = index === tiers.length - 1;
              const accent = ['#FAECE7', '#E6F1FB', '#EAF3DE', '#EEEDFE'][index % 4];
              return (
                <Box
                  key={`${tier.name}-${index}`}
                  sx={{
                    border: '0.5px solid var(--color-border-tertiary)',
                    borderRadius: '22px',
                    overflow: 'hidden',
                    background: '#fffdfb',
                  }}
                >
                  <Box sx={{ background: accent, px: 2, py: 1.25 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography
                        sx={{
                          fontFamily: 'Syne, sans-serif',
                          fontSize: 16,
                          fontWeight: 700,
                        }}
                      >
                        Tier {index + 1}
                      </Typography>
                      {tiers.length > 1 ? (
                        <Button
                          variant="text"
                          onClick={() =>
                            setTiers((current) =>
                              current.filter(
                                (_, currentIndex) => currentIndex !== index,
                              ),
                            )
                          }
                          sx={{ textTransform: 'none', color: '#D85A30' }}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </Stack>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Stack spacing={1.5}>
                      <TextField
                        label="Tier name"
                        value={tier.name}
                        onChange={(e) =>
                          setTiers((current) =>
                            current.map((item, currentIndex) =>
                              currentIndex === index
                                ? { ...item, name: e.target.value }
                                : item,
                            ),
                          )
                        }
                        fullWidth
                        sx={inputSx()}
                      />
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                        <TextField
                          label="Price"
                          value={tier.price}
                          onChange={(e) =>
                            setTiers((current) =>
                              current.map((item, currentIndex) =>
                                currentIndex === index
                                  ? { ...item, price: e.target.value }
                                  : item,
                              ),
                            )
                          }
                          fullWidth
                          sx={inputSx()}
                        />
                        <TextField
                          label="Admits"
                          value={tier.admits}
                          onChange={(e) =>
                            setTiers((current) =>
                              current.map((item, currentIndex) =>
                                currentIndex === index
                                  ? { ...item, admits: e.target.value }
                                  : item,
                              ),
                            )
                          }
                          fullWidth
                          sx={inputSx()}
                        />
                        <TextField
                          label="Max passes"
                          value={tier.max_passes_per_ticket}
                          onChange={(e) =>
                            setTiers((current) =>
                              current.map((item, currentIndex) =>
                                currentIndex === index
                                  ? { ...item, max_passes_per_ticket: e.target.value }
                                  : item,
                              ),
                            )
                          }
                          fullWidth
                          sx={inputSx()}
                        />
                      </Stack>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                        <TextField
                          label={
                            isLastTier && totalCapacityNum
                              ? 'Capacity (auto if blank)'
                              : 'Capacity'
                          }
                          value={
                            tier.capacity === '' || tier.capacity === null
                              ? ''
                              : String(tier.capacity)
                          }
                          onChange={(e) =>
                            setTiers((current) =>
                              current.map((item, currentIndex) =>
                                currentIndex === index
                                  ? {
                                      ...item,
                                      capacity:
                                        e.target.value === ''
                                          ? ''
                                          : Number(e.target.value),
                                    }
                                  : item,
                              ),
                            )
                          }
                          helperText={
                            isLastTier && totalCapacityNum
                              ? `If left blank, this tier inherits ${lastTierAutoCapacity ?? 0} spots.`
                              : undefined
                          }
                          fullWidth
                          sx={inputSx()}
                        />
                        <TextField
                          label="Refund %"
                          value={tier.refund_percentage ?? 100}
                          onChange={(e) =>
                            setTiers((current) =>
                              current.map((item, currentIndex) =>
                                currentIndex === index
                                  ? {
                                      ...item,
                                      refund_percentage: Number(e.target.value) || 0,
                                    }
                                  : item,
                              ),
                            )
                          }
                          fullWidth
                          sx={inputSx()}
                        />
                      </Stack>
                      <TextField
                        label="Description"
                        value={tier.description}
                        onChange={(e) =>
                          setTiers((current) =>
                            current.map((item, currentIndex) =>
                              currentIndex === index
                                ? { ...item, description: e.target.value }
                                : item,
                            ),
                          )
                        }
                        fullWidth
                        multiline
                        minRows={2}
                        sx={inputSx()}
                      />
                    </Stack>
                  </Box>
                </Box>
              );
            })}
          </Stack>

          <Button
            variant="outlined"
            onClick={() =>
              setTiers((current) => [
                ...current,
                {
                  name: `Tier ${current.length + 1}`,
                  price: 0,
                  admits: 1,
                  max_passes_per_ticket: 6,
                  capacity: '',
                  description: '',
                  refund_percentage: 100,
                },
              ])
            }
            sx={{ mt: 2, borderRadius: '999px', textTransform: 'none' }}
          >
            + Add ticket
          </Button>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ borderRadius: '999px', py: 1.35, textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true);
                try {
                  await onSave({ capacity, tiers });
                  onClose();
                } finally {
                  setIsSaving(false);
                }
              }}
              sx={{
                borderRadius: '999px',
                py: 1.35,
                textTransform: 'none',
                background: '#D85A30',
                boxShadow: 'none',
              }}
            >
              {isSaving ? 'Saving tickets…' : 'Save tickets'}
            </Button>
          </Stack>
        </WorkspaceCard>
      </Box>
    </Box>
  );
}

function getNeedVisuals(need: EventNeed) {
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

function formatNeedReward(need: EventNeed) {
  const min = need.budget_min ? Number(need.budget_min) : null;
  const max = need.budget_max ? Number(need.budget_max) : null;
  if (min !== null && max !== null) return `${formatMoney(min)}-${formatMoney(max)}`;
  if (min !== null) return `From ${formatMoney(min)}`;
  if (max !== null) return `Up to ${formatMoney(max)}`;
  return 'Compensation TBD';
}

function getRecommendedNeedForVendor(needs: EventNeed[], vendor: VendorSuggestion) {
  return (
    needs.find((need) =>
      `${need.category} ${need.title}`
        .toLowerCase()
        .includes(vendor.recommendedNeedId.split('-')[0]),
    ) ||
    needs[0] ||
    null
  );
}

function getNeedPresentation(need: EventNeed) {
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

function ReviewApplicantsOverlay({
  need,
  onClose,
  onApprove,
  onReject,
}: {
  need: EventNeed;
  onClose: () => void;
  onApprove: (applicationId: number) => Promise<void>;
  onReject: (applicationId: number) => Promise<void>;
}) {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(24, 18, 12, 0.38)',
        overflowY: 'auto',
        p: { xs: 2, md: 3 },
      }}
    >
      <Box sx={{ maxWidth: 820, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Box
            onClick={onClose}
            sx={{
              fontSize: 14,
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            ← Needs board
          </Box>
          <Typography
            sx={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800 }}
          >
            Review applicants
          </Typography>
        </Stack>

        <WorkspaceCard title={need.title}>
          <Typography
            sx={{
              fontSize: 13,
              display: 'none',
              color: 'var(--color-text-secondary)',
              mb: 2,
            }}
          >
            These people already raised their hand. Read for clarity, reliability, and
            whether they reduce host stress instead of adding more of it.
          </Typography>

          <Stack spacing={1.5}>
            {need.applications.length === 0 ? (
              <Box
                sx={{
                  border: '0.5px dashed var(--color-border-secondary)',
                  borderRadius: '20px',
                  p: 2.5,
                  background: '#fffdfb',
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    display: 'none',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  No applications have come in yet. This is the point where a direct
                  invite or a stronger need description usually changes the outcome.
                </Typography>
              </Box>
            ) : null}
            {need.applications.map((applicant, index) => (
              <Box
                key={applicant.id}
                sx={{
                  border: '0.5px solid var(--color-border-tertiary)',
                  borderRadius: '20px',
                  background: '#fffdfb',
                  p: 1.75,
                }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Avatar
                    sx={{
                      width: 42,
                      height: 42,
                      bgcolor: ['#1D9E75', '#534AB7', '#D85A30', '#185FA5'][index % 4],
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {applicant.vendor_name?.[0]?.toUpperCase() || 'V'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={1}
                      alignItems={{ xs: 'flex-start', md: 'center' }}
                      justifyContent="space-between"
                    >
                      <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
                        {applicant.vendor_name}
                      </Typography>
                      <Chip
                        label={
                          applicant.status === 'accepted'
                            ? 'Accepted'
                            : applicant.status === 'rejected'
                              ? 'Rejected'
                              : 'Awaiting decision'
                        }
                        sx={{
                          height: 24,
                          background:
                            applicant.status === 'accepted'
                              ? '#EAF3DE'
                              : applicant.status === 'rejected'
                                ? '#FCEBEB'
                                : '#EEEDFE',
                          color:
                            applicant.status === 'accepted'
                              ? '#3B6D11'
                              : applicant.status === 'rejected'
                                ? '#A32D2D'
                                : '#26215C',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      />
                    </Stack>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, mt: 0.75 }}>
                      {applicant.proposed_price
                        ? `Proposed price ${formatMoney(applicant.proposed_price)}`
                        : 'No price proposed yet'}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.5,
                        mt: 0.75,
                      }}
                    >
                      {applicant.message || 'No note added.'}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                      {applicant.status === 'pending' ? (
                        <>
                          <Button
                            variant="contained"
                            onClick={() => void onApprove(applicant.id)}
                            sx={{
                              borderRadius: '999px',
                              textTransform: 'none',
                              background: '#D85A30',
                              boxShadow: 'none',
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => void onReject(applicant.id)}
                            sx={{ borderRadius: '999px', textTransform: 'none' }}
                          >
                            Reject
                          </Button>
                        </>
                      ) : null}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>
        </WorkspaceCard>
      </Box>
    </Box>
  );
}

function BrowseVendorsOverlay({
  needs,
  onClose,
  onActOnVendor,
}: {
  needs: EventNeed[];
  onClose: () => void;
  onActOnVendor: (vendor: VendorSuggestion, need: EventNeed) => void;
}) {
  const groupedVendors = vendorSuggestions.reduce<Record<string, VendorSuggestion[]>>(
    (acc, vendor) => {
      if (!acc[vendor.source]) acc[vendor.source] = [];
      acc[vendor.source].push(vendor);
      return acc;
    },
    {},
  );

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(24, 18, 12, 0.38)',
        overflowY: 'auto',
        p: { xs: 2, md: 3 },
      }}
    >
      <Box sx={{ maxWidth: 980, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Box
            onClick={onClose}
            sx={{
              fontSize: 14,
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            ← Planning workspace
          </Box>
          <Typography
            sx={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800 }}
          >
            Browse vendors & friends
          </Typography>
        </Stack>

        <WorkspaceCard title="People who could unblock the event quickly">
          <Typography
            sx={{
              fontSize: 13,
              display: 'none',
              color: 'var(--color-text-secondary)',
              mb: 2,
            }}
          >
            This is where you convert uncertainty into a direct ask. The best cards here
            are not random discovery. They are people with a reason to say yes.
          </Typography>

          <Stack spacing={2}>
            {Object.entries(groupedVendors).map(([groupTitle, vendors]) => (
              <Box key={groupTitle}>
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--color-text-secondary)',
                    mb: 0.9,
                  }}
                >
                  {groupTitle}
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 1.5,
                  }}
                >
                  {vendors.map((vendor) => {
                    const recommendedNeed = getRecommendedNeedForVendor(needs, vendor);
                    return (
                      <Box
                        key={vendor.id}
                        sx={{
                          border: '0.5px solid var(--color-border-tertiary)',
                          borderRadius: '20px',
                          p: 1.75,
                          background: '#fffdfb',
                        }}
                      >
                        <Stack direction="row" spacing={1.25} alignItems="flex-start">
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              fontSize: 12,
                              fontWeight: 700,
                              bgcolor: vendor.color,
                            }}
                          >
                            {vendor.avatar}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1}
                              alignItems={{ xs: 'flex-start', sm: 'center' }}
                              justifyContent="space-between"
                            >
                              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                                {vendor.name}
                              </Typography>
                              <Chip
                                label={
                                  recommendedNeed
                                    ? `Best for ${recommendedNeed.title}`
                                    : 'Pick a need first'
                                }
                                sx={{
                                  height: 24,
                                  background: '#F1EFE8',
                                  color: 'var(--color-text-primary)',
                                  fontSize: 10,
                                  fontWeight: 600,
                                }}
                              />
                            </Stack>
                            <Typography
                              sx={{
                                fontSize: 11,
                                color: 'var(--color-text-secondary)',
                                mt: 0.35,
                              }}
                            >
                              {vendor.tag}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: 'var(--color-text-secondary)',
                                lineHeight: 1.5,
                                mt: 1,
                              }}
                            >
                              {vendor.blurb}
                            </Typography>
                            <Button
                              variant={vendor.accent ? 'contained' : 'outlined'}
                              onClick={() => {
                                if (!recommendedNeed) return;
                                onActOnVendor(vendor, recommendedNeed);
                              }}
                              disabled={!recommendedNeed}
                              sx={{
                                mt: 1.5,
                                borderRadius: '999px',
                                textTransform: 'none',
                                background: vendor.accent ? '#D85A30' : undefined,
                                boxShadow: 'none',
                              }}
                            >
                              {vendor.action}
                            </Button>
                          </Box>
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Stack>
        </WorkspaceCard>
      </Box>
    </Box>
  );
}

function NeedActionDialog({
  state,
  onClose,
  onConfirm,
}: {
  state: NeedActionDialogState;
  onClose: () => void;
  onConfirm: (message: string) => Promise<void>;
}) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        background: 'rgba(24, 18, 12, 0.42)',
        display: 'grid',
        placeItems: 'center',
        p: 2,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 520,
          background: '#fffdfb',
          borderRadius: '28px',
          border: '0.5px solid var(--color-border-tertiary)',
          p: 2.25,
        }}
      >
        <Typography
          sx={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800 }}
        >
          {state.title}
        </Typography>
        <Typography
          sx={{
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.55,
            mt: 1,
          }}
        >
          {state.description}
        </Typography>
        <Chip
          label={state.targetLabel}
          sx={{
            mt: 1.5,
            height: 26,
            background: '#F1EFE8',
            color: 'var(--color-text-primary)',
            fontSize: 11,
            fontWeight: 600,
          }}
        />
        <TextField
          label="Optional message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={state.placeholder}
          fullWidth
          multiline
          minRows={3}
          sx={{ ...inputSx(), mt: 2 }}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{ borderRadius: '999px', py: 1.3, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              setIsSubmitting(true);
              try {
                await onConfirm(message);
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
            sx={{
              borderRadius: '999px',
              py: 1.3,
              textTransform: 'none',
              background: '#D85A30',
              boxShadow: 'none',
            }}
          >
            {isSubmitting ? 'Saving…' : state.confirmLabel}
          </Button>
        </Stack>
      </Box>
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
          background: 'var(--color-background-primary)',
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
          {progressSteps.map((step, index) => (
            <Box
              key={step.label}
              sx={{
                flex: 1,
                px: 1.4,
                py: 1.2,
                borderRadius: '18px',
                border: '0.5px solid var(--color-border-tertiary)',
                background: index === 0 ? '#fffdf9' : 'var(--color-background-primary)',
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

export default function PlanningWorkspacePage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { openChat } = useChatDrawer();
  const eventId = Number(id || 0);
  const isCreateMode = !id;
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
  const [actionDialog, setActionDialog] = useState<NeedActionDialogState | null>(null);

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
          value: `${
            event.location_address === 'Online Event' ? 'Online' : 'In person'
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
  const vendorGroupsForWorkspace = ['Your people', 'Community'].map((groupTitle) => ({
    title: groupTitle,
    vendors: vendorSuggestions.filter((vendor) => vendor.source === groupTitle),
  }));
  const checklistItems = useMemo<ChecklistItem[]>(() => {
    if (!event) return [];
    return buildPlanningChecklist(event, eventNeeds, totalSold);
  }, [event, eventNeeds, totalSold]);
  const completedChecklistCount = checklistItems.filter(
    (item) => item.status === 'done',
  ).length;

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

  const openVendorActionDialog = (
    vendor: VendorSuggestion,
    need: EventNeed,
    source: 'workspace' | 'overlay',
  ) => {
    setActionDialog({
      type: vendor.action === 'Assign' ? 'assign' : 'invite',
      needId: need.id,
      title: vendor.action === 'Assign' ? 'Assign this person' : 'Send an invite',
      description:
        vendor.action === 'Assign'
          ? 'This will mark the role as filled from the host side. Use it when you already trust the person and want the event plan to reflect that certainty.'
          : 'This keeps the role open while creating a clear, direct ask. Good when you want intent without overcommitting too early.',
      confirmLabel: vendor.action === 'Assign' ? 'Confirm assignment' : 'Send invite',
      placeholder:
        source === 'overlay'
          ? 'Add context they will need to say yes quickly.'
          : 'Optional note about timings, expectations, or why you picked them.',
      targetLabel: `${vendor.name} → ${need.title}`,
    });
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
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: { xs: 2, md: 3 },
          py: 2,
          background: 'var(--color-background-primary)',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}
      >
        <Box
          onClick={() => navigate(-1)}
          sx={{
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <ArrowLeft size={18} />
        </Box>
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 18,
            color: '#D85A30',
          }}
        >
          outgoing
        </Typography>
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: { xs: '120px', sm: '300px', md: '500px' },
          }}
        >
          {event.title}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 'auto' }}>
          <Chip
            label={lifecycle.label}
            sx={{
              background: lifecycle.background,
              color: lifecycle.color,
              fontSize: 11,
              fontWeight: 500,
            }}
          />
          <Button
            variant="contained"
            sx={{
              borderRadius: '999px',
              px: 2.25,
              py: 0.85,
              textTransform: 'none',
              fontSize: 13,
              background: '#D85A30',
              boxShadow: 'none',
            }}
          >
            Publish event
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          background: 'var(--color-background-primary)',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          px: { xs: 2, md: 3 },
          py: 2,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          {progressSteps.map((step, index) => (
            <Stack
              key={step.label}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ flexShrink: 0 }}
            >
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    background:
                      index < activeProgressIndex
                        ? '#EAF3DE'
                        : index === activeProgressIndex
                          ? '#D85A30'
                          : 'var(--color-background-secondary)',
                    color:
                      index < activeProgressIndex
                        ? '#3B6D11'
                        : index === activeProgressIndex
                          ? '#fff'
                          : 'var(--color-text-secondary)',
                    flexShrink: 0,
                  }}
                >
                  {index < activeProgressIndex ? <Check size={11} /> : step.value}
                </Box>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: index === activeProgressIndex ? 700 : 500,
                    whiteSpace: 'nowrap',
                    color:
                      index < activeProgressIndex
                        ? '#3B6D11'
                        : index === activeProgressIndex
                          ? '#D85A30'
                          : 'var(--color-text-secondary)',
                  }}
                >
                  {step.label}
                </Typography>
              </Stack>
              {index < progressSteps.length - 1 ? (
                <Box
                  sx={{
                    width: { xs: 16, sm: 24, md: 40 },
                    height: '1px',
                    background: 'var(--color-border-tertiary)',
                    flexShrink: 0,
                  }}
                />
              ) : null}
            </Stack>
          ))}
        </Stack>
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 3 }, py: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 300px' },
            gap: 3,
          }}
        >
          <Stack spacing={2.5}>
            <WorkspaceCard title="Event details" action="Edit">
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1.25,
                }}
              >
                {detailRows.map((item) => (
                  <Stack key={item.label} spacing={0.5}>
                    <Typography
                      sx={{
                        fontSize: 10,
                        fontWeight: 500,
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
                        fontWeight: 500,
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Stack>
                ))}
                <Stack spacing={0.5} sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Description
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 13,
                      display: 'none',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {event.description ||
                      'Add a description that tells people exactly what the event is, why it matters, and what they should expect.'}
                  </Typography>
                </Stack>
              </Box>
              <Button
                variant="outlined"
                onClick={() => setIsDetailsOpen(true)}
                sx={{ mt: 2, borderRadius: '999px', textTransform: 'none' }}
              >
                Edit details
              </Button>
            </WorkspaceCard>

            <WorkspaceCard title="Features" action="Edit">
              <Typography
                sx={{
                  fontSize: 13,
                  display: 'none',
                  color: 'var(--color-text-secondary)',
                  mb: 1.5,
                }}
              >
                Features are fast signals. People scan them to understand what the event
                includes before they commit.
              </Typography>
              <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                {editableFeatures.length > 0 ? (
                  editableFeatures.map((feature) => (
                    <Chip
                      key={feature.name}
                      label={
                        feature.outsourced
                          ? `${feature.name} · outsourced`
                          : feature.name
                      }
                      sx={{
                        background: feature.outsourced ? '#FAEEDA' : '#F1EFE8',
                        color: feature.outsourced
                          ? '#854F0B'
                          : 'var(--color-text-primary)',
                      }}
                    />
                  ))
                ) : (
                  <Typography
                    sx={{
                      fontSize: 13,
                      display: 'none',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    No features added yet.
                  </Typography>
                )}
              </Stack>
              <Button
                variant="outlined"
                onClick={() => setIsFeaturesOpen(true)}
                sx={{ mt: 2, borderRadius: '999px', textTransform: 'none' }}
              >
                Edit features
              </Button>
            </WorkspaceCard>

            <WorkspaceCard title="Tickets" action="+ Add type">
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
                                      ((event.ticket_tiers?.[index]?.sold_count || 0) /
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
                            minWidth: 74,
                            textAlign: 'right',
                          }}
                        >
                          {'sold' in ticket
                            ? ticket.sold
                            : `${event.ticket_tiers?.[index]?.sold_count || 0} / ${ticket.capacity || '∞'} sold`}
                        </Typography>
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
              <Button
                variant="outlined"
                onClick={() => setIsTicketsOpen(true)}
                sx={{ mt: 2, borderRadius: '999px', textTransform: 'none' }}
              >
                Manage tickets
              </Button>
            </WorkspaceCard>

            <WorkspaceCard
              title="Needs board"
              action={
                <Button
                  variant="text"
                  onClick={() => setIsBrowseVendorsOpen(true)}
                  sx={{ textTransform: 'none', color: '#D85A30', fontWeight: 600 }}
                >
                  Browse vendors
                </Button>
              }
            >
              <Typography
                sx={{
                  fontSize: 13,
                  display: 'none',
                  color: 'var(--color-text-secondary)',
                  mb: 1.5,
                }}
              >
                Needs turn fuzzy hopes into explicit agreements. The clearer the role,
                the compensation, and the fallback plan, the less chaos the event
                carries into its final week.
              </Typography>
              <Stack spacing={1}>
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
                      sx={{
                        fontSize: 13,
                        display: 'none',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      No needs have been added yet. This board gets much more useful
                      once the event has explicit asks instead of implied gaps.
                    </Typography>
                    {quickCreateNeedSeed ? (
                      <Box
                        sx={{
                          mt: 1.4,
                          p: 1.4,
                          borderRadius: '16px',
                          background: '#FAEEDA',
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: '#854F0B',
                            mb: 0.55,
                          }}
                        >
                          From quick create
                        </Typography>
                        <Typography
                          sx={{ fontSize: 13, lineHeight: 1.6, color: '#5A3909' }}
                        >
                          "{quickCreateNeedSeed}"
                        </Typography>
                      </Box>
                    ) : null}
                  </Box>
                ) : null}
                {eventNeeds.map((need) => {
                  const presentation = getNeedPresentation(need);
                  const visuals = getNeedVisuals(need);
                  return (
                    <Box
                      key={need.id}
                      onClick={() => {
                        setEditingNeed(need);
                        setIsAddNeedOpen(true);
                      }}
                      sx={{
                        border: '0.5px solid var(--color-border-tertiary)',
                        borderLeft: `3px solid ${visuals.accent}`,
                        borderRadius: '18px',
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.25,
                        cursor: 'pointer',
                        background: '#fffdfb',
                      }}
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '12px',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 16,
                          background: visuals.iconBg,
                          flexShrink: 0,
                        }}
                      >
                        {visuals.icon}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          spacing={1}
                          alignItems={{ xs: 'flex-start', md: 'center' }}
                          justifyContent="space-between"
                        >
                          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                            {need.title}
                          </Typography>
                          <Chip
                            label={presentation.statusLabel}
                            sx={{
                              height: 24,
                              background: presentation.statusBg,
                              color: presentation.statusColor,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          />
                        </Stack>
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: 'var(--color-text-secondary)',
                            mt: 0.35,
                          }}
                        >
                          {presentation.subtitle}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: 'var(--color-text-secondary)',
                            lineHeight: 1.55,
                            mt: 1,
                          }}
                        >
                          {need.description}
                        </Typography>
                        <Stack
                          direction={{ xs: 'row', sm: 'row' }}
                          flexWrap="wrap"
                          spacing={1}
                          useFlexGap
                          sx={{ mt: 1.25 }}
                        >
                          <Chip
                            label={formatNeedReward(need)}
                            sx={{
                              height: 24,
                              background: '#F1EFE8',
                              color: 'var(--color-text-primary)',
                              fontSize: 11,
                            }}
                          />
                          {need.application_count > 0 && need.status !== 'filled' ? (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={(event) => {
                                event.stopPropagation();
                                setReviewingNeedId(need.id);
                              }}
                              sx={{
                                borderRadius: '999px',
                                textTransform: 'none',
                                fontSize: 12,
                              }}
                            >
                              Review applicants
                            </Button>
                          ) : null}
                          {need.status !== 'filled' ? (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={(event) => {
                                event.stopPropagation();
                                setActionDialog({
                                  type: 'override',
                                  needId: need.id,
                                  nextNeedStatus:
                                    need.status === 'override_filled'
                                      ? 'open'
                                      : 'override_filled',
                                  title:
                                    need.status === 'override_filled'
                                      ? 'Undo host override'
                                      : 'Use host override',
                                  description:
                                    need.status === 'override_filled'
                                      ? 'This returns the need to the normal vendor flow so applications and outreach can continue.'
                                      : 'Use this when you will personally cover the role or handle it outside the vendor pipeline. It keeps the board honest for everyone else looking at the plan.',
                                  confirmLabel:
                                    need.status === 'override_filled'
                                      ? 'Undo override'
                                      : 'Mark as host-covered',
                                  placeholder:
                                    'Optional note about how this will be handled.',
                                  targetLabel: need.title,
                                });
                              }}
                              sx={{
                                borderRadius: '999px',
                                textTransform: 'none',
                                fontSize: 12,
                              }}
                            >
                              Host override
                            </Button>
                          ) : null}
                        </Stack>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.75}
                sx={{ pt: 1.5, cursor: 'pointer', width: 'fit-content' }}
                onClick={() => {
                  setEditingNeed(null);
                  setIsAddNeedOpen(true);
                }}
              >
                <Plus size={14} color="#D85A30" />
                <Typography sx={{ fontSize: 13, color: '#D85A30', fontWeight: 500 }}>
                  Add a need
                </Typography>
              </Stack>
            </WorkspaceCard>
          </Stack>

          <Stack spacing={2.5}>
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
              <Typography
                sx={{
                  fontSize: 13,
                  display: 'none',
                  color: 'var(--color-text-secondary)',
                  mb: 1.25,
                }}
              >
                This checklist is a live read on whether the event feels operationally
                trustworthy, not just aesthetically complete.
              </Typography>
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
                        ...(isHighlightedMilestone && {
                          background:
                            item.status === 'done'
                              ? 'linear-gradient(135deg, rgba(29, 158, 117, 0.12) 0%, rgba(45, 212, 191, 0.08) 100%)'
                              : item.status === 'warn'
                                ? 'linear-gradient(135deg, rgba(226, 75, 74, 0.08) 0%, rgba(251, 191, 36, 0.06) 100%)'
                                : 'linear-gradient(135deg, rgba(251, 191, 36, 0.06) 0%, rgba(245, 158, 11, 0.04) 100%)',
                          borderLeft: '3px solid',
                          borderLeftColor:
                            item.status === 'done'
                              ? '#1D9E75'
                              : item.status === 'warn'
                                ? '#E24B4A'
                                : '#D97706',
                          boxShadow:
                            item.status === 'done'
                              ? '0 1px 2px rgba(29, 158, 117, 0.08)'
                              : 'none',
                        }),
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
                                ? isHighlightedMilestone
                                  ? 'linear-gradient(145deg, #1D9E75 0%, #2DD4BF 100%)'
                                  : '#1D9E75'
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
                      <Box sx={{ minWidth: 0 }}>
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
                                    ? isHighlightedMilestone
                                      ? '#0D766E'
                                      : 'var(--color-text-secondary)'
                                    : 'var(--color-text-primary)',
                            textDecoration:
                              item.status === 'done' ? 'line-through' : 'none',
                          }}
                        >
                          {item.label}
                        </Typography>
                        {/* <Typography
                          sx={{
                            fontSize: isSales ? 11 : 10,
                            mt: 0.25,
                            fontWeight: isSales ? 500 : 400,
                            color:
                              item.status === 'warn'
                                ? '#E24B4A'
                                : item.variant === 'host'
                                  ? '#2563EB'
                                  : isSales && item.status === 'done'
                                    ? '#0F766E'
                                    : 'var(--color-text-secondary)',
                          }}
                        >
                          {item.due}
                        </Typography> */}
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            </WorkspaceCard>

            <WorkspaceCard
              title="Find vendors & friends"
              action={
                <Button
                  variant="text"
                  onClick={() => setIsBrowseVendorsOpen(true)}
                  sx={{ textTransform: 'none', color: '#D85A30', fontWeight: 600 }}
                >
                  Open directory
                </Button>
              }
            >
              <Typography
                sx={{
                  fontSize: 13,
                  display: 'none',
                  color: 'var(--color-text-secondary)',
                  mb: 1.5,
                }}
              >
                Strong hosts do not wait for help to arrive by luck. They line up the
                right person for the right gap while there is still time to recover.
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  background: 'var(--color-background-secondary)',
                  border: '0.5px solid var(--color-border-tertiary)',
                  borderRadius: '999px',
                  px: 1.75,
                  py: 1,
                  mb: 1.5,
                  color: 'var(--color-text-secondary)',
                }}
              >
                <Search size={14} />
                <Typography sx={{ fontSize: 13 }}>
                  Find a DJ, ask Karan to bring...
                </Typography>
              </Stack>

              <Stack spacing={1.5}>
                {vendorGroupsForWorkspace.map((group) => (
                  <Box key={group.title}>
                    <Typography
                      sx={{
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--color-text-secondary)',
                        mb: 0.75,
                      }}
                    >
                      {group.title}
                    </Typography>
                    <Stack spacing={1}>
                      {group.vendors.map((vendor) => {
                        const recommendedNeed = getRecommendedNeedForVendor(
                          eventNeeds,
                          vendor,
                        );
                        return (
                          <Box
                            key={vendor.name}
                            sx={{
                              border: '0.5px solid var(--color-border-tertiary)',
                              borderRadius: '16px',
                              p: 1.25,
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  fontSize: 11,
                                  fontWeight: 500,
                                  bgcolor: vendor.color,
                                }}
                              >
                                {vendor.avatar}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                                  {vendor.name}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: 10,
                                    color: 'var(--color-text-secondary)',
                                  }}
                                >
                                  {vendor.tag}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: 11,
                                    color: 'var(--color-text-secondary)',
                                    mt: 0.6,
                                    lineHeight: 1.45,
                                  }}
                                >
                                  Best current use:{' '}
                                  {recommendedNeed
                                    ? recommendedNeed.title
                                    : 'pick a need'}
                                  . {vendor.blurb}
                                </Typography>
                              </Box>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                  if (!recommendedNeed) return;
                                  openVendorActionDialog(
                                    vendor,
                                    recommendedNeed,
                                    'workspace',
                                  );
                                }}
                                disabled={!recommendedNeed}
                                sx={{
                                  ml: 'auto',
                                  minWidth: 'unset',
                                  borderRadius: '999px',
                                  px: 1.5,
                                  py: 0.5,
                                  fontSize: 11,
                                  textTransform: 'none',
                                  borderColor: vendor.accent
                                    ? '#D85A30'
                                    : 'var(--color-border-secondary)',
                                  color: vendor.accent
                                    ? '#D85A30'
                                    : 'var(--color-text-primary)',
                                }}
                              >
                                {vendor.action}
                              </Button>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </WorkspaceCard>

            <WorkspaceCard title="Co-organiser chat" action="">
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ mb: 1.5, justifyContent: 'flex-end' }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: 11,
                    fontWeight: 500,
                    bgcolor: '#D85A30',
                  }}
                >
                  P
                </Avatar>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: 11,
                    fontWeight: 500,
                    bgcolor: '#534AB7',
                  }}
                >
                  A
                </Avatar>
              </Stack>
              <Stack spacing={1}>
                {chatRows.map((row, index) => {
                  if (row.type === 'system') {
                    return (
                      <Box
                        key={`${row.text}-${index}`}
                        sx={{ display: 'flex', justifyContent: 'center' }}
                      >
                        <Box
                          sx={{
                            background: '#EAF3DE',
                            borderRadius: '16px',
                            px: 1.25,
                            py: 0.75,
                            fontSize: 11,
                            color: '#27500A',
                            textAlign: 'center',
                            width: '100%',
                          }}
                        >
                          {row.text}
                        </Box>
                      </Box>
                    );
                  }

                  const outgoing = row.type === 'outgoing';
                  return (
                    <Stack
                      key={`${row.text}-${index}`}
                      direction={outgoing ? 'row-reverse' : 'row'}
                      spacing={1}
                      alignItems="flex-start"
                    >
                      <Avatar
                        sx={{
                          width: 26,
                          height: 26,
                          fontSize: 9,
                          fontWeight: 500,
                          bgcolor: row.color,
                        }}
                      >
                        {row.avatar}
                      </Avatar>
                      <Box
                        sx={{
                          background: 'var(--color-background-secondary)',
                          borderRadius: outgoing
                            ? '16px 0 16px 16px'
                            : '0 16px 16px 16px',
                          px: 1.25,
                          py: 0.9,
                          fontSize: 12,
                          color: 'var(--color-text-primary)',
                          lineHeight: 1.45,
                          maxWidth: 200,
                        }}
                      >
                        {row.text}
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            </WorkspaceCard>
          </Stack>
        </Box>

        <Stack direction="row" justifyContent="flex-end" sx={{ pt: 2 }}>
          <Button
            variant="contained"
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
              px: 2.25,
              py: 1.2,
              textTransform: 'none',
              fontSize: 13,
              fontWeight: 500,
              background: '#D85A30',
              boxShadow: 'none',
            }}
          >
            Open chat
            <Box
              component="span"
              sx={{
                ml: 0.75,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                color: '#D85A30',
                display: 'grid',
                placeItems: 'center',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              2
            </Box>
          </Button>
        </Stack>

        <Stack direction="row" justifyContent="center" sx={{ pt: 2 }}>
          <Button
            variant="outlined"
            sx={{ borderRadius: '999px', textTransform: 'none' }}
          >
            Duplicate/Recurring event
          </Button>
        </Stack>
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
      {isBrowseVendorsOpen ? (
        <BrowseVendorsOverlay
          needs={eventNeeds}
          onClose={() => setIsBrowseVendorsOpen(false)}
          onActOnVendor={(vendor, need) =>
            openVendorActionDialog(vendor, need, 'overlay')
          }
        />
      ) : null}
      {reviewingNeed ? (
        <ReviewApplicantsOverlay
          need={reviewingNeed}
          onClose={() => setReviewingNeedId(null)}
          onApprove={async (applicationId) => {
            const application = reviewingNeed.applications.find(
              (item) => item.id === applicationId,
            );
            setActionDialog({
              type: 'assign',
              applicationId,
              needId: reviewingNeed.id,
              title: 'Assign this applicant',
              description:
                'This turns a promising application into a confirmed role. Use the message box if there is timing, compensation, or equipment context they should see before they commit.',
              confirmLabel: 'Confirm assignment',
              placeholder:
                'Optional note about call time, delivery expectations, or logistics.',
              targetLabel: `${application?.vendor_name || 'Applicant'} → ${reviewingNeed.title}`,
            });
          }}
          onReject={async (applicationId) => {
            await reviewNeedApplicationMutation.mutateAsync({
              applicationId,
              status: 'rejected',
            });
            toast.success('Application rejected');
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
