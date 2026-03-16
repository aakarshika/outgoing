import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Lightbulb, MapPin, Sparkle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import client from '@/api/client';
import { SmallEventCard } from '@/components/events/SmallEventCard';
import { QuickCreateServiceDialog } from '@/components/vendors/QuickCreateServiceDialog';
import { useAuth } from '@/features/auth/hooks';
import { fetchFeed } from '@/features/events/api';
import { fetchEvent } from '@/features/events/api';
import { useFeed, useMyInterestedEvents } from '@/features/events/hooks';
import {
  fetchAllOpenOpportunities,
  fetchMyVendorOpportunities,
} from '@/features/needs/api';
import type { EventOverviewRow } from '@/pages/alerts/utils';
import { ProfileService } from '@/pages/profile/Profile.service';
import { EventCardWithAllNeeds } from '@/pages/search/components/SearchCards';
import type {
  ApiResponse,
  EventDetail,
  EventLifecycleState,
  EventListItem,
} from '@/types/events';
import type { VendorOpportunity } from '@/types/needs';
import {
  getStoredSearchLocation,
  inferCityFromLocationLabel,
  LOCATION_PREFERENCES_CHANGED_EVENT,
} from '@/utils/locationPrefs';

const trendingFeedFilters = [
  { id: 'this-weekend', label: 'This weekend' },
  { id: 'tonight', label: 'Tonight' },
  { id: 'free', label: 'Free' },
  { id: 'online', label: 'Online' },
  { id: 'outdoors', label: 'Outdoors' },
  { id: 'fun', label: 'Fun' },
  { id: 'social', label: 'Social' },
  { id: 'play-school', label: 'Play school' },
  { id: 'tech', label: 'Tech' },
] as const;

const trendingCategoryGroups = {
  outdoors: ['outdoor-adventure', 'sports-fitness'],
  fun: [
    'comedy',
    'music',
    'networking-social',
    'festivals',
    'nightlife',
    'food-drink',
    'arts-culture',
  ],
  social: [
    'networking-social',
    'community',
    'workshops-classes',
    'arts-culture',
    'food-drink',
    'tech-innovation',
    'festivals',
  ],
  'play-school': ['arts-culture', 'workshops-classes'],
  tech: ['tech-innovation', 'networking-social'],
} as const;

const networkGroups = [
  { name: 'Network', icon: 'N', background: '#FAECE7', active: true },
  { name: 'Hosts', icon: 'H', background: '#E6F1FB', active: false },
  { name: 'Vendors', icon: 'V', background: '#EAF3DE', active: false },
  { name: 'Friends', icon: 'F', background: '#FAEEDA', active: false },
  { name: 'Nearby', icon: 'L', background: '#EEEDFE', active: false },
  { name: 'Soon', icon: '+', background: '#F1EFE8', active: false },
] as const;

type TrendingFeedFilter = (typeof trendingFeedFilters)[number]['id'];

type ContributionEventCardData = {
  eventId: number;
  eventTitle: string;
  subtitle: string;
  opportunities: VendorOpportunity[];
};

type UpcomingEventData = {
  id: string;
  eventId: number;
  month: string;
  day: string;
  title: string;
  subtitle: string;
  pill: { label: string; background: string; color: string };
};

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <Stack spacing={0.75}>
      <Typography
        sx={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(66, 50, 28, 0.62)',
        }}
      >
        {eyebrow}
      </Typography>
      <Typography
        sx={{
          fontFamily: 'Syne, sans-serif',
          fontSize: { xs: 24, sm: 28 },
          fontWeight: 800,
          letterSpacing: '-0.04em',
          color: '#2B2118',
        }}
      >
        {title}
      </Typography>
      {description ? (
        <Typography
          sx={{ fontSize: 14, color: 'rgba(66, 50, 28, 0.72)', maxWidth: 560 }}
        >
          {description}
        </Typography>
      ) : null}
    </Stack>
  );
}

function formatDate(
  dateString: string | undefined | null,
  options: Intl.DateTimeFormatOptions,
) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatTime(dateString: string | undefined | null) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getCountdownParts(dateString: string | undefined | null) {
  if (!dateString) return { countdown: '-', countdownLabel: 'plan ahead' };
  const today = new Date();
  const target = new Date(dateString);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  const diffDays = Math.ceil(
    (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) return { countdown: 'Now', countdownLabel: 'happening soon' };
  if (diffDays === 1) return { countdown: '1', countdownLabel: 'day away' };
  return { countdown: String(diffDays), countdownLabel: 'days away' };
}

function getTodayWindow(reference = new Date()) {
  const start = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
  );
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function getThisWeekendWindow(reference = new Date()) {
  const startOfToday = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
  );
  const startOfWeek = new Date(startOfToday);
  const mondayOffset = (startOfWeek.getDay() + 6) % 7;
  startOfWeek.setDate(startOfWeek.getDate() - mondayOffset);

  const weekendStart = new Date(startOfWeek);
  weekendStart.setDate(weekendStart.getDate() + 5);

  const nextMonday = new Date(startOfWeek);
  nextMonday.setDate(nextMonday.getDate() + 7);

  return { start: reference, end: nextMonday, weekendStart };
}

function isOnlineEvent(event: EventListItem) {
  const locationName = (event.location_name || '').trim().toLowerCase();
  const locationAddress = (event.location_address || '').trim().toLowerCase();

  return (
    locationName.includes('online') ||
    locationAddress === 'online event' ||
    locationAddress.includes('online')
  );
}

function getLowestTicketPrice(event: EventListItem) {
  const prices = [
    ...(event.ticket_tiers?.map((tier) => Number(tier.price)) || []),
    Number(event.ticket_price_standard),
    Number(event.ticket_price_flexible),
  ].filter((value) => Number.isFinite(value));

  return prices.length > 0 ? Math.min(...prices) : 0;
}

function isFreeEvent(event: EventListItem) {
  return getLowestTicketPrice(event) === 0;
}

function isCurrentOrUpcomingEvent(event: EventListItem) {
  if (!event.start_time) return false;
  const now = Date.now();
  const endTime = event.end_time ? new Date(event.end_time).getTime() : NaN;
  const fallbackTime = new Date(event.start_time).getTime();
  const relevantEnd = Number.isNaN(endTime) ? fallbackTime : endTime;
  return relevantEnd >= now;
}

function isInTonightWindow(event: EventListItem) {
  if (!event.start_time) return false;
  const { start, end } = getTodayWindow();
  const eventStart = new Date(event.start_time);
  return eventStart >= start && eventStart < end;
}

function isInThisWeekendWindow(event: EventListItem) {
  if (!event.start_time) return false;
  const { start, end, weekendStart } = getThisWeekendWindow();
  const eventStart = new Date(event.start_time);
  return eventStart >= start && eventStart >= weekendStart && eventStart < end;
}

function getRoleStyle(kind: 'hosting' | 'attending' | 'saved' | 'vendor') {
  switch (kind) {
    case 'hosting':
      return { label: 'Hosting', background: '#E7EDFF', color: '#2D4EDA' };
    case 'vendor':
      return { label: 'Servicing', background: '#E1F5EE', color: '#0F6E56' };
    case 'saved':
      return { label: 'Saved', background: '#FBEAF0', color: '#B03A63' };
    default:
      return { label: 'Going', background: '#EAF3DE', color: '#3B6D11' };
  }
}

async function fetchEventOverview() {
  return client.get<ApiResponse<EventOverviewRow[]>>('/alerts/event-overview/');
}

export default function MyHomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedTrendingFilters, setSelectedTrendingFilters] = useState<
    TrendingFeedFilter[]
  >(['this-weekend']);
  const [isQuickCreateServiceOpen, setIsQuickCreateServiceOpen] = useState(false);
  const [quickCreateServiceCategory, setQuickCreateServiceCategory] = useState('');
  const [storedLocation, setStoredLocation] = useState(() => getStoredSearchLocation());

  const trendingLifecycleStates = [
    'published',
    'event_ready',
    'live',
  ] as EventLifecycleState[];

  const { data: profileResponse, isLoading: isProfileLoading } = useQuery({
    queryKey: ['my-home', 'profile', user?.username],
    queryFn: () => ProfileService.getPublicProfile(user!.username),
    enabled: !!user?.username,
  });

  const { data: trendingResponse } = useFeed({
    sort: 'trending',
    lifecycle_states: trendingLifecycleStates,
    page_size: 120,
  });

  const { data: recommendedResponse } = useFeed({
    sort: 'upcoming',
    page_size: 16,
  });

  const { data: overviewResponse } = useQuery({
    queryKey: ['my-home', 'eventOverview'],
    queryFn: fetchEventOverview,
    enabled: !!user,
  });

  const { data: savedResponse } = useMyInterestedEvents();

  // Same feed as Search "Chip In" tab: all open opportunities
  const { data: opportunities = [] } = useQuery({
    queryKey: ['my-home', 'opportunities', 'chip-in'],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetchAllOpenOpportunities();
      return response.data || [];
    },
  });

  const { data: matchedOpportunities = [] } = useQuery({
    queryKey: ['my-home', 'opportunities', 'matched'],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetchMyVendorOpportunities();
      return response.data || [];
    },
  });

  const matchedOpportunityNeedIds = useMemo(
    () => new Set(matchedOpportunities.map((item) => item.need_id)),
    [matchedOpportunities],
  );

  const contributionEventCards = useMemo<ContributionEventCardData[]>(() => {
    const byEvent = new Map<number, VendorOpportunity[]>();
    opportunities.forEach((opp) => {
      const list = byEvent.get(opp.event_id) ?? [];
      list.push(opp);
      byEvent.set(opp.event_id, list);
    });
    return Array.from(byEvent.entries())
      .map(([eventId, opps]) => ({
        eventId,
        eventTitle: opps[0].event_title,
        subtitle: `${formatDate(opps[0].event_start_time, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })} · ${opps[0].event_location_name || 'Location TBD'}`,
        opportunities: opps,
      }))
      .slice(0, 3);
  }, [opportunities]);

  const contributionEventIds = useMemo(
    () => contributionEventCards.map((c) => c.eventId),
    [contributionEventCards],
  );

  const eventQueries = useQueries({
    queries: contributionEventIds.map((eventId) => ({
      queryKey: ['event', eventId],
      queryFn: () => fetchEvent(eventId),
      enabled: !!eventId,
    })),
  });

  const eventDetailByEventId = useMemo(() => {
    const map = new Map<number, EventDetail>();
    eventQueries.forEach((q, i) => {
      const eventId = contributionEventIds[i];
      const detail = (q.data as ApiResponse<EventDetail> | undefined)?.data;
      if (eventId && detail) map.set(eventId, detail);
    });
    return map;
  }, [eventQueries, contributionEventIds]);

  const profile = profileResponse?.data;
  useEffect(() => {
    const syncStoredLocation = () => {
      setStoredLocation(getStoredSearchLocation());
    };

    syncStoredLocation();
    window.addEventListener(LOCATION_PREFERENCES_CHANGED_EVENT, syncStoredLocation);
    window.addEventListener('storage', syncStoredLocation);

    return () => {
      window.removeEventListener(
        LOCATION_PREFERENCES_CHANGED_EVENT,
        syncStoredLocation,
      );
      window.removeEventListener('storage', syncStoredLocation);
    };
  }, []);

  const currentCity =
    storedLocation?.city ||
    inferCityFromLocationLabel(storedLocation?.label || '') ||
    '';
  const locationLabel = currentCity || profile?.location_city || 'Your area';
  const locationQuery =
    storedLocation?.label?.trim() || profile?.location_city?.trim() || undefined;
  const allTrendingSearchHref = useMemo(() => {
    const params = new URLSearchParams({ tab: 'trending' });
    if (locationQuery) params.set('location', locationQuery);
    return `/search?${params.toString()}`;
  }, [locationQuery]);

  const { data: nearbyTrendingResponse } = useQuery({
    queryKey: ['my-home', 'trending-nearby', locationQuery],
    enabled: Boolean(locationQuery),
    queryFn: () =>
      fetchFeed({
        sort: 'trending',
        location: locationQuery,
        lifecycle_states: trendingLifecycleStates,
        page_size: 120,
      }),
  });

  const trendingEvents = useMemo(
    () =>
      ((trendingResponse?.data || []) as EventListItem[]).filter(
        (event) => !!event.start_time && isCurrentOrUpcomingEvent(event),
      ),
    [trendingResponse],
  );
  const nearbyTrendingEvents = useMemo(
    () =>
      ((nearbyTrendingResponse?.data || []) as EventListItem[]).filter(
        (event) => !!event.start_time && isCurrentOrUpcomingEvent(event),
      ),
    [nearbyTrendingResponse],
  );
  const nextEvent = trendingEvents[0];
  const nextEventCountdown = getCountdownParts(nextEvent?.start_time);

  const overviewRows = (overviewResponse?.data?.data || []) as EventOverviewRow[];
  const savedEvents = (savedResponse?.data || []) as EventListItem[];

  const upcomingEvents = useMemo<UpcomingEventData[]>(() => {
    const now = Date.now();
    const items = new Map<string, UpcomingEventData>();

    overviewRows.forEach((row) => {
      const detail = row.event_details as EventDetail | undefined;
      if (!detail?.start_time || new Date(detail.start_time).getTime() < now) return;

      let role: 'hosting' | 'attending' | 'vendor' = 'attending';
      if (user?.id && row.host_user_id === user.id) role = 'hosting';
      else if (
        user?.id &&
        (row.need_applied_to_user_id === user.id ||
          row.need_assigned_user_id === user.id)
      ) {
        role = 'vendor';
      }

      const date = new Date(detail.start_time);
      items.set(`event-${detail.id}`, {
        id: `event-${detail.id}`,
        eventId: detail.id,
        month: date.toLocaleDateString(undefined, { month: 'short' }),
        day: String(date.getDate()).padStart(2, '0'),
        title: detail.title,
        subtitle: `${detail.location_name || 'Location TBD'} · ${formatTime(detail.start_time)}`,
        pill: getRoleStyle(role),
      });
    });

    savedEvents.forEach((event) => {
      if (!event.start_time || new Date(event.start_time).getTime() < now) return;
      const date = new Date(event.start_time);
      items.set(`saved-${event.id}`, {
        id: `saved-${event.id}`,
        eventId: event.id,
        month: date.toLocaleDateString(undefined, { month: 'short' }),
        day: String(date.getDate()).padStart(2, '0'),
        title: event.title,
        subtitle: `${event.location_name || 'Location TBD'} · ${formatTime(event.start_time)}`,
        pill: getRoleStyle('saved'),
      });
    });

    return Array.from(items.values())
      .sort((a, b) => {
        const aDate = new Date(
          `${a.month} ${a.day}, ${new Date().getFullYear()}`,
        ).getTime();
        const bDate = new Date(
          `${b.month} ${b.day}, ${new Date().getFullYear()}`,
        ).getTime();
        return aDate - bDate;
      })
      .slice(0, 3);
  }, [overviewRows, savedEvents, user?.id]);
  const hasUpcomingEvents = upcomingEvents.length > 0;
  const weekendFeedTitle = hasUpcomingEvents
    ? 'A sharper feed for your next yes'
    : 'Your first yes starts here';
  const baseTrendingEvents = locationQuery ? nearbyTrendingEvents : trendingEvents;

  const filteredTrendingEvents = useMemo(() => {
    if (selectedTrendingFilters.length === 0) {
      return baseTrendingEvents.slice(0, 6);
    }

    const filtered = baseTrendingEvents.filter((event) => {
      const selectedDateFilters = selectedTrendingFilters.filter((filter) =>
        ['this-weekend', 'tonight'].includes(filter),
      );
      const selectedFormatFilters = selectedTrendingFilters.filter((filter) =>
        ['free', 'online'].includes(filter),
      );
      const selectedCategoryFilters = selectedTrendingFilters.filter(
        (filter): filter is keyof typeof trendingCategoryGroups =>
          filter in trendingCategoryGroups,
      );
      const categorySlug = event.category?.slug || '';
      const matchesCategoryGroup =
        selectedCategoryFilters.length === 0 ||
        selectedCategoryFilters.some((filter) => {
          if (filter === 'outdoors' && isOnlineEvent(event)) return false;
          return (trendingCategoryGroups[filter] as readonly string[]).includes(
            categorySlug,
          );
        });

      const matchesDateFilter =
        selectedDateFilters.length === 0 ||
        selectedDateFilters.some((filter) =>
          filter === 'this-weekend'
            ? isInThisWeekendWindow(event)
            : isInTonightWindow(event),
        );

      const matchesFormatFilter =
        selectedFormatFilters.length === 0 ||
        selectedFormatFilters.some((filter) =>
          filter === 'free' ? isFreeEvent(event) : isOnlineEvent(event),
        );

      return matchesCategoryGroup && matchesDateFilter && matchesFormatFilter;
    });

    return filtered.slice(0, 6);
  }, [baseTrendingEvents, selectedTrendingFilters]);

  const recommendedEvents = useMemo(() => {
    const seen = new Set<number>([
      nextEvent?.id || -1,
      ...filteredTrendingEvents.map((event) => event.id),
    ]);

    return ((recommendedResponse?.data || []) as EventListItem[])
      .filter((event) => !seen.has(event.id))
      .slice(0, 6);
  }, [filteredTrendingEvents, nextEvent?.id, recommendedResponse]);

  const toggleTrendingFilter = (filter: TrendingFeedFilter) => {
    setSelectedTrendingFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter],
    );
  };
  const clearTrendingFilters = () => setSelectedTrendingFilters([]);
  const openQuickCreateService = (category?: string) => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    setQuickCreateServiceCategory(category || '');
    setIsQuickCreateServiceOpen(true);
  };

  const isPageLoading = loading || isProfileLoading;

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress sx={{ color: '#D85A30' }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (isPageLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress sx={{ color: '#D85A30' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 1240,
        mx: 'auto',
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(255, 244, 227, 0.9), transparent 32%), linear-gradient(180deg, #FFFDF8 0%, #FFF6EA 48%, #FFFDF8 100%)',
      }}
    >
      <Container maxWidth={false}>
        <Box
          sx={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(255,250,243,0.92) 100%)',
            boxShadow: '0 32px 90px rgba(113, 74, 35, 0.10)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <Box
            sx={{
              px: { xs: 2, sm: 3, md: 4 },
              py: { xs: 3, md: 4 },
              borderBottom: '1px solid rgba(143, 105, 66, 0.10)',
              background:
                'linear-gradient(135deg, rgba(216,90,48,0.12) 0%, rgba(250,238,218,0.2) 60%, rgba(255,255,255,0.12) 100%)',
            }}
          >
            <Stack spacing={3}>
              {hasUpcomingEvents ? (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '1.35fr 0.95fr' },
                    gap: 2,
                  }}
                >
                  <Box
                    component={nextEvent ? Link : 'div'}
                    to={nextEvent ? `/events/${nextEvent.id}` : undefined}
                    sx={{
                      borderRadius: '28px',
                      p: { xs: 2.2, sm: 2.8 },
                      background: 'linear-gradient(135deg, #D85A30 0%, #C84E24 100%)',
                      color: '#fff',
                      boxShadow: '0 26px 56px rgba(216, 90, 48, 0.28)',
                      ...(nextEvent && {
                        cursor: 'pointer',
                        textDecoration: 'none',
                        display: 'block',
                        '&:hover': { boxShadow: '0 30px 64px rgba(216, 90, 48, 0.35)' },
                      }),
                    }}
                  >
                    <Stack spacing={2.5}>
                      <Chip
                        label={nextEvent ? 'Trending now' : 'No event yet'}
                        sx={{
                          width: 'fit-content',
                          bgcolor: 'rgba(255,255,255,0.16)',
                          color: '#fff',
                          fontWeight: 700,
                          letterSpacing: '0.03em',
                        }}
                      />
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
                      >
                        <Box>
                          <Typography
                            sx={{
                              fontFamily: 'Syne, sans-serif',
                              fontSize: { xs: 26, sm: 30 },
                              fontWeight: 800,
                              letterSpacing: '-0.04em',
                            }}
                          >
                            {nextEvent?.title || 'Trending events will show up here'}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1.25}
                            alignItems="center"
                            sx={{ mt: 1.2, flexWrap: 'wrap' }}
                          >
                            <Typography
                              sx={{ fontSize: 14, color: 'rgba(255,255,255,0.88)' }}
                            >
                              {nextEvent
                                ? `${formatDate(nextEvent.start_time, {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                  })}, ${formatTime(nextEvent.start_time)}`
                                : 'Check back soon'}
                            </Typography>
                            <Typography
                              sx={{ fontSize: 14, color: 'rgba(255,255,255,0.60)' }}
                            >
                              •
                            </Typography>
                            <Typography
                              sx={{ fontSize: 14, color: 'rgba(255,255,255,0.88)' }}
                            >
                              {nextEvent?.location_name || locationLabel}
                            </Typography>
                          </Stack>
                        </Box>
                        <Box
                          sx={{
                            minWidth: 118,
                            alignSelf: { xs: 'stretch', sm: 'auto' },
                            p: 1.6,
                            borderRadius: '22px',
                            background: 'rgba(255,255,255,0.14)',
                            textAlign: { xs: 'left', sm: 'right' },
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: 'Syne, sans-serif',
                              fontSize: 40,
                              fontWeight: 800,
                              lineHeight: 1,
                            }}
                          >
                            {nextEventCountdown.countdown}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 12,
                              color: 'rgba(255,255,255,0.76)',
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {nextEventCountdown.countdownLabel}
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </Box>

                  <Stack spacing={1.4}>
                    {upcomingEvents.map((event) => (
                      <Box
                        key={event.id}
                        component={Link}
                        to={`/events/${event.eventId}`}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: '24px',
                          background: 'rgba(255,255,255,0.88)',
                          border: '1px solid rgba(143, 105, 66, 0.12)',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          color: 'inherit',
                          '&:hover': { background: 'rgba(255,255,255,0.96)' },
                        }}
                      >
                        <Box
                          sx={{
                            minWidth: 54,
                            px: 1,
                            py: 1,
                            borderRadius: '18px',
                            background: '#FAECE7',
                            textAlign: 'center',
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: '#993C1D',
                            }}
                          >
                            {event.month}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: 'Syne, sans-serif',
                              fontSize: 22,
                              fontWeight: 800,
                              color: '#D85A30',
                              lineHeight: 1,
                            }}
                          >
                            {event.day}
                          </Typography>
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{ fontSize: 15, fontWeight: 700, color: '#2B2118' }}
                          >
                            {event.title}
                          </Typography>
                          <Typography
                            sx={{
                              mt: 0.35,
                              fontSize: 12.5,
                              color: 'rgba(66, 50, 28, 0.68)',
                            }}
                          >
                            {event.subtitle}
                          </Typography>
                        </Box>
                        <Box sx={{ ml: 'auto' }}>
                          <Chip
                            label={event.pill.label}
                            sx={{
                              bgcolor: event.pill.background,
                              color: event.pill.color,
                              fontWeight: 700,
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ) : null}
            </Stack>
          </Box>

          <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 } }}>
            <Stack spacing={4}>
              <Box>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  spacing={2}
                  sx={{ mb: 2 }}
                >
                  <Stack spacing={0.75}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <Typography
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontFamily: 'Syne, sans-serif',
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'rgba(66, 50, 28, 0.62)',
                        }}
                      >
                        Trending around
                        <Typography
                          sx={{
                            display: 'inline-flex',
                            gap: 0.5,
                            fontFamily: 'Syne, sans-serif',
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'rgba(66, 50, 28, 0.62)',
                          }}
                        >
                          <MapPin size={18} color="rgb(255, 148, 86)" /> {locationLabel}
                        </Typography>
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: { xs: 24, sm: 28 },
                        fontWeight: 800,
                        letterSpacing: '-0.04em',
                        color: '#2B2118',
                      }}
                    >
                      {weekendFeedTitle}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {trendingFeedFilters.map((filter) => (
                      <Chip
                        key={filter.id}
                        label={filter.label}
                        onClick={() => toggleTrendingFilter(filter.id)}
                        sx={{
                          height: 34,
                          borderRadius: '999px',
                          bgcolor: selectedTrendingFilters.includes(filter.id)
                            ? '#D85A30'
                            : 'rgba(255,255,255,0.9)',
                          color: selectedTrendingFilters.includes(filter.id)
                            ? '#fff'
                            : '#4A3827',
                          border: selectedTrendingFilters.includes(filter.id)
                            ? 'none'
                            : '1px solid rgba(143, 105, 66, 0.14)',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                    <Chip
                      component={Link}
                      to={allTrendingSearchHref}
                      clickable
                      label={
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                          }}
                        >
                          All
                          <ArrowRight size={14} />
                        </Box>
                      }
                      sx={{
                        height: 34,
                        borderRadius: '999px',
                        px: 0.35,
                        bgcolor: '#2B2118',
                        color: '#FFF8EF',
                        boxShadow: '0 10px 20px rgba(66, 50, 28, 0.18)',
                        fontWeight: 700,
                        textDecoration: 'none',
                        '& .MuiChip-label': {
                          px: 1.4,
                        },
                        '&:hover': {
                          bgcolor: '#3B2E22',
                        },
                      }}
                    />
                    <Chip
                      label="Clear"
                      onClick={clearTrendingFilters}
                      sx={{
                        height: 34,
                        borderRadius: '999px',
                        bgcolor: 'rgba(255, 244, 227, 0.92)',
                        color: '#B45309',
                        border: '1px dashed rgba(180, 83, 9, 0.38)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'rgba(255, 237, 213, 0.98)',
                        },
                      }}
                    />
                  </Stack>
                </Stack>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1.8,
                    overflowX: 'auto',
                    pb: 1,
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                  }}
                >
                  {filteredTrendingEvents.length > 0 ? (
                    filteredTrendingEvents.map((event) => (
                      <SmallEventCard key={event.id} event={event} />
                    ))
                  ) : (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '24px',
                        background: 'rgba(255,255,255,0.88)',
                        border: '1px solid rgba(143, 105, 66, 0.12)',
                        minWidth: 280,
                      }}
                    >
                      <Typography
                        sx={{ fontSize: 14, color: 'rgba(66, 50, 28, 0.72)' }}
                      >
                        No trending events match the filters you picked right now.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', xl: '1.2fr 0.8fr' },
                  gap: 3,
                  minWidth: 0,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <SectionHeading
                    eyebrow="Chip in"
                    title="Earn your way into the room"
                  />
                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {contributionEventCards.length > 0
                      ? contributionEventCards.map((eventCard) => {
                          const eventDetail = eventDetailByEventId.get(
                            eventCard.eventId,
                          );
                          if (!eventDetail) return null;
                          return (
                            <EventCardWithAllNeeds
                              key={eventCard.eventId}
                              event={eventDetail}
                              opportunities={eventCard.opportunities}
                              matchedNeedIds={matchedOpportunityNeedIds}
                              onCreateService={openQuickCreateService}
                              onClick={() => navigate(`/events/${eventCard.eventId}`)}
                            />
                          );
                        })
                      : null}
                    {contributionEventCards.length > 0 && (
                      <Box sx={{ pt: 0.5 }}>
                        <Button
                          component={Link}
                          to="/search?tab=chip-in"
                          variant="outlined"
                          size="medium"
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderColor: 'rgba(143, 105, 66, 0.3)',
                            color: '#2B2118',
                            '&:hover': {
                              borderColor: '#EF9F27',
                              bgcolor: 'rgba(239, 159, 39, 0.06)',
                            },
                          }}
                        >
                          Browse all
                        </Button>
                      </Box>
                    )}
                  </Stack>
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <SectionHeading eyebrow="Your network" title="" />
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1.4,
                      overflowX: 'auto',
                      pb: 1,
                      mt: 2,
                      scrollbarWidth: 'none',
                      '&::-webkit-scrollbar': { display: 'none' },
                    }}
                  >
                    {networkGroups.map((group) => (
                      <Stack
                        key={group.name}
                        spacing={1}
                        alignItems="center"
                        sx={{ minWidth: 78 }}
                      >
                        <Box
                          sx={{
                            width: 62,
                            height: 62,
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 24,
                            background: group.background,
                            border: group.active
                              ? '2px solid #D85A30'
                              : '2px solid transparent',
                            boxShadow: group.active
                              ? '0 0 0 5px rgba(216,90,48,0.08)'
                              : 'none',
                          }}
                        >
                          {group.icon}
                        </Box>
                        <Typography
                          sx={{
                            fontSize: 11.5,
                            textAlign: 'center',
                            color: 'rgba(66, 50, 28, 0.68)',
                            lineHeight: 1.25,
                          }}
                        >
                          {group.name}
                        </Typography>
                      </Stack>
                    ))}
                  </Box>
                </Box>
              </Box>

              <Box>
                <SectionHeading eyebrow="Based on your interests" title="" />
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1.8,
                    overflowX: 'auto',
                    pb: 1,
                    mt: 2,
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                  }}
                >
                  {recommendedEvents.length > 0 ? (
                    recommendedEvents.map((event) => (
                      <SmallEventCard key={event.id} event={event} />
                    ))
                  ) : (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '24px',
                        background: 'rgba(255,255,255,0.88)',
                        border: '1px solid rgba(143, 105, 66, 0.12)',
                        minWidth: 280,
                      }}
                    >
                      <Typography
                        sx={{ fontSize: 14, color: 'rgba(66, 50, 28, 0.72)' }}
                      >
                        No recommendations are available yet. The section stays in place
                        so the UI does not collapse.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Box
                sx={{
                  borderRadius: '30px',
                  p: { xs: 2.2, sm: 2.8 },
                  background:
                    'linear-gradient(135deg, rgba(255,247,236,0.95) 0%, rgba(255,255,255,0.96) 100%)',
                  border: '1px solid rgba(143, 105, 66, 0.12)',
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'flex-start', md: 'center' },
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '18px',
                    display: 'grid',
                    placeItems: 'center',
                    background: '#FAECE7',
                    color: '#D85A30',
                    flexShrink: 0,
                  }}
                >
                  <Sparkle size={24} />
                </Box>
                <Button
                  component={Link}
                  to="/search?tab=trending"
                  variant="contained"
                  endIcon={<ArrowRight size={16} />}
                  sx={{
                    minHeight: 44,
                    px: 2.2,
                    color: '#5c4138',
                    borderRadius: '999px',
                    textTransform: 'none',
                    fontWeight: 700,
                    background: '#fcf5f1',
                    boxShadow: 'none',
                    '&:hover': { background: '#e4dcd9', boxShadow: 'none' },
                  }}
                >
                  Browse more events
                </Button>
              </Box>
              <Box
                sx={{
                  borderRadius: '30px',
                  p: { xs: 2.2, sm: 2.8 },
                  background:
                    'linear-gradient(135deg, rgba(255,247,236,0.95) 0%, rgba(255,255,255,0.96) 100%)',
                  border: '1px solid rgba(143, 105, 66, 0.12)',
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'flex-start', md: 'center' },
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '18px',
                    display: 'grid',
                    placeItems: 'center',
                    background: '#FAECE7',
                    color: '#D85A30',
                    flexShrink: 0,
                  }}
                >
                  <Lightbulb size={24} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 18,
                      fontWeight: 800,
                      color: '#2B2118',
                    }}
                  >
                    Got an idea for an event?
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: 14,
                      color: 'rgba(66, 50, 28, 0.72)',
                      maxWidth: 640,
                    }}
                  >
                    Post it, find contributors, and let your community build it with
                    you.
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  to="/events/create"
                  variant="contained"
                  endIcon={<ArrowRight size={16} />}
                  sx={{
                    minHeight: 44,
                    px: 2.2,
                    borderRadius: '999px',
                    textTransform: 'none',
                    fontWeight: 700,
                    background: '#D85A30',
                    boxShadow: 'none',
                    '&:hover': { background: '#C24E27', boxShadow: 'none' },
                  }}
                >
                  Start an event
                </Button>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Container>
      <QuickCreateServiceDialog
        open={isQuickCreateServiceOpen}
        defaultCategory={quickCreateServiceCategory}
        onClose={async () => {
          setIsQuickCreateServiceOpen(false);
          setQuickCreateServiceCategory('');
          await queryClient.invalidateQueries({ queryKey: ['my-home'] });
        }}
      />
    </Box>
  );
}
