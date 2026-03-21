import { AvatarGroup, Box, Button, Stack, Typography } from '@mui/material';

import type { NetworkActivityGroup } from '../types';
import { ActivityCard } from './ActivityCard';
import { SectionIntro } from './SectionIntro';
import { getCategoryTheme } from '@/features/events/CategoricalBackground';
import { FriendAvatar } from '@/features/events/FriendAvatar';

function activityCardKey(item: NetworkActivityGroup['items'][number]): string {
  if (item.event?.eventId != null) {
    return `event-${item.event.eventId}`;
  }
  return `activity-${item.text}`;
}


export type OrbitFriendAvatarRow = {
  userId: number;
  avatar: string | null;
};

export function NetworkActivitySection({
  activityGroups,
  isAuthenticated,
  onFindEvents,
  orbitFriendsByCategorySlug = {},
}: {
  activityGroups: readonly NetworkActivityGroup[];
  isAuthenticated: boolean;
  onFindEvents: () => void;
  /** Buddies grouped by `Friendship.orbit_category.slug` (from `/events/friendships/by-orbit-category/`). */
  orbitFriendsByCategorySlug?: Readonly<
    Record<string, readonly OrbitFriendAvatarRow[] | undefined>
  >;
}) {
  const totalActivities = activityGroups.reduce((n, g) => n + g.items.length, 0);

  const friendsInOrbitForGroup = (
    group: NetworkActivityGroup,
  ): readonly OrbitFriendAvatarRow[] => {
    if (group.slugKey === 'other') {
      return [];
    }
    return orbitFriendsByCategorySlug[group.slugKey] ?? [];
  };

  return (
    <Box
      sx={{
      }}
    >
      <SectionIntro eyebrow="Orbit" title="Your people, in motion." />
      <Stack spacing={2.4} sx={{ mt: 2 }}>
        {totalActivities === 0 ? (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 14, color: 'rgba(66,50,28,0.6)' }}>
              No recent activity yet.
            </Typography>
            {isAuthenticated ? (
              <Button
                variant="text"
                size="small"
                onClick={onFindEvents}
                sx={{ mt: 1, textTransform: 'none', fontWeight: 600, color: '#D85A30' }}
              >
                Find events
              </Button>
            ) : null}
          </Box>
        ) : (
          activityGroups.map((group) => {
            const theme = getCategoryTheme({ slug: group.slugKey });
            const accent = theme?.accent;
            const tape = theme?.tape;
            const categoryName = theme?.name ?? group.heading;
            return (
              <Box key={group.slugKey}>
                
                  <Typography
                    component="h3"
                    sx={{
                      fontSize: 15,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: accent,
                    }}
                  >
                    {categoryName}
                    <Box component="span" sx={{ fontWeight: 600, ml: 0.75, opacity: 0.85 }}>
                      ({group.items.length})
                    </Box>
                  </Typography>
                  <AvatarGroup
                    max={8}
                    sx={{
                      flexShrink: 0,
                      mt: '1px',
                      backgroundColor: tape,
                      '& .MuiAvatar-root': {
                        width: 30,
                        height: 30,
                        fontSize: 11,
                        fontWeight: 700,
                        borderWidth: 2,
                        borderColor: accent,
                      },
                    }}
                  >
                    {friendsInOrbitForGroup(group).map((row) => (
                      <FriendAvatar
                        userId={row.userId}
                        imageUrl={row.avatar ?? undefined}
                        size={40}
                        ringWidth={4}
                        key={`${group.slugKey}-${row.userId}`}
                        sx={{ ml: -1 }}
                      />
                    ))}
                  </AvatarGroup>
                <Stack spacing={1.2}>
                  {group.items.map((item) => (
                    <ActivityCard
                      key={`${group.slugKey}-${activityCardKey(item)}`}
                      item={item}
                      slug={group.slugKey}
                    />
                  ))}
                </Stack>
              </Box>
            );
          })
        )}
      </Stack>
    </Box>
  );
}
