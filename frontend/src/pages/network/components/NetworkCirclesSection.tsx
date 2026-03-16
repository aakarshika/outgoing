import { Box, Stack, Typography } from '@mui/material';

import type { NetworkGroup } from '../types';
import { SectionIntro } from './SectionIntro';

export function NetworkCirclesSection({
  groups,
  onCircleClick,
}: {
  groups: readonly NetworkGroup[];
  onCircleClick: () => void;
}) {
  return null;
  return (
    <Box
      sx={{
        borderRadius: '10px',
        p: { xs: 2, md: 2.4 },
        background: 'rgba(255,255,255,0.84)',
        boxShadow: '0 24px 50px rgba(110, 74, 36, 0.06)',
      }}
    >
      <SectionIntro
        eyebrow="Your activity, your people"
        title="The shape of your social map"
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            sm: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 1.2,
          mt: 2,
        }}
      >
        {groups.map((group) => (
          <Box
            key={group.name}
            onClick={onCircleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => event.key === 'Enter' && onCircleClick()}
            sx={{
              borderRadius: '18px',
              p: 1.35,
              background: group.active ? '#FFF8F4' : '#F8F4EE',
              cursor: 'pointer',
              '&:hover': { background: group.active ? '#FFF0E8' : '#F0EBE3' },
            }}
          >
            <Stack spacing={1.05} alignItems="center" textAlign="center">
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background: group.background,
                  boxShadow: group.active
                    ? '0 0 0 8px rgba(216, 90, 48, 0.08)'
                    : 'none',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#2B2118',
                }}
              >
                {group.icon}
              </Box>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 19,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: '#2B2118',
                }}
              >
                {group.count}
              </Typography>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#2B2118' }}>
                {group.name}
              </Typography>
              <Typography
                sx={{
                  fontSize: 11.5,
                  lineHeight: 1.45,
                  color: 'rgba(66, 50, 28, 0.62)',
                }}
              >
                {group.caption}
              </Typography>
            </Stack>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
