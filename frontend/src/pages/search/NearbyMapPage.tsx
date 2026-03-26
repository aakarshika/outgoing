import { Avatar, Box, Container, Drawer, Stack, Typography } from '@mui/material';
import { MapPin, Navigation } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { LargeEventCard } from '@/components/events/LargeEventCard';
import { useBaseFeed } from '@/features/events/hooks';
import {
  type BaseFeedEventItem,
  type BaseFeedParams,
  DISCOVERABLE_LIFECYCLE_STATES,
} from '@/types/events';
import { getNearYouCoords, getStoredSearchLocation } from '@/utils/locationPrefs';

import { SimpleNavbarSearch } from './components/SimpleNavbarSearch';
import SearchTabs from './SearchTabs';
import { normalizeTab } from './searchTabsConfig';

type Coords = {
  lat: number;
  lng: number;
};

const TILE_SIZE = 250;

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

function parseCoordinate(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function latLngToWorld(coords: Coords): { x: number; y: number } {
  const sinLat = Math.sin((coords.lat * Math.PI) / 180);
  const x = (coords.lng + 180) / 360;
  const y = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);
  return { x, y };
}

function coordToPercent(
  target: Coords,
  center: Coords,
  zoom: number,
  containerW: number,
  containerH: number,
): { left: string; top: string } {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const centerWorld = latLngToWorld(center);
  const targetWorld = latLngToWorld(target);
  const dx = (targetWorld.x - centerWorld.x) * scale;
  const dy = (targetWorld.y - centerWorld.y) * scale;
  const left = ((containerW / 2 + dx) / containerW) * 100;
  const top = ((containerH / 2 + dy) / containerH) * 100;

  return {
    left: `${Math.max(4, Math.min(96, left))}%`,
    top: `${Math.max(4, Math.min(96, top))}%`,
  };
}

function fitView(
  points: Coords[],
  userCoords?: Coords | null,
): { center: Coords; zoom: number } {
  if (points.length === 0) return { center: { lat: 39.5, lng: -98.35 }, zoom: 4 };
  if (points.length === 1) {
    const only = userCoords ?? points[0];
    return { center: only, zoom: 13 };
  }

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const center = userCoords ?? {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2,
  };

  const span = Math.max(maxLat - minLat, maxLng - minLng, 0.001);
  const computedZoom = Math.max(3, Math.min(14, Math.round(Math.log2(180 / span)) - 1));
  const zoom = userCoords ? Math.max(11, computedZoom) : computedZoom;
  return { center, zoom };
}

function buildEmbedUrl(center: Coords, zoom: number): string {
  return `https://maps.google.com/maps?ll=${center.lat},${center.lng}&z=${zoom}&output=embed`;
}

type MapEventItem = BaseFeedEventItem & {
  eventCoords: Coords;
};

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
        tab === 'upcoming' ? 'start_time' : effectiveCoords ? 'distance' : 'popularity',
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

  const mapBoxRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ width: 1000, height: 1000 });
  const [selectedEventId, setSelectedEventId] = useState<string | number | null>(null);

  const eventsWithCoords = useMemo<MapEventItem[]>(() => {
    return events
      .map((event) => {
        const lat = parseCoordinate(event.event.latitude ?? event.latitude);
        const lng = parseCoordinate(event.event.longitude ?? event.longitude);
        if (lat === null || lng === null) return null;
        return {
          ...event,
          eventCoords: { lat, lng },
        };
      })
      .filter((item): item is MapEventItem => Boolean(item));
  }, [events]);

  useEffect(() => {
    setSelectedEventId((current) => {
      if (!current) return null;
      return eventsWithCoords.some((event) => event.id === current) ? current : null;
    });
  }, [eventsWithCoords]);

  const selectedEvent = useMemo(
    () => eventsWithCoords.find((event) => event.id === selectedEventId) ?? null,
    [eventsWithCoords, selectedEventId],
  );

  const userCoords = useMemo<Coords | null>(() => {
    if (effectiveCoords?.lat == null || effectiveCoords?.lng == null) return null;
    return {
      lat: Number(effectiveCoords.lat),
      lng: Number(effectiveCoords.lng),
    };
  }, [effectiveCoords]);

  const mapPoints = useMemo(() => {
    const points = eventsWithCoords.map((event) => event.eventCoords);
    if (userCoords) points.push(userCoords);
    return points;
  }, [eventsWithCoords, userCoords]);

  const view = useMemo(() => fitView(mapPoints, userCoords), [mapPoints, userCoords]);
  const mapEmbedUrl = useMemo(() => buildEmbedUrl(view.center, view.zoom), [view]);
  const userMarkerPos = useMemo(() => {
    if (!userCoords) return null;
    return coordToPercent(
      userCoords,
      view.center,
      view.zoom,
      mapSize.width,
      mapSize.height,
    );
  }, [mapSize.height, mapSize.width, userCoords, view.center, view.zoom]);

  useEffect(() => {
    const node = mapBoxRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setMapSize({
        width: Math.max(1, width),
        height: Math.max(1, height),
      });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

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
      <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 4 }, py: 1 }}>
        <Box
          ref={mapBoxRef}
          sx={{
            position: 'relative',
            height: { xs: 'calc(100vh - 190px)', md: 'calc(100vh - 210px)' },
            minHeight: 420,
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(86, 58, 28, 0.16)',
            backgroundColor: '#e9ecef',
          }}
        >
          <Box
            component="iframe"
            title="Nearby events map"
            src={mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 0,
              filter: 'saturate(1.08) contrast(1.02)',
              pointerEvents: 'none',
            }}
          />

          {eventsWithCoords.map((event) => {
            const markerPos = coordToPercent(
              event.eventCoords,
              view.center,
              view.zoom,
              mapSize.width,
              mapSize.height,
            );
            const isSelected = selectedEventId === event.id;

            return (
              <Box
                key={event.id}
                component="button"
                type="button"
                onClick={() => setSelectedEventId(event.id)}
                sx={{
                  position: 'absolute',
                  left: markerPos.left,
                  top: markerPos.top,
                  transform: 'translate(-50%, -50%)',
                  border: 0,
                  background: 'transparent',
                  p: 0,
                  cursor: 'pointer',
                  zIndex: isSelected ? 3 : 2,
                }}
              >
                <Stack spacing={0.6} alignItems="center">
                  <Typography
                    sx={{
                      px: 1,
                      py: 0.35,
                      borderRadius: 99,
                      bgcolor: 'rgba(255,255,255,0.94)',
                      border: isSelected
                        ? '2px solid rgba(216, 90, 48, 0.7)'
                        : '1px solid rgba(17,24,39,0.16)',
                      boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      maxWidth: 140,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {event.title}
                  </Typography>
                  <Avatar
                    src={event.cover_image || undefined}
                    alt={event.title}
                    sx={{
                      width: isSelected ? 42 : 36,
                      height: isSelected ? 42 : 36,
                      border: `3px solid ${isSelected ? '#D85A30' : '#ffffff'}`,
                      boxShadow: '0 8px 16px rgba(0,0,0,0.24)',
                    }}
                  />
                </Stack>
              </Box>
            );
          })}

          {userCoords && (
            <Box
              sx={{
                position: 'absolute',
                left: userMarkerPos?.left,
                top: userMarkerPos?.top,
                transform: 'translate(-50%, -50%)',
                zIndex: 4,
              }}
            >
              <Stack spacing={0.5} alignItems="center">
                <Typography
                  sx={{
                    px: 0.9,
                    py: 0.35,
                    borderRadius: 99,
                    bgcolor: 'rgba(37,99,235,0.92)',
                    color: '#fff',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                >
                  You
                </Typography>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: '#2563eb',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    border: '3px solid #fff',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.24)',
                  }}
                >
                  <Navigation size={14} />
                </Box>
              </Stack>
            </Box>
          )}

          {!eventsWithCoords.length && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                p: 3,
              }}
            >
              <Stack spacing={1} alignItems="center">
                <MapPin size={26} />
                <Typography sx={{ fontWeight: 700 }}>
                  No events with coordinates found
                </Typography>
              </Stack>
            </Box>
          )}
        </Box>
      </Container>

      <Drawer
        anchor="bottom"
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEventId(null)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '76vh',
            p: 2,
            backgroundColor: '#f8f3ec',
          },
        }}
      >
        {selectedEvent ? <LargeEventCard event={selectedEvent} /> : null}
      </Drawer>
    </Box>
  );
}
