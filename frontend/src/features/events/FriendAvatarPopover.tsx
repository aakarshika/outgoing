import { ClickAwayListener, Popover } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

import { EVENT_ROLE_COLORS } from '@/constants/eventRoleColors';
import { useAuth } from '@/features/auth/hooks';
import {
  CATEGORY_THEMES,
  getCategoryThemeSlug,
} from '@/features/events/CategoricalBackground';
import { cn } from '@/lib/utils';
import {
  ProfileService,
  unwrapPublicProfileResponse,
} from '@/pages/profile/Profile.service';
import { type FriendshipItem } from './api';
import { useMyFriendships, useUserFriendshipsByOrbitCategory } from './hooks';

type PopoverProfile = {
  username: string;
  first_name?: string;
  last_name?: string;
  avatar?: string | null;
  attended_count?: number;
  hosted_count?: number;
  total_reviews?: number;
  services?: { id: number }[];
  badges?: Array<{ id: number; label: string; description?: string }>;
  access?: { can_view_full_profile?: boolean };
};

function displayName(p: PopoverProfile) {
  const full = `${p.first_name || ''} ${p.last_name || ''}`.trim();
  return full || p.username;
}

function soulMixFromProfile(
  p: PopoverProfile | null,
  canViewFull: boolean,
  attendedFallback: number,
  hostedFallback: number,
  servicesLen: number,
) {
  if (!p || !canViewFull) {
    return {
      goodTimesPct: 0,
      hustlePct: 0,
      thrownPct: 0,
      isLive: false,
    };
  }
  const goodTimes = p.attended_count ?? attendedFallback;
  const hustle = servicesLen;
  const thrown = p.hosted_count ?? hostedFallback;
  const total = goodTimes + hustle + thrown;
  if (total <= 0) {
    return {
      goodTimesPct: 100 / 3,
      hustlePct: 100 / 3,
      thrownPct: 100 / 3,
      isLive: true,
    };
  }
  return {
    goodTimesPct: (goodTimes / total) * 100,
    hustlePct: (hustle / total) * 100,
    thrownPct: (thrown / total) * 100,
    isLive: true,
  };
}

function themeColorsFromSlugs(slugs: string[]): string[] {
  if (!slugs.length) return [];
  return slugs.map(
    (s) => getCategoryThemeSlug(s)?.accent ?? CATEGORY_THEMES.default.accent,
  );
}

function conicGradient(colors: string[]): string {
  if (colors.length === 0)
    return 'conic-gradient(from 0deg, hsl(var(--muted)) 0deg 360deg)';
  if (colors.length === 1)
    return `conic-gradient(from 0deg, ${colors[0]} 0deg, ${colors[0]} 360deg)`;
  const stops = colors
    .map((c, i) => {
      const a = (i / colors.length) * 360;
      const b = ((i + 1) / colors.length) * 360;
      return `${c} ${a}deg ${b}deg`;
    })
    .join(', ');
  return `conic-gradient(from 0deg, ${stops})`;
}

export type FriendAvatarPopoverProps = {
  userId: number;
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
};

function sharedWithUser(
  friendship: FriendshipItem,
  currentUserId: number,
  targetUserId: number,
) {
  return (
    (friendship.user1 === currentUserId && friendship.user2 === targetUserId) ||
    (friendship.user2 === currentUserId && friendship.user1 === targetUserId)
  );
}

export function FriendAvatarPopover({
  userId,
  open,
  anchorEl,
  onClose,
}: FriendAvatarPopoverProps) {
  const { user, isAuthenticated } = useAuth();
  const isOpen = Boolean(open && anchorEl);
  const fetchFriendships = Boolean(open && isAuthenticated && user?.id);
  const { data: friendships } = useMyFriendships(fetchFriendships);
  const { data: targetOrbitData } = useUserFriendshipsByOrbitCategory(
    userId,
    isOpen && Boolean(userId),
  );

  const acceptedOrbitSlugs = useMemo(() => {
    if (!user?.id || !friendships?.accepted) return [] as string[];
    const slugs = new Set<string>();
    for (const friendship of friendships.accepted) {
      if (!sharedWithUser(friendship, user.id, userId)) continue;
      if (friendship.orbit_category_slug) slugs.add(friendship.orbit_category_slug);
    }
    return [...slugs];
  }, [friendships?.accepted, user?.id, userId]);

  const themeOrbitSlugs = acceptedOrbitSlugs;
  const themeColors = themeColorsFromSlugs(themeOrbitSlugs);
  const hasSharedOrbitTheme = themeColors.length > 0;
  const borderGradient = conicGradient(themeColors);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['friendAvatarPopover', userId],
    queryFn: async () => ProfileService.getPublicProfileByUserId(userId),
    enabled: isOpen && Boolean(userId),
  });

  const profile = (unwrapPublicProfileResponse(data) as PopoverProfile | null) ?? null;
  const canViewFull = Boolean(profile?.access?.can_view_full_profile);
  const servicesLen = profile?.services?.length ?? 0;
  const soul = soulMixFromProfile(profile, canViewFull, 0, 0, servicesLen);

  const handle = profile?.username;
  const showAvatar = `https://i.pravatar.cc/150?u=${userId}`;
  console.log('userId', userId, '--- friend avatar popover ---');

  const targetOrbitSlugs = useMemo(() => {
    const slugs = new Set<string>();
    for (const group of targetOrbitData?.grouped_friendships ?? []) {
      const slug = group.category?.slug;
      if (!slug || slug === 'other') continue;
      slugs.add(slug);
    }
    return [...slugs];
  }, [targetOrbitData?.grouped_friendships]);

  const inOrbitsFromGraph = targetOrbitSlugs.length;

  const statRows: { v: number; l: string }[] = [];
  if (canViewFull && profile) {
    const a = profile.attended_count;
    const h = profile.hosted_count;
    const r = profile.total_reviews;
    if (a != null && a > 0) statRows.push({ v: a, l: 'Attended' });
    if (h != null && h > 0) statRows.push({ v: h, l: 'Hosted' });
    if (r != null && r > 0) statRows.push({ v: r, l: 'Reviews' });
    if (servicesLen > 0) statRows.push({ v: servicesLen, l: 'Services' });
  }
  if (inOrbitsFromGraph > 0) {
    statRows.push({ v: inOrbitsFromGraph, l: 'In orbits' });
  }

  const orbitChips = targetOrbitSlugs
    .map((slug) => {
      const t = getCategoryThemeSlug(slug);
      if (!t) return null;
      return {
        slug,
        name: t.name,
        emoticon: t.emoticon,
        accent: t.accent,
        tape: t.tape,
      };
    })
    .filter(Boolean) as {
    slug: string;
    name: string;
    emoticon: string;
    accent: string;
    tape: string;
  }[];

  const primaryAccent = themeColors[0] ?? '#94A3B8';
  const soulColors = [
    EVENT_ROLE_COLORS.attending.dot,
    EVENT_ROLE_COLORS.servicing.dot,
    EVENT_ROLE_COLORS.hosting.dot,
  ];

  return (
    <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            className: 'overflow-visible bg-transparent shadow-none border-0',
            sx: { mt: 1, maxWidth: 'min(320px, calc(100vw - 24px))' },
          },
        }}
        disableRestoreFocus
      >
        <ClickAwayListener onClickAway={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="origin-top"
          >
            <div className="relative overflow-hidden rounded-2xl p-[2px] shadow-2xl shadow-black/10 dark:shadow-black/40">
            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2 z-0"
              style={{
                width: '180%',
                height: '180%',
                marginLeft: '-90%',
                marginTop: '-90%',
                background: borderGradient,
                opacity: hasSharedOrbitTheme ? 0.85 : 0.35,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            />
            <div
              className="relative z-[1] overflow-hidden rounded-[14px] border border-border/60 bg-card text-card-foreground"
              style={{
                backgroundImage: hasSharedOrbitTheme
                  ? `radial-gradient(120% 80% at 10% -20%, ${primaryAccent}22, transparent 55%), radial-gradient(90% 60% at 100% 0%, ${themeColors[themeColors.length - 1] ?? primaryAccent}18, transparent 50%)`
                  : 'radial-gradient(120% 80% at 10% -20%, rgba(148, 163, 184, 0.14), transparent 55%), radial-gradient(90% 60% at 100% 0%, rgba(148, 163, 184, 0.1), transparent 50%)',
              }}
            >
              <motion.div
                className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full blur-2xl"
                style={{ background: primaryAccent, opacity: 0.12 }}
                animate={{ scale: [1, 1.08, 1], opacity: [0.1, 0.16, 0.1] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div className="relative px-4 pb-3 pt-4">
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    className="relative mb-3"
                    initial={{ scale: 0.85 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 22,
                      delay: 0.05,
                    }}
                  >
                    <div
                      className="rounded-full p-[3px]"
                      style={{
                        background: hasSharedOrbitTheme
                          ? `linear-gradient(135deg, ${themeColors.join(', ')})`
                          : 'linear-gradient(135deg, rgba(148, 163, 184, 0.45), rgba(148, 163, 184, 0.2))',
                        boxShadow: hasSharedOrbitTheme
                          ? `0 0 0 1px hsl(var(--border) / 0.5), 0 12px 28px ${primaryAccent}33`
                          : '0 0 0 1px hsl(var(--border) / 0.5), 0 10px 22px rgba(148, 163, 184, 0.25)',
                      }}
                    >
                      <img
                        src={showAvatar}
                        alt=""
                        className="h-[72px] w-[72px] rounded-full object-cover"
                      />
                    </div>
                  </motion.div>

                {isLoading ? (
                  <div className="mb-1 h-5 w-36 animate-pulse rounded-md bg-muted" />
                ) : (
                  <motion.div
                    className="text-lg font-extrabold leading-tight tracking-tight text-foreground"
                    style={{ fontFamily: '"Syne", sans-serif' }}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                  >
                    {profile ? displayName(profile) : 'Friend'}
                  </motion.div>
                )}

                {handle ? (
                  <div className="mt-0.5 text-xs text-muted-foreground">@{handle}</div>
                ) : (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Tap connections to see more
                  </div>
                )}
aaaaaaaaa
                {profile?.badges && profile.badges.length > 0 ? (
                  <div className="mt-2 flex max-w-full flex-wrap justify-center gap-1.5">
                    {profile.badges.map((b, i) => (
                      <motion.span
                        key={b.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 * i + 0.06 }}
                        className={cn(
                          'inline-flex max-w-[11rem] truncate rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
                          'border border-border/80 bg-secondary/80 text-secondary-foreground',
                        )}
                        style={{
                          boxShadow: `0 0 0 1px ${primaryAccent}22`,
                          fontFamily: '"Syne", sans-serif',
                        }}
                        title={b.description}
                      >
                        {b.label}
                      </motion.span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-3">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Outgoing soul
                </div>
                <div
                  className={cn(
                    'flex h-1.5 overflow-hidden rounded-full bg-muted',
                    !soul.isLive && 'opacity-50',
                  )}
                >
                  <motion.div
                    className="h-full rounded-l-full"
                    style={{ backgroundColor: soulColors[0] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${soul.goodTimesPct}%` }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 26,
                      delay: 0.12,
                    }}
                  />
                  <motion.div
                    className="h-full"
                    style={{ backgroundColor: soulColors[1] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${soul.hustlePct}%` }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 26,
                      delay: 0.16,
                    }}
                  />
                  <motion.div
                    className="h-full rounded-r-full"
                    style={{ backgroundColor: soulColors[2] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${soul.thrownPct}%` }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 26,
                      delay: 0.2,
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
                  <span>Good times</span>
                  <span>Hustle</span>
                  <span>Thrown</span>
                </div>
              </div>

              {isError ? (
                <p className="mt-2 text-center text-xs text-destructive">
                  Couldn&apos;t load profile.
                </p>
              ) : null}

              {statRows.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {statRows.map((row, i) => (
                    <motion.div
                      key={row.l}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 * i + 0.1 }}
                      className="rounded-xl border border-border/70 bg-background/60 px-2.5 py-2 text-center backdrop-blur-sm"
                    >
                      <div
                        className="text-xl font-extrabold leading-none text-foreground"
                        style={{
                          fontFamily: '"Syne", sans-serif',
                          textShadow: `0 0 20px ${primaryAccent}33`,
                        }}
                      >
                        {row.v}
                      </div>
                      <div className="mt-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                        {row.l}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : null}

              {orbitChips.length > 0 ? (
                <div className="mt-3 border-t border-border/60 pt-3">
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Orbits
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {orbitChips.map((chip, i) => (
                      <motion.span
                        key={chip.slug}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.04 * i + 0.14 }}
                        className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-1 text-[10px] font-semibold"
                        style={{
                          backgroundColor: chip.tape,
                          color: chip.accent,
                          borderColor: `${chip.accent}44`,
                        }}
                      >
                        <span aria-hidden>{chip.emoticon}</span>
                        <span className="max-w-[9rem] truncate">{chip.name}</span>
                      </motion.span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
            </div>
          </motion.div>
        </ClickAwayListener>
      </Popover>
  );
}
