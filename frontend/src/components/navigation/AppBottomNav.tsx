import { Icon } from '@iconify/react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';

type NavItem = {
  key: string;
  label: string;
  icon: string;
  to: string;
  guestTo?: string;
  match: (pathname: string) => boolean;
};


export function AppBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const pathname = location.pathname;

  const items: NavItem[] = [
    {
      key: 'home',
      label: 'Home',
      icon: 'line-md:home',
      to: '/',
      match: (pathname) => pathname === '/',
    },
    {
      key: 'highlightsreels',
      label: 'Highlights',
      icon: 'tabler:camera-star',
      to: '/highlightsreels',
      match: (pathname) => pathname.startsWith('/highlightsreels'),
    },
  ];

  if (isAuthenticated) {
    const username = user?.username;

    items.push({
      key: 'chats',
      label: 'Chats',
      icon: 'fluent:people-chat-16-regular',
      to: '/allchats',
      guestTo: '/signin',
      match: (pathname) =>
        pathname === '/allchats' || pathname.startsWith('/allchats/'),
    });
    items.push({
      key: 'profile',
      label: 'Profile',
      icon: 'solar:user-linear',
      to: username ? `/user/${username}` : '/profile',
      guestTo: '/signin',
      match: (pathname) =>
        pathname === '/profile' ||
        pathname.startsWith('/profile/') ||
        (Boolean(username) && (pathname === `/user/${username}` || pathname.startsWith(`/user/${username}/`))),
    });
  }

  const hasNonHomeMatch = items.some((item) => item.key !== 'home' && item.match(pathname));

  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70]"
    >
      <div
        className="pointer-events-auto relative backdrop-blur-xl"
        style={{
          background: 'rgba(237, 232, 226, 0.9)',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          WebkitBackdropFilter: 'blur(10px)',
          backdropFilter: 'blur(10px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div
          className="flex flex-row gap-1 mx-3 max-w-[1040px]"
          style={{ background: 'var(--color-background-secondary)' }}
        >
          {items.map(({ key, label, icon, to, guestTo, match }) => {
            const isActive = key === 'home' ? match(pathname) || !hasNonHomeMatch : match(pathname);
            const target = isAuthenticated ? to : guestTo || to;

            return (
              <button
                key={key}
                type="button"
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => navigate(target)}
                className={cn(
                  'relative flex my-3  items-center justify-center rounded-lg transition-all duration-200',
                  isActive
                    ? 'text-white h-12 flex w-full items-center justify-center'
                    : 'aspect-square h-12 w-12 ',
                )}
                style={{
                  fontFamily: 'Syne, sans-serif',
                  background: isActive ? 'white' : 'white',
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
                        "ring-2 transition-all duration-200 inline-flex items-center justify-center",
                        isActive ? "ring-white/80" : "ring-transparent"
                      )}
                    />
                    {isActive && <span className="text-[#D85A30] pl-2">{user?.username}</span>}
                  </div>
                ) : (
                  <>
                    <Icon
                      icon={icon}
                      className={`h-5 w-5 ${!isActive ? 'text-gray-500' : 'text-[#D85A30]'}`}
                    />
                    {isActive && <span className=" text-[#D85A30] pl-2">{label}</span>}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
