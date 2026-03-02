/** Home Page — Netflix style event-centric feed with multiple horizontal scrolling lists. */

import { CalendarDays, LocateFixed, User, Briefcase } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { HeroSection } from '@/features/events/HeroSection';
import { HorizontalEventList } from '@/features/events/HorizontalEventList';
import { useFeed, useCategories, useRecentlyViewed, useHighlightsFeed, useUpcomingFeed, useIconicHostsFeed, useTopVendorsFeed } from '@/features/events/hooks';
import { useRequests } from '@/features/requests/hooks';
import {
  canUseBrowserGeolocation,
  getCurrentCoordinates,
} from '@/utils/geolocation';
import { Media } from '@/components/ui/media';

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') || '';

  const [weekendOnly, setWeekendOnly] = useState(false);
  const [nearYouEnabled, setNearYouEnabled] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const { data: categoriesResponse } = useCategories();
  const categories = categoriesResponse?.data || [];

  // For the UI rewrite, we will use the generic feed for multiple rows 
  // with varying parameters to approximate the content, since dedicated endpoints don't exist yet.

  const { data: searchFeed, isLoading: isLoadingSearch } = useFeed({ search: search || undefined });

  const { data: trendingFeed, isLoading: isLoadingTrending } = useFeed({ sort: 'trending', weekend: weekendOnly || undefined });
  const { data: nearYouFeed, isLoading: isLoadingNearYou } = useFeed({
    lat: nearYouEnabled && coords ? coords.lat : undefined,
    lng: nearYouEnabled && coords ? coords.lng : undefined,
    radius_km: nearYouEnabled ? 25 : undefined,
    weekend: weekendOnly || undefined,
  });

  // Dedicated endpoints
  const { data: highlightsFeedResponse, isLoading: isLoadingHighlights } = useHighlightsFeed();
  const { data: upcomingFeedResponse, isLoading: isLoadingUpcoming } = useUpcomingFeed();
  const { data: recentlyViewedResponse, isLoading: isLoadingRecentlyViewed } = useRecentlyViewed();

  const { data: thisWeekFeed, isLoading: isLoadingThisWeek } = useFeed({ sort: 'newest', weekend: true });

  const { data: iconicHostsResponse } = useIconicHostsFeed();
  const iconicHosts = iconicHostsResponse?.data || [];

  const { data: topVendorsResponse } = useTopVendorsFeed();
  const topVendors = topVendorsResponse?.data || [];

  const { data: trendingRequestsResponse } = useRequests({ sort: 'trending', page: 1, page_size: 10 });
  const trendingRequests = trendingRequestsResponse?.data || [];

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
      toast.error('Could not fetch your location right now.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  return (
    <div className="pb-12 bg-background">
      {/* Hero Section */}
      <section className="pt-6 pb-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HeroSection />

        {/* Quick Filters */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={toggleNearYou}
            disabled={isDetectingLocation}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${nearYouEnabled
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/50 text-foreground hover:bg-muted'
              }`}
          >
            <LocateFixed className="h-4 w-4" />
            {isDetectingLocation ? 'Locating...' : 'Near You'}
          </button>
          <button
            onClick={() => setWeekendOnly((value) => !value)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${weekendOnly
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/50 text-foreground hover:bg-muted'
              }`}
          >
            <CalendarDays className="h-4 w-4" />
            This Weekend
          </button>
        </div>
      </section>

      {/* Main Content */}
      <div className="space-y-6 mt-4">

        {search && (
          <HorizontalEventList
            title={`Search Results for "${search}"`}
            events={searchFeed?.data || []}
            isLoading={isLoadingSearch}
            emptyMessage="No exact matches found."
          />
        )}

        {/* Trending Events */}
        <HorizontalEventList
          title="🔥 Trending Events"
          events={trendingFeed?.data || []}
          isLoading={isLoadingTrending}
        />

        {/* Nearby Events */}
        {nearYouEnabled ? (
          <HorizontalEventList
            title="📍 Near You"
            events={nearYouFeed?.data || []}
            isLoading={isLoadingNearYou}
          />
        ) : (
          <section className="py-4">
            <div className="mb-3 px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground">📍 Near You</h2>
            </div>
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed bg-muted/30 text-center">
                <LocateFixed className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Discover local events</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Enable location services to see the best experiences happening around you right now.
                </p>
                <button
                  onClick={toggleNearYou}
                  disabled={isDetectingLocation}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-sm"
                >
                  <LocateFixed className="h-4 w-4" />
                  {isDetectingLocation ? 'Detecting...' : 'Enable Location'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Popular Recent Events Completed - Highlights & Rewinds */}
        <HorizontalEventList
          title="📸 Highlights & Rewinds"
          events={highlightsFeedResponse?.data || []}
          isLoading={isLoadingHighlights}
          cardWidth="w-[320px] sm:w-[420px]"
        />

        {/* Popular Hosts */}
        {iconicHosts.length > 0 && (
          <section className="py-4">
            <div className="mb-3 px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">🌟 Iconic Hosts This Week</h2>
              <p className="text-sm text-muted-foreground mt-1">Discover the creators throwing the best parties right now.</p>
            </div>
            <div className="flex gap-8 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4 pt-4 hide-scrollbar snap-x snap-mandatory">
              {iconicHosts.map((host: any) => (
                <div key={host.id} className="flex flex-col items-center gap-3 flex-none snap-start group cursor-pointer w-28 sm:w-32">
                  <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-gradient-to-tr from-primary via-primary/60 to-background p-1 shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
                    <div className="h-full w-full rounded-full bg-card border-[3px] border-background flex items-center justify-center overflow-hidden relative">
                      <Media
                        src={host.avatar || `https://i.pravatar.cc/150?u=${host.id}`}
                        alt={host.username}
                        className="h-full w-full object-cover transition-all opacity-80 group-hover:opacity-100 duration-500 relative z-10"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground leading-tight line-clamp-1">{host.username}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 flex justify-center gap-1">
                      ⭐ {host.avg_rating ? host.avg_rating.toFixed(1) : 'New'} ({host.review_count || 0})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Popular Events Upcoming */}
        <HorizontalEventList
          title="✨ Popular Upcoming"
          events={upcomingFeedResponse?.data || []}
          isLoading={isLoadingUpcoming}
        />

        {/* Wishlists (Requests) */}
        {trendingRequests.length > 0 && (
          <section className="py-4 bg-muted/30">
            <div className="mb-3 flex items-center justify-between px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground">✨ Wishlisted Experiences</h2>
              <Link to="/requests" className="text-sm font-medium text-primary hover:underline transition-all">
                See all
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4 pt-1 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {trendingRequests.map((request) => (
                <Link
                  key={request.id}
                  to={`/requests/${request.id}`}
                  className="w-[280px] sm:w-[320px] flex-none snap-start rounded-xl border bg-card p-5 transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  <p className="line-clamp-2 font-semibold text-foreground text-lg">{request.title}</p>
                  <p className="mt-2 text-sm text-foreground/80 line-clamp-3 leading-relaxed">
                    "{request.description}"
                  </p>
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-primary px-2 py-1 bg-primary/10 rounded-full">▲ {request.upvote_count} Upvotes</span>
                    {request.location_city && <span>📍 {request.location_city}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* This Week Events */}
        <HorizontalEventList
          title="📅 Happening This Week"
          events={thisWeekFeed?.data || []}
          isLoading={isLoadingThisWeek}
        />

        {/* Recently Viewed Events */}
        <HorizontalEventList
          title="👁️ Resume Exploring"
          events={recentlyViewedResponse?.data || []}
          isLoading={isLoadingRecentlyViewed}
          emptyMessage="Browse some events to start building your history!"
        />

        {/* Popular Vendors */}
        {topVendors.length > 0 && (
          <section className="py-4">
            <div className="mb-3 px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">🛠️ Top Rated Vendors</h2>
              <p className="text-sm text-muted-foreground mt-1">Book the best services for your next event.</p>
            </div>
            <div className="flex gap-5 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4 pt-2 snap-x snap-mandatory hide-scrollbar">
              {topVendors.map((vendor: any) => (
                <div key={vendor.id} className="w-[260px] flex-none snap-start rounded-2xl border bg-card p-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between">
                  <div>
                    <div className="h-32 w-full rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4 overflow-hidden relative">
                      {vendor.portfolio_image ? (
                        <Media src={vendor.portfolio_image} alt={vendor.title} className="h-full w-full object-cover z-10" loading="lazy" />
                      ) : (
                        <Briefcase className="h-10 w-10 text-muted-foreground/30 absolute z-0" />
                      )}
                    </div>
                    <h3 className="font-bold text-base line-clamp-1">{vendor.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{vendor.description}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md text-foreground line-clamp-1">{vendor.category || 'Service'}</span>
                    <span className="text-xs font-semibold text-primary ml-auto flex items-center">
                      ⭐ {vendor.avg_rating ? vendor.avg_rating.toFixed(1) : 'New'} ({vendor.event_count || 0} events)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Category Lists */}
        {categories.slice(0, 5).map((category) => (
          <HorizontalEventList
            key={category.id}
            title={`${category.icon || '📌'} ${category.name} Events`}
            events={(trendingFeed?.data || []).filter(e => e.category?.id === category.id)}
            isLoading={isLoadingTrending}
          />
        ))}

      </div>
    </div>
  );
}
