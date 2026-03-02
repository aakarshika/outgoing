import { Bell, Briefcase, CalendarDays, Compass, Menu, Moon, Plus, Sun, X, User, LayoutDashboard, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks';
import { useAlerts } from '@/features/alerts/hooks';
import { useEventAutocomplete } from '@/features/events/hooks';
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
    { to: '/vendor-opportunities', label: 'Opportunities', icon: Compass },
    { to: '/vendors/create', label: '+ Create Service', icon: Briefcase },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex flex-shrink-0 items-center mr-4">
                <span className="text-xl font-bold text-foreground">Outgoing</span>
              </Link>
              <div className="hidden md:flex relative w-64 lg:w-96">
                <form onSubmit={handleSearchSubmit} className="w-full relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    placeholder="Search events, locations..."
                    className="h-9 w-full rounded-full border bg-muted/30 focus:bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary/20"
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
                        <p className="text-sm font-medium line-clamp-1">{suggestion.title}</p>
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
                  <Button variant="ghost" size="icon" asChild className="relative hidden sm:inline-flex">
                    <Link to="/alerts" aria-label="Alerts">
                      <Bell className="h-4 w-4" />
                      {alertsCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {alertsCount}
                        </span>
                      )}
                    </Link>
                  </Button>
                  <Button variant="default" size="sm" asChild className="hidden gap-1.5 sm:inline-flex">
                    <Link to="/events/create">
                      <Plus className="h-4 w-4" /> Create Event
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="hidden gap-2 sm:flex">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/signin">Sign In</Link>
                  </Button>
                  <Button size="sm" asChild>
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
            className={`fixed right-0 top-16 z-50 h-[calc(100vh-4rem)] w-[22rem] max-w-[85vw] border-l bg-background p-4 transition-transform duration-200 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
          >
            {isAuthenticated && (
              <div className="mb-4 border-b pb-4 sm:hidden">
                <Button variant="default" size="sm" asChild className="w-full justify-center gap-1.5">
                  <Link to="/events/create">
                    <Plus className="h-4 w-4" /> Create Event
                  </Link>
                </Button>
              </div>
            )}
            {/* <div className="mb-4 border-b pb-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Primary
              </p>
              <div className="grid gap-1">
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link to="/">Events</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link to="/vendors">Vendors</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link to="/requests">Requests</Link>
                </Button>
                {isAuthenticated && (
                  <Button variant="ghost" size="sm" asChild className="justify-start gap-1.5">
                    <Link to="/alerts">
                      <Bell className="h-4 w-4" /> Alerts
                    </Link>
                  </Button>
                )}
              </div>
            </div> */}
            {isAuthenticated ? (
              <div className="mb-4 border-b pb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? (
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  ) : (
                    <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  )}
                </Button>

                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Workspace
                </p>
                <div className="grid gap-1">
                  {secondaryLinks.map((item) => (
                    <Button
                      key={item.to}
                      variant={item.to === '/vendors/create' ? 'outline' : 'ghost'}
                      size="sm"
                      asChild
                      className="justify-start gap-1.5"
                    >
                      <Link to={item.to}>
                        {item.icon ? <item.icon className="h-4 w-4" /> : null}
                        {item.label}
                      </Link>
                    </Button>
                  ))}
                </div>
                <p className="mb-3 mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  For Vendors
                </p>
                <div className="grid gap-1">
                  {vendorLinks.map((item) => (
                    <Button
                      key={item.to}
                      variant={item.to === '/vendors/create' ? 'outline' : 'ghost'}
                      size="sm"
                      asChild
                      className="justify-start gap-1.5"
                    >
                      <Link to={item.to}>
                        {item.icon ? <item.icon className="h-4 w-4" /> : null}
                        {item.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4 border-b pb-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Account
                </p>
                <div className="grid gap-2">
                  <Button variant="ghost" size="sm" asChild className="justify-start">
                    <Link to="/signin">Sign In</Link>
                  </Button>
                  <Button size="sm" asChild className="justify-start">
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </div>
              </div>
            )}
            {isAuthenticated && (
              <Button onClick={logout} variant="outline" size="sm" className="w-full">
                Logout
              </Button>
            )}
          </aside>
        </>
      }
    </>
  );
}
