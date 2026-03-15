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
import client from '@/api/client';
import type { ApiResponse } from '@/types/events';
import type { EventOverviewRow } from '@/pages/alerts/utils';
import { normalizeSearchPageParams } from '@/pages/search/searchUtils';

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
    const [isAllChatsSidebarOpen, setIsAllChatsSidebarOpen] = useState(false);
    const [eventOverviewRows, setEventOverviewRows] = useState<EventOverviewRow[]>([]);
    const [eventOverviewLoading, setEventOverviewLoading] = useState(false);

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

    useEffect(() => {
        if (!isAuthenticated || !user) {
            setEventOverviewRows([]);
            return;
        }

        let active = true;

        (async () => {
            try {
                setEventOverviewLoading(true);
                const { data } = await client.get<ApiResponse<EventOverviewRow[]>>(
                    '/alerts/event-overview/',
                );
                if (!active) return;
                setEventOverviewRows(data.data || []);
            } catch (err) {
                if (!active) return;
                setEventOverviewRows([]);
            } finally {
                if (active) {
                    setEventOverviewLoading(false);
                }
            }
        })();

        return () => {
            active = false;
        };
    }, [isAuthenticated, user]);

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
    const shouldShowSearch = location.pathname === '/' || location.pathname === '/search';
    const isNativeSidebarRoute = isNativeSidebarPath(location.pathname);

    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!location.pathname.startsWith('/search')) return;

        const params = normalizeSearchPageParams(new URLSearchParams(location.search));
        const nextSearch = params.get('search') || '';
        const nextLocation = params.get('location') || '';
        const nextRadius = Number(params.get('radius_miles'));

        setSearch((current) => (current === nextSearch ? current : nextSearch));
        setLocationSearch((current) =>
            current === nextLocation ? current : nextLocation,
        );

        // Sync radius from URL when the URL changes, but don't re-run on local radius edits.
        if (!Number.isNaN(nextRadius) && nextRadius > 0) {
            setRadiusMiles(nextRadius);
        }
    }, [
        location.pathname,
        location.search,
        setRadiusMiles,
    ]);

    const buildSearchPageParams = ({
        nextSearch = search,
        nextLocation = locationSearch,
        nextRadiusMiles = radiusMiles,
        nextCoords = nearYouEnabled && coords ? coords : null,
    }: {
        nextSearch?: string;
        nextLocation?: string;
        nextRadiusMiles?: number;
        nextCoords?: { lat: number | string; lng: number | string } | null;
    } = {}) => {
        const params = location.pathname.startsWith('/search')
            ? new URLSearchParams(location.search)
            : new URLSearchParams();

        params.set('tab', 'trending');

        const trimmedSearch = nextSearch.trim();
        if (trimmedSearch) {
            params.set('search', trimmedSearch);
        } else {
            params.delete('search');
        }

        const trimmedLocation = nextLocation.trim();
        if (trimmedLocation) {
            params.set('location', trimmedLocation);
            params.set('radius_miles', String(nextRadiusMiles));

            if (nextCoords) {
                params.set('lat', String(nextCoords.lat));
                params.set('lng', String(nextCoords.lng));
            } else {
                params.delete('lat');
                params.delete('lng');
            }
        } else {
            params.delete('location');
            params.delete('lat');
            params.delete('lng');
            params.delete('radius_miles');
        }

        return params;
    };

    const navigateToSearch = (options?: Parameters<typeof buildSearchPageParams>[0]) => {
        const params = buildSearchPageParams(options);
        const query = params.toString();
        navigate(query ? `/search?${query}` : '/search');
    };

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
        navigateToSearch();
    };

    const handleLocationSuggestionClick = (suggestion: LocationSuggestion) => {
        setLocationSearch(suggestion.display_name);
        setShowLocationSuggestions(false);
        navigateToSearch({
            nextLocation: suggestion.display_name,
            nextCoords: {
                lat: suggestion.lat,
                lng: suggestion.lon,
            },
        });
    };

    const {
        hostingEvents,
        vendorEvents,
        attendeeEvents,
    } = useMemo(() => {
        if (!user) {
            return {
                hostingEvents: [] as EventOverviewRow[],
                vendorEvents: [] as EventOverviewRow[],
                attendeeEvents: [] as EventOverviewRow[],
            };
        }

        const userId = user.id;

        const allowedLifecycle = new Set(['published', 'ready', 'live']);

        const hosting = new Map<number, EventOverviewRow>();
        const vendor = new Map<number, EventOverviewRow>();
        const attendee = new Map<number, EventOverviewRow>();

        for (const row of eventOverviewRows) {
            if (!allowedLifecycle.has(row.event_lifecycle_state)) continue;
            const detail = row.event_details;
            if (!detail) continue;

            if (row.host_user_id === userId) {
                hosting.set(row.event_id, row);
            }

            if (
                row.need_applied_to_user_id === userId ||
                row.need_application_requested_by_host_vendor_user_id === userId ||
                row.need_assigned_user_id === userId
            ) {
                vendor.set(row.event_id, row);
            }

            if (row.attendee_user_id === userId && row.ticket_status !== 'cancelled') {
                attendee.set(row.event_id, row);
            }
        }

        const sortByCreatedDesc = (a?: string | null, b?: string | null) =>
            new Date(b || 0).getTime() - new Date(a || 0).getTime();

        return {
            hostingEvents: Array.from(hosting.values()).sort((a, b) =>
                sortByCreatedDesc(a.event_created_date, b.event_created_date),
            ),
            vendorEvents: Array.from(vendor.values()).sort((a, b) =>
                sortByCreatedDesc(a.need_application_created_date, b.need_application_created_date),
            ),
            attendeeEvents: Array.from(attendee.values()).sort((a, b) =>
                sortByCreatedDesc(a.ticket_created_date, b.ticket_created_date),
            ),
        };
    }, [eventOverviewRows, user]);

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
            isAllChatsSidebarOpen,
            setIsAllChatsSidebarOpen,

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

            // Sidebar event overview
            eventOverviewLoading,
            hostingEvents,
            vendorEvents,
            attendeeEvents,

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
            navigateToSearch,
        }),
        [
            isAuthenticated, logout, user, theme, toggleTheme, location, navigate,
            isMenuOpen, isQuickCreateOpen, isAllChatsSidebarOpen, sidebarExpanded, nearYouEnabled, nearYouName, radiusMiles, toggleNearYou,
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
