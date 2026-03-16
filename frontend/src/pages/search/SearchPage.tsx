import { Box, Container } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks';
import { useCategories, useFeed } from '@/features/events/hooks';
import {
  fetchAllOpenOpportunities,
  fetchMyPotentialOpportunities,
  fetchMyVendorOpportunities,
} from '@/features/needs/api';
import type { EventLifecycleState, EventListItem } from '@/types/events';

import { SearchResults } from './components/SearchResults';
import { SimpleNavbar } from './components/SimpleNavbar';
import { SearchToolbar } from './components/SearchToolbar';
import type {
  FormatFilterId,
  RoleFilterId,
  SearchTabId,
  WhenFilterId,
} from './searchTypes';
import {
  buildLocationSearchParams,
  buildClearFiltersSearchParams,
  buildDateSearchParams,
  buildTabSearchParams,
  filterEvents,
  filterOpportunities,
  getEffectiveFormatFilters,
  getEffectiveWhenFilters,
  getFeedSort,
  getFeedTimeRange,
  getSectionCount,
  normalizeSearchPageParams,
  toggleListValue,
  updateListParam,
} from './searchUtils';

export default function SearchPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const normalizedSearchParams = useMemo(
    () => normalizeSearchPageParams(searchParams),
    [searchParams],
  );

  const tab = (normalizedSearchParams.get('tab') as SearchTabId) || 'trending';
  const search = normalizedSearchParams.get('search') || '';
  const location = normalizedSearchParams.get('location') || '';
  const lat = normalizedSearchParams.get('lat');
  const lng = normalizedSearchParams.get('lng');
  const radiusMiles = normalizedSearchParams.get('radius_miles');
  const selectedDate = normalizedSearchParams.get('date') || '';
  const selectedWhenParam = normalizedSearchParams.get('when') || '';
  const selectedCategoriesParam = normalizedSearchParams.get('categories') || '';
  const selectedFormatsParam = normalizedSearchParams.get('formats') || '';
  const selectedRolesParam = normalizedSearchParams.get('roles') || '';

  useEffect(() => {
    if (normalizedSearchParams.toString() !== searchParams.toString()) {
      setSearchParams(normalizedSearchParams, { replace: true });
    }
  }, [normalizedSearchParams, searchParams, setSearchParams]);

  const selectedWhen = useMemo(
    () =>
      selectedWhenParam
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean) as WhenFilterId[],
    [selectedWhenParam],
  );
  const selectedCategories = useMemo(
    () =>
      selectedCategoriesParam
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    [selectedCategoriesParam],
  );
  const selectedFormats = useMemo(
    () =>
      selectedFormatsParam
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean) as FormatFilterId[],
    [selectedFormatsParam],
  );
  const selectedRoles = useMemo(
    () =>
      selectedRolesParam
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean) as RoleFilterId[],
    [selectedRolesParam],
  );

  const effectiveWhen = useMemo(
    () => getEffectiveWhenFilters(tab, selectedWhen, selectedDate),
    [selectedDate, selectedWhen, tab],
  );

  const effectiveFormats = useMemo(
    () => getEffectiveFormatFilters(tab, selectedFormats),
    [selectedFormats, tab],
  );
  const feedTimeRange = useMemo(
    () =>
      tab === 'tonight-weekend' ? getFeedTimeRange(effectiveWhen, selectedDate) : null,
    [effectiveWhen, selectedDate, tab],
  );
  const trendingLifecycleStates = useMemo<EventLifecycleState[] | undefined>(() => {
    if (tab !== 'trending') return undefined;
    return ['published', 'event_ready', 'live'];
  }, [tab]);

  const parsedRadiusKm = radiusMiles
    ? Math.round(Number(radiusMiles) * 1.60934) || undefined
    : undefined;

  const feedSort = getFeedSort(tab);
  const isOnlineTab = tab === 'online';

  const { data: feedResponse, isLoading: isFeedLoading } = useFeed({
    search: search || undefined,
    location: isOnlineTab ? undefined : lat && lng ? undefined : location || undefined,
    lat: isOnlineTab ? undefined : lat ? Number(lat) : undefined,
    lng: isOnlineTab ? undefined : lng ? Number(lng) : undefined,
    radius_km: isOnlineTab ? undefined : parsedRadiusKm,
    online: isOnlineTab ? true : undefined,
    sort: feedSort,
    lifecycle_states: trendingLifecycleStates,
    start_time_gte: feedTimeRange?.start_time_gte,
    start_time_lte: feedTimeRange?.start_time_lte,
    page_size: 120,
  });

  const { data: categoryResponse } = useCategories();
  const categories = categoryResponse?.data || [];

  const { data: opportunities = [], isLoading: isOpportunitiesLoading } = useQuery({
    queryKey: ['search', 'opportunities', tab, isAuthenticated],
    enabled: tab === 'chip-in' || (isAuthenticated && tab === 'free-cheap'),
    queryFn: async () => {
      if (tab === 'chip-in') {
        const response = await fetchAllOpenOpportunities();
        return response.data || [];
      }

      const [matched, potential] = await Promise.all([
        fetchMyVendorOpportunities(),
        fetchMyPotentialOpportunities(),
      ]);

      const seen = new Set<number>();
      return [...(matched.data || []), ...(potential.data || [])].filter((item) => {
        if (seen.has(item.need_id)) return false;
        seen.add(item.need_id);
        return true;
      });
    },
  });

  const { data: openEventCardOpportunities = [] } = useQuery({
    queryKey: ['search', 'event-card-opportunities'],
    queryFn: async () => {
      const response = await fetchAllOpenOpportunities();
      return response.data || [];
    },
  });

  const { data: matchedOpportunities = [] } = useQuery({
    queryKey: ['search', 'opportunities', 'matched', isAuthenticated],
    enabled: isAuthenticated && tab === 'chip-in',
    queryFn: async () => {
      const response = await fetchMyVendorOpportunities();
      return response.data || [];
    },
  });

  const filteredEvents = useMemo(() => {
    return filterEvents({
      events: (feedResponse?.data || []) as EventListItem[],
      selectedCategories,
      effectiveWhen,
      selectedDate,
      effectiveFormats,
      tab,
    });
  }, [
    effectiveFormats,
    effectiveWhen,
    feedResponse,
    selectedCategories,
    selectedDate,
    tab,
  ]);

  const filteredOpportunities = useMemo(() => {
    return filterOpportunities({
      opportunities,
      search,
      effectiveWhen,
      selectedDate,
      selectedRoles,
      effectiveFormats,
    });
  }, [
    effectiveFormats,
    effectiveWhen,
    opportunities,
    search,
    selectedDate,
    selectedRoles,
  ]);

  const setTab = (nextTab: SearchTabId) => {
    setSearchParams(buildTabSearchParams(normalizedSearchParams, nextTab), {
      replace: true,
    });
  };

  const sectionCount = getSectionCount(
    tab,
    filteredEvents.length,
    filteredOpportunities.length,
  );
  const matchedOpportunityNeedIds = useMemo(
    () => new Set(matchedOpportunities.map((item) => item.need_id)),
    [matchedOpportunities],
  );
  const eventCardOpportunityByEventId = useMemo(() => {
    const byEventId = new Map<number, (typeof openEventCardOpportunities)[number]>();
    openEventCardOpportunities.forEach((opportunity) => {
      if (!byEventId.has(opportunity.event_id)) {
        byEventId.set(opportunity.event_id, opportunity);
      }
    });
    return byEventId;
  }, [openEventCardOpportunities]);

  return (
    <Box

        sx={{
          
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, #FFF9F0 0%, #F9F1E4 48%, #F7EEE2 100%)',
        pb: 60,
      }}
    >
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
      <SimpleNavbar />
      </Box>
      <SearchToolbar
        tab={tab}
        selectedDate={selectedDate}
        effectiveWhen={effectiveWhen}
        effectiveFormats={effectiveFormats}
        selectedCategories={selectedCategories}
        selectedRoles={selectedRoles}
        categories={categories}
        radiusMiles={radiusMiles}
        onTabChange={setTab}
        onToggleWhen={(value) =>
          updateListParam(
            normalizedSearchParams,
            'when',
            toggleListValue(selectedWhen, value),
            setSearchParams,
          )
        }
        onDateChange={(value) =>
          setSearchParams(buildDateSearchParams(normalizedSearchParams, value), {
            replace: true,
          })
        }
        onToggleCategory={(value) =>
          updateListParam(
            normalizedSearchParams,
            'categories',
            toggleListValue(selectedCategories, value),
            setSearchParams,
          )
        }
        onToggleFormat={(value) =>
          updateListParam(
            normalizedSearchParams,
            'formats',
            toggleListValue(selectedFormats, value),
            setSearchParams,
          )
        }
        onToggleRole={(value) =>
          updateListParam(
            normalizedSearchParams,
            'roles',
            toggleListValue(selectedRoles, value),
            setSearchParams,
          )
        }
        onClearRoles={() =>
          updateListParam(normalizedSearchParams, 'roles', [], setSearchParams)
        }
        onClearManualFilters={() =>
          setSearchParams(buildClearFiltersSearchParams(normalizedSearchParams), {
            replace: true,
          })
        }
        onClearLocation={() =>
          setSearchParams(
            buildLocationSearchParams(normalizedSearchParams, { location: '' }),
            {
              replace: true,
            },
          )
        }
        stickyTop={74}
      />

      <Container
        maxWidth={false}
        sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, sm: 3 }, pt: 3 }}
      >
        <SearchResults
          tab={tab}
          sectionCount={sectionCount}
          filteredEvents={filteredEvents}
          filteredOpportunities={filteredOpportunities}
          eventCardOpportunityByEventId={eventCardOpportunityByEventId}
          matchedOpportunityNeedIds={matchedOpportunityNeedIds}
          isFeedLoading={isFeedLoading}
          isOpportunitiesLoading={isOpportunitiesLoading}
          isAuthenticated={isAuthenticated}
          onEventClick={(eventId) => navigate(`/events/${eventId}`)}
          onOpportunityClick={(eventId) => navigate(`/events/${eventId}`)}
          onSignIn={() => navigate('/signin')}
        />
      </Container>
    </Box>
  );
}
