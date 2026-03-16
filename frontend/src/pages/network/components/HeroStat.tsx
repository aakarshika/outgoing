import { Box, Stack, Typography } from '@mui/material';

import type { HeroStatItem } from '../types';

export function HeroStat({ value, label, detail, accent, color }: HeroStatItem) {
  return (
    <Box
      sx={{
        borderRadius: '18px',
        px: 2,
        py: 1.9,
        background: 'rgba(255,255,255,0.14)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Stack direction="row" spacing={1.15} alignItems="flex-start">
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '14px',
            background: accent,
            color,
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {value}
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#FFF7F2' }}>
            {label}
          </Typography>
          <Typography
            sx={{ mt: 0.35, fontSize: 11.5, color: 'rgba(255,255,255,0.72)' }}
          >
            {detail}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
