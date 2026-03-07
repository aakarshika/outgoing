import {
    Briefcase,
    CalendarClock,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    MapPin,
    Megaphone,
    Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';


import { useMyEvents, useMyTickets, useMyInterestedEvents } from '@/features/events/hooks';
import { useMyApplications, useMyNeedInvites } from '@/features/needs/hooks';
import type { TicketInfo, EventListItem } from '@/types/events';
import type { NeedApplication, NeedInvite } from '@/types/needs';
import { scrapbookTheme } from '@/features/events/theme/scrapbookTheme';

type CalendarFilter = 'all' | 'hosting' | 'attending' | 'saved' | 'vendor';
type CalendarKind = 'hosting' | 'attending' | 'saved' | 'vendor_request' | 'vendor_application';

interface CalendarItem {
    id: string;
    kind: CalendarKind;
    title: string;
    subtitle: string;
    location: string;
    eventTime: string;
    route: string;
    cta: string;
    tag: string;
    isPast: boolean;
}

const KIND_STYLES: Record<CalendarKind, string> = {
    hosting: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-[Caveat] text-base border border-blue-300',
    attending: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-[Caveat] text-base border border-emerald-300',
    saved: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-[Caveat] text-base border border-red-300',
    vendor_request: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-[Caveat] text-base border border-amber-300',
    vendor_application: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-[Caveat] text-base border border-purple-300',
};

const KIND_DOT_STYLES: Record<CalendarKind, string> = {
    hosting: 'bg-blue-500',
    attending: 'bg-emerald-500',
    saved: 'bg-red-500',
    vendor_request: 'bg-amber-500',
    vendor_application: 'bg-purple-500',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatRelative(date: string) {
    const delta = new Date(date).getTime() - Date.now();
    const hours = Math.ceil(delta / (1000 * 60 * 60));
    if (hours <= 0) return 'Happening now / passed';
    if (hours < 24) return `in ${hours} hour${hours === 1 ? '' : 's'}`;
    const days = Math.ceil(hours / 24);
    return `in ${days} day${days === 1 ? '' : 's'}`;
}

function toDateKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
    ).padStart(2, '0')}`;
}

function monthLabel(date: Date) {
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function buildMonthGrid(visibleMonth: Date) {
    const start = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 42 }).map((_, index) => {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + index);
        return {
            date,
            key: toDateKey(date),
            inMonth: date.getMonth() === visibleMonth.getMonth(),
            isToday: toDateKey(date) === toDateKey(new Date()),
        };
    });
}

export default function CalendarPage() {
    const [filter, setFilter] = useState<CalendarFilter>('all');
    const [visibleMonth, setVisibleMonth] = useState(() => {
        const current = new Date();
        return new Date(current.getFullYear(), current.getMonth(), 1);
    });
    const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
    const { data: eventsResponse, isLoading: loadingEvents } = useMyEvents();
    const { data: ticketsResponse, isLoading: loadingTickets } = useMyTickets();
    const { data: savedResponse, isLoading: loadingSaved } = useMyInterestedEvents();
    const { data: appsResponse, isLoading: loadingApps } = useMyApplications();
    const { data: invitesResponse, isLoading: loadingInvites } = useMyNeedInvites();

    const myEvents = (eventsResponse?.data || []) as EventListItem[];
    const myTickets = (ticketsResponse?.data || []) as TicketInfo[];
    const mySaved = (savedResponse?.data || []) as EventListItem[];
    const myApplications = (appsResponse?.data || []) as NeedApplication[];
    const myInvites = (invitesResponse?.data || []) as NeedInvite[];

    const isLoading = loadingEvents || loadingTickets || loadingSaved || loadingApps || loadingInvites;
    const now = Date.now();

    const timeline = useMemo<CalendarItem[]>(() => {
        const hosted: CalendarItem[] = myEvents.map((event) => {
            const isPast = new Date(event.start_time).getTime() < now;
            return {
                id: `host-${event.id}`,
                kind: 'hosting',
                title: event.title,
                subtitle: isPast ? 'Hosted event' : 'Upcoming hosted event',
                location: event.location_name || 'Location TBD',
                eventTime: event.start_time,
                route: `/events/${event.id}/manage`,
                cta: 'Manage Event',
                tag: isPast ? 'Hosted' : 'Hosting',
                isPast,
            };
        });

        const attending: CalendarItem[] = myTickets.map((ticket) => {
            const isPast = new Date(ticket.event_summary.start_time).getTime() < now;
            return {
                id: `ticket-${ticket.id}`,
                kind: 'attending',
                title: ticket.event_summary.title,
                subtitle: isPast ? 'Attended event' : 'Upcoming event',
                location: ticket.event_summary.location_name || 'Location TBD',
                eventTime: ticket.event_summary.start_time,
                route: `/events/${ticket.event_summary.id}`,
                cta: 'View Event',
                tag: isPast ? 'Attended' : 'Attending',
                isPast,
            };
        });

        const saved: CalendarItem[] = mySaved.map((event) => {
            const isPast = new Date(event.start_time).getTime() < now;
            return {
                id: `saved-${event.id}`,
                kind: 'saved',
                title: event.title,
                subtitle: isPast ? 'Saved event (past)' : 'Saved event',
                location: event.location_name || 'Location TBD',
                eventTime: event.start_time,
                route: `/events/${event.id}`,
                cta: 'View Event',
                tag: isPast ? 'Saved (past)' : 'Saved',
                isPast,
            };
        });

        const vendorRequests: CalendarItem[] = myInvites.map((invite) => {
            const eventTime = myApplications.find(
                (app) =>
                    app.need_title === invite.need_title &&
                    app.event_id === invite.event_id
            )?.created_at;
            return {
                id: `invite-${invite.id}`,
                kind: 'vendor_request',
                title: invite.need_title,
                subtitle: `Service requested for ${invite.event_title}`,
                location: 'Open event details for venue',
                eventTime: eventTime || invite.created_at,
                route: '/vendor-opportunities',
                cta: 'Review Opportunity',
                tag: invite.status === 'pending' ? 'Requested' : 'Handled',
                isPast: invite.status !== 'pending',
            };
        });

        const vendorApplications: CalendarItem[] = myApplications.map((app) => {
            const isPast = app.status === 'rejected' || app.status === 'withdrawn';
            return {
                id: `application-${app.id}`,
                kind: 'vendor_application',
                title: app.need_title || 'Need Application',
                subtitle: `${app.status.toUpperCase()} · ${app.event_title || 'Event'}`,
                location: 'Open event for latest details',
                eventTime: app.created_at,
                route: app.event_id ? `/events/${app.event_id}` : '/dashboard',
                cta: 'Open Event',
                tag: app.status,
                isPast,
            };
        });

        return [...hosted, ...attending, ...saved, ...vendorRequests, ...vendorApplications].sort(
            (a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime()
        );
    }, [myEvents, myTickets, mySaved, myInvites, myApplications, now]);

    const typeFiltered = timeline.filter((item) => {
        if (filter === 'all') return true;
        if (filter === 'hosting') return item.kind === 'hosting';
        if (filter === 'attending') return item.kind === 'attending';
        if (filter === 'saved') return item.kind === 'saved';
        return item.kind === 'vendor_request' || item.kind === 'vendor_application';
    });
    const dayFiltered = selectedDateKey
        ? typeFiltered.filter((item) => toDateKey(new Date(item.eventTime)) === selectedDateKey)
        : typeFiltered;
    const monthDays = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
    const eventsByDay = useMemo(() => {
        const bucket: Record<string, CalendarItem[]> = {};
        typeFiltered.forEach((item) => {
            const key = toDateKey(new Date(item.eventTime));
            if (!bucket[key]) bucket[key] = [];
            bucket[key].push(item);
        });
        return bucket;
    }, [typeFiltered]);

    return (
        <div
            className="min-h-screen py-8"
            style={{
                backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
                backgroundSize: '20px 20px',
            }}
        >
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <section
                    className="mb-8 p-6 sm:p-8"
                    style={{
                        ...(scrapbookTheme as any).paperCard,
                        transform: 'rotate(-0.5deg)',
                        backgroundColor: '#fffdf0',
                    }}
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-widest text-[#ef4444]" style={{ fontFamily: '"Permanent Marker"' }}>
                                Unified Timeline
                            </p>
                            <h1 className="text-4xl font-black mt-2" style={{ fontFamily: '"Permanent Marker"', color: '#1f2937' }}>My Calendar</h1>
                            <p className="text-base font-medium mt-2" style={{ fontFamily: '"Caveat"', fontSize: '1.25rem' }}>
                                Hosting, attending, saving, and vendor request milestones in one place.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <span
                                className="px-4 py-2 font-bold"
                                style={{
                                    ...(scrapbookTheme as any).stickyNote,
                                    backgroundColor: '#bfdbfe',
                                    transform: 'rotate(2deg)',
                                }}
                            >
                                {myEvents.length} hosted
                            </span>
                            <span
                                className="px-4 py-2 font-bold"
                                style={{
                                    ...(scrapbookTheme as any).stickyNote,
                                    backgroundColor: '#a7f3d0',
                                    transform: 'rotate(-1deg)',
                                }}
                            >
                                {myTickets.length} tickets
                            </span>
                            <span
                                className="px-4 py-2 font-bold"
                                style={{
                                    ...(scrapbookTheme as any).stickyNote,
                                    backgroundColor: '#fecaca',
                                    transform: 'rotate(1deg)',
                                }}
                            >
                                {mySaved.length} saved
                            </span>
                            <span
                                className="px-4 py-2 font-bold"
                                style={{
                                    ...(scrapbookTheme as any).stickyNote,
                                    backgroundColor: '#fde68a',
                                    transform: 'rotate(-2deg)',
                                }}
                            >
                                {myInvites.filter((invite) => invite.status === 'pending').length} requests
                            </span>
                        </div>
                    </div>
                </section>

                <section className="mb-6 flex flex-wrap gap-3">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'hosting', label: 'Hosting' },
                        { key: 'attending', label: 'Attending' },
                        { key: 'saved', label: 'Saved' },
                        { key: 'vendor', label: 'Vendor' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key as CalendarFilter)}
                            className={`px-4 py-2 font-bold transition-transform hover:scale-105 active:scale-95 ${filter === tab.key ? 'text-black' : 'text-gray-600'
                                }`}
                            style={{
                                ...(scrapbookTheme as any).border,
                                fontFamily: '"Caveat"',
                                fontSize: '1.25rem',
                                backgroundColor: filter === tab.key ? '#fde047' : '#fdfdfd',
                                boxShadow: filter === tab.key ? '3px 4px 0px #333' : '2px 2px 0px #333',
                                transform: `rotate(${Math.random() * 2 - 1}deg)`,
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </section>
                <section
                    className="mb-8 p-4 sm:p-6"
                    style={{
                        ...(scrapbookTheme as any).paperCard,
                        transform: 'rotate(0.5deg)',
                        backgroundColor: '#fcfcfc',
                    }}
                >
                    <div className="mb-6 flex items-center justify-between border-b-2 border-gray-800 pb-4">
                        <h2 className="text-3xl font-black" style={{ fontFamily: '"Permanent Marker"' }}>{monthLabel(visibleMonth)}</h2>
                        <div className="flex items-center gap-2">
                            <button
                                className="p-2 border-2 border-gray-800 rounded bg-[#fdfdfd] shadow-[2px_2px_0px_#333] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                                onClick={() =>
                                    setVisibleMonth(
                                        (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                                    )
                                }
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                className="p-2 border-2 border-gray-800 rounded bg-[#fdfdfd] shadow-[2px_2px_0px_#333] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                                onClick={() =>
                                    setVisibleMonth(
                                        (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                                    )
                                }
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-sm font-bold mb-3 border-b-2 border-gray-800 pb-2" style={{ fontFamily: '"Permanent Marker"' }}>
                        {WEEKDAYS.map((day) => (
                            <div key={day} className="py-1">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 border-t-2 border-gray-800 pt-2">
                        {monthDays.map((day) => {
                            const dayItems = eventsByDay[day.key] || [];
                            const uniqueKinds = Array.from(new Set(dayItems.map((item) => item.kind))).slice(0, 4);
                            const isSelected = selectedDateKey === day.key;
                            return (
                                <button
                                    key={day.key}
                                    onClick={() =>
                                        setSelectedDateKey((prev) => (prev === day.key ? null : day.key))
                                    }
                                    className={`min-h-[70px] border-2 text-left transition-all sm:min-h-[90px] sm:p-2 flex flex-col items-start justify-start p-1.5 ${day.inMonth ? 'bg-[#fdfdfd] border-gray-800 hover:-translate-y-1 hover:shadow-[2px_2px_0px_#333]' : 'bg-gray-100 border-gray-400 text-gray-400'
                                        } ${isSelected ? 'ring-4 ring-yellow-400 bg-yellow-50 shadow-[2px_2px_0px_#333]' : ''}`}
                                >
                                    <div
                                        className={`text-sm font-bold w-full ${day.isToday ? 'text-red-500 underline decoration-2 underline-offset-2' : day.inMonth ? 'text-gray-900' : 'text-gray-400'
                                            }`}
                                        style={{ fontFamily: '"Permanent Marker"' }}
                                    >
                                        {day.date.getDate()}
                                    </div>
                                    {dayItems.length > 0 && (
                                        <div className="mt-2 w-full">
                                            <div className="text-xs font-medium text-gray-600 mb-1" style={{ fontFamily: '"Caveat"', fontSize: '1rem' }}>
                                                {dayItems.length} item{dayItems.length === 1 ? '' : 's'}
                                            </div>
                                            <div className="mt-1 flex flex-wrap gap-1.5">
                                                {uniqueKinds.map((kind) => (
                                                    <span
                                                        key={`${day.key}-${kind}`}
                                                        className={`h-2.5 w-2.5 rounded-full border border-gray-800 ${KIND_DOT_STYLES[kind]}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-medium" style={{ fontFamily: '"Caveat"', fontSize: '1.25rem' }}>
                        <span>Click a date to filter the list below.</span>
                        {selectedDateKey && (
                            <button
                                onClick={() => setSelectedDateKey(null)}
                                className="bg-red-500 text-white px-3 py-1 font-bold border-2 border-gray-800 shadow-[2px_2px_0px_#333] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all ml-2"
                                style={{ transform: 'rotate(1deg)' }}
                            >
                                CLEAR FILTER X
                            </button>
                        )}
                    </div>
                </section>

                {
                    isLoading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-32 border-2 border-gray-800 bg-gray-200 animate-pulse" />
                            ))}
                        </div>
                    ) : dayFiltered.length === 0 ? (
                        <div
                            className="p-12 text-center"
                            style={{
                                ...(scrapbookTheme as any).paperCard,
                                transform: 'rotate(1deg)',
                                backgroundColor: '#fffdf0',
                            }}
                        >
                            <Sparkles className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                            <h2 className="text-2xl font-black" style={{ fontFamily: '"Permanent Marker"' }}>Looks pretty empty...</h2>
                            <p className="text-lg font-medium mt-2 text-gray-600" style={{ fontFamily: '"Caveat"', fontSize: '1.5rem' }}>
                                Go request some vendors or buy some tickets to fill up your calendar!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {dayFiltered.map((item, i) => (
                                <article
                                    key={item.id}
                                    className="p-5 transition-transform hover:-translate-y-1"
                                    style={{
                                        ...(scrapbookTheme as any).paperCard,
                                        backgroundColor: item.kind === 'saved' ? '#fee2e2' : '#fdfdfd',
                                        transform: `rotate(${i % 2 === 0 ? 0.5 : -0.5}deg)`,
                                    }}
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h2 className="text-2xl font-black line-clamp-1" style={{ fontFamily: '"Permanent Marker"' }}>{item.title}</h2>
                                                <span
                                                    className={`px-3 py-1 font-bold ${KIND_STYLES[item.kind]
                                                        }`}
                                                    style={{ transform: 'rotate(-2deg)' }}
                                                >
                                                    {item.tag}
                                                </span>
                                            </div>
                                            <p className="text-lg font-medium mt-2 text-gray-700" style={{ fontFamily: '"Caveat"', fontSize: '1.25rem' }}>{item.subtitle}</p>
                                            <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold border-t-2 border-dashed border-gray-400 pt-3" style={{ fontFamily: '"Space Mono", monospace' }}>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <CalendarClock className="h-4 w-4 text-blue-500" />
                                                    {new Date(item.eventTime).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Clock3 className="h-4 w-4 text-green-500" />
                                                    {formatRelative(item.eventTime)}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <MapPin className="h-4 w-4 text-red-500" />
                                                    {item.location}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {item.kind === 'vendor_request' ? (
                                                <Megaphone className="h-6 w-6 text-amber-500" />
                                            ) : item.kind === 'vendor_application' ? (
                                                <Briefcase className="h-6 w-6 text-purple-500" />
                                            ) : item.kind === 'saved' ? (
                                                <Sparkles className="h-6 w-6 text-red-500" />
                                            ) : (
                                                <CheckCircle2
                                                    className={`h-6 w-6 ${item.isPast ? 'text-gray-400' : 'text-emerald-500'}`}
                                                />
                                            )}
                                            <Link
                                                to={item.route}
                                                className="bg-yellow-300 text-black px-4 py-2 font-bold border-2 border-gray-800 shadow-[2px_2px_0px_#333] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center whitespace-nowrap"
                                                style={{ fontFamily: '"Permanent Marker"' }}
                                            >
                                                {item.cta}
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )
                }
            </div >
        </div >
    );
}
