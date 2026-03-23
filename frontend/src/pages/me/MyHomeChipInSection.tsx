import { Box, Chip } from '@mui/material';

import { LargeEventCard } from '@/components/events/LargeEventCard';
import type { EventCardEvent } from '@/components/events/useEventCards';

import { SectionHeading } from './MyHomeSectionHeading';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type Props = {
  chipInEvents: EventCardEvent[];
};

export function MyHomeChipInSection({ chipInEvents }: Props) {
  if (chipInEvents.length === 0) {
    return null;
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <SectionHeading eyebrow="Chip in" title="Earn your way into the room" 
        action={
          <Chip
            component={Link}
            to={"/search?tab=chip-in"}
            clickable
            label={
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                }}
              >
                All
                <ArrowRight size={14} />
              </Box>
            }
            sx={{
              height: 34,
              borderRadius: '999px',
              px: 0.35,
              color: 'rgba(66, 50, 28, 0.68)',
              fontWeight: 700,
              textDecoration: 'none',
              '& .MuiChip-label': {
                px: 1.4,
              },
            }}
          />
        } />
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
