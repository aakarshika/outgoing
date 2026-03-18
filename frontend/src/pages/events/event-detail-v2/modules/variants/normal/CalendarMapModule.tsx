import { Box, Typography } from '@mui/material';
import { Globe, MapPin, Navigation } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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

function buildGoogleCoordinateEmbedUrl(lat: number, lng: number) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=13&output=embed`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

export function NormalCalendarMapModule({ event }: NormalCalendarMapModuleProps) {
  const [userCoords, setUserCoords] = useState<Coords | null>(null);

  const startDate = useMemo(() => new Date(event.start_time), [event.start_time]);
  const endDate = useMemo(() => new Date(event.end_time), [event.end_time]);

  const month = startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = startDate.getDate();
  const weekday = startDate.toLocaleDateString('en-US', { weekday: 'short' });
  const timeStart = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const timeEnd = endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const locationName = event.location?.name || event.location_name;
  const locationAddress = event.location?.address || event.location_address;
  const isOnline = locationAddress === 'Online Event';

  const lat = parseCoordinate(event.location?.lat ?? event.latitude);
  const lng = parseCoordinate(event.location?.lng ?? event.longitude);
  const hasCoords = lat !== null && lng !== null;

  const eventCoords: Coords | null = hasCoords ? { lat, lng } : null;

  useEffect(() => {
    const storedCoords =
      getNearYouCoords() ?? getStoredSearchLocation()?.coords ?? null;
    setUserCoords(storedCoords);
  }, []);

  const userMarkerPosition = useMemo(() => {
    if (!eventCoords || !userCoords) return null;
    return getRelativeMarkerPosition(eventCoords, userCoords);
  }, [eventCoords, userCoords]);

  const mapUrl = useMemo(() => {
    if (!eventCoords) return null;
    return buildGoogleDirectionsUrl(eventCoords, userCoords);
  }, [eventCoords, userCoords]);

  const embedUrl = useMemo(() => {
    if (!eventCoords) return null;
    return buildGoogleCoordinateEmbedUrl(eventCoords.lat, eventCoords.lng);
  }, [eventCoords]);

  const handleOpenMap = () => {
    if (mapUrl) {
      window.open(mapUrl, '_blank');
    }
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
          onClick={handleOpenMap}
          sx={{
            bgcolor: '#E1F5EE',
            borderRadius: 'var(--border-radius-lg, 12px)',
            position: 'relative',
            overflow: 'hidden',
            cursor: mapUrl ? 'pointer' : 'default',
            minHeight: 120,
          }}
        >
          {embedUrl ? (
            <>
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                }}
              >
                <iframe
                  src={embedUrl}
                  loading="lazy"
                  title="Event location"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    filter: 'grayscale(20%) contrast(1.1)',
                    pointerEvents: 'none',
                  }}
                />
              </Box>
              {eventCoords && (
                <Marker label="Event" color="#dc2626" left="50%" top="50%" />
              )}
              {userMarkerPosition && (
                <Marker
                  label="You"
                  color="#2563eb"
                  left={userMarkerPosition.left}
                  top={userMarkerPosition.top}
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
        component={mapUrl ? 'a' : 'div'}
        {...(mapUrl
          ? { href: mapUrl, target: '_blank', rel: 'noopener noreferrer' }
          : {})}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mt: 1.25,
          px: 0.5,
          py: 0.75,
          textDecoration: 'none',
          color: 'inherit',
          borderRadius: 'var(--border-radius-md, 8px)',
          transition: 'background 0.15s',
          '&:hover': mapUrl
            ? { bgcolor: 'rgba(0,0,0,0.03)' }
            : undefined,
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
