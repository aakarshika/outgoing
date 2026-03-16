import { Box, Button, Stack, Typography } from '@mui/material';

import type { ActivityItem } from '../types';
import { ActivityCard } from './ActivityCard';
import { SectionIntro } from './SectionIntro';

export function NetworkActivitySection({
  activityItems,
  isAuthenticated,
  onFindEvents,
}: {
  activityItems: readonly ActivityItem[];
  isAuthenticated: boolean;
  onFindEvents: () => void;
}) {
  return (
    <Box
      sx={{
        borderRadius: '10px',
        p: { xs: 2, md: 2.4 },
        background: 'rgba(255,255,255,0.84)',
        boxShadow: '0 24px 50px rgba(110, 74, 36, 0.06)',
      }}
    >
      <SectionIntro
        eyebrow="Circle"
        title="The network is moving"
      />
      <Stack spacing={1.2} sx={{ mt: 2 }}>
        {activityItems.length === 0 ? (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 14, color: 'rgba(66,50,28,0.6)' }}>
              No recent activity yet.
            </Typography>
            {isAuthenticated ? (
              <Button
                variant="text"
                size="small"
                onClick={onFindEvents}
                sx={{ mt: 1, textTransform: 'none', fontWeight: 600, color: '#D85A30' }}
              >
                Find events
              </Button>
            ) : null}
          </Box>
        ) : (
          activityItems.map((item, index) => (
            <ActivityCard
              key={
                item.event?.eventId != null
                  ? `activity-${index}-${item.event.eventId}-${item.text}`
                  : `activity-${index}-${item.text}`
              }
              item={item}
            />
          ))
        )}
      </Stack>
    </Box>
  );
}
