/** Home Page — Netflix style event-centric feed with multiple horizontal scrolling lists. */

import { CalendarDays, LocateFixed } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { BedroomHeroCarousel } from '@/features/events/BedroomHeroCarousel';
import { HorizontalScrapbookList } from '@/features/events/HorizontalScrapbookList';
import { useFeed, useCategories, useRecentlyViewed, useHighlightsFeed, useUpcomingFeed, useIconicHostsFeed, useTopVendorsFeed } from '@/features/events/hooks';
import { useRequests } from '@/features/requests/hooks';
import { canUseBrowserGeolocation, getCurrentCoordinates } from '@/utils/geolocation';
import { VendorBusinessCard } from '@/components/ui/VendorBusinessCard';
import { HostCard } from '@/components/ui/HostCard';
import { ThemeProvider } from '@mui/material/styles';
import { scrapbookTheme } from '@/features/events/theme/scrapbookTheme';
import { CATEGORY_ICON_MAP } from '@/features/events/constants';
import { Box, Typography } from '@mui/material';

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const navigate = useNavigate();

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
    <ThemeProvider theme={scrapbookTheme}>
      <Box sx={{
        minHeight: '100vh',
        overflowX: 'hidden',
        bgcolor: '#f4f1ea', // Off-white/beige scrapbook base
        backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px), radial-gradient(#d1d5db 0.5px, #f4f1ea 0.5px)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px',
        pb: 12,
        color: '#1a1a1a'
      }}>
        {/* Hero Section */}
        <section className="pt-6 pb-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BedroomHeroCarousel />

          {/* Quick Filters */}
          <Box sx={{ mt: 6, display: 'flex', gap: 3, flexWrap: 'wrap', px: { xs: 2, sm: 0 } }}>
            <Box
              onClick={toggleNearYou}
              sx={{
                position: 'relative',
                px: 3, py: 1.5,
                bgcolor: nearYouEnabled ? '#fcd34d' : '#fff', // yellow if active, white otherwise
                border: '2px solid #333',
                boxShadow: nearYouEnabled ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : '3px 4px 0px #333',
                transform: nearYouEnabled ? 'translate(3px, 4px) rotate(-2deg)' : 'rotate(-2deg)',
                cursor: isDetectingLocation ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 1,
                transition: 'all 0.1s ease',
                fontFamily: '"Permanent Marker"',
                '&:hover': { transform: nearYouEnabled ? 'translate(3px, 4px) rotate(-2deg)' : 'translate(1px, 2px) rotate(-2deg)', boxShadow: nearYouEnabled ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : '2px 2px 0px #333' }
              }}
            >
              <Box sx={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%) rotate(5deg)', width: 40, height: 16, bgcolor: 'rgba(59, 130, 246, 0.4)' }} />
              <LocateFixed size={18} />
              <Typography sx={{ fontFamily: 'inherit' }}>{isDetectingLocation ? 'Locating...' : 'Near You'}</Typography>
            </Box>

            <Box
              onClick={() => setWeekendOnly((value) => !value)}
              sx={{
                position: 'relative',
                px: 3, py: 1.5,
                bgcolor: weekendOnly ? '#fcd34d' : '#fff',
                border: '2px solid #333',
                boxShadow: weekendOnly ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : '3px 4px 0px #333',
                transform: weekendOnly ? 'translate(3px, 4px) rotate(2deg)' : 'rotate(2deg)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 1,
                transition: 'all 0.1s ease',
                fontFamily: '"Permanent Marker"',
                '&:hover': { transform: weekendOnly ? 'translate(3px, 4px) rotate(2deg)' : 'translate(1px, 2px) rotate(2deg)', boxShadow: weekendOnly ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : '2px 2px 0px #333' }
              }}
            >
              <Box sx={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%) rotate(-4deg)', width: 40, height: 16, bgcolor: 'rgba(239, 68, 68, 0.4)' }} />
              <CalendarDays size={18} />
              <Typography sx={{ fontFamily: 'inherit' }}>This Weekend</Typography>
            </Box>
          </Box>
        </section>

        {/* Main Content */}
        <div className="space-y-8 mt-8">

          {/* Onboarding / CTAs */}
          <Box sx={{ px: { xs: 2, sm: 4, lg: 8 }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, my: 6 }}>
            {/* Host CTA - Polaroid Style */}
            <Box component={Link} to="/events/create" sx={{
              flex: 1, textDecoration: 'none', color: 'inherit',
              p: 2, pb: 4, bgcolor: '#fff', border: '1px solid #e5e7eb', boxShadow: '2px 4px 12px rgba(0,0,0,0.1)',
              transform: 'rotate(-2deg)', transition: 'all 0.3s ease',
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
              '&:hover': { transform: 'scale(1.02) rotate(0deg)', zIndex: 10, boxShadow: '4px 8px 24px rgba(0,0,0,0.15)' }
            }}>
              <Box sx={{ width: '100%', height: 160, bgcolor: '#f3f4f6', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                {/* Pattern overlay */}
                <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.2\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }} />
                <Typography variant="h3" sx={{ position: 'relative', zIndex: 1 }}>🎉</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontFamily: '"Permanent Marker"', mb: 1 }}>Got an idea?</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'serif', maxWidth: '80%' }}>Turn your living room into the next big thing. Host your own event.</Typography>
            </Box>

            {/* Vendor CTA - Newspaper Ad Style */}
            <Box component={Link} to="/services/new" sx={{
              flex: 1, textDecoration: 'none', color: '#1a1a1a',
              p: 3, bgcolor: '#f1ede4',
              boxShadow: '3px 4px 12px rgba(0,0,0,0.15)',
              transform: 'rotate(2deg)', transition: 'all 0.3s ease', position: 'relative',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              border: '2px dashed #9ca3af',
              fontFamily: '"Times New Roman", Times, serif',
              '&:hover': { transform: 'scale(1.02) rotate(1deg)', zIndex: 10, boxShadow: '4px 8px 20px rgba(0,0,0,0.2)' }
            }}>
              <Box sx={{ border: '2px solid #1a1a1a', p: 3, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* Red circle annotation */}
                <Box sx={{ position: 'absolute', top: -10, left: -20, width: 60, height: 40, border: '3px solid #ef4444', borderRadius: '50%', opacity: 0.6, transform: 'rotate(15deg)', pointerEvents: 'none' }} />
                <Typography variant="h5" sx={{ fontFamily: 'inherit', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', mb: 2, borderBottom: '2px solid #1a1a1a', pb: 1, letterSpacing: '2px' }}>
                  Wanted: Talent
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'inherit', fontSize: '1.2rem', lineHeight: 1.4, textAlign: 'justify', mb: 2, fontStyle: 'italic' }}>
                  Are you a DJ, photographer, caterer, or decorator? The coolest parties in town are looking for your services.
                </Typography>
                <Box sx={{ mt: 'auto', alignSelf: 'center', bgcolor: '#1a1a1a', color: '#fff', px: 2, py: 0.5, transform: 'rotate(-2deg)' }}>
                  <Typography sx={{ fontFamily: '"Permanent Marker"', fontSize: '0.9rem' }}>Apply Within →</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {search && (
            <HorizontalScrapbookList
              title={`Search Results for "${search}"`}
              events={searchFeed?.data || []}
              isLoading={isLoadingSearch}
              emptyMessage="No exact matches found."
            />
          )}

          {/* Trending Events */}
          <HorizontalScrapbookList
            title="🔥 Trending Right Now"
            events={trendingFeed?.data || []}
            isLoading={isLoadingTrending}
          />

          {/* Nearby Events */}
          {nearYouEnabled && (
            <Box sx={{ position: 'relative', py: 2 }}>
              <Box sx={{ position: 'absolute', top: 20, right: 40, width: 100, height: 30, bgcolor: 'rgba(56, 189, 248, 0.4)', transform: 'rotate(5deg)', zIndex: 0 }} />
              <HorizontalScrapbookList
                title="📍 Near You"
                events={nearYouFeed?.data || []}
                isLoading={isLoadingNearYou}
              />
            </Box>
          )}
          {!nearYouEnabled && (
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
          <Box sx={{ position: 'relative', bgcolor: '#fffdf0', py: 4, my: 4, borderTop: '2px dashed #d1d5db', borderBottom: '2px dashed #d1d5db' }}>
            <Box sx={{ position: 'absolute', top: -15, left: '20%', width: 80, height: 40, bgcolor: 'rgba(239, 68, 68, 0.4)', transform: 'rotate(-4deg)' }} />
            <Box sx={{ px: { xs: 2, sm: 4, lg: 8 }, mb: -4 }}>
              <Typography variant="body2" sx={{ fontFamily: 'serif', fontStyle: 'italic', color: '#666' }}>Success Stories & Highlights</Typography>
            </Box>
            <HorizontalScrapbookList
              title="📸 Last Week's Memories"
              events={highlightsFeedResponse?.data || []}
              isLoading={isLoadingHighlights}
            />
          </Box>

          {/* Popular Hosts */}
          {iconicHosts.length > 0 && (
            <section className="py-8 relative bg-[#fdfaf6] border-y border-dashed border-gray-300">
              <Box sx={{ position: 'absolute', top: 40, right: '10%', width: 120, height: 30, bgcolor: 'rgba(16, 185, 129, 0.3)', transform: 'rotate(8deg)' }} />
              <div className="mb-6 px-4 sm:px-6 lg:px-8 relative z-10">
                <h2 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: '"Permanent Marker"' }}>🌟 Iconic Hosts</h2>
                <p className="text-sm font-serif text-muted-foreground mt-2 italic">Discover the creators throwing the best parties right now.</p>
              </div>
              <div className="flex gap-12 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-12 pt-8 hide-scrollbar snap-x snap-mandatory">
                {iconicHosts.map((host: any, index: number) => (
                  <div key={host.id}
                    onClick={() => navigate(`/user/${host.username}`)}
                    className="flex-none snap-start group cursor-pointer w-[280px]"
                  >
                    <HostCard
                      host={host}
                      rating={host.avg_rating || 0}
                      tag={host.review_count ? `${host.review_count} Reviews` : 'New Host'}
                      rotation={index % 2 === 0 ? 2 : -2}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Popular Events Upcoming */}
          <HorizontalScrapbookList
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
              <div className="flex gap-4 overflow-x-auto overflow-y-hidden px-4 sm:px-6 lg:px-8 pb-4 pt-1 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
          <HorizontalScrapbookList
            title="📅 Happening This Week"
            events={thisWeekFeed?.data || []}
            isLoading={isLoadingThisWeek}
          />

          {/* Recently Viewed Events */}
          <HorizontalScrapbookList
            title="👁️ Resume Exploring"
            events={recentlyViewedResponse?.data || []}
            isLoading={isLoadingRecentlyViewed}
            emptyMessage="Browse some events to start building your history!"
          />

          {/* Popular Vendors */}
          {/* Top Rated Vendors - Section Rewrite to Services */}
          <section className="py-8 bg-[#fdfaf6] border-y border-dashed border-gray-300">
            <div className="mb-6 px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900" style={{ fontFamily: '"Permanent Marker"' }}>
                🏢 Top Rated Services
              </h2>
              <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'serif' }}>
                The most reliable partners for your next big thing.
              </p>
            </div>
            <div className="flex gap-8 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-8 pt-2 snap-x snap-mandatory hide-scrollbar">
              <ThemeProvider theme={scrapbookTheme}>
                {topVendors.map((service: any, idx: number) => (
                  <div key={service.id} className="w-[320px] flex-none snap-start">
                    <Link to={`/services/${service.id}`} style={{ textDecoration: 'none' }}>
                      <VendorBusinessCard
                        vendor={service}
                        rotation={idx % 2 === 0 ? 1 : -1.5}
                      />
                    </Link>
                  </div>
                ))}
              </ThemeProvider>
            </div>
          </section>

          {/* Category Lists */}
          {categories.slice(0, 5).map((category) => (
            <HorizontalScrapbookList
              key={category.id}
              title={`${CATEGORY_ICON_MAP[category.icon] || '📌'} ${category.name} Events`}
              events={(trendingFeed?.data || []).filter(e => e.category?.id === category.id)}
              isLoading={isLoadingTrending}
            />
          ))}

        </div>
      </Box>
    </ThemeProvider>
  );
}
