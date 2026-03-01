import { Briefcase, Moon, Plus, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks';
import { useTheme } from '@/theme/ThemeProvider';

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex flex-shrink-0 items-center">
              <span className="text-xl font-bold text-foreground">Outgoing</span>
            </Link>
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
                <Button variant="default" size="sm" asChild className="gap-1.5">
                  <Link to="/events/create">
                    <Plus className="h-4 w-4" /> Create Event
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="gap-1.5 border-primary text-primary hover:bg-primary/10">
                  <Link to="/vendors/create">
                    <Briefcase className="h-4 w-4" /> Create Service
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/profile">Profile</Link>
                </Button>
                <Button onClick={logout} variant="outline" size="sm">
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/signin">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
