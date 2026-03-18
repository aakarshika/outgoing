import { Box, Chip, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

import { getCategoryTheme } from '@/features/events/CategoricalBackground';

type UpcomingEventCard = {
  id: string;
  eventId: number;
  start_time?: string;
  cover_image?: string;
  category?: {
    slug?: string;
    name?: string;
  };
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
  upcomingEvents: UpcomingEventCard[];
};

function getCountdownParts(dateString: string | undefined | null) {
  if (!dateString) return { countdown: '-', countdownLabel: 'plan ahead' };
  const today = new Date();
  const target = new Date(dateString);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  const diffDays = Math.ceil(
    (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) return { countdown: 'Now', countdownLabel: 'happening soon' };
  if (diffDays === 1) return { countdown: '1', countdownLabel: 'day away' };
  return { countdown: String(diffDays), countdownLabel: 'days away' };
}

export function MyHomeUpcomingSection({
  hasUpcomingEvents,
  upcomingEvents,
}: Props) {
  if (!hasUpcomingEvents) {
    return null;
  }

  const nextEvent = upcomingEvents[0];
  if (!nextEvent) {
    return null;
  }

  const nextEventCountdown = getCountdownParts(nextEvent ? nextEvent.start_time : null);
  const categoryTheme = getCategoryTheme(nextEvent.category ?? undefined);

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
{/* first of the upcoming events. */}

          <Box
            sx={{
              position: 'relative',
              borderRadius: '28px',
              overflow: 'hidden',
              color: '#fff',
              boxShadow: `0 24px 52px ${categoryTheme.tape}`,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: 7,
                background: `linear-gradient(180deg, ${categoryTheme.accent} 0%, ${categoryTheme.tape} 100%)`,
                zIndex: 3,
              },
            }}
          >
            {nextEvent.cover_image ? (
              <Box
                component="img"
                src={nextEvent.cover_image}
                alt={nextEvent.title}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: categoryTheme.bg,
                  backgroundImage: categoryTheme.pattern,
                  backgroundSize: '20px 20px',
                }}
              />
            )}

            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(135deg, rgba(24, 24, 24, 0.42) 0%, rgba(24, 24, 24, 0.58) 100%)',
              }}
            />

            <Stack spacing={2.5} sx={{ position: 'relative', zIndex: 4, p: { xs: 2.2, sm: 2.8 } }}>
              <Chip
                label={nextEvent.category?.name ? `Upcoming next · ${nextEvent.category.name}` : 'Upcoming next'}
                sx={{
                  width: 'fit-content',
                  bgcolor: 'rgba(255,255,255,0.20)',
                  color: '#fff',
                  fontWeight: 700,
                  letterSpacing: '0.03em',
                  backdropFilter: 'blur(6px)',
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
                    {nextEvent.title}
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
                      {nextEvent.subtitle} 
                    </Typography>
                    <Typography
                      sx={{ fontSize: 14, color: 'rgba(255,255,255,0.60)' }}
                    >
                      •  {nextEvent.day} {nextEvent.month}
                    </Typography>
                  </Stack>
                </Box>
                <Box
                  sx={{
                    minWidth: 118,
                    alignSelf: { xs: 'stretch', sm: 'auto' },
                    p: 1.6,
                    borderRadius: '22px',
                    background: 'rgba(255,255,255,0.18)',
                    border: `1px solid ${categoryTheme.tape}`,
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
{/* rest of the upcoming events. */}
          <Stack spacing={1.4}>
            {upcomingEvents.slice(1).map((event) => {
              const eventTheme = getCategoryTheme(event.category ?? undefined);

              return (
                <Box
                  key={event.id}
                  component={Link}
                  to={`/events-new/${event.eventId}`}
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.4,
                    p: 1.2,
                    pr: 1.35,
                    borderRadius: '22px',
                    background: 'rgba(255,255,255,0.92)',
                    border: `1px solid ${eventTheme.tape}`,
                    boxShadow: `0 14px 30px ${eventTheme.tape}`,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    color: 'inherit',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: 5,
                      background: `linear-gradient(180deg, ${eventTheme.accent} 0%, ${eventTheme.tape} 100%)`,
                    },
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: `0 18px 36px ${eventTheme.tape}`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 74,
                      minWidth: 74,
                      height: 64,
                      borderRadius: '14px',
                      overflow: 'hidden',
                      position: 'relative',
                      backgroundColor: eventTheme.bg,
                      backgroundImage: eventTheme.pattern,
                      backgroundSize: '16px 16px',
                    }}
                  >
                    {event.cover_image ? (
                      <Box
                        component="img"
                        src={event.cover_image}
                        alt={event.title}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : null}
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(180deg, rgba(24, 24, 24, 0.18) 0%, rgba(24, 24, 24, 0.42) 100%)',
                      }}
                    />
                  </Box>

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 0.4 }}
                    >
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.07em',
                          color: eventTheme.accent,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '62%',
                        }}
                      >
                        {event.category?.name || 'Upcoming event'}
                      </Typography>
                    </Stack>
                    <Typography
                      sx={{
                        fontSize: 15,
                        fontWeight: 700,
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {event.title}
                    </Typography>
                    <Box
                      sx={{
                        mt: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        component="span"
                        sx={{
                          minWidth: 0,
                          flex: 1,
                          fontSize: 12,
                          color: '#2B2118',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {event.subtitle}
                      </Typography>
                      <Typography
                        component="span"
                        sx={{
                          flexShrink: 0,
                          fontSize: 12,
                          color: '#2B2118',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        • {event.day} {event.month}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ ml: 'auto', alignSelf: 'flex-end' }}>
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
              );
            })}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

