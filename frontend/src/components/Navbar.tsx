import {
  Bell,
  Briefcase,
  CalendarDays,
  FileEdit,
  LayoutDashboard,
  Menu,
  Moon,
  Pencil,
  Plus,
  Search,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, matchPath, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAlerts } from '@/features/alerts/hooks';
import { useAuth } from '@/features/auth/hooks';
import { useEvent, useEventAutocomplete } from '@/features/events/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { useDebouncedValue } from '@/utils/useDebouncedValue';

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const navigate = useNavigate();
  const debouncedSearch = useDebouncedValue(search, 300);
  const { data: autocompleteResponse } = useEventAutocomplete(debouncedSearch);
  const suggestions = autocompleteResponse?.data || [];

  const { data: response } = useAlerts({ enabled: isAuthenticated });
  const alertsCount = response?.data?.length || 0;

  const eventMatch = matchPath('/events/:id', location.pathname);
  const eventId = eventMatch?.params.id;
  const { data: eventResponse } = useEvent(Number(eventId));
  const event = eventResponse?.data;
  const { user } = useAuth();
  const isEventHost = isAuthenticated && user && event && user.username === event.host?.username;
  const isNotOnManagePage = !location.pathname.endsWith('/manage');

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
    } else {
      navigate('/');
    }
  };

  const handleSuggestionClick = (title: string) => {
    setSearch(title);
    setShowSuggestions(false);
    navigate(`/?search=${encodeURIComponent(title)}`);
  };

  const secondaryLinks = [
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/profile', label: 'Profile', icon: User },
  ];
  const vendorLinks = [
    { to: '/vendors/create', label: '+ Create Service', icon: Briefcase },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#f4f1ea]/95 ">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
              <div className="hidden md:flex relative w-64 lg:w-96">
                <form onSubmit={handleSearchSubmit} className="w-full relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    placeholder="Search events, locations..."
                    className="h-10 w-full rounded-md border-2 border-gray-800 bg-white pl-9 pr-3 text-sm outline-none transition-all shadow-[2px_3px_0px_#333] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[1px_1px_0px_#333] focus:ring-0"
                    style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
                  />
                </form>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-11 left-0 z-50 w-full rounded-xl border bg-card p-1 shadow-lg overflow-hidden">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSuggestionClick(suggestion.title)}
                        className="w-full flex flex-col items-start rounded-md px-3 py-2 text-left hover:bg-muted transition-colors"
                      >
                        <p className="text-sm font-medium line-clamp-1">
                          {suggestion.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {[suggestion.category_name, suggestion.location_name]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="relative hidden sm:inline-flex"
                  >
                    <Link to="/alerts" aria-label="Alerts">
                      <Bell className="h-4 w-4" />
                      {alertsCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {alertsCount}
                        </span>
                      )}
                    </Link>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    asChild
                    className="hidden gap-1.5 sm:inline-flex rounded-none border-2 border-gray-800 bg-blue-400 text-white shadow-[2px_3px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-blue-500 transition-all font-bold"
                    style={{ fontFamily: '"Permanent Marker"' }}
                  >
                    <Link to="/events/create">
                      <Plus className="h-4 w-4" /> Create Event
                    </Link>
                  </Button>

                  {isEventHost && isNotOnManagePage && (
                    <>
                      {/* Desktop Button */}
                      <Button
                        variant="default"
                        size="sm"
                        asChild
                        className="hidden gap-1.5 md:inline-flex rounded-none border-2 border-gray-800 bg-yellow-400 text-black shadow-[2px_3px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-yellow-500 transition-all font-bold"
                        style={{ fontFamily: '"Permanent Marker"' }}
                      >
                        <Link to={`/events/${eventId}/manage`}>
                          <FileEdit className="h-4 w-4" /> Edit the event
                        </Link>
                      </Button>

                      {/* Small screens Pencil Icon */}
                      <Button
                        variant="default"
                        size="icon"
                        asChild
                        className="inline-flex md:hidden rounded-none border-2 border-gray-800 bg-yellow-400 text-black shadow-[2px_3px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-yellow-500 transition-all"
                      >
                        <Link to={`/events/${eventId}/manage`} aria-label="Edit the event">
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
              <div className="mb-5 border-b-2 border-dashed border-gray-300 pb-5 sm:hidden">
                <Link
                  to="/events/create"
                  className="flex w-full items-center justify-center gap-2 rounded-none border-2 border-gray-800 bg-blue-400 px-4 py-2.5 text-white shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-blue-500"
                  style={{ fontFamily: '"Permanent Marker"' }}
                >
                  <Plus className="h-4 w-4" /> Create Event
                </Link>
              </div>
            )}
            {isAuthenticated ? (
              <div className="mb-5 border-b-2 border-dashed border-gray-300 pb-5">
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
                  Workspace
                </p>
                <div className="grid gap-1">
                  {secondaryLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-2.5 rounded-sm px-3 py-2 text-base transition-all hover:bg-yellow-200/60 hover:translate-x-1 ${location.pathname.startsWith(item.to) ? 'bg-yellow-300/50 -rotate-1 border-l-4 border-yellow-500 font-bold' : 'text-gray-700'}`}
                      style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                    >
                      {item.icon ? <item.icon className="h-4 w-4 shrink-0" /> : null}
                      {item.label}
                    </Link>
                  ))}
                </div>
                <p
                  className="mb-3 mt-5 text-sm uppercase tracking-wider text-gray-600"
                  style={{
                    fontFamily: '"Permanent Marker"',
                    transform: 'rotate(1deg)',
                  }}
                >
                  For Vendors
                </p>
                <div className="grid gap-1">
                  {vendorLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-2.5 rounded-sm px-3 py-2 text-base transition-all hover:bg-green-200/60 hover:translate-x-1 ${location.pathname.startsWith(item.to) ? 'bg-green-300/50 rotate-1 border-l-4 border-green-500 font-bold' : 'text-gray-700'}`}
                      style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                    >
                      {item.icon ? <item.icon className="h-4 w-4 shrink-0" /> : null}
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-5 border-b-2 border-dashed border-gray-300 pb-5">
                <p
                  className="mb-3 text-sm uppercase tracking-wider text-gray-600"
                  style={{
                    fontFamily: '"Permanent Marker"',
                    transform: 'rotate(-2deg)',
                  }}
                >
                  Account
                </p>
                <div className="grid gap-3">
                  <Link
                    to="/signin"
                    className="flex items-center justify-center rounded-none border-2 border-gray-800 bg-white px-4 py-2 text-gray-800 shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-yellow-100"
                    style={{ fontFamily: '"Permanent Marker"' }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center justify-center rounded-none border-2 border-gray-800 bg-pink-400 px-4 py-2 text-white shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-pink-500"
                    style={{ fontFamily: '"Permanent Marker"' }}
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
