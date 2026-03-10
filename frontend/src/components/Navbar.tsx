import {
  ArrowLeft,
  Bell,
  Briefcase,
  Calendar,
  CalendarDays,
  FileEdit,
  LocateFixed,
  MapPin,
  Menu,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Settings,
  Shield,
  Ticket,
  User,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, matchPath, useLocation, useNavigate } from 'react-router-dom';

import { QuickCreateEventModal } from '@/components/events/QuickCreateEventModal';
import { Button } from '@/components/ui/button';
import { ComicButton } from '@/components/ui/ComicButton';
import { ComicIconButton } from '@/components/ui/ComicIconButton';
import { NavbarSidebar } from '@/components/NavbarSidebar';
import { useAlerts } from '@/features/alerts/hooks';
import { useAuth } from '@/features/auth/hooks';
import { useEvent, useEventAutocomplete } from '@/features/events/hooks';
import { canUseBrowserGeolocation } from '@/utils/geolocation';
import { type LocationSuggestion, searchLocation } from '@/utils/geolocation';
import { useDebouncedValue } from '@/utils/useDebouncedValue';
import { useNearYou } from '@/utils/useNearYou';

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  if (location.pathname.includes('/gallery/')) return null;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const {
    enabled: nearYouEnabled,
    coords,
    locationName: nearYouName,
    radiusMiles,
    setRadiusMiles,
    toggleLocation: toggleNearYou,
  } = useNearYou();
  const [search, setSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>(
    [],
  );
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nearYouEnabled) {
      setLocationSearch(nearYouName);
    }
  }, [nearYouEnabled, nearYouName]);

  // Ask Chrome for location permission on load when user is logged in (stays enabled for session)
  useEffect(() => {
    if (!isAuthenticated || !canUseBrowserGeolocation()) return;
    navigator.geolocation.getCurrentPosition(
      () => { },
      () => { },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    );
  }, [isAuthenticated]);

  // Close location dropdown on click outside
  useEffect(() => {
    if (!locationDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(e.target as Node)
      ) {
        setLocationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [locationDropdownOpen]);

  const navigate = useNavigate();
  const debouncedSearch = useDebouncedValue(search, 300);
  const debouncedLocationSearch = useDebouncedValue(locationSearch, 300);
  const { data: autocompleteResponse } = useEventAutocomplete(debouncedSearch);
  const suggestions = autocompleteResponse?.data || [];

  useEffect(() => {
    if (debouncedLocationSearch.length >= 3 && !nearYouEnabled) {
      searchLocation(debouncedLocationSearch).then((results) => {
        setLocationSuggestions(results);
        setShowLocationSuggestions(true);
      });
    } else {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }
  }, [debouncedLocationSearch, nearYouEnabled]);

  const { data: response } = useAlerts({ enabled: isAuthenticated });
  const alertsCount = response?.data?.length || 0;

  const eventManagementMatch =
    matchPath(
      { path: '/events/:id/host-event-management/*', end: false },
      location.pathname,
    ) ??
    matchPath(
      { path: '/events/:id/service-event-management/*', end: false },
      location.pathname,
    );
  const isEventManagementRoute = Boolean(eventManagementMatch);
  const eventMatch = matchPath(
    { path: '/events/:id/*', end: false },
    location.pathname,
  );
  const eventId = eventMatch?.params.id;
  const { data: eventResponse } = useEvent(Number(eventId));
  const event = eventResponse?.data;
  const { user } = useAuth();
  const isEventHost =
    isAuthenticated && user && event && user.username === event.host?.username;
  const isVendor =
    isAuthenticated &&
    user &&
    event &&
    !!(event.user_applications && event.user_applications.length > 0);
  const isNotOnManagePage = !location.pathname.includes('manage');
  const shouldShowSearch = location.pathname === '/';

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const params = new URLSearchParams(window.location.search);
    if (search.trim()) params.set('search', search.trim());
    else params.delete('search');
    if (locationSearch.trim()) {
      params.set('location', locationSearch.trim());
      params.set('radius_miles', String(radiusMiles));
      if (nearYouEnabled && coords) {
        params.set('lat', String(coords.lat));
        params.set('lng', String(coords.lng));
      }
    } else {
      params.delete('location');
      params.delete('lat');
      params.delete('lng');
      params.delete('radius_miles');
    }

    if (params.toString()) {
      navigate(`/?${params.toString()}`);
    } else {
      navigate('/');
    }
  };

  const handleSuggestionClick = (title: string) => {
    setSearch(title);
    setShowSuggestions(false);
    navigate(`/?search=${encodeURIComponent(title)}`);
  };

  const handleLocationSuggestionClick = (suggestion: LocationSuggestion) => {
    setLocationSearch(suggestion.display_name);
    setShowLocationSuggestions(false);
    const params = new URLSearchParams(window.location.search);
    params.set('location', suggestion.display_name);
    params.set('lat', suggestion.lat);
    params.set('lng', suggestion.lon);
    params.set('radius_miles', String(radiusMiles));
    navigate(`/?${params.toString()}`);
  };

  const dashboardLinks = [
    { label: 'Going', icon: CalendarDays, type: 'heading', indent: 1 },
    { to: '/dashboard/saved', label: 'Saved Dates', icon: Ticket, indent: 2 },
    { to: '/dashboard/tickets', label: 'My Tickets', icon: Ticket, indent: 2 },

    { label: 'Activities', icon: CalendarDays, type: 'heading', indent: 1 },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays, indent: 2 },
    { to: '/dashboard/activities', label: 'My Activities', icon: MessageSquare, indent: 1 },

    { label: 'Organizing', icon: Menu, type: 'heading', indent: 1 },
    { to: '/dashboard/events', label: 'My Events', icon: CalendarDays, indent: 2 },

    { label: 'Services', icon: Briefcase, type: 'heading', indent: 1 },
    { to: '/dashboard/services', label: 'My Services', indent: 2 },
    { to: '/dashboard/services/opportunities', label: 'Service Opportunities', indent: 2 },



    { label: 'Profile + Settings', type: 'heading', indent: 1 },
    { to: '/profile/user-info', label: 'User Info', icon: User, indent: 2 },
    { to: '/profile/settings', label: 'Account Settings', icon: Settings, indent: 2 },
    { to: '/profile/privacy', label: 'Privacy', icon: Shield, indent: 2 },

  ];


  return (
    <>
      <nav className="sticky top-0 z-50 ">
        <div className="mx-auto max-w-[1600px] bg-transparent px-4 sm:px-6 lg:px-8">
          <div className="flex w-full flex-col gap-2">
            <div className="flex h-16 items-center justify-between gap-2">
              <div className="flex items-center">
                <div className="absolute -inset-1 bg-[#f8c163ff] opacity-60 rounded-sm transform -rotate-2 group-hover:rotate-1 transition-transform z-0"></div>
                <div className=""></div>
                <div className="sm:hidden xs:hidden flex">
                  {/* Logo for small screens */}
                  <Link
                    to="/"
                    className="flex flex-shrink-0 items-center mr-4 relative group"
                  >
                    {/* Outgoing Logo */}
                    <span
                      className="text-4xl font-bold text-gray-900 relative z-10"
                      style={{ fontFamily: '"Permanent Marker"', scale: 1.2 }}
                    >
                      <img
                        src="assets/go-symbol.png"
                        alt="Outgoing"
                        title="Outgoing"
                        className="h-10 w-10"
                        style={{
                          filter: 'drop-shadow(2px 2px 1px #E2BF00) ',
                          transform: 'scale(1.3)',
                        }}
                      />
                    </span>
                  </Link>
                </div>
                <div className="sm:flex xs:flex hidden">
                  {/* Logo for medium screens */}
                  <Link
                    to="/"
                    className="flex flex-shrink-0 items-center relative group"
                  >
                    <span
                      className="text-4xl inline-flex items-center font-bold text-gray-900 relative z-10"
                      style={{ fontFamily: '"Permanent Marker"', scale: 1.2 }}
                    >
                      Out
                      <img
                        src="assets/go-symbol.png"
                        alt="Outgoing"
                        title="Outgoing"
                        className="h-10 w-10"
                        style={{
                          filter: 'drop-shadow(2px 2px 1px #E2BF00) ',
                          transform: 'scale(1.3)',
                        }}
                      />
                      ing
                    </span>
                  </Link>
                </div>
                {shouldShowSearch && (
                  <div className="hidden relative flex-1 min-w-0 max-w-[900px] mx-4 mt-4 lg:mx-8">
                    <form
                      onSubmit={handleSearchSubmit}
                      className="flex items-center w-full rounded-none border-2 border-gray-800 bg-[#f4f1ea] pl-5 pr-2 py-2.5 shadow-[3px_4px_0px_#333] focus-within:shadow-[2px_3px_0px_#333] focus-within:translate-x-[1px] focus-within:translate-y-[1px] transition-all"
                      style={{ fontFamily: '"Permanent Marker"' }}
                    >
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        placeholder="Search events..."
                        className="flex-1 min-w-[140px] bg-transparent text-base outline-none text-gray-800 placeholder:text-gray-500"
                        style={{ fontFamily: '"Permanent Marker"' }}
                      />
                      <div className="h-7 w-[2px] bg-gray-400 mx-3 flex-shrink-0" />
                      <div className="relative flex-shrink-0" ref={locationDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setLocationDropdownOpen((o) => !o)}
                          className="flex items-center gap-2 rounded-none border-2 border-gray-800 bg-white px-4 py-2 shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all min-w-[160px] justify-between"
                          style={{ fontFamily: '"Permanent Marker"' }}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <MapPin size={18} className="text-gray-600 shrink-0" />
                            <span className="truncate text-gray-800">
                              {nearYouEnabled
                                ? nearYouName || 'Near you'
                                : locationSearch || 'Location'}
                            </span>
                          </span>
                          <span className="text-gray-500 text-xs shrink-0">
                            {radiusMiles} mi
                          </span>
                        </button>
                        {locationDropdownOpen && (
                          <div
                            className="absolute top-full left-0 mt-2 z-50 w-[380px] rounded-none border-2 border-gray-800 bg-[#f4f1ea] p-3 shadow-[4px_5px_0px_#333]"
                            style={{
                              backgroundImage:
                                'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
                              backgroundSize: '10px 10px',
                            }}
                          >
                            <p
                              className="text-xs uppercase tracking-wider text-gray-600 mb-2"
                              style={{ fontFamily: '"Permanent Marker"' }}
                            >
                              Where?
                            </p>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                toggleNearYou();
                                setLocationDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-3 rounded-none border-2 border-gray-800 px-4 py-3 text-left bg-blue-200/80 shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all font-bold text-gray-900 mb-3"
                              style={{ fontFamily: '"Permanent Marker"' }}
                            >
                              <LocateFixed
                                size={20}
                                className={nearYouEnabled ? 'text-blue-600' : ''}
                              />
                              <span>Use current location</span>
                            </button>
                            <p
                              className="text-xs uppercase tracking-wider text-gray-600 mb-2 mt-2"
                              style={{ fontFamily: '"Permanent Marker"' }}
                            >
                              Or type an address
                            </p>
                            <div className="relative">
                              <input
                                value={locationSearch}
                                onChange={(e) => {
                                  setLocationSearch(e.target.value);
                                  if (nearYouEnabled) toggleNearYou();
                                }}
                                onFocus={() => {
                                  if (locationSuggestions.length > 0)
                                    setShowLocationSuggestions(true);
                                }}
                                onBlur={() =>
                                  setTimeout(
                                    () => setShowLocationSuggestions(false),
                                    200,
                                  )
                                }
                                placeholder="City or address..."
                                className="w-full rounded-none border-2 border-gray-800 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-500 outline-none shadow-[2px_2px_0px_#333]"
                                style={{ fontFamily: '"Permanent Marker"' }}
                              />
                              {showLocationSuggestions &&
                                locationSuggestions.length > 0 && (
                                  <div className="absolute top-full left-0 right-0 mt-1 rounded-none border-2 border-gray-800 bg-white shadow-[3px_4px_0px_#333] overflow-hidden z-10">
                                    {locationSuggestions.map((suggestion) => (
                                      <button
                                        key={suggestion.place_id}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                          handleLocationSuggestionClick(suggestion);
                                          setShowLocationSuggestions(false);
                                          setLocationDropdownOpen(false);
                                        }}
                                        className="w-full flex items-start gap-2 rounded-none px-3 py-2.5 text-left border-b border-dashed border-gray-300 last:border-0 hover:bg-yellow-100 transition-colors"
                                        style={{ fontFamily: '"Permanent Marker"' }}
                                      >
                                        <Search
                                          size={14}
                                          className="text-gray-500 shrink-0 mt-0.5"
                                        />
                                        <p className="text-sm line-clamp-2">
                                          {suggestion.display_name}
                                        </p>
                                      </button>
                                    ))}
                                  </div>
                                )}
                            </div>
                            <p
                              className="text-xs uppercase tracking-wider text-gray-600 mb-1.5 mt-3"
                              style={{ fontFamily: '"Permanent Marker"' }}
                            >
                              Miles radius
                            </p>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                max={500}
                                value={radiusMiles}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value, 10);
                                  if (!Number.isNaN(v)) setRadiusMiles(v);
                                }}
                                className="w-20 rounded-none border-2 border-gray-800 bg-white px-3 py-2 text-gray-800 outline-none shadow-[2px_2px_0px_#333]"
                                style={{ fontFamily: '"Permanent Marker"' }}
                              />
                              <span
                                className="text-sm text-gray-600"
                                style={{ fontFamily: '"Permanent Marker"' }}
                              >
                                miles
                              </span>
                            </div>
                            {locationSearch && (
                              <button
                                type="button"
                                onClick={() => {
                                  setLocationSearch('');
                                  if (nearYouEnabled) toggleNearYou();
                                  const params = new URLSearchParams(
                                    window.location.search,
                                  );
                                  params.delete('location');
                                  params.delete('lat');
                                  params.delete('lng');
                                  navigate(`/?${params.toString()}`);
                                  setLocationDropdownOpen(false);
                                }}
                                className="mt-3 w-full rounded-none border-2 border-gray-800 bg-red-100 px-3 py-2 shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] transition-all text-gray-800 font-bold"
                                style={{ fontFamily: '"Permanent Marker"' }}
                              >
                                Clear location
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <ComicIconButton
                        // variant="outline"
                        variant="solid"
                        accentColor="#f8c163"
                        Icon={Search}
                        className="ml-2"
                        iconProps={{ size: 20, strokeWidth: 3 }}
                      />
                    </form>
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-[4rem] left-0 z-50 w-full rounded-none border-2 border-gray-800 bg-[#f4f1ea] p-2 shadow-[4px_5px_0px_#333] overflow-hidden">
                        {suggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSuggestionClick(suggestion.title)}
                            className="w-full flex flex-col items-start rounded-none px-4 py-3 text-left border-b border-dashed border-gray-300 last:border-0 hover:bg-yellow-100 transition-colors"
                            style={{ fontFamily: '"Permanent Marker"' }}
                          >
                            <p className="text-[15px] font-medium line-clamp-1">
                              {suggestion.title}
                            </p>
                            <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                              {[suggestion.category_name, suggestion.location_name]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isEventManagementRoute && (
                <div className="w-full">
                  <div className="mx-auto flex w-full max-w-4xl items-center gap-4 pt-2 pb-3">
                    <button
                      type="button"
                      onClick={() => navigate('/events/' + event?.id + '')}
                      className="flex items-center justify-center h-10 w-10 border-2 border-gray-800 rounded-full bg-white shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all relative z-10"
                    >
                      <ArrowLeft className="h-5 w-5" strokeWidth={3} />
                    </button>
                    <div>
                      <h1
                        className="text-3xl text-gray-900"
                        style={{
                          fontFamily: '"Permanent Marker", cursive',
                          transform: 'rotate(-1deg)',
                        }}
                      >
                        {event?.title || 'Host Event Management'}
                      </h1>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <>
                    <div className="hidden sm:flex xs:flex items-center gap-2">
                      <ComicIconButton variant="ghost" size="icon" asChild Icon={Bell}>
                        <Link to="/alerts" aria-label="Alerts">
                          <div className="absolute top-0 right-0 h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white z-10">
                            {alertsCount > 0 && <span>{alertsCount}</span>}
                          </div>
                        </Link>
                      </ComicIconButton>
                      <ComicIconButton
                        variant="ghost"
                        size="icon"
                        asChild
                        Icon={Calendar}
                      >
                        <Link to="/calendar" aria-label="Calendar" />
                      </ComicIconButton>
                      {!isVendor && !isEventHost && (
                        <ComicIconButton
                          variant="ghost"
                          size="icon"
                          Icon={Plus}
                          color="#AF90F9"
                          onClick={() => setIsQuickCreateOpen(true)}
                        />
                      )}
                    </div>
                    {isVendor && isNotOnManagePage && (
                      <ComicButton
                        variant="solid"
                        size="default"
                        asChild
                        Icon={Pencil}
                        accentColor="#00CCCC"
                        label="Manage Service"
                        className="min-w-[140px]"
                      >
                        <Link
                          to={`/events/${eventId}/service-event-management/application`}
                        />
                      </ComicButton>
                    )}

                    {isEventHost && isNotOnManagePage && (
                      <ComicButton
                        variant="solid"
                        size="default"
                        asChild
                        Icon={FileEdit}
                        accentColor="#AF90F9"
                        label="Manage event"
                        className="min-w-[140px]"
                      >
                        <Link
                          to={`/events/${eventId}/host-event-management/basic-details`}
                        />
                      </ComicButton>
                    )}
                  </>
                ) : (
                  <div className="hidden gap-2 sm:flex xs:flex">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="font-bold font-serif hover:bg-yellow-200 hover:rotate-2 transition-all"
                    >
                      <Link to="/signin">Sign In</Link>
                    </Button>
                    <Button
                      size="sm"
                      asChild
                      className="rounded-none border-2 border-gray-800 bg-pink-400 text-white shadow-[2px_3px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-pink-500 transition-all font-bold"
                      style={{ fontFamily: '"Permanent Marker"' }}
                    >
                      <Link to="/signup">Sign Up</Link>
                    </Button>
                  </div>
                )}
                <ComicIconButton
                  variant="solid"
                  size="default"
                  shape="square"
                  onClick={() => setIsMenuOpen((open) => !open)}
                  aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={isMenuOpen}
                  className="ml-2"
                  Icon={isMenuOpen ? X : Menu}
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <NavbarSidebar
        isOpen={isMenuOpen}
        isAuthenticated={isAuthenticated}
        user={user}
        dashboardLinks={dashboardLinks}
        currentPath={location.pathname}
        onClose={() => setIsMenuOpen(false)}
        onOpenQuickCreate={() => setIsQuickCreateOpen(true)}
        onCreateService={() => navigate('/vendors/create')}
        onLogout={logout}
      />
      <QuickCreateEventModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
      />
    </>
  );
}
