import { Box, Stack, Typography } from '@mui/material';
import { type MouseEvent, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks';
import { HostStatusBadge } from '@/features/events/EventStatusBadge';
import { getEventCardRoles, HostVendorBadge } from '@/features/events/scrapbookCard';

import type { EventCardEvent, EventCardProps } from './useEventCards';
import { useEventCards } from './useEventCards';
import { BaseFeedEventItem } from '@/types/events';
import { MapPin } from 'lucide-react';

import { motion } from 'framer-motion';

const IMAGE_HEIGHT = 180;

export function LargeEventCard({
  showNeeds = true,
  event,
  sx,
}: { showNeeds?: boolean } & EventCardProps & { event: BaseFeedEventItem }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isHost, isVendor } = getEventCardRoles(event, {
    user: user ?? null,
    isAuthenticated,
  });
  const isLive = event.lifecycle_state === 'live';
  const {
    ImageFrame,
    DateAndLocation,
    Category,
    LocationStuff,
    Going,
    Needs,
    Description,
    isFree,
    weekdayLabel,
    timeLabel,
    getCardSx,
    getContentSx,
    HeartButton,
    isSaved,
  } = useEventCards({
    event,
    imageHeight: IMAGE_HEIGHT,
  });

  const handleCardClick = useCallback(
    (clickEvent: MouseEvent<HTMLElement>) => {
      if (clickEvent.defaultPrevented) return;
      const target = clickEvent.target as HTMLElement | null;
      if (
        target?.closest(
          'button, a, input, textarea, select, [role="button"], [data-card-action="true"]',
        )
      ) {
        return;
      }

      navigate(`/events-new/${event.id}`);
    },
    [event.id, navigate],
  );

  return (
    <Box
      component={motion.div}
      layout
      initial={false}
      animate={{ 
        scale: isSaved ? [1, 1.03, 1] : 1,
        boxShadow: isSaved 
          ? '0 20px 40px rgba(216, 90, 48, 0.12)' 
          : '0 10px 30px rgba(43, 33, 24, 0.04)'
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={handleCardClick}
      sx={getCardSx([{ mb: 2.5 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])])}
    >
      <ImageFrame />
      <HeartButton />
      {isLive ? (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.7,
            px: 1,
            py: 0.55,
            borderRadius: '999px',
            background:
              'linear-gradient(135deg, rgba(255, 94, 98, 0.96) 0%, rgba(124, 58, 237, 0.96) 100%)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            boxShadow: '0 12px 24px rgba(124, 58, 237, 0.22)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#fff',
              boxShadow: '0 0 0 4px rgba(255,255,255,0.16)',
            }}
          />
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            Live Now
          </Typography>
        </Box>
      ) : null}

      {isHost || isVendor ? (
        <HostVendorBadge
          isHost={isHost}
          variant="short"
          sx={{
            left: 10,
            top: 35,
            zIndex: 2,
            boxShadow: '0 8px 18px rgba(43, 33, 24, 0.18)',
            height: 20,
          }}
        />
      ) : null}
      <Stack spacing={1} className="bg-white" sx={getContentSx()}>
        <Stack
          direction="row"
          spacing={0.3}
          sx={{
            minHeight: 0,
              pt: 1.5,
              px: 1,
            alignItems: 'flex-start',
          }}
        >
          <DateAndLocation />
          <Stack
            sx={{
              position: 'relative',
              minHeight: 0,
              px: 1,
              flex: 1,
              minWidth: 0,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
            >
              <Category />
              <Going />
              
            </Stack>

            {(
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.6}
                sx={{
                  minWidth: 0,
                  py: 0.5,
                  flexWrap: 'wrap',
                  color: 'rgba(66, 50, 28, 0.72)',
                }}
              >
                {isFree ? (
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#2f7d32',
                    }}
                  >
                    Free
                  </Typography>
                ) : <Typography
                component="span"
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#2f7d32',
                }}
              >
                ₹{event?.min_ticket_price?.toFixed(0)}
              </Typography>}
                {(event.distance_km || event.location_name) ? (
                  <Typography component="span" sx={{
                    display: 'inline-flex',
                    gap: 0.3,
                    alignItems: 'center', fontSize: 12, fontWeight: 600
                  }}>
                    <MapPin size={10} /> {event.location_name}  {event.distance_km && ` · ${event.distance_km?.toFixed(1)} km`}
                  </Typography>
                ) : null}
              </Stack>
            )}

            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 15,
                fontWeight: 700,
                lineHeight: 1.3,
                color: '#000000',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
              }}
            >
              {event.title}
            </Typography>

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.7}
                sx={{ minWidth: 0 }}
              >
              </Stack>
            </Stack>
          </Stack>
        </Stack>
        <Description />

        {showNeeds && <Needs />}
      </Stack>
    </Box>
  );
}
