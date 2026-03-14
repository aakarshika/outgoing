import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import client from '@/api/client';
import { useAuth } from '@/features/auth/hooks';
import { useMyInterestedEvents } from '@/features/events/hooks';
import { ScrapbookEventCardLandscape } from '@/features/events/ScrapbookEventCardLandscape';
import { getEventStep, type EventOverviewRow } from '@/pages/alerts/utils';
import type { ApiResponse, EventDetail, EventListItem } from '@/types/events';

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

function buildTrackTemplate(length: number, expandedIndex: number | null) {
  if (expandedIndex === null) {
    return `repeat(${length}, minmax(0, 1fr))`;
  }

  return Array.from({ length }).map((_, index) =>
    index === expandedIndex ? 'minmax(0, 1.9fr)' : 'minmax(0, 0.85fr)',
  ).join(' ');
}

function StepTabsFlowchart({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center w-full px-2 py-2">
      {steps.map((step, idx) => {
        const isActive = step === currentStep;
        const isPast = step < currentStep;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-initial">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${
                isActive
                  ? 'bg-yellow-200 text-gray-900 border-gray-800'
                  : isPast
                    ? 'bg-gray-200 text-gray-700 border-gray-500'
                    : 'bg-white text-gray-400 border-gray-300'
              }`}
            >
              {isPast ? '✓' : step}
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 ${
                  isPast ? 'bg-gray-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

async function fetchEventOverview() {
  return client.get<ApiResponse<EventOverviewRow[]>>('/alerts/event-overview/');
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<CalendarFilter>('all');
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const current = new Date();
    return new Date(current.getFullYear(), current.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const { data: overviewResponse, isLoading: loadingOverview } = useQuery({
    queryKey: ['eventOverview'],
    queryFn: fetchEventOverview,
  });
  const { data: savedResponse, isLoading: loadingSaved } = useMyInterestedEvents();

  const overviewRows = (overviewResponse?.data?.data || []) as EventOverviewRow[];
  const mySaved = (savedResponse?.data || []) as EventListItem[];

  const isLoading = loadingOverview || loadingSaved;
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

    overviewRows.forEach((row) => {
      const eventId = String(row.event_id);
      const reasons = ensure(eventId);
      if (user?.id && row.host_user_id === user.id) reasons.hosting = true;
      if (user?.id && row.attendee_user_id === user.id && row.ticket_status !== 'cancelled') {
        reasons.attending = true;
      }
      if (user?.id && row.need_application_requested_by_host_vendor_user_id === user.id) {
        reasons.vendor_request = true;
      }
      if (
        user?.id &&
        (row.need_applied_to_user_id === user.id || row.need_assigned_user_id === user.id)
      ) {
        reasons.vendor_application = true;
      }
    });
    mySaved.forEach((e) => {
      ensure(String(e.id)).saved = true;
    });

    return map;
  }, [overviewRows, mySaved, user?.id]);

  const timeline = useMemo<CalendarItem[]>(() => {
    const detailByEventId = new Map<string, EventDetail>();
    overviewRows.forEach((row) => {
      if (row.event_details) {
        detailByEventId.set(String(row.event_id), row.event_details);
      }
    });

    const overviewTimeline: CalendarItem[] = Array.from(detailByEventId.entries()).flatMap(
      ([eventId, detail]) => {
        const reasons = eventReasons.get(eventId);
        if (!reasons) return [];

        const kind: CalendarKind = reasons.hosting
          ? 'hosting'
          : reasons.attending
            ? 'attending'
            : reasons.vendor_application
              ? 'vendor_application'
              : reasons.vendor_request
                ? 'vendor_request'
                : 'saved';

        const isPast = new Date(detail.start_time).getTime() < now;
        const subtitleByKind: Record<CalendarKind, string> = {
          hosting: isPast ? 'Hosted event' : 'Upcoming hosted event',
          attending: isPast ? 'Attended event' : 'Upcoming event',
          saved: isPast ? 'Saved event (past)' : 'Saved event',
          vendor_request: 'Service request for this event',
          vendor_application: 'You applied to service this event',
        };

        return [{
          id: `${kind}-${eventId}`,
          event: detail,
          kind,
          title: detail.title,
          subtitle: subtitleByKind[kind],
          location: detail.location_name || 'Location TBD',
          eventTime: detail.start_time,
          route: `/events/${eventId}`,
          cta: 'View Event',
          tag: kind.replace('_', ' '),
          isPast,
        }];
      },
    );

    const savedOnlyTimeline: CalendarItem[] = mySaved
      .filter((event) => !detailByEventId.has(String(event.id)))
      .map((event) => {
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

    return [...overviewTimeline, ...savedOnlyTimeline]
      .sort((a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime())
      .reduce<CalendarItem[]>((acc, item) => {
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
  }, [eventReasons, mySaved, now, overviewRows]);

  const overviewRowsByEventId = useMemo(() => {
    const map = new Map<string, EventOverviewRow[]>();
    overviewRows.forEach((row) => {
      const key = String(row.event_id);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    });
    return map;
  }, [overviewRows]);

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
  const selectedDayIndex = useMemo(
    () => monthDays.findIndex((day) => day.key === selectedDateKey),
    [monthDays, selectedDateKey],
  );
  const selectedColumnIndex = selectedDayIndex >= 0 ? selectedDayIndex % 7 : null;
  const selectedRowIndex = selectedDayIndex >= 0 ? Math.floor(selectedDayIndex / 7) : null;
  const dayGridStyle = useMemo(
    () => ({
      gridTemplateColumns: buildTrackTemplate(7, selectedColumnIndex),
      gridTemplateRows: buildTrackTemplate(6, selectedRowIndex),
    }),
    [selectedColumnIndex, selectedRowIndex],
  );
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
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 mt-5 sm:px-6">
        <section className="mb-6 flex flex-wrap gap-3">
          {[
            { key: 'all', label: 'All', color: 'rgb(233, 133, 133)' },
            { key: 'hosting', label: 'Hosting', color: 'rgb(109, 174, 255)' },
            { key: 'attending', label: 'Attending', color: 'rgb(255, 228, 25)' },
            { key: 'vendor', label: 'Servicing', color: 'rgb(67, 237, 209)' },
            { key: 'saved', label: 'Saved', color: 'rgb(236, 80, 80)' },
          ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as CalendarFilter)}
                className={`px-4 py-2 rounded-md border text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
                  filter === tab.key
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
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
              </button>
          ))}
        </section>
        <section className="mb-8 p-4 sm:p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="mb-6 flex items-center justify-between pb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{monthLabel(visibleMonth)}</h2>
            <div className="flex items-center gap-2">
              <button
                className="p-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() =>
                  setVisibleMonth(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                  )
                }
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                className="p-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-100 transition-colors"
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
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-sm font-semibold text-gray-600 pb-2">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>
          <div
            className="grid pt-2 transition-[grid-template-columns,grid-template-rows] duration-300 ease-out"
            style={dayGridStyle}
          >
            {monthDays.map((day) => {
              const dayItems = eventsByDay[day.key] || [];
              const isSelected = selectedDateKey === day.key;
              return (
                <button
                  key={day.key}
                  onClick={() =>
                    setSelectedDateKey((prev) => (prev === day.key ? null : day.key))
                  }
                  className={`relative min-h-[70px] h-full border rounded-md text-left transition-[background-color,box-shadow,transform] duration-300 sm:min-h-[90px] sm:p-2 flex flex-col items-start justify-start p-1.5 ${day.inMonth
                      ? 'bg-white border-gray-200 hover:bg-gray-50'
                      : 'bg-gray-100 border-gray-400 text-gray-400'
                    } ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                >
                  <div
                    className={`absolute top-0 left-0 text-sm font-bold w-full z-10 ${day.isToday
                        ? 'text-red-500 underline decoration-2 underline-offset-2'
                        : day.inMonth
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    style={{ color: '#000000' }}
                  >
                    {day.date.getDate()}
                  </div>
                  {dayItems.length > 0 && (
                    <div className="mt-2 w-full">
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
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span>Click a date to filter the list below.</span>
            {selectedDateKey && (
              <button
                onClick={() => setSelectedDateKey(null)}
                className="ml-2 px-3 py-1 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Clear filter
              </button>
            )}
          </div>
        </section>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 border border-gray-200 rounded-md bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : dayFiltered.length === 0 ? (
          <div className="p-12 text-center bg-white border border-gray-200 rounded-xl shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">No events yet</h2>
            <p className="text-base mt-2 text-gray-600">
              Go request some vendors or buy some tickets to fill up your calendar!
            </p>
          </div>
        ) : (
          <div className="">
            {dayFiltered.map((item) => (
              <article
                key={item.id}
                className="transition-transform hover:-translate-y-1"
              >
                <div className="flex flex-row items-center justify-center">
                  {item.event && (
                    <ScrapbookEventCardLandscape event={item.event} isFocused={false} />
                  )}
                  <div className="min-w-[240px] max-w-[320px] flex flex-col">
                    {(() => {
                      const eventId = eventIdFromRoute(item.route);
                      if (!eventId || !user?.id) return null;

                      const reasons = eventReasons.get(eventId);
                      const rows = overviewRowsByEventId.get(eventId) || [];
                      if (!reasons || rows.length === 0) return null;

                      const role: 'host' | 'vendor' | 'attendee' = reasons.hosting
                        ? 'host'
                        : reasons.attending
                          ? 'attendee'
                          : 'vendor';

                      const overviewRow =
                        role === 'host'
                          ? rows.find((row) => row.host_user_id === user.id)
                          : role === 'attendee'
                            ? rows.find(
                                (row) =>
                                  row.attendee_user_id === user.id &&
                                  row.ticket_status !== 'cancelled',
                              )
                            : rows.find(
                                (row) =>
                                  row.need_applied_to_user_id === user.id ||
                                  row.need_application_requested_by_host_vendor_user_id ===
                                    user.id ||
                                  row.need_assigned_user_id === user.id,
                              );

                      if (!overviewRow) return null;

                      const { currentStep, totalSteps } = getEventStep(
                        role,
                        overviewRow,
                        user.id,
                      );

                      return (
                        <div className="">
                          <StepTabsFlowchart
                            currentStep={currentStep}
                            totalSteps={totalSteps}
                          />
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
