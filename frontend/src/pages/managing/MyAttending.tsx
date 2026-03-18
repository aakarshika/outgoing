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
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2.5, md: 3.5 } }}>
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
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: '28px',
            background: 'rgba(255,255,255,0.88)',
            border: '1px solid rgba(143, 105, 66, 0.12)',
          }}
        >
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