import {
  Box,
  Container,
} from '@mui/material';
import { useRef } from 'react';

import { SmallEventCard } from '@/components/events/SmallEventCard';
import {
  useBaseFeed,
} from '@/features/events/hooks';
import type { BaseFeedEventItem } from '@/types/events';


export default function TestFeedPage() {
  const nearbySectionRef = useRef<HTMLDivElement | null>(null);

  const { data: nearbyResponse, isLoading: loadingNearby } = useBaseFeed({
    // sort: 'trending',
    page_size: 100,
  });

  const nearbyEvents = ((nearbyResponse?.data || []) as BaseFeedEventItem[]);


  return (
    <Box sx={{ background: '--#F9F9F9' }}>
      
      <Box
        sx={{
          height: '0.5px',
          background: 'var(--color-border-tertiary)',
          maxWidth: 960,
          mx: 'auto',
        }}
      />

      <Container
        ref={nearbySectionRef}
        maxWidth={false}
        sx={{ maxWidth: 1040, px: { xs: 2, md: 4 }, py: 6 }}
      >
          {nearbyEvents.map((event) => (
            <Box
              key={event.event.id}
              sx={{
                flex: '0 0 clamp(260px, 32vw, 320px)',
                minWidth: 0,
                scrollSnapAlign: 'start',
              }}
            >
              <SmallEventCard event={event.event} />
            </Box>
          ))}
      </Container>

    </Box>
  );
}
