import { Box } from '@mui/material';

import { CapacityInfographic } from '@/components/ui/CapacityInfographic';

export const AttendanceSection = ({ event }: { event: any }) => {
  return null;

  // We only show this in the right column if highlights are empty,
  // OR if highlights exist (in which case it's also in the right column but with different spacing)
  // The previous logic was a bit redundant as both rendered in the same right column in EventDetailPageNew.

  return (
    <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
      <CapacityInfographic
        capacity={event.capacity}
        filled={event.ticket_count}
        startDate={event.start_time}
      />
    </Box>
  );
};
