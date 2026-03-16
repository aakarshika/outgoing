import { Box, Stack, Typography } from '@mui/material';

import type { BuddyRequestCard, PendingRequestItem } from '../types';
import { RequestCard } from './RequestCard';
import { SectionIntro } from './SectionIntro';

export function PendingRequestsSection({
  actionPending,
  fallbackRequests,
  hasFetchedFriendships,
  incomingItems,
  isLoading,
  onAccept,
  onMessage,
  onWithdraw,
  outgoingItems,
}: {
  actionPending: boolean;
  fallbackRequests: readonly BuddyRequestCard[];
  hasFetchedFriendships: boolean;
  incomingItems: readonly PendingRequestItem[];
  isLoading: boolean;
  onAccept: (eventId: number | null, username: string) => void;
  onMessage: (username: string) => void;
  onWithdraw: (eventId: number | null, username: string) => void;
  outgoingItems: readonly PendingRequestItem[];
}) {
  if (!fallbackRequests.length && !incomingItems.length) return null;
  return (
    <Box
      sx={{
        borderRadius: '10px',
        p: { xs: 2, md: 2.4 },
        background: 'rgba(255,255,255,0.82)',
        boxShadow: '0 24px 50px rgba(110, 74, 36, 0.06)',
      }}
    >
      <SectionIntro
        eyebrow="Buddy Requests need a reply"
        title="Signals you should not leave hanging"
      />

      {isLoading ? (
        <Typography sx={{ mt: 2, color: 'rgba(66,50,28,0.5)', fontSize: 14 }}>
          Loading requests...
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 1.3,
            mt: 2,
          }}
        >
          {incomingItems.length > 0 ? (
            incomingItems.map((item) => (
              <RequestCard
                key={item.key}
                request={item.request}
                actionPending={actionPending}
                onAccept={() => onAccept(item.eventId, item.username)}
                onMessage={() => onMessage(item.username)}
              />
            ))
          ) : fallbackRequests.length > 0 ? (
            fallbackRequests.map((request) => (
              <RequestCard key={request.name} request={request} />
            ))
          ) : hasFetchedFriendships ? (
            <Typography sx={{ color: 'rgba(66,50,28,0.55)', fontSize: 14 }}>
              No pending requests right now.
            </Typography>
          ) : null}

          {outgoingItems.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(66, 50, 28, 0.5)',
                  mb: 1,
                }}
              >
                Your pending requests
              </Typography>
              <Stack direction="row" spacing={1.3} flexWrap="wrap" useFlexGap>
                {outgoingItems.map((item) => (
                  <RequestCard
                    key={item.key}
                    request={item.request}
                    actionPending={actionPending}
                    onWithdraw={() => onWithdraw(item.eventId, item.username)}
                  />
                ))}
              </Stack>
            </Box>
          ) : null}
        </Box>
      )}
    </Box>
  );
}
