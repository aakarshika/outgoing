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
  Moon,
  Pencil,
  Plus,
  Search,
  Settings,
  Shield,
  Sun,
  Ticket,
  User,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, matchPath, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAlerts } from '@/features/alerts/hooks';
import { useAuth } from '@/features/auth/hooks';
import { useEvent, useEventAutocomplete } from '@/features/events/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { canUseBrowserGeolocation } from '@/utils/geolocation';
import { type LocationSuggestion, searchLocation } from '@/utils/geolocation';
import { useDebouncedValue } from '@/utils/useDebouncedValue';
import { useNearYou } from '@/utils/useNearYou';

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  if (location.pathname.includes('/gallery/')) return null;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    isAuthenticated && user && event &&
    !!(event.user_applications
      && event.user_applications.length > 0);
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
    { to: '/dashboard/events', label: 'My Events', icon: CalendarDays },
    { to: '/dashboard/tickets', label: 'My Tickets', icon: Ticket },
    { to: '/dashboard/services', label: 'Services', icon: Briefcase },
    { to: '/dashboard/activities', label: 'My Activities', icon: MessageSquare },
  ];

  const profileLinks = [
    { path: 'user-info', label: 'User Info', icon: User },
    { path: 'settings', label: 'Account Settings', icon: Settings },
    { path: 'privacy', label: 'Privacy', icon: Shield },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 ">
        <div className="mx-auto max-w-[1600px] bg-transparent px-4 sm:px-6 lg:px-8">
          <div className="flex w-full flex-col gap-2">
            <div className="flex h-16 items-center justify-between gap-2">
              <div className="flex items-center gap-4">
                <Link
                  to="/"
                  className="flex flex-shrink-0 items-center mr-4 relative group"
                >
                  <div className="absolute -inset-1 bg-[#f8c163ff] opacity-60 rounded-sm transform -rotate-2 group-hover:rotate-1 transition-transform z-0"></div>
                  <span
                    className="text-4xl font-bold text-gray-900 relative z-10"
                    style={{ fontFamily: '"Permanent Marker"', scale: 1.2 }}
                  >
                    Outgoing
                  </span>
                </Link>
                {shouldShowSearch && (
                  <div className="hidden md:flex relative flex-1 min-w-0 max-w-[900px] mx-4 mt-4 lg:mx-8">
                    <form
                      onSubmit={handleSearchSubmit}
                      className="flex items-center w-full rounded-none border-2 border-gray-800 bg-[#f4f1ea] pl-5 pr-2 py-2.5 shadow-[3px_4px_0px_#333] focus-within:shadow-[2px_3px_0px_#333] focus-within:translate-x-[1px] focus-within:translate-y-[1px] transition-all"
                      style={{ fontFamily: '"Permanent Marker"' }}
                    >
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() =>
                          setTimeout(() => setShowSuggestions(false), 150)
                        }
                        placeholder="Search events..."
                        className="flex-1 min-w-[140px] bg-transparent text-base outline-none text-gray-800 placeholder:text-gray-500"
                        style={{ fontFamily: '"Permanent Marker"' }}
                      />
                      <div className="h-7 w-[2px] bg-gray-400 mx-3 flex-shrink-0" />
                      <div
                        className="relative flex-shrink-0"
                        ref={locationDropdownRef}
                      >
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
                                          handleLocationSuggestionClick(
                                            suggestion,
                                          );
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
                      <button
                        type="submit"
                        className="ml-2 rounded-none border-2 border-gray-800 bg-[#f8c163] p-3 text-gray-900 shadow-[2px_3px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all"
                        style={{ fontFamily: '"Permanent Marker"' }}
                      >
                        <Search size={20} strokeWidth={3} />
                      </button>
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
                      <ArrowLeft className="h-5 w-5" />
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
                    <Button variant="ghost" size="icon" asChild className="relative">
                      <Link to="/alerts" aria-label="Alerts">
                        <Bell className="h-5 w-5" />
                        {alertsCount > 0 && (
                          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {alertsCount}
                          </span>
                        )}
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to="/events/create" aria-label="Create Event">
                        <Plus className="h-5 w-5" />
                      </Link>
                    </Button>

                    <Button variant="ghost" size="icon" asChild>
                      <Link to="/calendar" aria-label="Calendar">
                        <Calendar className="h-5 w-5" />
                      </Link>
                    </Button>

                    {isVendor && isNotOnManagePage && (
                      <Button
                        variant="default"
                        size="sm"
                        asChild
                        className="hidden gap-1.5 md:inline-flex rounded-none border-2 border-gray-800 bg-[#00CCCC] text-black shadow-[2px_3px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-[#0eacacff] transition-all font-bold"
                        style={{ fontFamily: '"Permanent Marker"' }}
                      >
                        <Link to={`/events/${eventId}/service-event-management/application`}>
                          <Briefcase className="h-4 w-4" /> Manage Service
                        </Link>
                      </Button>
                    )}

                    {isEventHost && isNotOnManagePage && (
                      <>
                        {/* Desktop Button */}
                        <Button
                          variant="default"
                          size="sm"
                          asChild
                          className="hidden gap-1.5 md:inline-flex rounded-none border-2 border-gray-800 bg-[#AF90F9] text-black shadow-[2px_3px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-[#9A72F8] transition-all font-bold"
                          style={{ fontFamily: '"Permanent Marker"' }}
                        >
                          <Link to={`/events/${eventId}/host-event-management/basic-details`}>
                            <FileEdit className="h-4 w-4" /> Manage event
                          </Link>
                        </Button>

                        {/* Small screens Pencil Icon */}
                        <Button
                          variant="default"
                          size="icon"
                          asChild
                          className="inline-flex md:hidden rounded-none border-2 border-gray-800 bg-yellow-400 text-black shadow-[2px_3px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-yellow-500 transition-all"
                        >
                          <Link
                            to={`/events/${eventId}/host-event-management/basic-details`}
                            aria-label="Edit the event"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="hidden gap-2 sm:flex">
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsMenuOpen((open) => !open)}
                  aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={isMenuOpen}
                  className="border-2 border-gray-800 shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] rounded-md transition-all ml-2"
                >
                  {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {
        <>
          {isMenuOpen && (
            <button
              type="button"
              aria-label="Close sidebar"
              className="fixed inset-0 top-16 z-40 bg-black/40"
              onClick={() => setIsMenuOpen(false)}
            />
          )}
          <aside
            className={`fixed right-0 top-16 z-50 h-[calc(100vh-4rem)] w-[22rem] max-w-[85vw] border-l-2 border-dashed border-gray-300 p-5 transition-transform duration-200 overflow-y-auto ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
            style={{
              background: '#f4f1ea',
              backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
              backgroundSize: '12px 12px',
            }}
          >
            {isAuthenticated && (
              <div className="mb-6 grid gap-3 border-b-2 border-dashed border-gray-300 pb-6">
                <Link
                  to="/events/create"
                  className="flex w-full items-center justify-center gap-2 rounded-none border-2 border-gray-800 bg-blue-400 px-4 py-3 text-white shadow-[3px_4px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_3px_0px_#333] hover:bg-blue-500 font-bold"
                  style={{ fontFamily: '"Permanent Marker"' }}
                >
                  <Plus className="h-5 w-5" /> Create Event
                </Link>
                <Link
                  to="/vendors/create"
                  className="flex w-full items-center justify-center gap-2 rounded-none border-2 border-gray-800 bg-green-500 px-4 py-3 text-white shadow-[3px_4px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_3px_0px_#333] hover:bg-green-600 font-bold"
                  style={{ fontFamily: '"Permanent Marker"' }}
                >
                  <Briefcase className="h-5 w-5" /> Create Service
                </Link>
              </div>
            )}
            {isAuthenticated ? (
              <div>
                {/* User Details Header */}
                <div className="mb-6 relative group">
                  <div
                    className="absolute -inset-2 bg-yellow-200/40 border-2 border-dashed border-gray-400 -rotate-2 group-hover:rotate-0 transition-transform"
                    style={{ borderRadius: '4px' }}
                  />
                  <div className="relative flex items-center gap-4 p-2 bg-white/40 border border-gray-200">
                    <div className="w-16 h-16 rounded-none border-2 border-gray-800 bg-white overflow-hidden shadow-[2px_2px_0] p-1 rotate-3">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3
                        className="text-xl text-gray-900 leading-tight"
                        style={{ fontFamily: '"Permanent Marker", cursive' }}
                      >
                        {user ? `${user.first_name} ${user.last_name}` : 'Logged In'}
                      </h3>
                      <p
                        className="text-gray-500 text-sm"
                        style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
                      >
                        @{user?.username}
                      </p>
                    </div>
                  </div>
                  {/* Washi tape accent */}
                  <div
                    className="absolute -top-3 -left-2 w-12 h-6 pointer-events-none z-10"
                    style={{
                      background: 'rgba(59, 130, 246, 0.4)',
                      transform: 'rotate(-15deg)',
                      border: '1px solid rgba(0,0,0,0.05)',
                    }}
                  />
                </div>

                <div className="mb-4">
                  <button
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    className="rounded-md border-2 border-gray-800 bg-white p-2 shadow-[2px_2px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333]"
                  >
                    {theme === 'light' ? (
                      <Sun className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <Moon className="h-4 w-4 text-indigo-600" />
                    )}
                  </button>
                </div>

                <p
                  className="mb-3 text-sm uppercase tracking-wider text-gray-600"
                  style={{
                    fontFamily: '"Permanent Marker"',
                    transform: 'rotate(-1deg)',
                  }}
                >
                  Dashboard
                </p>
                <div className="grid gap-1 ml-2">
                  {dashboardLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-2.5 rounded-sm px-3 py-2 text-base transition-all hover:bg-yellow-200/60 hover:translate-x-1 ${location.pathname === item.to ? 'bg-yellow-300/50 -rotate-1 border-l-4 border-yellow-500 font-bold' : 'text-gray-700'}`}
                      style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                    >
                      {item.icon ? <item.icon className="h-4 w-4 shrink-0" /> : null}
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    to="/calendar"
                    className={`flex items-center gap-2.5 rounded-sm px-3 py-2 text-base transition-all hover:bg-yellow-200/60 hover:translate-x-1 ${location.pathname === '/calendar' ? 'bg-yellow-300/50 -rotate-1 border-l-4 border-yellow-500 font-bold' : 'text-gray-700'}`}
                    style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                  >
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    Calendar
                  </Link>
                </div>

                <p
                  className="mb-3 mt-5 text-sm uppercase tracking-wider text-gray-600"
                  style={{
                    fontFamily: '"Permanent Marker"',
                    transform: 'rotate(1deg)',
                  }}
                >
                  Profile & Settings
                </p>
                <div className="grid gap-1 ml-2">
                  {profileLinks.map((item) => {
                    const fullPath = `/profile/${item.path}`;
                    return (
                      <Link
                        key={item.path}
                        to={fullPath}
                        className={`flex items-center gap-2.5 rounded-sm px-3 py-2 text-base transition-all hover:bg-blue-200/60 hover:translate-x-1 ${location.pathname === fullPath ? 'bg-blue-300/50 rotate-1 border-l-4 border-blue-500 font-bold' : 'text-gray-700'}`}
                        style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                      >
                        {item.icon ? <item.icon className="h-4 w-4 shrink-0" /> : null}
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mb-5 border-b-2 border-dashed border-gray-300 pb-5">
                <p
                  className="mb-3 text-sm uppercase tracking-wider text-gray-600"
                  style={{
                    fontFamily: '"Permanent Marker"',
                    transform: 'rotate(-1deg)',
                  }}
                >
                  Account
                </p>
                <div className="grid gap-2">
                  <Link
                    to="/signin"
                    className="flex items-center gap-2.5 rounded-sm px-3 py-2 text-base transition-all hover:bg-yellow-200/60 hover:translate-x-1 text-gray-700"
                    style={{ fontFamily: '"Caveat", cursive', fontSize: '1.25rem' }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center gap-2.5 rounded-sm px-3 py-2 text-base transition-all hover:bg-yellow-200/60 hover:translate-x-1 text-gray-700"
                    style={{ fontFamily: '"Caveat", cursive', fontSize: '1.25rem' }}
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            )}
            {isAuthenticated && (
              <button
                onClick={logout}
                className="w-full rounded-none border-2 border-gray-800 bg-white px-4 py-2 text-gray-800 shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-red-100"
                style={{ fontFamily: '"Permanent Marker"', fontSize: '0.9rem' }}
              >
                Logout
              </button>
            )}
          </aside>
        </>
      }
    </>
  );
}
