import { Box } from '@mui/material';

import { SmallEventCard } from '@/components/events/SmallEventCard';
import type { EventCardEvent } from '@/components/events/useEventCards';

import { SectionHeading } from './MyHomeSectionHeading';

type Props = {
  recommendedEvents: EventCardEvent[];
};

export function MyHomeRecommendationsSection({ recommendedEvents }: Props) {
  return (
    <Box>
      <SectionHeading eyebrow="Based on your interests" title="" />
      <Box
        sx={{
          display: 'flex',
          gap: 1.8,
          overflowX: 'auto',
          pb: 1,
          mt: 2,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {recommendedEvents.length > 0 ? (
          recommendedEvents.map((event) => (
            <SmallEventCard key={event.id} event={event} sx={{ minWidth: 260 }} />
          ))
        ) : (
          <Box
            sx={{
              p: 2,
              borderRadius: '24px',
              background: 'rgba(255,255,255,0.88)',
              border: '1px solid rgba(143, 105, 66, 0.12)',
              minWidth: 280,
            }}
          >
            No recommendations are available yet. The section stays in place so the UI
            does not collapse.
          </Box>
        )}
      </Box>
    </Box>
  );
}
