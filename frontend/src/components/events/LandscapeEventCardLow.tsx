import { Box, Button, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { BoxIcon, Calendar, Coins, MapPin, Users } from 'lucide-react';
import { type MouseEvent, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks';
import { getEventCardRoles, HostVendorBadge } from '@/features/events/scrapbookCard';
import type { BaseFeedEventItem, EventLifecycleState } from '@/types/events';
import { formatShortDate, formatTime } from '@/utils/date';
import { formatMoney } from '@/utils/money';

const IMAGE_SIZE = 64;

export function LandscapeEventCardLow({
  event,
  sx,
}: {
  event: BaseFeedEventItem;
  sx?: SxProps<Theme>;
}) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isHost, isVendor } = getEventCardRoles(event, {
    user: user ?? null,
    isAuthenticated,
  });
  const isLive = event.lifecycle_state === 'live';

  const lifecycleTone = useMemo(() => {
    const config: Record<EventLifecycleState, { label: string; bg: string; color: string }> = {
      draft: { label: 'Draft', bg: '#F1EFE8', color: '#7A736A' },
      published: { label: 'Collecting tickets', bg: '#FAECE7', color: '#993C1D' },
      at_risk: { label: 'Needs attention', bg: '#FAEEDA', color: '#854F0B' },
      postponed: { label: 'Postponed', bg: '#EEF2FF', color: '#3730A3' },
      event_ready: { label: 'Event ready', bg: '#E1F5EE', color: '#0F6E56' },
      live: { label: 'Live', bg: '#D1FAE5', color: '#065F46' },
      cancelled: { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B' },
      completed: { label: 'Completed', bg: '#F1EFE8', color: '#7A736A' },
    };
    return config[event.lifecycle_state] ?? config.published;
  }, [event.lifecycle_state]);

  const openNeedsCount = event.needs?.filter((need) => need.status !== 'fulfilled').length ?? 0;
  const ticketGoal = event.capacity ?? 0;
  const lowThreshold = ticketGoal > 0 && event.ticket_count < Math.ceil(ticketGoal * 0.65);
  const needsAttention = event.lifecycle_state === 'at_risk' || openNeedsCount > 0 || lowThreshold;
  const startDateLabel = formatShortDate(event.start_time) || 'Date TBD';
  const startTimeLabel = formatTime(event.start_time);

  const handleManageClick = useCallback(
    (clickEvent: MouseEvent<HTMLElement>) => {
      clickEvent.stopPropagation();
      navigate(`/events/${event.id}/manage`);
    },
    [event.id, navigate],
  );

  const handleCardClick = useCallback(
    (clickEvent: MouseEvent<HTMLElement>) => {
      if (clickEvent.defaultPrevented) return;
      const target = clickEvent.target as HTMLElement | null;
      if (
        target?.closest(
          'button, a, input, textarea, select, [role="button"], [data-card-action="true"]',
        )
      ) {
        return;
      }

      navigate(`/events-new/${event.id}`);
    },
    [event.id, navigate],
  );

  return (
    <Box
      onClick={handleCardClick}
      sx={[
        {
          mb: 1.2,
          minWidth: 0,
          background: '#fff',
          borderRadius: '18px',
          overflow: 'hidden',
          borderLeft: `4px solid ${
            event.lifecycle_state === 'live'
              ? '#10b981'
              : event.lifecycle_state === 'published'
                ? '#D85A30'
                : needsAttention
                  ? '#EF9F27'
                  : '#D3D1C7'
          }`,
          boxShadow: '0 8px 20px rgba(31, 24, 18, 0.06)',
          cursor: 'pointer',
          transition: 'transform 0.18s ease, box-shadow 0.18s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 14px 24px rgba(31, 24, 18, 0.1)',
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Stack direction="row" spacing={1.5} sx={{ p: 1.5 }}>
        <Box
          sx={{
            width: IMAGE_SIZE,
            height: IMAGE_SIZE,
            borderRadius: '12px',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
            bgcolor: '#F3ECE4',
          }}
        >
          {event.cover_image ? (
            <Box
              component="img"
              src={event.cover_image}
              alt={event.title}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <Box sx={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>🎉</Box>
          )}
        </Box>

        <Stack sx={{ flex: 1, minWidth: 0 }} spacing={0.7}>
          <Stack direction="row" alignItems="flex-start" spacing={1}>
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 14,
                fontWeight: 700,
                color: '#1A1A1A',
                lineHeight: 1.2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                flex: 1,
              }}
            >
              {event.title}
            </Typography>
            <Box
              sx={{
                px: 1,
                py: 0.35,
                borderRadius: '999px',
                fontSize: 10,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                bgcolor: lifecycleTone.bg,
                color: lifecycleTone.color,
              }}
            >
              {lifecycleTone.label}
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.2} sx={{ color: '#7B766E' }}>
            <Stack direction="row" alignItems="center" spacing={0.4}>
              <Calendar size={12} />
              <Typography sx={{ fontSize: 11 }}>
                {startDateLabel}
                {startTimeLabel ? ` · ${startTimeLabel}` : ''}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.4} sx={{ minWidth: 0 }}>
              <MapPin size={12} />
              <Typography
                sx={{
                  fontSize: 11,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {event.location_name || 'Location TBD'}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>

      {(isLive || isHost || isVendor) && (
        <Stack
          direction="row"
          spacing={0.8}
          sx={{
            px: 1.5,
            pb: 1,
            flexWrap: 'wrap',
          }}
        >
          {isLive ? (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.45,
                borderRadius: '999px',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#fff',
                background: 'linear-gradient(135deg,#ff5e62,#7c3aed)',
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#fff' }} />
              Live
            </Box>
          ) : null}
          {isHost || isVendor ? (
            <HostVendorBadge
              isHost={isHost}
              variant="short"
              sx={{
                position: 'static',
                bottom: 'auto',
                left: 'auto',
                boxShadow: 'none',
                px: 1,
                py: 0.35,
                height: 'auto',
                borderRadius: '999px',
              }}
            />
          ) : null}
        </Stack>
      )}

      {needsAttention ? (
        <Box sx={{ px: 1.5, pb: 1 }}>
          <Box
            sx={{
              background: '#FAEEDA',
              borderRadius: '10px',
              px: 1.2,
              py: 0.85,
              fontSize: 12,
              color: '#633806',
            }}
          >
            {openNeedsCount > 0
              ? `${openNeedsCount} open ${
                  openNeedsCount === 1 ? 'need' : 'needs'
                } still unfilled`
              : 'Ticket pace is below target, monitor closely'}
          </Box>
        </Box>
      ) : null}

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          px: 1.5,
          py: 1,
          borderTop: '0.5px solid #F0EDE8',
        }}
      >
        <Stack direction="row" spacing={1.8}>
          <Box>
            <Typography sx={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, lineHeight: 1 }}>
              {event.ticket_count}
            </Typography>
            
            <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, fontSize: 9, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Users size={12} />Going
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, lineHeight: 1 }}>
              {event.capacity ?? '∞'}
            </Typography>
            
            <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, fontSize: 9, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <BoxIcon size={12} />Capacity
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, lineHeight: 1 }}>
              {formatMoney(event.tickets_sold_count * event.min_ticket_price)}
            </Typography>
            <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, fontSize: 9, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Coins size={12} />
            Revenue
            </Typography>
          </Box>
        </Stack>

        {isHost ? (
          <Button
            onClick={handleManageClick}
            size="small"
            sx={{
              minWidth: 0,
              px: 1.6,
              py: 0.8,
              borderRadius: '999px',
              textTransform: 'none',
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
              background: '#D85A30',
              '&:hover': { background: '#C24E28' },
            }}
          >
            Manage
          </Button>
        ) : (
          <Box sx={{ px: 1.2, py: 0.7, borderRadius: '999px', border: '0.5px solid #D3D1C7', fontSize: 11, color: '#1A1A1A' }}>
            View
          </Box>
        )}
      </Stack>
    </Box>
  );
}
