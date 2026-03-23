import { Avatar, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { ArrowRight, Search, Users } from 'lucide-react';

import type { BuddyCard, HeroMoment, HeroStatItem } from '../types';
import { HeroStat } from './HeroStat';

export function NetworkHeroSection({
  activeBuddies,
  buddyCount,
  heroMoments,
  isAuthenticated,
  stats,
  onPlanClick,
  onSearchClick,
}: {
  activeBuddies: readonly BuddyCard[];
  buddyCount: number;
  heroMoments: readonly HeroMoment[];
  isAuthenticated: boolean;
  stats: readonly HeroStatItem[];
  onPlanClick: () => void;
  onSearchClick: () => void;
}) {
  return (
    <Box
      sx={{
        px: { xs: 2, sm: 2.6, md: 3.2 },
        py: { xs: 2.4, sm: 2.8, md: 3.2 },
        color: '#fff',
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Stack spacing={3}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', xl: 'row' },
              gap: 2.5,
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', xl: 'flex-start' },
            }}
          >
            <Box sx={{ maxWidth: 620 }}>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: { xs: 36, md: 58 },
                  fontWeight: 800,
                  lineHeight: 0.97,
                  letterSpacing: '-0.06em',
                  maxWidth: 560,
                }}
              >
              </Typography>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.2}
                alignItems={{ xs: 'stretch', md: 'center' }}
                sx={{ mt: 2.4 }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  onClick={onSearchClick}
                  sx={{
                    minWidth: 0,
                    flex: 1,
                    justifyContent: 'space-between',
                    px: 1.6,
                    py: 1.15,
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.14)',
                    cursor: 'pointer',
                  }}
                >
                  <Search size={16} />
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.88)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    Search your people
                  </Typography>
                  <Button
                    variant="contained"
                    endIcon={<ArrowRight size={16} />}
                    onClick={onPlanClick}
                    sx={{
                      flexShrink: 0,
                      borderRadius: '999px',
                      px: 2.3,
                      textTransform: 'none',
                      fontWeight: 800,
                      color: '#2B2118',
                      background: '#FFF5EE',
                      boxShadow: 'none',
                    }}
                  >
                    Make a plan
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
