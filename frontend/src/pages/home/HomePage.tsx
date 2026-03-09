import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useSearchParams } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks';
import { useFeed } from '@/features/events/hooks';
import { HorizontalScrapbookList } from '@/features/events/HorizontalScrapbookList';
import { scrapbookTheme } from '@/features/events/theme/scrapbookTheme';

import {
  CreateEventCTASection,
  FeaturedCarouselSection,
  HeroSection,
  IconicHostsSection,
  LastWeekMemoriesSection,
  MakeYourEventHappenSection,
  NearbySection,
  OnlineSection,
  RecommendedSection,
  SignUpCTASection,
  TrendingSection,
  TrendingHighlightsSection,
  UpcomingRSVPsSection,
} from './HomeSections';
import {
  type SectionId,
  SIGNED_IN_SECTIONS,
  SIGNED_OUT_SECTIONS,
} from './SectionConfig';

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const locationParam = searchParams.get('location') || '';
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const radiusMilesParam = searchParams.get('radius_miles');
  const radiusKm = radiusMilesParam
    ? Math.round(parseFloat(radiusMilesParam) * 1.60934) || undefined
    : undefined;
  const { isAuthenticated } = useAuth();

  const { data: searchFeed, isLoading: isLoadingSearch } = useFeed({
    search: search || undefined,
    location: locationParam || undefined,
    lat: latParam ? parseFloat(latParam) : undefined,
    lng: lngParam ? parseFloat(lngParam) : undefined,
    radius_km: radiusKm,
  });

  const activeSections = isAuthenticated ? SIGNED_IN_SECTIONS : SIGNED_OUT_SECTIONS;

  const renderSection = (id: SectionId) => {
    switch (id) {
      case 'hero':
        return <HeroSection key={id} />;
      case 'featured_carousel':
        return <FeaturedCarouselSection key={id} />;
      case 'upcoming_rsvps':
        return <UpcomingRSVPsSection key={id} />;
      case 'trending':
        return <TrendingSection key={id} />;
      case 'nearby':
        return <NearbySection key={id} />;
      case 'trending_highlights':
        return <TrendingHighlightsSection key={id} />;
      case 'online':
        return <OnlineSection key={id} />;
      case 'iconic_hosts':
        return <IconicHostsSection key={id} />;
      case 'make_your_event_happen':
        return <MakeYourEventHappenSection key={id} />;
      case 'recommended':
        return <RecommendedSection key={id} />;
      case 'last_week_memories':
        return <LastWeekMemoriesSection key={id} />;
      case 'create_event_cta':
        return <CreateEventCTASection key={id} />;
      case 'sign_up_cta':
        return <SignUpCTASection key={id} />;
      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={scrapbookTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          overflowX: 'hidden',
          bgcolor: '#f4f1ea',
          backgroundImage:
            'radial-gradient(#d1d5db 0.5px, transparent 0.5px), radial-gradient(#d1d5db 0.5px, #f4f1ea 0.5px)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px',
          pb: 12,
          color: '#f8c163ff',
        }}
      >
        <div className="">
          {/* Search results override normal feed if searching */}
          {search && (
            <HorizontalScrapbookList
              title={`Search Results for "${search}"`}
              events={searchFeed?.data || []}
              isLoading={isLoadingSearch}
              emptyMessage="No exact matches found."
            />
          )}

          {/* Render Sections Modularly */}
          {activeSections.map(renderSection)}
        </div>
      </Box>
    </ThemeProvider>
  );
}
