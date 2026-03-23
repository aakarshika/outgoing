import { Box, type SxProps, type Theme } from '@mui/material';
import { useId, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/hooks';
import { FriendAvatarPopover } from '@/features/events/FriendAvatarPopover';

import { type FriendshipItem } from './api';
import { CATEGORY_THEMES } from './CategoricalBackground';
import { useMyFriendships } from './hooks';

type FriendAvatarProps = {
  userId: number;
  size?: number;
  ringWidth?: number;
  sx?: SxProps<Theme>;
  imageUrl?: string | null;
};

function sharedWithUser(friendship: FriendshipItem, currentUserId: number, targetUserId: number) {
  return (
    (friendship.user1 === currentUserId && friendship.user2 === targetUserId) ||
    (friendship.user2 === currentUserId && friendship.user1 === targetUserId)
  );
}

function polar(cx: number, cy: number, r: number, fractionFromTop: number) {
  const phi = -Math.PI / 2 + 2 * Math.PI * fractionFromTop;
  return [cx + r * Math.cos(phi), cy + r * Math.sin(phi)] as const;
}

export function FriendAvatar({
  userId,
  size = 36,
  ringWidth = 6,
  sx,
}: FriendAvatarProps) {
  const { user, isAuthenticated } = useAuth();
  const { data: friendships } = useMyFriendships(Boolean(isAuthenticated && user?.id));
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const rawId = useId().replace(/:/g, '');
  const gradId = `fa-grad-${rawId}`;

  const sharedAcceptedFriendships = useMemo(() => {
    if (!user?.id) {
      return [];
    }
    return (friendships?.accepted ?? []).filter((friendship) =>
      sharedWithUser(friendship, user.id, userId),
    );
  }, [friendships?.accepted, user?.id, userId]);

  const categories = useMemo(() => {
    const slugs = new Set<string>();
    for (const friendship of sharedAcceptedFriendships) {
      if (friendship.orbit_category_slug) {
        slugs.add(friendship.orbit_category_slug);
      }
    }
    return [...slugs];
  }, [sharedAcceptedFriendships]);

  const colors = useMemo(() => {
    return categories.map((slug) => CATEGORY_THEMES[slug]?.accent ?? CATEGORY_THEMES.default.accent);
  }, [categories]);

  const accentForShadow = colors[0] ?? null;
  const outer = size + ringWidth * 2;
  const sw = ringWidth;
  const r = 50 - sw / 2 - 0.5;
  const cx = 50;
  const cy = 50;
  const n = colors.length;
  const hasFriendshipColor = n > 0;
  console.log('userId', userId ,'--- friend avatar ---');

  const segmentPaths =
    n > 1
      ? colors.map((color, i) => {
          const [x1, y1] = polar(cx, cy, r, i / n);
          const [x2, y2] = polar(cx, cy, r, (i + 1) / n);
          const largeArc = (i + 1) / n - i / n > 0.5 ? 1 : 0;
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
              fill="none"
              stroke={color}
              strokeWidth={sw}
              strokeDasharray="6 7"
              strokeLinecap="round"
            />
          );
        })
      : null;

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={(e) => setAnchorEl(e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setAnchorEl(e.currentTarget);
        }
      }}
      sx={{
        position: 'relative',
        width: outer,
        height: outer,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        cursor: 'pointer',
        ...sx,
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 100 100"
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        {n === 1 ? (
          <>
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors[0]} stopOpacity={0.95} />
                <stop offset="55%" stopColor={colors[0]} stopOpacity={0.45} />
                <stop offset="100%" stopColor={colors[0]} stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={sw}
              strokeDasharray="6 7"
              strokeLinecap="round"
            />
          </>
        ) : (
          segmentPaths
        )}
      </Box>

      <Box
        component="img"
        src={`https://i.pravatar.cc/150?u=${userId}`}
        alt="friend avatar"
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          position: 'relative',
          zIndex: 1,
          boxShadow: hasFriendshipColor
            ? `0 0 0 2px rgba(255,255,255,0.95), 0 0 0 3px ${accentForShadow}33`
            : '0 0 0 2px rgba(255,255,255,0.95)',
        }}
      />

      <FriendAvatarPopover
        userId={userId}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
      />
    </Box>
  );
}
