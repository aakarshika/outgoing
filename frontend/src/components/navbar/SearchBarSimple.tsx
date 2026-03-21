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
    locationDropdownOpen,
    toggleNearYou,
    setShowLocationSuggestions,
    setLocationSearch,
    showLocationSuggestions,
    locationSuggestions,
    handleLocationSuggestionClick,
    clearLocationSelection,
  } = useNavbarContext();

  return (
    <div className="sm:relative min-w-0 flex w-full mx-2 px-2 ">
      <form
        onSubmit={handleSearchSubmit}
        className="flex w-full min-w-0 items-center rounded-full bg-white/70 text-gray-800"
      >
        <div className="relative flex-1 min-w-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search"
            className="h-10  w-full min-w-0 bg-transparent px-5 py-1 text-sm text-[var(--color-text-primary)] outline-none"
          />
        </div>

        <div
          className="sm:relative flex-shrink-0 cursor-pointer rounded-full"
          ref={locationDropdownRef}
        >
          <button
            type="button"
            onClick={() => setLocationDropdownOpen((open) => !open)}
            className="flex h-10 items-center justify-end gap-2 rounded-full  px-2.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-secondary)] md:hidden"
          >
            <span className="flex items-center gap-1.5 truncate">
              <MapPin size={16} className="shrink-0 text-[#D85A30]" />
              {/* <span className="max-w-[80px] truncate text-xs">
                {nearYouEnabled ? 'Near you' : locationSearch || 'Anywhere'}
              </span> */}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setLocationDropdownOpen((open) => !open)}
            className="hidden h-10 items-center justify-between gap-2 rounded-full border border-[rgba(120,94,60,0.16)] bg-[#fffaf3] px-3 text-sm text-[var(--color-text-primary)] shadow-[0_6px_18px_rgba(74,53,33,0.06)] transition-colors hover:border-[rgba(216,90,48,0.3)] md:flex"
          >
            <span className="flex items-center gap-2 truncate">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FAECE7] text-[#D85A30]">
                <MapPin size={14} className="shrink-0" />
              </span>
              <span className="truncate">
                {nearYouEnabled
                  ? nearYouName || 'Near you'
                  : locationSearch || 'Anywhere'}
              </span>
            </span>
          </button>

          {locationDropdownOpen && (
            <div className="fixed inset-x-4 top-20 z-[100] rounded-3xl border border-[rgba(120,94,60,0.14)] bg-[#fffaf3] p-4 shadow-[0_18px_40px_rgba(74,53,33,0.14)] sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-[360px] sm:inset-x-auto">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  toggleNearYou();
                  setLocationDropdownOpen(false);
                }}
                className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-[rgba(29,158,117,0.16)] bg-[#f3fbf8] px-3 py-3 text-left text-sm text-[var(--color-text-primary)]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-[#1D9E75]">
                  <LocateFixed
                    size={16}
                    className={nearYouEnabled ? 'text-[#1D9E75]' : ''}
                  />
                </span>
                <span className="flex flex-col">
                  <span>Use current location</span>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {nearYouEnabled
                      ? nearYouName || 'Using your location'
                      : 'Find events nearby automatically'}
                  </span>
                </span>
              </button>

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
                  className="h-11 w-full rounded-2xl border border-[rgba(120,94,60,0.14)] px-3 text-sm text-[var(--color-text-primary)] outline-none"
                />

                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[80] overflow-hidden rounded-2xl border border-[rgba(120,94,60,0.14)] shadow-[0_16px_32px_rgba(74,53,33,0.12)]">
                    {locationSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          handleLocationSuggestionClick(suggestion);
                          setShowLocationSuggestions(false);
                        }}
                        className="flex w-full items-start gap-2 border-b border-[rgba(120,94,60,0.1)] px-3 py-3 text-left last:border-b-0 hover:bg-[#fff6e8]"
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

              <button
                type="button"
                onClick={() => {
                  clearLocationSelection();
                  setLocationDropdownOpen(false);
                }}
                className="mt-3 w-full rounded-2xl border border-[rgba(120,94,60,0.14)] px-3 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[#faf4ec]"
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
