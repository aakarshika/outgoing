import { Box, CircularProgress, Stack } from '@mui/material';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import client from '@/api/client';
import { QuickCreateServiceDialog } from '@/components/vendors/QuickCreateServiceDialog';
import { useAuth } from '@/features/auth/hooks';
import { fetchEvent } from '@/features/events/api';
import { useFeed, useMyInterestedEvents } from '@/features/events/hooks';
import {
  fetchAllOpenOpportunities,
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
  outdoors: ['outdoor', 'sports'],
  fun: [
    'comedy',
    'music',
    'networking',
    'festivals',
    'nightlife',
    'food',
    'arts',
  ],
  social: [
    'networking',
    'social',
    'workshops',
    'arts',
    'food',
    'tech',
    'festivals',
  ],
  'play-school': ['arts', 'workshops'],
  tech: ['tech', 'networking'],
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
  cover_image?: string;
  category?: {
    slug?: string;
    name?: string;
  } | null;
  month: string;
  day: string;
  title: string;
  subtitle: string;
  start_time?: string;
  pill: { label: string; background: string; color: string };
};

import { MyHomeActionsSection } from './MyHomeActionsSection';
import { MyHomeChipInSection } from './MyHomeChipInSection';
import { MyHomeNetworkSection } from './MyHomeNetworkSection';
import { MyHomeRecommendationsSection } from './MyHomeRecommendationsSection';
import { MyHomeTrendingSection } from './MyHomeTrendingSection';
import { MyHomeUpcomingSection } from './MyHomeUpcomingSection';

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

  const trendingEvents = useMemo(
    () =>
      ((trendingResponse?.data || []) as EventListItem[]).filter(
        (event) => !!event.start_time && isCurrentOrUpcomingEvent(event),
      ),
    [trendingResponse],
  );
  const overviewRows = (overviewResponse?.data?.data || []) as EventOverviewRow[];
  const savedEvents = (savedResponse?.data || []) as EventListItem[];

  const upcomingEvents = useMemo<any[]>(() => {
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
        start_time: detail.start_time,
        cover_image: detail.cover_image || undefined,
        category: detail.category,

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
        cover_image: event.cover_image || undefined,
        category: event.category,
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


  // const nextEvent = upcomingEvents[0];
  // const nextEventCountdown = getCountdownParts(nextEvent?.start_time);
  // const nextEventTitle =
  //   nextEvent?.title || 'Trending events will show up here';
  // const nextEventDateTimeLabel = nextEvent
  //   ? `${formatDate(nextEvent.start_time, {
  //       weekday: 'short',
  //       month: 'short',
  //       day: 'numeric',
  //     })}, ${formatTime(nextEvent.start_time)}`
  //   : 'Check back soon';
  // const nextEventLocationLabel = nextEvent?.location_name || locationLabel;


  const hasUpcomingEvents = upcomingEvents.length > 0;
  const weekendFeedTitle = hasUpcomingEvents
    ? 'A sharper feed for your next yes'
    : 'Your first yes starts here';
  const baseTrendingEvents = trendingEvents;

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
      // nextEvent?.id || -1,
      ...filteredTrendingEvents.map((event) => event.id),
    ]);

    return ((recommendedResponse?.data || []) as EventListItem[])
      .filter((event) => !seen.has(event.id))
      .slice(0, 6);
  }, [filteredTrendingEvents, recommendedResponse]);

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
      <Box 
      className="pt-10 pb-32"
      >
        <Box
          sx={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(255,250,243,0.92) 100%)',
            boxShadow: '0 32px 90px rgba(113, 74, 35, 0.10)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <MyHomeUpcomingSection
            hasUpcomingEvents={hasUpcomingEvents}
            upcomingEvents={upcomingEvents}
          />
          <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 } }}>
            <Stack spacing={4}>
              <MyHomeTrendingSection
                title={weekendFeedTitle}
                allTrendingSearchHref={allTrendingSearchHref}
                trendingFeedFilters={trendingFeedFilters}
                selectedTrendingFilters={selectedTrendingFilters}
                onToggleFilter={(filterId) =>
                  toggleTrendingFilter(filterId as TrendingFeedFilter)
                }
                onClearFilters={clearTrendingFilters}
                filteredTrendingEvents={filteredTrendingEvents}
              />

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', xl: '1.2fr 0.8fr' },
                  gap: 3,
                  minWidth: 0,
                }}
              >
                <MyHomeChipInSection
                  contributionEventCards={contributionEventCards}
                  eventDetailByEventId={eventDetailByEventId}
                  matchedOpportunityNeedIds={matchedOpportunityNeedIds}
                  onOpenQuickCreateService={openQuickCreateService}
                />

                <MyHomeNetworkSection
                  groups={networkGroups}
                  onClickGroup={() => navigate('/network')}
                />
              </Box>

              <MyHomeRecommendationsSection recommendedEvents={recommendedEvents} />

              <MyHomeActionsSection />
            </Stack>
          </Box>
        </Box>
      </Box>
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
