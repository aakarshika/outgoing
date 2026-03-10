import { CalendTicket, arDays, Menu, X, Ticket, CalendarDays, MessageSquare, Briefcase, Settings, User, Shield } from 'lucide-react';

import { QuickCreateEventModal } from '@/components/events/QuickCreateEventModal';
import { ComicIconButton } from '@/components/ui/ComicIconButton';

import {
  SidebarLinkItem,
  CreateEventButton,
  LogoSection,
  IconButtonsSection,
  UserInfoSection,
  EventManagementHeader,
  SearchBar,
} from './navbar/NavbarComponents';
import { NavbarProvider, useNavbarContext } from './navbar/NavbarContext';

export const dashboardLinks = {
  'going': { key: 'going', label: 'Going', icon: CalendarDays, type: 'heading', indent: 1 },
  'saved': { key: 'saved', to: '/dashboard/saved', label: 'Saved Dates', icon: Ticket, indent: 2 },
  'tickets': { key: 'tickets', to: '/dashboard/tickets', label: 'My Tickets', icon: Ticket, indent: 2 },

  'activities': { key: 'activities', label: 'Activities', icon: CalendarDays, type: 'heading', indent: 1 },
  'calendar': { key: 'calendar', to: '/calendar', label: 'Calendar', icon: CalendarDays, indent: 2 },
  'my-activities': { key: 'my-activities', to: '/dashboard/activities', label: 'My Activities', icon: MessageSquare, indent: 1 },

  'organizing': { key: 'organizing', label: 'Organizing', icon: Menu, type: 'heading', indent: 1 },
  'my-events': { key: 'my-events', to: '/dashboard/events', label: 'My Events', icon: CalendarDays, indent: 2 },

  'services': { key: 'services', label: 'Services', icon: Briefcase, type: 'heading', indent: 1 },
  'my-services': { key: 'my-services', to: '/dashboard/services', label: 'My Services', indent: 2 },
  'my-opportunities': { key: 'my-opportunities', to: '/dashboard/services/opportunities', label: 'Service Opportunities', indent: 2 },

  'profile': { key: 'profile', label: 'Profile + Settings', type: 'heading', indent: 1 },
  'user-info': { key: 'user-info', to: '/profile/user-info', label: 'User Info', icon: User, indent: 2 },
  'account-settings': { key: 'account-settings', to: '/profile/settings', label: 'Account Settings', icon: Settings, indent: 2 },
  'privacy': { key: 'privacy', to: '/profile/privacy', label: 'Privacy', icon: Shield, indent: 2 },
};
// Inner component that consumes context 
function NavbarLayout() {
  const {
    isAuthenticated,
    logout,
    isMenuOpen,
    setIsMenuOpen,
    isQuickCreateOpen,
    setIsQuickCreateOpen,
    shouldShowSearch,
    isEventManagementRoute,
    isVendor,
    isNotOnManagePage,
    isEventHost,
  } = useNavbarContext();

  return (
    <>
      <nav className="sticky top-0 z-50 ">
        <div className="mx-auto max-w-[1600px] bg-transparent px-4 sm:px-6 lg:px-8">
          <div className="flex w-full flex-col gap-2">
            <div className="flex h-16 items-center justify-between gap-2">
              <div className="flex items-center">
                <div className="absolute -inset-1 bg-[#f8c163ff] opacity-60 rounded-sm transform -rotate-2 group-hover:rotate-1 transition-transform z-0"></div>
                <LogoSection />
                {shouldShowSearch && <SearchBar />}
              </div>

              {isEventManagementRoute && <EventManagementHeader />}

              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <>
                    <IconButtonsSection />
                    {isVendor && isNotOnManagePage && (
                      <CreateEventButton type="manage-service" />
                    )}

                    {isEventHost && isNotOnManagePage && (
                      <CreateEventButton type="manage-event" />
                    )}
                  </>
                ) : (
                  <div className="hidden gap-2 sm:flex xs:flex">
                    <CreateEventButton type="signin" />
                    <CreateEventButton type="signup" />
                  </div>
                )}

                <ComicIconButton
                  variant="solid"
                  size="default"
                  shape="square"
                  onClick={() => setIsMenuOpen((open: boolean) => !open)}
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
          <div className="mb-6 border-b-2 border-dashed border-gray-300 pb-6">
            <CreateEventButton type="event" />
            <CreateEventButton type="service" />
          </div>
        )}

        {isAuthenticated ? (
          <div>
            <UserInfoSection />
            <div className="grid gap-1 ml-2">
              {Object.values(dashboardLinks).map((item: any) => (
                <SidebarLinkItem key={item.key} linkDetails={item} />
              ))}
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
              <CreateEventButton type="signin" />
              <CreateEventButton type="signup" />
            </div>
          </div>
        )}

        {isAuthenticated && (
          <button
            onClick={logout}
            className="w-full rounded-none border-2 border-gray-800 bg-white px-4 py-2 text-gray-800 shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-red-100 mt-4"
            style={{ fontFamily: '"Permanent Marker"', fontSize: '0.9rem' }}
          >
            Logout
          </button>
        )}
      </aside>

      <QuickCreateEventModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
      />
    </>
  );
}

// Main exported component wrapped with Provider
export function Navbar() {
  return (
    <NavbarProvider>
      <NavbarLayout />
    </NavbarProvider>
  );
}
