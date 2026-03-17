import { Box, Chip, Typography } from '@mui/material';

const FEATURE_EMOJI_MAP: Record<string, string> = {
  BYOB: '🍾',
  Rooftop: '🏠',
  Indoor: '🏠',
  Outdoor: '☀️',
  'Live Music': '🎵',
  DJ: '🎧',
  'Live DJ': '🎧',
  'Photo friendly': '📸',
  'Video friendly': '🎥',
  'Wheelchair accessible': '♿',
  'Parking available': '🚗',
  'Food included': '🍽️',
  'Drinks included': '🍹',
  'Age 18+': '🔞',
  'Age 21+': '🔞',
  'Kids friendly': '👶',
  'Pets allowed': '🐕',
  'Smoking area': '🚬',
  WiFi: '📶',
  'Power outlets': '🔌',
  AC: '❄️',
  'No alcohol': '🚫',
  'Vegan options': '🥗',
  Vegetarian: '🥬',
  'Gluten free': '🌾',
  'capacity:': '👥',
};

interface NormalChipsModuleProps {
  event: any;
}

export function NormalChipsModule({ event }: NormalChipsModuleProps) {
  const features = event.features || event.tags || [];

  if (!features || features.length === 0) return null;

  const getFeatureName = (feature: any) => {
    if (typeof feature === 'string') return feature;
    if (typeof feature === 'object' && feature !== null) return feature.name || feature;
    return String(feature);
  };

  return (
    <Box sx={{ display: 'flex', gap: 0.9, flexWrap: 'wrap', px: 2, pt: 1.75 }}>
      {features.slice(0, 8).map((feature: any, idx: number) => {
        const name = getFeatureName(feature);
        return (
          <Chip
            key={idx}
            label={`${FEATURE_EMOJI_MAP[name] || '🏷️'} ${name}`}
            sx={{
              bgcolor: '#fef3c7',
              border: '0px solid #f59e0b',
              color: '#92400e',
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 'auto',
              py: 0.5,
              px: 1,
              borderRadius: 999,
              '& .MuiChip-label': {
                px: 0.5,
              },
            }}
          />
        );
      })}
    </Box>
  );
}
