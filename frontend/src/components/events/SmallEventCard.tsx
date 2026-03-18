import { Avatar, Box, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

import { getCategoryTheme } from '@/features/events/CategoricalBackground';
import {
  TicketStatusBadge,
  TicketStatusBadgeSimple,
} from '@/features/events/TicketStatusBadge';
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
  const categoryTheme = getCategoryTheme(event.category ?? undefined);
  const hostInitial = event.host.first_name?.[0] || event.host.username[0] || '?';
  const engagementCount = Math.max(event.ticket_count, event.interest_count);

  return (
    <Box
      component={Link}
      to={`/events-new/${event.id}`}
      sx={{
        borderRadius: '22px',
        overflow: 'hidden',
        border: '1px solid rgba(143, 105, 66, 0.16)',
        background: 'rgba(255,255,255,0.86)',
        boxShadow: '0 18px 44px rgba(108, 71, 33, 0.08)',
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        width: '100%',
        minWidth: 250,
        height: '100%',
        '&:hover': { boxShadow: '0 22px 52px rgba(108, 71, 33, 0.12)' },
        ...(Array.isArray(sx) ? sx : [sx]),
      }}
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
      </Box>

      <Stack spacing={1.1} sx={{ p: 1.6 }}>
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
