import { LocateFixed, MapPin, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useNavbarContext } from './NavbarContext';

export const SearchBarSimple = () => {
  const {
    search,
    setSearch,
    handleSearchSubmit,
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
    navigateToSearch,
  } = useNavbarContext();
  const [radiusInput, setRadiusInput] = useState(String(radiusMiles));

  useEffect(() => {
    setRadiusInput(String(radiusMiles));
  }, [radiusMiles]);

  return (
    <div className="relative min-w-0 flex-1 bg-white">
      <form
        onSubmit={handleSearchSubmit}
        className="flex w-full min-w-0 items-center gap-1.5 sm:gap-2"
      >
        <div className="relative flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search"
            className="h-10 w-full min-w-0 bg-white py-2 pl-3 pr-1 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[#D85A30] sm:pl-4"
          />
        </div>

        <div
          className="relative flex-shrink-0 cursor-pointer rounded-full bg-white"
          ref={locationDropdownRef}
        >
          <button
            type="button"
            onClick={() => setLocationDropdownOpen((open) => !open)}
            className="flex h-10 items-center justify-end gap-2 rounded-full bg-white px-2.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-secondary)] md:hidden"
          >
            <span className="flex items-center gap-2 truncate">
              <MapPin size={14} className="shrink-0" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setLocationDropdownOpen((open) => !open)}
            className="flex hidden md:flex   h-10 items-center justify-between gap-2 rounded-full bg-white px-3 text-sm  transition-colors "
          >
            <span className="flex items-center gap-2 truncate">
              <MapPin size={14} className="shrink-0" />
              <span className="truncate">
                {nearYouEnabled
                  ? nearYouName || 'Near you'
                  : locationSearch || 'Location'}
              </span>
            </span>
            <span className="shrink-0 text-xs">{radiusMiles} mi</span>
          </button>

          {locationDropdownOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-[70] w-[min(248px,calc(100vw-20px))] overflow-hidden rounded-[14px] border border-[rgba(120,94,60,0.2)] bg-[#FFFCF7] p-2.5 shadow-[0_18px_40px_rgba(86,58,28,0.16)]">
              <div className="mb-2 px-1 text-[13px] text-[#3D3124]">Search area</div>

              <div className="mb-2 flex items-center gap-2 px-1 text-[12px] text-[rgba(61,49,36,0.62)]">
                <span className="truncate">
                  {nearYouEnabled ? nearYouName || 'Near you' : 'Custom location'}
                </span>
                <span className="ml-auto shrink-0">{radiusMiles} mi</span>
              </div>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  toggleNearYou();
                  setLocationDropdownOpen(false);
                }}
                className="mb-2 flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-[13px] text-[#3D3124] transition-colors hover:bg-[#FFF1DE]"
              >
                <LocateFixed
                  size={14}
                  className={nearYouEnabled ? 'text-[#D85A30]' : 'text-[#8f7760]'}
                />
                <span>Use current location</span>
              </button>

              <div className="relative">
                <div className="flex items-center gap-2 rounded-[10px] bg-[#fff8ee] px-3">
                  <Search size={14} className="shrink-0 text-[rgba(61,49,36,0.5)]" />
                  <input
                    autoFocus
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
                    className="h-10 w-full bg-transparent text-[13px] text-[var(--color-text-primary)] outline-none placeholder:text-[#a18d78]"
                  />
                </div>

                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[80] max-h-56 overflow-y-auto overflow-x-hidden rounded-[10px] border border-[rgba(120,94,60,0.14)] bg-[#FFFCF7] shadow-[0_12px_24px_rgba(86,58,28,0.14)]">
                    {locationSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          handleLocationSuggestionClick(suggestion);
                          setShowLocationSuggestions(false);
                        }}
                        className="flex w-full items-start gap-2 border-b border-[rgba(120,94,60,0.1)] bg-transparent px-3 py-2.5 text-left text-[13px] last:border-b-0 hover:bg-[#FFF1DE]"
                      >
                        <Search
                          size={14}
                          className="mt-0.5 shrink-0 text-[rgba(61,49,36,0.48)]"
                        />
                        <p className="line-clamp-2 text-[13px] text-[var(--color-text-primary)]">
                          {suggestion.display_name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2 px-1">
                <label className="text-[12px] text-[rgba(61,49,36,0.62)]">Radius</label>
                <div className="flex items-center gap-2 rounded-[10px] bg-[#fff8ee] px-2">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={radiusInput}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setRadiusInput(nextValue);
                      const value = parseInt(nextValue, 10);
                      if (!Number.isNaN(value) && value > 0) {
                        setRadiusMiles(value);
                        if (locationSearch.trim()) {
                          navigateToSearch({ nextRadiusMiles: value });
                        }
                      }
                    }}
                    onBlur={() => {
                      const value = parseInt(radiusInput, 10);
                      if (Number.isNaN(value) || value < 1) {
                        setRadiusInput(String(radiusMiles));
                      }
                    }}
                    className="h-9 w-14 bg-transparent text-[13px] text-[var(--color-text-primary)] outline-none"
                  />
                  <span className="text-[12px] text-[rgba(61,49,36,0.62)]">mi</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  clearLocationSelection();
                  setLocationDropdownOpen(false);
                }}
                className="mt-2 w-full rounded-[10px] px-3 py-2.5 text-left text-[13px] text-[rgba(61,49,36,0.62)] transition-colors hover:bg-[#FFF1DE] hover:text-[#3D3124]"
              >
                Clear location
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
