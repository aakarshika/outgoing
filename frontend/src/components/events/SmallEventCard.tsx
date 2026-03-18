import { Box, Stack, Typography } from '@mui/material';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks';
import { getCategoryTheme } from '@/features/events/CategoricalBackground';
import { getEventCardRoles, HostVendorBadge } from '@/features/events/scrapbookCard';
import {
  TicketStatusBadgeSimple,
} from '@/features/events/TicketStatusBadge';
import { EventStatusBadge } from '@/features/events/EventStatusBadge';
import type { EventListItem } from '@/types/events';

function formatCardDate(dateString: string | undefined | null) {
  if (!dateString) return '';
  const d = new Date(dateString);
  const day = d.toLocaleDateString(undefined, { weekday: 'short' });
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${day} · ${time}`;
}

function getCategoryIcon(categoryName: string | undefined | null) {
  const cat = (categoryName || '').toLowerCase();
  if (cat.includes('music')) return '🎶';
  if (cat.includes('food')) return '🍽️';
  if (cat.includes('art')) return '🎨';
  if (cat.includes('film')) return '🎞️';
  if (cat.includes('game')) return '🎮';
  if (cat.includes('well')) return '🧘';
  if (cat.includes('run') || cat.includes('sport') || cat.includes('outdoor'))
    return '🏃';
  return '✨';
}

export function SmallEventCard({
  event,
  sx,
}: {
  event: EventListItem;
  sx?: any;
}) {
  const { user, isAuthenticated } = useAuth();
  const categoryTheme = getCategoryTheme(event.category ?? undefined);
  const { isHost, isVendor } = getEventCardRoles(event, {
    user: user ?? null,
    isAuthenticated,
  });
  const isLive = event.lifecycle_state === 'live';

  return (
    <Box
      component={Link}
      to={`/events-new/${event.id}`}
      sx={[
        {
          position: 'relative',
          borderRadius: '22px',
          overflow: 'hidden',
          border: '1px solid rgba(143, 105, 66, 0.16)',
          background: 'rgba(255,255,255,0.9)',
          boxShadow: '0 18px 44px rgba(108, 71, 33, 0.08)',
          cursor: 'pointer',
          textDecoration: 'none',
          color: 'inherit',
          display: 'block',
          width: '100%',
          minWidth: 250,
          height: '100%',
          transition: 'transform 180ms ease, box-shadow 180ms ease',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: 6,
            background: `linear-gradient(180deg, ${categoryTheme.accent} 0%, ${categoryTheme.tape} 100%)`,
            zIndex: 3,
          },
          '&:hover': {
            boxShadow: '0 22px 52px rgba(108, 71, 33, 0.12)',
            transform: 'translateY(-1px)',
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box
        sx={{
          height: 118,
          position: 'relative',
          overflow: 'hidden',
          background: categoryTheme.bg || '#FAECE7',
        }}
      >
        {event.cover_image ? (
          <Box
            component="img"
            src={event.cover_image}
            alt={event.title}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
            }}
          >
            {getCategoryIcon(event.category?.name)}
          </Box>
        )}

        {isLive ? (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              zIndex: 2,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.7,
              px: 1,
              py: 0.55,
              borderRadius: '999px',
              background:
                'linear-gradient(135deg, rgba(255, 94, 98, 0.96) 0%, rgba(124, 58, 237, 0.96) 100%)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: '0 12px 24px rgba(124, 58, 237, 0.22)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#fff',
                boxShadow: '0 0 0 4px rgba(255,255,255,0.16)',
              }}
            />
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              Live Now
            </Typography>
          </Box>
        ) : null}

        {isHost || isVendor ? (
          <HostVendorBadge
            isHost={isHost}
            variant="short"
            bottomOffset={10}
            sx={{
              left: 10,
              bottom: isLive ? 10 : 10,
              zIndex: 2,
              boxShadow: '0 8px 18px rgba(43, 33, 24, 0.18)',
            }}
          />
        ) : null}
      </Box>

      <Stack spacing={1.1} sx={{ p: 1.6 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(66, 50, 28, 0.56)',
            }}
          >
            {event.category?.name || 'Event'}
          </Typography>
          {isLive ? null : <EventStatusBadge status={event.lifecycle_state} />}
        </Stack>
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 15,
            fontWeight: 700,
            lineHeight: 1.3,
            color: '#2B2118',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {event.title}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.7} sx={{ minWidth: 0 }}>
          <MapPin size={12} color={categoryTheme.accent} />
          <Typography
            sx={{
              fontSize: 11.5,
              color: 'rgba(66, 50, 28, 0.72)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {event.location_name || 'Location TBA'}
          </Typography>
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Typography sx={{ fontSize: 12, color: 'rgba(66, 50, 28, 0.68)' }}>
            {formatCardDate(event.start_time)}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <TicketStatusBadgeSimple
              ticketCount={event.ticket_count}
              capacity={event.capacity}
              highlighted={event.user_has_ticket}
              sx={{
                fontSize: 10,
              }}
            />
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
