import { useEffect, useState } from 'react';
import { LocateFixed, MapPin, Search } from 'lucide-react';
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
    setRadiusMiles,
    navigateToSearch,
  } = useNavbarContext();
  const [radiusInput, setRadiusInput] = useState(String(radiusMiles));

  useEffect(() => {
    setRadiusInput(String(radiusMiles));
  }, [radiusMiles]);

  return (
    <div className="relative  min-w-0 flex-1">
      <form onSubmit={handleSearchSubmit} className="flex w-full items-center gap-2">
        <div className="relative min-w-[100px] flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search"
            className="h-10 w-full rounded-full bg-white/70   py-2 pl-4 pr-1 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[#D85A30]"
          />
        </div>

        <div className="relative  hidden md:flex  flex-shrink-0 cursor-pointer rounded-full bg-white/70 " ref={locationDropdownRef}>
          <button
            type="button"
            onClick={() => setLocationDropdownOpen((open) => !open)}
            className="flex h-10 min-w-[170px] items-center justify-between gap-2 rounded-full bg-white/70 px-3 text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-secondary)]"
          >
            <span className="flex items-center gap-2 truncate">
              <MapPin size={14} className="shrink-0" />
              <span className="truncate">
                {nearYouEnabled ? nearYouName || 'Near you' : locationSearch || 'Location'}
              </span>
            </span>
            <span className="shrink-0 text-xs">{radiusMiles} mi</span>
          </button>

          {locationDropdownOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-[70] w-[360px] rounded-2xl bg-white/70 p-3 ">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  toggleNearYou();
                  setLocationDropdownOpen(false);
                }}
                className="mb-3 flex w-full items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-left text-sm text-[var(--color-text-primary)]"
              >
                <LocateFixed size={16} className={nearYouEnabled ? 'text-[#D85A30]' : ''} />
                <span>Use current location</span>
              </button>

              <div className="relative">
                <input
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value);
                    if (nearYouEnabled) toggleNearYou();
                  }}
                  onFocus={() => {
                    if (locationSuggestions.length > 0) setShowLocationSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                  placeholder="City or address..."
                  className="h-10 w-full rounded-xl bg-white/70 px-3 text-sm text-[var(--color-text-primary)] outline-none"
                />

                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[80] overflow-hidden rounded-xl ">
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
                        className="flex w-full items-start gap-2 border-b border-white/70 px-3 py-2 text-left last:border-b-0 hover:bg-white/70"
                      >
                        <Search
                          size={14}
                          className="mt-0.5 shrink-0 text-[var(--color-text-secondary)]"
                        />
                        <p className="line-clamp-2 text-sm text-[var(--color-text-primary)]">
                          {suggestion.display_name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <label className="text-xs text-[var(--color-text-secondary)]">Radius</label>
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
                  className="h-8 w-20 rounded-lg bg-white/70 px-2 text-sm text-[var(--color-text-primary)] outline-none"
                />
                <span className="text-xs text-[var(--color-text-secondary)]">miles</span>
              </div>

              {locationSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setLocationSearch('');
                    if (nearYouEnabled) toggleNearYou();
                    navigateToSearch({ nextLocation: '' });
                    setLocationDropdownOpen(false);
                  }}
                  className="mt-3 w-full rounded-xl  px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]"
                >
                  Clear location
                </button>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-secondary)]"
          aria-label="Search"
        >
          <Search size={16} />
        </button>
      </form>

    </div>
  );
};
