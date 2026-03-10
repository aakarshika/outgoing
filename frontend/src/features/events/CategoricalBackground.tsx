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
      'linear-gradient(rgba(130, 153, 186, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(122, 166, 229, 0.1) 1px, transparent 1px)',
    accent: '16a34a',
    tape: 'rgba(138, 177, 231, 0.4)',
    icon: 'cpu',
  },
  'arts-culture': {
    bg: '#fff5f5',
    pattern: 'radial-gradient(#feb2b2 1px, transparent 0)',
    accent: '#f87171',
    tape: 'rgba(239, 68, 68, 0.4)',
    icon: 'palette',
  },
  music: {
    bg: '#f5f3ff',
    pattern:
      'linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)',
    accent: '#8b5cf6',
    tape: 'rgba(139, 92, 246, 0.4)',
    icon: 'music',
  },
  'food-drink': {
    bg: '#fffbeb',
    pattern: 'radial-gradient(#fde68a 2px, transparent 0)',
    accent: '#f59e0b',
    tape: 'rgba(245, 158, 11, 0.4)',
    icon: 'utensils',
  },
  'networking-social': {
    bg: '#f0f9ff',
    pattern:
      'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(56, 189, 248, 0.05) 10px, rgba(56, 189, 248, 0.05) 20px)',
    accent: '#0ea5e9',
    tape: 'rgba(14, 165, 233, 0.4)',
    icon: 'users',
  },
  comedy: {
    bg: '#fdf2f8',
    pattern: 'radial-gradient(#fbcfe8 1.5px, transparent 0)',
    accent: '#ec4899',
    tape: 'rgba(236, 72, 153, 0.4)',
    icon: 'laugh',
  },
  community: {
    bg: '#ecfdf5',
    pattern:
      'linear-gradient(45deg, rgba(16, 185, 129, 0.05) 25%, transparent 25%, transparent 50%, rgba(16, 185, 129, 0.05) 50%, rgba(16, 185, 129, 0.05) 75%, transparent 75%, transparent)',
    accent: '#10b981',
    tape: 'rgba(16, 185, 129, 0.4)',
    icon: 'heart-handshake',
  },
  festivals: {
    bg: '#fff7ed',
    pattern:
      'radial-gradient(circle at 2px 2px, rgba(251, 146, 60, 0.1) 1px, transparent 0)',
    accent: '#f97316',
    tape: 'rgba(249, 115, 22, 0.4)',
    icon: 'party-popper',
  },
  'outdoors-adventure': {
    bg: '#f0fdf4',
    pattern:
      'repeating-linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0, rgba(34, 197, 94, 0.08) 2px, transparent 2px, transparent 12px)',
    accent: '#16a34a',
    tape: 'rgba(22, 163, 74, 0.35)',
    icon: 'mountain',
  },
  'business-tech': {
    bg: '#f8fafc',
    pattern:
      'linear-gradient(rgba(71, 85, 105, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(71, 85, 105, 0.1) 1px, transparent 1px)',
    accent: '#475569',
    tape: 'rgba(71, 85, 105, 0.4)',
    icon: 'cpu',
  },
};

const DEFAULT_CATEGORY_THEME = CATEGORY_THEMES['default'];

export const resolveCategorySlug = (category?: {
  slug?: string | null;
  name?: string | null;
}) => {
  if (category?.slug) return category.slug;

  return (
    category?.name
      ?.toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || ''
  );
};

export const getCategoryTheme = (category?: {
  slug?: string | null;
  name?: string | null;
}) => CATEGORY_THEMES[resolveCategorySlug(category)] || DEFAULT_CATEGORY_THEME;

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
    default:
      return null;
  }
};
