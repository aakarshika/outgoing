import { Box } from '@mui/material';

import { LargeEventCard } from '@/components/events/LargeEventCard';
import type { EventCardEvent } from '@/components/events/useEventCards';

import { SectionHeading } from './MyHomeSectionHeading';

type Props = {
  upcomingEvents: EventCardEvent[];
};

export function MyHomeUpcomingSection({ upcomingEvents }: Props) {
  if (upcomingEvents.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, md: 4 },
        borderBottom: '1px solid rgba(143, 105, 66, 0.10)',
        background:
          'linear-gradient(135deg, rgba(216,90,48,0.08) 0%, rgba(250,238,218,0.22) 60%, rgba(255,255,255,0.12) 100%)',
      }}
    >
      <SectionHeading eyebrow="Up next" title="Your next yes is getting closer" />
      <Box
        sx={{
          mt: 2,
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 1,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {upcomingEvents.map((event) => (
          <Box key={event.id} sx={{ minWidth: 320 }}>
            <LargeEventCard event={event} showNeeds />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
