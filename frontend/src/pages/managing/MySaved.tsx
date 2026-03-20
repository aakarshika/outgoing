import { Box, CircularProgress, Grid } from '@mui/material';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SmallEventCard } from '@/components/events/SmallEventCard';
import { FallbackBox } from '@/components/ui/FallbackBox';
import { useMyInterestedEvents } from '@/features/events/hooks';
import type { EventListItem } from '@/types/events';

export function MySaved() {
  const navigate = useNavigate();
  const { data: interestedEventsResponse, isLoading } = useMyInterestedEvents();
  const savedEvents = (interestedEventsResponse?.data || []) as EventListItem[];

  if (isLoading) {
    return (
      <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#D85A30' }} />
      </Box>
    );
  }

  if (savedEvents.length === 0) {
    return (
      <FallbackBox
        title="No saved events"
        description="Events you mark as interested will appear here. Start exploring!"
        icon={<Heart />}
        actionLabel="Explore events"
        onAction={() => navigate('/search')}
      />
    );
  }

  return (
    <Box sx={{ px: { xs: 0.5, sm: 0 } }}>
      <Grid container spacing={1}>
        {savedEvents.map((event) => (
          <Box key={event.id} sx={{ width: '100%' }}>
            <SmallEventCard event={event as any} />
          </Box>
        ))}
      </Grid>
    </Box>
  );
}
