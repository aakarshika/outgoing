import { Box, Button, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

import { HostCard } from '@/components/ui/HostCard';
import { PostItNote } from '@/components/ui/PostItNote';

import { PlatformDescriptionCard } from './cards/PlatformDescriptionCard';
import { StarCutoutCard } from './cards/StarCutoutCard';
import { UserActionCard } from './cards/UserActionCard';
import { ScrapbookEventCard } from './ScrapbookEventCard';

interface HorizontalScrapbookListProps {
  title: string;
  events: any[];
  isLoading?: boolean;
  emptyMessage?: string;
  onSeeAll?: () => void;
}

export function HorizontalScrapbookList({
  title,
  events,
  isLoading,

  onSeeAll,
}: HorizontalScrapbookListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftChevron, setShowLeftChevron] = useState(false);
  const [showRightChevron, setShowRightChevron] = useState(true);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftChevron(scrollLeft > 0);
    setShowRightChevron(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === 'left' ? -400 : 400;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (!isLoading && events.length === 0) {
    return null;
  }

  return (
    <Box sx={{ py: 6, position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          mb: 4,
          px: { xs: 2, sm: 4, lg: 6 },
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{
              position: 'absolute',
              top: -10,
              left: -10,
              width: 40,
              height: 20,
              bgcolor: 'rgba(251, 191, 36, 0.4)',
              transform: 'rotate(-5deg)',
              zIndex: 0,
            }}
          />
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Permanent Marker"',
              color: '#1a1a1a',
              fontSize: { xs: '1.5rem', sm: '2rem' },
              position: 'relative',
              zIndex: 1,
            }}
          >
            {title}
          </Typography>
        </Box>
        {onSeeAll && (
          <Button
            onClick={onSeeAll}
            sx={{
              fontFamily: 'serif',
              textTransform: 'none',
              color: '#666',
              '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' },
            }}
          >
            See more memories →
          </Button>
        )}
      </Box>

      <Box sx={{ position: 'relative' }}>
        {/* Left Chevron */}
        {showLeftChevron && (
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 10,
              width: 80,
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              background: 'linear-gradient(to right, #f8f9fa 20%, transparent)',
              pointerEvents: 'none',
            }}
          >
            <Button
              onClick={() => scroll('left')}
              sx={{
                minWidth: 40,
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: '#fff',
                boxShadow: 2,
                ml: 2,
                pointerEvents: 'auto',
                color: '#000',
                '&:hover': { bgcolor: '#f0f0f0' },
              }}
            >
              <ChevronLeft size={24} />
            </Button>
          </Box>
        )}

        <Box
          ref={scrollContainerRef}
          onScroll={handleScroll}
          sx={{
            display: 'flex',
            gap: { xs: 3, sm: 4, md: 6 },
            overflowX: 'auto',
            overflowY: 'hidden',
            px: { xs: 2, sm: 4, lg: 6 },
            pb: 8,
            pt: 6,
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            // Decorative pencil line behind the cards
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: 1,
              backgroundImage:
                'linear-gradient(to right, rgba(0,0,0,0.1) 50%, transparent 50%)',
              backgroundSize: '10px 1px',
              zIndex: -1,
            },
          }}
        >
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: { xs: 280, sm: 320 },
                    flexShrink: 0,
                    aspectRatio: '1 / 1.2',
                    bgcolor: 'rgba(0,0,0,0.05)',
                    borderRadius: 1,
                    animation: 'pulse 1.5s infinite',
                  }}
                />
              ))
            : events.map((event, index) => {
                const showCustomCard =
                  (index + 1) % 3 === 0 && index !== events.length - 1;
                const cycleIndex = Math.floor(index / 3) % 5; // 5 types of custom cards

                return (
                  <Box
                    key={`group-${event.id}`}
                    sx={{ display: 'flex', gap: { xs: 3, sm: 4, md: 6 } }}
                  >
                    <Box
                      sx={{
                        width: { xs: 240, sm: 280, md: 320 },
                        flexShrink: 0,
                        scrollSnapAlign: 'start',
                      }}
                    >
                      <ScrapbookEventCard event={event} />
                    </Box>

                    {showCustomCard && (
                      <Box
                        sx={{
                          width: { xs: 240, sm: 280, md: 320 },
                          flexShrink: 0,
                          scrollSnapAlign: 'start',
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
                            rotation="-2"
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
                              pt: 4,
                            }}
                          >
                            <HostCard
                              host={{ username: 'legendary.host', avatar: null }}
                              rating={4.9}
                              tag="Top 1% Host"
                            />
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })}
        </Box>

        {/* Right Chevron */}
        {showRightChevron && (
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              zIndex: 10,
              width: 80,
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              background: 'linear-gradient(to l, #f8f9fa 20%, transparent)',
              pointerEvents: 'none',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              onClick={() => scroll('right')}
              sx={{
                minWidth: 40,
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: '#fff',
                boxShadow: 2,
                mr: 2,
                pointerEvents: 'auto',
                color: '#000',
                '&:hover': { bgcolor: '#f0f0f0' },
              }}
            >
              <ChevronRight size={24} />
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
