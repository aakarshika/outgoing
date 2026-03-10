import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { useLocation, useNavigate, matchPath } from 'react-router-dom';

import { useAlerts } from '@/features/alerts/hooks';
import { useAuth } from '@/features/auth/hooks';
import { useEvent, useEventAutocomplete } from '@/features/events/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { canUseBrowserGeolocation, searchLocation } from '@/utils/geolocation';
import type { LocationSuggestion } from '@/utils/geolocation';
import { useDebouncedValue } from '@/utils/useDebouncedValue';
import { useNearYou } from '@/utils/useNearYou';

export function isNativeSidebarPath(path: string): boolean {
    const isDashboard =
        path === '/dashboard' || path.startsWith('/dashboard/');
    const isCreateService = path === '/vendors/create';
    const isManageEvent = path.includes('/host-event-management');
    const isManageService = path.includes('/service-event-management');
    return (
        isDashboard ||
        isCreateService ||
        isManageEvent ||
        isManageService
    );
}

// Hook containing all state and calculations extracted from Navbar
export function useNavbarData() {
    const { isAuthenticated, logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(() => {
        // if (typeof window === 'undefined') return false;
        // const stored = window.localStorage.getItem('navbarSidebarState');
        // if (stored === 'expanded') return true;
        // if (stored === 'collapsed') return false;
        // "Native" state is null -> native pages start open, others collapsed
        return isNativeSidebarPath(window.location.pathname);
    });
    const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

    const {
        enabled: nearYouEnabled,
        coords,
        locationName: nearYouName,
        radiusMiles,
        setRadiusMiles,
        toggleLocation: toggleNearYou,
    } = useNearYou();

    const [search, setSearch] = useState('');
    const [locationSearch, setLocationSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
    const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
    const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

    const locationDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (nearYouEnabled) {
            setLocationSearch(nearYouName);
        }
    }, [nearYouEnabled, nearYouName]);

    // Ask Chrome for location permission on load when user is logged in
    useEffect(() => {
        if (!isAuthenticated || !canUseBrowserGeolocation()) return;
        navigator.geolocation.getCurrentPosition(
            () => { },
            () => { },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
        );
    }, [isAuthenticated]);

    // Close location dropdown on click outside
    useEffect(() => {
        if (!locationDropdownOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (
                locationDropdownRef.current &&
                !locationDropdownRef.current.contains(e.target as Node)
            ) {
                setLocationDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [locationDropdownOpen]);

    const navigate = useNavigate();
    const debouncedSearch = useDebouncedValue(search, 300);
    const debouncedLocationSearch = useDebouncedValue(locationSearch, 300);

    const { data: autocompleteResponse } = useEventAutocomplete(debouncedSearch);
    const suggestions = autocompleteResponse?.data || [];

    useEffect(() => {
        if (debouncedLocationSearch.length >= 3 && !nearYouEnabled) {
            searchLocation(debouncedLocationSearch).then((results) => {
                setLocationSuggestions(results);
                setShowLocationSuggestions(true);
            });
        } else {
            setLocationSuggestions([]);
            setShowLocationSuggestions(false);
        }
    }, [debouncedLocationSearch, nearYouEnabled]);

    const { data: response } = useAlerts({ enabled: isAuthenticated });
    const alertsCount = response?.data?.length || 0;

    const eventManagementMatch =
        matchPath(
            { path: '/events/:id/host-event-management/*', end: false },
            location.pathname,
        ) ??
        matchPath(
            { path: '/events/:id/service-event-management/*', end: false },
            location.pathname,
        );
    const isEventManagementRoute = Boolean(eventManagementMatch);

    const eventMatch = matchPath(
        { path: '/events/:id/*', end: false },
        location.pathname,
    );
    const eventId = eventMatch?.params.id;
    const { data: eventResponse } = useEvent(Number(eventId));
    const event = eventResponse?.data;

    const isEventHost =
        isAuthenticated && user && event && user.username === event.host?.username;
    const isVendor =
        isAuthenticated &&
        user &&
        event &&
        !!(event.user_applications && event.user_applications.length > 0);
    const isNotOnManagePage = !location.pathname.includes('manage');
    const shouldShowSearch = location.pathname === '/';
    const isNativeSidebarRoute = isNativeSidebarPath(location.pathname);

    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    // Keep persistent sidebar state in sync with menu button toggles
    useEffect(() => {
        setSidebarExpanded(() => {
            const next = isMenuOpen;
            if (typeof window !== 'undefined') {
                window.localStorage.setItem('navbarSidebarState', next ? 'expanded' : 'collapsed');
            }
            return next;
        });
    }, [isMenuOpen]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSuggestions(false);
        const params = new URLSearchParams(window.location.search);
        if (search.trim()) params.set('search', search.trim());
        else params.delete('search');

        if (locationSearch.trim()) {
            params.set('location', locationSearch.trim());
            params.set('radius_miles', String(radiusMiles));
            if (nearYouEnabled && coords) {
                params.set('lat', String(coords.lat));
                params.set('lng', String(coords.lng));
            }
        } else {
            params.delete('location');
            params.delete('lat');
            params.delete('lng');
            params.delete('radius_miles');
        }

        if (params.toString()) {
            navigate(`/?${params.toString()}`);
        } else {
            navigate('/');
        }
    };

    const handleLocationSuggestionClick = (suggestion: LocationSuggestion) => {
        setLocationSearch(suggestion.display_name);
        setShowLocationSuggestions(false);
        const params = new URLSearchParams(window.location.search);
        params.set('location', suggestion.display_name);
        params.set('lat', suggestion.lat);
        params.set('lng', suggestion.lon);
        params.set('radius_miles', String(radiusMiles));
        navigate(`/?${params.toString()}`);
    };

    return useMemo(
        () => ({
            // Auth & user
            isAuthenticated,
            logout,
            user,

            // Theme
            theme,
            toggleTheme,

            // Routing
            location,
            navigate,

            // UI state
            isMenuOpen,
            setIsMenuOpen,
            isQuickCreateOpen,
            setIsQuickCreateOpen,

            // Sidebar persistence
            sidebarExpanded,
            // setSidebarExpanded,

            // Geolocation
            nearYouEnabled,
            nearYouName,
            radiusMiles,
            setRadiusMiles,
            toggleNearYou,

            // Search
            search,
            setSearch,
            locationSearch,
            setLocationSearch,
            showSuggestions,
            setShowSuggestions,
            showLocationSuggestions,
            setShowLocationSuggestions,
            locationSuggestions,
            locationDropdownOpen,
            setLocationDropdownOpen,
            locationDropdownRef,
            suggestions,

            // Alerts
            alertsCount,

            // Event computed state
            isEventManagementRoute,
            eventId,
            event,
            isEventHost,
            isVendor,
            isNotOnManagePage,
            shouldShowSearch,
            isNativeSidebarRoute,

            // Handlers
            handleSearchSubmit,
            handleLocationSuggestionClick,
        }),
        [
            isAuthenticated, logout, user, theme, toggleTheme, location, navigate,
            isMenuOpen, isQuickCreateOpen, sidebarExpanded, nearYouEnabled, nearYouName, radiusMiles, toggleNearYou,
            search, locationSearch, showSuggestions, showLocationSuggestions, locationSuggestions,
            locationDropdownOpen, suggestions, alertsCount, isEventManagementRoute, eventId, event,
            isEventHost, isVendor, isNotOnManagePage, shouldShowSearch, isNativeSidebarRoute
        ]
    );
}

// Create context
export type NavbarContextType = ReturnType<typeof useNavbarData>;

export const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

// Provider component
export function NavbarProvider({ children }: { children: React.ReactNode }) {
    const navbarData = useNavbarData();

    if (navbarData.location.pathname.includes('/gallery/')) return null;

    return (
        <NavbarContext.Provider value={navbarData}>
            {children}
        </NavbarContext.Provider>
    );
}

// Hook for child components
export function useNavbarContext() {
    const context = useContext(NavbarContext);
    if (context === undefined) {
        throw new Error('useNavbarContext must be used within a NavbarProvider');
    }
    return context;
}
