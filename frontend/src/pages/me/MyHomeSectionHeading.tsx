import { Box, Stack, Typography } from '@mui/material';
import type React from 'react';

type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function SectionHeading({ eyebrow, title, description, action }: Props) {
  return (
    <Stack spacing={0.75} sx={{ position: 'relative' }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={2}
      >
        <Stack spacing={0.75}>
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(66, 50, 28, 0.62)',
            }}
          >
            {eyebrow}
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: { xs: 24, sm: 28 },
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: '#2B2118',
            }}
          >
            {title}
          </Typography>
        </Stack>
        {action && <Box sx={{ pt: 1 }}>{action}</Box>}
      </Stack>
      {description ? (
        <Typography
          sx={{ fontSize: 14, color: 'rgba(66, 50, 28, 0.72)', maxWidth: 560 }}
        >
          {description}
        </Typography>
      ) : null}
    </Stack>
  );
}

