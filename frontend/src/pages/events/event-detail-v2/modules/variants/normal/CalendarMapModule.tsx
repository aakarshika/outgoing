import { Box, Typography } from '@mui/material';
import { Globe, MapPin, Navigation } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { getNearYouCoords, getStoredSearchLocation } from '@/utils/locationPrefs';
import { buildGoogleExternalUrl } from '@/utils/mapEmbed';

interface NormalCalendarMapModuleProps {
  event: any;
}

type Coords = {
  lat: number;
  lng: number;
};

function parseCoordinate(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// ---------------------------------------------------------------------------
// Web Mercator projection
// Google Maps uses Web Mercator (EPSG:3857) with 256px tiles.
// By using the same math we can convert any lat/lng into a pixel offset from
// the map centre and express it as a CSS percentage — always pixel-perfect.
// ---------------------------------------------------------------------------

const TILE_SIZE = 256;

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

/**
 * Picks a center and zoom that fits both points with comfortable padding.
 * Subtracts 1 from the raw zoom so neither pin sits at the edge.
 */
function fitView(
  eventCoords: Coords,
  userCoords: Coords | null,
): { center: Coords; zoom: number } {
  if (!userCoords) {
    return { center: eventCoords, zoom: 13 };
  }
  const center: Coords = {
    lat: (eventCoords.lat + userCoords.lat) / 2,
    lng: (eventCoords.lng + userCoords.lng) / 2,
  };
  const latSpan = Math.abs(eventCoords.lat - userCoords.lat);
  const lngSpan = Math.abs(eventCoords.lng - userCoords.lng);
  const span = Math.max(latSpan, lngSpan, 0.001);
  // log2(180/span) approximates the zoom needed to fit `span` degrees.
  // -1 adds padding so the pins don't sit at the very edge.
  const zoom = Math.max(3, Math.min(14, Math.round(Math.log2(180 / span)) - 1));
  return { center, zoom };
}

function buildEmbedUrl(center: Coords, zoom: number): string {
  // Plain ?q= centers the map and drops Google's native red pin on the event.
  // No route, no sidebar — just clean map tiles with one marker.
  return `https://maps.google.com/maps?q=${center.lat},${center.lng}&z=${zoom}&output=embed`;
}

function buildGoogleDirectionsUrl(destination: Coords, origin?: Coords | null) {
  if (!origin) {
    return buildGoogleExternalUrl(`${destination.lat},${destination.lng}`);
  }
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`;
}

// ---------------------------------------------------------------------------
// SVG teardrop pin marker overlay
// ---------------------------------------------------------------------------
function PinMarker({
  label,
  color,
  left,
  top,
}: {
  label: string;
  color: string;
  left: string;
  top: string;
}) {
  return (
    <Box
      sx={{
        position: 'absolute',
        left,
        top,
        // Pin tip sits exactly on the coordinate point
        transform: 'translate(-50%, -100%)',
        pointerEvents: 'none',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Typography
        sx={{
          px: 0.75,
          py: 0.15,
          mb: 0.3,
          borderRadius: '999px',
          bgcolor: 'rgba(255,255,255,0.97)',
          border: '1px solid rgba(17,24,39,0.12)',
          fontSize: '0.58rem',
          fontWeight: 800,
          lineHeight: 1.2,
          color: '#111827',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Typography>
      <svg width="18" height="24" viewBox="0 0 18 24" fill="none">
        <path
          d="M9 0C4.03 0 0 4.03 0 9c0 6.75 9 15 9 15s9-8.25 9-15C18 4.03 13.97 0 9 0z"
          fill={color}
        />
        <circle cx="9" cy="9" r="3.5" fill="white" opacity="0.9" />
      </svg>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function NormalCalendarMapModule({ event }: NormalCalendarMapModuleProps) {
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const mapBoxRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ w: 160, h: 160 });

  const startDate = useMemo(() => new Date(event.start_time), [event.start_time]);
  const endDate = useMemo(() => new Date(event.end_time), [event.end_time]);

  const month = startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = startDate.getDate();
  const weekday = startDate.toLocaleDateString('en-US', { weekday: 'short' });
  const timeStart = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const timeEnd = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const locationName = event.location?.name || event.location_name;
  const locationAddress = event.location?.address || event.location_address;
  const isOnline = locationAddress === 'Online Event';

  const lat = parseCoordinate(event.location?.lat ?? event.latitude);
  const lng = parseCoordinate(event.location?.lng ?? event.longitude);
  const hasCoords = lat !== null && lng !== null;
  const eventCoords: Coords | null = hasCoords ? { lat, lng } : null;

  useEffect(() => {
    const storedCoords = getNearYouCoords() ?? getStoredSearchLocation()?.coords ?? null;
    setUserCoords(storedCoords);
  }, []);

  // Measure the rendered map box so projection math uses actual pixel dimensions
  useEffect(() => {
    const el = mapBoxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setMapSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const view = useMemo(
    () => (eventCoords ? fitView(eventCoords, userCoords) : null),
    [eventCoords, userCoords],
  );

  const embedUrl = useMemo(
    () => (view ? buildEmbedUrl(view.center, view.zoom) : null),
    [view],
  );

  // Pixel-perfect marker positions derived from the same center+zoom as the embed
  const eventMarker = useMemo(() => {
    if (!eventCoords || !view) return null;
    return coordToPercent(eventCoords, view.center, view.zoom, mapSize.w, mapSize.h);
  }, [eventCoords, view, mapSize]);

  const userMarker = useMemo(() => {
    if (!userCoords || !eventCoords || !view) return null;
    return coordToPercent(userCoords, view.center, view.zoom, mapSize.w, mapSize.h);
  }, [userCoords, eventCoords, view, mapSize]);

  const mapUrl = useMemo(
    () => (eventCoords ? buildGoogleDirectionsUrl(eventCoords, userCoords) : null),
    [eventCoords, userCoords],
  );

  const handleOpenMap = () => {
    if (mapUrl) window.location.href = mapUrl;
  };

  return (
    <Box sx={{ px: 2, pt: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
        {/* Date Card */}
        <Box
          sx={{
            bgcolor: 'var(--color-background-secondary, #f9fafb)',
            borderRadius: 'var(--border-radius-lg, 12px)',
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 120,
          }}
        >
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#D85A30',
              mb: 0.25,
            }}
          >
            {month}
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Syne", sans-serif',
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--color-text-primary, #111)',
              lineHeight: 1,
            }}
          >
            {day}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: 'var(--color-text-secondary, #6b7280)',
              mt: 0.5,
            }}
          >
            {weekday} · {timeStart} – {timeEnd}
          </Typography>
        </Box>

        {/* Map Card */}
        <Box
          ref={mapBoxRef}
          onClick={handleOpenMap}
          sx={{
            bgcolor: '#E1F5EE',
            borderRadius: 'var(--border-radius-lg, 12px)',
            position: 'relative',
            overflow: 'hidden',
            cursor: mapUrl ? 'pointer' : 'default',
            aspectRatio: '1 / 1',
            minHeight: 140,
          }}
        >
          {embedUrl ? (
            <>
              <iframe
                src={embedUrl}
                loading="lazy"
                title="Event location"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  filter: 'grayscale(15%) contrast(1.05)',
                  pointerEvents: 'none',
                }}
              />
              {eventMarker && (
                <PinMarker
                  label="Event"
                  color="#dc2626"
                  left={eventMarker.left}
                  top={eventMarker.top}
                />
              )}
              {userMarker && (
                <PinMarker
                  label="You"
                  color="#2563eb"
                  left={userMarker.left}
                  top={userMarker.top}
                />
              )}
            </>
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPin size={20} color="#085041" opacity={0.35} />
            </Box>
          )}
        </Box>
      </Box>

      {/* Location strip */}
      <Box
        component="div"
        onClick={handleOpenMap}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mt: 1.25,
          px: 0.5,
          py: 0.75,
          color: 'inherit',
          borderRadius: 'var(--border-radius-md, 8px)',
          transition: 'background 0.15s',
          cursor: mapUrl ? 'pointer' : 'default',
          '&:hover': mapUrl ? { bgcolor: 'rgba(0,0,0,0.03)' } : undefined,
        }}
      >
        {isOnline ? (
          <Globe size={14} color="#2563eb" style={{ flexShrink: 0 }} />
        ) : (
          <MapPin size={14} color="#D85A30" style={{ flexShrink: 0 }} />
        )}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-text-primary, #111)',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {isOnline ? 'Online Event' : locationName || 'Location'}
          </Typography>
          {!isOnline && locationAddress && (
            <Typography
              sx={{
                fontSize: 11,
                color: 'var(--color-text-secondary, #6b7280)',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {locationAddress.slice(0, 50)}
            </Typography>
          )}
        </Box>
        {!isOnline && hasCoords && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.4,
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--color-text-secondary, #6b7280)',
            }}
          >
            <Navigation size={11} />
            Directions
          </Box>
        )}
      </Box>
    </Box>
  );
}