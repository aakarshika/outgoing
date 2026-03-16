import { Avatar, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { ArrowRight, MessageCircle } from 'lucide-react';

import type { BuddyRequestCard } from '../types';

export function RequestCard({
  request,
  onAccept,
  onWithdraw,
  onMessage,
  onSendRequest,
  suggestedEventId,
  suggestedUsername,
  actionPending,
}: {
  request: BuddyRequestCard;
  onAccept?: () => void;
  onWithdraw?: () => void;
  onMessage?: () => void;
  onSendRequest?: (eventId: number, username: string) => void;
  suggestedEventId?: number | null;
  suggestedUsername?: string;
  actionPending?: boolean;
}) {
  const isIncoming = request.kind === 'incoming';
  const hasRealActions = (isIncoming && onAccept) || (!isIncoming && onWithdraw);
  const hasSendRequest =
    !isIncoming && onSendRequest && suggestedEventId != null && suggestedUsername;

  return (
    <Box
      sx={{
        borderRadius: '18px',
        p: 2.1,
        height: '100%',
        background: isIncoming
          ? 'linear-gradient(180deg, #FFF9F5 0%, #FFFFFF 100%)'
          : 'linear-gradient(180deg, #FAF9FF 0%, #FFFFFF 100%)',
        boxShadow: isIncoming
          ? '0 16px 36px rgba(216, 90, 48, 0.08)'
          : '0 16px 36px rgba(83, 74, 183, 0.08)',
      }}
    >
      <Stack spacing={1.5} sx={{ height: '100%' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Stack direction="row" spacing={1.1} alignItems="center">
            <Avatar
              sx={{
                width: 44,
                height: 44,
                fontSize: 13,
                fontWeight: 700,
                bgcolor: request.color,
              }}
            >
              {request.initial}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#2B2118' }}>
                {request.name}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: 'rgba(66, 50, 28, 0.62)' }}>
                {request.buddyType}
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={request.badge}
            sx={{
              height: 24,
              background: isIncoming ? '#FAECE7' : '#EEEDFE',
              color: isIncoming ? '#993C1D' : '#534AB7',
              fontSize: 10.5,
              fontWeight: 700,
            }}
          />
        </Stack>

        <Typography
          sx={{
            fontSize: 13.5,
            lineHeight: 1.55,
            color: '#4A3827',
          }}
        >
          {isIncoming
            ? `${request.name} wants to be your "${request.buddyType}" buddy.`
            : `${request.name} looks like an easy fit for your "${request.buddyType}" circle.`}
        </Typography>

        <Typography
          sx={{
            fontSize: 12,
            lineHeight: 1.55,
            color: 'rgba(66, 50, 28, 0.68)',
          }}
        >
          {request.subtitle}
        </Typography>

        <Stack
          direction="row"
          spacing={0.9}
          useFlexGap
          flexWrap="wrap"
          sx={{ mt: 'auto' }}
        >
          <Button
            variant="contained"
            endIcon={<ArrowRight size={15} />}
            disabled={Boolean((hasRealActions || hasSendRequest) && actionPending)}
            onClick={
              hasRealActions
                ? isIncoming
                  ? onAccept
                  : onWithdraw
                : hasSendRequest
                  ? () => onSendRequest(suggestedEventId, suggestedUsername)
                  : undefined
            }
            sx={{
              borderRadius: '999px',
              textTransform: 'none',
              fontWeight: 700,
              background: isIncoming ? '#D85A30' : '#534AB7',
              boxShadow: 'none',
            }}
          >
            {request.primaryAction}
          </Button>
          {request.secondaryAction ? (
            <Button
              variant="contained"
              onClick={onMessage}
              sx={{
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 600,
                color: '#4A3827',
                background: '#F2E7DE',
                boxShadow: 'none',
              }}
            >
              {request.secondaryAction}
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<MessageCircle size={15} />}
              onClick={onMessage}
              sx={{
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 600,
                color: '#534AB7',
                background: '#EEE9FF',
                boxShadow: 'none',
              }}
            >
              Say hi first
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
