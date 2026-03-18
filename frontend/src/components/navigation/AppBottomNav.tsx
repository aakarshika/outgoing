import { Home, type LucideIcon, MessageCircle, Sparkles, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';

type NavItem = {
  key: string;
  label: string;
  Icon: LucideIcon;
  to: string;
  guestTo?: string;
  match: (pathname: string) => boolean;
};

const navItems: (user: any) => NavItem[] = (user) => [
  {
    key: 'home',
    label: 'Home',
    Icon: Home,
    to: '/',
    match: (pathname) => pathname === '/',
  },
  {
    key: 'highlightsreels',
    label: 'Highlights',
    Icon: Sparkles,
    to: '/highlightsreels',
    match: (pathname) => pathname.startsWith('/highlightsreels'),
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
    to: user?.username ? `/user/${user.username}` : '/profile',
    guestTo: '/signin',
    match: (pathname) =>
      pathname === '/profile' ||
      pathname.startsWith('/profile/') ||
      (user?.username && (pathname === `/user/${user.username}` || pathname.startsWith(`/user/${user.username}/`))),
  },
];

export function AppBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const items = navItems(user);

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
          {items.map(({ key, label, Icon, to, guestTo, match }) => {
            const isActive = match(location.pathname);
            const target = isAuthenticated ? to : guestTo || to;

            return (
              <button
                key={key}
                type="button"
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => navigate(target)}
                className={cn(
                  'relative flex h-14 items-center justify-center rounded-[22px]  transition-all duration-200',
                  isActive
                    ? 'text-white'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                )}
                style={{
                  fontFamily: 'Syne, sans-serif',
                  background: isActive ? '#D85A30' : '#F9F9F9',
                  borderColor: isActive ? '#D85A30' : 'var(--color-border-tertiary)',
                  boxShadow: isActive ? '0 10px 22px rgba(216, 90, 48, 0.24)' : 'none',
                }}
              >
                {key === 'profile' && isAuthenticated ? (
                  <div className={cn(
                    "transition-transform duration-200",
                    isActive ? "scale-110" : "scale-100"
                  )}>
                    <UserAvatar
                      src={user?.avatar}
                      username={user?.username}
                      size="xs"
                      className={cn(
                        "ring-2 transition-all duration-200",
                        isActive ? "ring-white/80" : "ring-transparent"
                      )}
                    />
                  </div>
                ) : (
                  <Icon className="h-5 w-5" strokeWidth={2.3} />
                )}
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
    </nav>
  );
}
