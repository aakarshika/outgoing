import { Box, Button, Stack, Typography } from '@mui/material';
import { LocateFixed, MapPin, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { VendorBusinessCard } from '@/components/ui/VendorBusinessCard';
import {
  useFeed,
  useTopVendorsFeed,
  useTrendingHighlights,
} from '@/features/events/hooks';
import { HorizontalScrapbookList } from '@/features/events/HorizontalScrapbookList';
import { HeroNegativeStripGallery } from '@/pages/events/components/HeroNegativeStripGallery';
import type { LocationSuggestion } from '@/utils/geolocation';
import { searchLocation } from '@/utils/geolocation';
import { useDebouncedValue } from '@/utils/useDebouncedValue';
import { useNearYou } from '@/utils/useNearYou';

export type FeedTab = 'relevant' | 'trending' | 'nearby';
export type OnlineTab = 'online' | 'offline';
export type UserTab = 'going' | 'saved';

function buildNoPinOsmEmbedUrl(lat: number, lng: number) {
  const delta = 0.0075;
  const left = lng - delta;
  const right = lng + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  const bbox = `${left},${bottom},${right},${top}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik`;
}

function EmptyComicCard({
  title,
  description,
  actionLabel,
  actionTo,
  tone = 'warm',
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  tone?: 'warm' | 'cool';
}) {
  const palette =
    tone === 'cool'
      ? { bg: '#e0f2fe', border: '#1e3a8a', shadow: '#1e3a8a' }
      : { bg: '#fff7ed', border: '#1a1a1a', shadow: '#1a1a1a' };

  return (
    <Box
      sx={{
        maxWidth: 520,
        mx: 'auto',
        my: 2,
        px: 3,
        py: 3,
        bgcolor: palette.bg,
        border: `2px solid ${palette.border}`,
        boxShadow: `5px 5px 0 ${palette.shadow}`,
        transform: 'rotate(-0.5deg)',
        textAlign: 'center',
      }}
    >
      <Typography sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.15rem', mb: 1 }}>
        {title}
      </Typography>
      <Typography
        sx={{ fontFamily: 'serif', color: '#374151', mb: actionLabel ? 2 : 0 }}
      >
        {description}
      </Typography>
      {actionLabel && actionTo ? (
        <Button
          component={Link}
          to={actionTo}
          sx={{
            textTransform: 'none',
            fontFamily: '"Permanent Marker"',
            color: '#1a1a1a',
            border: '2px solid #1a1a1a',
            bgcolor: '#f8c163',
            '&:hover': { bgcolor: '#fbbf24' },
          }}
        >
          {actionLabel}
        </Button>
      ) : null}
    </Box>
  );
}

export const FilterChip = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <Button
    onClick={onClick}
    variant={active ? 'contained' : 'text'}
    sx={{
      textTransform: 'none',
      fontFamily: 'serif',
      borderRadius: '999px',
      px: 2,
      py: 0.75,
      minWidth: 0,
      color: active ? '#1a1a1a' : '#4b5563',
      bgcolor: active ? '#f8c163' : 'transparent',
      border: active ? '2px solid #1a1a1a' : '1px dashed #9ca3af',
      boxShadow: active ? '2px 2px 0 #1a1a1a' : 'none',
      '&:hover': {
        bgcolor: active ? '#fbbf24' : 'rgba(0,0,0,0.04)',
      },
    }}
  >
    {label}
  </Button>
);

export function SectionHeader({
  title,
  onBrowseAll,
  tabs,
}: {
  title: string;
  onBrowseAll?: () => void;
  tabs: React.ReactNode;
}) {
  return (
    <Box sx={{ px: { xs: 2, sm: 4, lg: 8 }, pb: 1 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.5}
      >
        <Typography sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.3rem' }}>
          {title}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {tabs}
          {onBrowseAll ? (
            <Button
              onClick={onBrowseAll}
              sx={{
                textTransform: 'none',
                color: '#1a1a1a',
                fontFamily: 'serif',
                textDecoration: 'underline',
              }}
            >
              Browse all
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
}

export function RelevantTrendingNearbySection({ title }: { title: string }) {
  const [tab, setTab] = useState<FeedTab>('relevant');
  const navigate = useNavigate();
  const { enabled, coords } = useNearYou();

  const params = useMemo(() => {
    if (tab === 'trending') return { sort: 'trending' as const };
    if (tab === 'nearby') {
      return {
        lat: enabled && coords ? coords.lat : undefined,
        lng: enabled && coords ? coords.lng : undefined,
      };
    }
    return {};
  }, [tab, enabled, coords]);

  const { data, isLoading } = useFeed(params);
  const noNearbyAccess = tab === 'nearby' && (!enabled || !coords);

  return (
    <Box sx={{ py: 1 }}>
      <SectionHeader
        title={title}
        onBrowseAll={() => navigate('/search/')}
        tabs={
          <>
            <FilterChip
              label="Relevant"
              active={tab === 'relevant'}
              onClick={() => setTab('relevant')}
            />
            <FilterChip
              label="Trending"
              active={tab === 'trending'}
              onClick={() => setTab('trending')}
            />
            <FilterChip
              label="Nearby"
              active={tab === 'nearby'}
              onClick={() => setTab('nearby')}
            />
          </>
        }
      />
      <HorizontalScrapbookList
        events={noNearbyAccess ? [] : data?.data || []}
        isLoading={isLoading}
        emptyMessage={
          noNearbyAccess ? (
            <EmptyComicCard
              title="Location Needed"
              description="Enable location to view nearby events in this section."
              actionLabel="Browse Online"
              actionTo="/search/"
            />
          ) : (
            <EmptyComicCard
              title="Nothing Here Yet"
              description="No events found for this filter right now."
            />
          )
        }
      />
    </Box>
  );
}

export function OnlineOfflineSection() {
  const [tab, setTab] = useState<OnlineTab>('online');
  const navigate = useNavigate();
  const { enabled } = useNearYou();
  const { data: onlineData, isLoading: loadingOnline } = useFeed({ online: true });
  const { data: allData, isLoading: loadingAll } = useFeed({});

  const offlineEvents = useMemo(
    () =>
      (allData?.data || []).filter(
        (event: any) => event.location_address !== 'Online Event',
      ),
    [allData],
  );

  const needsLocationConsent = tab === 'offline' && !enabled;
  const events = needsLocationConsent
    ? []
    : tab === 'online'
      ? onlineData?.data || []
      : offlineEvents;
  const isLoading = tab === 'online' ? loadingOnline : loadingAll;

  return (
    <Box sx={{ py: 1 }}>
      <SectionHeader
        title="Online / Offline"
        onBrowseAll={() => navigate('/search/')}
        tabs={
          <>
            <FilterChip
              label="Online"
              active={tab === 'online'}
              onClick={() => setTab('online')}
            />
            <FilterChip
              label="Offline"
              active={tab === 'offline'}
              onClick={() => setTab('offline')}
            />
          </>
        }
      />
      <HorizontalScrapbookList
        events={events}
        isLoading={isLoading}
        emptyMessage={
          needsLocationConsent ? (
            <EmptyComicCard
              title="Offline Needs Location"
              description="Allow location to discover nearby offline events."
              tone="cool"
            />
          ) : tab === 'offline' ? (
            <EmptyComicCard
              title="No Offline Events"
              description="No offline events found right now."
              tone="cool"
            />
          ) : (
            <EmptyComicCard
              title="No Online Sessions"
              description="No online sessions are scheduled right now."
              tone="cool"
            />
          )
        }
      />
    </Box>
  );
}

export function GoingSavedSection({
  isAuthenticated,
  goingEvents,
  savedEvents,
  loadingGoing,
  loadingSaved,
}: {
  isAuthenticated: boolean;
  goingEvents: any[];
  savedEvents: any[];
  loadingGoing: boolean;
  loadingSaved: boolean;
}) {
  const [tab, setTab] = useState<UserTab>('going');
  const events = tab === 'going' ? goingEvents : savedEvents;
  const isLoading = tab === 'going' ? loadingGoing : loadingSaved;
  const emptyMessage =
    tab === 'going'
      ? 'start browsing to find what to do'
      : 'Your likes and save the dates will appear here.';

  return (
    <Box sx={{ py: 1 }}>
      <SectionHeader
        title="My Going / Saved"
        tabs={
          <>
            <FilterChip
              label="Going"
              active={tab === 'going'}
              onClick={() => setTab('going')}
            />
            <FilterChip
              label="Saved"
              active={tab === 'saved'}
              onClick={() => setTab('saved')}
            />
          </>
        }
      />
      <HorizontalScrapbookList
        events={isAuthenticated ? events : []}
        isLoading={isAuthenticated ? isLoading : false}
        emptyMessage={
          <EmptyComicCard
            title={tab === 'going' ? 'No Plans Yet' : 'No Saved Events Yet'}
            description={emptyMessage}
            actionLabel="Explore Events"
            actionTo="/search/"
          />
        }
      />
    </Box>
  );
}

export function HostingAndGigsCardsSection() {
  return (
    <Box sx={{ px: { xs: 2, sm: 4, lg: 8 }, py: 4 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Box
          component={Link}
          to="/dashboard/events"
          sx={{
            flex: 1,
            textDecoration: 'none',
            color: '#1a1a1a',
            border: '2px solid #1a1a1a',
            borderRadius: 2,
            p: 3,
            bgcolor: '#f8c163',
            transform: 'rotate(-0.5deg)',
          }}
        >
          <Typography
            sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.3rem', mb: 1 }}
          >
            Start Hosting
          </Typography>
          <Typography sx={{ fontFamily: 'serif' }}>
            Build your next event and manage it from your dashboard.
          </Typography>
        </Box>
        <Box
          component={Link}
          to="/dashboard/services/opportunities"
          sx={{
            flex: 1,
            textDecoration: 'none',
            color: '#1a1a1a',
            border: '2px solid #1a1a1a',
            borderRadius: 2,
            p: 3,
            bgcolor: '#93c5fd',
            transform: 'rotate(0.5deg)',
          }}
        >
          <Typography
            sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.3rem', mb: 1 }}
          >
            Find Gigs
          </Typography>
          <Typography sx={{ fontFamily: 'serif' }}>
            Explore service opportunities and connect with hosts.
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

export function MapPlaceholderSection() {
  const {
    enabled,
    coords,
    toggleLocation,
    isDetecting,
    locationName,
    radiusMiles,
    setRadiusMiles,
  } = useNearYou();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isMapInteractive, setIsMapInteractive] = useState(false);
  const [locationSearch, setLocationSearch] = useState(
    searchParams.get('location') || '',
  );
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>(
    [],
  );
  const debouncedLocationSearch = useDebouncedValue(locationSearch, 300);

  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const parsedLat = latParam ? Number.parseFloat(latParam) : Number.NaN;
  const parsedLng = lngParam ? Number.parseFloat(lngParam) : Number.NaN;
  const mapLat = Number.isFinite(parsedLat) ? parsedLat : coords?.lat;
  const mapLng = Number.isFinite(parsedLng) ? parsedLng : coords?.lng;

  useEffect(() => {
    const locationFromParams = searchParams.get('location') || '';
    if (locationFromParams) {
      setLocationSearch(locationFromParams);
      return;
    }
    if (!locationSearch && enabled && locationName) {
      setLocationSearch(locationName);
    }
  }, [searchParams, enabled, locationName, locationSearch]);

  useEffect(() => {
    let active = true;
    if (debouncedLocationSearch.trim().length < 3 || enabled) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }
    searchLocation(debouncedLocationSearch).then((results) => {
      if (!active) return;
      setLocationSuggestions(results);
      setShowLocationSuggestions(results.length > 0);
    });
    return () => {
      active = false;
    };
  }, [debouncedLocationSearch, enabled]);

  const applyLocationParams = (
    nextLocation: string,
    nextLat?: string,
    nextLng?: string,
  ) => {
    const params = new URLSearchParams(window.location.search);
    const trimmedLocation = nextLocation.trim();
    if (trimmedLocation) {
      params.set('location', trimmedLocation);
      params.set('radius_miles', String(radiusMiles));
    } else {
      params.delete('location');
      params.delete('radius_miles');
    }
    if (nextLat && nextLng) {
      params.set('lat', nextLat);
      params.set('lng', nextLng);
    } else if (enabled && coords) {
      params.set('lat', String(coords.lat));
      params.set('lng', String(coords.lng));
    } else {
      params.delete('lat');
      params.delete('lng');
    }
    navigate(`/?${params.toString()}`);
  };

  if (!Number.isFinite(mapLat) || !Number.isFinite(mapLng)) {
    return (
      <Box
        sx={{
          px: { xs: 0, sm: 4, lg: 8 },
          py: 4,
        }}
      >
        <Box
          sx={{
            mx: { xs: 0, sm: 2, lg: 0 },
            border: { xs: 'none', sm: '3px solid #1a1a1a' },
            borderRadius: { xs: 0, sm: 2 },
            p: { xs: 2, sm: 3 },
            bgcolor: '#fff7ed',
            transform: { xs: 'none', sm: 'rotate(-0.4deg)' },
            boxShadow: { xs: 'none', sm: '6px 6px 0 #1a1a1a' },
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.2rem', mb: 1 }}
          >
            Nearby Event Map
          </Typography>
          <Typography sx={{ fontFamily: 'serif', color: '#4b5563', mb: 2 }}>
            Enable location to view your current area on the map.
          </Typography>
          <Button
            onClick={() => {
              toggleLocation();
              if (locationSearch.trim()) {
                applyLocationParams(locationSearch);
              }
            }}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontFamily: '"Permanent Marker"',
              bgcolor: '#3b82f6',
              color: '#fff',
              border: '2px solid #1a1a1a',
              boxShadow: '3px 3px 0 #1a1a1a',
              '&:hover': { bgcolor: '#2563eb' },
            }}
          >
            {isDetecting ? 'Detecting location...' : 'Enable Location'}
          </Button>
        </Box>
      </Box>
    );
  }

  const resolvedMapLat = mapLat as number;
  const resolvedMapLng = mapLng as number;
  const embedUrl = buildNoPinOsmEmbedUrl(resolvedMapLat, resolvedMapLng);

  return (
    <Box
      sx={{
        px: { xs: 0, sm: 4, lg: 8 },
        py: 4,
      }}
    >
      <Box
        sx={{
          mx: { xs: 0, sm: 2, lg: 0 },
          border: { xs: 'none', sm: '3px solid #1a1a1a' },
          borderRadius: { xs: 0, sm: 2 },
          p: { xs: 0, sm: 0 },
          bgcolor: '#fff7ed',
          transform: { xs: 'none', sm: 'rotate(-0.4deg)' },
          boxShadow: { xs: 'none', sm: '6px 6px 0 #1a1a1a' },
          overflow: 'hidden',
          position: 'relative',
          minHeight: { xs: 'auto', md: isMapInteractive ? 410 : 360 },
          display: { xs: 'block', md: isMapInteractive ? 'block' : 'flex' },
        }}
      >
        <Box
          sx={{
            position: {
              xs: 'relative',
              md: isMapInteractive ? 'absolute' : 'relative',
            },
            inset: { xs: 'auto', md: isMapInteractive ? 0 : 'auto' },
            width: { xs: '100%', md: isMapInteractive ? '100%' : '50%' },
            height: { xs: 'auto', md: isMapInteractive ? '100%' : 'auto' },
            zIndex: 1,
          }}
        >
          <Box
            component="iframe"
            title="Current location map"
            src={embedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            sx={{
              width: '100%',
              height: {
                xs: isMapInteractive ? 300 : 260,
                md: isMapInteractive ? 410 : 360,
              },
              border: 0,
              display: 'block',
              pointerEvents: isMapInteractive ? 'auto' : 'none',
            }}
          />
          {!isMapInteractive ? (
            <Box
              onClick={() => setIsMapInteractive(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setIsMapInteractive(true);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Enable map interaction"
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                touchAction: 'pan-y',
                bgcolor: 'rgba(0, 0, 0, 0.08)',
              }}
            >
              <Typography
                sx={{
                  px: 2.5,
                  py: 1,
                  borderRadius: 2,
                  fontFamily: '"Permanent Marker"',
                  fontSize: '0.9rem',
                  bgcolor: 'rgba(255,255,255,0.95)',
                  border: '1px solid rgba(0,0,0,0.2)',
                  color: '#1f2937',
                }}
              >
                Tap to enable map zoom
              </Typography>
            </Box>
          ) : null}
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              px: 1.5,
              py: 0.75,
              bgcolor: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(0,0,0,0.2)',
              borderRadius: 1,
              zIndex: 3,
            }}
          >
            <Typography sx={{ fontFamily: '"Permanent Marker"', fontSize: '0.85rem' }}>
              Current Location
            </Typography>
            <Typography
              sx={{ fontFamily: 'serif', color: '#4b5563', fontSize: '0.75rem' }}
            >
              {locationSearch || locationName || 'Near you'}
            </Typography>
          </Box>
          {isMapInteractive ? (
            <Button
              onClick={() => setIsMapInteractive(false)}
              sx={{
                position: 'absolute',
                right: 10,
                bottom: 10,
                zIndex: 3,
                textTransform: 'none',
                fontFamily: '"Permanent Marker"',
                fontSize: '0.75rem',
                minWidth: 'auto',
                px: 1.25,
                py: 0.5,
                color: '#1f2937',
                bgcolor: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(0,0,0,0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,1)',
                },
              }}
            >
              Lock Scroll
            </Button>
          ) : null}
        </Box>

        <Box
          sx={{
            width: { xs: '100%', md: isMapInteractive ? 'min(360px, 42%)' : '50%' },
            ml: { xs: 0, md: isMapInteractive ? 'auto' : 0 },
            p: { xs: 2, md: isMapInteractive ? 1.5 : 2.5 },
            position: {
              xs: 'relative',
              md: isMapInteractive ? 'absolute' : 'relative',
            },
            top: { xs: 'auto', md: isMapInteractive ? 12 : 'auto' },
            right: { xs: 'auto', md: isMapInteractive ? 12 : 'auto' },
            zIndex: 4,
            bgcolor: isMapInteractive ? 'rgba(255, 247, 237, 0.72)' : '#fff7ed',
            backdropFilter: isMapInteractive ? 'blur(8px)' : 'none',
            borderLeft: {
              xs: 'none',
              md: isMapInteractive ? 'none' : '1px dashed rgba(26,26,26,0.2)',
            },
            border: isMapInteractive ? '1px solid rgba(26,26,26,0.25)' : 'none',
            borderRadius: isMapInteractive ? 1.5 : 0,
            boxShadow: isMapInteractive ? '4px 4px 0 rgba(26,26,26,0.35)' : 'none',
            maxHeight: { xs: 'none', md: isMapInteractive ? 300 : 'none' },
            overflowY: { xs: 'visible', md: isMapInteractive ? 'auto' : 'visible' },
          }}
        >
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Box
              component="input"
              value={locationSearch}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setLocationSearch(event.target.value);
                if (enabled && event.target.value.trim()) {
                  toggleLocation();
                }
              }}
              onFocus={() => {
                if (locationSuggestions.length > 0) setShowLocationSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 180)}
              placeholder="City or address..."
              sx={{
                width: '100%',
                border: '2px solid #1a1a1a',
                boxShadow: '2px 2px 0 #1a1a1a',
                px: 1.5,
                py: 1.1,
                fontFamily: '"Permanent Marker"',
                fontSize: '0.95rem',
                outline: 'none',
                bgcolor: '#fff',
              }}
            />
            {showLocationSuggestions && locationSuggestions.length > 0 ? (
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 'calc(100% + 6px)',
                  border: '2px solid #1a1a1a',
                  boxShadow: '3px 3px 0 #1a1a1a',
                  bgcolor: '#fff',
                  zIndex: 7,
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {locationSuggestions.map((suggestion) => (
                  <Box
                    key={suggestion.place_id}
                    component="button"
                    type="button"
                    onMouseDown={(event: React.MouseEvent) => event.preventDefault()}
                    onClick={() => {
                      setLocationSearch(suggestion.display_name);
                      setShowLocationSuggestions(false);
                      applyLocationParams(
                        suggestion.display_name,
                        suggestion.lat,
                        suggestion.lon,
                      );
                    }}
                    sx={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      textAlign: 'left',
                      px: 1.5,
                      py: 1,
                      border: 'none',
                      borderBottom: '1px dashed rgba(107,114,128,0.4)',
                      bgcolor: '#fff',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#fef3c7' },
                      '&:last-of-type': { borderBottom: 'none' },
                    }}
                  >
                    <Search size={14} style={{ marginTop: 2 }} />
                    <Typography
                      sx={{
                        fontFamily: '"Permanent Marker"',
                        fontSize: '0.82rem',
                        lineHeight: 1.3,
                      }}
                    >
                      {suggestion.display_name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : null}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Button
              onClick={() => {
                toggleLocation();
                setShowLocationSuggestions(false);
                if (enabled) {
                  applyLocationParams(locationSearch);
                } else if (coords) {
                  applyLocationParams(
                    locationName || locationSearch,
                    String(coords.lat),
                    String(coords.lng),
                  );
                }
              }}
              sx={{
                textTransform: 'none',
                fontFamily: '"Permanent Marker"',
                color: '#111827',
                border: '2px solid #1a1a1a',
                boxShadow: '2px 2px 0 #1a1a1a',
                bgcolor: '#fecaca',
                '&:hover': { bgcolor: '#fca5a5' },
              }}
            >
              <LocateFixed size={16} />
            </Button>
            <Box
              component="input"
              type="number"
              min={1}
              max={500}
              value={radiusMiles}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                const value = Number.parseInt(event.target.value, 10);
                if (!Number.isNaN(value)) {
                  setRadiusMiles(value);
                }
              }}
              sx={{
                width: 84,
                border: '2px solid #1a1a1a',
                boxShadow: '2px 2px 0 #1a1a1a',
                px: 1,
                py: 1,
                fontFamily: '"Permanent Marker"',
                fontSize: '0.9rem',
                outline: 'none',
                bgcolor: '#fff',
              }}
            />
            <Typography
              sx={{
                fontFamily: '"Permanent Marker"',
                color: '#4b5563',
                fontSize: '0.85rem',
              }}
            >
              miles
            </Typography>
            <Button
              onClick={() => applyLocationParams(locationSearch)}
              sx={{
                flex: 1,
                textTransform: 'none',
                fontFamily: '"Permanent Marker"',
                color: '#111827',
                border: '2px solid #1a1a1a',
                boxShadow: '2px 2px 0 #1a1a1a',
                bgcolor: '#fde68a',
                '&:hover': { bgcolor: '#fcd34d' },
              }}
            >
              <Search size={16} style={{ marginRight: 6 }} />
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export function MyEventsServicesSection({
  isAuthenticated,
  myEvents,
  myServices,
  loadingEvents,
  loadingServices,
}: {
  isAuthenticated: boolean;
  myEvents: any[];
  myServices: any[];
  loadingEvents: boolean;
  loadingServices: boolean;
}) {
  const [tab, setTab] = useState<'events' | 'services'>('events');

  if (!isAuthenticated) return null;
  if (
    !loadingEvents &&
    !loadingServices &&
    myEvents.length === 0 &&
    myServices.length === 0
  ) {
    return null;
  }

  return (
    <Box sx={{ py: 1 }}>
      <SectionHeader
        title="Your Events / Your Services"
        tabs={
          <>
            <FilterChip
              label="Your Events"
              active={tab === 'events'}
              onClick={() => setTab('events')}
            />
            <FilterChip
              label="Your Services"
              active={tab === 'services'}
              onClick={() => setTab('services')}
            />
          </>
        }
      />
      {tab === 'events' ? (
        <HorizontalScrapbookList
          events={myEvents}
          isLoading={loadingEvents}
          emptyMessage={
            <EmptyComicCard
              title="No Hosted Events Yet"
              description="Your events will appear here once you create your first one."
              actionLabel="Go To Events"
              actionTo="/dashboard/events"
            />
          }
        />
      ) : (
        <HorizontalScrapbookList
          items={myServices}
          isLoading={loadingServices}
          renderItem={(service) => <VendorBusinessCard vendor={service} rotation={1} />}
          emptyMessage={
            <EmptyComicCard
              title="No Services Yet"
              description="Your services will appear here after you create one."
              actionLabel="Find Service Opportunities"
              actionTo="/dashboard/services/opportunities"
              tone="cool"
            />
          }
        />
      )}
    </Box>
  );
}

export function IconicVendorsSection() {
  const { data, isLoading } = useTopVendorsFeed();
  const services = data?.data || [];
  return (
    <HorizontalScrapbookList
      title="🏢 Iconic Vendors"
      items={services}
      isLoading={isLoading}
      renderItem={(service) => <VendorBusinessCard vendor={service} rotation={1} />}
      emptyMessage={
        <EmptyComicCard
          title="No Iconic Vendors Yet"
          description="Top vendors will appear here as services become active."
          tone="cool"
        />
      }
    />
  );
}

export function MemoriesPlaceholderSection() {
  return (
    <HorizontalScrapbookList
      title="Memories"
      events={[]}
      emptyMessage={
        <EmptyComicCard
          title="No Memories Yet"
          description="Your highlights and throwback moments will appear here."
          actionLabel="Go To Tickets"
          actionTo="/dashboard/tickets"
        />
      }
    />
  );
}

export function MemoriesFilmStripPlaceholderSection() {
  const { data, isLoading } = useTrendingHighlights(20);
  const highlights = data?.data || [];
  const images = highlights.map((h: any) => h.media_file).filter(Boolean);
  const host = {
    username: highlights[0]?.author_username || 'memories',
  };

  if (isLoading) {
    return (
      <Box sx={{ px: { xs: 2, sm: 4, lg: 8 }, py: 2 }}>
        <Box
          sx={{
            height: { xs: 220, md: 280 },
            border: '2px dashed #1a1a1a',
            bgcolor: '#ecfeff',
            transform: { xs: 'none', sm: 'rotate(0.8deg)' },
            boxShadow: { xs: 'none', sm: '4px 4px 0 #0f172a' },
          }}
        />
      </Box>
    );
  }

  if (!images.length) {
    return (
      <Box sx={{ px: { xs: 2, sm: 4, lg: 8 }, py: 2 }}>
        <MemoriesPlaceholderSection />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 0, sm: 2, lg: 4 }, py: 2 }}>
      <Box
        sx={{
          mx: { xs: -1, sm: 0 },
          perspective: '1000px',
          overflow: 'visible',
          filter: 'hue-rotate(20deg) saturate(1.1)',
        }}
      >
        <Box
          sx={{
            transform: 'rotateY(15deg) rotateX(-4deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          <HeroNegativeStripGallery
            images={images}
            title="Memories"
            host={host}
            categorySlug="social"
          />
        </Box>
      </Box>
    </Box>
  );
}

export function PrimaryHighlightsStripSection() {
  const { data, isLoading } = useTrendingHighlights(20);
  const highlights = data?.data || [];
  const images = highlights.map((h: any) => h.media_file).filter(Boolean);
  const host = {
    username: highlights[0]?.author_username || 'host',
  };

  if (isLoading || !images.length) return null;

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
        <HeroNegativeStripGallery images={images} title="✨ Highlights" host={host} />
      </Box>
    </Box>
  );
}
