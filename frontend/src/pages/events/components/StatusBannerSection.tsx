import { Box, Button as MuiButton, IconButton, Typography } from '@mui/material';
import { ArrowLeft, FileEdit, Heart } from 'lucide-react';

import { TicketStatusBadge } from '@/features/events/TicketStatusBadge';

import { CuteTimer, getDaysAgo, Highlighter } from './scrapbookHelpers';

export const StatusBannerSection = ({
  event,
  isHost,
  isAuthenticated,
  navigate,
  toggleInterest,
  occurrences = [],
}: {
  event: any;
  isHost: boolean;
  isAuthenticated: boolean;
  navigate: any;
  toggleInterest: any;
  occurrences?: any[];
}) => {
  const showTimer =
    event.lifecycle_state === 'event_ready' || event.lifecycle_state === 'published';

  return (
    <Box sx={{ mb: 4, position: 'relative', zIndex: 25 }}>
      {/* Top Row: Back Button (Left) | Status/Actions (Right) */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Left: Back Button */}
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            bgcolor: 'white',
            '&:hover': { bgcolor: '#f0f0f0' },
            boxShadow: 1,
          }}
        >
          <ArrowLeft />
        </IconButton>

        {/* Right: Status text, Heart, Manage */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
          {/* Status Text Row 1 */}
          {['live', 'completed', 'published', 'event_ready'].includes(
            event.lifecycle_state,
          ) && (
              <Box sx={{ mr: { xs: 0.5, sm: 1 } }}>
                {event.lifecycle_state === 'live' ? (
                  <Box sx={{ textAlign: 'right', transform: 'rotate(-2deg)' }}>
                    <Typography
                      sx={{
                        fontFamily: '"Permanent Marker", cursive',
                        fontSize: { xs: '0.9rem', sm: '1.2rem', md: '1.6rem' },
                        color: '#92400e',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Highlighter color="rgba(251, 191, 36, 0.7)">
                        happening now!
                      </Highlighter>
                    </Typography>
                    <Typography
                      component="a"
                      href="#highlights"
                      sx={{
                        fontFamily: '"Caveat", cursive',
                        fontSize: { xs: '0.8rem', sm: '1rem' },
                        color: '#92400e',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                        display: 'block',
                        mt: -0.5,
                      }}
                    >
                      check out the highlights
                    </Typography>
                  </Box>
                ) : event.lifecycle_state === 'completed' ? (
                  <Box sx={{ textAlign: 'right', transform: 'rotate(1deg)' }}>
                    <Typography
                      component="a"
                      href="#highlights"
                      sx={{
                        fontFamily: '"Permanent Marker", cursive',
                        fontSize: { xs: '0.8rem', sm: '1.1rem', md: '1.3rem' },
                        color: 'text.secondary',
                        whiteSpace: 'nowrap',
                        textDecoration: 'none',
                        '&:hover': { color: 'text.primary' },
                      }}
                    >
                      check out the highlights
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1,
                        alignItems: 'baseline',
                      }}
                    >
                      <Typography
                        component="a"
                        href="#reviews"
                        sx={{
                          fontFamily: '"Caveat", cursive',
                          fontSize: { xs: '0.8rem', sm: '1rem' },
                          color: '#16a34a', // Using a green for reviews link
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {event.reviews?.length || 0} reviews
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'serif',
                          fontStyle: 'italic',
                          color: 'text.disabled',
                          fontWeight: 'bold',
                        }}
                      >
                        {getDaysAgo(event.start_time)}
                      </Typography>
                    </Box>
                  </Box>
                ) : event.lifecycle_state === 'event_ready' ? (
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography
                      sx={{
                        fontFamily: '"Permanent Marker", cursive',
                        fontSize: { xs: '0.9rem', sm: '1.2rem', md: '1.6rem' },
                        color: '#165aa3ff',
                        transform: 'rotate(2deg)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Live soon...
                    </Typography>
                  </Box>
                ) :
                  event.lifecycle_state === 'published' ? (
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        sx={{
                          fontFamily: '"Permanent Marker", cursive',
                          fontSize: { xs: '0.9rem', sm: '1.2rem', md: '1.6rem' },
                          color: '#165aa3ff',
                          transform: 'rotate(2deg)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Coming Soon!
                      </Typography>
                    </Box>
                  ) : null}
              </Box>
            )}

          {isAuthenticated && (
            <IconButton
              onClick={() =>
                toggleInterest.mutate({
                  eventId: event.id,
                  isInterested: !event.user_is_interested,
                })
              }
              sx={{
                bgcolor: event.user_is_interested
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(255,255,255,0.8)',
                border: '2px solid',
                borderColor: event.user_is_interested ? '#ef4444' : '#ccc',
                '&:hover': {
                  bgcolor: event.user_is_interested
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(255,255,255,1)',
                  transform: 'scale(1.1) rotate(5deg)',
                },
                transition: 'all 0.2s',
                p: { xs: 0.5, sm: 1 },
                mr: 3,
                boxShadow: 1,
              }}
            >
              <Heart
                size={18}
                fill={event.user_is_interested ? '#ef4444' : 'transparent'}
                color={event.user_is_interested ? '#ef4444' : '#999'}
              />
            </IconButton>
          )}

          {['published', 'event_ready'].includes(event.lifecycle_state) && (
            <Box
              component="a"
              href="#tickets"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                textDecoration: 'none',
                gap: 0.5,
                transform: ' scale(1.4)',
              }}
            >
              <TicketStatusBadge
                ticketCount={event.ticket_count}
                capacity={event.capacity}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Bottom Row: Recurring List (Left) | Timer (Right Aligned) */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          mt: 1,
          gap: 2,
          flexWrap: 'wrap-reverse',
        }}
      >
        {/* Recurring occurrences navigation */}
        {occurrences.length > 1 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pb: 1 }}>
            {occurrences.map((occ: any, idx: number) => {
              const isCurrent = occ.id === event.id;
              const d = new Date(occ.start_time);
              // Sketchy border and color logic
              return (
                <Box
                  key={occ.id}
                  onClick={() => !isCurrent && navigate(`/events/${occ.id}`)}
                  sx={{
                    cursor: isCurrent ? 'default' : 'pointer',
                    px: 1.5,
                    py: 0.5,
                    bgcolor: isCurrent ? 'rgba(239, 68, 68, 0.1)' : 'white',
                    border: '1.5px solid',
                    borderColor: isCurrent ? '#ef4444' : 'rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                    transform: `rotate(${((idx % 3) - 1) * 2}deg)`,
                    boxShadow: isCurrent
                      ? '2px 2px 0px rgba(239, 68, 68, 0.2)'
                      : '1px 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    '&:hover': !isCurrent
                      ? {
                        transform: 'scale(1.1) rotate(0deg)',
                        boxShadow: '2px 2px 8px rgba(0,0,0,0.1)',
                        borderColor: 'rgba(0,0,0,0.3)',
                        zIndex: 2,
                      }
                      : {},
                    position: 'relative',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Caveat", cursive',
                      fontSize: '0.9rem',
                      fontWeight: isCurrent ? 'bold' : 'normal',
                      color: isCurrent ? '#ef4444' : 'text.secondary',
                      lineHeight: 1,
                      pointerEvents: 'none',
                    }}
                  >
                    #{idx + 1}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: 'serif',
                      fontSize: '0.65rem',
                      color: isCurrent ? '#ef4444' : '#666',
                      display: 'block',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}
                  >
                    {d.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Typography>
                  {isCurrent && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 6,
                        height: 6,
                        bgcolor: '#ef4444',
                        borderRadius: '50%',
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        {/* Timer Spacer if no occurrences */}
        {!occurrences.length && <Box />}

        {showTimer && (
          <Box sx={{ alignSelf: 'flex-end', mb: 1 }}>
            <CuteTimer targetDate={event.start_time} />
          </Box>
        )}
      </Box>
    </Box>
  );
};
