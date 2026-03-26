import { Box, Container, Stack } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { LargeEventCard } from '@/components/events/LargeEventCard';
import { useBaseFeed } from '@/features/events/hooks';
import {
  DISCOVERABLE_LIFECYCLE_STATES,
  type BaseFeedEventItem,
  type BaseFeedParams,
} from '@/types/events';
import { getNearYouCoords, getStoredSearchLocation } from '@/utils/locationPrefs';

import { SimpleNavbarSearch } from './components/SimpleNavbarSearch';
import SearchTabs from './SearchTabs';
import { normalizeTab } from './searchTabsConfig';

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


export default function NearbyMapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab = normalizeTab(rawTab);
  const search = (searchParams.get('search') || '').trim().toLowerCase();
  const storedSearchLocation = getStoredSearchLocation();
  const nearYouCoords = getNearYouCoords();

  const effectiveCoords = useMemo(() => {
    if (tab === 'online') return null;
    return nearYouCoords ?? storedSearchLocation?.coords ?? null;
  }, [nearYouCoords, storedSearchLocation, tab]);
  const nowIso = useMemo(() => new Date().toISOString(), []);

  useEffect(() => {
    if (rawTab === tab) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  }, [rawTab, searchParams, setSearchParams, tab]);

  const feedParams = useMemo<BaseFeedParams>(() => {
    const params: BaseFeedParams = {
      sort:
        tab === 'upcoming'
          ? 'start_time'
          : effectiveCoords
            ? 'distance'
            : 'popularity',
      lifecycle_states: [...DISCOVERABLE_LIFECYCLE_STATES],
      start_time_gte: nowIso,
      page_size: 100,
      lat: effectiveCoords?.lat,
      lng: effectiveCoords?.lng,
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
  }, [effectiveCoords, nowIso, tab]);


  const { data: feedResponse } = useBaseFeed(feedParams);

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


  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'rgba(237, 232, 226, 0.9)',
        boxShadow: '0 24px 60px rgba(86, 58, 28, 0.08)',
      }}
    >
      <SimpleNavbarSearch />
      <SearchTabs />
      <Container
        maxWidth={false}
        sx={{ maxWidth: 1040, px: { xs: 2, md: 4 }, py: 1 }}
      >
        {/* TODO: Add map here */}
        {/* the event markers will be circular markers with the event title as the label, and cover_image as the icon */}
        {/* when clicked, there will be a bottom sheet with the event details - use LargeEventCard for the content */}
      </Container>
    </Box>
  );
}
