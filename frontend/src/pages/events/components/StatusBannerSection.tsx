import { useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { ArrowLeft, ChevronDown, ChevronUp, Globe, Heart, MapPin } from 'lucide-react';

import { TicketStatusBadge } from '@/features/events/TicketStatusBadge';

import { CuteTimer, getDaysAgo, Highlighter } from './scrapbookHelpers';
import { WhenWhereCard } from './WhenWhereCard';

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
  const [occurrencesExpanded, setOccurrencesExpanded] = useState(false);
  const hasOccurrences = occurrences.length > 0;
  const hasMultipleOccurrences = occurrences.length > 1;
  const currentOccurrence =
    occurrences.find((occ) => occ.id === event.id) ?? occurrences[0];
  const collapsedOccurrences = currentOccurrence ? [currentOccurrence] : [];
  const occurrencesToDisplay = occurrencesExpanded
    ? occurrences
    : collapsedOccurrences;

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
        {/* Right: Status text, Heart, Manage */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>



          {/* Save the Date stamp */}
          {['live', 'completed'].includes(event.lifecycle_state) &&
            event.category?.icon !== 'cpu' && (
              <Box
                component="button"
                sx={{
                  width: 80,
                  height: 80,
                  display: 'flex',
                  flexDirection: 'column',
                  mr: 3,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotate(-15deg)',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'rotate(-10deg) scale(1.05)'
                  },
                  transition: 'all 0.2s',
                }}>
                <Heart
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/signin');
                      return;
                    }
                    toggleInterest.mutate({
                      eventId: event.id,
                      isInterested: !event.user_is_interested,
                    });
                  }}
                  size={60}
                  fill={event.user_is_interested ? '#ef4444' : '#eeeeee'}
                  color={'#ef4444'}
                />
              </Box>
            )}

          {/* Save the Date stamp */}
          {['published', 'at_risk', 'event_ready'].includes(event.lifecycle_state) &&
            event.category?.icon !== 'cpu' && (
              <Box
                component="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/signin');
                    return;
                  }
                  toggleInterest.mutate({
                    eventId: event.id,
                    isInterested: !event.user_is_interested,
                  });
                }}
                sx={{
                  width: 80,
                  height: 80,
                  border: '3px solid rgba(239, 68, 68, 0.6)',
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  mr: 3,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotate(-15deg)',
                  cursor: 'pointer',
                  bgcolor: event.user_is_interested
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'rotate(-10deg) scale(1.05)',
                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                  },
                }}
              >

                {isAuthenticated && (

                  <Heart
                    size={18}
                    fill={event.user_is_interested ? '#ef4444' : '#eeeeee'}
                    color={'#ef4444'}
                  />
                )}
                <Typography
                  sx={{
                    color: 'rgba(239, 68, 68, 0.6)',
                    fontFamily: '"Permanent Marker"',
                    fontSize: '0.7rem',
                    textAlign: 'center',
                    lineHeight: 1,
                  }}
                >
                  {event.user_is_interested ? (
                    <>
                      SAVED!
                    </>
                  ) : (
                    <>
                      SAVE THE
                      <br />
                      DATE
                      <br />
                    </>
                  )}
                </Typography>
              </Box>
            )}

          {/* Ticket Status Badge */}
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
                highlighted={
                  event.user_has_ticket ||
                  (event.user_tickets && event.user_tickets.length > 0)
                }
              />
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'inline-flex', alignSelf: 'flex-end', mb: 1 }}>
          {/* Status Text Row 1 */}
          {(
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
                    Event Completed, check out the highlights
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
                    Live in...
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
                        transform: 'rotate(0deg)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Coming up in ...
                    </Typography>
                  </Box>
                ) : <Box sx={{ textAlign: 'right' }}>
                  <Typography
                    sx={{
                      fontFamily: '"Permanent Marker", cursive',
                      fontSize: { xs: '0.9rem', sm: '1.2rem', md: '1.6rem' },
                      color: '#165aa3ff',
                      transform: 'rotate(0deg)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    DRAFT !
                  </Typography>
                </Box>}
            </Box>
          )}
          {showTimer && (
            <CuteTimer targetDate={event.start_time} />
          )}
        </Box>
      </Box>

      {/* Bottom Row: Recurring List (Left) | Timer (Right Aligned) */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          mt: 1,
          flexWrap: 'wrap-reverse',
        }}
      >
        {/* Recurring occurrences navigation */}
        {hasOccurrences && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              pb: 1,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {occurrencesToDisplay && occurrencesToDisplay.map((occ: any, idx: number) => {
                const isCurrent = occ.id === event.id;
                const d = new Date(occ.start_time);
                // Sketchy border and color logic
                return (
                  <Box
                    key={occ.id}
                    onClick={() => !isCurrent && navigate(`/events/${occ.id}`)}
                    sx={{
                      minWidth: 100,
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
                        weekday: 'long',
                        year: 'numeric',
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
            {hasMultipleOccurrences && (
              <IconButton
                size="small"
                onClick={() => setOccurrencesExpanded((prev) => !prev)}
                aria-label={
                  occurrencesExpanded
                    ? 'Collapse other occurrences'
                    : 'Reveal all occurrences'
                }
                sx={{
                  border: '1px solid rgba(0,0,0,0.1)',
                  bgcolor: 'rgba(0,0,0,0.02)',
                  p: 0.6,
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.08)' },
                  ml: 'auto',
                }}
              >
                {occurrencesExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </IconButton>
            )}
          </Box>
        )}

        {/* Timer Spacer if no occurrences */}
        {(!occurrences || occurrences.length === 0) &&
          (

            <Box
              key={event.id + '_current'}
              sx={{
                minWidth: 100,
                cursor: 'default',
                px: 1.5,
                py: 0.5,
                bgcolor: 'rgba(239, 68, 68, 0.1)',
                border: '1.5px solid',
                borderColor: '#ef4444',
                borderRadius: '4px',
                transform: `rotate(${2}deg)`,
                boxShadow: '2px 2px 0px rgba(239, 68, 68, 0.2)',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                position: 'relative',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'serif',
                  fontSize: '0.65rem',
                  color: '#ef4444',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {new Date(event.start_time).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  weekday: 'long',
                  year: 'numeric',
                })}
              </Typography>

            </Box>
          )}

        <Box
          key={event.id + '_current_location'}
          sx={{
            minWidth: 100,
            cursor: 'default',
            px: 1.5,
            py: 0.5,
            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            position: 'relative',
          }}
        >
          <
            >

            {event.location_address === 'Online Event' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Globe size={16} style={{ color: 'rgb(86 167 199)' }} />
                <Box>
                  <Typography
                    sx={{
                      fontFamily: '"Caveat"',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: 'rgb(86 167 199)',
                    }}
                  >
                    Online Event
                  </Typography>
                </Box>
              </Box>
            )}
            {event.location_name && event.location_address !== 'Online Event' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MapPin size={16} style={{ color: 'rgb(92 154 134)' }} />
                <Box>
                  <Typography
                    sx={{
                      fontFamily: '"Caveat"',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: 'rgb(92 154 134)',
                    }}
                  >
                    {event.location_name}
                  </Typography>
                </Box>
              </Box>
            )}
          </>

        </Box>
      </Box>

    </Box>
  );
};
