import { Box, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks';
import { getEventCardRoles, HostVendorBadge } from '@/features/events/scrapbookCard';
import { useEventCards } from './useEventCards';
import type { EventCardEvent, EventCardProps } from './useEventCards';
import { ChevronLeft, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const IMAGE_HEIGHT = 130;

export function SmallEventCard({
  event,
  sx,
}: EventCardProps & { event: EventCardEvent }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
    getCardSx,
    getContentSx,
    HeartButton,
    isSaved,
  } = useEventCards({
    event,
    imageHeight: IMAGE_HEIGHT,
  });

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
      sx={getCardSx([{ mb: IMAGE_HEIGHT / 30 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])])}
    >
      <Box
        component={Link}
        to={`/events-new/${event.id}`}
        sx={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%', height: '100%' }}
      >
        <ImageFrame />
      </Box>

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

      {(isHost || isVendor) && !location.pathname.includes('/managing') ? (
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
      <Stack
        spacing={1.1}
        sx={getContentSx({ backgroundColor: '#fff' })}
      >

        <Stack
          direction="row"
          spacing={0.7}
          sx={{
            minHeight: 0,
            p: 1,
            alignItems: 'flex-start',
          }}
        >

          <DateAndLocation />
          <Stack
            spacing={0.7}
            sx={{
              position: 'relative',
              minHeight: 0,
              p: 1,
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
            </Stack>

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
              spacing={0.75}
            >
              <Stack
                direction="row"
                alignItems="center"
              >
                <LocationStuff />
              </Stack>
              <Going />
            </Stack>


            {isHost && location.pathname.includes('/managing') && (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={0.75}
                fontSize={11}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                >
                  <ChevronLeft size={11} /> Preview
                </Stack>
                <Box
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(`/events/${event.id}/manage`);
                  }}
                  sx={{
                    display: 'flex',
                    px: 1,
                    py: 0.55,
                    borderRadius: '4px',
                    background:
                      'linear-gradient(135deg, rgba(23, 1, 149, 0.96) 0%, rgba(124, 58, 237, 0.96) 100%)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 12px 24px rgba(124, 58, 237, 0.22)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Pencil size={11} style={{ paddingTop: 1 }} /> Manage
                </Box>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
