import { Box, Typography } from '@mui/material';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '@/features/events/constants';

interface NormalHeroModuleProps {
  event: any;
}

export function NormalHeroModule({ event }: NormalHeroModuleProps) {
  const categorySlug = event.category?.slug || '';
  const categoryIcon = CATEGORY_ICONS[categorySlug] || CATEGORY_ICONS.default;
  const categoryName = event.category?.name || 'Event';

  const getCategoryColor = () => {
    return CATEGORY_COLORS[categorySlug] || CATEGORY_COLORS.default;
  };

  return (
    <Box
      sx={{
        position: 'relative',
        height: 280,
        bgcolor: getCategoryColor(),
        overflow: 'hidden',
      }}
    >
      {/* Decorative pattern */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.18,
        }}
      >
        <svg
          viewBox="0 0 400 280"
          preserveAspectRatio="xMidYMid slice"
          style={{ width: '100%', height: '100%' }}
        >
          <circle cx="60" cy="60" r="80" fill="#D85A30" opacity="0.25" />
          <circle cx="340" cy="40" r="60" fill="#993C1D" opacity="0.2" />
          <circle cx="200" cy="200" r="100" fill="#F0997B" opacity="0.2" />
          <circle cx="380" cy="220" r="70" fill="#D85A30" opacity="0.15" />
          <circle cx="20" cy="240" r="50" fill="#F5C4B3" opacity="0.3" />
        </svg>
      </Box>

      {/* Cover gradient overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Cover Image */}
      {event.cover_image && (
        <Box
          component="img"
          src={event.cover_image}
          alt={event.title}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {/* Bottom content */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.6,
            bgcolor: 'rgba(255,255,255,0.2)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 500,
            px: 1.25,
            py: 0.4,
            borderRadius: 999,
            backdropFilter: 'blur(4px)',
            mb: 1,
          }}
        >
          <span style={{ fontSize: 13 }}>{categoryIcon}</span>
          {categoryName}
        </Box>
        <Typography
          sx={{
            fontFamily: '"Syne", sans-serif',
            fontSize: 24,
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.15,
            letterSpacing: '-0.3px',
            mb: 1,
          }}
        >
          {event.title}
        </Typography>
      </Box>
    </Box>
  );
}
