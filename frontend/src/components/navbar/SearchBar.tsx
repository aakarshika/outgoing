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
    radiusMiles,
    locationDropdownOpen,
    toggleNearYou,
    setShowLocationSuggestions,
    setLocationSearch,
    showLocationSuggestions,
    locationSuggestions,
    handleLocationSuggestionClick,
    clearLocationSelection,
    setRadiusMiles,
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
              className="flex items-center gap-2 rounded-none backdrop-blur-md supports-[backdrop-filter]:bg-white/15  px-4 py-2  hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all justify-between"
              style={{ fontFamily: '"Permanent Marker"' }}
            >
              <span className="flex items-center gap-2 truncate">
                <MapPin size={18} className="text-gray-600 shrink-0" />
                <span className="truncate text-gray-800">
                  {nearYouEnabled
                    ? nearYouName || 'Near you'
                    : locationSearch || 'Location'}
                </span>
              </span>
              <span className="text-gray-500 text-xs shrink-0">{radiusMiles} mi</span>
            </button>
            {locationDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-2 z-50 w-[380px] rounded-none bg-[#f4f1ea] p-3 "
                style={{
                  backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
                  backgroundSize: '10px 10px',
                }}
              >
                <p
                  className="text-xs uppercase tracking-wider text-gray-600 mb-2"
                  style={{ fontFamily: '"Permanent Marker"' }}
                >
                  Where?
                </p>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    toggleNearYou();
                    setLocationDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 rounded-none px-4 py-3 text-left bg-blue-200/80 shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all font-bold text-gray-900 mb-3"
                  style={{ fontFamily: '"Permanent Marker"' }}
                >
                  <LocateFixed
                    size={20}
                    className={nearYouEnabled ? 'text-blue-600' : ''}
                  />
                  <span>Use current location</span>
                </button>
                <p
                  className="text-xs uppercase tracking-wider text-gray-600 mb-2 mt-2"
                  style={{ fontFamily: '"Permanent Marker"' }}
                >
                  Or type an address
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
                    className="w-full rounded-none bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-500 outline-none shadow-[2px_2px_0px_#333]"
                    style={{ fontFamily: '"Permanent Marker"' }}
                  />
                  {showLocationSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-none bg-white shadow-[3px_4px_0px_#333] overflow-hidden z-10">
                      {locationSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            handleLocationSuggestionClick(suggestion);
                            setShowLocationSuggestions(false);
                            setLocationDropdownOpen(false);
                          }}
                          className="w-full flex items-start gap-2 rounded-none px-3 py-2.5 text-left border-b border-dashed border-gray-300 last:border-0 hover:bg-yellow-100 transition-colors"
                          style={{ fontFamily: '"Permanent Marker"' }}
                        >
                          <Search size={14} className="text-gray-500 shrink-0 mt-0.5" />
                          <p className="text-sm line-clamp-2">
                            {suggestion.display_name}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p
                  className="text-xs uppercase tracking-wider text-gray-600 mb-1.5 mt-3"
                  style={{ fontFamily: '"Permanent Marker"' }}
                >
                  Miles radius
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={radiusMiles}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!Number.isNaN(v)) setRadiusMiles(v);
                    }}
                    className="w-20 rounded-none bg-white px-3 py-2 text-gray-800 outline-none shadow-[2px_2px_0px_#333]"
                    style={{ fontFamily: '"Permanent Marker"' }}
                  />
                  <span
                    className="text-sm text-gray-600"
                    style={{ fontFamily: '"Permanent Marker"' }}
                  >
                    miles
                  </span>
                </div>
                {locationSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      clearLocationSelection();
                      setLocationDropdownOpen(false);
                    }}
                    className="mt-3 w-full rounded-none bg-red-100 px-3 py-2 shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] transition-all text-gray-800 font-bold"
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
