import { Box, CircularProgress, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import type { EventCardEvent } from '@/components/events/useEventCards';
import { useAuth } from '@/features/auth/hooks';
import { useBaseFeed } from '@/features/events/hooks';
import { useEventOverviewRows } from '@/features/events/hooks';
import { ProfileService } from '@/pages/profile/Profile.service';
import {
  DISCOVERABLE_LIFECYCLE_STATES,
  type BaseFeedEventItem,
  type BaseFeedParams,
} from '@/types/events';
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
  fun: ['comedy', 'music', 'networking', 'festivals', 'nightlife', 'food', 'arts'],
  social: ['networking', 'social', 'workshops', 'arts', 'food', 'tech', 'festivals'],
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

import { MyHomeActionsSection } from './MyHomeActionsSection';
import { MyHomeChipInSection } from './MyHomeChipInSection';
import { MyHomeEmptyUpcomingCarousel } from './MyHomeEmptyUpcomingCarousel';
import { MyHomeNetworkSection } from './MyHomeNetworkSection';
import { MyHomeRecommendationsSection } from './MyHomeRecommendationsSection';
import { SectionHeading } from './MyHomeSectionHeading';
import { MyHomeTrendingSection } from './MyHomeTrendingSection';
import { MyHomeUpcomingSection } from './MyHomeUpcomingSection';

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

function mapBaseFeedItemForCard(item: BaseFeedEventItem) {
  const date = new Date(item.event.start_time);

  return {
    ...item,
    ...item.event,
    month: date.toLocaleDateString(undefined, { month: 'short' }),
    day: String(date.getDate()).padStart(2, '0'),
  } as BaseFeedEventItem;
}

function isOnlineEvent(event: EventCardEvent) {
  const locationName = (event.location_name || '').trim().toLowerCase();
  const locationAddress = (event.location_address || '').trim().toLowerCase();

  return (
    locationName.includes('online') ||
    locationAddress === 'online event' ||
    locationAddress.includes('online')
  );
}

function isFreeEvent(event: BaseFeedEventItem) {
  return event.min_ticket_price === 0;
}

function isCurrentOrUpcomingEvent(event: EventCardEvent) {
  if (!event.start_time) return false;
  const now = Date.now();
  const endTime = event.end_time ? new Date(event.end_time).getTime() : NaN;
  const fallbackTime = new Date(event.start_time).getTime();
  const relevantEnd = Number.isNaN(endTime) ? fallbackTime : endTime;
  return relevantEnd >= now;
}

function isInTonightWindow(event: EventCardEvent) {
  if (!event.start_time) return false;
  const { start, end } = getTodayWindow();
  const eventStart = new Date(event.start_time);
  return eventStart >= start && eventStart < end;
}

function isInThisWeekendWindow(event: EventCardEvent) {
  if (!event.start_time) return false;
  const { start, end, weekendStart } = getThisWeekendWindow();
  const eventStart = new Date(event.start_time);
  return eventStart >= start && eventStart >= weekendStart && eventStart < end;
}

export default function MyHomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedTrendingFilters, setSelectedTrendingFilters] = useState<
    TrendingFeedFilter[]
  >(['this-weekend']);
  const [storedLocation, setStoredLocation] = useState(() => getStoredSearchLocation());

  const { data: profileResponse, isLoading: isProfileLoading } = useQuery({
    queryKey: ['my-home', 'profile', user?.username],
    queryFn: () => ProfileService.getPublicProfile(user!.username),
    enabled: !!user?.username,
  });

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
  const locationQuery =
    storedLocation?.label?.trim() || profile?.location_city?.trim() || undefined;
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
  const nowIso = useMemo(() => new Date().toISOString(), []);
  const trendingTimeRange = useMemo(() => {
    if (selectedDateFilters.length === 0) return null;
    if (selectedDateFilters.includes('this-weekend')) {
      const { end } = getThisWeekendWindow();
      return {
        start_time_gte: nowIso,
        start_time_lte: end.toISOString(),
      };
    }
    const { end } = getTodayWindow();
    return {
      start_time_gte: nowIso,
      start_time_lte: end.toISOString(),
    };
  }, [nowIso, selectedDateFilters]);
  const trendingCategorySlugs = useMemo(
    () =>
      Array.from(
        new Set(
          selectedCategoryFilters.flatMap(
            (filter) => trendingCategoryGroups[filter] as readonly string[],
          ),
        ),
      ),
    [selectedCategoryFilters],
  );
  const trendingFeedParams = useMemo<BaseFeedParams>(
    () => ({
      sort: 'popularity',
      lifecycle_states: [...DISCOVERABLE_LIFECYCLE_STATES],
      free_only: selectedFormatFilters.includes('free') || undefined,
      online: selectedFormatFilters.includes('online') || undefined,
      categories: trendingCategorySlugs.length ? trendingCategorySlugs : undefined,
      start_time_gte: trendingTimeRange?.start_time_gte || nowIso,
      start_time_lte: trendingTimeRange?.start_time_lte,
      page_size: 120,
    }),
    [nowIso, selectedFormatFilters, trendingCategorySlugs, trendingTimeRange],
  );
  const recommendedFeedParams = useMemo<BaseFeedParams>(
    () => ({
      sort: 'popularity',
      lifecycle_states: [...DISCOVERABLE_LIFECYCLE_STATES],
      start_time_gte: nowIso,
      page_size: 24,
    }),
    [nowIso],
  );
  // Replaced by useEventOverviewRows for personalized upcoming section
  // const upcomingFeedParams = useMemo<BaseFeedParams>(
  //   () => ({
  //     sort: 'start_time',
  //     status: ['published', 'event_ready', 'live'],
  //     start_time_gte: nowIso,
  //     page_size: 6,
  //   }),
  //   [nowIso],
  // );
  const chipInFeedParams = useMemo<BaseFeedParams>(
    () => ({
      sort: 'popularity',
      has_needs: true,
      lifecycle_states: [...DISCOVERABLE_LIFECYCLE_STATES],
      start_time_gte: nowIso,
      page_size: 6,
    }),
    [nowIso],
  );
  const { data: trendingResponse } = useBaseFeed(trendingFeedParams);
  const { data: recommendedResponse } = useBaseFeed(recommendedFeedParams);
  const { data: eventOverviewResponse } = useEventOverviewRows(isAuthenticated);
  const { data: chipInResponse } = useBaseFeed(chipInFeedParams);
  const allTrendingSearchHref = useMemo(() => {
    const params = new URLSearchParams({ tab: 'trending' });
    if (locationQuery) params.set('location', locationQuery);
    return `/search?${params.toString()}`;
  }, [locationQuery]);

  const trendingEvents = useMemo(
    () =>
      ((trendingResponse?.data || []) as BaseFeedEventItem[])
        .map(mapBaseFeedItemForCard)
        .filter((event) => !!event.start_time && isCurrentOrUpcomingEvent(event))
        .filter((event) => {
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
        }),
    [
      selectedCategoryFilters,
      selectedDateFilters,
      selectedFormatFilters,
      trendingResponse,
    ],
  );
  const upcomingEvents = useMemo(() => {
    if (!eventOverviewResponse || !user) return [];

    const userId = user.id;
    const now = Date.now();

    const personalEventsMap = new Map<number, BaseFeedEventItem>();

    for (const row of eventOverviewResponse) {
      // Logic borrowed from EventSpecialPage.tsx
      if (['completed', 'cancelled'].includes(row.event_lifecycle_state)) continue;

      const detail = row.event_details;
      if (!detail) continue;

      const isHost = row.host_user_id === userId;
      const isVendor =
        row.need_applied_to_user_id === userId ||
        row.need_application_requested_by_host_vendor_user_id === userId ||
        row.need_assigned_user_id === userId;
      const isAttendee =
        row.attendee_user_id === userId && row.ticket_status !== 'cancelled';

      if (isHost || isVendor || isAttendee) {
        const item: BaseFeedEventItem = {
          ...detail,
          event: detail,
          i_am_host: isHost,
          user_is_vendor: isVendor, // Corrected from event_details.user_is_vendor for more accuracy from view
          user_has_ticket: isAttendee,
          // user_is_interested: detail.user_is_interested, // keep current
          needs: detail.participating_vendors ? [] : [], // BaseFeedEventItem needs 'needs' array
        } as unknown as BaseFeedEventItem;

        personalEventsMap.set(detail.id, mapBaseFeedItemForCard(item));
      }
    }

    return Array.from(personalEventsMap.values())
      .filter(isCurrentOrUpcomingEvent)
      .sort((a, b) => {
        const timeA = new Date(a.start_time).getTime();
        const timeB = new Date(b.start_time).getTime();
        return timeA - timeB;
      })
      .slice(0, 3);
  }, [eventOverviewResponse, user]);

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
      ...upcomingEvents.map((event) => event.id),
      ...filteredTrendingEvents.map((event) => event.id),
    ]);

    return ((recommendedResponse?.data || []) as BaseFeedEventItem[])
      .filter((event) => !seen.has(event.id))
      .map(mapBaseFeedItemForCard)
      .slice(0, 6);
  }, [filteredTrendingEvents, recommendedResponse, upcomingEvents]);

  const chipInEvents = useMemo(
    () =>
      ((chipInResponse?.data || []) as BaseFeedEventItem[])
        .map(mapBaseFeedItemForCard)
        .filter((event) => event.needs.length > 0)
        .slice(0, 4),
    [chipInResponse],
  );

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
      }}
    >
      <Box
        className="pt-14 pb-32"
        sx={{
          borderBottom: '1px solid rgba(143, 105, 66, 0.10)',
          background:
            'rgba(237, 232, 226, 0.9)',

          backdropFilter: 'blur(14px)',
        }}
      >
        <Box sx={{}}>
          <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 4, md: 4 } }}>
            <SectionHeading
              eyebrow={`${upcomingEvents.length > 0 ? `Welcome back,` : `Welcome to Outgoing!`}`}
              title={`Outgoer ${user?.username}!`}
              description={`${
                upcomingEvents.length > 1
                  ? `Your ${upcomingEvents.length} upcoming events...`
                  : upcomingEvents.length > 0
                    ? `Your first upcoming event`
                    : ``
              }`}
            />
            {upcomingEvents.length === 0 ? <MyHomeEmptyUpcomingCarousel /> : null}
          </Box>
          <MyHomeUpcomingSection
            upcomingEvents={upcomingEvents}
            hasUpcomingEvents={upcomingEvents.length > 0}
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
                <MyHomeChipInSection chipInEvents={chipInEvents} />

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
    </Box>
  );
}
