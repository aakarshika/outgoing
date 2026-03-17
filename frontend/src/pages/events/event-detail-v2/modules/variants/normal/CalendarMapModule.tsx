import { Box, Typography } from '@mui/material';
import { Navigation } from 'lucide-react';

import { buildGoogleEmbedUrl, buildGoogleExternalUrl } from '@/utils/mapEmbed';

interface NormalCalendarMapModuleProps {
  event: any;
}

function parseCoordinate(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function NormalCalendarMapModule({ event }: NormalCalendarMapModuleProps) {
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);

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

  const coordsString = hasCoords ? `${lat},${lng}` : null;
  const mapUrl = hasCoords ? buildGoogleExternalUrl(coordsString) : null;
  const embedUrl = hasCoords ? buildGoogleEmbedUrl(coordsString) : null;

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

        {/* Map Card - Clickable */}
        <Box
          onClick={handleOpenMap}
          sx={{
            bgcolor: '#E1F5EE',
            borderRadius: 'var(--border-radius-lg, 12px)',
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            cursor: mapUrl ? 'pointer' : 'default',
            minHeight: 120,
          }}
        >
          {embedUrl && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                '& iframe': {
                  width: '100%',
                  height: '100%',
                  border: 'none',
                },
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
                }}
              />
            </Box>
          )}
          {!hasCoords && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                opacity: 0.3,
              }}
            >
              <svg viewBox="0 0 160 120" width="100%" height="100%">
                <rect width="160" height="120" fill="#9FE1CB" opacity="0.4" />
                <rect
                  x="20"
                  y="30"
                  width="40"
                  height="20"
                  rx="2"
                  fill="#085041"
                  opacity="0.2"
                />
                <circle cx="90" cy="52" r="6" fill="#D85A30" />
                <circle cx="90" cy="52" r="3" fill="#fff" />
              </svg>
            </Box>
          )}
          <Box sx={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#085041' }}>
              {isOnline ? 'Online Event' : locationName || 'View map'}
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#0F6E56', mt: 0.25 }}>
              {isOnline
                ? 'Link sent after RSVP'
                : locationAddress?.slice(0, 30) ||
                  (hasCoords ? 'Get directions' : 'View map')}
            </Typography>
          </Box>
          {!isOnline && hasCoords && (
            <Box
              sx={{
                fontSize: 11,
                fontWeight: 500,
                color: '#085041',
                mt: 'auto',
                pt: 0.5,
                position: 'relative',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            >
              <Navigation size={12} style={{ display: 'inline', marginRight: 4 }} />
              Directions →
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
