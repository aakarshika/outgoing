import { Box, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { SubHeaderEventPage } from './SubHeaderEventPage';

export type WayChoice = 'buyin' | 'chipin';

const BUYIN = '#D85A30';
const CHIPIN = '#EF9F27';
const MUTED_BG = '#E0DAD3';
const MUTED_TEXT = '#888780';

export interface WayInModuleProps {
  defaultWay?: WayChoice;
  onWayChange?: (way: WayChoice) => void;
}

export function WayInModule({ defaultWay = 'buyin', onWayChange }: WayInModuleProps) {
  const [choice, setChoice] = useState<WayChoice>(defaultWay);

  const pick = useCallback(
    (way: WayChoice) => {
      setChoice(way);
      onWayChange?.(way);
    },
    [onWayChange],
  );

  const buyinActive = choice === 'buyin';
  const chipinActive = choice === 'chipin';

  const signButtonSx = {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
    position: 'relative' as const,
    border: 'none',
    background: 'none',
    padding: 0,
    font: 'inherit',
    '&:active': { transform: 'scale(0.97)' },
  };

  return (
<>
    <SubHeaderEventPage
    heading="Your way in"
    description=""
    icon=""
  />
    <Box
      sx={{
        py: 3,
        px: 2,
        bgcolor: 'var(--color-background-tertiary)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 1.25,
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={() => pick('buyin')}
        aria-pressed={buyinActive}
        sx={{
          ...signButtonSx,
          flexDirection: 'row',
        }}
      >
        <Box
          sx={{
            width: 0,
            height: 0,
            borderTop: '28px solid transparent',
            borderBottom: '28px solid transparent',
            borderRight: `22px solid ${buyinActive ? BUYIN : MUTED_BG}`,
          }}
        />
        <Box
          sx={{
            py: 1.625,
            px: 2.75,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: 160,
            bgcolor: buyinActive ? BUYIN : MUTED_BG,
            color: buyinActive ? '#fff' : MUTED_TEXT,
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Syne", sans-serif',
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: buyinActive ? '#fff' : MUTED_TEXT,
            }}
          >
            Buy in
          </Typography>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 500,
              mt: 0.375,
              letterSpacing: '0.04em',
              opacity: 0.75,
            }}
          >
            from ₹0 · instant
          </Typography>
        </Box>
      </Box>

      <Box
        component="button"
        type="button"
        onClick={() => pick('chipin')}
        aria-pressed={chipinActive}
        sx={{
          ...signButtonSx,
          flexDirection: 'row-reverse',
        }}
      >
        <Box
          sx={{
            py: 1.625,
            px: 2.75,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: 160,
            bgcolor: chipinActive ? CHIPIN : MUTED_BG,
            color: chipinActive ? '#fff' : MUTED_TEXT,
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Syne", sans-serif',
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: chipinActive ? '#fff' : MUTED_TEXT,
            }}
          >
            Chip in
          </Typography>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 500,
              mt: 0.375,
              letterSpacing: '0.04em',
              opacity: 0.75,
            }}
          >
            earn or get in free
          </Typography>
        </Box>
        <Box
          sx={{
            width: 0,
            height: 0,
            borderTop: '28px solid transparent',
            borderBottom: '28px solid transparent',
            borderLeft: `22px solid ${chipinActive ? CHIPIN : MUTED_BG}`,
          }}
        />
      </Box>
    </Box>
    </>
  );
}
