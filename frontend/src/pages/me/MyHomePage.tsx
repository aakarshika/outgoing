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
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, Lightbulb, MapPin, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import client from '@/api/client';
import { useAuth } from '@/features/auth/hooks';
import { useFeed, useMyInterestedEvents } from '@/features/events/hooks';
import {
  fetchMyPotentialOpportunities,
  fetchMyVendorOpportunities,
} from '@/features/needs/api';
import type { EventOverviewRow } from '@/pages/alerts/utils';
import { ProfileService } from '@/pages/profile/Profile.service';
import type {
  ApiResponse,
  EventDetail,
  EventLifecycleState,
  EventListItem,
} from '@/types/events';
import type { VendorOpportunity } from '@/types/needs';

const weekendFilters = [
  'All',
  'Tonight',
  'Free',
  'Outdoors',
  'Music',
  'Food',
  'Online',
] as const;

const networkGroups = [
  { name: 'Network', icon: 'N', background: '#FAECE7', active: true },
  { name: 'Hosts', icon: 'H', background: '#E6F1FB', active: false },
  { name: 'Vendors', icon: 'V', background: '#EAF3DE', active: false },
  { name: 'Friends', icon: 'F', background: '#FAEEDA', active: false },
  { name: 'Nearby', icon: 'L', background: '#EEEDFE', active: false },
  { name: 'Soon', icon: '+', background: '#F1EFE8', active: false },
] as const;

type WeekendFilter = (typeof weekendFilters)[number];

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

type ContributionCardData = {
  needId: number;
  icon: string;
  title: string;
  subtitle: string;
  reward: string;
  rewardLabel: string;
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
  const [selectedWeekendFilter, setSelectedWeekendFilter] =
    useState<WeekendFilter>('All');

  const { data: profileResponse, isLoading: isProfileLoading } = useQuery({
    queryKey: ['my-home', 'profile', user?.username],
    queryFn: () => ProfileService.getPublicProfile(user!.username),
    enabled: !!user?.username,
  });

  const { data: trendingResponse, isLoading: isTrendingLoading } = useFeed({
    sort: 'trending',
    lifecycle_states: ['published', 'event_ready', 'live'] as EventLifecycleState[],
    page_size: 10,
  });

  const { data: weekendResponse, isLoading: isWeekendLoading } = useFeed({
    sort: 'upcoming',
    weekend: true,
    page_size: 16,
  });

  const { data: recommendedResponse, isLoading: isRecommendedLoading } = useFeed({
    sort: 'upcoming',
    page_size: 16,
  });

  const { data: overviewResponse, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['my-home', 'eventOverview'],
    queryFn: fetchEventOverview,
    enabled: !!user,
  });

  const { data: savedResponse, isLoading: isSavedLoading } = useMyInterestedEvents();

  const { data: opportunities = [], isLoading: isOpportunitiesLoading } = useQuery({
    queryKey: ['my-home', 'opportunities', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [matched, potential] = await Promise.all([
        fetchMyVendorOpportunities(),
        fetchMyPotentialOpportunities(),
      ]);

      const seen = new Set<number>();
      return [...(matched.data || []), ...(potential.data || [])].filter((item) => {
        if (seen.has(item.need_id)) return false;
        seen.add(item.need_id);
        return true;
      });
    },
  });

  const profile = profileResponse?.data;
  const greetingName =
    profile?.first_name || user?.first_name || user?.username || 'there';
  const avatarLetter = greetingName[0]?.toUpperCase() || 'Y';
  const locationLabel = profile?.location_city || 'Your area';

  const trendingEvents = useMemo(
    () =>
      ((trendingResponse?.data || []) as EventListItem[]).filter(
        (event) => !!event.start_time,
      ),
    [trendingResponse],
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

  const weekendEvents = useMemo(() => {
    const baseEvents = (weekendResponse?.data || []) as EventListItem[];

    const filtered = baseEvents.filter((event) => {
      const category = (event.category?.name || '').toLowerCase();
      const isOnline = event.location_name?.toLowerCase().includes('online');
      const lowestKnownPrice = [
        event.ticket_price_standard,
        event.ticket_price_flexible,
      ]
        .filter((value): value is string => value !== null)
        .map((value) => Number(value))
        .filter((value) => !Number.isNaN(value));
      const isFree =
        lowestKnownPrice.length === 0 ||
        Math.min(...lowestKnownPrice, Number.POSITIVE_INFINITY) === 0;
      const startsToday =
        formatDate(event.start_time, { weekday: 'short' }) ===
        formatDate(new Date().toISOString(), { weekday: 'short' });

      switch (selectedWeekendFilter) {
        case 'Tonight':
          return startsToday;
        case 'Free':
          return isFree;
        case 'Outdoors':
          return (
            category.includes('outdoor') ||
            category.includes('run') ||
            category.includes('sport')
          );
        case 'Music':
          return category.includes('music');
        case 'Food':
          return category.includes('food');
        case 'Online':
          return isOnline;
        default:
          return true;
      }
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
  }, [selectedWeekendFilter, weekendResponse]);

  const recommendedEvents = useMemo(() => {
    const seen = new Set<number>([
      nextEvent?.id || -1,
      ...weekendEvents.map((event) => event.id),
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
  }, [nextEvent?.id, recommendedResponse, weekendEvents]);

  const contributionCards = useMemo<ContributionCardData[]>(() => {
    return opportunities.slice(0, 3).map((opportunity) => ({
      needId: opportunity.need_id,
      icon: getOpportunityIcon(opportunity.category),
      title: `${opportunity.event_title} needs ${opportunity.need_title}`,
      subtitle: `${formatDate(opportunity.event_start_time, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })} · ${opportunity.event_location_name || 'Location TBD'}`,
      reward: getBudgetLabel(opportunity),
      rewardLabel: opportunity.is_invited ? 'invited opportunity' : 'open opportunity',
    }));
  }, [opportunities]);

  const isPageLoading = loading || isProfileLoading;
  const isContentLoading =
    isTrendingLoading ||
    isWeekendLoading ||
    isRecommendedLoading ||
    isOverviewLoading ||
    isSavedLoading ||
    isOpportunitiesLoading;

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
                  <SectionHeading
                    eyebrow="Happening this weekend"
                    title="A sharper feed for your next yes"
                  />
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  
                    {weekendFilters.map((filter) => (
                      <Chip
                        key={filter}
                        label={filter}
                        onClick={() => setSelectedWeekendFilter(filter)}
                        sx={{
                          height: 34,
                          borderRadius: '999px',
                          bgcolor:
                            selectedWeekendFilter === filter
                              ? '#D85A30'
                              : 'rgba(255,255,255,0.9)',
                          color: selectedWeekendFilter === filter ? '#fff' : '#4A3827',
                          border:
                            selectedWeekendFilter === filter
                              ? 'none'
                              : '1px solid rgba(143, 105, 66, 0.14)',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      />
                    ))}
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
                  {weekendEvents.length > 0 ? (
                    weekendEvents.map((event) => (
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
                        No matches for this weekend filter yet. Placeholder state stays
                        in place until the feed fills in.
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
                    description="This section now merges your matched and potential opportunities the same way search does."
                  />
                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {contributionCards.length > 0 ? (
                      contributionCards.map((card) => (
                        <Box
                          key={card.needId}
                          sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'stretch', sm: 'center' },
                            gap: 1.5,
                            p: 1.7,
                            borderRadius: '24px',
                            border: '1px solid rgba(143, 105, 66, 0.12)',
                            borderLeft: '4px solid #EF9F27',
                            background: 'rgba(255,255,255,0.88)',
                            boxShadow: '0 14px 34px rgba(111, 76, 35, 0.05)',
                            minWidth: 0,
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            sx={{ minWidth: 0, flex: { xs: 'none', sm: '1 1 auto' } }}
                          >
                            <Box
                              sx={{
                                width: 44,
                                height: 44,
                                flexShrink: 0,
                                borderRadius: '16px',
                                display: 'grid',
                                placeItems: 'center',
                                background: '#FAEEDA',
                                fontSize: 20,
                              }}
                            >
                              {card.icon}
                            </Box>
                            <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
                              <Typography
                                sx={{
                                  fontSize: { xs: 14, sm: 14.5 },
                                  fontWeight: 700,
                                  color: '#2B2118',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {card.title}
                              </Typography>
                              <Typography
                                sx={{
                                  mt: 0.4,
                                  fontSize: 12.5,
                                  color: 'rgba(66, 50, 28, 0.68)',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {card.subtitle}
                              </Typography>
                            </Box>
                          </Stack>
                          <Box
                            sx={{
                              flexShrink: 0,
                              textAlign: { xs: 'left', sm: 'right' },
                              alignSelf: { xs: 'flex-start', sm: 'center' },
                            }}
                          >
                            <Typography
                              sx={{
                                fontFamily: 'Syne, sans-serif',
                                fontSize: { xs: 14, sm: 16 },
                                fontWeight: 800,
                                color: '#BA7517',
                              }}
                            >
                              {card.reward}
                            </Typography>
                            <Typography
                              sx={{ fontSize: 11, color: 'rgba(66, 50, 28, 0.56)' }}
                            >
                              {card.rewardLabel}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: '24px',
                          background: 'rgba(255,255,255,0.88)',
                          border: '1px solid rgba(143, 105, 66, 0.12)',
                        }}
                      >
                        <Typography
                          sx={{ fontSize: 14, color: 'rgba(66, 50, 28, 0.72)' }}
                        >
                          No contributor asks are lined up for you yet. This placeholder
                          stays until the opportunity feed has matches.
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <SectionHeading
                    eyebrow="Your network"
                    title="The circles that shape your feed"
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
                  title="Keep the recommendations editorial"
                  description="Recommendations now come from the feed, with placeholders preserved when the list is empty."
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

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                sx={{
                  pt: 1,
                  borderTop: '1px solid rgba(143, 105, 66, 0.10)',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarDays size={16} color="#D85A30" />
                  <Typography sx={{ fontSize: 13, color: 'rgba(66, 50, 28, 0.72)' }}>
                    Your home feed is organized around plans, momentum, and people.
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: 12.5, color: 'rgba(66, 50, 28, 0.56)' }}>
                  {isContentLoading
                    ? 'Refreshing your feed...'
                    : 'Live data wired in with placeholder fallbacks.'}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
