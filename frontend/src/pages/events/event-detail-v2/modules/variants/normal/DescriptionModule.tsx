import { getCategoryTheme } from '@/features/events/CategoricalBackground';
import { Box, Typography } from '@mui/material';

interface NormalDescriptionModuleProps {
  event: any;
}

export function NormalDescriptionModule({ event }: NormalDescriptionModuleProps) {
  const description = event.description;
  const isLong = description?.length > 200;

  if (!description) return null;

  return (
    <Box sx={{ px: 2, mt: 1.5 }}>

<Typography
          sx={{
            pt: 2,
            fontFamily: '"Syne", sans-serif',
            fontSize: 24,
            fontWeight: 800,
            color: 'rgb(17, 24, 39)',
            lineHeight: 1.15,
            letterSpacing: '-0.3px',
            mb: 1,
          }}
        >
          {event.title}
        </Typography>
      <Typography
        sx={{
          fontSize: 14,
          color: 'var(--color-text-secondary, #6b7280)',
          lineHeight: 1.65,
        }}
      >
        {isLong ? description.slice(0, 200) + '...' : description}
      </Typography>
      {isLong && (
        <Typography
          sx={{
            fontSize: 13,
            color: '#D85A30',
            fontWeight: 500,
            mt: 0.5,
            cursor: 'pointer',
          }}
        >
          Read more →
        </Typography>
      )}
    </Box>
  );
}
