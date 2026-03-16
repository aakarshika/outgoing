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
import {
  EventUIProvider,
  MainInfoCard,
  MainInfoCardImage,
  ScrapbookEventData,
  useEventUIData,
} from './EventItemUIComponents';
import { LightThemeConferencePoster } from './LightThemeConferencePoster';

const isOnlineLike = (event: ScrapbookEventData) => {
  const hay =
    `${event.location_name ?? ''} ${event.location_address ?? ''}`.toLowerCase();
  return /(online|virtual|webinar|zoom|google meet|meet\.google|teams|livestream|stream)/.test(
    hay,
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
  const { baseRotation, hoverRotation, isNoImageCard, theme, isHost, isVendor, price } =
    useEventUIData({
      event,
      isFocused,
      showClip,
      rotation,
      rotationhover,
      disableHover,
      isBasicEventCard,
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
              transform: isOnlineEvent
                ? 'none'
                : disableHover
                  ? 'none'
                  : `rotate(${hoverRotation}deg)`,
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
              {isNoImageCard && <MainInfoCard />}

              {!isNoImageCard && <MainInfoCardImage />}

              {!isBasicEventCard && (
                <>
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
                </>
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
          )}
        </Box>
      </Box>
    </EventUIProvider>
  );
};
