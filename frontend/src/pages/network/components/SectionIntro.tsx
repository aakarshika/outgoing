import { Button, Stack, Typography } from '@mui/material';
import { ArrowRight } from 'lucide-react';

export function SectionIntro({
  eyebrow,
  title,
  description,
  action,
  onActionClick,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: string;
  onActionClick?: () => void;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
      justifyContent="space-between"
    >
      <Stack spacing={0.8}>
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(66, 50, 28, 0.58)',
          }}
        >
          {eyebrow}
        </Typography>
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: { xs: 26, md: 32 },
            fontWeight: 800,
            lineHeight: 1.04,
            letterSpacing: '-0.045em',
            color: '#2B2118',
          }}
        >
          {title}
        </Typography>
        {description ? (
          <Typography
            sx={{
              maxWidth: 640,
              fontSize: 14.5,
              lineHeight: 1.65,
              color: 'rgba(66, 50, 28, 0.74)',
            }}
          >
            {description}
          </Typography>
        ) : null}
      </Stack>
      {action ? (
        <Button
          variant="text"
          endIcon={<ArrowRight size={16} />}
          onClick={onActionClick}
          sx={{
            px: 0,
            minWidth: 0,
            textTransform: 'none',
            fontWeight: 700,
            color: '#D85A30',
            alignSelf: { xs: 'flex-start', sm: 'center' },
          }}
        >
          {action}
        </Button>
      ) : null}
    </Stack>
  );
}
