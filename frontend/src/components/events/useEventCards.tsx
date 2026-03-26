import { Avatar, Box, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { MapPin, Heart, ChevronLeft, Pencil } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { getCategoryTheme } from '@/features/events/CategoricalBackground';
import type { BaseFeedEventItem } from '@/types/events';
import { useAuth } from '@/features/auth/hooks';
import { useToggleInterest } from '@/features/events/hooks';

import { EventNeedsStack } from './EventNeedsStack';
import { formatTime } from '@/utils/date';
import { format } from 'date-fns';

export type EventCardEvent = BaseFeedEventItem;

interface UseEventCardsOptions {
  event: EventCardEvent;
  imageHeight: number;
  imageWidth?: number;
  layout?: 'stacked' | 'landscape';
}

export interface EventCardProps {
  sx?: SxProps<Theme>;
}

export function useEventCards({
  event,
  imageHeight,
  imageWidth,
  layout = 'stacked',
}: UseEventCardsOptions) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toggleInterest = useToggleInterest();
  const [isSaved, setIsSaved] = useState(event.user_is_interested || event.i_have_saved || false);

  useEffect(() => {
    setIsSaved(event.user_is_interested || event.i_have_saved || false);
  }, [event.user_is_interested, event.i_have_saved]);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const nextState = !isSaved;
    setIsSaved(nextState);

    try {
      await toggleInterest.mutateAsync({
        eventId: event.id,
        isInterested: nextState,
      });
    } catch (err) {
      setIsSaved(!nextState);
    }
  };

  const HeartButton = () => (
    <Box
      onClick={handleToggleSave}
      sx={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        cursor: 'pointer',
      }}
    >
      <motion.div
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        animate={{
          scale: isSaved ? [1, 1.4, 1] : 1,
        }}
        transition={{ duration: 0.4 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: '12px',
          background: isSaved ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          boxShadow: isSaved ? '0 8px 16px rgba(216, 90, 48, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.08)',
          border: isSaved
            ? '1px solid rgba(216, 90, 48, 0.2)'
            : '1px solid rgba(255, 255, 255, 0.5)',
        }}
      >
        <Heart
          size={20}
          fill={isSaved ? '#D85A30' : 'transparent'}
          color={isSaved ? '#D85A30' : '#D85A30'}
          strokeWidth={isSaved ? 0 : 2}
          style={{ transition: 'all 0.3s ease' }}
        />

        <AnimatePresence>
          {isSaved && (
            <Box sx={{ position: 'absolute', inset: 0 }}>
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                  animate={{
                    opacity: 0,
                    scale: 1,
                    x: (i % 2 === 0 ? 1 : -1) * (20 + Math.random() * 20),
                    y: -(20 + Math.random() * 20),
                    rotate: i % 2 === 0 ? 20 : -20,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    top: '25%',
                    left: '25%',
                    pointerEvents: 'none',
                  }}
                >
                  <Heart size={10} fill="#D85A30" color="transparent" />
                </motion.div>
              ))}
            </Box>
          )}
        </AnimatePresence>
      </motion.div>
    </Box>
  );

  const categoryTheme = getCategoryTheme(event.category ?? undefined);
  const isLandscape = layout === 'landscape';
  const resolvedImageWidth = imageWidth ?? imageHeight;
  const startDate = new Date(event.start_time);
  const isValidStartDate = !Number.isNaN(startDate.getTime());
  const dayLabel =
    'day' in event && event.day
      ? event.day
      : !isValidStartDate
        ? ''
        : startDate.getDate();
  const monthLabel =
    'month' in event && event.month
      ? event.month
      : !isValidStartDate
        ? ''
        : startDate.toLocaleString('en-US', { month: 'short' });
  const weekdayLabel = isValidStartDate
    ? startDate.toLocaleDateString('en-US', { weekday: 'short' })
    : '';
  const timeLabel = isValidStartDate
    ? format(startDate, 'h:mmaaaaa'):'';
  const parseTicketPrice = (value: string | number | null | undefined) => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  };
  const tierMinPrice = event.ticket_tiers?.reduce<number | null>((lowest, tier) => {
    const parsedPrice = parseTicketPrice(tier.price);
    if (parsedPrice === null) return lowest;
    if (lowest === null) return parsedPrice;
    return Math.min(lowest, parsedPrice);
  }, null);
  const resolvedTicketPrice =
    ('min_ticket_price' in event ? parseTicketPrice(event.min_ticket_price) : null) ??
    parseTicketPrice(event.ticket_price_standard) ??
    tierMinPrice;
  const isFree = resolvedTicketPrice === 0;

  const ImageFrame = () => (
    <>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '22px',
          background: 'rgba(255, 255, 255, 0.92)',
          zIndex: 0,
          '&::after': {
            content: '""',
            position: 'absolute',
            ...(isLandscape
              ? {
                top: '14%',
                right: -16,
                width: 18,
                height: '72%',
              }
              : {
                left: '50%',
                bottom: -16,
                transform: 'translateX(-50%)',
                width: '72%',
                height: 18,
              }),
            borderRadius: '999px',
            background: 'rgba(43, 33, 24, 0.18)',
            filter: `blur(${imageHeight / 10}px)`,
            pointerEvents: 'none',
          },
        }}
      />

      <Box
        sx={{
          width: isLandscape ? resolvedImageWidth : '100%',
          height: isLandscape ? '100%' : imageHeight,
          position: 'absolute',
          overflow: 'visible',
          zIndex: 2,
        }}
      >
        {event.cover_image ? (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              '&::after': {
                content: '""',
                position: 'absolute',
                ...(isLandscape
                  ? {
                    top: '12%',
                    right: -12,
                    width: 20,
                    height: '76%',
                  }
                  : {
                    left: '50%',
                    bottom: -14,
                    transform: 'translateX(-50%)',
                    width: '85%',
                    height: 20,
                  }),
                borderRadius: '999px',
                background: 'rgba(41, 30, 21, 0.2)',
                filter: 'blur(8px)',
                pointerEvents: 'none',
              },
            }}
          >
            <Box
              component="img"
              src={event.cover_image}
              alt={event.title}
              sx={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                borderRadius: isLandscape
                  ? '22px 18px 18px 22px'
                  : '22px 22px 20px 20px',
              }}
            />
          </Box>
        ) : null}
      </Box>
    </>
  );

  const DateAndLocationRow = () => (
    <Stack
      spacing={1}
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        minHeight: 0,
      }}
    >
      <Typography
        sx={{
          fontSize: 20,
          fontWeight: 700,
          textTransform: 'uppercase',
          color: 'rgba(66, 50, 28, 0.56)',
        }}
      >
        {dayLabel}
      </Typography>
      <Typography
        component="span"
        sx={{
          flexShrink: 0,
          fontSize: 12,
          color: 'rgba(66, 50, 28, 0.68)',
          fontWeight: 500,
        }}
      >
        {monthLabel}
      </Typography>

      <Typography
        component="span"
        sx={{
          flexShrink: 0,
          fontSize: 12,
          color: 'rgba(66, 50, 28, 0.68)',
          fontWeight: 500,
        }}
      >
        {timeLabel}
      </Typography>
    </Stack>
  );

  const DateAndLocation = () => (
    <Stack
      spacing={0}
      sx={{
        position: 'relative',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pt: 0.5,
        justifyContent: 'start',
      }}
    >
      <Typography
        sx={{
          fontSize: 23,
          fontWeight: 700,
          textTransform: 'uppercase',
          p:0,
          color: 'rgba(66, 50, 28, 0.56)',
        }}
      >
        {dayLabel}
      </Typography>
      <Typography
        component="span"
        sx={{
          flexShrink: 0,
          p:0,
          fontSize: 12,
          color: 'rgba(66, 50, 28, 0.68)',
          fontWeight: 500,
        }}
      >
        {monthLabel}
      </Typography>
      <Typography
        component="span"
        sx={{
          flexShrink: 0,
          p:0,
          fontSize: 12,
          color: 'rgba(66, 50, 28, 0.68)',
          fontWeight: 500,
        }}
      >
        {timeLabel}
      </Typography>
    </Stack>
  );

  const DateAndLocationFlat = () => (
    <Stack
      direction="row"
      spacing={0}
      sx={{
        position: 'relative',
        minHeight: 0,
      }}
    >
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          color: 'rgba(66, 50, 28, 0.56)',
          mr: 1,
        }}
      >
        {dayLabel}
      </Typography>
      <Typography
        component="span"
        sx={{
          flexShrink: 0,
          fontSize: 12,
          color: 'rgba(66, 50, 28, 0.68)',
          fontWeight: 500,
        }}
      >
        {monthLabel}
      </Typography>
    </Stack>
  );

  const Category = () => (
    <Typography
      sx={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        // backgroundColor: categoryTheme.tape,
        color: categoryTheme?.accent??'#121212',
        borderRadius: '40px',
      }}
    >
      {event.category?.name || 'Event'}
    </Typography>
  );

 // useEventCards.tsx — fix LocationStuff
// useEventCards.tsx — fix LocationStuff
const LocationStuff = () => (
  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0, overflow: 'hidden' }}>
    <MapPin size={12} color="rgba(66, 50, 28, 0.68)" style={{ flexShrink: 0 }} />
    <Typography
      component="span"
      sx={{
        fontSize: 12,
        color: 'rgba(66, 50, 28, 0.68)',
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
        flex: 1,
      }}
    >
      {event.location_name}
    </Typography>
  </Stack>
);

  const LifecycleStatus = () => {
    return event.lifecycle_state === 'draft' ? (
      <Box
        sx={{
          display: 'flex',
          px: 1,
          py: 0.55,
          borderRadius: '4px',
          background: 'rgba(255, 246, 224, 0.8)',
          color: '#666',
          fontWeight: 500,
        }}
      >
        {event.lifecycle_state}
      </Box>
      ) : event.lifecycle_state === 'published' ? (
        <Box
          sx={{
            display: 'flex',
            px: 1,
            py: 0.55,
            borderRadius: '4px',
            background:'rgba(216, 87, 0, 0.8)',
            color: '#ffffff',
            backdropFilter: 'blur(8px)',
          }}
        >
          Collecting Tickets
        </Box>
      )  : event.lifecycle_state === 'completed' ? (
        <Box
          sx={{
            display: 'flex',
            px: 1,
            py: 0.55,
            borderRadius: '4px',
            background:'rgba(255, 255, 255, 0.8)',
            color: '#aaaaaa',
            backdropFilter: 'blur(8px)',
          }}
        >
          Completed
        </Box>
      ) : <></>
  }

  const ManageButton = () => (

    <Typography
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/events/${event.id}/manage`);
    }}
    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 12, color: '#D85A30', fontWeight: 500, cursor: 'pointer' }}
  >
    Manage <Pencil size={14} style={{ paddingTop: 1, marginLeft: 2 }} />
  </Typography>
  );

  const Going = () => (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        <Avatar
          src={event.host.avatar || undefined}
          sx={{
            width: 18,
            height: 18,
            fontSize: 8,
            fontWeight: 700,
            bgcolor:categoryTheme?.accent??'#121212',
            color: '#fff',
          }}
        >
          {event.host.first_name?.[0] || event.host.username[0]}
        </Avatar>
        {Math.max(event.ticket_count, event.interest_count) > 0 ? (
          <Typography sx={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>
            +{Math.max(event.ticket_count, event.interest_count)}
          </Typography>
        ) : null}
      </Box>
  );

  const needsBackground =
    'linear-gradient(135deg, rgba(255, 235, 224, 0.96) 0%, rgba(255, 250, 205, 0.66) 100%)';

  const Needs = () => {
    const [needsOpen, setNeedsOpen] = React.useState(false);
    const [needsPanelHeight, setNeedsPanelHeight] = React.useState(0);
    const needsPanelRef = React.useRef<HTMLDivElement | null>(null);
    const needs = 'needs' in event ? event.needs : [];
    const categories = needs
      .filter((need) => !need.assigned_vendor)
      .map((need) =>
        need.category
          .split('_')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' '),
      )
      .filter(Boolean);
    const needsLabel =
      categories.length === 0
        ? 'contributors'
        : categories.length === 1
          ? categories[0]
          : categories.length === 2
            ? `${categories[0]} and ${categories[1]}`
            : `${categories[0]}, ${categories[1]}, and ${categories.length - 2} others`;

    React.useEffect(() => {
      if (!needsOpen) {
        setNeedsPanelHeight(0);
        return;
      }

      const panel = needsPanelRef.current;
      if (!panel) return;

      const syncHeight = () => setNeedsPanelHeight(panel.offsetHeight);

      syncHeight();

      if (typeof ResizeObserver === 'undefined') return;

      const observer = new ResizeObserver(() => {
        syncHeight();
      });

      observer.observe(panel);

      return () => {
        observer.disconnect();
      };
    }, [needsOpen]);

    if (!needs.length) return null;

    return (
      <>
        <Box sx={{ position: 'relative' }}>
          {needsOpen && (
            <Box
              ref={needsPanelRef}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: needsBackground,
                width: '100%',
                borderRadius: '16px',
                p: '7px 10px',
                display: 'flex',
                alignItems: 'flex-start',
                height: `auto`,
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: '0 12px 24px ' + categoryTheme.tape,
                backdropFilter: 'blur(8px)',
                animation: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                pt: 5,
              }}
            >
              {'needs' in event ? (
                <EventNeedsStack event={event} needs={needs} />
              ) : null}
            </Box>
          )}
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{
              position: 'absolute',
            }}
          >
            <Box
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setNeedsOpen((current) => !current);
              }}
              sx={{
                width: '100%',
                background: needsBackground,
                borderRadius: '16px',
                p: '7px 10px',
                display: 'flex',
                alignItems: 'flex-start',
              }}
            >
              <>
                {/* needs header */}
                <Typography sx={{ fontSize: 12, color: '#633806', mt: '1px' }}>
                  {/* ⚡ */}
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#633806', lineHeight: 1.4 }}>
                  {/* <Box component="span">Event </Box> */}
                  <Box component="span" sx={{ fontStyle: 'italic', fontWeight: 700 }}>
                    needs
                  </Box>
                  <Box component="span"> {needsLabel}</Box>
                </Typography>
              </>
            </Box>
            <Going />
          </Stack>
        </Box>

        {needsOpen ? (
          <Box
            sx={{
              height: needsPanelHeight,
              pointerEvents: 'none',
            }}
          />
        ) : (
          <Box
            sx={{
              height: '40px',
              pointerEvents: 'none',
            }}
          />
        )}
      </>
    );
  };
  const Description = () => (
    <Typography
      component="span"
      sx={{
        minWidth: 0,
        flex: 1,
        px: 1,
        pb: 0.5,
        fontSize: 12,
        color: 'rgba(74, 59, 37, 0.69)',
        fontWeight: 500,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {event.description}
    </Typography>
  );

  const getCardSx = (sx?: SxProps<Theme>): SxProps<Theme> => [
    {
      borderRadius: '22px',
      overflow: 'hidden',
      cursor: 'pointer',
      textDecoration: 'none',
      color: 'inherit',
      display: 'block',
      width: '100%',
      minWidth: 250,
      position: 'relative',
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  const getContentSx = (extra?: SxProps<Theme>): SxProps<Theme> => [
    {
      position: 'relative',
      pt: isLandscape ? 1 : `calc(${imageHeight}px + 8px)`,
      pl: isLandscape ? `calc(${resolvedImageWidth}px + 8px)` : 1,
      zIndex: 1,
      borderRadius: '22px',
      borderLeft: `3px solid ${categoryTheme?.accent??'#121212'}`,
      minWidth: 0,
    },
    ...(Array.isArray(extra) ? extra : extra ? [extra] : []),
  ];

  return {
    ImageFrame,
    DateAndLocation,
    DateAndLocationFlat,
    Category,
    LocationStuff,
    Going,
    Needs,
    Description,
    isFree,
    ManageButton,
    weekdayLabel,
    timeLabel,
    DateAndLocationRow,
    LifecycleStatus,
    getCardSx,
    getContentSx,
    HeartButton,
    isSaved,
  };
}
