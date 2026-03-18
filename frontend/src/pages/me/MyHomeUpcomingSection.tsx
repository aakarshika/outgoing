import { Box, Chip, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

type UpcomingEventCard = {
  id: string;
  eventId: number;
  month: string;
  day: string;
  title: string;
  subtitle: string;
  pill: { label: string; background: string; color: string };
};

type CountdownParts = {
  countdown: string | number;
  countdownLabel: string;
};

type Props = {
  hasUpcomingEvents: boolean;
  nextEventTitle: string;
  nextEventHref?: string;
  nextEventDateTimeLabel: string;
  nextEventLocationLabel: string;
  nextEventCountdown: CountdownParts;
  upcomingEvents: UpcomingEventCard[];
};

export function MyHomeUpcomingSection({
  hasUpcomingEvents,
  nextEventTitle,
  nextEventHref,
  nextEventDateTimeLabel,
  nextEventLocationLabel,
  nextEventCountdown,
  upcomingEvents,
}: Props) {
  if (!hasUpcomingEvents) {
    return null;
  }

  const NextEventComponent = nextEventHref ? Link : 'div';

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, md: 4 },
        borderBottom: '1px solid rgba(143, 105, 66, 0.10)',
        background:
          'linear-gradient(135deg, rgba(216,90,48,0.12) 0%, rgba(250,238,218,0.2) 60%, rgba(255,255,255,0.12) 100%)',
      }}
    >
      <Stack spacing={3}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1.35fr 0.95fr' },
            gap: 2,
          }}
        >
          <Box
            component={NextEventComponent}
            to={nextEventHref}
            sx={{
              borderRadius: '28px',
              p: { xs: 2.2, sm: 2.8 },
              background: 'linear-gradient(135deg, #D85A30 0%, #C84E24 100%)',
              color: '#fff',
              boxShadow: '0 26px 56px rgba(216, 90, 48, 0.28)',
              ...(nextEventHref && {
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'block',
                '&:hover': { boxShadow: '0 30px 64px rgba(216, 90, 48, 0.35)' },
              }),
            }}
          >
            <Stack spacing={2.5}>
              <Chip
                label={nextEventHref ? 'Upcoming next' : 'No event yet'}
                sx={{
                  width: 'fit-content',
                  bgcolor: 'rgba(255,255,255,0.16)',
                  color: '#fff',
                  fontWeight: 700,
                  letterSpacing: '0.03em',
                }}
              />
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: { xs: 26, sm: 30 },
                      fontWeight: 800,
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {nextEventTitle}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    sx={{ mt: 1.2, flexWrap: 'wrap' }}
                  >
                    <Typography
                      sx={{ fontSize: 14, color: 'rgba(255,255,255,0.88)' }}
                    >
                      {nextEventDateTimeLabel}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 14, color: 'rgba(255,255,255,0.60)' }}
                    >
                      •
                    </Typography>
                    <Typography
                      sx={{ fontSize: 14, color: 'rgba(255,255,255,0.88)' }}
                    >
                      {nextEventLocationLabel}
                    </Typography>
                  </Stack>
                </Box>
                <Box
                  sx={{
                    minWidth: 118,
                    alignSelf: { xs: 'stretch', sm: 'auto' },
                    p: 1.6,
                    borderRadius: '22px',
                    background: 'rgba(255,255,255,0.14)',
                    textAlign: { xs: 'left', sm: 'right' },
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 40,
                      fontWeight: 800,
                      lineHeight: 1,
                    }}
                  >
                    {nextEventCountdown.countdown}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.76)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {nextEventCountdown.countdownLabel}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>

          <Stack spacing={1.4}>
            {upcomingEvents.map((event) => (
              <Box
                key={event.id}
                component={Link}
                to={`/events-new/${event.eventId}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: '24px',
                  background: 'rgba(255,255,255,0.88)',
                  border: '1px solid rgba(143, 105, 66, 0.12)',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': { background: 'rgba(255,255,255,0.96)' },
                }}
              >
                <Box
                  sx={{
                    minWidth: 54,
                    px: 1,
                    py: 1,
                    borderRadius: '18px',
                    background: '#FAECE7',
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#993C1D',
                    }}
                  >
                    {event.month}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 22,
                      fontWeight: 800,
                      color: '#D85A30',
                      lineHeight: 1,
                    }}
                  >
                    {event.day}
                  </Typography>
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{ fontSize: 15, fontWeight: 700, color: '#2B2118' }}
                  >
                    {event.title}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.35,
                      fontSize: 12.5,
                      color: 'rgba(66, 50, 28, 0.68)',
                    }}
                  >
                    {event.subtitle}
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  <Chip
                    label={event.pill.label}
                    sx={{
                      bgcolor: event.pill.background,
                      color: event.pill.color,
                      fontWeight: 700,
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

