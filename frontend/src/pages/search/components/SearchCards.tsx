import { Box, Typography } from '@mui/material';

import type { EventListItem } from '@/types/events';
import type { VendorOpportunity } from '@/types/needs';

import type { SearchTabId } from '../searchTypes';
import {
  formatEventDayLabel,
  formatEventTimeLabel,
  getCountdownLabel,
  getLowestTicketPrice,
  getRoleGroup,
  isOnlineEvent,
} from '../searchUtils';

export function EventCard({
  event,
  tab,
  onClick,
}: {
  event: EventListItem;
  tab: SearchTabId;
  onClick: () => void;
}) {
  const online = isOnlineEvent(event);
  const accent = online ? '#1D9E75' : '#D85A30';
  const price = getLowestTicketPrice(event);
  const countdown = getCountdownLabel(event.start_time);
  const showTimeHero = tab === 'tonight-weekend';
  const showPriceHero = tab === 'free-cheap';
  const showAttendanceHero = tab === 'trending';
  const showPlatformHero = tab === 'online';
  const hasTrendingBadge = event.ticket_count + event.interest_count >= 35;

  return (
    <Box
      onClick={onClick}
      sx={{
        border: '1px solid rgba(17,24,39,0.08)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 0,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 260,
      }}
    >
      {event.cover_image ? (
        <Box
          component="img"
          src={event.cover_image}
          alt={event.title}
          sx={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
        />
      ) : null}

      <Box sx={{ p: 1.6, display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1,
            alignItems: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6b7280',
            }}
          >
            {event.category?.name || 'Event'}
          </Typography>
          <Box
            sx={{
              px: 0.9,
              py: 0.35,
              borderRadius: '999px',
              fontSize: 10,
              fontWeight: 600,
              color: online ? '#085041' : '#7a271a',
              backgroundColor: online ? '#E1F5EE' : '#FAECE7',
            }}
          >
            {online ? 'Online' : 'In person'}
          </Box>
        </Box>

        {showAttendanceHero ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Box
              sx={{
                px: 1,
                py: 0.45,
                borderRadius: '999px',
                backgroundColor: '#EAF3DE',
                color: '#3B6D11',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {event.ticket_count} going
            </Box>
            {hasTrendingBadge ? (
              <Box
                sx={{
                  px: 1,
                  py: 0.45,
                  borderRadius: '999px',
                  backgroundColor: '#FCEBEB',
                  color: '#A32D2D',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                Trending
              </Box>
            ) : null}
          </Box>
        ) : null}

        {showTimeHero ? (
          <Box>
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 18,
                fontWeight: 700,
                color: '#111827',
              }}
            >
              {formatEventDayLabel(event.start_time)} /{' '}
              {formatEventTimeLabel(event.start_time)}
            </Typography>
            {countdown ? (
              <Typography sx={{ fontSize: 11, color: '#D85A30', fontWeight: 600 }}>
                {countdown}
              </Typography>
            ) : null}
          </Box>
        ) : null}

        {showPriceHero ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 18,
                fontWeight: 700,
                color: price === 0 ? '#3B6D11' : '#111827',
              }}
            >
              {price === 0 ? 'Free' : `Rs ${price}`}
            </Typography>
            <Box
              sx={{
                px: 1,
                py: 0.45,
                borderRadius: '999px',
                backgroundColor: '#FAEEDA',
                color: '#854F0B',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              Ticket
            </Box>
          </Box>
        ) : null}

        {showPlatformHero ? (
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 16,
              fontWeight: 700,
              color: '#085041',
            }}
          >
            Online
          </Typography>
        ) : null}

        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 15,
            lineHeight: 1.3,
            fontWeight: 700,
            color: '#111827',
          }}
        >
          {event.title}
        </Typography>

        {event.description ? (
          <Typography
            sx={{
              fontSize: 11,
              lineHeight: 1.45,
              color: '#6b7280',
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {event.description}
          </Typography>
        ) : null}

        {!online ? (
          <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
            {event.location_name}
          </Typography>
        ) : null}

        <Box
          sx={{
            mt: 'auto',
            pt: 1,
            borderTop: '1px solid rgba(17,24,39,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
            {showTimeHero
              ? event.location_name
              : `${formatEventDayLabel(event.start_time)} / ${formatEventTimeLabel(event.start_time)}`}
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              color: online ? '#085041' : '#D85A30',
            }}
          >
            {online ? 'Join' : 'View event'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export function OpportunityCard({
  opportunity,
  onClick,
}: {
  opportunity: VendorOpportunity;
  onClick: () => void;
}) {
  const rewardValue = opportunity.budget_max || opportunity.budget_min;
  const rewardLabel = rewardValue ? `Rs ${rewardValue}` : 'Reward TBD';
  const role = getRoleGroup(opportunity);
  const roleIcon =
    role === 'dj_music'
      ? 'DJ'
      : role === 'food_catering'
        ? 'FO'
        : role === 'photography'
          ? 'PH'
          : role === 'equipment'
            ? 'EQ'
            : role === 'venue'
              ? 'VE'
              : role === 'staffing'
                ? 'ST'
                : 'OT';

  return (
    <Box
      onClick={onClick}
      sx={{
        border: '1px solid rgba(17,24,39,0.08)',
        borderLeft: '3px solid #EF9F27',
        borderRadius: 0,
        backgroundColor: '#ffffff',
        p: 1.6,
        cursor: 'pointer',
        display: 'flex',
        gap: 1.4,
        alignItems: 'flex-start',
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 0,
          backgroundColor: '#FAEEDA',
          color: '#8C5B15',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {roleIcon}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 14,
                fontWeight: 700,
                color: '#111827',
                lineHeight: 1.3,
              }}
            >
              {opportunity.need_title}
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#6b7280', mt: 0.3 }}>
              {opportunity.event_title} /{' '}
              {formatEventDayLabel(opportunity.event_start_time)} /{' '}
              {formatEventTimeLabel(opportunity.event_start_time)}
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 15,
                fontWeight: 700,
                color: '#BA7517',
              }}
            >
              {rewardLabel}
            </Typography>
            <Typography sx={{ fontSize: 10, color: '#6b7280' }}>
              upon delivery
            </Typography>
          </Box>
        </Box>

        <Typography sx={{ fontSize: 11, color: '#6b7280', mt: 0.7, lineHeight: 1.45 }}>
          {opportunity.need_description || 'Open contributor slot for this event.'}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 1.2,
          }}
        >
          <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
            {opportunity.event_location_name}
          </Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#BA7517' }}>
            View role
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
