import { Box, Chip, Stack, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

import { getCategoryTheme } from '@/features/events/CategoricalBackground';
import { BaseFeedEventItem } from '@/types/events';


type CountdownParts = {
  countdown: string | number;
  countdownLabel: string;
};

type Props = {
  hasUpcomingEvents: boolean;
  upcomingEvents: BaseFeedEventItem[];
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

function getRoleStyle(kind: 'hosting' | 'saved' | 'attending' | 'vendor' | 'unknown') {
  switch (kind) {
    case 'hosting':
      return { label: 'Hosting', background: '#E7EDFF', color: '#2D4EDA' };
    case 'vendor':
      return { label: 'Servicing', background: '#E1F5EE', color: '#0F6E56' };
    case 'saved':
      return { label: 'Saved', background: '#FBEAF0', color: '#B03A63' };
    default:
      return { label: 'Going', background: 'transparent', color: 'transparent' };
  }
}

function getCategoryIconGlyph(icon?: string | null) {
  switch (icon) {
    case 'palette':
      return '🎨';
    case 'music':
      return '♪';
    case 'utensils':
      return '🍴';
    case 'users':
      return '👥';
    case 'laugh':
      return '😂';
    case 'heart-handshake':
      return '♥';
    case 'party-popper':
      return '🎉';
    case 'mountain':
      return '⛰';
    case 'moon':
      return '🌙';
    case 'dumbbell':
      return '🏋';
    case 'book-open':
      return '📖';
    case 'cpu':
    default:
      return '⚙';
  }
}
export function MyHomeUpcomingSection({
  hasUpcomingEvents,
  upcomingEvents,
}: Props) {
  if (!hasUpcomingEvents) {
    return null;
  }

  const upcomingEventsDetails = upcomingEvents.map((event) => {


    let role: 'hosting' | 'attending' | 'vendor' | 'unknown' = 'unknown';
    if (event.i_am_host) role = 'hosting';
    else if (event.user_is_vendor) role = 'vendor';
    else if (event.user_is_interested) role = 'attending';
    else if (event.user_has_ticket) role = 'attending';
    else role = 'unknown';
    return {
      ...event,
      pill: getRoleStyle(role),
      role: role,
    };
  });
  const nextEvent = upcomingEventsDetails[0];
  if (!nextEvent) {
    return null;
  }

  const nextEventCountdown = getCountdownParts(nextEvent ? nextEvent.start_time : null);
  const categoryTheme = getCategoryTheme(nextEvent.category ?? undefined);

  const navigate = useNavigate();
  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, md: 4 },}}
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
            color: '#fff',
            boxShadow: `0 24px 52px ${categoryTheme.tape}`,
          }}
          >

          <Box
            onClick={() => navigate('/events-new/' + nextEvent.id)}
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
                  background: `linear-gradient(145deg, ${categoryTheme.bg} 0%, #F7F2EA 62%, #EEE5D8 100%)`,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: categoryTheme.pattern,
                    backgroundSize: '20px 20px',
                    opacity: 0.65,
                  },
                }}
              />
            )}

            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: nextEvent.cover_image
                  ? 'linear-gradient(135deg, rgba(24, 24, 24, 0.42) 0%, rgba(24, 24, 24, 0.58) 100%)'
                  : 'linear-gradient(135deg, rgba(51, 39, 26, 0.34) 0%, rgba(33, 26, 18, 0.1) 100%)',
              }}
            />

            {!nextEvent.cover_image ? (
              <Box
                sx={{
                  position: 'absolute',
                  right: { xs: 14, sm: 20 },
                  top: { xs: 14, sm: 20 },
                  width: { xs: 52, sm: 58 },
                  height: { xs: 52, sm: 58 },
                  borderRadius: '16px',
                  zIndex: 5,
                  display: 'grid',
                  placeItems: 'center',
                  border: '1px solid rgba(255,255,255,0.35)',
                  background: 'rgba(255,255,255,0.22)',
                  backdropFilter: 'blur(4px)',
                  boxShadow: '0 8px 18px rgba(0,0,0,0.18)',
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: 26, sm: 30 },
                    fontWeight: 800,
                    color: '#fff',
                    lineHeight: 1,
                    textShadow: '0 1px 4px rgba(0,0,0,0.28)',
                  }}
                >
                  {getCategoryIconGlyph(categoryTheme?.icon)}
                </Typography>
              </Box>
            ) : null}

            <Chip
              label={
                nextEvent.category?.name ? `Upcoming next · ${nextEvent.category.name}` : 'Upcoming next'
              }
              sx={{
                position: 'absolute',
                left: { xs: 16, sm: 20 },
                bottom: { xs: 16, sm: 20 },
                zIndex: 5,
                width: 'fit-content',
                bgcolor: nextEvent.cover_image ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.24)',
                color: '#fff',
                fontWeight: 700,
                letterSpacing: '0.03em',
                backdropFilter: 'blur(6px)',
              }}
            />

            <Stack spacing={2.5} sx={{ position: 'relative', zIndex: 4, p: { xs: 2.2, sm: 2.8 } }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
              >
              <Box
                sx={{
                  minWidth: 118,
                  alignSelf: { xs: 'stretch', sm: 'auto' },
                  p: 1.6,
                  borderRadius: '22px',
                  background: nextEvent.cover_image ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.24)',
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
              </Stack>
            </Stack>
          </Box>

          <Chip
                    label={nextEvent.pill.label}
                    sx={{
                      position: 'absolute',
                      left: -2,
                      bottom: -3,
                      zIndex: 12,
                      color: nextEvent.i_am_host ? '#fff' : nextEvent.user_is_vendor ? '#fff' : nextEvent.pill?.color,
                      lineHeight: 1,
                      bgcolor: nextEvent.i_am_host ? '#8b5cf6' : nextEvent.user_is_vendor ? '#0eacac' : nextEvent.pill.background,
                      p: 0,
                      borderRadius: '2px',
                      fontFamily: 'serif',
                      fontSize: '0.7rem',
                      m: 0,
                      padding: 0,
                    }}
                  />  
          </Box>
          {/* rest of the upcoming events. */}
          <Stack spacing={1.4}>
            {upcomingEventsDetails.slice(1).map((event) => {
              const eventTheme = getCategoryTheme(event.category ?? undefined);

              return (
                <Box 
                  key={event.id}
                  component={Link}
                  to={`/events-new/${event.id}`} 
                  sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  color: 'inherit',
                }}>
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    width: '100%',
                    
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
                        background: event.cover_image
                          ? 'linear-gradient(180deg, rgba(24, 24, 24, 0.18) 0%, rgba(24, 24, 24, 0.42) 100%)'
                          : 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.24) 100%)',
                      }}
                    />
                    {!event.cover_image ? (
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 28,
                            fontWeight: 800,
                            lineHeight: 1,
                            color: 'rgba(43,33,24,0.62)',
                          }}
                        >
                          {getCategoryIconGlyph(eventTheme?.icon)}
                        </Typography>
                      </Box>
                    ) : null}

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
                        // Mobile: allow full title to wrap to multiple lines.
                        // Desktop: keep it compact with a single-line clamp.
                        display: { xs: 'block', sm: '-webkit-box' },
                        WebkitLineClamp: { xs: 'unset', sm: 1 },
                        WebkitBoxOrient: { xs: 'unset', sm: 'vertical' },
                        overflow: { xs: 'visible', sm: 'hidden' },
                        whiteSpace: { xs: 'normal', sm: 'nowrap' },
                      }}
                    >
                      {event.title}
                    </Typography>
                    <Box
                      sx={{
                        mt: 0.5,
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: { xs: 0.25, sm: 0.5 },
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        component="span"
                        sx={{
                          minWidth: 0,
                          fontSize: 12,
                          color: '#2B2118',
                          fontWeight: 500,
                          flex: { xs: '0 0 auto', sm: 1 },
                          overflow: { xs: 'visible', sm: 'hidden' },
                          textOverflow: { xs: 'clip', sm: 'ellipsis' },
                          whiteSpace: { xs: 'normal', sm: 'nowrap' },
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
                          whiteSpace: { xs: 'normal', sm: 'nowrap' },
                        }}
                      >
                        • {event.day} {event.month}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                  <Chip
                    label={event.pill.label}
                    sx={{
                      position: 'absolute',
                      left: -2,
                      bottom: -3,
                      zIndex: 12,
                      color: event.i_am_host ? '#fff' : event.user_is_vendor ? '#fff' : event.pill?.color,
                      lineHeight: 1,
                      bgcolor: event.i_am_host ? '#8b5cf6' : event.user_is_vendor ? '#0eacac' : event.pill.background,
                      p: 0,
                      borderRadius: '2px',
                      fontFamily: 'serif',
                      fontSize: '0.7rem',
                      m: 0,
                      padding: 0,
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

