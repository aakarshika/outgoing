import { Box, Chip, Stack, Typography } from '@mui/material';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';

import {
  buildGoogleEmbedUrl,
  buildGoogleExternalUrl,
  buildMapQuery,
  buildOsmEmbedUrl,
  buildOsmExternalUrl,
} from '@/utils/mapEmbed';

type EventLocationMapProps = {
  locationName: string;
  locationAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function EventLocationMap({
  locationName,
  locationAddress,
  latitude,
  longitude,
}: EventLocationMapProps) {
  const hasCoordinates = typeof latitude === 'number' && typeof longitude === 'number';
  const query = buildMapQuery(locationName, locationAddress);

  const embedUrl = hasCoordinates
    ? buildOsmEmbedUrl(latitude, longitude)
    : buildGoogleEmbedUrl(query || locationName);

  const openMapUrl = hasCoordinates
    ? buildOsmExternalUrl(latitude, longitude)
    : buildGoogleExternalUrl(query || locationName);

  return (
    <Box
      sx={{
        position: 'relative',
        border: '2px solid #333',
        borderRadius: '4px',
        overflow: 'hidden',
        transform: 'rotate(0.75deg)',
        bgcolor: '#f3f4f6',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.18)',
      }}
    >
      <Box
        component="iframe"
        title={`Map for ${locationName}`}
        src={embedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        sx={{
          display: 'block',
          width: '100%',
          height: 260,
          border: 0,
          bgcolor: '#e5e7eb',
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          left: 12,
          top: 12,
          maxWidth: '70%',
          p: 1,
          borderRadius: 1,
          bgcolor: 'rgba(255, 255, 255, 0.94)',
          border: '1px solid rgba(0, 0, 0, 0.18)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.16)',
          pointerEvents: 'none',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          <MapPin size={15} />
          <Typography sx={{ fontFamily: '"Permanent Marker"', fontSize: '0.9rem' }}>
            {locationName}
          </Typography>
        </Stack>
        {locationAddress && (
          <Typography
            variant="caption"
            sx={{ display: 'block', color: 'text.secondary' }}
          >
            {locationAddress}
          </Typography>
        )}
      </Box>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          zIndex: 2,
          alignItems: 'center',
        }}
      >
        {hasCoordinates && (
          <Chip
            icon={<Navigation size={14} />}
            label="Pinned"
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.96)',
              border: '1px solid rgba(0,0,0,0.2)',
            }}
          />
        )}
        <Chip
          component="a"
          clickable
          href={openMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          icon={<ExternalLink size={14} />}
          label="Open map"
          size="small"
          sx={{
            bgcolor: '#111827',
            color: 'white',
            '& .MuiChip-icon': { color: 'white' },
            '&:hover': { bgcolor: '#000' },
          }}
        />
      </Stack>
    </Box>
  );
}
