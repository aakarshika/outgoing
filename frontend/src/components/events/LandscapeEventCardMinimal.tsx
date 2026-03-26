import { Box, Chip, Stack, Typography } from '@mui/material';
import { type MouseEvent, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks';
import { getEventCardRoles, HostVendorBadge } from '@/features/events/scrapbookCard';
import { useEventCards } from './useEventCards';
import type { EventCardEvent, EventCardProps } from './useEventCards';

const IMAGE_HEIGHT = 90;
const IMAGE_WIDTH = 80;

export function LandscapeEventCardMinimal({
  showNeeds = true,
  event,
  sx,
}: { showNeeds?: boolean } & EventCardProps & { event: EventCardEvent }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isHost, isVendor } = getEventCardRoles(event, {
    user: user ?? null,
    isAuthenticated,
  });
  const isLive = event.lifecycle_state === 'live';
  const {
    ImageFrameTiny,
    Category,
    Needs,
    Description,
    LocationStuff,
    DateAndLocationFlat,
    Going,
    getCardSx,
    getContentSx,
  } = useEventCards({
    event,
    imageHeight: IMAGE_HEIGHT,
    imageWidth: IMAGE_WIDTH,
    layout: 'landscape',
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
      onClick={handleCardClick}
      sx={getCardSx([
        {
            borderRadius: '0px',
          minWidth: 0,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ])}
    >


      <Stack
        spacing={1}
        sx={getContentSx({
          background: 'rgba(255,255,255,0.94)',
          overflow: 'visible',
          borderRadius: '0px',
          p: 0,
          m: 0,
        })}
      >
        <Stack direction="column">
          <Stack
            direction="row"
            sx={{
              minHeight: IMAGE_HEIGHT,
              alignItems: 'stretch',
              height: '100%',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: IMAGE_WIDTH,
                minWidth: IMAGE_WIDTH,
                height: IMAGE_HEIGHT,
              }}
            >
              <ImageFrameTiny />
            </Box>

            <Stack
              sx={{ flex: 1, pl: 2, minWidth: 0, 
                height: IMAGE_HEIGHT, 
                justifyContent: 'center',
                alignItems: 'center',
                display: 'flex',
                flexDirection: 'column', }}
            >
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 15,
                  fontWeight: 700,
                  py: 0.5,
                  height: '100%',
                  letterSpacing: '-0.03em',
                  color: '#2B2118',
                  overflow: 'hidden',
                  justifyContent: 'center',
                  alignItems: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {event.title}
              </Typography>

            </Stack>
          </Stack>
        </Stack>
      </Stack>

    </Box>
  );
}
