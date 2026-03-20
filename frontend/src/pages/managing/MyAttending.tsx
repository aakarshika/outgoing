import { Box, Stack } from '@mui/material';
import { Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FallbackBox } from '@/components/ui/FallbackBox';
import { ServiceTicketCard } from '@/components/events/ServiceTicketCard';
import type { ManagingItem } from './MyUpcoming';

interface MyAttendingProps {
  attendingItems: ManagingItem[];
}

export function MyAttending({ attendingItems }: MyAttendingProps) {
  const navigate = useNavigate();
  return (
    <Box>
      {attendingItems.length === 0 ? (
        <FallbackBox
          title="No upcoming attendances"
          description="Find events you're interested in and start attending."
          icon={<Ticket />}
          actionLabel="Browse events"
          onAction={() => navigate('/search')}
        />
      ) : (
        <Stack spacing={0}>
          {attendingItems.map((item) => (
            <ServiceTicketCard key={item.id} item={item} />
          ))}
        </Stack>
      )}
    </Box>
  );
}