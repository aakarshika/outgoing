import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import Lottie from 'lottie-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { LargeEventCard } from '@/components/events/LargeEventCard';
import { SmallEventCard } from '@/components/events/SmallEventCard';
import { AnyUserCard } from '@/features/events/AnyUserCard';
import {
  useBaseFeed,
  useCategories,
  useIconicHostsFeed,
  useTrendingHighlights,
} from '@/features/events/hooks';
import { HighlightCard } from '@/pages/events/components/HighlightCard';
import { HighlightChainViewer } from '@/pages/events/components/HighlightChainViewer';
import {
  DISCOVERABLE_LIFECYCLE_STATES,
  type BaseFeedEventItem,
  type BaseFeedParams,
  type EventCategory,
} from '@/types/events';
import {
  getStoredSearchLocation,
  inferCityFromLocationLabel,
  LOCATION_PREFERENCES_CHANGED_EVENT,
} from '@/utils/locationPrefs';

const categoryChips = [
  { label: 'Outdoors', icon: '🏃' },
  { label: 'Music', icon: '🎶' },
  { label: 'Food & Drink', icon: '🍽️' },
  { label: 'Arts & Culture', icon: '🎨' },
  { label: 'Gaming', icon: '🎮' },
  { label: 'Wellness', icon: '🧘' },
  { label: 'Tech', icon: '💻' },
  { label: 'Sports', icon: '⚽' },
  { label: 'Books', icon: '📚' },
  { label: 'Film', icon: '🎞️' },
] as const;

const cityCards = [
  { name: 'New York', flag: '🌍', count: '2,400+ events' },
  { name: 'Los Angeles', flag: '🌞', count: '1,800+ events' },
  { name: 'Chicago', flag: '🍂', count: '1,100+ events' },
  { name: 'Atlanta', flag: '🌵', count: '890+ events' },
  { name: 'Miami', flag: '🌴', count: '760+ events' },
  { name: 'Houston', flag: '🏓', count: '640+ events' },
] as const;

const howItWorksCards = [
  {
    icon: '🔍',
    background: '#FAECE7',
    title: 'Discover',
    description:
      "Browse thousands of hyper-local and online events built around your actual interests — from underground jazz nights to niche hobby meetups you didn't know existed.",
  },
  {
    icon: '🎉',
    background: '#FAEEDA',
    title: 'Go further than attending',
    description:
      'Grab a ticket, or claim a contributor role — bring supplies, run the music, cater the food — and earn discounts or get paid. Every event needs people like you.',
  },
  {
    icon: '👥',
    background: '#EAF3DE',
    title: 'Find your people',
    description:
      "Follow groups, meet regulars, and go from stranger to the person everyone's glad showed up. Communities here are built one event at a time.",
  },
  {
    icon: '💡',
    background: '#E6F1FB',
    title: 'Start something',
    description:
      'Got an idea? Post it. Set what you need, watch interest build, and let your community help you pull it off. No venue, no budget required — just a spark.',
  },
] as const;

const filterChips = [
  'This weekend',
  'Tonight',
  'Free',
  'Under $20',
  'Outdoors',
  'New in town',
  'Contributor spots open',
] as const;

type FilterChip = (typeof filterChips)[number];

const SMALL_SECTION_CARD_LIMIT = 8;
const THINGS_TO_DO_CARD_LIMIT = 6;

type ThingsToDoChipConfig = {
  baseParams: BaseFeedParams;
  emptyStateCopy: string;
  postFilter?: (item: BaseFeedEventItem) => boolean;
  sortItems?: (left: BaseFeedEventItem, right: BaseFeedEventItem) => number;
};

function formatTime(dateString: string | undefined | null) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildFeedTimeContext(reference = new Date()) {
  const todayStart = startOfDay(reference);
  const tomorrowStart = addDays(todayStart, 1);
  const weekStart = new Date(todayStart);
  const mondayOffset = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - mondayOffset);
  const weekendStart = addDays(weekStart, 5);
  const nextMonday = addDays(weekStart, 7);
  const effectiveWeekendStart =
    weekendStart.getTime() > reference.getTime() ? weekendStart : reference;

  return {
    nowIso: reference.toISOString(),
    tonight: {
      start_time_gte: reference.toISOString(),
      start_time_lte: tomorrowStart.toISOString(),
    },
    weekend: {
      start_time_gte: effectiveWeekendStart.toISOString(),
      start_time_lte: nextMonday.toISOString(),
    },
  };
}

function mapBaseFeedItemForCard(item: BaseFeedEventItem) {
  const date = new Date(item.event.start_time);

  return {
    ...item,
    ...item.event,
    month: date.toLocaleDateString(undefined, { month: 'short' }),
    day: String(date.getDate()).padStart(2, '0'),
    subtitle: `${item.event.location_name || 'Location TBD'} · ${formatTime(item.event.start_time)}`,
  } as BaseFeedEventItem;
}

function isOnlineEvent(event: BaseFeedEventItem) {
  const locationName = (event.location_name || event.event.location_name || '')
    .trim()
    .toLowerCase();
  const locationAddress = (event.location_address || event.event.location_address || '')
    .trim()
    .toLowerCase();

  return (
    locationName.includes('online') ||
    locationAddress === 'online event' ||
    locationAddress.includes('online')
  );
}

function getOpenNeedsCount(event: BaseFeedEventItem) {
  return event.needs.filter(
    (need) =>
      need.status !== 'filled' &&
      need.status !== 'override_filled' &&
      !need.assigned_vendor,
  ).length;
}

function getPopularityScore(event: BaseFeedEventItem) {
  return event.event_popularity_score || event.ticket_count + event.interest_count;
}

function getCreatedAtMs(event: BaseFeedEventItem) {
  return new Date(event.event.created_at || event.start_time).getTime();
}

function compareByUpcomingTime(left: BaseFeedEventItem, right: BaseFeedEventItem) {
  return new Date(left.start_time).getTime() - new Date(right.start_time).getTime();
}

function compareByPopularity(left: BaseFeedEventItem, right: BaseFeedEventItem) {
  return (
    getPopularityScore(right) - getPopularityScore(left) ||
    compareByUpcomingTime(left, right)
  );
}

function compareByCreated(left: BaseFeedEventItem, right: BaseFeedEventItem) {
  return (
    getCreatedAtMs(right) - getCreatedAtMs(left) || compareByUpcomingTime(left, right)
  );
}

function isOutdoorCategory(category: EventCategory | null | undefined) {
  const haystack = `${category?.slug || ''} ${category?.name || ''}`.toLowerCase();
  return haystack.includes('outdoor') || haystack.includes('sport');
}

function SectionLoadingState() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
      <CircularProgress sx={{ color: '#D85A30' }} />
    </Box>
  );
}

function FeedStripEmptyState({ message }: { message: string }) {
  return (
    <Box
      sx={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 180,
        px: 2,
        borderRadius: '24px',
        border: '0.5px solid var(--color-border-tertiary)',
        background: '#F9F9F9',
      }}
    >
      <Typography
        sx={{
          maxWidth: 420,
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
        }}
      >
        {message}
      </Typography>
    </Box>
  );
}

function SectionHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        sx={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
          mb: 1,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: 'Syne, sans-serif',
          fontSize: { xs: 24, md: 28 },
          fontWeight: 800,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.03em',
        }}
      >
        {title}
      </Typography>
      {description ? (
        <Typography
          sx={{
            fontSize: 15,
            color: 'var(--color-text-secondary)',
            mt: 0.75,
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
      ) : null}
    </Box>
  );
}

function HorizontalScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.75,
        overflowX: 'auto',
        pb: 1,
        scrollSnapType: 'x proximity',
        WebkitOverflowScrolling: 'touch',
        '&::-webkit-scrollbar': {
          height: 8,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(120, 94, 60, 0.18)',
          borderRadius: '999px',
        },
      }}
    >
      {children}
    </Box>
  );
}

export default function GuestLandingPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterChip>(
    'Contributor spots open',
  );
  const [feedTimeContext] = useState(() => buildFeedTimeContext());
  const [storedLocation, setStoredLocation] = useState(() => getStoredSearchLocation());
  const [heroAnimationData, setHeroAnimationData] = useState<object | null>(null);
  const [isHighlightViewerOpen, setIsHighlightViewerOpen] = useState(false);
  const [selectedHighlightId, setSelectedHighlightId] = useState<number | null>(null);
  const { data: categoriesResponse } = useCategories();
  const categories = categoriesResponse?.data || [];

  const outdoorCategorySlugs = useMemo(
    () =>
      categories
        .filter((category) => isOutdoorCategory(category))
        .map((category) => category.slug),
    [categories],
  );

  const locationCoords = storedLocation?.coords ?? null;
  const locationCity =
    storedLocation?.city ||
    inferCityFromLocationLabel(storedLocation?.label || '') ||
    '';

  const nearbyFeedParams = useMemo<BaseFeedParams>(
    () => ({
      sort: locationCoords ? 'distance' : 'popularity',
      lifecycle_states: [...DISCOVERABLE_LIFECYCLE_STATES],
      start_time_gte: feedTimeContext.nowIso,
      lat: locationCoords?.lat,
      lng: locationCoords?.lng,
      page_size: 24,
    }),
    [feedTimeContext.nowIso, locationCoords],
  );

  const onlineFeedParams = useMemo<BaseFeedParams>(
    () => ({
      sort: 'popularity',
      online: true,
      lifecycle_states: [...DISCOVERABLE_LIFECYCLE_STATES],
      start_time_gte: feedTimeContext.nowIso,
      page_size: 24,
    }),
    [feedTimeContext.nowIso],
  );

  const thingsToDoConfigs = useMemo<Record<FilterChip, ThingsToDoChipConfig>>(
    () => ({
      'This weekend': {
        baseParams: {
          sort: 'start_time',
          lifecycle_states: [...DISCOVERABLE_LIFECYCLE_STATES],
          start_time_gte: feedTimeContext.weekend.start_time_gte,
          start_time_lte: feedTimeContext.weekend.start_time_lte,
          page_size: 32,
        },
        emptyStateCopy: 'No weekend events are lined up right now.',
        sortItems: (left, right) =>
          getPopularityScore(right) -
            getPopularityScore(left) +
            (getOpenNeedsCount(right) - getOpenNeedsCount(left)) * 20 ||
          compareByUpcomingTime(left, right),
      },
      Tonight: {
        baseParams: {
          sort: 'start_time',
          lifecycle_states: [...DISCOVERABLE_LIFECYCLE_STATES],
          start_time_gte: feedTimeContext.tonight.start_time_gte,
          start_time_lte: feedTimeContext.tonight.start_time_lte,
          page_size: 32,
        },
        emptyStateCopy: 'No events are happening tonight right now.',
        sortItems: (left, right) => {
          if (left.lifecycle_state === 'live' && right.lifecycle_state !== 'live')
            return -1;
          if (right.lifecycle_state === 'live' && left.lifecycle_state !== 'live')
            return 1;
          return compareByUpcomingTime(left, right) || compareByPopularity(left, right);
        },
      },
      Free: {
        baseParams: {
          sort: 'popularity',
          free_only: true,
          lifecycle_states: [...DISCOVERABLE_LIFECYCLE_STATES],
          start_time_gte: feedTimeContext.nowIso,
          page_size: 32,
        },
        emptyStateCopy: 'No free events are open right now.',
        sortItems: compareByPopularity,
      },
      'Under $20': {
        baseParams: {
          sort: 'popularity',
          lifecycle_states: [...DISCOVERABLE_LIFECYCLE_STATES],
          start_time_gte: feedTimeContext.nowIso,
          page_size: 40,
        },
        emptyStateCopy: 'No low-cost events matched this filter right now.',
        postFilter: (item) => item.min_ticket_price > 0 && item.min_ticket_price <= 20,
        sortItems: (left, right) =>
          left.min_ticket_price - right.min_ticket_price ||
          compareByPopularity(left, right),
      },
      Outdoors: {
        baseParams: {
          sort: 'popularity',
          lifecycle_states: [...DISCOVERABLE_LIFECYCLE_STATES],
          start_time_gte: feedTimeContext.nowIso,
          categories: outdoorCategorySlugs.length ? outdoorCategorySlugs : undefined,
          page_size: 32,
        },
        emptyStateCopy: 'No outdoor or sports events are open right now.',
        postFilter: (item) =>
          outdoorCategorySlugs.length > 0 ? true : isOutdoorCategory(item.category),
        sortItems: compareByPopularity,
      },
      'New in town': {
        baseParams: {
          sort: 'created',
          lifecycle_states: [...DISCOVERABLE_LIFECYCLE_STATES],
          start_time_gte: feedTimeContext.nowIso,
          page_size: 32,
        },
        emptyStateCopy: 'No newly created events are available right now.',
        sortItems: compareByCreated,
      },
      'Contributor spots open': {
        baseParams: {
          sort: 'popularity',
          has_needs: true,
          lifecycle_states: [...DISCOVERABLE_LIFECYCLE_STATES],
          start_time_gte: feedTimeContext.nowIso,
          page_size: 32,
        },
        emptyStateCopy: 'No events with contributor spots open right now.',
        postFilter: (item) => getOpenNeedsCount(item) > 0,
        sortItems: (left, right) => {
          const openNeedsDelta = getOpenNeedsCount(right) - getOpenNeedsCount(left);
          return openNeedsDelta || compareByPopularity(left, right);
        },
      },
    }),
    [feedTimeContext, outdoorCategorySlugs],
  );

  const activeThingsToDoConfig = thingsToDoConfigs[activeFilter];

  const { data: nearbyResponse, isLoading: loadingNearby } =
    useBaseFeed(nearbyFeedParams);
  const { data: onlineResponse, isLoading: loadingOnline } =
    useBaseFeed(onlineFeedParams);
  const { data: thingsToDoResponse, isLoading: loadingThingsToDo } = useBaseFeed(
    activeThingsToDoConfig.baseParams,
  );

  const nearbyEvents = useMemo(
    () =>
      ((nearbyResponse?.data || []) as BaseFeedEventItem[])
        .map(mapBaseFeedItemForCard)
        .filter((event) => !isOnlineEvent(event))
        .slice(0, SMALL_SECTION_CARD_LIMIT),
    [nearbyResponse],
  );

  const onlineEvents = useMemo(
    () =>
      ((onlineResponse?.data || []) as BaseFeedEventItem[])
        .map(mapBaseFeedItemForCard)
        .slice(0, SMALL_SECTION_CARD_LIMIT),
    [onlineResponse],
  );

  const discoverEvents = useMemo(() => {
    let items = [...((thingsToDoResponse?.data || []) as BaseFeedEventItem[])].map(
      mapBaseFeedItemForCard,
    );
    if (activeThingsToDoConfig.postFilter) {
      items = items.filter(activeThingsToDoConfig.postFilter);
    }
    if (activeThingsToDoConfig.sortItems) {
      items.sort(activeThingsToDoConfig.sortItems);
    }
    return items.slice(0, THINGS_TO_DO_CARD_LIMIT);
  }, [activeThingsToDoConfig, thingsToDoResponse]);

  const { data: iconicHostsResponse } = useIconicHostsFeed();
  const { data: trendingHighlightsResponse } = useTrendingHighlights(12);

  const iconicHosts = (iconicHostsResponse?.data || []).slice(0, 8);
  const trendingHighlights = (trendingHighlightsResponse?.data || []).slice(0, 8);

  useEffect(() => {
    let ignore = false;

    fetch('/assets/group-lottie.json')
      .then((response) => response.json())
      .then((data) => {
        if (!ignore) {
          setHeroAnimationData(data);
        }
      })
      .catch(() => {
        if (!ignore) {
          setHeroAnimationData(null);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

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

  const nearbyTitle = locationCity
    ? `Events happening around ${locationCity}`
    : 'Popular in-person events';
  const nearbyDescription = locationCoords
    ? `Using your saved location${locationCity ? ` in ${locationCity}` : ''}`
    : 'Set a search location to sort this strip by distance.';

  return (
    <Box sx={{ background: '#F9F9F9' }}>
      <Box
        sx={{
          background: '#D85A30',
          textAlign: 'center',
          height: '100vh',
          px: 2,
          pt: 12,
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: 900, mb: 10 }}>
          <Chip
            label="Community-powered events"
            sx={{
              mb: 3,
              background: 'rgba(255,255,255,0.18)',
              color: '#fff',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              mt: 2,
              fontSize: 12,
            }}
          />
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: { xs: 38, md: 56 },
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.08,
              letterSpacing: '-0.04em',
              maxWidth: 720,
              mx: 'auto',
            }}
          >
            Show up. Chip in. Belong.
          </Typography>
          {heroAnimationData ? (
            <Box
              sx={{
                width: { xs: 180, md: 220 },
                mx: 'auto',
                mt: { xs: 1.5, md: 2 },
                pointerEvents: 'none',
              }}
            >
              <Lottie animationData={heroAnimationData} loop autoplay />
            </Box>
          ) : null}
          <Typography
            sx={{
              mt: 2,
              fontSize: { xs: 16, md: 18 },
              color: 'rgba(255,255,255,0.85)',
              maxWidth: 580,
              mx: 'auto',
              lineHeight: 1.65,
            }}
          >
            Find activities you care about deeply, or stumble onto something you didn't
            know you loved {'\u2014'}{' '}
            <span className="">
              <strong>then</strong>
            </span>
            <Box
              component="span"
              aria-label="go"
              role="img"
              sx={{
                display: 'inline-block',
                width: { xs: 30, md: 36 },
                height: { xs: 30, md: 35 },
                // pt: 7,
                mx: 0.5,
                transform: 'translateY(10px)',
                backgroundColor: 'currentColor',
                maskImage: "url('/assets/go-sym.png')",
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                maskSize: 'contain',
                WebkitMaskImage: "url('/assets/go-sym.png')",
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                WebkitMaskSize: 'contain',
              }}
            />
            {''}
            <strong>further.</strong>
          </Typography>
          <Typography
            sx={{
              mt: 2,
              fontSize: { xs: 14, md: 16 },
              color: 'rgba(255,255,255,0.85)',
              maxWidth: 400,
              mx: 'auto',
              lineHeight: 1.65,
            }}
          >
            Grab a ticket, bring the snacks, run the music, or post your own idea and
            watch your community make it live.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            justifyContent="center"
            alignItems={'center'}
            sx={{ mt: 4 }}
          >
            <Button
              variant="contained"
              onClick={() => navigate('/signup')}
              sx={{
                px: 4.5,
                py: 1.6,
                width: 260,
                mx: 'auto',
                borderRadius: '999px',
                background: '#fff',
                color: '#D85A30',
                textTransform: 'none',
                fontSize: 16,
                boxShadow: 'none',
              }}
            >
              Join Outgoing
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/search')}
              sx={{
                px: 4.5,
                py: 1.6,
                maxWidth: 240,
                mx: 'auto',
                borderRadius: '999px',
                borderColor: 'rgba(255,255,255,0.5)',
                color: '#fff',
                textTransform: 'none',
                fontSize: 16,
              }}
            >
              Browse events
            </Button>
          </Stack>
        </Container>
      </Box>

      <Box
        sx={{
          height: '0.5px',
          background: 'var(--color-border-tertiary)',
          maxWidth: 960,
          mx: 'auto',
        }}
      />

      <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 4 }, py: 6 }}>
        <SectionHeader
          label="Near you"
          title={nearbyTitle}
          description={nearbyDescription}
        />
        {loadingNearby ? (
          <SectionLoadingState />
        ) : nearbyEvents.length === 0 ? (
          <FeedStripEmptyState message="No in-person events are available right now." />
        ) : (
          <HorizontalScrollRow>
            {nearbyEvents.map((event) => (
              <Box
                key={event.id}
                sx={{
                  flex: '0 0 clamp(260px, 32vw, 320px)',
                  minWidth: 0,
                  scrollSnapAlign: 'start',
                }}
              >
                <SmallEventCard event={event} />
              </Box>
            ))}
          </HorizontalScrollRow>
        )}
      </Container>

      <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 4 }, py: 6 }}>
        <SectionHeader label="Explore by interest" title="Popular categories" />
        <Stack direction="row" flexWrap="wrap" gap={1.25}>
          {categoryChips.map((chip) => (
            <Chip
              key={chip.label}
              label={`${chip.icon} ${chip.label}`}
              onClick={() => navigate('/search')}
              sx={{
                borderRadius: '999px',
                px: 1,
                py: 2.75,
                border: '0.5px solid var(--color-border-tertiary)',
                background: '#F9F9F9',
                color: 'var(--color-text-primary)',
                fontSize: 14,
              }}
            />
          ))}
        </Stack>
      </Container>

      <Box sx={{ background: 'var(--color-background-secondary)', py: 6 }}>
        <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 4 } }}>
          <SectionHeader label="Join from anywhere" title="Events happening online" />
          {loadingOnline ? (
            <SectionLoadingState />
          ) : onlineEvents.length === 0 ? (
            <FeedStripEmptyState message="No online events are open right now." />
          ) : (
            <HorizontalScrollRow>
              {onlineEvents.map((event) => (
                <Box
                  key={event.id}
                  sx={{
                    flex: '0 0 clamp(260px, 32vw, 320px)',
                    minWidth: 0,
                    scrollSnapAlign: 'start',
                  }}
                >
                  <SmallEventCard event={event} />
                </Box>
              ))}
            </HorizontalScrollRow>
          )}
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 4 }, py: 6 }}>
        <SectionHeader label="Find something now" title="Things to do" />
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
          {filterChips.map((chip) => (
            <Chip
              key={chip}
              label={chip}
              onClick={() => setActiveFilter(chip)}
              sx={{
                borderRadius: '999px',
                background: activeFilter === chip ? '#D85A30' : '#F9F9F9',
                color: activeFilter === chip ? '#fff' : 'var(--color-text-primary)',
                border:
                  activeFilter === chip
                    ? '1px solid #D85A30'
                    : '0.5px solid var(--color-border-secondary)',
                px: 1,
              }}
            />
          ))}
        </Stack>
        {loadingThingsToDo ? (
          <SectionLoadingState />
        ) : discoverEvents.length === 0 ? (
          <FeedStripEmptyState message={activeThingsToDoConfig.emptyStateCopy} />
        ) : (
          <HorizontalScrollRow>
            {discoverEvents.map((event) => (
              <Box
                key={event.id}
                sx={{
                  flex: '0 0 clamp(280px, 36vw, 360px)',
                  minWidth: 0,
                  scrollSnapAlign: 'start',
                }}
              >
                <LargeEventCard event={event} showNeeds />
              </Box>
            ))}
          </HorizontalScrollRow>
        )}
      </Container>

      <Box
        sx={{
          height: '0.5px',
          background: 'var(--color-border-tertiary)',
          maxWidth: 960,
          mx: 'auto',
        }}
      />

      <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 4 }, py: 6 }}>
        <SectionHeader
          label="The ones who bring it"
          title="Iconic hosts"
          description="Creators, organisers, and vibe-setters the community keeps coming back for."
        />
        <Box
          sx={{
            display: 'flex',
            gap: 2.5,
            overflowX: 'auto',
            pb: 2,
            pt: 4,
            scrollSnapType: 'x mandatory',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {iconicHosts.map((host: { id: number }) => (
            <Box
              key={host.id}
              sx={{
                scrollSnapAlign: 'start',
                flexShrink: 0,
                width: 'min(320px, calc(100vw - 48px))',
              }}
            >
              <AnyUserCard userId={host.id} />
            </Box>
          ))}
        </Box>
      </Container>

      <Box
        sx={{
          height: '0.5px',
          background: 'var(--color-border-tertiary)',
          maxWidth: 960,
          mx: 'auto',
        }}
      />

      <Box sx={{ background: 'var(--color-background-secondary)', py: 6 }}>
        <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 4 } }}>
          <SectionHeader
            label="What people are talking about"
            title="Trending highlights"
          />
          <HorizontalScrollRow>
            {trendingHighlights.map((highlight: any) => (
              <Box
                key={highlight.id}
                sx={{
                  flex: '0 0 clamp(200px, 25vw, 260px)',
                  minWidth: 0,
                  scrollSnapAlign: 'start',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setSelectedHighlightId(highlight.id);
                  setIsHighlightViewerOpen(true);
                }}
              >
                <HighlightCard highlight={highlight} disableHover />
              </Box>
            ))}
          </HorizontalScrollRow>
        </Container>
      </Box>

      {selectedHighlightId && (
        <HighlightChainViewer
          initialHighlightId={selectedHighlightId}
          isOpen={isHighlightViewerOpen}
          onClose={() => setIsHighlightViewerOpen(false)}
        />
      )}

      <Box
        sx={{
          height: '0.5px',
          background: 'var(--color-border-tertiary)',
          maxWidth: 960,
          mx: 'auto',
        }}
      />

      <Box sx={{ background: 'var(--color-background-secondary)', py: 6 }}>
        <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 4 } }}>
          <SectionHeader label="Go where the people are" title="Popular cities" />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 1.5,
            }}
          >
            {cityCards.map((city) => (
              <Box
                key={city.name}
                onClick={() => navigate('/search')}
                sx={{
                  background: '#F9F9F9',
                  border: '0.5px solid var(--color-border-tertiary)',
                  borderRadius: '24px',
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <Typography sx={{ fontSize: 24, mb: 0.5 }}>{city.flag}</Typography>
                <Typography
                  sx={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {city.name}
                </Typography>
                <Typography
                  sx={{ fontSize: 11, color: 'var(--color-text-secondary)', mt: 0.3 }}
                >
                  {city.count}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 4 }, py: 6 }}>
        <SectionHeader
          label="How it works"
          title="Four ways to go"
          description="However you show up, Outgoing makes it count."
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 2,
          }}
        >
          {howItWorksCards.map((card) => (
            <Box
              key={card.title}
              sx={{
                background: '#F9F9F9',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: '24px',
                p: 2.5,
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '16px',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 20,
                  background: card.background,
                  mb: 1.5,
                }}
              >
                {card.icon}
              </Box>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  mb: 0.75,
                }}
              >
                {card.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.55,
                }}
              >
                {card.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>

      <Box
        sx={{
          background: '#D85A30',
          height: '70vh',
          textAlign: 'center',
          px: 2,
          py: { xs: 7, md: 8 },
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: 800 }}>
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: { xs: 30, md: 40 },
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
            }}
          >
            Go as a guest, a group,
            <br />
            or a contributor.
          </Typography>
          <Typography
            sx={{
              mt: 1.5,
              fontSize: 16,
              color: 'rgba(255,255,255,0.85)',
              maxWidth: 480,
              mx: 'auto',
            }}
          >
            Or go be the one who started it all.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            justifyContent="center"
            sx={{ mt: 4 }}
          >
            <Button
              variant="contained"
              onClick={() => navigate('/search?tab=trending')}
              sx={{
                px: 4.5,
                py: 1.6,
                borderRadius: '999px',
                background: '#fff',
                color: '#D85A30',
                textTransform: 'none',
                fontSize: 16,
                boxShadow: 'none',
              }}
            >
              Browse all events
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/signup')}
              sx={{
                px: 4.5,
                py: 1.6,
                borderRadius: '999px',
                borderColor: 'rgba(255,255,255,0.5)',
                color: '#fff',
                textTransform: 'none',
                fontSize: 16,
              }}
            >
              Start an event
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
