import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

import { CategoricalBackground } from './CategoricalBackground';
import { LikeButton } from './LikeButton';
import {
  CategorySticker,
  CompletedRatedBadge,
  FullHouseBadge,
  HostVendorBadge,
  LiveBadge,
  PriceBadge,
} from './scrapbookCard';
import { TicketStatusBadge } from './TicketStatusBadge';
import { EventUIProvider, MainInfoCard, MainInfoCardImage, ScrapbookEventData, useEventUIData } from './EventItemUIComponents';
import { LightThemeConferencePoster } from './LightThemeConferencePoster';

const isOnlineLike = (event: ScrapbookEventData) => {
  const hay = `${event.location_name ?? ''} ${event.location_address ?? ''}`.toLowerCase();
  return /(online|virtual|webinar|zoom|google meet|meet\.google|teams|livestream|stream)/.test(hay);
};

const OnlineInvitationLayout = ({
  event,
  theme,
  price,
  isHost,
  isVendor,
}: {
  event: ScrapbookEventData;
  theme: { bg: string; accent: string };
  price: string;
  isHost: boolean;
  isVendor: boolean;
}) => {
  const showPrice = event.lifecycle_state === 'published' || event.lifecycle_state === 'live';

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'relative', p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Top “invitation” header row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: '0.72rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: 800,
                color: '#0f172a',
                whiteSpace: 'nowrap',
              }}
            >
              Online invitation
            </Typography>

            {event.category?.name ? (
              <CategorySticker
                categoryName={event.category.name}
                theme={theme}
                sx={{
                  position: 'static',
                  transform: 'none',
                  boxShadow: 'none',
                  bgcolor: 'rgba(255,255,255,0.75)',
                  borderRadius: 999,
                  border: '1px solid rgba(148,163,184,0.35)',
                }}
              />
            ) : null}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TicketStatusBadge
              ticketCount={event.ticket_count}
              capacity={event.capacity}
              highlighted={event.user_has_ticket}
              sx={{ transform: 'none' }}
            />

            <LikeButton
              eventId={event.id}
              initialIsInterested={event.user_is_interested}
              initialInterestCount={event.interest_count}
              className="flex items-center gap-1 rounded-full bg-white/70 backdrop-blur-sm px-2 py-1 transition-all hover:bg-white shadow-sm"
            />
          </Box>
        </Box>

        {/* Main body */}
        <Box sx={{
          mt: 1.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.25,

        }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              alignItems: 'stretch',
              minHeight: 0,
            }}
          >
            {/* Poster / placeholder */}
            <Box
              sx={{
                width: '44%',
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid rgba(148,163,184,0.30)',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(16,185,129,0.12))',
              }}
            >
              <Box sx={{ position: 'absolute', inset: 0, opacity: 0.9 }}>
                <MainInfoCardImage />
              </Box>
            </Box>

            {/* Text “invite” content */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                px: 0.5,
                bgcolor: 'transparent',
                // Subtle invitation “sheet” without feeling like a heavy card
                backdropFilter: 'blur(10px)',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.0) 100%)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: `
            radial-gradient(600px 240px at 15% 10%, ${theme.bg} 0%, rgba(255,255,255,0) 60%),
            radial-gradient(500px 220px at 90% 25%, rgba(34,197,94,0.2) 0%, rgba(255,255,255,0) 60%),
            linear-gradient(90deg, rgba(148,163,184,0.2) 1px, transparent 1px),
            linear-gradient(rgba(148,163,184,0.2) 1px, transparent 1px)
          `,
                  backgroundSize: 'auto, auto, 18px 18px, 18px 18px',
                  opacity: 0.55,
                  pointerEvents: 'none',
                },
                p: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '1.05rem', sm: '1.15rem' },
                  fontWeight: 900,
                  lineHeight: 1.15,
                  color: '#0f172a',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {event.title}
              </Typography>

              {event.description ? (
                <Typography
                  sx={{
                    mt: 0.75,
                    fontSize: '0.82rem',
                    color: 'rgba(15, 23, 42, 0.75)',
                    lineHeight: 1.35,
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {event.description}
                </Typography>
              ) : null}

              {event.host?.username ? (
                <Typography
                  sx={{
                    mt: 0.9,
                    fontSize: '0.75rem',
                    color: 'rgba(15, 23, 42, 0.70)',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Hosted by <Box component="span" sx={{ fontWeight: 800, color: '#0f172a' }}>@{event.host.username}</Box>
                </Typography>
              ) : null}
            </Box>
          </Box>

          {/* Footer “details” row */}
          <Box
            sx={{
              mt: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              p: 1,
              borderRadius: 2,
              border: '1px solid rgba(148,163,184,0.28)',
              bgcolor: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Reuse existing time/location rendering via no-image card content, but keep it lightweight */}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <MainInfoCard />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {event.lifecycle_state === 'live' ? (
                <LiveBadge compact sx={{ position: 'static', transform: 'none', animation: 'none' }} />
              ) : null}

              {(isHost || isVendor) ? (
                <HostVendorBadge
                  isHost={isHost}
                  variant="short"
                  bottomOffset={0}
                  sx={{ position: 'static', transform: 'none', boxShadow: 'none' }}
                />
              ) : null}

              {event.lifecycle_state === 'event_ready' ? (
                <FullHouseBadge sx={{ position: 'static', transform: 'none', boxShadow: 'none' }} />
              ) : null}

              {showPrice ? (
                <PriceBadge price={price} variant="landscape" sx={{ position: 'static' }} />
              ) : null}

              {event.lifecycle_state === 'completed' ? (
                <CompletedRatedBadge sx={{ position: 'static', transform: 'none' }} />
              ) : null}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export const ScrapbookEventCard = ({
  event,
  isFocused,
  showClip = false,
  rotation,
  rotationhover,
  disableHover,
  isBasicEventCard = false,
}: {
  event: ScrapbookEventData;
  isFocused?: boolean;
  showClip?: boolean;
  rotation?: number;
  rotationhover?: number;
  disableHover?: boolean;
  isBasicEventCard?: boolean;
}) => {


  const { baseRotation,
    hoverRotation,
    isNoImageCard,
    theme,
    isHost,
    isVendor,
    price } =
    useEventUIData({
      event,
      isFocused,
      showClip,
      rotation,
      rotationhover,
      disableHover,
      isBasicEventCard
    });

  const isOnlineEvent = isOnlineLike(event);

  return (
    <EventUIProvider
      event={event}
      isFocused={isFocused}
      showClip={showClip}
      rotation={rotation}
      rotationhover={rotationhover}
      disableHover={disableHover}
      isBasicEventCard={isBasicEventCard}
    >
      <Box>
        <Box
          component={Link}
          to={`/events/${event.id}`}
          sx={{
            aspectRatio: '1 / 1',

            transformOrigin: 'top center',

            transform: isOnlineEvent ? 'none' : `rotate(${baseRotation}deg)`,

            display: 'block',
            textDecoration: 'none',
            position: 'relative',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: isOnlineEvent ? 'none' : (disableHover ? 'none' : `rotate(${hoverRotation}deg)`),
            },
          }}
        >
          {isOnlineEvent ? (
            <LightThemeConferencePoster event={event} />
          ) : (
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
                <MainInfoCard />
              )}

              {!isNoImageCard && (
                <MainInfoCardImage />
              )}

              {(!isBasicEventCard) && (<>
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
                  <CategorySticker categoryName={event.category.name!} theme={theme} />
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
              </>)}
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
          )}
        </Box>
      </Box>
    </EventUIProvider>
  );
};

