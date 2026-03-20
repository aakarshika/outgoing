import { Box, CircularProgress, Stack } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';

import type { PlanningChecklistItem } from '@/features/events/planningChecklist';
import { useBaseFeed } from '@/features/events/hooks';
import type { BaseFeedEventItem } from '@/types/events';

import { Sparkles } from 'lucide-react';
import { FallbackBox } from '@/components/ui/FallbackBox';
import { LandscapeEventCardLow } from '@/components/events/LandscapeEventCardLow';

interface MyEventsProps {
  hostingItems: BaseFeedEventItem[];
  expandedHostingId: string | null;
  setExpandedHostingId: Dispatch<SetStateAction<string | null>>;
  nextChecklistByItemId: Map<string, PlanningChecklistItem | null>;
  onCreateEvent: () => void;
}

export function MyEvents({
  nextChecklistByItemId: _nextChecklistByItemId,
  onCreateEvent,
}: MyEventsProps) {
  const { data, isLoading } = useBaseFeed({
    sort: 'start_time',
    page_size: 100,
    include_host_drafts: true,
  });

  const hostingItems = ((data?.data as BaseFeedEventItem[] | undefined) || []).filter(
    (item) => item.i_am_host,
  ).map((item) => ({
    ...item,
    ...item.event
  }));

  return (
    <Box>
      {isLoading ? (
        <Box sx={{ py: 6, display: 'grid', placeItems: 'center' }}>
          <CircularProgress sx={{ color: '#D85A30' }} />
        </Box>
      ) : hostingItems.length === 0 ? (
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
            <Box
              key={item.id}
              sx={{
                opacity: item.lifecycle_state === 'completed' ? 0.78 : 1,
                position: 'relative',
              }}
            >
              <LandscapeEventCardLow event={item} />
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
