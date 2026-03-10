import { Box, Typography } from '@mui/material';
import { Calendar } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Media } from '@/components/ui/media';
import { useAuth } from '@/features/auth/hooks';
import { PosterForEventCard } from '@/pages/events/components/PosterForEventCard';
import { formatEventRelativeTime } from '@/utils/dateUtils';

import {
  CategoricalBackground,
  getCategoryTheme,
} from './CategoricalBackground';
import { LikeButton } from './LikeButton';
import { LocationTag } from './LocationTag';
import {
  CategorySticker,
  CategoryStickerCompact,
  CompletedRatedBadge,
  formatEventPrice,
  FullHouseBadge,
  getEventCardRoles,
  HostVendorBadge,
  LiveBadge,
  NoImagePlaceholder,
  PriceBadge,
} from './scrapbookCard';
import { TicketStatusBadge } from './TicketStatusBadge';

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
  const { isHost, isVendor } = getEventCardRoles(event, {
    user: user ?? null,
    isAuthenticated,
  });

  const theme = getCategoryTheme(event.category ?? undefined);
  const relativeTime = formatEventRelativeTime(event.start_time);
  const price = formatEventPrice(event.ticket_price_standard);
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
    () =>
      rotationhover !== undefined
        ? rotationhover
        : baseRotation + (1 + Math.random() * 2),
    [rotationhover, baseRotation],
  );

  return (
    <Box>
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
          category={event.category}
          showDecoration={false}
          sx={{
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
                  zIndex: 0,
                }}
              >
                <NoImagePlaceholder theme={theme} size="md" iconOnly />
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
                  boxShadow:
                    '0 0 0 2px rgba(255,255,255,0.8), 0 1px 4px rgba(0,0,0,0.2)',
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
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.82rem',
                      color: '#555',
                      fontFamily: 'serif',
                      textAlign: 'center',
                    }}
                  >
                    {isFocused
                      ? event.description || ''
                      : (event.description?.slice(0, 500) || '') +
                        ((event.description?.length || 0) > 500 ? '...' : '')}
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
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flexShrink: 0,
                    }}
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
                      : (event.description?.slice(0, 160) || '') +
                        ((event.description?.length || 0) > 160 ? '...' : '')}
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
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flexShrink: 0,
                    }}
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

          {event.category && (
            <CategorySticker
              categoryName={event.category.name!}
              theme={theme}
            />
          )}

          {event.lifecycle_state === 'live' && <LiveBadge />}

          {(isHost || isVendor) && (
            <HostVendorBadge
              isHost={isHost}
              variant="full"
              bottomOffset={event.lifecycle_state === 'live' ? 36 : 10}
            />
          )}

          {event.lifecycle_state === 'event_ready' && <FullHouseBadge />}

          {(event.lifecycle_state === 'published' ||
            event.lifecycle_state === 'live') && (
            <PriceBadge price={price} variant="portrait" />
          )}

          {event.lifecycle_state === 'completed' && <CompletedRatedBadge />}

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

/** Landscape list card: full-width row, image left, content right. Use in lists. */
export const ScrapbookEventCardLandscape = ({
  event,
  isFocused,
}: {
  event: EventListItem;
  isFocused?: boolean;
}) => {
  const { user, isAuthenticated } = useAuth();
  const { isHost, isVendor } = getEventCardRoles(event, {
    user: user ?? null,
    isAuthenticated,
  });

  const theme = getCategoryTheme(event.category ?? undefined);
  const relativeTime = formatEventRelativeTime(event.start_time);
  const price = formatEventPrice(event.ticket_price_standard);
  const isNoImageCard = !event.cover_image;

  return (
    <Box
      component={Link}
      to={`/events/${event.id}`}
      sx={{
        display: 'flex',
        width: '100%',
        minHeight: { xs: 120, sm: 140 },
        maxHeight: { xs: 160, sm: 200 },
        textDecoration: 'none',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 1,
        border: '1px solid #e5e7eb',
        boxShadow: isFocused
          ? '0 12px 28px rgba(0,0,0,0.15), 0 6px 12px rgba(0,0,0,0.08)'
          : '0 6px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.3s ease, transform 0.2s ease',
        '&:hover': {
          boxShadow: '0 12px 28px rgba(0,0,0,0.12), 0 6px 12px rgba(0,0,0,0.06)',
        },
      }}
    >
      {/* Image strip (left) */}
      <Box
        sx={{
          width: { xs: 140, sm: 200 },
          minWidth: { xs: 140, sm: 200 },
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          bgcolor: theme.bg,
          alignSelf: 'stretch',
        }}
      >
        {isNoImageCard ? (
          <NoImagePlaceholder theme={theme} size="sm" />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              inset: 0,
              '& img': { objectFit: 'cover', width: '100%', height: '100%' },
            }}
          >
            <Media
              src={event.cover_image || ''}
              alt={event.title}
            />
          </Box>
        )}
      </Box>

      {/* Content (right) */}
      <CategoricalBackground
        category={event.category}
        showDecoration={false}
        sx={{
          flex: 1,
          minWidth: 0,
          p: 1.5,
          pr: 3,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {event.category && (
          <CategoryStickerCompact
            categoryName={event.category.name!}
            theme={theme}
          />
        )}

        <Typography
          sx={{
            fontFamily: '"Permanent Marker"',
            fontSize: { xs: '1rem', sm: '1.15rem' },
            color: '#1a1a1a',
            lineHeight: 1.2,
            mb: 0.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            pr: 4,
          }}
        >
          {event.title}
        </Typography>

        <Typography
          sx={{
            fontSize: '0.75rem',
            color: '#555',
            fontFamily: 'serif',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 0.75,
          }}
        >
          {event.description?.slice(0, 120) || ''}
          {(event.description?.length || 0) > 120 ? '...' : ''}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Calendar size={12} color="#666" />
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 'bolder',
                color: '#666',
                fontFamily: 'serif',
                whiteSpace: 'nowrap',
              }}
            >
              {relativeTime}
            </Typography>
          </Box>
          <LocationTag
            locationName={event.location_name}
            locationAddress={event.location_address}
            latitude={event.latitude}
            longitude={event.longitude}
            size={12}
            color="#666"
          />
        </Box>

        <LikeButton
          eventId={event.id}
          initialIsInterested={event.user_is_interested}
          initialInterestCount={event.interest_count}
        />

        <TicketStatusBadge
          ticketCount={event.ticket_count}
          capacity={event.capacity}
          highlighted={event.user_has_ticket}
          sx={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}
        />

        {event.lifecycle_state === 'live' && (
          <LiveBadge compact sx={{ bottom: 8, left: 8 }} />
        )}

        {(isHost || isVendor) && (
          <HostVendorBadge
            isHost={isHost}
            variant="short"
            bottomOffset={8}
            sx={{ left: event.lifecycle_state === 'live' ? 52 : 8 }}
          />
        )}

        {(event.lifecycle_state === 'published' ||
          event.lifecycle_state === 'live') && (
          <PriceBadge price={price} variant="landscape" />
        )}
      </CategoricalBackground>
    </Box>
  );
};
