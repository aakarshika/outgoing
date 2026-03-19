import { Avatar, Box, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { MapPin } from 'lucide-react';
import React from 'react';

import { getCategoryTheme } from '@/features/events/CategoricalBackground';
import type { BaseFeedEventItem } from '@/types/events';

import { EventNeedsStack } from './EventNeedsStack';

export type EventCardEvent = BaseFeedEventItem ;

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
    ? startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';
  const subtitle =
    'subtitle' in event && event.subtitle ? event.subtitle : event.location_name;
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

  const DateAndLocation = () => (
    <Stack
      spacing={0}
      sx={{
        position: 'relative',
        minHeight: 0,
        py: 4,
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
        color: categoryTheme.accent,
        borderRadius: '40px',
      }}
    >
      {event.category?.name || 'Event'}
    </Typography>
  );

  const LocationStuff = () => (
    <>
      <MapPin size={12} color="rgba(66, 50, 28, 0.68)" />
      <Box
        sx={{
          mt: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          minWidth: 0,
        }}
      >
        <Typography
          component="span"
          sx={{
            minWidth: 0,
            flex: 1,
            fontSize: 12,
            color: 'rgba(66, 50, 28, 0.68)',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {subtitle}
        </Typography>
      </Box>
    </>
  );

  const Going = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Avatar
          src={event.host.avatar || undefined}
          sx={{
            width: 18,
            height: 18,
            fontSize: 8,
            fontWeight: 700,
            bgcolor: categoryTheme.accent,
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
      overflow: 'visible',
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
      p: 1,
      pt: isLandscape ? 1 : `calc(${imageHeight}px + 8px)`,
      pl: isLandscape ? `calc(${resolvedImageWidth}px + 8px)` : 1,
      zIndex: 1,
      borderRadius: '22px',
      borderLeft: `3px solid ${categoryTheme.accent}`,
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
    weekdayLabel,
    timeLabel,
    getCardSx,
    getContentSx,
  };
}
