import { Home, type LucideIcon, MessageCircle, Sparkles, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks';
import { useTrendingHighlights } from '@/features/events/hooks';
import { cn } from '@/lib/utils';
import { HighlightChainViewer } from '@/pages/events/components/HighlightChainViewer';

type NavItem = {
  key: string;
  label: string;
  Icon: LucideIcon;
  to: string;
  guestTo?: string;
  match: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    key: 'home',
    label: 'Home',
    Icon: Home,
    to: '/',
    match: (pathname) => pathname === '/',
  },
  {
    key: 'highlights',
    label: 'Highlights',
    Icon: Sparkles,
    to: '/highlights',
    match: (pathname) => pathname === '/highlights',
  },
  {
    key: 'chats',
    label: 'Chats',
    Icon: MessageCircle,
    to: '/chats',
    guestTo: '/signin',
    match: (pathname) => pathname === '/chats' || pathname.startsWith('/chats/'),
  },
  {
    key: 'profile',
    label: 'Profile',
    Icon: User,
    to: '/profile',
    guestTo: '/signin',
    match: (pathname) => pathname === '/profile' || pathname.startsWith('/profile/'),
  },
];

export function AppBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: trendingData, isLoading: loadingTrending } = useTrendingHighlights(24);
  const trendingHighlights = trendingData?.data || [];
  const [isHighlightViewerOpen, setIsHighlightViewerOpen] = useState(false);
  const [selectedHighlightId, setSelectedHighlightId] = useState<number | null>(null);
  const [pendingOpenHighlight, setPendingOpenHighlight] = useState(false);

  useEffect(() => {
    if (pendingOpenHighlight && !loadingTrending && trendingHighlights.length > 0) {
      setSelectedHighlightId(trendingHighlights[0].id);
      setIsHighlightViewerOpen(true);
      setPendingOpenHighlight(false);
    }
  }, [pendingOpenHighlight, loadingTrending, trendingHighlights]);

  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70]"
    >
      <div
        className="pointer-events-auto relative backdrop-blur-xl"
        style={{
          background: 'rgba(255, 248, 241, 0.96)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1"
          style={{ background: '#D85A30' }}
        />
        <div
          className="grid grid-cols-4 gap-2 p-2 sm:p-2.5 mx-auto max-w-[1040px]"
          style={{ background: 'var(--color-background-secondary)' }}
        >
            {navItems.map(({ key, label, Icon, to, guestTo, match }) => {
              const isActive = match(location.pathname);
              const target = isAuthenticated ? to : guestTo || to;

              return (
                <button
                  key={key}
                  type="button"
                  aria-label={label}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    if (key === 'highlights') {
                      // Open highlight feed viewer starting from first trending highlight
                      if (!loadingTrending && trendingHighlights.length > 0) {
                        setSelectedHighlightId(trendingHighlights[0].id);
                        setIsHighlightViewerOpen(true);
                      } else {
                        setPendingOpenHighlight(true);
                      }
                      return;
                    }

                    navigate(target);
                  }}
                  className={cn(
                    'relative flex h-14 items-center justify-center rounded-[22px]  transition-all duration-200',
                    isActive
                      ? 'text-white'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                  )}
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    background: isActive
                      ? '#D85A30'
                      : 'var(--color-background-primary)',
                    borderColor: isActive ? '#D85A30' : 'var(--color-border-tertiary)',
                    boxShadow: isActive
                      ? '0 10px 22px rgba(216, 90, 48, 0.24)'
                      : 'none',
                  }}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.3} />
                  <span
                    className={cn(
                      'pointer-events-none absolute bottom-1.5 h-1 w-6 rounded-full transition-opacity duration-200',
                      isActive ? 'opacity-100' : 'opacity-0',
                    )}
                    style={{ background: 'rgba(255,255,255,0.72)' }}
                  />
                </button>
              );
            })}
        </div>
      </div>

      {selectedHighlightId && (
        <HighlightChainViewer
          initialHighlightId={selectedHighlightId}
          isOpen={isHighlightViewerOpen}
          onClose={() => setIsHighlightViewerOpen(false)}
        />
      )}
    </nav>
  );
}
