import { Box } from '@mui/material';

import { LargeEventCard } from '@/components/events/LargeEventCard';
import type { EventCardEvent } from '@/components/events/useEventCards';

import { SectionHeading } from './MyHomeSectionHeading';

type Props = {
  chipInEvents: EventCardEvent[];
};

export function MyHomeChipInSection({ chipInEvents }: Props) {
  if (chipInEvents.length === 0) {
    return null;
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <SectionHeading eyebrow="Chip in" title="Earn your way into the room" />
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
        {chipInEvents.map((event) => (
          <Box key={event.id} sx={{ minWidth: 320 }}>
            <LargeEventCard event={event} showNeeds />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
