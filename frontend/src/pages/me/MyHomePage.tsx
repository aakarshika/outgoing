import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ArrowRight, Lightbulb, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import client from '@/api/client';
import { useAuth } from '@/features/auth/hooks';
import { fetchFeed } from '@/features/events/api';
import { useFeed, useMyInterestedEvents } from '@/features/events/hooks';
import { fetchEvent } from '@/features/events/api';
import { fetchAllOpenOpportunities } from '@/features/needs/api';
import type { EventOverviewRow } from '@/pages/alerts/utils';
import { ProfileService } from '@/pages/profile/Profile.service';
import type {
  ApiResponse,
  EventDetail,
  EventLifecycleState,
  EventListItem,
} from '@/types/events';
import type { VendorOpportunity } from '@/types/needs';
import { OpportunityCardExpandedSection } from '@/pages/search/components/SearchCards';

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

type FeedEventCard = {
  id: number;
  category: string;
  title: string;
  date: string;
  icon: string;
  accent: string;
  attendees: readonly string[];
  attendeeColors: readonly string[];
  extra: string;
};

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

function EventCard({
  id,
  category,
  title,
  date,
  icon,
  accent,
  attendees,
  attendeeColors,
  extra,
}: FeedEventCard) {
  return (
    <Box
      component={Link}
      to={`/events/${id}`}
      sx={{
        minWidth: { xs: 250, sm: 220 },
        maxWidth: 260,
        borderRadius: '22px',
        overflow: 'hidden',
        border: '1px solid rgba(143, 105, 66, 0.16)',
        background: 'rgba(255,255,255,0.86)',
        boxShadow: '0 18px 44px rgba(108, 71, 33, 0.08)',
        flexShrink: 0,
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        '&:hover': { boxShadow: '0 22px 52px rgba(108, 71, 33, 0.12)' },
      }}
    >
      <Box
        sx={{
          height: 118,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: accent,
          fontSize: 34,
        }}
      >
        {icon}
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
          {category}
        </Typography>
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 15,
            fontWeight: 700,
            lineHeight: 1.3,
            color: '#2B2118',
          }}
        >
          {title}
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Typography sx={{ fontSize: 12, color: 'rgba(66, 50, 28, 0.68)' }}>
            {date}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            {attendees.length > 0 ? (
              <Stack direction="row" sx={{ '& > *:not(:first-of-type)': { ml: -0.7 } }}>
                {attendees.map((person, index) => (
                  <Avatar
                    key={`${title}-${person}`}
                    sx={{
                      width: 20,
                      height: 20,
                      border: '1.5px solid #fff',
                      fontSize: 8,
                      fontWeight: 700,
                      bgcolor: attendeeColors[index] || '#D85A30',
                    }}
                  >
                    {person}
                  </Avatar>
                ))}
              </Stack>
            ) : null}
            <Typography sx={{ fontSize: 11, color: 'rgba(66, 50, 28, 0.68)' }}>
              {extra}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Box>
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

function getEventAccent(event: EventListItem) {
  const category = (event.category?.name || '').toLowerCase();
  if (event.location_name?.toLowerCase().includes('online')) return '#E1F5EE';
  if (category.includes('music')) return '#E6F1FB';
  if (category.includes('food')) return '#EAF3DE';
  if (category.includes('art')) return '#FBEAF0';
  if (category.includes('film')) return '#FAEEDA';
  return '#FAECE7';
}

function getEventIcon(event: EventListItem) {
  const category = (event.category?.name || '').toLowerCase();
  if (category.includes('music')) return '🎶';
  if (category.includes('food')) return '🍽️';
  if (category.includes('art')) return '🎨';
  if (category.includes('film')) return '🎞️';
  if (category.includes('game')) return '🎮';
  if (category.includes('well')) return '🧘';
  if (
    category.includes('run') ||
    category.includes('sport') ||
    category.includes('outdoor')
  ) {
    return '🏃';
  }
  return '✨';
}

function getOpportunityIcon(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes('music') || normalized.includes('dj')) return '🎧';
  if (normalized.includes('food') || normalized.includes('cater')) return '🍽️';
  if (normalized.includes('photo') || normalized.includes('video')) return '📷';
  if (normalized.includes('design') || normalized.includes('art')) return '🎨';
  return '🛠️';
}

function getBudgetLabel(opportunity: VendorOpportunity) {
  if (opportunity.budget_min && opportunity.budget_max) {
    return `$${opportunity.budget_min}-${opportunity.budget_max}`;
  }
  if (opportunity.budget_max) return `Up to $${opportunity.budget_max}`;
  if (opportunity.budget_min) return `From $${opportunity.budget_min}`;
  return 'Open call';
}

function formatNeedList(opportunities: VendorOpportunity[]) {
  const titles = opportunities.map((opp) => opp.need_title);
  if (titles.length === 0) return '';
  if (titles.length === 1) return titles[0];
  if (titles.length === 2) return `${titles[0]} and ${titles[1]}`;
  const allButLast = opportunities.slice(0, -1).map((opp) => `${getOpportunityIcon(opp.category)} ${opp.need_title}`).join(', ');
  const last = `${getOpportunityIcon(opportunities[opportunities.length - 1].category)} ${opportunities[opportunities.length - 1].need_title}`;
  return `${allButLast}, and ${last}`;
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
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedTrendingFilters, setSelectedTrendingFilters] = useState<
    TrendingFeedFilter[]
  >(['this-weekend']);
  const [expandedNeedCard, setExpandedNeedCard] = useState<
    number | null
  >(null);
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

  const eventCoverByEventId = useMemo(() => {
    const map = new Map<number, string>();
    eventQueries.forEach((q, i) => {
      const eventId = contributionEventIds[i];
      const cover = (q.data as ApiResponse<EventDetail> | undefined)?.data?.cover_image;
      if (eventId && cover) map.set(eventId, cover);
    });
    return map;
  }, [eventQueries, contributionEventIds]);

  const profile = profileResponse?.data;
  const locationLabel = profile?.location_city || 'Your area';
  const locationQuery = profile?.location_city?.trim() || undefined;
  const allTrendingSearchHref = useMemo(() => {
    const params = new URLSearchParams({ tab: 'trending' });
    if (locationQuery) params.set('location', locationQuery);
    return `/search?${params.toString()}`;
  }, [locationQuery]);

  const { data: nearbyTrendingResponse } = useQuery(
    {
      queryKey: ['my-home', 'trending-nearby', locationQuery],
      enabled: Boolean(locationQuery),
      queryFn: () =>
        fetchFeed({
          sort: 'trending',
          location: locationQuery,
          lifecycle_states: trendingLifecycleStates,
          page_size: 120,
        }),
    },
  );

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
  const nearbyTrendingCount = locationQuery
    ? nearbyTrendingEvents.length
    : trendingEvents.length;

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

  const filteredTrendingEvents = useMemo(() => {
    if (selectedTrendingFilters.length === 0) {
      return trendingEvents.slice(0, 6).map<FeedEventCard>((event) => ({
        id: event.id,
        category: event.category?.name || 'Event',
        title: event.title,
        date: `${formatDate(event.start_time, { weekday: 'short' })} · ${formatTime(event.start_time)}`,
        icon: getEventIcon(event),
        accent: getEventAccent(event),
        attendees: [event.host.first_name?.[0] || event.host.username[0]].filter(
          Boolean,
        ),
        attendeeColors: ['#D85A30'],
        extra: `+${Math.max(event.ticket_count, event.interest_count)}`,
      }));
    }

    const filtered = trendingEvents.filter((event) => {
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
          return (trendingCategoryGroups[filter] as readonly string[]).includes(categorySlug);
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

    return filtered.slice(0, 6).map<FeedEventCard>((event) => ({
      id: event.id,
      category: event.category?.name || 'Event',
      title: event.title,
      date: `${formatDate(event.start_time, { weekday: 'short' })} · ${formatTime(event.start_time)}`,
      icon: getEventIcon(event),
      accent: getEventAccent(event),
      attendees: [event.host.first_name?.[0] || event.host.username[0]].filter(Boolean),
      attendeeColors: ['#D85A30'],
      extra: `+${Math.max(event.ticket_count, event.interest_count)}`,
    }));
  }, [selectedTrendingFilters, trendingEvents]);

  const recommendedEvents = useMemo(() => {
    const seen = new Set<number>([
      nextEvent?.id || -1,
      ...filteredTrendingEvents.map((event) => event.id),
    ]);

    return ((recommendedResponse?.data || []) as EventListItem[])
      .filter((event) => !seen.has(event.id))
      .slice(0, 6)
      .map<FeedEventCard>((event) => ({
        id: event.id,
        category: event.category?.name || 'Event',
        title: event.title,
        date: `${formatDate(event.start_time, { month: 'short', day: 'numeric' })} · ${formatTime(event.start_time)}`,
        icon: getEventIcon(event),
        accent: getEventAccent(event),
        attendees: [event.host.first_name?.[0] || event.host.username[0]].filter(
          Boolean,
        ),
        attendeeColors: ['#534AB7'],
        extra: `+${Math.max(event.ticket_count, event.interest_count)}`,
      }));
  }, [filteredTrendingEvents, nextEvent?.id, recommendedResponse]);

  const toggleTrendingFilter = (filter: TrendingFeedFilter) => {
    setSelectedTrendingFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter],
    );
  };
  const clearTrendingFilters = () => setSelectedTrendingFilters([]);

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
                    <Chip
                      label={`${nearbyTrendingCount} events nearby`}
                      sx={{
                        height: 34,
                        borderRadius: '999px',
                        background: '#D85A30',
                        color: '#fff',
                        fontWeight: 700,
                      }}
                    />
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
                      label="All"
                      sx={{
                        height: 34,
                        borderRadius: '999px',
                        bgcolor: 'rgba(255,255,255,0.9)',
                        color: '#4A3827',
                        border: '1px solid rgba(143, 105, 66, 0.14)',
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    />
                    <Chip
                      label="Clear"
                      onClick={clearTrendingFilters}
                      sx={{
                        height: 34,
                        borderRadius: '999px',
                        bgcolor: 'rgba(255,255,255,0.9)',
                        color: '#4A3827',
                        border: '1px solid rgba(143, 105, 66, 0.14)',
                        fontWeight: 700,
                        cursor: 'pointer',
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
                      <EventCard key={event.id} {...event} />
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
                    {contributionEventCards.length > 0 ? (
                      contributionEventCards.map((eventCard) => {
                        const coverUrl = eventCoverByEventId.get(eventCard.eventId);
                        return (
                          <Box
                            key={eventCard.eventId}
                            sx={{
                              display: 'flex',
                              width: '100%',
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              borderRadius: '22px',
                              border: '1px solid rgba(143, 105, 66, 0.16)',
                              borderLeft: '4px solid #EF9F27',
                              borderTop: 'none',
                              background: 'rgba(255,255,255,0.86)',
                              boxShadow: '0 18px 44px rgba(108, 71, 33, 0.08)',
                              minWidth: 0,
                              overflow: 'hidden',
                              transition: 'box-shadow 0.2s ease',
                              '&:hover': {
                                boxShadow: '0 22px 52px rgba(108, 71, 33, 0.12)',
                              },
                            }}
                          >
                            <Box
                              sx={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'row',
                                minWidth: 0,
                              }}
                            >
                              {/* image */}
                              <Box
                                sx={{
                                  position: 'relative',
                                  width: 140,
                                  minWidth: 140,
                                  height: 100,
                                  flexShrink: 0,
                                }}
                              >
                                {coverUrl && (
                                  <Box
                                    component="img"
                                    src={coverUrl}
                                    alt={eventCard.eventTitle}
                                    sx={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block',
                                    }}
                                  />
                                )}
                              </Box>
                              {/* content */}
                              <Stack
                                spacing={1.25}
                                sx={{
                                  flex: 1,
                                  minWidth: 0,
                                  p: 1.6,
                                  justifyContent: 'center',
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: { xs: 14, sm: 14.5 },
                                    fontWeight: 700,
                                    color: '#2B2118',
                                  }}
                                >
                                  {eventCard.eventTitle}
                                  {' '}<strong style={{ color: 'rgba(66, 50, 28, 0.68)', fontWeight: 700 }}>needs</strong> {' '}
                                  {formatNeedList(
                                    eventCard.opportunities,
                                  )}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: 12.5,
                                    color: 'rgba(66, 50, 28, 0.68)',
                                  }}
                                >
                                  {eventCard.subtitle}
                                </Typography>
                                <Typography
                                  onClick={() => {
                                    setExpandedNeedCard(expandedNeedCard === eventCard.eventId ? null : eventCard.eventId);
                                  }}
                                  sx={{
                                    fontFamily: 'Syne, sans-serif',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: '#BA7517',
                                  }}
                                >
                                  {eventCard.opportunities.length == 1 ? getBudgetLabel(eventCard.opportunities[0]) : `Multiple Opportunities`}
                                </Typography>

                              </Stack>

                            </Box>

                            {expandedNeedCard === eventCard.eventId && (
                              <Box
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                  width: '100%',
                                  display: 'flex',
                                  flexDirection: 'row',
                                }}
                              >
                                <OpportunityCardExpandedSection
                                  opportunities={eventCard.opportunities || []}
                                  hasMatchingService={false}
                                  expanded={expandedNeedCard === eventCard.eventId ?? false}
                                />
                              </Box>
                            )}

                          </Box>

                        );
                      })
                    ) : (
                      null
                    )}
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
                  <SectionHeading
                    eyebrow="Your network"
                    title=""
                  />
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
                <SectionHeading
                  eyebrow="Based on your interests"
                  title=""
                />
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
                      <EventCard key={event.id} {...event} />
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
    </Box>
  );
}
