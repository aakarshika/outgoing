/** Redesigned Hero Carousel — Bedroom "Fairy Lights" aesthetic with infinite rotation, focus, and WAVY string. */

import { Avatar, Box, IconButton, Paper, Rating, Typography } from '@mui/material';
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { HostCard } from '@/components/ui/HostCard';
import { Media } from '@/components/ui/media';
import { PostItNote } from '@/components/ui/PostItNote';
import { useAuth } from '@/features/auth/hooks';
import type { EventListItem } from '@/types/events';

import { PlatformDescriptionCard } from './cards/PlatformDescriptionCard';
import { StarCutoutCard } from './cards/StarCutoutCard';
import { UserActionCard } from './cards/UserActionCard';
import { CATEGORY_THEMES } from './CategoricalBackground';
import { useCarouselEvents, useToggleInterest } from './hooks';

export type MixedCarouselItem =
  | { type: 'event'; data: EventListItem }
  | { type: 'custom'; index: number };

// --- Styled Components / Decorations ---

// A segment of the string for one card slot
const StringSegment = ({ index }: { index: number }) => {
  // We base the segment width on the card space (approx 25vw + 16vw gap for md)
  const segmentWidth = 450;
  const offset = index * segmentWidth;
  const waveDepth = 25;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 65,
        left: offset,
        width: segmentWidth,
        height: 100,
        zIndex: 5,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        <path
          d={`M 0 40 Q ${segmentWidth / 2} ${40 + waveDepth * 1.5} ${segmentWidth} 40`}
          stroke="#d2b48c"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' }}
        />
        {/* Fairy Lights on this segment */}
        <FairyLightSVG x={segmentWidth * 0.1} y={40} delay={index * 0.5} />
        <FairyLightSVG x={segmentWidth * 0.3} y={55} delay={index * 0.7} />
        <FairyLightSVG x={segmentWidth * 0.5} y={65} delay={index * 0.3} />
        <FairyLightSVG x={segmentWidth * 0.7} y={55} delay={index * 0.9} />
        <FairyLightSVG x={segmentWidth * 0.9} y={40} delay={index * 0.4} />
      </svg>
    </Box>
  );
};

const FairyLightSVG = ({ x, y, delay }: { x: number; y: number; delay: number }) => {
  const duration = 2 + ((x + y) % 20) / 10;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle
        r="6"
        fill="#fff7a1"
        style={{
          animationName: 'blink',
          animationDuration: `${duration}s`,
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDelay: `${delay}s`,
          filter: 'drop-shadow(0 0 5px #fff7a1)',
        }}
      />
      <circle
        r="10"
        fill="transparent"
        stroke="#ffcc00"
        strokeWidth="0.5"
        opacity="0.3"
      />
    </g>
  );
};

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
      zIndex: 40, // Above everything including the string
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

// --- Carousel Card ---

const EventTapeCard = ({
  event,
  isFocused,
  index,
}: {
  event: EventListItem;
  isFocused: boolean;
  index: number;
}) => {
  const rotation = useMemo(
    () => (index % 2 === 0 ? 1 : -1) * (1 + Math.random() * 2),
    [index],
  );
  const { isAuthenticated } = useAuth();
  const toggleInterest = useToggleInterest();
  const highlightImages =
    event.media?.filter(
      (media) => media.category === 'highlight' && media.media_type === 'image',
    ) || [];
  const isNoImageCard = !event.cover_image && highlightImages.length === 0;
  const categorySlug =
    event.category?.slug ||
    event.category?.name
      ?.toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ||
    '';
  const noImageTheme = CATEGORY_THEMES[categorySlug] || {
    bg: '#f8fafc',
    pattern:
      'linear-gradient(rgba(71, 85, 105, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(71, 85, 105, 0.08) 1px, transparent 1px)',
    accent: '#475569',
    tape: 'rgba(71, 85, 105, 0.25)',
    icon: 'pin',
  };
  const formattedDate = new Date(event.start_time).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = new Date(event.start_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleInterestClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    toggleInterest.mutate({
      eventId: event.id,
      isInterested: event.user_is_interested || false,
    });
  };

  if (isNoImageCard) {
    return (
      <Paper
        elevation={isFocused ? 12 : 4}
        component={Link}
        to={`/events/${event.id}`}
        sx={{
          flex: '0 0 auto',
          width: { xs: 280, sm: 350 },
          height: 520,
          mx: { xs: '20px', sm: '50px' },
          mt: isFocused ? 14 : 8,
          p: 2,
          textDecoration: 'none',
          color: 'inherit',
          transform: isFocused
            ? `rotate(0deg) scale(1.15)`
            : `rotate(${rotation}deg) scale(0.95)`,
          zIndex: isFocused ? 30 : 20,
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          scrollSnapAlign: 'center',
          opacity: isFocused ? 1 : 0.8,
          filter: isFocused ? 'none' : 'grayscale(20%)',
          backgroundColor: noImageTheme.bg,
          backgroundImage: noImageTheme.pattern,
          backgroundSize: '20px 20px',
          border: '1px solid',
          borderColor: `${noImageTheme.accent}44`,
          '&:hover': {
            transform: isFocused
              ? `rotate(0deg) scale(1.18)`
              : `rotate(0deg) scale(1.02)`,
            zIndex: 35,
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            filter: 'none',
            opacity: 1,
          },
        }}
      >
        <PhotoClip />
        <Box
          sx={{
            flexGrow: 1,
            p: 3,
            border: '1px dashed rgba(0,0,0,0.14)',
            bgcolor: 'rgba(255,255,255,0.78)',
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
                width: 140,
                height: 140,
                bgcolor: noImageTheme.accent,
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
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: noImageTheme.accent,
              boxShadow: '0 0 0 2px rgba(255,255,255,0.85), 0 1px 4px rgba(0,0,0,0.2)',
            }}
          />
          <Typography
            sx={{
              fontFamily: '"Permanent Marker"',
              fontSize: isFocused ? '1.6rem' : '1.35rem',
              lineHeight: 1.15,
              color: '#333',
              mb: 2.5,
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {event.title}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.1 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                fontSize: '0.86rem',
                fontFamily: '"Lora", serif',
                color: '#444',
              }}
            >
              <Calendar size={14} /> {formattedDate} · {formattedTime}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                fontSize: '0.86rem',
                fontFamily: '"Lora", serif',
                color: '#555',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <MapPin size={14} /> {event.location_name}
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={isFocused ? 12 : 4}
      component={Link}
      to={`/events/${event.id}`}
      sx={{
        flex: '0 0 auto',
        width: { xs: 280, sm: 350 },
        height: 520,
        mx: { xs: '20px', sm: '50px' }, // Matches string segment width of 450px
        mt: isFocused ? 14 : 8, // Space for the string dips
        p: 2,
        bgcolor: 'white',
        textDecoration: 'none',
        color: 'inherit',
        transform: isFocused
          ? `rotate(0deg) scale(1.15)`
          : `rotate(${rotation}deg) scale(0.95)`,
        zIndex: isFocused ? 30 : 20,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        scrollSnapAlign: 'center',
        opacity: isFocused ? 1 : 0.8,
        filter: isFocused ? 'none' : 'grayscale(20%)',
        '&:hover': {
          transform: isFocused
            ? `rotate(0deg) scale(1.18)`
            : `rotate(0deg) scale(1.02)`,
          zIndex: 35,
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          filter: 'none',
          opacity: 1,
        },
      }}
    >
      <PhotoClip />

      <Box
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
          position: 'relative',
          mb: 2,
          bgcolor: '#f5f5f5',
          borderRadius: '2px',
        }}
      >
        <Media src={event.cover_image || ''} className="w-full h-full object-cover" />
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            bgcolor: 'rgba(255,255,255,0.95)',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Typography
            sx={{ fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '0.05em' }}
          >
            {event.category?.name?.toUpperCase() || 'EVENT'}
          </Typography>
        </Box>

        {/* Interest Heart */}
        <button
          onClick={handleInterestClick}
          className={`absolute top-2 left-2 rounded-full p-2 transition-all shadow-sm z-10 ${isFocused ? 'bg-white/90 hover:bg-white hover:scale-110' : 'bg-white/40'}`}
          aria-label={event.user_is_interested ? 'Remove interest' : 'Mark interested'}
        >
          <Heart
            size={18}
            className={`transition-colors ${event.user_is_interested ? 'fill-red-500 text-red-500' : 'text-gray-500'
              }`}
          />
        </button>

        {/* Status Badges Overlay */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            right: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          {event.lifecycle_state === 'event_ready' && (
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.9)',
                backdropBlur: '4px',
                p: 1.5,
                borderRadius: 2,
                boxShadow: 3,
                width: '100%',
                maxWidth: 180,
                border: '1px solid',
                borderColor: 'primary.light',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 'bold', color: 'primary.main' }}
                >
                  CAPACITY FILLED
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  {Math.round((event.ticket_count / (event.capacity || 100)) * 100)}%
                </Typography>
              </Box>
              <Box
                sx={{
                  width: '100%',
                  height: 4,
                  bgcolor: 'rgba(0,0,0,0.1)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: `${Math.min(100, (event.ticket_count / (event.capacity || 100)) * 100)}%`,
                    height: '100%',
                    bgcolor: 'primary.main',
                    borderRadius: 2,
                  }}
                />
              </Box>
            </Box>
          )}

          {(event.lifecycle_state === 'published' ||
            event.lifecycle_state === 'live') && (
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 4,
                  ml: 'auto',
                  boxShadow: 2,
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                }}
              >
                $
                {event.ticket_price_standard
                  ? parseFloat(event.ticket_price_standard).toFixed(0)
                  : 'Free'}
              </Box>
            )}
        </Box>
      </Box>

      <Box sx={{ px: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography
          sx={{
            fontFamily: '"Permanent Marker"',
            fontSize: isFocused ? '1.5rem' : '1.25rem',
            lineHeight: 1.1,
            color: '#333',
            transition: 'font-size 0.6s ease',
          }}
        >
          {event.title}
        </Typography>

        {isFocused && event.description && (
          <Typography
            sx={{
              fontSize: '0.8rem',
              lineClamp: 3,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              opacity: 0.8,
              mb: 1,
              fontFamily: '"Lora", serif',
              fontStyle: 'italic',
              lineHeight: 1.4,
            }}
          >
            {event.description}
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              variant="caption"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontWeight: 'bold',
              }}
            >
              <Calendar size={12} /> {formattedDate}
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.7 }}
            >
              <MapPin size={12} /> {event.location_name}
            </Typography>
          </Box>
          <Box sx={{ color: 'primary.main' }}>
            <ArrowRight size={24} />
          </Box>
        </Box>

        {isFocused && event.reviews && event.reviews.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #ddd' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'start' }}>
              <Avatar
                src={event.reviews[0].reviewer_avatar}
                sx={{ width: 28, height: 28, border: '1px solid #eee' }}
              />
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {event.reviews[0].reviewer_username}
                  </Typography>
                  <Rating
                    value={event.reviews[0].rating}
                    readOnly
                    size="small"
                    sx={{ fontSize: '0.65rem' }}
                  />
                </Box>
                <Typography
                  sx={{
                    fontSize: '0.7rem',
                    fontStyle: 'italic',
                    opacity: 0.8,
                    lineClamp: 2,
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    mt: 0.5,
                    bgcolor: '#f9f9f9',
                    p: 1,
                    borderRadius: '4px',
                  }}
                >
                  "{event.reviews[0].text}"
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

// --- Custom Card Wrapper ---

const CustomCardCarouselWrapper = ({
  cycleIndex,
  isFocused,
  index,
}: {
  cycleIndex: number;
  isFocused: boolean;
  index: number;
}) => {
  const rotation = useMemo(
    () => (index % 2 === 0 ? 1 : -1) * (1 + Math.random() * 2),
    [index],
  );

  return (
    <Box
      sx={{
        flex: '0 0 auto',
        width: { xs: 280, sm: 350 },
        height: 520,
        mx: { xs: '20px', sm: '50px' },
        mt: isFocused ? 14 : 8,
        transform: isFocused
          ? `rotate(0deg) scale(1.15)`
          : `rotate(${rotation}deg) scale(0.95)`,
        zIndex: isFocused ? 30 : 20,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        display: 'flex',
        filter: isFocused ? 'none' : 'grayscale(20%)',
        opacity: isFocused ? 1 : 0.8,
        '&:hover': {
          transform: isFocused
            ? `rotate(0deg) scale(1.18)`
            : `rotate(0deg) scale(1.02)`,
          zIndex: 35,
          filter: 'none',
          opacity: 1,
        },
      }}
    >
      <PhotoClip />
      <Box
        sx={{
          width: '100%',
          height: '100%',
          '& > *': { width: '100%', height: '100%', m: 0 },
        }}
      >
        {cycleIndex === 0 && <PlatformDescriptionCard />}
        {cycleIndex === 1 && <UserActionCard />}
        {cycleIndex === 2 && (
          <PostItNote
            username="party_animal"
            rating={5}
            comment="Outgoing changed my weekends forever! Met the coolest people here."
            color="#ff9ecd"
            rotation="0"
          />
        )}
        {cycleIndex === 3 && <StarCutoutCard />}
        {cycleIndex === 4 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              bgcolor: 'transparent',
            }}
          >
            <HostCard
              host={{ username: 'legendary.host', avatar: null }}
              rating={4.9}
              tag="Top 1% Host"
              rotation={0}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

// --- Main Carousel Component ---

export function BedroomHeroCarousel() {
  const { data: response, isLoading } = useCarouselEvents();
  const events: EventListItem[] = response?.data || [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInitialPositionedRef = useRef(false);
  const [centeredIndex, setCenteredIndex] = useState(0);

  const mixedEvents = useMemo(() => {
    const result: MixedCarouselItem[] = [];
    for (let i = 0; i < events.length; i++) {
      result.push({ type: 'event', data: events[i] });
      if ((i + 1) % 3 === 0 && i !== events.length - 1) {
        // Every 4th card
        result.push({ type: 'custom', index: Math.floor(Math.random() * 5) });
      }
    }
    return result;
  }, [events]);

  // Triple the sequence for infinite-scroll illusion.
  const displayEvents = useMemo(() => {
    if (mixedEvents.length === 0) return [];
    return [...mixedEvents, ...mixedEvents, ...mixedEvents];
  }, [mixedEvents]);

  useEffect(() => {
    if (mixedEvents.length > 0) {
      // Always start on the second item in the middle copy.
      setCenteredIndex(mixedEvents.length + (mixedEvents.length > 1 ? 1 : 0));
      hasInitialPositionedRef.current = false;
    }
  }, [mixedEvents.length]);

  const scrollToCenteredIndex = (index: number, behavior: ScrollBehavior) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cardNodes = Array.from(
      container.querySelectorAll('[data-card="true"]'),
    ) as HTMLElement[];
    if (cardNodes.length <= index || index < 0) return;
    const node = cardNodes[index];
    const containerCenter = container.offsetWidth / 2;
    const nodeCenter = node.offsetLeft + node.offsetWidth / 2;
    container.scrollTo({ left: nodeCenter - containerCenter, behavior });
  };

  // Apply scroll when centeredIndex changes.
  useEffect(() => {
    if (events.length === 0) return;
    const behavior: ScrollBehavior = hasInitialPositionedRef.current
      ? 'smooth'
      : 'auto';
    scrollToCenteredIndex(centeredIndex, behavior);
    hasInitialPositionedRef.current = true;
  }, [centeredIndex, events.length]);

  // Keep index in the middle copy with an invisible recenter.
  useEffect(() => {
    if (mixedEvents.length === 0) return;
    const lowerBound = mixedEvents.length;
    const upperBound = mixedEvents.length * 2;

    if (centeredIndex < lowerBound || centeredIndex >= upperBound) {
      const offsetInSequence =
        ((centeredIndex % mixedEvents.length) + mixedEvents.length) %
        mixedEvents.length;
      const recenteredIndex = mixedEvents.length + offsetInSequence;
      scrollToCenteredIndex(recenteredIndex, 'auto');
      setCenteredIndex(recenteredIndex);
    }
  }, [centeredIndex, mixedEvents.length]);

  // Auto-rotate
  useEffect(() => {
    if (mixedEvents.length === 0) return;
    const interval = setInterval(() => {
      setCenteredIndex((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [mixedEvents.length]);

  if (isLoading) {
    return <Box sx={{ height: 620, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 2 }} />;
  }

  if (events.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        overflow: 'visible',
        pb: 10
        // Removed bgcolor to blend seamlessly into HomePage scrapbook background
      }}
    >
      {/* Navigation Buttons */}
      <IconButton
        onClick={() => setCenteredIndex((prev) => prev - 1)}
        sx={{
          position: 'absolute',
          left: { xs: 0, lg: -40 },
          top: '50%',
          zIndex: 100,
          bgcolor: 'white',
          boxShadow: 3,
          '&:hover': { bgcolor: '#f0f0f0' },
        }}
      >
        <ChevronLeft />
      </IconButton>
      <IconButton
        onClick={() => setCenteredIndex((prev) => prev + 1)}
        sx={{
          position: 'absolute',
          right: { xs: 0, lg: -40 },
          top: '50%',
          zIndex: 100,
          bgcolor: 'white',
          boxShadow: 3,
          '&:hover': { bgcolor: '#f0f0f0' },
        }}
      >
        <ChevronRight />
      </IconButton>

      {/* Scrollable Container */}
      <Box
        ref={scrollRef}
        sx={{
          display: 'flex',
          overflowX: 'hidden', // Disabled horizontal scroll entirely
          overflowY: 'hidden',
          py: 8,
          scrollSnapType: 'none',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          position: 'relative',
          zIndex: 10,
          alignItems: 'start',
        }}
      >
        {/* Render Wavy String Segments */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            display: 'flex',
          }}
        >
          {displayEvents.map((_, idx) => (
            <StringSegment key={`string-${idx}`} index={idx} />
          ))}
        </Box>

        {displayEvents.map((item, idx) => (
          <Box key={`card-${idx}`} data-card="true" sx={{ flex: '0 0 auto' }}>
            {item.type === 'event' ? (
              <EventTapeCard
                event={item.data}
                isFocused={idx === centeredIndex}
                index={idx}
              />
            ) : (
              <CustomCardCarouselWrapper
                cycleIndex={item.index % 5}
                isFocused={idx === centeredIndex}
                index={idx}
              />
            )}
          </Box>
        ))}
      </Box>

      <style>{`
                @keyframes blink {
                    0%, 100% { opacity: 0.4; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>
    </Box>
  );
}
