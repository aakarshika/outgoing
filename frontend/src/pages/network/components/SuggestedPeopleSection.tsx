import { Box, Stack } from '@mui/material';

import type { SuggestedRequestItem } from '../types';
import { RequestCard } from './RequestCard';
import { SectionIntro } from './SectionIntro';

export function SuggestedPeopleSection({
  items,
  onMessage,
  onSendRequest,
}: {
  items: readonly SuggestedRequestItem[];
  onMessage: (username: string) => void;
  onSendRequest: (eventId: number) => void;
}) {
  return (
    <Box
      sx={{
        borderRadius: '10px',
        p: { xs: 2, md: 2.4 },
        background: 'linear-gradient(180deg, #FFF5ED 0%, #FFFFFF 100%)',
        boxShadow: '0 24px 50px rgba(216, 90, 48, 0.08)',
      }}
    >
      <SectionIntro
        eyebrow="Quiet sparks"
        title="Suggested people to pull closer"
        description="A few people you almost met—good candidates to send a buddy request from the event you shared."
      />
      <Stack spacing={1.1} sx={{ mt: 2 }}>
        {items.map((item) => (
          <RequestCard
            key={item.key}
            request={item.request}
            onMessage={() => onMessage(item.messageTarget)}
            onSendRequest={
              item.suggestedEventId ? (eventId) => onSendRequest(eventId) : undefined
            }
            suggestedEventId={item.suggestedEventId}
            suggestedUsername={item.suggestedUsername}
          />
        ))}
      </Stack>
    </Box>
  );
}
