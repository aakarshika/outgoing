// @ts-nocheck
/**
 * Reusable overlay badges for scrapbook event cards (portrait + landscape).
 * All accept optional `sx` for positioning; they use position: 'absolute' by default.
 */

import type { SxProps, Theme } from '@mui/material';
import { Box, Typography } from '@mui/material';

type ThemeSlice = { bg: string; accent: string };

const overlayBase: SxProps<Theme> = {
  position: 'absolute',
  zIndex: 2,
};

// ---- Category sticker ----
interface CategoryStickerProps {
  categoryName: string;
  theme: ThemeSlice;
  sx?: SxProps<Theme>;
}

export function CategorySticker({
  categoryName,
  theme,
  sx = {},
}: CategoryStickerProps) {
  return (
    <Box
      sx={{
        ...overlayBase,
        top: 10,
        right: 10,
        bgcolor: '#fff',
        color: '#1a1a1a',
        p: '4px 8px',
        borderRadius: '2px',
        boxShadow: '2px 2px 5px rgba(0,0,0,0.15)',
        transform: 'rotate(5deg)',
        border: '1px dashed #ccc',
        ...sx,
      }}
    >
      <Typography
        sx={{
          fontSize: '0.65rem',
          fontWeight: 'bold',
          color: theme?.accent,
          backgroundColor: theme?.bg,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {categoryName}
      </Typography>
    </Box>
  );
}

/** Compact variant for landscape (smaller, no rotation). */
export function CategoryStickerCompact({
  categoryName,
  theme,
  sx = {},
}: CategoryStickerProps) {
  return (
    <Box
      sx={{
        ...overlayBase,
        top: 8,
        right: 8,
        bgcolor: '#fff',
        p: '2px 6px',
        borderRadius: '2px',
        boxShadow: '1px 1px 4px rgba(0,0,0,0.12)',
        border: '1px dashed #ccc',
        ...sx,
      }}
    >
      <Typography
        sx={{
          fontSize: '0.6rem',
          fontWeight: 'bold',
          color: theme?.accent,
          backgroundColor: theme?.bg,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {categoryName}
      </Typography>
    </Box>
  );
}

// ---- LIVE badge ----
interface LiveBadgeProps {
  sx?: SxProps<Theme>;
  /** Compact style for landscape (no rotation, no pulse). */
  compact?: boolean;
}

export function LiveBadge({ sx = {}, compact }: LiveBadgeProps) {
  return (
    <Box
      sx={{
        ...overlayBase,
        bottom: 10,
        left: 10,
        bgcolor: '#ef4444',
        color: '#fff',
        p: compact ? '2px 6px' : '2px 8px',
        borderRadius: compact ? 4 : '4px',
        fontFamily: 'serif',
        fontSize: compact ? '0.7rem' : '0.8rem',
        ...(compact
          ? {}
          : { transform: 'rotate(-5deg)', animation: 'pulse 2s infinite' }),
        ...sx,
      }}
    >
      LIVE!
    </Box>
  );
}

// ---- Host / Vendor badge ----
interface HostVendorBadgeProps {
  isHost: boolean;
  /** Short labels for landscape: "HOST" / "VENDOR". Full: "YOU ARE HOSTING" / "YOU ARE SERVICING". */
  variant?: 'full' | 'short';
  /** Offset bottom when LIVE badge is present (e.g. 36). */
  bottomOffset?: number;
  sx?: SxProps<Theme>;
}

export function HostVendorBadge({
  isHost,
  variant = 'full',
  bottomOffset = 10,
  sx = {},
}: HostVendorBadgeProps) {
  const label =
    variant === 'short'
      ? isHost
        ? 'HOSTING'
        : 'SERVICING'
      : isHost
        ? 'YOU ARE HOSTING'
        : 'YOU ARE SERVICING';

  return (
    <Box
      sx={{
        ...overlayBase,
        bottom: bottomOffset,
        left: 10,
        bgcolor: isHost ? '#8b5cf6' : '#0eacac',
        color: '#fff',
        p: variant === 'short' ? '2px 6px' : '2px 8px',
        borderRadius: variant === 'short' ? 2 : '2px',
        fontFamily: 'serif',
        fontSize: variant === 'short' ? '0.65rem' : '0.7rem',
        ...(variant === 'full' && {
          transform: 'rotate(-3deg)',
          boxShadow: '2px 2px 4px rgba(0,0,0,0.2)',
        }),
        ...sx,
      }}
    >
      {label}
    </Box>
  );
}

// ---- Price badge (published/live) ----
interface PriceBadgeProps {
  price: string;
  /** Portrait: rotated sticker with bubble. Landscape: simple pill. */
  variant?: 'portrait' | 'landscape';
  sx?: SxProps<Theme>;
}

export function PriceBadge({ price, variant = 'portrait', sx = {} }: PriceBadgeProps) {
  if (variant === 'landscape') {
    return (
      <Box
        sx={{
          ...overlayBase,
          bottom: 8,
          right: 8,
          bgcolor: '#fbbf24',
          color: '#000',
          p: '2px 8px',
          borderRadius: 2,
          fontSize: '0.7rem',
          fontWeight: 'bold',
          ...sx,
        }}
      >
        {price}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        ...overlayBase,
        bottom: 15,
        right: -10,
        bgcolor: '#fbbf24',
        color: '#000',
        p: '4px 15px 4px 10px',
        transform: 'rotate(-10deg)',
        boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: -5,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 10,
          height: 10,
          bgcolor: 'inherit',
          borderRadius: '50%',
          borderRight: '1px solid rgba(0,0,0,0.1)',
        },
        ...sx,
      }}
    >
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{price}</Typography>
    </Box>
  );
}

// ---- Full House badge (event_ready) ----
interface FullHouseBadgeProps {
  sx?: SxProps<Theme>;
}

export function FullHouseBadge({ sx = {} }: FullHouseBadgeProps) {
  return (
    <Box
      sx={{
        ...overlayBase,
        bottom: 15,
        right: -10,
        bgcolor: '#10b981',
        color: '#fff',
        p: '4px 15px 4px 10px',
        transform: 'rotate(-5deg)',
        boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: -5,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 10,
          height: 10,
          bgcolor: 'inherit',
          borderRadius: '50%',
        },
        ...sx,
      }}
    >
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
        FULL HOUSE!
      </Typography>
    </Box>
  );
}

// ---- Completed / Rated badge ----
interface CompletedRatedBadgeProps {
  sx?: SxProps<Theme>;
}

export function CompletedRatedBadge({ sx = {} }: CompletedRatedBadgeProps) {
  return (
    <Box
      sx={{
        ...overlayBase,
        bottom: 15,
        right: -10,
        bgcolor: '#fff',
        color: '#ec4899',
        p: '4px 15px 4px 10px',
        transform: 'rotate(-15deg)',
        boxShadow: '2px 2px 8px rgba(0,0,0,0.15)',
        border: '2px solid #ec4899',
        borderRadius: '2px',
        ...sx,
      }}
    >
      <Typography
        sx={{
          fontSize: '0.65rem',
          fontWeight: '900',
          textTransform: 'uppercase',
        }}
      >
        ⭐ 4.9 RATED
      </Typography>
    </Box>
  );
}
