import { Box, Typography } from '@mui/material';
import { Clock3, Globe, MapPin, Navigation } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { formatEventRelativeTime } from '@/utils/dateUtils';
import { getNearYouCoords, getStoredSearchLocation } from '@/utils/locationPrefs';
import {
  buildGoogleEmbedUrl,
  buildGoogleExternalUrl,
  buildMapQuery,
} from '@/utils/mapEmbed';

type HeroSideDetailsPanelProps = {
  event: any;
};

type Coords = {
  lat: number;
  lng: number;
};

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function parseCoordinate(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildGoogleCoordinateEmbedUrl(lat: number, lng: number) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=13&output=embed`;
}

function buildGoogleDirectionsUrl(destination: Coords, origin?: Coords | null) {
  if (!origin) {
    return buildGoogleExternalUrl(`${destination.lat},${destination.lng}`);
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`;
}

function getRelativeMarkerPosition(center: Coords, target: Coords) {
  const latWindow = 0.16;
  const lngWindow = latWindow / Math.max(0.35, Math.cos((center.lat * Math.PI) / 180));
  const left = 50 + ((target.lng - center.lng) / lngWindow) * 50;
  const top = 50 - ((target.lat - center.lat) / latWindow) * 50;

  return {
    left: `${clamp(left, 8, 92)}%`,
    top: `${clamp(top, 14, 86)}%`,
  };
}

function Marker({
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
        transform: 'translate(-50%, -100%)',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.35,
        }}
      >
        <Typography
          sx={{
            px: 0.8,
            py: 0.2,
            borderRadius: '999px',
            bgcolor: 'rgba(255,255,255,0.96)',
            border: '1px solid rgba(17,24,39,0.15)',
            fontSize: '0.6rem',
            fontWeight: 800,
            lineHeight: 1.1,
            color: '#111827',
            boxShadow: '0 4px 10px rgba(15, 23, 42, 0.12)',
          }}
        >
          {label}
        </Typography>
        <Box
          sx={{
            width: 11,
            height: 11,
            borderRadius: '999px',
            bgcolor: color,
            border: '2px solid white',
            boxShadow: '0 0 0 1px rgba(17,24,39,0.2)',
          }}
        />
      </Box>
    </Box>
  );
}

export function HeroSideDetailsPanel({ event }: HeroSideDetailsPanelProps) {
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [userLocationLabel, setUserLocationLabel] = useState('');

  const startDate = useMemo(() => new Date(event.start_time), [event.start_time]);
  const relativeTime = useMemo(
    () => formatEventRelativeTime(event.start_time),
    [event.start_time],
  );
  const eventCoords = useMemo(() => {
    const lat = parseCoordinate(event.latitude);
    const lng = parseCoordinate(event.longitude);
    if (lat === null || lng === null) return null;
    return { lat, lng };
  }, [event.latitude, event.longitude]);

  const isOnline = useMemo(() => {
    const address = (event.location_address || '').trim().toLowerCase();
    const name = (event.location_name || '').trim().toLowerCase();
    return address === 'online event' || name === 'online event';
  }, [event.location_address, event.location_name]);

  useEffect(() => {
    const storedCoords =
      getNearYouCoords() ?? getStoredSearchLocation()?.coords ?? null;
    const storedLabel = getStoredSearchLocation()?.label || 'Your location';
    setUserCoords(storedCoords);
    setUserLocationLabel(storedCoords ? storedLabel : '');
  }, []);

  const calendarCells = useMemo(() => {
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = Array.from(
      { length: firstDayOfMonth + totalDaysInMonth },
      (_, index) => {
        const dayNumber = index - firstDayOfMonth + 1;
        return dayNumber > 0 && dayNumber <= totalDaysInMonth ? dayNumber : null;
      },
    );

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [startDate]);

  const mapQuery = useMemo(
    () =>
      buildMapQuery(event.location_name || 'Event location', event.location_address),
    [event.location_address, event.location_name],
  );

  const mapHref = useMemo(() => {
    if (isOnline) return null;
    if (eventCoords) return buildGoogleDirectionsUrl(eventCoords, userCoords);
    return buildGoogleExternalUrl(mapQuery || event.location_name || 'Event location');
  }, [event.location_name, eventCoords, isOnline, mapQuery, userCoords]);

  const mapEmbedUrl = useMemo(() => {
    if (isOnline) return null;
    if (eventCoords)
      return buildGoogleCoordinateEmbedUrl(eventCoords.lat, eventCoords.lng);
    return buildGoogleEmbedUrl(mapQuery || event.location_name || 'Event location');
  }, [event.location_name, eventCoords, isOnline, mapQuery]);

  const userMarkerPosition = useMemo(() => {
    if (!eventCoords || !userCoords) return null;
    return getRelativeMarkerPosition(eventCoords, userCoords);
  }, [eventCoords, userCoords]);

  return (
    <Box
      sx={{
        mt: { xs: 2.5, md: 3 },
        display: 'grid',
        gap: { xs: 1, sm: 1.5 },
        gridTemplateColumns: 'minmax(118px, 148px) minmax(0, 1fr)',
        alignItems: 'stretch',
      }}
    >
      <Box
        sx={{
          // border: '1px solid rgba(15,23,42,0.12)',
          borderRadius: 3,
          // bgcolor: 'rgba(255,255,255,0.96)',
          // boxShadow: '0 30px 30px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            px: 1.2,
            pt: 0.9,
            // bgcolor: '#f8fafc',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            // borderBottom: '1px solid rgba(15,23,42,0.08)',
          }}
        >
          <Typography
            sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em' }}
          >
            {startDate.toLocaleDateString(undefined, {
              month: 'short',
              year: 'numeric',
            })}
          </Typography>
        </Box>

        <Box sx={{ px: 1, py: 1 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              // gap: 0.45,
            }}
          >
            {calendarCells.map((day, index) => {
              const isEventDate = day === startDate.getDate();
              return (
                <Box
                  key={`${day ?? 'empty'}-${index}`}
                  sx={{
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {day ? (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '999px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.68rem',
                        fontWeight: isEventDate ? 900 : 500,
                        // bgcolor: isEventDate ? '#ef4444' : 'transparent',
                        color: isEventDate ? '#111111' : '#35476d',
                        boxShadow: isEventDate
                          ? '0 0 0 2px rgba(209, 13, 13, 0.92)'
                          : 'none',
                      }}
                    >
                      {day}
                    </Box>
                  ) : null}
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box sx={{ px: 1.1, pb: 1.1 }}>
          <Typography
            sx={{
              fontSize: '0.76rem',
              fontWeight: 700,
              lineHeight: 1.2,
              mb: 0.5,
              color: '#0f172a',
            }}
          >
            You are free.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateRows: 'auto minmax(0, 1fr)' }}>
        <Box
          sx={{
            // border: '1px solid rgba(15,23,42,0.12)',
            borderRadius: 3,
            // bgcolor: 'rgba(255,255,255,0.96)',
            boxShadow: '0 30px 30px rgba(15, 23, 42, 0.08)',
            px: 1.3,
            // mt:4,
            py: 1.15,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.85, mb: 0.55 }}>
            {isOnline ? (
              <Globe size={15} color="#2563eb" />
            ) : (
              <MapPin size={15} color="#dc2626" />
            )}
            <Typography
              sx={{
                fontSize: '0.8rem',
                fontWeight: 700,
                lineHeight: 1.15,
                color: '#0f172a',
              }}
            >
              {isOnline ? 'Online' : event.location_name || 'Location'}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.76rem', color: '#4b5563', lineHeight: 1.45 }}>
            {isOnline
              ? 'Join from anywhere.'
              : event.location_address.substring(0, 25) ||
                event.location_name ||
                'Location details coming soon.'}
          </Typography>

          <Box sx={{ pt: 1.1 }}>
            <Typography
              sx={{
                fontSize: '0.76rem',
                fontWeight: 700,
                lineHeight: 1.2,
                mb: 0.5,
                color: '#0f172a',
              }}
            >
              {relativeTime}·{' '}
              <span>
                {startDate.toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </Typography>
          </Box>
        </Box>

        {!isOnline && (
          <Box
            sx={{
              position: 'relative',
              // border: '1px solid rgba(15,23,42,0.12)',
              borderRadius: 3,
              // bgcolor: '#f3f4f6',
              boxShadow: '0 30px 30px rgba(15, 23, 42, 0.08)',
              minHeight: { xs: 148, sm: 172 },
              overflow: 'hidden',
            }}
          >
            {isOnline ? null : mapEmbedUrl ? (
              <>
                <Box
                  component="iframe"
                  title={`Map for ${event.location_name || 'event location'}`}
                  src={mapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  sx={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    border: 0,
                    pointerEvents: 'none',
                    filter: 'grayscale(0.08) saturate(0.95)',
                  }}
                />
                {eventCoords ? (
                  <Marker label="Event" color="#dc2626" left="50%" top="50%" />
                ) : null}
                {userMarkerPosition ? (
                  <Marker
                    label="You"
                    color="#2563eb"
                    left={userMarkerPosition.left}
                    top={userMarkerPosition.top}
                  />
                ) : null}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 10,
                    top: 10,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 0.9,
                    py: 0.45,
                    // bgcolor: 'rgba(255,255,255,0.6)',
                    // border: '1px solid rgba(17,24,39,0.1)',
                    borderRadius: '999px',
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    color: '#111827',
                    pointerEvents: 'none',
                  }}
                >
                  <Navigation size={12} />
                  {/* Opens in Google Maps */}
                </Box>
                {mapHref ? (
                  <Box
                    component="a"
                    href={mapHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open event location in Google Maps"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 3,
                    }}
                  />
                ) : null}
              </>
            ) : (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 2,
                }}
              >
                <Typography
                  sx={{ fontSize: '0.76rem', color: '#4b5563', textAlign: 'center' }}
                >
                  Map preview unavailable for this location.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
