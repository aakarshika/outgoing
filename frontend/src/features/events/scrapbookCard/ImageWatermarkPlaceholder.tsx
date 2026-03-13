/**
 * Placeholder when an event has no cover image.
 * Uses category theme and GO symbol; can be used in portrait card or landscape strip.
 */

import type { SxProps, Theme } from '@mui/material';
import { Box } from '@mui/material';

type ThemeSlice = { bg: string; accent: string; pattern: string };

interface ImageWatermarkPlaceholderProps {
  theme?: ThemeSlice;
  /** Size of the GO symbol. 'sm' for landscape strip, 'md' for portrait card. */
  size?: 'sm' | 'md';
  /** If true, only render the icon (no background/pattern). For overlay inside another card. */
  iconOnly?: boolean;
  /** Optional container sx (e.g. for absolute inset). */
  sx?: SxProps<Theme>;
}

const GO_SYMBOL_URL = '/assets/go-symbol.png';

export function ImageWatermarkPlaceholder({
  theme = { bg: 'rgb(242, 242, 242)', accent: 'rgb(159, 100, 28)', pattern: 'none' },
  size = 'md',
  iconOnly = false,
  sx = {},
}: ImageWatermarkPlaceholderProps) {
  const iconSize = size === 'sm' ? 56 : 120;
  const opacity = size === 'sm' ? 0.2 : 0.14;

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(iconOnly ? {} : { bgcolor: theme.bg, backgroundImage: theme.pattern }),
        position: 'absolute',
        inset: 0,
        ...sx,
      }}
    >
      <Box
        sx={{
          width: iconSize,
          height: iconSize,
          bgcolor: theme.accent,
          opacity,
          WebkitMaskImage: `url('${GO_SYMBOL_URL}')`,
          maskImage: `url('${GO_SYMBOL_URL}')`,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
        }}
      />
    </Box>
  );
}
