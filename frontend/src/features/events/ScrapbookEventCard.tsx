import { Box, Typography } from '@mui/material';
import { Calendar } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Media } from '@/components/ui/media';
import { useAuth } from '@/features/auth/hooks';
import { formatEventRelativeTime } from '@/utils/dateUtils';

import { CategoricalBackground, CATEGORY_THEMES } from './CategoricalBackground';
import { LikeButton } from './LikeButton';
import { LocationTag } from './LocationTag';
import { TicketStatusBadge } from './TicketStatusBadge';
import { PosterForEventCard } from '@/pages/events/components/PosterForEventCard';

interface EventListItem {
  id: number;
  title: string;
  description?: string;
  cover_image: string | null;
  start_time: string;
  location_name: string;
  location_address?: string;
  latitude?: number | null;
  longitude?: number | null;
  category?: { name: string; icon: string; slug?: string } | null;
  ticket_price_standard: string | null;
  ticket_price_flexible: string | null;
  lifecycle_state: string;
  user_is_interested?: boolean;
  interest_count?: number;
  capacity?: number | null;
  ticket_count?: number;
  media?: Array<{
    id: number;
    media_type: 'image' | 'video';
    category: 'gallery' | 'highlight';
    file: string;
  }>;
  user_has_ticket?: boolean;
  user_is_vendor?: boolean;
  host?: { username: string };
  user_applications?: any[];
}

const WashiTape = ({ color = 'rgba(59, 130, 246, 0.5)', rotate = '0deg' }) => (
  <Box
    sx={{
      position: 'absolute',
      top: -10,
      left: '50%',
      transform: `translateX(-50%) rotate(${rotate})`,
      width: 60,
      height: 18,
      bgcolor: color,
      opacity: 0.8,
      zIndex: 2,
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      '&::before, &::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 4,
        backgroundImage: `linear-gradient(to right, ${color} 50%, transparent 50%)`,
        backgroundSize: '2px 4px',
      },
      '&::before': { left: -2 },
      '&::after': { right: -2 },
    }}
  />
);

const PhotoClip = () => (
  <Box
    sx={{
      position: 'absolute',
      top: -15,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 14,
      height: 35,
      bgcolor: '#E8D5B5', // Wood/Bamboo peg color
      border: '1px solid rgba(0,0,0,0.1)',
      borderRadius: '2px',
      zIndex: 40, // Above everything
      boxShadow: '1px 2px 4px rgba(0,0,0,0.1)',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 8,
        left: 0,
        right: 0,
        height: '2px',
        bgcolor: 'rgba(0,0,0,0.15)',
      },
    }}
  />
);

export const ScrapbookEventCard = ({
  event,
  isFocused,
  showClip = false,
  rotation,
  rotationhover,
  disableHover,
}: {
  event: EventListItem;
  isFocused?: boolean;
  showClip?: boolean;
  rotation?: number;
  rotationhover?: number;
  disableHover?: boolean;
}) => {
  const { user, isAuthenticated } = useAuth();
  const isHost =
    isAuthenticated && user && event.host && user.username === event.host.username;
  const isVendor =
    isAuthenticated && user && (event.user_is_vendor || (event.user_applications && event.user_applications.length > 0));


  const categorySlug =
    event.category?.slug ||
    event.category?.name
      ?.toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ||
    '';

  const theme = CATEGORY_THEMES[categorySlug] || {
    tape: 'rgba(59, 130, 246, 0.4)',
    accent: '#475569',
  };
  const tapeColor = theme.tape;

  const relativeTime = formatEventRelativeTime(event.start_time);
  const price = event.ticket_price_standard
    ? `$${parseFloat(event.ticket_price_standard).toFixed(0)}`
    : 'Free';
  const isNoImageCard = !event.cover_image;

  // const rotation = useMemo(
  //   () => (1 + Math.random() * 2),
  //   [],
  // );
  const baseRotation = useMemo(
    () => (rotation !== undefined ? rotation : Math.random() * 8 - 4),
    [rotation],
  );

  const hoverRotation = useMemo(
    () => (rotationhover !== undefined ? rotationhover : baseRotation + (1 + Math.random() * 2)),
    [rotationhover, baseRotation],
  );

  return (
    <Box
    >

      <Box
        component={Link}
        to={`/events/${event.id}`}
        sx={{
          aspectRatio: '1 / 1',
          transformOrigin: 'top center',
          transform: `rotate(${baseRotation}deg)`,
          display: 'block',
          textDecoration: 'none',
          position: 'relative',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: disableHover ? 'none' : `rotate(${hoverRotation}deg)`,
          },
        }}
      >
        <CategoricalBackground
          className="card-body"
          slug={categorySlug}
          showDecoration={false}
          sx={{
            bgcolor: '#fff',
            p: isNoImageCard ? '14px 12px 18px 12px' : '0px 0px 40px 12px',
            minHeight: isNoImageCard ? { xs: 300, sm: 320 } : 'auto',
            boxShadow: isFocused
              ? '0 20px 40px rgba(0,0,0,0.2), 0 10px 20px rgba(0,0,0,0.1)'
              : '0 10px 25px rgba(0,0,0,0.1), 0 5px 10px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb',
            transformOrigin: 'top center',
            transform: isFocused ? 'scale(1.1)' : 'scale(1)',
            position: 'relative',
            // overflow: isFocused ? 'visible' : 'hidden', // Allow poster elements to peek out if needed
            overflow: 'hidden',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {isNoImageCard && (
            <Box
              sx={{
                minHeight: { xs: 260, sm: 280 },
                border: '1px dashed rgba(0,0,0,0.14)',
                bgcolor: 'rgba(255,255,255,0.78)',
                p: 2.2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <Box
                aria-hidden
                sx={{
                  pointerEvents: 'none',
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 0,
                }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: theme.accent,
                    opacity: 0.14,
                    WebkitMaskImage: "url('/assets/go-symbol.png')",
                    maskImage: "url('/assets/go-symbol.png')",
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                  }}
                />
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 9,
                  height: 9,
                  bgcolor: '#f59e0b',
                  borderRadius: '50%',
                  boxShadow: '0 0 0 2px rgba(255,255,255,0.8), 0 1px 4px rgba(0,0,0,0.2)',
                }}
              />
              <Typography
                sx={{
                  fontFamily: '"Permanent Marker"',
                  fontSize: '1.25rem',
                  color: '#1a1a1a',
                  lineHeight: 1.2,
                  mt: 1.5,
                  mb: 2,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textAlign: 'center',
                }}
              >
                {event.title}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Typography
                    sx={{ fontSize: '0.82rem', color: '#555', fontFamily: 'serif', textAlign: 'center' }}
                  >
                    {isFocused
                      ? event.description || ''
                      : (event.description?.slice(0, 500) || '') + ((event.description?.length || 0) > 500 ? '...' : '')}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
                  >
                    <Calendar size={13} color="#555" />
                    <Typography
                      sx={{
                        fontSize: '0.82rem',
                        fontWeight: 'bolder',
                        color: '#555',
                        fontFamily: 'serif',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {relativeTime}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      minWidth: 0,
                      flex: 1,
                      display: 'flex',
                      justifyContent: 'flex-start',
                      overflow: 'hidden',
                    }}
                  >
                    <LocationTag
                      locationName={event.location_name}
                      locationAddress={event.location_address}
                      latitude={event.latitude}
                      longitude={event.longitude}
                      size={13}
                      color="#555"
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {!isNoImageCard && (
            <>
              <Box
                sx={{
                  aspectRatio: '1.85 / 1',
                  minHeight: 'auto',
                  overflow: 'hidden',
                  mb: 2,
                  position: 'relative',
                }}
              >
                <Box
                  className="polaroid-img"
                  sx={{
                    width: '100%',
                    height: '100%',
                    maxHeight: isFocused ? '400px' : 'auto',
                    objectFit: isFocused ? 'contain' : 'cover',
                    transition: 'all 0.5s ease',
                    transformOrigin: 'top center',
                  }}
                >
                  <PosterForEventCard
                    imageUrl={event?.cover_image || ''}
                    title={event.title}
                  />
                </Box>
              </Box>

              <Box sx={{ px: 0.5, pl: '12px' }}>
                <Typography
                  sx={{
                    fontFamily: '"Permanent Marker"',
                    fontSize: '1.1rem',
                    color: '#1a1a1a',
                    lineHeight: 1.2,
                    mb: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {event.title}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography
                    sx={{ fontSize: '0.75rem', color: '#666', fontFamily: 'serif' }}
                  >
                    {isFocused
                      ? event.description || ''
                      : (event.description?.slice(0, 160) || '') + ((event.description?.length || 0) > 160 ? '...' : '')}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
                  >
                    <Calendar size={12} color="#666" />
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 'bolder',
                        color: '#666',
                        fontFamily: 'serif',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {relativeTime}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      minWidth: 0,
                      flex: 1,
                      display: 'flex',
                      justifyContent: 'flex-end',
                      overflow: 'hidden',
                    }}
                  >
                    <LocationTag
                      locationName={event.location_name}
                      locationAddress={event.location_address}
                      latitude={event.latitude}
                      longitude={event.longitude}
                      size={12}
                      color="#666"
                    />
                  </Box>
                </Box>
              </Box>
            </>
          )}

          {/* Interest Heart */}
          <LikeButton
            eventId={event.id}
            initialIsInterested={event.user_is_interested}
            initialInterestCount={event.interest_count}
          />

          {/* Ticket Infographic */}
          <TicketStatusBadge
            ticketCount={event.ticket_count}
            capacity={event.capacity}
            highlighted={event.user_has_ticket}
            sx={{ position: 'absolute', top: 10, left: 55, zIndex: 2 }}
          />

          {/* Category "Sticker" */}
          {event.category && (
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                bgcolor: '#fff',
                color: '#1a1a1a',
                p: '4px 8px',
                borderRadius: '2px',
                boxShadow: '2px 2px 5px rgba(0,0,0,0.15)',
                transform: 'rotate(5deg)',
                zIndex: 2,
                border: '1px dashed #ccc',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {event.category.name}
              </Typography>
            </Box>
          )}

          {/* LIVE indicator as a badge or stamp */}
          {event.lifecycle_state === 'live' && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                bgcolor: '#ef4444',
                color: '#fff',
                p: '2px 8px',
                borderRadius: '4px',
                fontFamily: '"Permanent Marker"',
                fontSize: '0.8rem',
                transform: 'rotate(-5deg)',
                zIndex: 2,
                animation: 'pulse 2s infinite',
              }}
            >
              LIVE!
            </Box>
          )}

          {/* User Role Sticker */}
          {(isHost || isVendor) && (
            <Box
              sx={{
                position: 'absolute',
                bottom: event.lifecycle_state === 'live' ? 36 : 10,
                left: 10,
                bgcolor: isHost ? '#8b5cf6' : '#0eacacff', // Purple for host, Teal for vendor
                color: '#fff',
                p: '2px 8px',
                borderRadius: '2px',
                fontFamily: '"Permanent Marker"',
                fontSize: '0.7rem',
                transform: 'rotate(-3deg)',
                zIndex: 2,
                boxShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              {isHost ? 'YOU ARE HOSTING' : 'YOU ARE SERVICING'}
            </Box>
          )}

          {/* Bottom stickers based on status */}
          {event.lifecycle_state === 'event_ready' && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 15,
                right: -10,
                bgcolor: '#10b981',
                color: '#fff',
                p: '4px 15px 4px 10px',
                transform: 'rotate(-5deg)',
                boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
                zIndex: 2,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: -5,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 10,
                  height: 10,
                  bgcolor: 'inherit',
                  borderRadius: '50%',
                },
              }}
            >
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                FULL HOUSE!
              </Typography>
            </Box>
          )}

          {(event.lifecycle_state === 'published' ||
            event.lifecycle_state === 'live') && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 15,
                  right: -10,
                  bgcolor: '#fbbf24',
                  color: '#000',
                  p: '4px 15px 4px 10px',
                  transform: 'rotate(-10deg)',
                  boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
                  zIndex: 2,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: -5,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 10,
                    height: 10,
                    bgcolor: 'inherit',
                    borderRadius: '50%',
                    borderRight: '1px solid rgba(0,0,0,0.1)',
                  },
                }}
              >
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                  {price}
                </Typography>
              </Box>
            )}

          {event.lifecycle_state === 'completed' && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 15,
                right: -10,
                bgcolor: '#fff',
                color: '#ec4899',
                p: '4px 15px 4px 10px',
                transform: 'rotate(-15deg)',
                boxShadow: '2px 2px 8px rgba(0,0,0,0.15)',
                border: '2px solid #ec4899',
                borderRadius: '2px',
                zIndex: 2,
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                }}
              >
                ⭐ 4.9 RATED
              </Typography>
            </Box>
          )}

          {/* Pencil mark/sketch detail */}
          {
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                left: '20%',
                width: '30%',
                height: 2,
                bgcolor: 'rgba(0,0,0,0.05)',
                borderRadius: '1px',
                transform: 'rotate(-1deg)',
              }}
            />
          }
        </CategoricalBackground>
      </Box>
    </Box>
  );
};
