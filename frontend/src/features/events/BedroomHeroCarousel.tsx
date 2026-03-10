/** Redesigned Hero Carousel — Bedroom "Fairy Lights" aesthetic with infinite rotation, focus, and WAVY string. */

import { Box, IconButton, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { HostCard } from '@/components/ui/HostCard';
import { PostItNote } from '@/components/ui/PostItNote';
import type { EventDetail, EventListItem } from '@/types/events';

import { PlatformDescriptionCard } from './cards/PlatformDescriptionCard';
import { StarCutoutCard } from './cards/StarCutoutCard';
import { UserActionCard } from './cards/UserActionCard';
import { useCarouselEvents, useTrendingHighlights } from './hooks';
import { ScrapbookEventCardLandscape } from './ScrapbookEventCard';
import { ScrapbookEventCard } from './ScrapbookEventCard';
import { HighlightCard } from '@/pages/events/components/HighlightCard';

export type MixedCarouselItem =
  | { type: 'event'; data: EventListItem }
  | { type: 'custom'; index: number }
  | { type: 'highlight'; data: any };

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

// --- Custom Card Wrapper ---

const CustomCardCarouselWrapper = ({
  cycleIndex,
  isFocused,
  index,
  highlight,
  event,
  eventdata
}: {
  cycleIndex?: number;
  isFocused: boolean;
  index: number;
  highlight?: any;
  event: boolean;
  eventdata: any
}) => {
  const rotation = useMemo(
    () => (index % 2 === 0 ? 1 : -1) * (1 + Math.random() * 2),
    [index],
  );

  const rotationhover = useMemo(() => rotation + (2 + Math.random() * 2), [rotation]);

  return (
    <Box
      sx={{
        flex: '0 0 auto',
        width: { xs: 280, sm: 350 },
        height: isFocused ? 'auto' : 520,
        mx: { xs: '20px', sm: '50px' },
        mt: 8,
        zIndex: 20,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        filter: isFocused ? 'none' : 'grayscale(20%)',
        opacity: isFocused ? 1 : 0.8,
      }}
    >
      {(
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40 }}>
          <PhotoClip />
        </Box>
      )}
      <Box
        className="inner-body"
        sx={{
          width: '100%',
          height: '100%',
          transformOrigin: 'top center',
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          '& > *': { width: '100%', height: isFocused ? 'auto' : '100%', m: 0 },
          '&:hover': {
            transform: `rotate(${rotationhover}deg)`,
          },
        }}
      >
        {event ?
          <ScrapbookEventCard
            event={eventdata}
            isFocused={isFocused}
            showClip
            rotation={rotation}
            rotationhover={rotationhover}
            disableHover
          />
          : highlight ? (
            <HighlightCard
              highlight={highlight}
              showClip
              isFocused={isFocused}
              rotation={rotation}
              disableHover
            />
          ) : (
            <>
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
            </>
          )}
      </Box>
    </Box>
  );
};

// --- Main Carousel Component ---

export function BedroomHeroCarousel() {
  const { data: response, isLoading: eventsLoading } = useCarouselEvents();
  const { data: highlightsResponse, isLoading: highlightsLoading } = useTrendingHighlights(10);

  const events: EventListItem[] = response?.data || [];
  const highlights = highlightsResponse?.data || [];

  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInitialPositionedRef = useRef(false);
  const [centeredIndex, setCenteredIndex] = useState(0);

  const mixedEvents = useMemo(() => {
    const result: MixedCarouselItem[] = [];
    if (events.length === 0) return result;

    let highlightIdx = 0;
    for (let i = 0; i < events.length; i++) {
      result.push({ type: 'event', data: events[i] });

      // Every 2nd card, mix a highlight if available
      if ((i + 1) % 2 === 0 && highlightIdx < highlights.length) {
        result.push({ type: 'highlight', data: highlights[highlightIdx] });
        highlightIdx++;
      }

      // Every 3rd card, mix a custom card
      if ((i + 1) % 3 === 0 && i !== events.length - 1) {
        result.push({ type: 'custom', index: Math.floor(Math.random() * 5) });
      }
    }
    return result;
  }, [events, highlights]);

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
    if (mixedEvents.length === 0) return;
    const behavior: ScrollBehavior = hasInitialPositionedRef.current
      ? 'smooth'
      : 'auto';
    scrollToCenteredIndex(centeredIndex, behavior);
    hasInitialPositionedRef.current = true;
  }, [centeredIndex, mixedEvents.length]);

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

  if (eventsLoading || highlightsLoading) {
    return <Box sx={{ height: 620, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 2 }} />;
  }

  if (events.length === 0) {
    return (
      <Box sx={{ py: 10, width: '100%', textAlign: 'center' }}>
        <Typography
          variant="body1"
          sx={{ fontFamily: 'serif', fontStyle: 'italic', color: '#666' }}
        >
          No featured events to show right now.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        overflow: 'visible',
      }}
    >
      {/* Navigation Buttons */}
      <IconButton
        onClick={() => setCenteredIndex((prev) => prev - 1)}
        sx={{
          position: 'absolute',
          left: 0,
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
          right: 0,
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
          overflowX: 'hidden',
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

        {displayEvents.map((item, idx) => {
          const isFocused = idx === centeredIndex;
          console.log("itemitemitemitem", item);
          return (
            <Box
              key={`card-${idx}`}
              data-card="true"
              sx={{
                flex: '0 0 auto',
              }}
            >
              {item.type === 'event' ? (
                <CustomCardCarouselWrapper
                  highlight={item.data}
                  isFocused={isFocused}
                  index={idx}
                  event={true}
                  eventdata={item.data}
                />
              ) : item.type === 'highlight' ? (
                <CustomCardCarouselWrapper
                  highlight={item.data}
                  isFocused={isFocused}
                  index={idx}
                  event={false}
                  eventdata={null}

                />
              ) : (
                <CustomCardCarouselWrapper
                  cycleIndex={item.index % 5}
                  isFocused={isFocused}
                  index={idx}
                  event={false}
                  eventdata={null}
                />
              )}
            </Box>
          );
        })}
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
