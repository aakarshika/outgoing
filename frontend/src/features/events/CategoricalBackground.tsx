import { Box, Typography } from '@mui/material';
import React from 'react';

export const CATEGORY_THEMES: Record<
  string,
  {
    bg: string;
    pattern: string;
    accent: string;
    tape: string;
    icon: string;
  }
> = {
  default: {
    bg: '#f8fafc',
    pattern:
      'linear-gradient(rgba(71, 85, 105, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(71, 85, 105, 0.1) 1px, transparent 1px)',
    accent: 'rgb(71, 85, 105)',
    tape: 'rgba(71, 85, 105, 0.1)',
    icon: 'cpu',
  },
  arts: {
    bg: 'rgb(231, 236, 182)',
    pattern: 'radial-gradient(rgba(179, 190, 81, 0.25) 1.5px, transparent 0)',
    accent: 'rgb(179, 190, 81)',
    tape: 'rgba(179, 190, 81, 0.1)',
    icon: 'palette',
  },
  music: {
    bg: 'rgb(235, 217, 235)',
    pattern:
      'linear-gradient(rgba(166, 16, 171, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(166, 16, 171, 0.12) 1px, transparent 1px)',
    accent: 'rgb(166, 16, 171)',
    tape: 'rgba(166, 16, 171, 0.1)',
    icon: 'music',
  },
  food: {
    bg: 'rgb(251, 227, 190)',
    pattern: 'radial-gradient(rgba(250, 168, 45, 0.25) 2px, transparent 0)',
    accent: 'rgb(250, 168, 45)',
    tape: 'rgba(250, 168, 45, 0.1)',
    icon: 'utensils',
  },
  networking: {
    bg: 'rgb(222, 223, 250)',
    pattern:
      'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(59, 130, 246, 0.08) 10px, rgba(59, 130, 246, 0.08) 20px)',
    accent: 'rgb(59, 130, 246)',
    tape: 'rgba(59, 130, 246, 0.1)',
    icon: 'users',
  },
  comedy: {
    bg: 'rgb(252, 222, 218)',
    pattern: 'radial-gradient(rgba(206, 62, 9, 0.2) 1.5px, transparent 0)',
    accent: 'rgb(206, 62, 9)',
    tape: 'rgba(206, 62, 9, 0.1)',
    icon: 'laugh',
  },
  social: {
    bg: 'rgb(229, 241, 222)',
    pattern:
      'linear-gradient(45deg, rgba(146, 47, 82, 0.08) 25%, transparent 25%, transparent 50%, rgba(146, 47, 82, 0.08) 50%, rgba(146, 47, 82, 0.08) 75%, transparent 75%, transparent)',
    accent: 'rgb(146, 47, 82)',
    tape: 'rgba(146, 47, 82, 0.1)',
    icon: 'heart-handshake',
  },
  festivals: {
    bg: 'rgb(253, 243, 214)',
    pattern:
      'radial-gradient(circle at 2px 2px, rgba(216, 177, 20, 0.16) 1px, transparent 0)',
    accent: 'rgb(216, 177, 20)',
    tape: 'rgba(216, 177, 20, 0.1)',
    icon: 'party-popper',
  },
  outdoors: {
    bg: 'rgb(229, 241, 222)',
    pattern:
      'repeating-linear-gradient(135deg, rgba(17, 145, 128, 0.1) 0, rgba(17, 145, 128, 0.1) 2px, transparent 2px, transparent 12px)',
    accent: 'rgb(17, 145, 128)',
    tape: 'rgba(17, 145, 128, 0.1)',
    icon: 'mountain',
  },
  nightlife: {
    bg: 'rgb(236, 230, 249)',
    pattern:
      'radial-gradient(circle at 3px 3px, rgba(93, 63, 211, 0.18) 1px, transparent 0)',
    accent: 'rgb(93, 63, 211)',
    tape: 'rgba(93, 63, 211, 0.1)',
    icon: 'moon',
  },
  sports: {
    bg: 'rgb(218, 245, 237)',
    pattern:
      'repeating-linear-gradient(120deg, rgba(20, 133, 108, 0.12) 0, rgba(20, 133, 108, 0.12) 2px, transparent 2px, transparent 11px)',
    accent: 'rgb(20, 133, 108)',
    tape: 'rgba(20, 133, 108, 0.1)',
    icon: 'dumbbell',
  },
  tech: {
    bg: 'rgb(233, 234, 236)',
    pattern:
      'linear-gradient(rgba(80, 61, 153, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(80, 61, 153, 0.12) 1px, transparent 1px)',
    accent: 'rgb(80, 61, 153)',
    tape: 'rgba(80, 61, 153, 0.1)',
    icon: 'cpu',
  },
  workshops: {
    bg: 'rgb(225, 235, 252)',
    pattern:
      'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 25%, transparent 25%, transparent 50%, rgba(37, 99, 235, 0.12) 50%, rgba(37, 99, 235, 0.12) 75%, transparent 75%, transparent)',
    accent: 'rgb(37, 99, 235)',
    tape: 'rgba(37, 99, 235, 0.1)',
    icon: 'book-open',
  },
};

const DEFAULT_CATEGORY_THEME = CATEGORY_THEMES['default'];

export const resolveCategorySlug = (category?: {
  slug?: string | null;
  name?: string | null;
}) => {
  return category?.slug || '';
};

export const getCategoryTheme = (category?: any) => {
  return CATEGORY_THEMES[resolveCategorySlug(category)];
}

export type EventCategory = {
  slug?: string | null;
  name?: string | null;
};

interface CategoricalBackgroundProps {
  category?: EventCategory | null;
  children?: React.ReactNode;
  sx?: any;
  showDecoration?: boolean;
  className?: string;
}

export const CategoricalBackground = ({
  category,
  children,
  sx,
  showDecoration = true,
  className,
}: CategoricalBackgroundProps) => {
  const theme = getCategoryTheme(category ?? undefined);

  return (
    <Box
      className={className}
      sx={{
        position: 'relative',
        bgcolor: theme.bg,
        backgroundImage: theme.pattern,
        backgroundSize: '20px 20px',
        overflow: 'hidden',
        ...sx,
      }}
    >
      {showDecoration && <CategoryDecoration icon={theme.icon} />}
      {children}
    </Box>
  );
};

const CategoryDecoration = ({ icon }: { icon: string }) => {
  switch (icon) {
    case 'palette':
      return (
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            right: -10,
            width: 60,
            height: 60,
            opacity: 0.4,
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 5,
              left: 5,
              width: 25,
              height: 25,
              bgcolor: '#f87171',
              borderRadius: '50%',
              filter: 'blur(4px)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              left: 15,
              width: 20,
              height: 20,
              bgcolor: '#60a5fa',
              borderRadius: '50%',
              filter: 'blur(3px)',
            }}
          />
        </Box>
      );
    case 'music':
      return (
        <Box
          sx={{
            position: 'absolute',
            top: 5,
            right: 10,
            opacity: 0.3,
            pointerEvents: 'none',
            transform: 'rotate(15deg)',
          }}
        >
          <Typography sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.2rem' }}>
            ♪
          </Typography>
        </Box>
      );
    case 'utensils':
      return (
        <Box
          sx={{
            position: 'absolute',
            bottom: 5,
            right: 10,
            opacity: 0.2,
            pointerEvents: 'none',
            transform: 'rotate(-10deg)',
          }}
        >
          <Typography sx={{ fontSize: '1.2rem' }}>🍴</Typography>
        </Box>
      );
    case 'laugh':
      return (
        <Box
          sx={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}
        >
          {[...Array(5)].map((_, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: 6,
                height: 6,
                bgcolor: ['#f87171', '#60a5fa', '#facc15'][i % 3],
                borderRadius: '50%',
              }}
            />
          ))}
        </Box>
      );
    case 'heart-handshake':
      return (
        <Box
          sx={{
            position: 'absolute',
            bottom: -5,
            left: 10,
            opacity: 0.2,
            pointerEvents: 'none',
          }}
        >
          <Typography
            sx={{ fontFamily: '"Caveat"', fontSize: '2rem', color: '#ef4444' }}
          >
            ♥
          </Typography>
        </Box>
      );
    case 'cpu':
      return (
        <Box
          sx={{ position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none' }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundImage:
                'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
              backgroundSize: '10px 10px',
            }}
          />
        </Box>
      );
    case 'mountain':
      return (
        <Box
          sx={{
            position: 'absolute',
            right: 10,
            bottom: 8,
            opacity: 0.2,
            pointerEvents: 'none',
          }}
        >
          <Typography sx={{ fontSize: '1.2rem' }}>⛰</Typography>
        </Box>
      );
    case 'moon':
      return (
        <Box
          sx={{
            position: 'absolute',
            top: 6,
            right: 8,
            opacity: 0.25,
            pointerEvents: 'none',
          }}
        >
          <Typography sx={{ fontSize: '1.1rem' }}>🌙</Typography>
        </Box>
      );
    case 'dumbbell':
      return (
        <Box
          sx={{
            position: 'absolute',
            bottom: 6,
            right: 10,
            opacity: 0.2,
            pointerEvents: 'none',
          }}
        >
          <Typography sx={{ fontSize: '1.1rem' }}>🏋</Typography>
        </Box>
      );
    case 'book-open':
      return (
        <Box
          sx={{
            position: 'absolute',
            top: 6,
            left: 10,
            opacity: 0.22,
            pointerEvents: 'none',
          }}
        >
          <Typography sx={{ fontSize: '1.1rem' }}>📖</Typography>
        </Box>
      );
    default:
      return null;
  }
};
