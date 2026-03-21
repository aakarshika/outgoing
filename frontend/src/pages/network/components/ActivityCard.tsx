import { AvatarGroup, Box, Chip, Stack, Typography } from '@mui/material';
import { ArrowRight, Clock3 } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { ActivityEventCard } from '@/components/events/ActivityEventCard';
import { FriendAvatar } from '@/features/events/FriendAvatar';
import type { BaseFeedEventItem } from '@/types/events';

import type { ActivityItem } from '../types';
import type { NetworkActivityAttendee } from '@/features/events/api';

// Action type → pill colour mapping
const ACTION_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  going: { bg: '#EAF3DE', color: '#3B6D11', label: 'Going' },
  hosting: { bg: '#FAECE7', color: '#993C1D', label: 'Hosting' },
  servicing: { bg: '#FAEEDA', color: '#854F0B', label: 'Servicing' },
  chipping: { bg: '#FAEEDA', color: '#854F0B', label: 'Chipping in' },
  interested: { bg: '#E6F1FB', color: '#185FA5', label: 'Interested' },
};

function dominantActionType(
  item: ActivityItem,
): 'hosting' | 'going' | 'servicing' | 'interested' | undefined {
  if (item.actionType) return item.actionType;
  const atts = item.relevantAttendees ?? [];
  for (const att of atts) {
    if (att.activities.includes('hosting')) return 'hosting';
  }
  for (const att of atts) {
    if (att.activities.includes('servicing')) return 'servicing';
  }
  for (const att of atts) {
    if (att.activities.includes('going')) return 'going';
  }
  return undefined;
}

/** Avatars: prefer API attendees; fall back to goerIds for layout. */
function attendeesForAvatars(item: ActivityItem): NetworkActivityAttendee[] {
  if (item.relevantAttendees?.length) {
    return [...item.relevantAttendees];
  }
  return (item.goerIds ?? []).map((id) => ({
    user_id: id,
    username: '',
    first_name: '',
    last_name: '',
    avatar: null,
    role: 'friend',
    activities: [] as ('going' | 'hosting' | 'servicing')[],
    primary_activity: null,
  }));
}

export function ActivityCard({
  item,
  onCtaClick,
  slug,
}: {
  item: ActivityItem;
  onCtaClick?: (eventId?: number) => void;
  slug: string;
}) {
  const navigate = useNavigate();
  const actionKey = dominantActionType(item);
  const actionStyle = actionKey ? ACTION_STYLES[actionKey] : undefined;

  const handleEventClick = () => {
    if (item.event?.eventId != null) {
      navigate(`/events/${item.event.eventId}`);
    } else {
      onCtaClick?.(undefined);
    }
  };

  const avatars = useMemo(() => attendeesForAvatars(item), [item]);
  const multiAvatar = avatars.length > 1;

  return (
    <Box
      sx={{
        borderRadius: '14px',
        p: '12px 14px',
        background: 'rgba(255,255,255,0.92)',
      }}
    >
      {/* TOP ROW — avatar · text · action pill */}
      <Stack
        direction="row"
        spacing={1.25}
        alignItems="flex-start"
        sx={{ mb: item.event ? 1 : 0 }}
      >
        {multiAvatar ? (
          <AvatarGroup
            max={4}
            sx={{
              flexShrink: 0,
              mt: '1px',
              '& .MuiAvatar-root': {
                width: 30,
                height: 30,
                fontSize: 11,
                fontWeight: 700,
                borderWidth: 2,
                borderColor: item.category_color,
                bgcolor: 'transparent',
                overflow: 'visible',
              },
            }}
          >
            {avatars.slice(0, 3).map((att, idx) => (
              <FriendAvatar
                key={att.user_id}
                userId={att.user_id}
                size={26}
                ringWidth={4}
                imageUrl={att.avatar}
                sx={{ mt: idx%2 === 0 ? 1 : 3, ml: -2 }}
              />
            ))}
          </AvatarGroup>
        ) : (
          <Box sx={{ mt: '1px', flexShrink: 0 }}>
            {avatars[0] ? (
              <FriendAvatar
                userId={avatars[0].user_id}
                size={30}
                ringWidth={4}
                imageUrl={avatars[0].avatar}
              />
            ) : null}
          </Box>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={1}
          >
            <Typography
              sx={{
                fontSize: 13,
                lineHeight: 1.5,
                color: '#2B2118',
                flex: 1,
                minWidth: 0,
                // pl: multiAvatar ? Math.min(avatars.length, 3)/2 : 0,
                pl: 0,
              }}
            >
              {item.text}
            </Typography>

            {actionStyle ? (
              <Chip
                label={actionStyle.label}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  fontWeight: 600,
                  bgcolor: actionStyle.bg,
                  color: actionStyle.color,
                  border: 'none',
                  flexShrink: 0,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            ) : (
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                sx={{ flexShrink: 0 }}
              >
                <Clock3 size={11} color="#8A7762" />
                <Typography
                  sx={{
                    fontSize: 11,
                    color: 'rgba(66,50,28,0.55)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.time}
                </Typography>
              </Stack>
            )}
          </Stack>

          {actionStyle && (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: '2px' }}>
              <Clock3 size={11} color="#8A7762" />
              <Typography sx={{ fontSize: 11, color: 'rgba(66,50,28,0.55)' }}>
                {item.time}
              </Typography>
            </Stack>
          )}
        </Box>
      </Stack>

      {/* EVENT MINI CARD */}
      {item.event && (
        <ActivityEventCard
          slug={slug}
          event={item.event as unknown as BaseFeedEventItem}
        />
      )}

      {/* BOTTOM CTA ROW */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography sx={{ fontSize: 11, color: '#888780', fontStyle: 'italic' }}>
          Here is more information about the event
        </Typography>

        {item.cta && (
          <Box
            onClick={handleEventClick}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: 12,
              fontWeight: 500,
              color: '#D85A30',
              cursor: 'pointer',
              userSelect: 'none',
              '&:hover': { opacity: 0.75 },
            }}
          >
            {item.cta}
            <ArrowRight size={13} />
          </Box>
        )}
      </Stack>
    </Box>
  );
}
