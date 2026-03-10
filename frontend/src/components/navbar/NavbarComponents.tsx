import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Bell,
    Briefcase,
    Calendar,
    CalendarDays,
    LocateFixed,
    MapPin,
    Menu,
    MessageSquare,
    Pencil,
    Plus,
    Search,
    Settings,
    Shield,
    Ticket,
    User,
    UserPlus
} from 'lucide-react';

import { ComicButton } from '@/components/ui/ComicButton';
import { ComicIconButton } from '@/components/ui/ComicIconButton';
import { ScrapbookEventCardLandscape } from '@/features/events/ScrapbookEventCardLandscape';
import type { EventListItem, EventSearchSuggestion } from '@/types/events';
import { useNavbarContext } from './NavbarContext';

export const dashboardLinks:
    { [key: string]: { key: string, label: string, icon?: any, type?: string, indent: number, to?: string } }
    = {
    'going': { key: 'going', label: 'Going', icon: CalendarDays, type: 'heading', indent: 1 },
    'saved': { key: 'saved', to: '/dashboard/saved', label: 'Saved Dates', icon: Ticket, indent: 2 },
    'tickets': { key: 'tickets', to: '/dashboard/tickets', label: 'My Tickets', icon: Ticket, indent: 2 },

    'activities': { key: 'activities', label: 'Activities', icon: CalendarDays, type: 'heading', indent: 1 },
    'calendar': { key: 'calendar', to: '/calendar', label: 'Calendar', icon: CalendarDays, indent: 2 },
    'my-activities': { key: 'my-activities', to: '/dashboard/activities', label: 'My Activities', icon: MessageSquare, indent: 1 },

    'organizing': { key: 'organizing', label: 'Organizing', icon: Menu, type: 'heading', indent: 1 },
    'my-events': { key: 'my-events', to: '/dashboard/events', label: 'My Events', icon: CalendarDays, indent: 2 },

    'services': { key: 'services', label: 'Services', icon: Briefcase, type: 'heading', indent: 1 },
    'my-services': { key: 'my-services', to: '/dashboard/services/my-services', label: 'My Services', indent: 2 },
    'my-opportunities': { key: 'my-opportunities', to: '/dashboard/services/opportunities', label: 'Service Opportunities', indent: 2 },

    'profile': { key: 'profile', label: 'Profile + Settings', type: 'heading', indent: 1 },
    'user-info': { key: 'user-info', to: '/profile/user-info', label: 'User Info', icon: User, indent: 2 },
    'account-settings': { key: 'account-settings', to: '/profile/settings', label: 'Account Settings', icon: Settings, indent: 2 },
    'privacy': { key: 'privacy', to: '/profile/privacy', label: 'Privacy', icon: Shield, indent: 2 },
};

export const SidebarLinkItem = ({ itemKey }: { itemKey: string }) => {
    const { location } = useNavbarContext();
    const item: { key: string, label: string, icon?: any, type?: string, indent: number, to?: string }
        = dashboardLinks[itemKey];

    return (
        <>
            {item.type === 'heading' ? (
                item.to === undefined ? (
                    <p
                        key={item.label}
                        className="mb-3 mt-5 text-sm uppercase tracking-wider text-gray-600"
                        style={{
                            fontFamily: '"Permanent Marker"',
                            transform: 'rotate(-1deg)',
                        }}
                    >
                        {item.label}
                    </p>
                ) : (
                    <Link
                        key={item.label}
                        to={item.to || ''}
                        className={`flex items-center gap-2.5 px-3 py-2 text-base transition-all hover:bg-yellow-200/60 hover:translate-x-1 ${location.pathname === item.to ? 'bg-yellow-300/50 -rotate-1 border-l-4 border-yellow-500 font-bold' : 'text-gray-700'}`}
                        style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                    >
                        {item.icon ? <item.icon className="h-4 w-4 shrink-0" /> : null}
                        {item.label}
                    </Link>
                )
            ) : (
                <Link
                    key={item.label}
                    to={item.to || ''}
                    className={`flex items-center gap-2.5 px-3 py-2 text-base transition-all hover:bg-yellow-200/60 hover:translate-x-1 ${location.pathname === item.to ? 'bg-yellow-300/50 -rotate-1 border-l-4 border-yellow-500 font-bold' : 'text-gray-700'}`}
                    style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                >
                    {item.icon ? <item.icon className="h-4 w-4 shrink-0" /> : null}
                    {item.label}
                </Link>
            )}
        </>
    );
};

export const ManageEventButton = ({ type }: {
    type: 'manage-service-ghost' | 'manage-event-ghost'
}) => {
    const { navigate, setIsQuickCreateOpen, eventId } = useNavbarContext();
    const isActive = (location.pathname.includes('host-event-management') && type === 'manage-event-ghost'
    ) || (location.pathname.includes('service-event-management') && type === 'manage-service-ghost');

    if (!isActive) return null;
    return (
        <div className={`w-full  ${isActive ? 'bg-yellow-300/50 -rotate-1 border-l-4 border-yellow-500' : ''}`}
        >
            <ComicButton
                type="button"
                variant={'solid'}
                size="default"
                shape="square"
                Icon={Pencil}
                iconProps={{ strokeWidth: 3 }}
                color={'#1e3a5f'}
                accentColor={type === 'manage-service-ghost' ? '#00CCCC'
                    : type === 'manage-event-ghost' ? '#AF90F9'
                        : '#AF90F9'}
                className="h-12 w-full"
            >
                {type === 'manage-service-ghost' ? 'Manage Service'
                    : type === 'manage-event-ghost' ? 'Manage Event'
                        : '99999'}
            </ComicButton>
        </div>
    );
};

export const CreateEventButton = ({ type }: {
    type: 'event' | 'service' | 'manage-event' | 'manage-service' | 'signin' | 'signup'
}) => {

    const { navigate, setIsQuickCreateOpen, eventId } = useNavbarContext();
    const isActive = (location.pathname.includes('host-event-management')
    ) || (location.pathname.includes('service-event-management'));

    if (isActive) return null;
    return (
        <ComicButton
            type="button"
            variant={'solid'}
            size="default"
            shape="square"
            Icon={type === 'signin' ? User : type === 'signup' ? UserPlus : Plus}
            iconProps={{ strokeWidth: 3 }}
            color={'#1e3a5f'}
            accentColor={type === 'event' ? '#AF90F9'
                : type === 'service' ? '#00CCCC'
                    : type === 'manage-event' ? '#AF90F9'
                        : type === 'manage-service' ? '#00CCCC'
                            : type === 'signin' ? '#ffffff'
                                : type === 'signup' ? 'rgb(255, 191, 103)'
                                    : '#AF90F9'}
            onClick={() => {
                if (type === 'event') setIsQuickCreateOpen(true);
                else if (type === 'service') navigate('/vendors/create');
                else if (type === 'manage-event') navigate(`/events/${eventId}/host-event-management`);
                else if (type === 'manage-service') navigate(`/events/${eventId}/service-event-management`);
                else if (type === 'signin') navigate('/signin');
                else if (type === 'signup') navigate('/signup');
            }}
            className="h-12 w-full"
        >
            {type === 'event' ? 'Create Event'
                : type === 'service' ? 'Create Service'
                    : type === 'manage-event' ? 'Manage Event'
                        : type === 'manage-service' ? 'Manage Service'
                            : type === 'signin' ? 'Sign In'
                                : type === 'signup' ? 'Sign Up'
                                    : 'Create Event'}
        </ComicButton>
    );
};

export const LogoSection = () => {
    return (
        <div>
            <div className="sm:hidden xs:hidden flex">
                {/* Logo for small screens */}
                <Link
                    to="/"
                    className="flex flex-shrink-0 items-center mr-4 relative group"
                >
                    <span
                        className="text-4xl font-bold text-gray-900 relative z-10"
                        style={{ fontFamily: '"Permanent Marker"', scale: 1.2 }}
                    >
                        <img
                            src="assets/go-symbol.png"
                            alt="Outgoing"
                            title="Outgoing"
                            className="h-10 w-10"
                            style={{
                                filter: 'drop-shadow(2px 2px 1px #E2BF00) ',
                                transform: 'scale(1.3)',
                            }}
                        />
                    </span>
                </Link>
            </div>
            <div className="sm:flex xs:flex hidden">
                {/* Logo for medium screens */}
                <Link
                    to="/"
                    className="flex flex-shrink-0 items-center relative group"
                >
                    <span
                        className="text-4xl inline-flex items-center font-bold text-gray-900 relative z-10"
                        style={{ fontFamily: '"Permanent Marker"', scale: 1.2 }}
                    >
                        Out
                        <img
                            src="assets/go-symbol.png"
                            alt="Outgoing"
                            title="Outgoing"
                            className="h-10 w-10"
                            style={{
                                filter: 'drop-shadow(2px 2px 1px #E2BF00) ',
                                transform: 'scale(1.3)',
                            }}
                        />
                        ing
                    </span>
                </Link>
            </div>
        </div>
    );
};

export const IconButtonsSection = () => {
    const { alertsCount, isVendor, isEventHost, setIsQuickCreateOpen } = useNavbarContext();

    return (
        <div>
            <div className="hidden sm:flex xs:flex items-center gap-2">
                <ComicIconButton variant="ghost" size="icon" asChild Icon={Bell}>
                    <Link to="/alerts" aria-label="Alerts">
                        <div className="absolute top-0 right-0 h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white z-10">
                            {alertsCount > 0 && <span>{alertsCount}</span>}
                        </div>
                    </Link>
                </ComicIconButton>
                <ComicIconButton
                    variant="ghost"
                    size="icon"
                    asChild
                    Icon={Calendar}
                >
                    <Link to="/calendar" aria-label="Calendar" />
                </ComicIconButton>
                {!isVendor && !isEventHost && (
                    <ComicIconButton
                        variant="ghost"
                        size="icon"
                        Icon={Plus}
                        color="#AF90F9"
                        onClick={() => setIsQuickCreateOpen(true)}
                    />
                )}
            </div>
        </div>
    );
};

export const UserInfoSection = () => {
    const { user, navigate } = useNavbarContext();

    return (
        <div>
            {/* User Details Header */}
            <div className="mb-6 relative group">
                <div
                    className="absolute -inset-2 bg-yellow-200/40 border-2 border-dashed border-gray-400 -rotate-2 group-hover:rotate-0 transition-transform"
                    style={{ borderRadius: '4px' }}
                />
                <div
                    className="relative flex cursor-pointer items-center gap-4 p-2 bg-white/40 border border-gray-200"
                    onClick={() => navigate(`/user/${user?.username}`)}
                >
                    <div className="w-16 h-16 rounded-none border-2 border-gray-800 bg-white overflow-hidden shadow-[2px_2px_0] p-1 rotate-3">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.username}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <User className="h-8 w-8 text-gray-400" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3
                            className="text-xl text-gray-900 leading-tight"
                            style={{ fontFamily: '"Permanent Marker", cursive' }}
                        >
                            {user ? `${user.first_name} ${user.last_name}` : 'Logged In'}
                        </h3>
                        <p
                            className="text-gray-500 text-sm"
                            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
                        >
                            @{user?.username}
                        </p>
                    </div>
                </div>
                {/* Washi tape accent */}
                <div
                    className="absolute -top-3 -left-2 w-12 h-6 pointer-events-none z-10"
                    style={{
                        background: 'rgba(59, 130, 246, 0.4)',
                        transform: 'rotate(-15deg)',
                        border: '1px solid rgba(0,0,0,0.05)',
                    }}
                />
            </div>
        </div>
    );
};

export const EventManagementHeader = () => {
    const { event, navigate } = useNavbarContext();

    return (
        <div>
            <div className="w-full">
                <div className="mx-auto flex w-full max-w-4xl items-center gap-4 pt-2 pb-3">
                    <button
                        type="button"
                        onClick={() => navigate('/events/' + event?.id + '')}
                        className="flex items-center justify-center h-10 w-10 border-2 border-gray-800 rounded-full bg-white shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all relative z-10"
                    >
                        <ArrowLeft className="h-5 w-5" strokeWidth={3} />
                    </button>
                    <div>
                        <h1
                            className="text-3xl text-gray-900"
                            style={{
                                fontFamily: '"Permanent Marker", cursive',
                                transform: 'rotate(-1deg)',
                            }}
                        >
                            {event?.title || 'Host Event Management'}
                        </h1>
                    </div>
                </div>
            </div>
        </div>
    );
};

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
        setRadiusMiles,
        suggestions,
    } = useNavbarContext();

    return (
        <div className="flex-1 min-w-0">
            <div className="relative hidden md:flex w-full p-4">
                <form
                    onSubmit={handleSearchSubmit}
                    className="flex items-center w-full rounded-none border-2 border-gray-800 bg-[#f4f1ea] pl-5 pr-2 py-2.5 shadow-[3px_4px_0px_#333] focus-within:shadow-[2px_3px_0px_#333] focus-within:translate-x-[1px] focus-within:translate-y-[1px] transition-all"
                    style={{ fontFamily: '"Permanent Marker"' }}
                >
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        placeholder="Search events..."
                        className="flex-1 min-w-[140px] bg-transparent text-base outline-none text-gray-800 placeholder:text-gray-500"
                        style={{ fontFamily: '"Permanent Marker"' }}
                    />
                    <div className="h-7 w-[2px] bg-gray-400 mx-3 flex-shrink-0" />
                    <div className="relative flex-shrink-0" ref={locationDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setLocationDropdownOpen((o) => !o)}
                            className="flex items-center gap-2 rounded-none border-2 border-gray-800 bg-white px-4 py-2 shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all min-w-[160px] justify-between"
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
                            <span className="text-gray-500 text-xs shrink-0">
                                {radiusMiles} mi
                            </span>
                        </button>
                        {locationDropdownOpen && (
                            <div
                                className="absolute top-full left-0 mt-2 z-50 w-[380px] rounded-none border-2 border-gray-800 bg-[#f4f1ea] p-3 shadow-[4px_5px_0px_#333]"
                                style={{
                                    backgroundImage:
                                        'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
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
                                    className="w-full flex items-center gap-3 rounded-none border-2 border-gray-800 px-4 py-3 text-left bg-blue-200/80 shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all font-bold text-gray-900 mb-3"
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
                                            setTimeout(
                                                () => setShowLocationSuggestions(false),
                                                200,
                                            )
                                        }
                                        placeholder="City or address..."
                                        className="w-full rounded-none border-2 border-gray-800 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-500 outline-none shadow-[2px_2px_0px_#333]"
                                        style={{ fontFamily: '"Permanent Marker"' }}
                                    />
                                    {showLocationSuggestions &&
                                        locationSuggestions.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 rounded-none border-2 border-gray-800 bg-white shadow-[3px_4px_0px_#333] overflow-hidden z-10">
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
                                                        <Search
                                                            size={14}
                                                            className="text-gray-500 shrink-0 mt-0.5"
                                                        />
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
                                        className="w-20 rounded-none border-2 border-gray-800 bg-white px-3 py-2 text-gray-800 outline-none shadow-[2px_2px_0px_#333]"
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
                                            setLocationSearch('');
                                            if (nearYouEnabled) toggleNearYou();
                                            const params = new URLSearchParams(
                                                window.location.search,
                                            );
                                            params.delete('location');
                                            params.delete('lat');
                                            params.delete('lng');
                                            navigate(`/?${params.toString()}`);
                                            setLocationDropdownOpen(false);
                                        }}
                                        className="mt-3 w-full rounded-none border-2 border-gray-800 bg-red-100 px-3 py-2 shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] transition-all text-gray-800 font-bold"
                                        style={{ fontFamily: '"Permanent Marker"' }}
                                    >
                                        Clear location
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <ComicIconButton
                        // variant="outline"
                        variant="solid"
                        accentColor="#f8c163"
                        Icon={Search}
                        className="ml-2"
                        iconProps={{ size: 20, strokeWidth: 3 }}
                    />
                </form>
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-[4rem] left-0 z-50 w-full rounded-none border-2 border-gray-800 bg-[#f4f1ea] p-3 shadow-[4px_5px_0px_#333] overflow-y-auto max-h-[70vh] max-w-[70vh]">
                        {suggestions.map((suggestion: EventSearchSuggestion, index: number) => {
                            const rotation = ((index % 5) - 2) * 0.6; // -1.2deg .. +1.2deg

                            const eventLike: EventListItem = {
                                // Core identity
                                id: suggestion.id,
                                title: suggestion.title,
                                slug: suggestion.slug ?? '',
                                // Host (fallback when missing)
                                host: suggestion.host ?? {
                                    username: '',
                                    first_name: '',
                                    avatar: null,
                                },
                                // Category: prefer full object, else construct from name/slug
                                category:
                                    suggestion.category ??
                                    (suggestion.category_name || suggestion.category_slug
                                        ? {
                                            id: 0,
                                            name: suggestion.category_name ?? suggestion.category_slug ?? '',
                                            slug:
                                                suggestion.category_slug ??
                                                (suggestion.category_name
                                                    ? suggestion.category_name.toLowerCase().replace(/\s+/g, '-')
                                                    : ''),
                                            icon: '',
                                        }
                                        : null),
                                // Location
                                location_name: suggestion.location_name,
                                location_address: suggestion.location_address,
                                latitude: suggestion.latitude ?? null,
                                longitude: suggestion.longitude ?? null,
                                // Timing: use autocomplete-provided start_time when available
                                start_time:
                                    suggestion.start_time ??
                                    suggestion.created_at ??
                                    new Date().toISOString(),
                                end_time:
                                    suggestion.end_time ??
                                    suggestion.start_time ??
                                    suggestion.created_at ??
                                    new Date().toISOString(),
                                // Pricing
                                ticket_price_standard: suggestion.ticket_price_standard ?? null,
                                ticket_price_flexible: suggestion.ticket_price_flexible ?? null,
                                // Media
                                cover_image: suggestion.cover_image ?? null,
                                media: suggestion.media,
                                // Status / lifecycle
                                status: suggestion.status ?? 'published',
                                lifecycle_state: suggestion.lifecycle_state ?? 'published',
                                // Counts
                                capacity: suggestion.capacity ?? null,
                                interest_count: suggestion.interest_count ?? 0,
                                ticket_count: suggestion.ticket_count ?? 0,
                                // User flags
                                user_is_interested: suggestion.user_is_interested ?? false,
                                user_has_ticket: suggestion.user_has_ticket ?? false,
                                user_is_vendor: suggestion.user_is_vendor ?? false,
                                // Optional extras
                                series: suggestion.series,
                                occurrence_index: suggestion.occurrence_index,
                                description: suggestion.description,
                                reviews: suggestion.reviews,
                                average_rating: suggestion.average_rating,
                                ticket_tiers: suggestion.ticket_tiers,
                                created_at: suggestion.created_at,
                            };

                            return (
                                <div
                                    key={suggestion.id}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setShowSuggestions(false)}
                                    className="w-full cursor-pointer"
                                    style={{
                                        transform: `rotate(${rotation}deg)`,
                                        transformOrigin: 'center',
                                        transition: 'transform 0.2s ease',
                                    }}
                                >
                                    <ScrapbookEventCardLandscape
                                        event={eventLike}
                                        isBasicEventCard={true}
                                        size="compact"
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
