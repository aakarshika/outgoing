import { useQuery } from '@tanstack/react-query';
import { Box } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { Media } from '@/components/ui/media';
import { useAuth } from '@/features/auth/hooks';
import { useGlobalThreadChatDrawer } from '@/features/chat/GlobalThreadChatDrawerContext';
import { buildUserThreadKey } from '@/features/chat/threadKeyCodec';
import type { FriendshipItem } from '@/features/events/api';
import { CATEGORY_THEMES, getCategoryThemeSlug } from '@/features/events/CategoricalBackground';
import {
  useMyFriendships,
  useMyFriendshipsByOrbitCategory,
  useUserFriendshipsByOrbitCategory,
} from '@/features/events/hooks';

import { EVENT_ROLE_COLORS } from '@/constants/eventRoleColors';
import { JoinOrbitDialog, type JoinOrbitMode } from './JoinOrbitDialog';
import { ProfileService, unwrapPublicProfileResponse } from './Profile.service';
import { FriendAvatar } from '@/features/events/FriendAvatar';

type SharedEventPreview = {
  id: number;
  title?: string;
  orbit_category_slug?: string | null;
};

type ProfileAccess = {
  met_at_event_title?: string | null;
  orbit_category_slug?: string | null;
  shared_events?: SharedEventPreview[];
};

type ProfileEvent = {
  id: number;
  title: string;
  cover_image?: string | null;
  start_time?: string;
  category?: string;
  event_type?: string;
};

type PublicProfile = {
  username: string;
  user_id?: number;
  first_name?: string;
  last_name?: string;
  avatar?: string | null;
  cover_photo?: string | null;
  headline?: string | null;
  showcase_bio?: string | null;
  location_city?: string | null;
  attended_count?: number;
  hosted_count?: number;
  total_reviews?: number;
  attended_events?: ProfileEvent[];
  hosted_events?: ProfileEvent[];
  services?: Array<{
    id: number;
    title: string;
    portfolio_image?: string | null;
    category?: string;
  }>;
  badges?: Array<{ id: number; label: string; description?: string }>;
  access?: ProfileAccess;
};

const THUMB_BG = ['#FAECE7', '#FBEAF0', '#EAF3DE', '#FAEEDA', '#EEEDFE'];

function thumbBg(i: number) {
  return THUMB_BG[i % THUMB_BG.length];
}

function getDisplayName(profile: PublicProfile) {
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  return fullName || profile.username;
}

function getInitials(profile: PublicProfile) {
  const fn = profile.first_name?.trim();
  const ln = profile.last_name?.trim();
  if (fn && ln) return `${fn[0]}${ln[0]}`.toUpperCase();
  if (fn) return fn.slice(0, 2).toUpperCase();
  return profile.username.slice(0, 2).toUpperCase();
}

function getEventCategory(event: ProfileEvent) {
  return event.category || event.event_type || 'Event';
}

function getEventDate(startTime?: string) {
  if (!startTime) return 'Date TBC';
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return 'Date TBC';
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

const FONT_DM = '"DM Sans", sans-serif';
const FONT_SYNE = 'Syne, sans-serif';

function normalizeU(u: string) {
  return u.trim().toLowerCase();
}

function otherFriendUsername(f: FriendshipItem, currentUsername: string) {
  return normalizeU(f.user1_username) === normalizeU(currentUsername)
    ? f.user2_username
    : f.user1_username;
}

function findBuddyFriendshipForTargetOrbit(
  data:
    | {
      accepted: FriendshipItem[];
      pending_incoming: FriendshipItem[];
      pending_outgoing: FriendshipItem[];
    }
    | undefined,
  myUsername: string,
  targetUsername: string,
  categorySlug: string,
): FriendshipItem | undefined {
  if (!data) return undefined;
  const tn = normalizeU(targetUsername);
  const all = [...data.accepted, ...data.pending_incoming, ...data.pending_outgoing];
  return all.find(
    (f) =>
      normalizeU(otherFriendUsername(f, myUsername)) === tn &&
      f.orbit_category_slug === categorySlug,
  );
}

function pickSharedEventIdForOrbit(
  sharedEvents: SharedEventPreview[] | undefined,
  categorySlug: string,
): number | null {
  if (!sharedEvents?.length) return null;
  const row = sharedEvents.find((e) => e.orbit_category_slug === categorySlug);
  return row?.id ?? null;
}

function Placeholder({ children }: { children?: React.ReactNode }) {
  return (
    <Box
      sx={{
        color: '#a09080',
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 1.45,
        textAlign: 'center',
        py: 1.75,
        px: 1.5,
        bgcolor: 'rgba(255, 255, 255, 0.65)',
        borderRadius: '14px',
        border: '0.5px dashed #e0dad3',
      }}
    >
      {children}
    </Box>
  );
}

function StatValue({ value }: { value?: number | null }) {
  const show = value != null && value >= 0;
  return (
    <Box
      sx={{
        fontFamily: FONT_SYNE,
        fontSize: 18,
        fontWeight: 800,
        color: '#1a1208',
        lineHeight: 1,
      }}
    >
      {show ? String(value) : '—'}
    </Box>
  );
}

export default function UserProfileMockPage() {
  const { username: usernameParam } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const { openThread } = useGlobalThreadChatDrawer();
  const { user, isAuthenticated } = useAuth();
  const username = usernameParam?.trim() || '';
  const isSelfProfile = Boolean(
    user?.username && username && normalizeU(user.username) === normalizeU(username),
  );

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['publicProfile', 'mock', username],
    queryFn: () => ProfileService.getPublicProfile(username),
    enabled: Boolean(username),
  });

  const fetchOrbits = Boolean(isAuthenticated && user && username);

  const fetchSharedOrbitsWithProfile = Boolean(fetchOrbits && !isSelfProfile);
  const { data: friendshipsPayload, isLoading: friendshipsLoading } = useMyFriendships(
    fetchSharedOrbitsWithProfile,
  );

  const profile = unwrapPublicProfileResponse(response) as PublicProfile | null;
  const targetUsername = profile?.username || username;
  const targetUsernameNorm = targetUsername ? normalizeU(targetUsername) : '';

  const fetchSelfOrbits = Boolean(fetchOrbits && isSelfProfile);
  const fetchTargetOrbits = Boolean(fetchOrbits && !isSelfProfile && profile?.user_id);
  const { data: selfOrbitData, isLoading: selfOrbitLoading } =
    useMyFriendshipsByOrbitCategory(fetchSelfOrbits);
  const { data: targetOrbitData, isLoading: targetOrbitLoading } =
    useUserFriendshipsByOrbitCategory(profile?.user_id, fetchTargetOrbits);
  const orbitData = isSelfProfile ? selfOrbitData : targetOrbitData;
  const orbitLoading = isSelfProfile ? selfOrbitLoading : targetOrbitLoading;

  const dmThreadKey = useMemo(() => {
    if (!user?.id || profile?.user_id == null) return null;
    return buildUserThreadKey(user.id, profile.user_id);
  }, [user?.id, profile?.user_id]);

  const canMessage = Boolean(
    isAuthenticated &&
    username &&
    !isSelfProfile &&
    dmThreadKey &&
    profile?.user_id != null &&
    user?.id != null &&
    user.id !== profile.user_id,
  );

  const attendedEvents = profile?.attended_events ?? [];
  const hostedEvents = profile?.hosted_events ?? [];
  const services = profile?.services ?? [];

  const showLoading = Boolean(username) && isLoading;
  const showError = Boolean(username) && (error || (!isLoading && !profile));

  const displayName = profile ? getDisplayName(profile) : 'Preview';
  const handleLine = profile
    ? `@${profile.username}${profile.location_city ? ` · ${profile.location_city}` : ''}`
    : '@username';

  const metTitle = profile?.access?.met_at_event_title;

  const orbitGroups = useMemo(() => {
    const raw = orbitData?.grouped_friendships ?? [];
    return [...raw].sort((a, b) =>
      (a.category.name || '').localeCompare(b.category.name || '', undefined, {
        sensitivity: 'base',
      }),
    );
  }, [orbitData?.grouped_friendships]);

  /** EventCategory slugs from accepted `Friendship` rows with this profile user (`orbit_category`). */
  const sharedOrbitsWithThem = useMemo(() => {
    if (
      !fetchSharedOrbitsWithProfile ||
      !friendshipsPayload?.accepted ||
      !user?.username
    ) {
      return [];
    }
    const mine = user.username;
    const targetNorm = normalizeU(username);
    const bySlug = new Map<string, { slug: string; name: string; bg: string }>();
    for (const f of friendshipsPayload.accepted) {
      if (normalizeU(otherFriendUsername(f, mine)) !== targetNorm) continue;
      const slug = f.orbit_category_slug;
      if (!slug || !(slug in CATEGORY_THEMES)) continue;
      if (bySlug.has(slug)) continue;
      const theme = CATEGORY_THEMES[slug];
      const name = theme.name;
      bySlug.set(slug, { slug, name, bg: theme.bg });
    }
    return [...bySlug.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  }, [fetchSharedOrbitsWithProfile, friendshipsPayload, user, username]);

  const pendingOrbitsWithThem = useMemo(() => {
    if (!friendshipsPayload || !user?.username) return [];
    const mine = user.username;
    const tn = normalizeU(username);
    const bySlug = new Map<
      string,
      {
        slug: string;
        name: string;
        bg: string;
        accent: string;
        direction: 'incoming' | 'outgoing';
      }
    >();
    for (const f of friendshipsPayload.pending_incoming) {
      if (normalizeU(otherFriendUsername(f, mine)) !== tn) continue;
      const slug = f.orbit_category_slug;
      if (!slug || !(slug in CATEGORY_THEMES)) continue;
      if (bySlug.has(slug)) continue;
      const theme = CATEGORY_THEMES[slug];
      const name = theme.name;
      bySlug.set(slug, {
        slug,
        name,
        bg: theme.bg,
        accent: theme.accent,
        direction: 'incoming',
      });
    }
    for (const f of friendshipsPayload.pending_outgoing) {
      if (normalizeU(otherFriendUsername(f, mine)) !== tn) continue;
      const slug = f.orbit_category_slug;
      if (!slug || !(slug in CATEGORY_THEMES)) continue;
      if (bySlug.has(slug)) continue;
      const theme = CATEGORY_THEMES[slug];
      const name = theme.name;
      bySlug.set(slug, {
        slug,
        name,
        bg: theme.bg,
        accent: theme.accent,
        direction: 'outgoing',
      });
    }
    return [...bySlug.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  }, [friendshipsPayload, user, username]);

  const [joinOrbitSlug, setJoinOrbitSlug] = useState<string | null>(null);

  const joinOrbitSnapshot = useMemo(() => {
    if (!joinOrbitSlug || !user?.username) return null;
    const slug = joinOrbitSlug;
    const f = findBuddyFriendshipForTargetOrbit(
      friendshipsPayload,
      user.username,
      username,
      slug,
    );
    const theme = CATEGORY_THEMES[slug];
    if (!theme) return null;
    const catName = theme.name;
    let mode: JoinOrbitMode = 'send';
    let eventId: number | null = null;
    let preview: string | null = null;
    const shared = profile?.access?.shared_events;
    if (f) {
      preview = f.request_message?.trim() ? f.request_message : null;
      if (f.status === 'accepted') {
        mode = 'accepted';
      } else if (f.status === 'pending') {
        eventId = f.met_at_event ?? pickSharedEventIdForOrbit(shared, slug);
        mode =
          normalizeU(f.request_sender_username) === normalizeU(user.username)
            ? 'outgoing'
            : 'incoming';
      }
    }
    if (mode === 'send') {
      eventId = pickSharedEventIdForOrbit(shared, slug);
    }
    return {
      slug,
      mode,
      eventId,
      preview,
      categoryName: catName,
      categoryBg: theme.bg,
    };
  }, [
    joinOrbitSlug,
    user,
    friendshipsPayload,
    username,
    profile?.access?.shared_events,
  ]);

  const openJoinOrbit = useCallback((slug: string) => {
    if (slug && slug in CATEGORY_THEMES) setJoinOrbitSlug(slug);
  }, []);

  const closeJoinOrbit = useCallback(() => setJoinOrbitSlug(null), []);

  const viewerDisplayName =
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
    user?.username ||
    'You';

  const inOrbitsStat = useMemo(() => {
    if (!fetchOrbits || orbitLoading) return undefined;
    if (isSelfProfile) return orbitGroups.length;
    return orbitGroups.filter((row) =>
      row.friendships.some(
        (f) => normalizeU(f.friend.username) === targetUsernameNorm,
      ),
    ).length;
  }, [fetchOrbits, isSelfProfile, orbitGroups, orbitLoading, targetUsernameNorm]);

  /** Bar only: plain split of attended_count · services.length · hosted_count (badge uses `badges` elsewhere). */
  const soulMix = useMemo(() => {
    if (!profile) {
      return {
        goodTimesPct: 100 / 3,
        hustlePct: 100 / 3,
        thrownPct: 100 / 3,
        isLive: false,
      };
    }
    const goodTimes = profile.attended_count ?? attendedEvents.length;
    const hustle = services.length;
    const thrown = profile.hosted_count ?? hostedEvents.length;
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
  }, [profile, attendedEvents.length, services.length, hostedEvents.length]);

  const coverStyle =
    profile?.cover_photo && !showLoading && !showError
      ? {
        backgroundImage: `linear-gradient(180deg, rgba(26,18,8,0.5) 0%, rgba(26,18,8,0.2) 100%), url(${profile.cover_photo})`,
        backgroundSize: 'cover' as const,
        backgroundPosition: 'center' as const,
      }
      : undefined;

  const coverPhotoVisible = Boolean(
    profile?.cover_photo && !showLoading && !showError,
  );
  const decoOpacity = (base: number) => (coverPhotoVisible ? 0.35 : base);

  return (
    <Box
      sx={{
        m: 0,
        p: 0,
        pb: 3,
        bgcolor: '#ede8e2',
        fontFamily: FONT_DM,
        boxSizing: 'border-box',
        '&, & *': { boxSizing: 'border-box' },
      }}
    >
      <Box
        sx={{
          width: 360,
          minHeight: 720,
          bgcolor: '#f7f3ee',
          borderRadius: '40px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e0dad3',
          m: '24px auto',
          fontFamily: FONT_DM,
        }}
      >
        {!username && (
          <Box
            sx={{
              mx: 2,
              mb: 1.5,
              py: 1.25,
              px: 1.5,
              fontSize: 11,
              lineHeight: 1.4,
              color: '#5a4a3a',
              bgcolor: 'rgba(255, 255, 255, 0.85)',
              borderRadius: '12px',
              border: '0.5px solid #e0dad3',
            }}
          >
            Add a username to the URL to load live data, e.g.{' '}
            <strong>/mock/user-profile/jane</strong>. Below is layout preview with
            placeholders.
          </Box>
        )}

        {showLoading && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 280,
              fontSize: 13,
              color: '#a09080',
            }}
          >
            Loading profile…
          </Box>
        )}

        {showError && (
          <Box
            sx={{
              py: 4,
              px: 2.5,
              textAlign: 'center',
              fontSize: 13,
              color: '#5a4a3a',
              lineHeight: 1.5,
            }}
          >
            Couldn&apos;t load this profile. Check the username or try again later.
          </Box>
        )}

        {(!showLoading && !showError) || !username ? (
          <>
            <Box
              sx={{
                height: 130,
                bgcolor: '#1a1208',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
                ...(!showLoading && !showError && profile ? coverStyle : {}),
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  borderRadius: '50%',
                  width: 200,
                  height: 200,
                  background: '#D85A30',
                  opacity: decoOpacity(0.12),
                  top: -60,
                  right: -50,
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  borderRadius: '50%',
                  width: 120,
                  height: 120,
                  background: '#EF9F27',
                  opacity: decoOpacity(0.1),
                  bottom: -30,
                  left: 20,
                }}
              />
              <Box
                component="button"
                type="button"
                aria-label="Back"
                onClick={() => navigate(-1)}
                sx={{
                  position: 'absolute',
                  top: 14,
                  left: 14,
                  width: 32,
                  height: 32,
                  borderRadius: '10px',
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: 'none',
                  p: 0,
                  '& svg': {
                    width: 16,
                    height: 16,
                    stroke: '#fff',
                    strokeWidth: 2,
                    fill: 'none',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                  },
                }}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
              </Box>
              <Box
                component="button"
                type="button"
                aria-label="Menu"
                sx={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  width: 32,
                  height: 32,
                  borderRadius: '10px',
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: 'none',
                  p: 0,
                  '& svg': {
                    width: 16,
                    height: 16,
                    stroke: '#fff',
                    strokeWidth: 2,
                    fill: 'none',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                  },
                }}
              >
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1" fill="#fff" />
                  <circle cx="12" cy="12" r="1" fill="#fff" />
                  <circle cx="12" cy="19" r="1" fill="#fff" />
                </svg>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                px: 2,
                pb: 1.75,
                mt: -3.5,
                position: 'relative',
                zIndex: 2,
              }}
            >
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: '#d85a30',
                    border: '3px solid #f7f3ee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: FONT_SYNE,
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#fff',
                    position: 'relative',
                    zIndex: 1,
                    overflow: 'hidden',
                  }}
                >

                  <div
                    className="rounded-full p-[3px] h-full w-full"
                    style={{
                      background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.45), rgba(148, 163, 184, 0.2))',
                      boxShadow: '0 0 0 1px hsl(var(--border) / 0.5), 0 10px 22px rgba(148, 163, 184, 0.25)',
                    }}
                  >
                    <img
                      src={profile?.avatar || 'https://i.pravatar.cc/150?u=' + profile?.user_id}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>

                </Box>
              </Box>
              <Box
                component="button"
                type="button"
                onClick={() => {
                  if (canMessage && dmThreadKey) {
                    openThread({
                      threadKey: dmThreadKey,
                      title: displayName,
                      subtitle: profile ? `@${profile.username}` : undefined,
                    });
                  }
                }}
                disabled={!canMessage}
                sx={{
                  fontFamily: FONT_SYNE,
                  fontSize: 12,
                  fontWeight: 700,
                  py: 1.125,
                  px: 2.25,
                  borderRadius: 999,
                  border: 'none',
                  bgcolor: '#d85a30',
                  color: '#fff',
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  mb: 0.5,
                  '&:disabled': { opacity: 0.5, cursor: 'default' },
                }}
              >
                Message
              </Box>
            </Box>

            <Box sx={{ px: 2, pb: 1.5 }}>
              <Box
                sx={{
                  fontFamily: FONT_SYNE,
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#1a1208',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                {displayName}
              </Box>
              <Box sx={{ fontSize: 12, color: '#a09080', mt: 0.25 }}>
                {profile
                  ? `@${profile.username}${profile.location_city ? ` · ${profile.location_city}` : ''}`
                  : handleLine}
              </Box>

              <Box sx={{ mx: 2, mb: 1.75 }}>
                {profile?.badges?.map((badge) => (
                  <Box
                    key={badge.id}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mt: 0.75,
                      fontSize: 11,
                      fontWeight: 600,
                      py: 0.5,
                      px: 1.25,
                      borderRadius: 999,
                      bgcolor: '#faeeda',
                      color: '#633806',
                    }}
                  >
                    {badge.label}
                  </Box>
                ))}
              </Box>
              {metTitle ? (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    mt: 1,
                    bgcolor: '#eaf3de',
                    borderRadius: 999,
                    py: 0.625,
                    px: 1.5,
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#3b6d11',
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: '#1d9e75',
                      flexShrink: 0,
                    }}
                  />
                  Met at {metTitle}
                </Box>
              ) : null}
            </Box>

            <Box
              sx={{
                display: 'flex',
                mx: 2,
                mb: 1.75,
                bgcolor: '#fff',
                borderRadius: '14px',
                border: '0.5px solid #e0dad3',
                overflow: 'hidden',
              }}
            >
              {(
                [
                  { v: profile?.attended_count, l: 'Attended' },
                  { v: profile?.hosted_count, l: 'Hosted' },
                  { v: profile?.total_reviews, l: 'Reviews' },
                  { v: inOrbitsStat, l: 'In orbits' },
                ] as const
              ).map((row, i) => (
                <Box
                  key={row.l}
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    py: 1.25,
                    px: 1,
                    borderRight: i < 3 ? '0.5px solid #e0dad3' : 'none',
                  }}
                >
                  <StatValue value={row.v} />
                  <Box
                    sx={{
                      fontSize: 9,
                      color: '#a09080',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      mt: 0.25,
                    }}
                  >
                    {row.l}
                  </Box>
                </Box>
              ))}
            </Box>

            <Box sx={{ mx: 2, mb: 1.75 }}>
              <Box
                sx={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#a09080',
                  mb: 0.75,
                }}
              >
                Outgoing soul
              </Box>
              <Box
                sx={{
                  height: 5,
                  borderRadius: 999,
                  bgcolor: '#ede8e2',
                  overflow: 'hidden',
                  display: 'flex',
                  mb: 0.5,
                  opacity: soulMix.isLive ? 1 : 0.45,
                  '& > *': { flexShrink: 0, minWidth: 0 },
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${soulMix.goodTimesPct}%`,
                    bgcolor: EVENT_ROLE_COLORS.attending.dot,
                  }}
                />
                <Box
                  sx={{
                    height: '100%',
                    width: `${soulMix.hustlePct}%`,
                    bgcolor: EVENT_ROLE_COLORS.servicing.dot,
                  }}
                />
                <Box
                  sx={{
                    height: '100%',
                    width: `${soulMix.thrownPct}%`,
                    bgcolor: EVENT_ROLE_COLORS.hosting.dot,
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                {(['Good times', 'Hustle', 'Thrown'] as const).map((label) => (
                  <Box key={label} component="span" sx={{ fontSize: 9, color: '#b4b2a9' }}>
                    {label}
                  </Box>
                ))}
              </Box>
            </Box>

            <Box
              sx={{
                height: '1px',
                flexShrink: 0,
                bgcolor: '#e0dad3',
                mx: 2,
                mb: 1.75,
              }}
            />

            {!isSelfProfile ? (
              <>
                <Box sx={{ px: 2, mb: 1.75 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      alignItems: 'flex-start',
                      width: '100%',
                      '& > *:only-child': { width: '100%' },
                    }}
                  >
                    {!username ? (
                      <Placeholder> </Placeholder>
                    ) : !isAuthenticated ? (
                      <Placeholder> </Placeholder>
                    ) : friendshipsLoading ? (
                      <Box
                        sx={{
                          fontSize: 12,
                          color: '#a09080',
                          py: 1,
                          width: '100%',
                          textAlign: 'center',
                        }}
                      >
                        Loading…
                      </Box>
                    ) : sharedOrbitsWithThem.length === 0 &&
                      pendingOrbitsWithThem.length === 0 ? (
                      <Placeholder> </Placeholder>
                    ) : (
                      <>
                        {pendingOrbitsWithThem.length > 0 ? (
                          <Box sx={{ width: '100%', mb: 1.25 }}>
                            <Box
                              sx={{
                                fontFamily: FONT_SYNE,
                                fontSize: 13,
                                fontWeight: 800,
                                color: '#1a1208',
                                letterSpacing: '-0.01em',
                                mb: 0,
                              }}
                            >
                              Pending Orbit Requests
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.25 }}>
                              {pendingOrbitsWithThem.map((row) => {
                                const incoming = row.direction === 'incoming';
                                const themeSlug = getCategoryThemeSlug(row.slug);
                                return (
                                  <Box
                                    key={row.slug}
                                    component="button"
                                    type="button"
                                    onClick={() => openJoinOrbit(row.slug)}
                                    sx={{
                                      display: 'inline-flex',
                                      alignItems: 'flex-start',
                                      gap: 1.25,
                                      minWidth: 0,
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      font: 'inherit',
                                      ...(incoming
                                        ? {
                                          py: 1.5,
                                          px: 1.75,
                                          borderRadius: '14px',
                                          bgcolor: 'rgba(255, 255, 255, 0.92)',
                                          border: '1px solid rgba(216, 90, 48, 0.14)',
                                          boxShadow: '0 4px 18px rgba(43, 33, 24, 0.06)',
                                        }
                                        : {
                                          py: 0.75,
                                          pl: 0.5,
                                          pr: 1,
                                          borderRadius: 0,
                                          bgcolor: 'transparent',
                                          border: 'none',
                                          boxShadow: 'none',
                                        }),
                                    }}
                                  >
                                    <Box
                                      aria-hidden
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 30,
                                        height: 30,
                                        flexShrink: 0,
                                        mt: 0.125,
                                        borderRadius: '50%',
                                        bgcolor: themeSlug?.tape,
                                        opacity: incoming ? 1 : 0.72,
                                      }}
                                    >
                                      <Box
                                        component="span"
                                        sx={{
                                          fontFamily: FONT_SYNE,
                                          fontSize: 11,
                                          fontWeight: 700,
                                          lineHeight: 1,
                                          color: '#fff',
                                        }}
                                      >
                                        {themeSlug?.emoticon}
                                      </Box>
                                    </Box>
                                    <Box
                                      sx={{
                                        flex: 1,
                                        minWidth: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 0.25,
                                      }}
                                    >
                                      <Box
                                        component="span"
                                        sx={{
                                          fontSize: 13,
                                          lineHeight: 1.5,
                                          fontWeight: incoming ? 600 : 500,
                                          color:
                                            themeSlug?.accent ||
                                            (incoming ? '#2b2118' : 'rgba(43, 33, 24, 0.55)'),
                                        }}
                                      >
                                        {row.name}
                                      </Box>
                                      <Box
                                        component="span"
                                        sx={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 0.375,
                                          mt: 0.5,
                                          fontFamily: FONT_SYNE,
                                          fontSize: 12,
                                          lineHeight: 1.5,
                                          fontWeight: incoming ? 700 : 600,
                                          color: incoming
                                            ? '#d85a30'
                                            : 'rgba(83, 74, 183, 0.65)',
                                        }}
                                      >
                                        {incoming ? (
                                          <>
                                            From them
                                            <ArrowRight size={14} aria-hidden />
                                          </>
                                        ) : (
                                          <>
                                            You sent
                                            <ArrowLeft size={14} aria-hidden />
                                          </>
                                        )}
                                      </Box>
                                    </Box>
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>
                        ) : null}
                        {sharedOrbitsWithThem.length > 0 ? (
                          <Box
                            sx={{
                              width: '100%',
                              mt: pendingOrbitsWithThem.length > 0 ? 2 : 0,
                            }}
                          >
                            <Box
                              sx={{
                                fontFamily: FONT_SYNE,
                                fontSize: 13,
                                fontWeight: 800,
                                color: '#1a1208',
                                letterSpacing: '-0.01em',
                              }}
                            >
                              Orbits together
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.25 }}>
                              {sharedOrbitsWithThem.map((row) => {
                                const themeSlug = getCategoryThemeSlug(row.slug);
                                return (
                                  <Box
                                    key={row.slug}
                                    component="button"
                                    type="button"
                                    onClick={() => openJoinOrbit(row.slug)}
                                    sx={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 0.75,
                                      py: 1,
                                      px: 1.5,
                                      borderRadius: '12px',
                                      fontFamily: FONT_SYNE,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: themeSlug?.accent || '#1a1208',
                                      border: '0.5px solid rgba(224, 218, 211, 0.9)',
                                      bgcolor: 'rgba(255, 255, 255, 0.85)',
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      m: 0,
                                    }}
                                  >
                                    <Box
                                      aria-hidden
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 26,
                                        height: 26,
                                        borderRadius: '50%',
                                        bgcolor: themeSlug?.tape,
                                        fontSize: 12,
                                      }}
                                    >
                                      {themeSlug?.emoticon}
                                    </Box>
                                    {row.name}
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>
                        ) : null}
                      </>
                    )}
                  </Box>
                </Box>

                <Box
                  sx={{
                    height: '1px',
                    flexShrink: 0,
                    bgcolor: '#e0dad3',
                    mx: 2,
                    mb: 1.75,
                  }}
                />
              </>
            ) : null}

            <Box sx={{ px: 2, mb: 1.75 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1.25,
                }}
              >
                <Box
                  sx={{
                    fontFamily: FONT_SYNE,
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#1a1208',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {isSelfProfile ? 'Your orbits' : 'Their orbits'}
                </Box>
                {isSelfProfile ? null : (
                  <Box
                    component="button"
                    type="button"
                    onClick={() => navigate('/network')}
                    sx={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: '#d85a30',
                      cursor: 'pointer',
                      bgcolor: 'transparent',
                      border: 'none',
                      p: 0,
                      font: 'inherit',
                    }}
                  >
                    All orbits
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {!username ? (
                  <Placeholder> </Placeholder>
                ) : !isAuthenticated ? (
                  <Placeholder> </Placeholder>
                ) : orbitLoading ? (
                  <Box
                    sx={{
                      fontSize: 12,
                      color: '#a09080',
                      py: 1,
                      textAlign: 'center',
                    }}
                  >
                    Loading…
                  </Box>
                ) : orbitGroups.length === 0 ? (
                  <Placeholder> </Placeholder>
                ) : (
                  orbitGroups.map((row) => {
                    const friends = row.friendships.map((f) => f.friend);
                    const slug = row.category.slug;
                    if (!slug || !(slug in CATEGORY_THEMES)) return null;
                    const profileInOrbit =
                      !isSelfProfile &&
                      Boolean(targetUsernameNorm) &&
                      friends.some((f) => normalizeU(f.username) === targetUsernameNorm);
                    const faceSource = profileInOrbit
                      ? friends.filter((f) => normalizeU(f.username) !== targetUsernameNorm)
                      : friends;
                    const faces = faceSource.slice(0, 3);
                    const extra = Math.max(0, faceSource.length - 3);
                    const rowKey = `${row.category.id ?? 'cat'}-${slug}`;

                    const showJoinTheirOrbit =
                      !isSelfProfile && Boolean(targetUsernameNorm) && !profileInOrbit;
                    const themeSlug = getCategoryThemeSlug(slug);

                    return (
                      <Box
                        key={rowKey}
                        sx={{
                          bgcolor: '#fff',
                          borderRadius: '14px',
                          border: '0.5px solid #e0dad3',
                          py: 1.25,
                          px: 1.5,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'stretch',
                          gap: 0,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                            width: '100%',
                            minWidth: 0,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: FONT_SYNE,
                              fontSize: 14,
                              fontWeight: 800,
                              color: '#1a1208',
                              flexShrink: 0,
                              bgcolor: themeSlug?.tape,
                            }}
                          >
                            {themeSlug?.emoticon}
                          </Box>
                          <Box
                            sx={{
                              fontFamily: FONT_SYNE,
                              fontSize: 13,
                              fontWeight: 700,
                              color: themeSlug?.accent || '#1a1208',
                              flex: 1,
                            }}
                          >
                            {row.category.name}
                          </Box>
                          <Box sx={{ display: 'flex' }}>
                            {faces.map((p) => (
                              <FriendAvatar
                                key={p.id}
                                userId={p.id}
                                size={20}
                                sx={{ ml: -1 }}
                                ringWidth={5}
                              />
                            ))}
                          </Box>
                          {extra > 0 ? (
                            <Box sx={{ fontSize: 11, color: '#a09080' }}>+{extra}</Box>
                          ) : null}
                          {profileInOrbit ? (
                            <Box
                              sx={{
                                fontSize: 10,
                                fontWeight: 500,
                                py: 0.375,
                                px: 1,
                                borderRadius: 999,
                                bgcolor: '#eaf3de',
                                color: '#3b6d11',
                                flexShrink: 0,
                              }}
                            >
                              You&apos;re in this
                            </Box>
                          ) : isSelfProfile ? (
                            <Box sx={{ fontSize: 10, color: '#a09080', flexShrink: 0 }}>
                              {friends.length} budd{friends.length === 1 ? 'y' : 'ies'}
                            </Box>
                          ) : (
                            <>
                              {showJoinTheirOrbit && (<Box
                                onClick={() => openJoinOrbit(slug)}
                                sx={{
                                  flexShrink: 0,
                                  color: '#d85a30',
                                  fontSize: 10,
                                }}
                              >
                                + Join
                              </Box>)}
                            </>
                          )}
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>

            <Box
              sx={{
                height: '1px',
                flexShrink: 0,
                bgcolor: '#e0dad3',
                mx: 2,
                mb: 1.75,
              }}
            />

            <Box sx={{ px: 2, mb: 1.75 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1.25,
                }}
              >
                <Box
                  sx={{
                    fontFamily: FONT_SYNE,
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#1a1208',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Good times had
                </Box>
                <Box sx={{ fontSize: 11, fontWeight: 500, color: '#d85a30', cursor: 'default' }}>
                  {profile?.attended_count != null
                    ? `See all ${profile.attended_count}`
                    : 'See all'}
                </Box>
              </Box>
              {attendedEvents.length === 0 ? (
                <Placeholder>No attended events to show yet.</Placeholder>
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 1,
                  }}
                >
                  {attendedEvents.slice(0, 4).map((ev, i) => (
                    <Box
                      component="button"
                      type="button"
                      key={ev.id}
                      onClick={() => navigate(`/events/${ev.id}`)}
                      sx={{
                        bgcolor: '#fff',
                        borderRadius: '14px',
                        border: '0.5px solid #e0dad3',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        textAlign: 'left',
                        p: 0,
                        font: 'inherit',
                      }}
                    >
                      <Box
                        sx={{
                          height: 72,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 26,
                          bgcolor: thumbBg(i),
                          '& img': {
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          },
                        }}
                      >
                        {ev.cover_image ? (
                          <img src={ev.cover_image} alt="" />
                        ) : (
                          <span aria-hidden>🎟️</span>
                        )}
                      </Box>
                      <Box sx={{ py: 1, px: 1.25 }}>
                        <Box
                          sx={{
                            fontSize: 9,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            color: '#a09080',
                            mb: 0.25,
                          }}
                        >
                          {getEventCategory(ev)}
                        </Box>
                        <Box
                          sx={{
                            fontFamily: FONT_SYNE,
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#1a1208',
                            lineHeight: 1.2,
                            mb: 0.375,
                          }}
                        >
                          {ev.title}
                        </Box>
                        <Box sx={{ fontSize: 10, color: '#a09080' }}>
                          {getEventDate(ev.start_time)}
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            <Box sx={{ px: 2, mb: 1.75 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1.25,
                }}
              >
                <Box
                  sx={{
                    fontFamily: FONT_SYNE,
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#1a1208',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Events they&apos;ve thrown
                </Box>
                <Box sx={{ fontSize: 11, fontWeight: 500, color: '#d85a30', cursor: 'default' }}>
                  {profile?.hosted_count != null
                    ? `See all ${profile.hosted_count}`
                    : 'See all'}
                </Box>
              </Box>
              {hostedEvents.length === 0 ? (
                <Placeholder>No hosted events to show yet.</Placeholder>
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 1,
                  }}
                >
                  {hostedEvents.slice(0, 4).map((ev, i) => (
                    <Box
                      component="button"
                      type="button"
                      key={ev.id}
                      onClick={() => navigate(`/events/${ev.id}`)}
                      sx={{
                        bgcolor: '#fff',
                        borderRadius: '14px',
                        border: '0.5px solid #e0dad3',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        textAlign: 'left',
                        p: 0,
                        font: 'inherit',
                      }}
                    >
                      <Box
                        sx={{
                          height: 72,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 26,
                          bgcolor: thumbBg(i + 2),
                          '& img': {
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          },
                        }}
                      >
                        {ev.cover_image ? (
                          <img src={ev.cover_image} alt="" />
                        ) : (
                          <span aria-hidden>🎉</span>
                        )}
                      </Box>
                      <Box sx={{ py: 1, px: 1.25 }}>
                        <Box
                          sx={{
                            fontSize: 9,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            color: '#a09080',
                            mb: 0.25,
                          }}
                        >
                          {getEventCategory(ev)}
                        </Box>
                        <Box
                          sx={{
                            fontFamily: FONT_SYNE,
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#1a1208',
                            lineHeight: 1.2,
                            mb: 0.375,
                          }}
                        >
                          {ev.title}
                        </Box>
                        <Box sx={{ fontSize: 10, color: '#a09080' }}>
                          {getEventDate(ev.start_time)}
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            <Box
              sx={{
                height: '1px',
                flexShrink: 0,
                bgcolor: '#e0dad3',
                mx: 2,
                mb: 1.75,
              }}
            />

            <Box sx={{ px: 2, mb: 1.75 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1.25,
                }}
              >
                <Box
                  sx={{
                    fontFamily: FONT_SYNE,
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#1a1208',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Their hustle
                </Box>
              </Box>
              {services.length === 0 ? (
                <Placeholder>No services listed yet.</Placeholder>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {services.map((svc) => (
                    <Box
                      key={svc.id}
                      sx={{
                        bgcolor: '#fff',
                        borderRadius: '14px',
                        border: '0.5px solid #e0dad3',
                        borderLeft: '3px solid #ef9f27',
                        py: 1.25,
                        px: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        cursor: 'pointer',
                      }}
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                          flexShrink: 0,
                          bgcolor: '#FBEAF0',
                          overflow: 'hidden',
                        }}
                      >
                        {svc.portfolio_image ? (
                          <img
                            src={svc.portfolio_image}
                            alt=""
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: 10,
                            }}
                          />
                        ) : (
                          <span aria-hidden>✨</span>
                        )}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            fontFamily: FONT_SYNE,
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#1a1208',
                          }}
                        >
                          {svc.title}
                        </Box>
                        <Box sx={{ fontSize: 11, color: '#a09080' }}>
                          {svc.category || 'Service'}
                          <Box component="span" sx={{ color: '#c4b8a8' }}>
                            {' '}
                            · Gig count not in API
                          </Box>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: '#854f0b',
                          bgcolor: '#faeeda',
                          py: 0.375,
                          px: 1,
                          borderRadius: 999,
                          flexShrink: 0,
                        }}
                      >
                        —
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.625,
                mx: 2,
                mb: 2.5,
                bgcolor: '#fff',
                borderRadius: 999,
                py: 0.75,
                px: 1.5,
                fontSize: 11,
                fontWeight: 500,
                color: '#5a4a3a',
                border: '0.5px solid #e0dad3',
                '& svg': {
                  width: 12,
                  height: 12,
                  stroke: '#d85a30',
                  strokeWidth: 2.5,
                  fill: 'none',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                },
              }}
            >
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  fill="none"
                />
                <circle cx="12" cy="9" r="2.5" fill="#D85A30" stroke="none" />
              </svg>
              {profile?.location_city ||
                (username ? 'Location not set' : 'City, neighborhood')}
            </Box>
          </>
        ) : null}
      </Box>
      {joinOrbitSlug && joinOrbitSnapshot ? (
        <JoinOrbitDialog
          open
          onClose={closeJoinOrbit}
          targetUsername={username}
          targetDisplayName={displayName}
          targetAvatar={profile?.avatar}
          viewerDisplayName={viewerDisplayName}
          viewerAvatar={user?.avatar}
          categoryName={joinOrbitSnapshot.categoryName}
          categoryBg={joinOrbitSnapshot.categoryBg}
          orbitGlyph={getCategoryThemeSlug(joinOrbitSnapshot.slug)?.emoticon ?? ''}
          mode={joinOrbitSnapshot.mode}
          eventId={joinOrbitSnapshot.eventId}
          requestMessagePreview={joinOrbitSnapshot.preview}
        />
      ) : null}
    </Box>
  );
}
