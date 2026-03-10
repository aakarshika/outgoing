import { Menu, X, Ticket, CalendarDays, MessageSquare, Briefcase, Settings, User, Shield, ChevronLeft, ChevronRight } from 'lucide-react';

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
  ManageEventButton,
} from './navbar/NavbarComponents';
import { NavbarProvider, useNavbarContext } from './navbar/NavbarContext';


function SidebarContent() {
  const {
    isAuthenticated,
  } = useNavbarContext();

  return (
    <>
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
            <SidebarLinkItem itemKey={'going'} />
            <SidebarLinkItem itemKey={'saved'} />
            <SidebarLinkItem itemKey={'tickets'} />
            <SidebarLinkItem itemKey={'organizing'} />
            <SidebarLinkItem itemKey={'my-events'} />
            <ManageEventButton type="manage-event-ghost" />
            <SidebarLinkItem itemKey={'services'} />
            <SidebarLinkItem itemKey={'my-services'} />
            <ManageEventButton type="manage-service-ghost" />
            <SidebarLinkItem itemKey={'my-opportunities'} />
            <SidebarLinkItem itemKey={'activities'} />
            <SidebarLinkItem itemKey={'my-activities'} />
            <SidebarLinkItem itemKey={'profile'} />
            <SidebarLinkItem itemKey={'user-info'} />
            <SidebarLinkItem itemKey={'account-settings'} />
            <SidebarLinkItem itemKey={'privacy'} />
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

    </>
  );
}

// Inner component that consumes context 
function NavbarLayout() {
  const {
    isAuthenticated,
    isMenuOpen,
    setIsMenuOpen,
    isQuickCreateOpen,
    setIsQuickCreateOpen,
    shouldShowSearch,
    isEventManagementRoute,
    isVendor,
    isNotOnManagePage,
    isEventHost,
    sidebarExpanded,
    // setSidebarExpanded,
    isNativeSidebarRoute,
  } = useNavbarContext();

  return (
    <>
      <nav className="sticky top-0 z-50 ">
        <div className="mx-auto max-w-[1600px] bg-transparent px-4 sm:px-6 lg:px-8">
          <div className="flex w-full flex-col gap-2">
            <div className="flex h-16 items-center justify-between gap-2">
              <div className="flex items-center flex-1 min-w-0">
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
          className={`fixed inset-0 top-16 z-40 bg-black/40 ${isNativeSidebarRoute ? 'md:hidden' : ''}`}
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed right-0 top-16 z-50 h-[calc(100vh-4rem)] w-[22rem] max-w-[85vw] border-l-2 border-dashed border-gray-300 p-5 transition-transform duration-200 overflow-y-auto ${isNativeSidebarRoute ? 'md:hidden' : ''} ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          background: '#f4f1ea',
          backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
          backgroundSize: '12px 12px',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Desktop persistent sidebar and toggle – only on native sidebar routes */}
      {isNativeSidebarRoute && (
        <>
          {/* <button
            type="button"
            aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className="hidden md:flex items-center justify-center fixed top-1/2 z-40 h-10 w-10 -translate-y-1/2 border-2 border-gray-800 bg-white shadow-[2px_3px_0px_#333] transition-all"
            style={{
              right: sidebarExpanded ? '22rem' : '0.75rem',
            }}
          // onClick={() =>
          //   // setSidebarExpanded((prev: boolean) => !prev)
          // }
          >
            {sidebarExpanded ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button> */}

          <aside
            className={`hidden md:block fixed right-0 top-16 z-30 h-[calc(100vh-4rem)] w-[22rem] border-l-2 border-dashed border-gray-300 p-5 transition-transform duration-200 overflow-y-auto `}
            style={{
              background: '#f4f1ea',
              backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
              backgroundSize: '12px 12px',
            }}
          >
            <SidebarContent />
          </aside>
        </>
      )}

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
