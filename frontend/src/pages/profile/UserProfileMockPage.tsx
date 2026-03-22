import './UserProfileMockPage.css';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Media } from '@/components/ui/media';
import { useAuth } from '@/features/auth/hooks';
import type { NetworkPerson } from '@/features/events/api';
import { CATEGORY_THEMES } from '@/features/events/CategoricalBackground';
import { useMyFriendshipsByOrbitCategory } from '@/features/events/hooks';

import { ProfileService } from './Profile.service';

type ProfileAccess = {
  met_at_event_title?: string | null;
  orbit_category_slug?: string | null;
  can_view_full_profile?: boolean;
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

const OFACE_COLORS = ['#D4537E', '#534AB7', '#D85A30', '#1D9E75', '#639922', '#EF9F27'];

/** Emoji hints for common `EventCategory.slug` values (friendship orbit). */
const ORBIT_SLUG_EMOJI: Record<string, string> = {
  arts: '🎨',
  music: '🎵',
  food: '🍽',
  outdoors: '🌿',
  networking: '🤝',
  comedy: '😄',
  social: '💬',
  festivals: '🎪',
  nightlife: '🌙',
  wellness: '🧘',
  unknown: '✦',
};

function orbitEmojiForSlug(slug: string) {
  return ORBIT_SLUG_EMOJI[slug] ?? ORBIT_SLUG_EMOJI.unknown;
}

function personInitial(p: NetworkPerson) {
  const n = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
  if (n) return n.charAt(0).toUpperCase();
  return (p.username || '?').charAt(0).toUpperCase();
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return <div className="mock-placeholder">{children}</div>;
}

function StatValue({ value }: { value?: number | null }) {
  const show = value != null && value >= 0;
  return <div className="stat-val">{show ? String(value) : '—'}</div>;
}

export default function UserProfileMockPage() {
  const { username: usernameParam } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const username = usernameParam?.trim() || '';

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
  const { data: orbitData, isLoading: orbitLoading } =
    useMyFriendshipsByOrbitCategory(fetchOrbits);

  const profile = (response?.data ?? null) as PublicProfile | null;
  const canViewFull = profile?.access?.can_view_full_profile ?? false;
  const attendedEvents = canViewFull ? (profile?.attended_events ?? []) : [];
  const hostedEvents = canViewFull ? (profile?.hosted_events ?? []) : [];
  const services = canViewFull ? (profile?.services ?? []) : [];

  const showLoading = Boolean(username) && isLoading;
  const showError = Boolean(username) && (error || (!isLoading && !profile));

  const displayName = profile ? getDisplayName(profile) : 'Preview';
  const handleLine = profile
    ? `@${profile.username}${profile.location_city ? ` · ${profile.location_city}` : ''}`
    : '@username';
  const bioText =
    profile && canViewFull
      ? profile.showcase_bio || profile.headline || null
      : profile && !canViewFull
        ? null
        : null;
  const metTitle = profile?.access?.met_at_event_title;

  const isSelfProfile = Boolean(user?.username && user.username === username);

  const orbitGroups = useMemo(() => {
    const raw = orbitData?.grouped_friendships ?? [];
    return [...raw].sort((a, b) =>
      (a.category.name || '').localeCompare(b.category.name || '', undefined, {
        sensitivity: 'base',
      }),
    );
  }, [orbitData?.grouped_friendships]);

  const inOrbitsStat = useMemo(() => {
    if (!fetchOrbits || orbitLoading) return undefined;
    if (isSelfProfile) return orbitGroups.length;
    return orbitGroups.filter((row) =>
      row.friendships.some((f) => f.friend.username === username),
    ).length;
  }, [fetchOrbits, isSelfProfile, orbitGroups, orbitLoading, username]);

  const coverStyle =
    profile?.cover_photo && !showLoading && !showError
      ? {
          backgroundImage: `linear-gradient(180deg, rgba(26,18,8,0.5) 0%, rgba(26,18,8,0.2) 100%), url(${profile.cover_photo})`,
          backgroundSize: 'cover' as const,
          backgroundPosition: 'center' as const,
        }
      : undefined;

  return (
    <div
      className="userProfileMockPage"
      style={{ background: '#ede8e2', padding: '0 0 24px' }}
    >
      <div className="phone">
        {!username && (
          <div className="mock-hint-banner">
            Add a username to the URL to load live data, e.g.{' '}
            <strong>/mock/user-profile/jane</strong>. Below is layout preview with
            placeholders.
          </div>
        )}

        {showLoading && <div className="phone-loading">Loading profile…</div>}

        {showError && (
          <div className="phone-error">
            Couldn&apos;t load this profile. Check the username or try again later.
          </div>
        )}

        {(!showLoading && !showError) || !username ? (
          <>
            <div
              className={`cover${profile?.cover_photo ? ' has-photo' : ''}`}
              style={!showLoading && !showError && profile ? coverStyle : undefined}
            >
              <div
                className="cover-deco"
                style={{
                  width: 200,
                  height: 200,
                  background: '#D85A30',
                  opacity: 0.12,
                  top: -60,
                  right: -50,
                }}
              />
              <div
                className="cover-deco"
                style={{
                  width: 120,
                  height: 120,
                  background: '#EF9F27',
                  opacity: 0.1,
                  bottom: -30,
                  left: 20,
                }}
              />
              <button
                type="button"
                className="cover-back-btn"
                aria-label="Back"
                onClick={() => navigate(-1)}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
              </button>
              <button type="button" className="cover-menu-btn" aria-label="Menu">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1" fill="#fff" />
                  <circle cx="12" cy="12" r="1" fill="#fff" />
                  <circle cx="12" cy="19" r="1" fill="#fff" />
                </svg>
              </button>
            </div>

            <div className="identity">
              <div className="avatar-wrap">
                <svg className="avatar-ring-svg" viewBox="0 0 72 72">
                  <circle
                    cx="36"
                    cy="36"
                    r="32"
                    fill="none"
                    stroke="#E0DAD3"
                    strokeWidth="1.5"
                    strokeDasharray="3 5"
                    opacity="0.7"
                  />
                  <circle
                    cx="36"
                    cy="36"
                    r="32"
                    fill="none"
                    stroke="#378ADD"
                    strokeWidth="3"
                    strokeDasharray="60 142"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 36 36)"
                  />
                  <circle
                    cx="36"
                    cy="36"
                    r="32"
                    fill="none"
                    stroke="#D4537E"
                    strokeWidth="3"
                    strokeDasharray="40 162"
                    strokeDashoffset="-67"
                    strokeLinecap="round"
                    transform="rotate(-90 36 36)"
                  />
                  <circle
                    cx="36"
                    cy="36"
                    r="32"
                    fill="none"
                    stroke="#EF9F27"
                    strokeWidth="3"
                    strokeDasharray="22 180"
                    strokeDashoffset="-113"
                    strokeLinecap="round"
                    transform="rotate(-90 36 36)"
                  />
                </svg>
                <div className="avatar">
                  {profile?.avatar ? (
                    <Media src={profile.avatar} alt="" className="avatar-media" />
                  ) : (
                    getInitials(
                      profile ?? {
                        username: '??',
                        first_name: '',
                        last_name: '',
                      },
                    )
                  )}
                </div>
              </div>
              <button
                type="button"
                className="connect-btn"
                onClick={() => {
                  if (username) navigate(`/user/${username}`);
                }}
                disabled={!username}
              >
                {username ? 'Open full profile' : '+ Add to orbit'}
              </button>
            </div>

            <div className="name-block">
              <div className="profile-name">{displayName}</div>
              <div className="profile-handle">{handleLine}</div>
              <div className="profile-bio">
                {bioText ||
                  (profile && !canViewFull ? (
                    <span style={{ color: '#A09080' }}>
                      Bio and activity are visible once you&apos;re connected on
                      Outgoing.
                    </span>
                  ) : (
                    <span style={{ color: '#A09080' }}>
                      No bio yet{username ? '' : ' — load a profile to see real copy'}.
                    </span>
                  ))}
              </div>
              {metTitle ? (
                <div className="met-pill">
                  <div className="met-dot" />
                  Met at {metTitle}
                </div>
              ) : null}
            </div>

            <div className="stats-row">
              <div className="stat">
                <StatValue value={canViewFull ? profile?.attended_count : undefined} />
                <div className="stat-lbl">Attended</div>
              </div>
              <div className="stat">
                <StatValue value={canViewFull ? profile?.hosted_count : undefined} />
                <div className="stat-lbl">Hosted</div>
              </div>
              <div className="stat">
                <StatValue value={canViewFull ? profile?.total_reviews : undefined} />
                <div className="stat-lbl">Reviews</div>
              </div>
              <div className="stat">
                <StatValue value={inOrbitsStat} />
                <div className="stat-lbl">In orbits</div>
              </div>
            </div>

            <div className="soul-section is-placeholder">
              <div className="soul-label">Outgoing soul</div>
              <div className="soul-track">
                <div className="soul-seg-g" style={{ width: '33%' }} />
                <div className="soul-seg-h" style={{ width: '34%' }} />
                <div className="soul-seg-ho" style={{ width: '33%' }} />
              </div>
              <div className="soul-track-labels">
                <span className="stl">Goer</span>
                <span className="stl">Helper</span>
                <span className="stl">Host</span>
              </div>
              {profile?.badges && profile.badges.length > 0 ? (
                <div className="soul-badge">{profile.badges[0].label}</div>
              ) : (
                <>
                  <div className="soul-badge" style={{ opacity: 0.75 }}>
                    — Soul mix not available yet
                  </div>
                  <p className="soul-placeholder-note">
                    Placeholder: API does not expose soul weights. Badges will appear
                    here when present.
                  </p>
                </>
              )}
            </div>

            <div className="divider" />

            <div className="sec">
              <div className="sec-head">
                <div className="sec-title">
                  {isSelfProfile ? 'Your orbits' : 'Their orbits'}
                </div>
                <button
                  type="button"
                  className="sec-more"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    font: 'inherit',
                  }}
                  onClick={() => navigate('/network')}
                >
                  All orbits
                </button>
              </div>
              <div className="orbits-grid">
                {!username ? (
                  <Placeholder>
                    Load a profile to see how your buddy orbits line up with theirs.
                  </Placeholder>
                ) : !isAuthenticated ? (
                  <Placeholder>
                    Sign in to load your buddy friendships grouped by orbit and see
                    overlap with @{username}.
                  </Placeholder>
                ) : orbitLoading ? (
                  <div className="orbit-loading">Loading your orbits…</div>
                ) : orbitGroups.length === 0 ? (
                  <Placeholder>
                    No accepted buddy friendships with an orbit category yet. Add
                    buddies from events to populate this list.
                  </Placeholder>
                ) : (
                  orbitGroups.map((row) => {
                    const friends = row.friendships.map((f) => f.friend);
                    const slug = row.category.slug || 'unknown';
                    const theme = CATEGORY_THEMES[slug] ?? CATEGORY_THEMES.default;
                    const profileInOrbit =
                      !isSelfProfile &&
                      Boolean(username) &&
                      friends.some((f) => f.username === username);
                    const faceSource = profileInOrbit
                      ? friends.filter((f) => f.username !== username)
                      : friends;
                    const faces = faceSource.slice(0, 3);
                    const extra = Math.max(0, faceSource.length - 3);
                    const rowKey = `${row.category.id ?? 'cat'}-${slug}`;

                    return (
                      <div key={rowKey} className="orbit-row">
                        <div className="orbit-icon" style={{ background: theme.bg }}>
                          {orbitEmojiForSlug(slug)}
                        </div>
                        <div className="orbit-name">{row.category.name}</div>
                        <div className="orbit-faces">
                          {faces.map((p, i) =>
                            p.avatar ? (
                              <div key={p.id} className="oface oface--img">
                                <img src={p.avatar} alt="" />
                              </div>
                            ) : (
                              <div
                                key={p.id}
                                className="oface"
                                style={{
                                  background: OFACE_COLORS[i % OFACE_COLORS.length],
                                }}
                              >
                                {personInitial(p)}
                              </div>
                            ),
                          )}
                        </div>
                        {extra > 0 ? (
                          <div className="orbit-people">+{extra}</div>
                        ) : null}
                        {profileInOrbit ? (
                          <div className="orbit-shared-pill">You&apos;re in this</div>
                        ) : isSelfProfile ? (
                          <div className="orbit-muted">
                            {friends.length} budd{friends.length === 1 ? 'y' : 'ies'}
                          </div>
                        ) : (
                          <div className="orbit-muted">Not shared yet</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="divider" />

            <div className="sec">
              <div className="sec-head">
                <div className="sec-title">Good times had</div>
                <div className="sec-more">
                  {canViewFull && profile?.attended_count != null
                    ? `See all ${profile.attended_count}`
                    : 'See all'}
                </div>
              </div>
              {!canViewFull && username ? (
                <Placeholder>
                  Attended events are hidden until you can view their full profile.
                </Placeholder>
              ) : attendedEvents.length === 0 ? (
                <Placeholder>No attended events to show yet.</Placeholder>
              ) : (
                <div className="ev-grid">
                  {attendedEvents.slice(0, 4).map((ev, i) => (
                    <button
                      type="button"
                      key={ev.id}
                      className="ev-card"
                      onClick={() => navigate(`/events/${ev.id}`)}
                    >
                      <div className="ev-thumb" style={{ background: thumbBg(i) }}>
                        {ev.cover_image ? (
                          <img src={ev.cover_image} alt="" />
                        ) : (
                          <span aria-hidden>🎟️</span>
                        )}
                      </div>
                      <div className="ev-body">
                        <div className="ev-cat">{getEventCategory(ev)}</div>
                        <div className="ev-title">{ev.title}</div>
                        <div className="ev-date">{getEventDate(ev.start_time)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="sec">
              <div className="sec-head">
                <div className="sec-title">Events they&apos;ve thrown</div>
                <div className="sec-more">
                  {canViewFull && profile?.hosted_count != null
                    ? `See all ${profile.hosted_count}`
                    : 'See all'}
                </div>
              </div>
              {!canViewFull && username ? (
                <Placeholder>
                  Hosted events are hidden until you can view their full profile.
                </Placeholder>
              ) : hostedEvents.length === 0 ? (
                <Placeholder>No hosted events to show yet.</Placeholder>
              ) : (
                <div className="ev-grid">
                  {hostedEvents.slice(0, 4).map((ev, i) => (
                    <button
                      type="button"
                      key={ev.id}
                      className="ev-card"
                      onClick={() => navigate(`/events/${ev.id}`)}
                    >
                      <div className="ev-thumb" style={{ background: thumbBg(i + 2) }}>
                        {ev.cover_image ? (
                          <img src={ev.cover_image} alt="" />
                        ) : (
                          <span aria-hidden>🎉</span>
                        )}
                      </div>
                      <div className="ev-body">
                        <div className="ev-cat">{getEventCategory(ev)}</div>
                        <div className="ev-title">{ev.title}</div>
                        <div className="ev-date">{getEventDate(ev.start_time)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="divider" />

            <div className="sec">
              <div className="sec-head">
                <div className="sec-title">Their hustle</div>
              </div>
              {!canViewFull && username ? (
                <Placeholder>
                  Services are hidden until you can view their full profile.
                </Placeholder>
              ) : services.length === 0 ? (
                <Placeholder>No services listed yet.</Placeholder>
              ) : (
                <div className="svc-list">
                  {services.map((svc) => (
                    <div key={svc.id} className="svc-row">
                      <div className="svc-icon" style={{ background: '#FBEAF0' }}>
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
                      </div>
                      <div className="svc-text-block">
                        <div className="svc-name">{svc.title}</div>
                        <div className="svc-count">
                          {svc.category || 'Service'}
                          <span style={{ color: '#c4b8a8' }}>
                            {' '}
                            · Gig count not in API
                          </span>
                        </div>
                      </div>
                      <div className="svc-gigs">—</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="location-pill">
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  fill="none"
                />
                <circle cx="12" cy="9" r="2.5" fill="#D85A30" stroke="none" />
              </svg>
              {profile?.location_city ||
                (username ? 'Location not set' : 'City, neighborhood')}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
