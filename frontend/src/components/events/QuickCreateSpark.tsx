import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ImagePlus,
  LocateFixed,
  MapPin,
  Sparkles,
  Tag,
  Ticket,
  X,
} from 'lucide-react';
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { EventFeaturesQuickForm } from '@/pages/events/components/manage-redesign/EventFeaturesQuickForm';
import type { TicketTier } from '@/pages/events/components/manage-redesign/TicketsAndCapacityForm';
import type { EventFeature } from '@/pages/events/manage/ManageDetailsSection';
import {
  canUseBrowserGeolocation,
  getCurrentCoordinates,
  type LocationSuggestion,
  reverseGeocodeCoordinates,
  searchLocation,
} from '@/utils/geolocation';
import { useEditEvent } from './useEditEvent';

type QuickCategory = {
  id: number;
  name: string;
  slug?: string;
};

export type QuickCreateAction = 'plan' | 'post' | 'tickets-more' | 'needs-more';

export type QuickCreateSubmitPayload = {
  title: string;
  description: string;
  categoryId: number;
  startTimeIso: string;
  endTimeIso: string;
  locationMode: 'offline' | 'online';
  locationName: string;
  locationAddress: string;
  latitude: string;
  longitude: string;
  onlineUrl: string;
  coverFile: File | null;
  ticketPriceStandard: string | null;
  capacity: string;
  ticketTiers: TicketTier[];
  features: EventFeature[];
  needsSeed?: string;
};

type StoryStep = {
  id: 'basics' | 'story' | 'timing' | 'location' | 'features' | 'seating' | 'finish';
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
};

function toLocalDateTimeValue(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function defaultStartTime() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(19, 0, 0, 0);
  return toLocalDateTimeValue(next);
}

function buildEndTimeFromDuration(startValue: string, durationHours: number) {
  if (!startValue) return '';
  const start = new Date(startValue);
  if (Number.isNaN(start.getTime())) return '';
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return toLocalDateTimeValue(end);
}

function buildPrimaryTicketTier(): TicketTier {
  return {
    name: 'Genral Admission',
    price: 0,
    admits: '1',
    max_passes_per_ticket: '6',
    capacity: '',
    description: '',
  };
}

function toTierCapacity(value: string): TicketTier['capacity'] {
  return value === '' ? '' : Number(value);
}

function buildVenueName(address: string) {
  return address.split(',')[0]?.trim() || 'TBD';
}

export function QuickCreateSpark({
  categories,
  isSubmitting,
  onSubmit,
  onClose,
}: {
  categories: QuickCategory[];
  layout?: 'page' | 'sheet';
  isSubmitting: boolean;
  onSubmit: (
    action: QuickCreateAction,
    payload: QuickCreateSubmitPayload,
  ) => Promise<void>;
  onClose?: () => void;
}) {
  const [storyStepIndex, setStoryStepIndex] = useState(0);


  const storySteps: StoryStep[] = [
    {
      id: 'basics',
      eyebrow: 'Scene 1',
      title: 'Name it and place the vibe.',
      description: '',
      accent: '#FAECE7',
    },
    {
      id: 'story',
      eyebrow: 'Scene 2',
      title: 'Give people a reason to care.',
      description: '',
      accent: '#FFF2D8',
    },
    {
      id: 'timing',
      eyebrow: 'Scene 3',
      title: 'Pick the actual date and time.',
      description: 'Use the calendar and time fields directly. No duplicate date copy.',
      accent: '#EEF5FF',
    },
    {
      id: 'location',
      eyebrow: 'Scene 4',
      title: 'Tell them where it happens.',
      description: 'In person should lock onto a real address and coordinates.',
      accent: '#EAF3DE',
    },
    {
      id: 'features',
      eyebrow: 'Scene 5',
      title: 'Show the feel of it.',
      description:
        'Pick the little details that tell people what this event feels like.',
      accent: '#FDF0DD',
    },
    {
      id: 'seating',
      eyebrow: 'Scene 6',
      title: 'Set the seating.',
      description:
        'Capacity first, ticket amount second, then preview the ticket itself.',
      accent: '#EEEDFE',
    },
    {
      id: 'finish',
      eyebrow: 'Scene 7',
      title: 'Do you need anything?',
      description:
        'If yes, plan it out. If not, post directly and let the interest roll in.',
      accent: '#FCE7D6',
    },
  ];

  const activeStoryStep = storySteps[storyStepIndex];


  const handleNext = () => {
    if (!validateStep(activeStoryStep.id as 'basics' | 'story' | 'features' | 'timing' | 'location' | 'seating')) return;
    setStoryStepIndex((current) => Math.min(current + 1, storySteps.length - 1));
  };

  const { renderBasicsSection,
    renderStorySection,
    renderTimingSection,
    renderLocationSection,
    renderFeaturesSection,
    renderSeatingSection,
    renderFinishSection,
    handleAction,
    validateStep,
    canContinueCurrentStep,
    isPublishReady,
  } = useEditEvent({
    event: null,
    activeStoryStep: activeStoryStep.id,
    onSubmit: onSubmit,
    isSubmitting: isSubmitting,
    isCreate: true,
  });


  const renderCurrentStorySection = () => {
    switch (activeStoryStep.id) {
      case 'basics':
        return renderBasicsSection();
      case 'story':
        return renderStorySection();
      case 'timing':
        return renderTimingSection();
      case 'location':
        return renderLocationSection();
      case 'features':
        return renderFeaturesSection();
      case 'seating':
        return renderSeatingSection();
      case 'finish':
        return renderFinishSection();
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background:
          'radial-gradient(circle at top left, rgba(255, 216, 173, 0.48), transparent 30%), linear-gradient(180deg, #FFF7EE 0%, #FFFDF9 38%, #F7F1FF 100%)',
        color: '#2B2118',
      }}
    >
      <Box
        sx={{
          px: 2,
          pt: 'max(18px, env(safe-area-inset-top))',
          pb: 1.5,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(66, 50, 28, 0.56)',
            }}
          >
            Create Event
          </Typography>
          {onClose ? (
            <Button
              type="button"
              onClick={onClose}
              sx={{
                minWidth: 0,
                width: 42,
                height: 42,
                borderRadius: '999px',
                color: '#2B2118',
              }}
              aria-label="Close quick create"
            >
              <X size={18} />
            </Button>
          ) : null}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${storySteps.length}, minmax(0, 1fr))`,
            gap: 0.75,
            mt: 1,
          }}
        >
          {storySteps.map((step, index) => (
            <Box
              key={step.id}
              sx={{
                height: 4,
                borderRadius: '999px',
                background:
                  index <= storyStepIndex ? '#2B2118' : 'rgba(66, 50, 28, 0.12)',
              }}
            />
          ))}
        </Box>
      </Box>

      <Box
        key={activeStoryStep.id}
        sx={{
          flex: 1,
          px: 2,
          pb: 2,
          overflowY: 'auto',
          '@keyframes quickCreateStorySlide': {
            from: {
              opacity: 0,
              transform: 'translateY(18px)',
            },
            to: {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
          animation: 'quickCreateStorySlide 240ms ease',
        }}
      >
        <Box
          sx={{
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 2.5,
          }}
        >
          <Box sx={{ display: 'inline-flex', pt: 0.5 }}>
            <Typography
              sx={{
                mt: 1,
                fontFamily: 'Syne, sans-serif',
                fontSize: 36,
                lineHeight: 1,
                fontWeight: 800,
                letterSpacing: '-0.05em',
                color: '#2B2118',
                maxWidth: 340,
              }}
            >
              {activeStoryStep.title}
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: 280,
            }}
          >
            {renderCurrentStorySection()}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          px: 2,
          pb: 'calc(20px + env(safe-area-inset-bottom))',
          pt: 1.5,
          borderTop: '1px solid rgba(143, 105, 66, 0.12)',
          background: 'rgba(255, 253, 249, 0.85)',
          backdropFilter: 'blur(14px)',
        }}
      >
        {activeStoryStep.id === 'finish' ? (
          <Stack spacing={1}>
            <Button
              type="button"
              onClick={() => setStoryStepIndex((current) => Math.max(current - 1, 0))}
              sx={{
                textTransform: 'none',
                color: 'rgba(66, 50, 28, 0.72)',
                alignSelf: 'center',
              }}
            >
              Back
            </Button>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1}>
            {storyStepIndex > 0 ? (
              <Button
                type="button"
                onClick={() =>
                  setStoryStepIndex((current) => Math.max(current - 1, 0))
                }
                sx={{
                  minWidth: 0,
                  width: 54,
                  borderRadius: '999px',
                  border: '1px solid rgba(143, 105, 66, 0.18)',
                  color: '#2B2118',
                }}
              >
                <ArrowLeft size={18} />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="contained"
              onClick={handleNext}
              disabled={!canContinueCurrentStep}
              sx={{
                flex: 1,
                borderRadius: '999px',
                py: 1.6,
                textTransform: 'none',
                background: '#D85A30',
                boxShadow: 'none',
                fontSize: 16,
                fontWeight: 700,
                '&:hover': {
                  background: '#C44C24',
                  boxShadow: 'none',
                },
              }}
            >
              Continue
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );


}
