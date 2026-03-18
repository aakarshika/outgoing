import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CalendarDays,
  LocateFixed,
  MapPin,
  Menu,
  MessageSquare,
  MessageSquareIcon,
  Pencil,
  Plus,
  Search,
  Settings,
  Shield,
  Ticket,
  User,
  UserPlus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { ComicIconButton } from '@/components/ui/ComicIconButton';
import { ComicSinkButton } from '@/components/ui/ComicSinkButton';
import type { EventSearchSuggestion } from '@/types/events';

import { AllChatsList } from './AllChatsList';
import { useNavbarContext } from './NavbarContext';

export const SearchBar = () => {
  const {
    search,
    setSearch,
    handleSearchSubmit,
    showSuggestions,
    setShowSuggestions,
    locationDropdownRef,
    setLocationDropdownOpen,
    nearYouEnabled,
    nearYouName,
    locationSearch,
    locationDropdownOpen,
    toggleNearYou,
    setShowLocationSuggestions,
    setLocationSearch,
    showLocationSuggestions,
    locationSuggestions,
    handleLocationSuggestionClick,
    clearLocationSelection,
    suggestions,
    navigate,
    location,
    navigateToSearch,
  } = useNavbarContext();

  return (
    <div className="flex-1 min-w-0">
      <div className="relative hidden md:flex w-full p-4">
        {/* <div
              sx={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                px: 0.5,
                bgcolor: 'transparent',
                // Subtle invitation “sheet” without feeling like a heavy card
                backdropFilter: 'blur(10px)',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.0) 100%)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: `
            radial-gradient(600px 240px at 15% 10%, ${theme.bg} 0%, rgba(255,255,255,0) 60%),
            radial-gradient(500px 220px at 90% 25%, rgba(34,197,94,0.2) 0%, rgba(255,255,255,0) 60%),
            linear-gradient(90deg, rgba(148,163,184,0.2) 1px, transparent 1px),
            linear-gradient(rgba(148,163,184,0.2) 1px, transparent 1px)
          `,
                  backgroundSize: 'auto, auto, 18px 18px, 18px 18px',
                  opacity: 0.55,
                  pointerEvents: 'none',
                },
              }}
            > */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center w-full gap-3
                    hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all
                    "
          style={{ fontFamily: '"Permanent Marker"' }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search events..."
            className="flex-1 backdrop-blur-md supports-[backdrop-filter]:bg-white/15 rounded-none bg-white/30 px-3 py-2.5 text-base outline-none text-gray-800 placeholder:text-gray-500 "
            style={{ fontFamily: '"Permanent Marker"' }}
          />
          <div className="relative flex-shrink-0" ref={locationDropdownRef}>
            <button
              type="button"
              onClick={() => setLocationDropdownOpen((o) => !o)}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[rgba(120,94,60,0.18)] bg-[rgba(255,252,247,0.92)] px-4 py-2.5 text-left shadow-[0_8px_24px_rgba(74,53,33,0.08)] transition-all hover:border-[rgba(216,90,48,0.35)] hover:shadow-[0_10px_28px_rgba(74,53,33,0.12)]"
              style={{ fontFamily: '"Permanent Marker"' }}
            >
              <span className="flex items-center gap-2.5 truncate">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FAECE7] text-[#D85A30]">
                  <MapPin size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-[0.18em] text-gray-500">
                    Location
                  </span>
                  <span className="block truncate text-sm text-gray-800">
                    {nearYouEnabled
                      ? nearYouName || 'Near you'
                      : locationSearch || 'Anywhere'}
                  </span>
                </span>
              </span>
            </button>
            {locationDropdownOpen && (
              <div className="absolute top-full left-0 z-50 mt-2 w-[380px] rounded-3xl border border-[rgba(120,94,60,0.16)] bg-[#fffaf3] p-3 shadow-[0_18px_40px_rgba(74,53,33,0.14)]">
                <p
                  className="mb-2 text-[11px] uppercase tracking-[0.18em] text-gray-500"
                  style={{ fontFamily: '"Permanent Marker"' }}
                >
                  Choose a location
                </p>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    toggleNearYou();
                    setLocationDropdownOpen(false);
                  }}
                  className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-[rgba(29,158,117,0.16)] bg-[#f3fbf8] px-4 py-3 text-left text-gray-900 transition-colors hover:bg-[#edf8f4]"
                  style={{ fontFamily: '"Permanent Marker"' }}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1D9E75]">
                    <LocateFixed
                      size={18}
                      className={nearYouEnabled ? 'text-[#1D9E75]' : ''}
                    />
                  </span>
                  <span className="flex flex-col">
                    <span>Use current location</span>
                    <span className="text-xs text-gray-500">
                      {nearYouEnabled
                        ? nearYouName || 'Using your location'
                        : 'Find events nearby automatically'}
                    </span>
                  </span>
                </button>
                <p
                  className="mb-2 mt-2 text-[11px] uppercase tracking-[0.18em] text-gray-500"
                  style={{ fontFamily: '"Permanent Marker"' }}
                >
                  Or search manually
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
                      setTimeout(() => setShowLocationSuggestions(false), 200)
                    }
                    placeholder="City or address..."
                    className="w-full rounded-2xl border border-[rgba(120,94,60,0.14)] bg-white px-4 py-3 text-gray-800 placeholder:text-gray-400 outline-none"
                    style={{ fontFamily: '"Permanent Marker"' }}
                  />
                  {showLocationSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-2 overflow-hidden rounded-2xl border border-[rgba(120,94,60,0.14)] bg-white shadow-[0_16px_32px_rgba(74,53,33,0.12)]">
                      {locationSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            handleLocationSuggestionClick(suggestion);
                            setShowLocationSuggestions(false);
                          }}
                          className="flex w-full items-start gap-3 border-b border-[rgba(120,94,60,0.1)] px-4 py-3 text-left last:border-0 hover:bg-[#fff6e8] transition-colors"
                          style={{ fontFamily: '"Permanent Marker"' }}
                        >
                          <Search size={14} className="mt-0.5 shrink-0 text-gray-500" />
                          <p className="line-clamp-2 text-sm">
                            {suggestion.display_name}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {locationSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      clearLocationSelection();
                      setLocationDropdownOpen(false);
                    }}
                    className="mt-3 w-full rounded-2xl border border-[rgba(120,94,60,0.14)] bg-white px-3 py-2.5 text-gray-700 transition-colors hover:bg-[#faf4ec]"
                    style={{ fontFamily: '"Permanent Marker"' }}
                  >
                    Clear location
                  </button>
                )}
              </div>
            )}
          </div>
          <ComicIconButton
            type="submit"
            variant="ghost"
            size={'sm'}
            // variant="solid"
            accentColor="#f8c163"
            Icon={Search}
          />
        </form>
        {/* </div> */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-[4rem] left-0 z-50 w-full overflow-y-auto max-h-[70vh] max-w-[70vh]">
            {suggestions.map((suggestion: EventSearchSuggestion, index: number) => {
              const rotation = ((index % 5) - 2) * 0.6; // -1.2deg .. +1.2deg

              return (
                <button
                  key={suggestion.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setSearch(suggestion.title);
                    setShowSuggestions(false);
                    navigateToSearch({ nextSearch: suggestion.title });
                  }}
                  className="w-full cursor-pointer border border-gray-300 bg-[#fff9ef] p-4 text-left shadow-[2px_2px_0px_#333] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333]"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Search size={16} className="mt-1 shrink-0 text-gray-500" />
                    <div className="min-w-0">
                      <p
                        className="truncate text-base text-gray-900"
                        style={{ fontFamily: '"Permanent Marker"' }}
                      >
                        {suggestion.title}
                      </p>
                      <p
                        className="mt-1 line-clamp-2 text-sm text-gray-600"
                        style={{ fontFamily: '"Caveat", cursive', fontSize: '1.05rem' }}
                      >
                        {[suggestion.location_name, suggestion.start_time]
                          .filter(Boolean)
                          .join(' • ') || 'Open search results'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
