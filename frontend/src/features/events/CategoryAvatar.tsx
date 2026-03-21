import { Avatar, type AvatarProps, Box } from '@mui/material';
import { keyframes, styled } from '@mui/material/styles';
import { useId, useMemo } from 'react';

import { CATEGORY_THEMES, type EventCategory } from './CategoricalBackground';

const orbitCw = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const orbitCcw = keyframes`
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
`;

const OrbitSatellites = styled('g', {
  shouldForwardProp: (p) => p !== 'animate' && p !== 'durationSec' && p !== 'direction',
})<{
  animate?: boolean;
  durationSec?: number;
  direction?: 'cw' | 'ccw';
}>(({ animate, durationSec = 16, direction = 'cw' }) => ({
  transformOrigin: '0px 0px',
  ...(animate
    ? {
        animation: `${direction === 'cw' ? orbitCw : orbitCcw} ${durationSec}s linear infinite`,
      }
    : {}),
}));

function themeForCategory(category?: EventCategory | string | null) {
  if (category == null || category === '') {
    return CATEGORY_THEMES.default;
  }
  const slug = typeof category === 'string' ? category : (category.slug ?? '').trim();
  const key = slug.toLowerCase();
  return CATEGORY_THEMES[key] ?? CATEGORY_THEMES.default;
}

export type CategoryAvatarProps = Omit<AvatarProps, 'sx'> & {
  index?: string;
  category?: EventCategory | string | null;
  /** Diameter of the inner avatar in px */
  size?: number;
  /** Space between avatar edge and orbital ring */
  orbitGap?: number;
  /** Subtle satellite rotation */
  animate?: boolean;
  sx?: AvatarProps['sx'];
  /** Optional explicit image URL for the avatar. When absent a fallback URL will be used. */
  imageUrl?: string | null;
};

/**
 * User avatar with a category-colored orbital ring and small “satellites”
 * derived from the same palette as {@link CATEGORY_THEMES}.
 */
export function CategoryAvatar({
  category,
  size = 40,
  orbitGap = 6,
  animate = true,
  sx,
  imageUrl,
  index,
  ...avatarProps
}: CategoryAvatarProps) {
  const theme = useMemo(() => themeForCategory(category), [category]);
  const rawId = useId().replace(/:/g, '');
  const gradId = `ca-grad-${rawId}`;

  const accent = theme.accent;
  const outer = size + orbitGap * 2;

  return (
    <Box
      sx={{
        position: 'relative',
        width: outer,
        height: outer,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        m: 0.4,
        flexShrink: 0,
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 100 100"
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accent} stopOpacity={0.95} />
            <stop offset="55%" stopColor={accent} stopOpacity={0.45} />
            <stop offset="100%" stopColor={accent} stopOpacity={0.2} />
          </linearGradient>
        </defs>
        {/* faint halo */}
        {/* <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke={accent}
          strokeOpacity={0.3}
          strokeWidth={1.5}
        /> */}
        {/* dashed orbit track */}
        <circle
          cx="50"
          cy="50"
          r="48.5"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={2.5}
          strokeDasharray="6 7"
          strokeLinecap="round"
        />
        <g transform="translate(50 50)">
          <OrbitSatellites animate={animate} durationSec={16} direction="cw">
            <circle cx="0" cy="-48.5" r="5" fill={accent} opacity={0.92} />
            <circle cx="33" cy="35" r="3.3" fill={accent} opacity={0.7} />
          </OrbitSatellites>
          <OrbitSatellites animate={animate} durationSec={22} direction="ccw">
            <circle cx="-36" cy="-22" r="2.5" fill={accent} opacity={0.65} />
          </OrbitSatellites>
        </g>
      </Box>

      <Box
        component="img"
        src={(imageUrl as string) || (avatarProps.src as string) || 'https://i.pravatar.cc/150?img=' + index}
        alt={typeof avatarProps.alt === 'string' ? avatarProps.alt : 'avatar'}
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          position: 'relative',
          zIndex: 1,
          p:0.1,
          boxShadow: `0 0 0 2px rgba(255,255,255,0.95), 0 0 0 3px ${accent}33`,
        }}
      />
    </Box>
  );
}
