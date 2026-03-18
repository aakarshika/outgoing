import { Box, Stack, Typography } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';

import { ExpandableManagingEventCard } from './useManaging';
import type { ManagingItem } from './MyUpcoming';

interface MyAttendingProps {
  attendingItems: ManagingItem[];
  expandedAttendingId: string | null;
  setExpandedAttendingId: Dispatch<SetStateAction<string | null>>;
}

export function MyAttending({
  attendingItems,
  expandedAttendingId,
  setExpandedAttendingId,
}: MyAttendingProps) {
  return (
    <Box>
      <Typography
        sx={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(66, 50, 28, 0.62)',
          mb: 2,
        }}
      >
        Your attending feed
      </Typography>

      {attendingItems.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 20,
              fontWeight: 800,
              color: '#2B2118',
            }}
          >
            No attending events yet
          </Typography>
          <Typography sx={{ mt: 1, fontSize: 14, color: 'rgba(66, 50, 28, 0.72)' }}>
            Events you have tickets for will appear here.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {attendingItems.map((item) => (
            <Box key={item.id} sx={{ opacity: item.isPast ? 0.72 : 1 }}>
              <ExpandableManagingEventCard
                item={item as any}
                expanded={expandedAttendingId === item.id}
                onToggle={() =>
                  setExpandedAttendingId((current) => (current === item.id ? null : item.id))
                }
              />
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}