import { Avatar, Box, Chip, Stack, Typography } from '@mui/material';
import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';

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

  const nameColor = isIncoming ? '#2B2118' : 'rgba(43, 33, 24, 0.55)';
  const metaColor = isIncoming ? 'rgba(66, 50, 28, 0.55)' : 'rgba(66, 50, 28, 0.42)';
  const subtitleColor = isIncoming ? 'rgba(66, 50, 28, 0.68)' : 'rgba(66, 50, 28, 0.48)';
  const primaryActionColor = isIncoming ? '#D85A30' : 'rgba(83, 74, 183, 0.65)';
  const secondaryActionColor = isIncoming ? '#4A3827' : 'rgba(74, 56, 39, 0.55)';

  const primaryPending = Boolean((hasRealActions || hasSendRequest) && actionPending);
  const primaryHandler =
    hasRealActions
      ? isIncoming
        ? onAccept
        : onWithdraw
      : hasSendRequest
        ? () => onSendRequest!(suggestedEventId!, suggestedUsername!)
        : undefined;

  const actionTextSx = {
    border: 'none',
    background: 'none',
    padding: 0,
    margin: 0,
    font: 'inherit',
    fontFamily: 'inherit',
    fontSize: 12,
    lineHeight: 1.5,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.35,
    cursor: 'pointer' as const,
    textAlign: 'left' as const,
    '&:disabled': { opacity: 0.45, cursor: 'default' },
  };

  const badgeSx = isIncoming
    ? {
        height: 20,
        fontSize: 10,
        fontWeight: 600,
        bgcolor: `${request.color}1A`,
        color: request.color,
        border: 'none',
        '& .MuiChip-label': { px: 1 },
      }
    : {
        height: 20,
        fontSize: 10,
        fontWeight: 600,
        bgcolor: 'rgba(66, 50, 28, 0.06)',
        color: 'rgba(66, 50, 28, 0.5)',
        border: 'none',
        '& .MuiChip-label': { px: 1 },
      };

  const content = (
    <>
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Box sx={{ mt: '1px', flexShrink: 0, opacity: isIncoming ? 1 : 0.72 }}>
          <Avatar
            sx={{
              width: 30,
              height: 30,
              fontSize: 11,
              fontWeight: 700,
              bgcolor: request.color,
            }}
          >
            {request.initial}
          </Avatar>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 13,
              lineHeight: 1.5,
              fontWeight: isIncoming ? 600 : 500,
              color: nameColor,
            }}
          >
            {request.name}
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              lineHeight: 1.45,
              color: metaColor,
              mt: '1px',
            }}
          >
            {request.buddyType}
          </Typography>

          {request.primaryAction === 'Withdraw request' ? null : (<Chip label={request.badge} size="small" sx={{ mt: 0.75, ...badgeSx }} />)}

          <Typography
            sx={{
              fontSize: 13,
              lineHeight: 1.5,
              color: subtitleColor,
              mt: 0.75,
            }}
          >
            {request.subtitle}
          </Typography>

          <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} alignItems="center" sx={{ mt: 1 }}>
            {primaryHandler ? (
              <Box
                component="button"
                type="button"
                disabled={primaryPending}
                onClick={primaryHandler}
                sx={{
                  ...actionTextSx,
                  fontWeight: isIncoming ? 700 : 600,
                  color: primaryActionColor,
                }}
              >
                {request.primaryAction}
                {request.primaryAction === 'Withdraw request' ? (
                  <ArrowLeft size={14} aria-hidden />
                ) : (
                  <ArrowRight size={14} aria-hidden />
                )}
              </Box>
            ) : (
              <Typography
                component="span"
                sx={{
                  ...actionTextSx,
                  fontWeight: isIncoming ? 700 : 600,
                  color: primaryActionColor,
                  cursor: 'default',
                }}
              >
                {request.primaryAction}
                {request.primaryAction === 'Withdraw request' ? (
                  <ArrowLeft size={14} aria-hidden />
                ) : (
                  <ArrowRight size={14} aria-hidden />
                )}
              </Typography>
            )}
            {request.secondaryAction && request.secondaryAction === 'Not Now' ? (
              <Box
                component="button"
                type="button"
                onClick={onMessage}
                sx={{
                  ...actionTextSx,
                  fontWeight: 600,
                  color: secondaryActionColor,
                }}
              >
                Not Now
              </Box>
            ) : request.primaryAction === 'Withdraw request' ? null : (
              <Box
                component="button"
                type="button"
                onClick={onMessage}
                sx={{
                  ...actionTextSx,
                  fontWeight: 600,
                  color: secondaryActionColor,
                }}
              >
                <MessageCircle size={14} aria-hidden />
                Say hi first
              </Box>
            )}
          </Stack>
        </Box>
      </Stack>
    </>
  );

  if (isIncoming) {
    return (
      <Box
        sx={{
          borderRadius: '14px',
          p: '12px 14px',
          height: '100%',
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(216, 90, 48, 0.14)',
          boxShadow: '0 4px 18px rgba(43, 33, 24, 0.06)',
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        py: 0.75,
        pr: 0.5,
        height: '100%',
        background: 'transparent',
        boxShadow: 'none',
      }}
    >
      {content}
    </Box>
  );
}
