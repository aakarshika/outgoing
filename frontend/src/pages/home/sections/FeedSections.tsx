import { Box, Button, Typography } from '@mui/material';
import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { useFeed, useHighlightsFeed } from '@/features/events/hooks';
import { HorizontalScrapbookList } from '@/features/events/HorizontalScrapbookList';
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

  return section;
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
          py: 6,
          px: { xs: 2, sm: 4, lg: 8 },
          bgcolor: '#f0fdf4',
          borderTop: '2px dashed #9ca3af',
          borderBottom: '2px dashed #9ca3af',
          textAlign: 'center',
          my: 4,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontFamily: '"Permanent Marker"', color: '#1a1a1a', mb: 1 }}
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
            fontFamily: '"Permanent Marker"',
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
              fontFamily: '"Permanent Marker"',
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
              fontFamily: '"Permanent Marker"',
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
      events={data?.data || []}
      isLoading={isLoading}
    />
  );
};
