import { Box, Stack, Typography } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';

import type { PlanningChecklistItem } from '@/features/events/planningChecklist';
import { ExpandableManagingEventCard } from './useManaging';
import type { ManagingItem } from './MyUpcoming';

interface MyEventsProps {
  hostingItems: ManagingItem[];
  expandedHostingId: string | null;
  setExpandedHostingId: Dispatch<SetStateAction<string | null>>;
  nextChecklistByItemId: Map<string, PlanningChecklistItem | null>;
}

export function MyEvents({
  hostingItems,
  expandedHostingId,
  setExpandedHostingId,
  nextChecklistByItemId,
}: MyEventsProps) {
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
        All events
      </Typography>

      {hostingItems.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 20,
              fontWeight: 800,
              color: '#2B2118',
            }}
          >
            No events yet
          </Typography>
          <Typography sx={{ mt: 1, fontSize: 14, color: 'rgba(66, 50, 28, 0.72)' }}>
            Events you're hosting or servicing will appear here.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {hostingItems.map((item) => (
            <Box key={item.id} sx={{ opacity: item.isPast ? 0.72 : 1 }}>
              <ExpandableManagingEventCard
                item={item as any}
                expanded={expandedHostingId === item.id}
                nextChecklistItem={nextChecklistByItemId.get(item.id)}
                onToggle={() =>
                  setExpandedHostingId((current) => (current === item.id ? null : item.id))
                }
              />
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}