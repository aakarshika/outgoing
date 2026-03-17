import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks';
import {
  fetchMyEvents,
  fetchMyInterestedEvents,
  fetchMyTickets,
} from '@/features/events/api';
import { useFeed } from '@/features/events/hooks';
import { HorizontalScrapbookList } from '@/features/events/HorizontalScrapbookList';
import { scrapbookTheme } from '@/features/events/theme/scrapbookTheme';
import { fetchMyServices } from '@/features/vendors/api';

import { FeaturedCarouselSection, HeroSection } from './sections/HeroSections';
import { IconicHostsSection } from './sections/IconicHostsSection';
import {
  GoingSavedSection,
  HostingAndGigsCardsSection,
  IconicVendorsSection,
  MapPlaceholderSection,
  MemoriesFilmStripPlaceholderSection,
  MyEventsServicesSection,
  OnlineOfflineSection,
  PrimaryHighlightsStripSection,
  RelevantTrendingNearbySection,
} from './sections/RenewedSections';

function uniqueById(items: any[]) {
  const seen = new Set<number | string>();
  return items.filter((item) => {
    const key = item?.id;
    if (key == null || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortByNewestCreated(items: any[]) {
  return [...items].sort((a, b) => {
    const aTime = new Date(a?.created_at || a?.start_time || 0).getTime();
    const bTime = new Date(b?.created_at || b?.start_time || 0).getTime();
    return bTime - aTime;
  });
}

export default function HomePageRenewed() {
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

  const { data: myTicketsResponse, isLoading: loadingMyTickets } = useQuery({
    queryKey: ['home', 'myTickets'],
    queryFn: fetchMyTickets,
    enabled: isAuthenticated,
  });
  const { data: mySavedResponse, isLoading: loadingMySaved } = useQuery({
    queryKey: ['home', 'myInterestedEvents'],
    queryFn: fetchMyInterestedEvents,
    enabled: isAuthenticated,
  });
  const { data: myEventsResponse, isLoading: loadingMyEvents } = useQuery({
    queryKey: ['home', 'myEvents'],
    queryFn: fetchMyEvents,
    enabled: isAuthenticated,
  });
  const { data: myServicesResponse, isLoading: loadingMyServices } = useQuery({
    queryKey: ['home', 'myServices'],
    queryFn: fetchMyServices,
    enabled: isAuthenticated,
  });

  const goingEvents = useMemo(
    () =>
      sortByNewestCreated(
        uniqueById(
          ((myTicketsResponse?.data || []) as any[])
            .map((ticket: any) => ticket.event_summary || ticket.event)
            .filter(Boolean),
        ),
      ),
    [myTicketsResponse],
  );
  const savedEvents = useMemo(
    () => sortByNewestCreated(uniqueById((mySavedResponse?.data || []) as any[])),
    [mySavedResponse],
  );
  const myEvents = useMemo(
    () => sortByNewestCreated(uniqueById((myEventsResponse?.data || []) as any[])),
    [myEventsResponse],
  );
  const myServices = useMemo(
    () => sortByNewestCreated(uniqueById((myServicesResponse?.data || []) as any[])),
    [myServicesResponse],
  );

  return (
    <ThemeProvider theme={scrapbookTheme}>
      <Box
        sx={{
          overflowX: 'hidden',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px',
          color: '#f8c163ff',
        }}
      >
        {search ? (
          <HorizontalScrapbookList
            title={`Search Results for "${search}"`}
            events={searchFeed?.data || []}
            isLoading={isLoadingSearch}
            emptyMessage="No exact matches found."
          />
        ) : null}

        <HeroSection />
        <FeaturedCarouselSection />

        <RelevantTrendingNearbySection title="Relevant / Trending / Nearby" />
        <GoingSavedSection
          isAuthenticated={isAuthenticated}
          goingEvents={goingEvents}
          savedEvents={savedEvents}
          loadingGoing={loadingMyTickets}
          loadingSaved={loadingMySaved}
        />
        <OnlineOfflineSection />
        <HostingAndGigsCardsSection />
        <MapPlaceholderSection />

        <PrimaryHighlightsStripSection />

        <MyEventsServicesSection
          isAuthenticated={isAuthenticated}
          myEvents={myEvents}
          myServices={myServices}
          loadingEvents={loadingMyEvents}
          loadingServices={loadingMyServices}
        />
        <IconicHostsSection />
        <IconicVendorsSection />

        {isAuthenticated ? <MemoriesFilmStripPlaceholderSection /> : null}

        <RelevantTrendingNearbySection title="Relevant / Trending / Nearby" />
      </Box>
    </ThemeProvider>
  );
}
