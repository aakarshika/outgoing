import { Box, Button, Stack, TextField, Typography } from '@mui/material';

import {
  X,
} from 'lucide-react';
import type { TicketTier } from '@/pages/events/components/manage-redesign/TicketsAndCapacityForm';
import type { EventFeature } from '@/pages/events/manage/ManageDetailsSection';

import { EventDetail } from '@/types/events';
import { useEditEvent } from './useEditEvent';

type QuickCategory = {
  id: number;
  name: string;
  slug?: string;
};

export type QuickCreateAction = 'plan' | 'post' | 'tickets-more' | 'needs-more';

export type QuickEditEventSubmitPayload = {
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

export function QuickEditEvent({
  categories,
  layout,
  isSubmitting,
  onSubmit,
  onClose,
  event,
}: {
  categories: QuickCategory[];
  layout: 'page' | 'sheet';
  isSubmitting: boolean;
  onSubmit: (
    action: QuickCreateAction,
    payload: QuickEditEventSubmitPayload,
  ) => Promise<void>;
  onClose?: () => void;
  event: EventDetail;
}) {
  const {
    renderBasicsSection,
    renderStorySection,
    renderTimingSection,
    renderLocationSection,
    renderFeaturesSection,
    renderTotalCapacitySection,
    handleAction,
    isPublishReady,
  } = useEditEvent({ event, onSubmit, isSubmitting, isCreate: false });

  return (
    <Box
      sx={{
        background: '#fffdf9',
        borderRadius: '28px',
        border: '0.5px solid rgba(143, 105, 66, 0.18)',
        boxShadow: '0 24px 64px rgba(92, 63, 31, 0.08)',
        p: 3,
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={1.1} sx={{ mb: 2.2 }}>
        <Typography
          sx={{
            fontSize: 14,
            lineHeight: 1.6,
            letterSpacing: '0.04em',
            color: 'rgba(66, 50, 28, 0.74)',
            maxWidth: 680,
          }}
        >
          EDIT EVENT
        </Typography>
        <Button
          type="button"
          variant="contained"
          onClick={() => onClose?.()}
          sx={{
            borderRadius: '999px',
            py: 1.35,
            textTransform: 'none',
            background: '#000000ff',
            boxShadow: 'none',
            '&:hover': {
              background: '#d8d8d8ff',
              boxShadow: 'none',
            },
          }}
        >
          <X />
        </Button>
      </Stack>

      <Stack spacing={2.2}>
        {[
          {
            title: 'Name it and place the vibe',
            content: renderBasicsSection(),
          },
          {
            title: 'Give people a reason to care',
            content: renderStorySection(),
          },
          {
            title: 'Pick the actual date and time',
            content: renderTimingSection(),
          },
          {
            title: 'Tell them where it happens',
            content: renderLocationSection(),
          },
          {
            title: 'Show the feel of it',
            content: renderFeaturesSection(),
          },
          {
            title: 'Total capacity',
            content: renderTotalCapacitySection(),
          },
        ].map((section) => (
          <Box
            key={section.title}
            sx={{
            }}
          >
            {section.content}
          </Box>
        ))}

        <Stack direction="row" spacing={1}>

          <Button
            type="button"
            variant="contained"
            // Quick edit should not flip lifecycle_state (post/publish) -
            // keep the current lifecycle and just update fields.
            onClick={() => void handleAction('plan')}
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              flex: 1,
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
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
