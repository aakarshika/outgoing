import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  useMyEvents,
  useMyInterestedEvents,
  useMyTickets,
} from '@/features/events/hooks';
import { ScrapbookEventCardLandscape } from '@/features/events/ScrapbookEventCard';
import { scrapbookTheme } from '@/features/events/theme/scrapbookTheme';
import { useMyApplications, useMyNeedInvites } from '@/features/needs/hooks';
import type { EventDetail, EventListItem, TicketInfo } from '@/types/events';
import type { NeedApplication, NeedInvite } from '@/types/needs';

type CalendarFilter = 'all' | 'hosting' | 'attending' | 'saved' | 'vendor';

type CalendarKind =
  | 'hosting'
  | 'attending'
  | 'saved'
  | 'vendor_request'
  | 'vendor_application';

type CalendarEvent = EventListItem | EventDetail;

interface CalendarItem {
  id: string;
  event?: CalendarEvent;
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

// color lighteing funciton
function adjustColor(color: string, scale: number, opacity?: number): string {
  const match = color
    .replace(/\s+/g, '')
    .match(/^rgba?\((\d{1,3}),(\d{1,3}),(\d{1,3})(?:,([0-9]*\.?[0-9]+))?\)$/i);

  if (!match) {
    throw new Error(`Invalid color format: ${color}`);
  }

  let r = Number(match[1]);
  let g = Number(match[2]);
  let b = Number(match[3]);
  let a = match[4] !== undefined ? Number(match[4]) : 1;

  // Clamp base values
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));

  // Normalize scale to [-1, 1]
  const s = Math.max(-1, Math.min(1, scale));

  if (s !== 0) {
    if (s > 0) {
      // Darken: move toward 0
      r = Math.round(r * (1 - s));
      g = Math.round(g * (1 - s));
      b = Math.round(b * (1 - s));
    } else {
      // Lighten: move toward 255
      const t = -s;
      r = Math.round(r + (255 - r) * t);
      g = Math.round(g + (255 - g) * t);
      b = Math.round(b + (255 - b) * t);
    }
  }

  if (opacity !== undefined) {
    a = Math.max(0, Math.min(1, opacity));
  }

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
const ROLE_COLORS = {
  hosting: { key: 'hosting', label: 'Hosting', color: 'rgb(61, 71, 255)' },
  attending: { key: 'attending', label: 'Attending', color: 'rgb(255, 228, 25)' },
  vendor: { key: 'vendor', label: 'Servicing', color: 'rgb(0, 159, 132)' },
  vendor_request: {
    key: 'vendor_request',
    label: 'Servicing',
    color: 'rgb(92, 205, 186)',
  },
  saved: { key: 'saved', label: 'Saved', color: 'rgb(236, 80, 80)' },
};
const KIND_DOT_COLORS: Record<CalendarKind, string> = {
  hosting: ROLE_COLORS.hosting.color,
  attending: ROLE_COLORS.attending.color,
  saved: ROLE_COLORS.saved.color,
  vendor_request: ROLE_COLORS.vendor_request.color,
  vendor_application: ROLE_COLORS.vendor.color,
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function clipText(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;
  if (maxChars <= 1) return text.slice(0, maxChars);
  return `${text.slice(0, maxChars - 1)}…`;
}

function eventIdFromRoute(route: string) {
  const match = route.match(/^\/events\/(\d+)(?:\/|$)/);
  return match?.[1] ?? null;
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

  const isLoading =
    loadingEvents || loadingTickets || loadingSaved || loadingApps || loadingInvites;
  const now = Date.now();

  const savedEventIds = useMemo(
    () => new Set(mySaved.map((event) => String(event.id))),
    [mySaved],
  );

  const eventReasons = useMemo(() => {
    const map = new Map<
      string,
      {
        hosting?: boolean;
        attending?: boolean;
        saved?: boolean;
        vendor_application?: boolean;
        vendor_request?: boolean;
      }
    >();

    const ensure = (eventId: string) => {
      if (!map.has(eventId)) map.set(eventId, {});
      return map.get(eventId)!;
    };

    myEvents.forEach((e) => {
      ensure(String(e.id)).hosting = true;
    });
    myTickets.forEach((t) => {
      ensure(String(t.event_summary.id)).attending = true;
    });
    mySaved.forEach((e) => {
      ensure(String(e.id)).saved = true;
    });
    myApplications.forEach((app) => {
      if (app.event_id) ensure(String(app.event_id)).vendor_application = true;
    });
    myInvites.forEach((invite) => {
      if (invite.event_id) ensure(String(invite.event_id)).vendor_request = true;
    });

    return map;
  }, [myEvents, myTickets, mySaved, myApplications, myInvites]);

  const timeline = useMemo<CalendarItem[]>(() => {
    const hosted: CalendarItem[] = myEvents.map((event) => {
      const isPast = new Date(event.start_time).getTime() < now;
      return {
        id: `host-${event.id}`,
        event,
        kind: 'hosting',
        title: event.title,
        subtitle: isPast ? 'Hosted event' : 'Upcoming hosted event',
        location: event.location_name || 'Location TBD',
        eventTime: event.start_time,
        route: `/events/${event.id}`,
        cta: 'Go To Event',
        tag: isPast ? 'Hosted' : 'Hosting',
        isPast,
      };
    });

    const attending: CalendarItem[] = myTickets.map((ticket) => {
      const detail = ticket.event_summary;
      const isPast = new Date(detail.start_time).getTime() < now;
      return {
        id: `ticket-${ticket.id}`,
        event: detail,
        kind: 'attending',
        title: detail.title,
        subtitle: isPast ? 'Attended event' : 'Upcoming event',
        location: detail.location_name || 'Location TBD',
        eventTime: detail.start_time,
        route: `/events/${detail.id}`,
        cta: 'View Event',
        tag: isPast ? 'Attended' : 'Attending',
        isPast,
      };
    });

    const saved: CalendarItem[] = mySaved.map((event) => {
      const isPast = new Date(event.start_time).getTime() < now;
      return {
        id: `saved-${event.id}`,
        event,
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
          app.need_title === invite.need_title && app.event_id === invite.event_id,
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

    return [...hosted, ...attending, ...saved, ...vendorRequests, ...vendorApplications]
      .sort((a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime())
      .reduce<CalendarItem[]>((acc, item) => {
        // De-dupe the same underlying event across sources (hosting/attending/saved).
        // Example: an event can show up in both "my events" and "saved".
        if (
          item.kind !== 'hosting' &&
          item.kind !== 'attending' &&
          item.kind !== 'saved'
        ) {
          acc.push(item);
          return acc;
        }

        const eventId = eventIdFromRoute(item.route);
        if (!eventId) {
          acc.push(item);
          return acc;
        }

        const dayKey = toDateKey(new Date(item.eventTime));
        const dedupeKey = `${eventId}-${dayKey}`;

        const existingIndex = acc.findIndex((x) => {
          if (x.kind !== 'hosting' && x.kind !== 'attending' && x.kind !== 'saved')
            return false;
          const xEventId = eventIdFromRoute(x.route);
          if (!xEventId) return false;
          return `${xEventId}-${toDateKey(new Date(x.eventTime))}` === dedupeKey;
        });

        if (existingIndex === -1) {
          acc.push(item);
          return acc;
        }

        const priority: Record<CalendarKind, number> = {
          hosting: 3,
          attending: 2,
          saved: 1,
          vendor_request: 0,
          vendor_application: 0,
        };

        const existing = acc[existingIndex];
        if (priority[item.kind] > priority[existing.kind]) {
          acc[existingIndex] = item;
        }
        return acc;
      }, []);
  }, [myEvents, myTickets, mySaved, myInvites, myApplications, now]);

  const typeFiltered = timeline.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'hosting') return item.kind === 'hosting';
    if (filter === 'attending') return item.kind === 'attending';
    if (filter === 'saved') {
      const eventId = eventIdFromRoute(item.route);
      if (!eventId) return false;
      return savedEventIds.has(eventId);
    }
    return item.kind === 'vendor_request' || item.kind === 'vendor_application';
  });
  const dayFiltered = selectedDateKey
    ? typeFiltered.filter(
        (item) => toDateKey(new Date(item.eventTime)) === selectedDateKey,
      )
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
      <div className="mx-auto max-w-6xl px-4 mt-5 sm:px-6">
        <section className="mb-6 flex flex-wrap gap-3">
          {[
            { key: 'all', label: 'All', color: 'rgb(233, 133, 133)' },
            { key: 'hosting', label: 'Hosting', color: 'rgb(109, 174, 255)' },
            { key: 'attending', label: 'Attending', color: 'rgb(255, 228, 25)' },
            { key: 'vendor', label: 'Servicing', color: 'rgb(67, 237, 209)' },
            { key: 'saved', label: 'Saved', color: 'rgb(236, 80, 80)' },
          ].map((tab) => (
            <div>
              <span
                key={tab.key}
                onClick={() => setFilter(tab.key as CalendarFilter)}
                className="px-4 py-2 font-bold cursor-pointer inline-flex items-center gap-2"
                style={{
                  ...(scrapbookTheme as any).stickyNote,
                  backgroundColor: adjustColor(
                    tab.color,
                    filter === tab.key ? 0.05 : -0.6,
                  ),
                  // border: `2px solid ${tab.color}`,
                  color: filter !== tab.key ? '#000000' : '#ffffff',
                  transform: 'rotate(-2deg)',
                }}
              >
                {tab.key === 'hosting' && (
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-gray-800"
                    style={{ backgroundColor: KIND_DOT_COLORS.hosting }}
                  />
                )}
                {tab.key === 'attending' && (
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-gray-800"
                    style={{ backgroundColor: KIND_DOT_COLORS.attending }}
                  />
                )}
                {tab.key === 'saved' && (
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-gray-800"
                    style={{ backgroundColor: KIND_DOT_COLORS.saved }}
                  />
                )}
                {tab.key === 'vendor' && (
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-gray-800"
                      style={{ backgroundColor: KIND_DOT_COLORS.vendor_request }}
                    />
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-gray-800"
                      style={{ backgroundColor: KIND_DOT_COLORS.vendor_application }}
                    />
                  </span>
                )}
                {tab.label}
              </span>
            </div>
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
          <div className="mb-6 flex items-center justify-between pb-4">
            <h2
              className="text-3xl font-black"
              style={{ fontFamily: '"Permanent Marker"' }}
            >
              {monthLabel(visibleMonth)}
            </h2>
            <div className="flex items-center gap-2">
              <button
                className="p-2 border-2 border-gray-800 rounded bg-[#fdfdfd] shadow-[2px_2px_0px_#333] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                onClick={() =>
                  setVisibleMonth(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                  )
                }
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                className="p-2 border-2 border-gray-800 rounded bg-[#fdfdfd] shadow-[2px_2px_0px_#333] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                onClick={() =>
                  setVisibleMonth(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                  )
                }
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div
            className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-sm font-bold pb-2"
            style={{ fontFamily: '"Permanent Marker"' }}
          >
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7  pt-2">
            {monthDays.map((day) => {
              const dayItems = eventsByDay[day.key] || [];
              const isSelected = selectedDateKey === day.key;
              return (
                <button
                  key={day.key}
                  onClick={() =>
                    setSelectedDateKey((prev) => (prev === day.key ? null : day.key))
                  }
                  className={`relative min-h-[70px] border-2 text-left transition-all sm:min-h-[90px] sm:p-2 flex flex-col items-start justify-start p-1.5 ${
                    day.inMonth
                      ? 'bg-[#fdfdfd] border-gray-800 hover:-translate-y-1 hover:shadow-[2px_2px_0px_#333]'
                      : 'bg-gray-100 border-gray-400 text-gray-400'
                  } ${isSelected ? 'ring-4 ring-yellow-400 bg-yellow-50 shadow-[2px_2px_0px_#333]' : ''}`}
                >
                  <div
                    className={`absolute top-0 left-0 text-sm font-bold w-full z-10 ${
                      day.isToday
                        ? 'text-red-500 underline decoration-2 underline-offset-2'
                        : day.inMonth
                          ? 'text-gray-900'
                          : 'text-gray-400'
                    }`}
                    style={{
                      fontFamily: '"Permanent Marker"',
                      color: '#000000',
                      backgroundColor: isSelected ? '#fde68a' : '#fdfdfd',
                      // border: isSelected ? '2px solid #333' : '2px solid #888',
                      borderRadius: '50%',
                      padding: '5px',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {day.date.getDate()}
                  </div>
                  {dayItems.length > 0 && (
                    <div className="mt-2 w-full">
                      {/* <div
                        className="text-xs font-medium text-gray-600 mb-1"
                        style={{ fontFamily: '"Caveat"', fontSize: '1rem' }}
                      >
                        {dayItems.length} item{dayItems.length === 1 ? '' : 's'}
                      </div> */}
                      <div className="mt-1 flex flex-col gap-1.5">
                        {dayItems.slice(0, 4).map((item) => (
                          <div
                            key={`${day.key}-${item.id}`}
                            className="flex flex-row items-center gap-1.5"
                          >
                            <span
                              className="h-2.5 w-2.5 rounded-full border border-gray-800"
                              style={{ backgroundColor: KIND_DOT_COLORS[item.kind] }}
                            />

                            {/* Exactly one of these is visible at any breakpoint */}
                            <span className="block md:hidden text-[11px] leading-tight">
                              {clipText(item.title || 'Untitled event', 10)}
                            </span>
                            <span className="hidden md:block lg:hidden text-[11px] leading-tight">
                              {clipText(item.title || 'Untitled event', 18)}
                            </span>
                            <span className="hidden lg:block text-[11px] leading-tight">
                              {clipText(item.title || 'Untitled event', 30)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div
            className="mt-4 flex flex-wrap items-center gap-2 text-sm font-medium"
            style={{ fontFamily: '"Caveat"', fontSize: '1.25rem' }}
          >
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

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 border-2 border-gray-800 bg-gray-200 animate-pulse"
              />
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
            <h2
              className="text-2xl font-black"
              style={{ fontFamily: '"Permanent Marker"' }}
            >
              Looks pretty empty...
            </h2>
            <p
              className="text-lg font-medium mt-2 text-gray-600"
              style={{ fontFamily: '"Caveat"', fontSize: '1.5rem' }}
            >
              Go request some vendors or buy some tickets to fill up your calendar!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {dayFiltered.map((item) => (
              <article
                key={item.id}
                className="transition-transform hover:-translate-y-1"
              >
                <div className="flex flex-row items-center justify-center gap-4">
                  {item.event && (
                    <ScrapbookEventCardLandscape event={item.event} isFocused={false} />
                  )}
                  <div className="min-w-[240px] max-w-[320px] flex flex-col gap-2">
                    <div
                      className="border-2 border-gray-800 bg-white px-3 py-2 shadow-[2px_2px_0px_#333]"
                      style={{
                        fontFamily: '"Permanent Marker"',
                        transform: 'rotate(-1deg)',
                      }}
                    >
                      Why it’s here
                    </div>
                    <div
                      className="border-2 border-gray-800 bg-[#fffdf0] px-3 py-2 shadow-[2px_2px_0px_#333] flex flex-col gap-2"
                      style={{ fontFamily: '"Caveat"', fontSize: '1.25rem' }}
                    >
                      {(() => {
                        const eventId = eventIdFromRoute(item.route);
                        const reasons = eventId ? eventReasons.get(eventId) : undefined;
                        const chips: Array<{ key: string; label: string }> = [];
                        if (reasons?.hosting)
                          chips.push({ key: 'hosting', label: 'You’re hosting' });
                        if (reasons?.attending)
                          chips.push({ key: 'attending', label: 'You have tickets' });
                        if (reasons?.saved)
                          chips.push({ key: 'saved', label: 'You liked/saved it' });
                        if (reasons?.vendor_request)
                          chips.push({
                            key: 'vendor_request',
                            label: 'A service was requested',
                          });
                        if (reasons?.vendor_application)
                          console.log(item, "reasons?.vendor_application", reasons?.vendor_application);
                          chips.push({
                            key: 'vendor_application',
                            label: 'You applied to service it',
                          });
                        if (chips.length === 0)
                          chips.push({
                            key: item.kind,
                            label: item.subtitle || 'On your calendar',
                          });

                        return (
                          <>
                            <div className="flex flex-wrap gap-2">
                              {chips.map((c) => (
                                <span
                                  key={c.key}
                                  className="px-2 py-0.5 border border-gray-800 bg-white font-bold"
                                >
                                  {c.label}
                                </span>
                              ))}
                            </div>
                            <div className="flex flex-col gap-2 pt-1">
                              {eventId && reasons?.hosting && (
                                <Link
                                  to={`/events/${eventId}/host-event-management/overview`}
                                  className="bg-blue-200 text-black px-3 py-1 font-bold border-2 border-gray-800 shadow-[2px_2px_0px_#333] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-center"
                                  style={{ fontFamily: '"Permanent Marker"' }}
                                >
                                  Manage as Host
                                </Link>
                              )}
                              {eventId &&
                                (reasons?.vendor_application ||
                                  reasons?.vendor_request) && (
                                  <Link
                                    to={`/events/${eventId}/service-event-management/overview`}
                                    className="bg-emerald-200 text-black px-3 py-1 font-bold border-2 border-gray-800 shadow-[2px_2px_0px_#333] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-center"
                                    style={{ fontFamily: '"Permanent Marker"' }}
                                  >
                                    Manage as Vendor
                                  </Link>
                                )}
                              <Link
                                to={item.route}
                                className="bg-yellow-200 text-black px-3 py-1 font-bold border-2 border-gray-800 shadow-[2px_2px_0px_#333] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-center"
                                style={{ fontFamily: '"Permanent Marker"' }}
                              >
                                {item.cta}
                              </Link>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <Link
                    to={item.route}
                    className="bg-yellow-300 text-black px-4 py-2 font-bold border-2 border-gray-800 shadow-[2px_2px_0px_#333] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center whitespace-nowrap"
                    style={{ fontFamily: '"Permanent Marker"' }}
                  >
                    {item.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
