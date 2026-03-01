import { Bell, Briefcase, CalendarDays, Compass, Menu, Moon, Plus, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks';
import { useTheme } from '@/theme/ThemeProvider';

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const secondaryLinks = [
    { to: '/vendor-opportunities', label: 'Opportunities', icon: Compass },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/vendors/create', label: 'Create Service', icon: Briefcase },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/profile', label: 'Profile' },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex flex-shrink-0 items-center">
                <span className="text-xl font-bold text-foreground">Outgoing</span>
              </Link>
              <div className="hidden items-center gap-1 md:flex">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/">Events</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/vendors">Vendors</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/requests">Requests</Link>
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
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

              {isAuthenticated ? (
                <>
                  <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
                    <Link to="/alerts" aria-label="Alerts">
                      <Bell className="h-4 w-4" />
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
            className={`fixed right-0 top-16 z-50 h-[calc(100vh-4rem)] w-[22rem] max-w-[85vw] border-l bg-background p-4 transition-transform duration-200 ${
              isMenuOpen ? 'translate-x-0' : 'translate-x-full'
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
            <div className="mb-4 border-b pb-4">
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
            </div>
            {isAuthenticated ? (
              <div className="mb-4 border-b pb-4">
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
