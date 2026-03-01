/** Home Page — event-centric feed with Hero, Category Chips, and Event Cards. */

import { CalendarDays, LocateFixed, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { CategoryChips } from '@/features/events/CategoryChips';
import { EventCard } from '@/features/events/EventCard';
import { HeroSection } from '@/features/events/HeroSection';
import { useEventAutocomplete, useFeed } from '@/features/events/hooks';
import { useRequests } from '@/features/requests/hooks';
import {
  canUseBrowserGeolocation,
  getCurrentCoordinates,
} from '@/utils/geolocation';
import { useDebouncedValue } from '@/utils/useDebouncedValue';

type SortOption = 'trending' | 'newest' | 'popular';

const SORT_TABS: { key: SortOption; label: string }[] = [
  { key: 'trending', label: '🔥 Trending' },
  { key: 'newest', label: '✨ New' },
  { key: 'popular', label: '❤️ Popular' },
];

export default function HomePage() {
  const [category, setCategory] = useState<string | undefined>();
  const [sort, setSort] = useState<SortOption>('trending');
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [weekendOnly, setWeekendOnly] = useState(false);
  const [nearYouEnabled, setNearYouEnabled] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [page] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: response, isLoading } = useFeed({
    category,
    sort,
    page,
    search: debouncedSearch.trim() || undefined,
    weekend: weekendOnly || undefined,
    lat: nearYouEnabled && coords ? coords.lat : undefined,
    lng: nearYouEnabled && coords ? coords.lng : undefined,
    radius_km: nearYouEnabled ? 25 : undefined,
  });
  const { data: trendingRequestsResponse } = useRequests({
    sort: 'trending',
    page: 1,
    page_size: 4,
  });
  const events = response?.data || [];
  const trendingRequests = trendingRequestsResponse?.data || [];
  const { data: autocompleteResponse } = useEventAutocomplete(debouncedSearch);
  const suggestions = autocompleteResponse?.data || [];

  const toggleNearYou = async () => {
    if (nearYouEnabled) {
      setNearYouEnabled(false);
      return;
    }

    if (!canUseBrowserGeolocation()) {
      toast.error('Near You needs HTTPS in production. It works on localhost.');
      return;
    }

    setIsDetectingLocation(true);
    try {
      const current = await getCurrentCoordinates();
      setCoords({ lat: current.latitude, lng: current.longitude });
      setNearYouEnabled(true);
    } catch (err: any) {
      toast.error(
        err?.code === 1
          ? 'Location permission denied.'
          : 'Could not fetch your location right now.'
      );
    } finally {
      setIsDetectingLocation(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
      {/* Hero Section */}
      <section className="pt-6 pb-4">
        <HeroSection />
      </section>

      {/* Category Chips */}
      <section className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <CategoryChips selected={category} onSelect={setCategory} />
      </section>

      {/* Sort Tabs */}
      <section className="flex gap-2 pt-4 pb-2">
        {SORT_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSort(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
              ${sort === tab.key
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {/* Search + Quick Filters */}
      <section className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
            placeholder="Search events..."
            className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-30 mt-1 w-full rounded-lg border bg-card p-1 shadow-lg">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setSearch(suggestion.title);
                    setShowSuggestions(false);
                  }}
                  className="w-full rounded-md px-3 py-2 text-left hover:bg-muted"
                >
                  <p className="text-sm font-medium">{suggestion.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[suggestion.category_name, suggestion.location_name]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleNearYou}
            disabled={isDetectingLocation}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              nearYouEnabled
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <LocateFixed className="h-4 w-4" />
            {isDetectingLocation ? 'Locating...' : 'Near You'}
          </button>
          <button
            onClick={() => setWeekendOnly((value) => !value)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              weekendOnly
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            This Weekend
          </button>
        </div>
      </section>

      {/* Trending Requests */}
      {trendingRequests.length > 0 && (
        <section className="pt-4 pb-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Trending Requests</h2>
            <Link
              to="/requests"
              className="text-sm font-medium text-primary hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {trendingRequests.map((request) => (
              <Link
                key={request.id}
                to="/requests"
                className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"
              >
                <p className="line-clamp-1 font-medium text-foreground">{request.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {request.description}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>▲ {request.upvote_count}</span>
                  {request.location_city && <span>📍 {request.location_city}</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Events Feed */}
      <section className="pt-2">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden animate-pulse">
                <div className="aspect-[16/9] bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-5 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold text-foreground">No events yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {category
                ? 'No events in this category yet. Try another one!'
                : 'Be the first to create an event.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
