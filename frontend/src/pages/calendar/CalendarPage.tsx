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

import { Button } from '@/components/ui/button';
import { useMyEvents, useMyTickets } from '@/features/events/hooks';
import { useMyApplications, useMyNeedInvites } from '@/features/needs/hooks';
import type { TicketInfo } from '@/types/events';
import type { NeedApplication, NeedInvite } from '@/types/needs';

type CalendarFilter = 'all' | 'hosting' | 'attending' | 'vendor';
type CalendarKind = 'hosting' | 'attending' | 'vendor_request' | 'vendor_application';

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
    hosting: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    attending: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    vendor_request: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    vendor_application: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

const KIND_DOT_STYLES: Record<CalendarKind, string> = {
    hosting: 'bg-blue-500',
    attending: 'bg-emerald-500',
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
    const { data: appsResponse, isLoading: loadingApps } = useMyApplications();
    const { data: invitesResponse, isLoading: loadingInvites } = useMyNeedInvites();

    const myEvents = (eventsResponse?.data || []) as any[];
    const myTickets = (ticketsResponse?.data || []) as TicketInfo[];
    const myApplications = (appsResponse?.data || []) as NeedApplication[];
    const myInvites = (invitesResponse?.data || []) as NeedInvite[];

    const isLoading = loadingEvents || loadingTickets || loadingApps || loadingInvites;
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

        return [...hosted, ...attending, ...vendorRequests, ...vendorApplications].sort(
            (a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime()
        );
    }, [myEvents, myTickets, myInvites, myApplications, now]);

    const typeFiltered = timeline.filter((item) => {
        if (filter === 'all') return true;
        if (filter === 'hosting') return item.kind === 'hosting';
        if (filter === 'attending') return item.kind === 'attending';
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
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
            <section className="mb-6 rounded-2xl border bg-gradient-to-r from-primary/10 via-background to-sky-100/40 dark:to-sky-900/10 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                            Unified Timeline
                        </p>
                        <h1 className="text-2xl font-bold sm:text-3xl">My Calendar</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Hosting, attending, and vendor request milestones in one place.
                        </p>
                    </div>
                    <div className="flex gap-2 text-xs">
                        <span className="rounded-full border bg-background/80 px-3 py-1">
                            {myEvents.length} hosted
                        </span>
                        <span className="rounded-full border bg-background/80 px-3 py-1">
                            {myTickets.length} tickets
                        </span>
                        <span className="rounded-full border bg-background/80 px-3 py-1">
                            {myInvites.filter((invite) => invite.status === 'pending').length} requests
                        </span>
                    </div>
                </div>
            </section>

            <section className="mb-5 flex flex-wrap gap-2">
                {[
                    { key: 'all', label: 'All' },
                    { key: 'hosting', label: 'Hosting' },
                    { key: 'attending', label: 'Attending' },
                    { key: 'vendor', label: 'Vendor' },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key as CalendarFilter)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            filter === tab.key
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </section>
            <section className="mb-6 rounded-xl border bg-card p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{monthLabel(visibleMonth)}</h2>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                                setVisibleMonth(
                                    (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                                )
                            }
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                                setVisibleMonth(
                                    (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                                )
                            }
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
                    {WEEKDAYS.map((day) => (
                        <div key={day} className="py-1 font-medium">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {monthDays.map((day) => {
                        const dayItems = eventsByDay[day.key] || [];
                        const uniqueKinds = Array.from(new Set(dayItems.map((item) => item.kind))).slice(0, 3);
                        const isSelected = selectedDateKey === day.key;
                        return (
                            <button
                                key={day.key}
                                onClick={() =>
                                    setSelectedDateKey((prev) => (prev === day.key ? null : day.key))
                                }
                                className={`min-h-[68px] rounded-md border p-1.5 text-left transition-colors sm:min-h-[86px] sm:p-2 ${
                                    day.inMonth ? 'bg-background hover:bg-muted/40' : 'bg-muted/30 text-muted-foreground'
                                } ${isSelected ? 'ring-2 ring-primary/40 border-primary/40' : ''}`}
                            >
                                <div
                                    className={`text-xs font-medium ${
                                        day.isToday ? 'text-primary' : day.inMonth ? 'text-foreground' : 'text-muted-foreground'
                                    }`}
                                >
                                    {day.date.getDate()}
                                </div>
                                {dayItems.length > 0 && (
                                    <div className="mt-1.5">
                                        <div className="text-[10px] text-muted-foreground">
                                            {dayItems.length} item{dayItems.length === 1 ? '' : 's'}
                                        </div>
                                        <div className="mt-1 flex gap-1">
                                            {uniqueKinds.map((kind) => (
                                                <span
                                                    key={`${day.key}-${kind}`}
                                                    className={`h-1.5 w-1.5 rounded-full ${KIND_DOT_STYLES[kind]}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Click a date to filter the list.</span>
                    {selectedDateKey && (
                        <button
                            onClick={() => setSelectedDateKey(null)}
                            className="rounded-md border px-2 py-1 hover:bg-muted"
                        >
                            Clear day filter
                        </button>
                    )}
                </div>
            </section>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-xl border bg-card animate-pulse" />
                    ))}
                </div>
            ) : dayFiltered.length === 0 ? (
                <div className="rounded-xl border bg-card p-10 text-center">
                    <Sparkles className="h-10 w-10 mx-auto text-primary/60 mb-3" />
                    <h2 className="text-lg font-semibold">Nothing on your calendar yet</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Events and service requests will appear here automatically.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {dayFiltered.map((item) => (
                        <article
                            key={item.id}
                            className="rounded-xl border bg-card p-4 transition-all hover:shadow-sm"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="font-semibold line-clamp-1">{item.title}</h2>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                KIND_STYLES[item.kind]
                                            }`}
                                        >
                                            {item.tag}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{item.subtitle}</p>
                                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1">
                                            <CalendarClock className="h-3.5 w-3.5" />
                                            {new Date(item.eventTime).toLocaleString()}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Clock3 className="h-3.5 w-3.5" />
                                            {formatRelative(item.eventTime)}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {item.location}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {item.kind === 'vendor_request' ? (
                                        <Megaphone className="h-4 w-4 text-amber-500" />
                                    ) : item.kind === 'vendor_application' ? (
                                        <Briefcase className="h-4 w-4 text-purple-500" />
                                    ) : (
                                        <CheckCircle2
                                            className={`h-4 w-4 ${item.isPast ? 'text-muted-foreground' : 'text-emerald-500'}`}
                                        />
                                    )}
                                    <Button asChild size="sm" variant="outline">
                                        <Link to={item.route}>{item.cta}</Link>
                                    </Button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
