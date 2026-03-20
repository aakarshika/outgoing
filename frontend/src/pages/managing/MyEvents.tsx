import { Box, Stack, Typography } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';

import type { PlanningChecklistItem } from '@/features/events/planningChecklist';
import { ExpandableManagingEventCard } from './useManaging';
import type { ManagingItem } from './MyUpcoming';
import { ExpandableEventCardBox } from '@/components/events/ExpandableEventCardBox';
import { SmallEventCard } from '@/components/events/SmallEventCard';

import { Sparkles } from 'lucide-react';
import { FallbackBox } from '@/components/ui/FallbackBox';

interface MyEventsProps {
  hostingItems: ManagingItem[];
  expandedHostingId: string | null;
  setExpandedHostingId: Dispatch<SetStateAction<string | null>>;
  nextChecklistByItemId: Map<string, PlanningChecklistItem | null>;
  onCreateEvent: () => void;
}

export function MyEvents({
  hostingItems,
  expandedHostingId,
  setExpandedHostingId,
  nextChecklistByItemId,
  onCreateEvent,
}: MyEventsProps) {
  return (
    <Box>
      {hostingItems.length === 0 ? (
        <FallbackBox
          title="No hosted events"
          description="Create your first event and bring people together."
          icon={<Sparkles />}
          actionLabel="Create an event"
          onAction={onCreateEvent}
        />
      ) : (
        <Stack spacing={1.5}>
          {hostingItems.map((item) => (
            <Box key={item.id} sx={{
              opacity: item.isPast ? 0.72 : 1,
              position: 'relative',
            }}>
              <Box sx={{
                position: '',
                top: 0,
                right: 0,
                zIndex: 1,
              }} >
                <SmallEventCard
                  event={item.event as any} />
              </Box>

            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}