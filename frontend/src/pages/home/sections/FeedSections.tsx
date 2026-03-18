import { Box, Button, Typography } from '@mui/material';
import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  useFeed,
  useHighlightsFeed,
  useTrendingHighlights,
} from '@/features/events/hooks';
import { HorizontalScrapbookList } from '@/features/events/HorizontalScrapbookList';
import { HeroNegativeStripGallery } from '@/pages/events/components/HeroNegativeStripGallery';
import { HighlightCard } from '@/pages/events/components/HighlightCard';
import { useNearYou } from '@/utils/useNearYou';

// --- Reusable Feed Section ---
interface GenericFeedSectionProps {
  title: string;
  params: any;
  viewAllPath?: string;
  emptyMessage?: ReactNode;
  forceShowHeader?: boolean;
  decorative?: boolean;
}

export const GenericFeedSection = ({
  title,
  params,
  viewAllPath,
  emptyMessage,
  forceShowHeader = false,
  decorative = true,
}: GenericFeedSectionProps) => {
  const { data, isLoading } = useFeed(params);
  const navigate = useNavigate();

  const section = (
    <HorizontalScrapbookList
      title={title}
      events={data?.data || []}
      isLoading={isLoading}
      forceShowHeader={forceShowHeader}
      emptyMessage={emptyMessage}
      onSeeAll={viewAllPath ? () => navigate(viewAllPath) : undefined}
    />
  );
  // return null;
  return section;

  if (decorative) {
    return (
      <Box sx={{ position: 'relative', py: 2 }}>
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            right: 40,
            width: 100,
            height: 30,
            bgcolor: 'rgba(56, 189, 248, 0.4)',
            transform: 'rotate(5deg)',
            zIndex: 0,
          }}
        />
        {section}
      </Box>
    );
  }
};

// --- Trending ---
export const TrendingSection = () => (
  <GenericFeedSection
    title="🔥 Trending Right Now"
    params={{ sort: 'trending' }}
    viewAllPath="/browse?sort=trending&title=Trending Right Now"
  />
);

// --- Upcoming RSVPs ---
export const UpcomingRSVPsSection = () => (
  <GenericFeedSection
    title="📅 Upcoming "
    params={{ sort: 'upcoming' }} // popular upcoming approximation
    viewAllPath="/browse?sort=popular&title=Upcoming Events"
  />
);

// --- Nearby ---
export const NearbySection = () => {
  const { enabled, coords, radiusMiles, toggleLocation } = useNearYou();
  const navigate = useNavigate();
  const radiusKm = enabled ? Math.round(radiusMiles * 1.60934) : undefined;

  if (!enabled) {
    return (
      <Box
        sx={{
          px: { xs: 2, sm: 4, lg: 8 },
          bgcolor: '#f0fdf4',
          borderTop: '2px dashed #9ca3af',
          borderBottom: '2px dashed #9ca3af',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontFamily: '"serif"', color: '#1a1a1a', mb: 1 }}
        >
          📍 Find Events Near You
        </Typography>
        <Typography
          variant="body1"
          sx={{ fontFamily: 'serif', mb: 3, color: '#4b5563' }}
        >
          Enable location to see what's happening in your neighborhood.
        </Typography>
        <Button
          onClick={toggleLocation}
          variant="contained"
          sx={{
            bgcolor: '#3b82f6',
            color: '#fff',
            px: 4,
            py: 1.5,
            borderRadius: '4px',
            fontFamily: '"serif"',
            textTransform: 'none',
            fontSize: '1.1rem',
            '&:hover': { bgcolor: '#2563eb' },
          }}
        >
          Allow Location
        </Button>
      </Box>
    );
  }

  return (
    <GenericFeedSection
      title="📍 Nearby Events"
      params={{
        lat: enabled && coords ? coords.lat : undefined,
        lng: enabled && coords ? coords.lng : undefined,
        radius_km: radiusKm,
      }}
      viewAllPath="/browse?sort=trending&title=Nearby Events"
      forceShowHeader={true}
      emptyMessage={
        <Box
          sx={{
            py: 6,
            px: 8,
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            border: '2px dashed rgba(0,0,0,0.15)',
            borderRadius: 6,
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            transform: 'rotate(-0.5deg)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontFamily: '"serif"',
              color: '#374151',
              mb: 1.5,
            }}
          >
            A bit quiet around here...
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: 'serif',
              fontStyle: 'italic',
              color: '#6b7280',
              mb: 4,
              maxWidth: 300,
            }}
          >
            No events found in your area yet. Why not be the one to spark the magic?
          </Typography>
          <Button
            onClick={() => navigate('/events/create')}
            variant="contained"
            sx={{
              bgcolor: '#f8c163',
              color: '#1a1a1a',
              fontFamily: '"serif"',
              px: 4,
              py: 1.5,
              fontSize: '1.2rem',
              textTransform: 'none',
              borderRadius: '8px',
              boxShadow: '4px 4px 0px #d97706',
              border: '2px solid #1a1a1a',
              '&:hover': {
                bgcolor: '#fbbf24',
                transform: 'translate(-2px, -2px)',
                boxShadow: '6px 6px 0px #d97706',
              },
              transition: 'all 0.2s ease',
            }}
          >
            ✨ Create an Event
          </Button>
        </Box>
      }
      decorative={true}
    />
  );
};

// --- Online ---
export const OnlineSection = () => (
  <GenericFeedSection
    title="🌐 Online Events"
    params={{ online: true }}
    viewAllPath="/browse?online=true&title=Online Events"
    forceShowHeader={true}
    emptyMessage="No online sessions scheduled right now. Check back soon!"
  />
);

// --- Recommended ---
export const RecommendedSection = () => (
  <GenericFeedSection
    title="✨ Recommended For You"
    params={{ sort: 'recommended' }}
    viewAllPath="/browse?sort=recommended&title=Recommended For You"
  />
);

// --- Last Week's Memories ---
export const LastWeekMemoriesSection = () => {
  const { data, isLoading } = useHighlightsFeed();
  return (
    <HorizontalScrapbookList
      title="📸 Popular Memories"
      items={data?.data || []}
      isLoading={isLoading}
      renderItem={(highlight) => (
        <HighlightCard
          highlight={highlight}
          rotation={(highlight.id % 2 === 0 ? 1 : -1) * (1 + (highlight.id % 3))}
        />
      )}
    />
  );
};

// --- Trending Highlights ---
export const TrendingHighlightsSection = () => {
  const { data, isLoading } = useTrendingHighlights(12);
  return (
    <HorizontalScrapbookList
      title="✨ Trending Highlights"
      items={data?.data || []}
      isLoading={isLoading}
      renderItem={(highlight) => (
        <HighlightCard
          highlight={highlight}
          rotation={(highlight.id % 2 === 0 ? 1 : -1) * (1 + (highlight.id % 3))}
        />
      )}
    />
  );
};

// --- Home Page Negative Strip Gallery ---
export const HomePageNegativeStripGallery = () => {
  const { data, isLoading } = useTrendingHighlights(20);
  const highlights = data?.data || [];

  // Extract images and titles from highlights
  const images = highlights.map((h: any) => h.media_file);
  const title = '✨ Highlights';

  // Create a mock host object for the gallery
  const host = {
    username: highlights[0]?.author_username || 'host',
  };

  if (isLoading || !highlights.length) return null;

  return (
    <Box
      sx={{
        mx: -4,
        perspective: '1000px',
        overflow: 'visible',
      }}
    >
      <Box
        sx={{
          transform: 'rotateY(-15deg) rotateX(5deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        <HeroNegativeStripGallery images={images} title={title} host={host} />
      </Box>
    </Box>
  );
};
