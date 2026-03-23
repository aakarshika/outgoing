import { Box, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { CalendarClock, Flame, Coins, MonitorPlay, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { LargeEventCard } from '@/components/events/LargeEventCard';
import { useBaseFeed } from '@/features/events/hooks';
import {
  DISCOVERABLE_LIFECYCLE_STATES,
  type BaseFeedEventItem,
  type BaseFeedParams,
} from '@/types/events';

import { SimpleNavbarMobile } from './components/SimpleNavbarMobile';
import { SimpleNavbarSearch } from './components/SimpleNavbarSearch';

const exploreTabs = [
  {
    id: 'trending',
    label: 'Trending',
    Icon: Flame,
    accent: '#D85A30',
    wash: '#FAECE7',
  },
  {
    id: 'upcoming',
    label: 'Upcoming',
    Icon: CalendarClock,
    accent: '#2C7BE5',
    wash: '#E6F1FB',
  },
  {
    id: 'free',
    label: 'Free',
    Icon: Sparkles,
    accent: '#2F8F4E',
    wash: '#EAF3DE',
  },
  {
    id: 'opportunities',
    label: 'Opprtunities',
    Icon: Coins,
    accent: '#A258C6',
    wash: '#F3E7FB',
  },
  {
    id: 'online',
    label: 'Online',
    Icon: MonitorPlay,
    accent: '#C78319',
    wash: '#FAEEDA',
  },
] as const;

type ExploreTabId = (typeof exploreTabs)[number]['id'];

const tabAliases: Record<string, ExploreTabId> = {
  all: 'trending',
  trending: 'trending',
  upcoming: 'upcoming',
  'tonight-weekend': 'upcoming',
  free: 'free',
  'free-cheap': 'free',
  opportunities: 'opportunities',
  'chip-in': 'opportunities',
  online: 'online',
  'my-network': 'trending',
};

function normalizeTab(value: string | null): ExploreTabId {
  if (!value) return 'trending';
  return tabAliases[value] || 'trending';
}

function formatTime(dateString: string | undefined | null) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
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

function buildSearchHaystack(event: BaseFeedEventItem) {
  return [
    event.title,
    event.description,
    event.location_name,
    event.location_address,
    event.category?.name,
    event.category?.slug,
    event.host?.username,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

const TAB_SHRINK_DISTANCE = 180;

function ExploreEmptyState({ message }: { message: string }) {
  return (
    <Box
      sx={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 220,
        px: 3,
        borderRadius: '24px',
        border: '1px solid rgba(120, 94, 60, 0.14)',
        background: '#FFFCF7',
        boxShadow: '0 20px 40px rgba(86, 58, 28, 0.06)',
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

function ExploreStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
        flex: 1,
        borderRadius: '20px',
        border: '1px solid rgba(120, 94, 60, 0.12)',
        background: '#fff7ed',
        px: 2,
        py: 1.75,
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(61, 49, 36, 0.55)',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.4,
          fontFamily: 'Syne, sans-serif',
          fontSize: { xs: 22, md: 28 },
          fontWeight: 800,
          letterSpacing: '-0.04em',
          color: accent,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tabShrinkProgress, setTabShrinkProgress] = useState(2);
  const rawTab = searchParams.get('tab');
  const tab = normalizeTab(rawTab);
  const search = (searchParams.get('search') || '').trim().toLowerCase();
  const locationLabel = (searchParams.get('location') || '').trim();
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const nowIso = useMemo(() => new Date().toISOString(), []);

  useEffect(() => {
    if (rawTab === tab) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  }, [rawTab, searchParams, setSearchParams, tab]);

  const tabMetrics = useMemo(() => {
    const progress = tabShrinkProgress;

    return {
      /** Fully hidden at end of tab shrink range (no mini title). */
      exploreSectionMaxHeight: 140 * (1 - progress),
      exploreSectionOpacity: 1 - progress,
      borderRadius: 22 - progress * 4,
      px: 1.4 - progress * 0.3,
      py: 1.2 - progress * 0.35,
      my: 2 - progress * 0.6,
      minWidthXs: 118 - progress * 18,
      minWidthMd: 128 - progress * 18,
      iconSize: 44 - progress * 10,
      iconRadius: 16 - progress * 4,
      iconStroke: 2.4 - progress * 0.3,
      glyphSize: 24 - progress * 4,
      labelFontSize: 13 - progress,
      stackSpacing: 0.8 - progress * 0.35,
    };
  }, [tabShrinkProgress]);

  const feedParams = useMemo<BaseFeedParams>(() => {
    const params: BaseFeedParams = {
      sort: tab === 'upcoming' ? 'start_time' : 'popularity',
      lifecycle_states: [...DISCOVERABLE_LIFECYCLE_STATES],
      start_time_gte: nowIso,
      page_size: 100,
      lat: hasCoords && tab !== 'online' ? lat : undefined,
      lng: hasCoords && tab !== 'online' ? lng : undefined,
    };

    if (tab === 'free') {
      params.free_only = true;
    }
    if (tab === 'opportunities') {
      params.has_needs = true;
    }
    if (tab === 'online') {
      params.online = true;
      params.lat = undefined;
      params.lng = undefined;
    }

    return params;
  }, [hasCoords, lat, lng, nowIso, tab]);


  const { data: feedResponse, isLoading } = useBaseFeed(feedParams);

  const events = useMemo(() => {
    let items = ((feedResponse?.data || []) as BaseFeedEventItem[]).map(
      mapBaseFeedItemForCard,
    );

    if (tab === 'opportunities') {
      items = items.filter((item) => getOpenNeedsCount(item) > 0);
    }

    if (tab === 'online') {
      items = items.filter(isOnlineEvent);
    }

    if (search) {
      items = items.filter((item) => buildSearchHaystack(item).includes(search));
    }

    return items;
  }, [feedResponse, search, tab]);

  const handleTabChange = (nextTab: ExploreTabId) => {
    if (nextTab === tab) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', nextTab);
    setSearchParams(next, { replace: true });
  };


  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'rgba(237, 232, 226, 0.9)',
        boxShadow: '0 24px 60px rgba(86, 58, 28, 0.08)',
      }}
    >
      <SimpleNavbarSearch />
      <Box sx={{  }}>
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
        backgroundColor: 'rgba(237, 232, 226, 0.9)',
            
            // borderBottom: '1px solid rgba(120, 94, 60, 0.12)',
          }}
        >
          <Container
          disableGutters
            maxWidth={false}
            sx={{ maxWidth: 1040, pt: 8}}
          >
            <Box
              sx={{
                display: 'flex',
                // gap: 1,
                overflowX: 'auto',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
                scrollbarWidth: 'none',
              }}
            >
              {exploreTabs.map((item) => {
                const isActive = item.id === tab;

                return (
                  <Box
                    key={item.id}
                    component="button"
                    type="button"
                    onClick={() => handleTabChange(item.id)}
                    sx={{
                      color: isActive ? '#D85A30' : '#3D3124',
                      // borderRadius: `${tabMetrics.borderRadius}px`,
                      px: tabMetrics.px,
                      py: tabMetrics.py,
                      minWidth: { xs: tabMetrics.minWidthXs, md: tabMetrics.minWidthMd },
                      fontSize: 14,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Stack
                      spacing={tabMetrics.stackSpacing}
                      alignItems="center"
                      justifyContent="center"
                      sx={{ minWidth: 0 }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: tabMetrics.iconSize,
                          height: tabMetrics.iconSize,
                          borderRadius: `${tabMetrics.iconRadius}px`,
                        }}
                      >
                        <item.Icon size={tabMetrics.glyphSize} strokeWidth={tabMetrics.iconStroke} />
                      </Box>
                      <Typography
                        sx={{
                          fontSize: tabMetrics.labelFontSize,
                          fontWeight: 700,
                          lineHeight: 1.1,
                          color: 'inherit',
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Container>
        </Box>

        <Container
          maxWidth={false}
          sx={{ maxWidth: 1040, px: { xs: 2, md: 4 }, py: 1 }}
        >

              <Stack spacing={3}>
              {events?.map((event) => (
                <LargeEventCard key={event.id} event={event} />
              ))}
            </Stack>
        </Container>
      </Box>
    </Box>
  );
}
