import { Calendar } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { EventNeedsSummary } from '@/components/events/EventNeedsSummary';
import { Media } from '@/components/ui/media';
import { CategoricalBackground } from '@/features/events/CategoricalBackground';
import { useMyEvents } from '@/features/events/hooks';
import { ScrapbookEventCardLandscape } from '@/features/events/ScrapbookEventCardLandscape';
import type { EventListItem } from '@/types/events';

const LIFECYCLE_BADGE_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  draft: { bg: '#fef9c3', text: '#a16207', border: '#facc15' },
  published: { bg: '#dcfce7', text: '#166534', border: '#4ade80' },
  at_risk: { bg: '#fff7ed', text: '#9a3412', border: '#fb923c' },
  postponed: { bg: '#ffedd5', text: '#9a3412', border: '#f97316' },
  event_ready: { bg: '#d1fae5', text: '#065f46', border: '#34d399' },
  live: { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', border: '#f87171' },
  completed: { bg: '#f3e8ff', text: '#6b21a8', border: '#c084fc' },
};

const LIFECYCLE_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  at_risk: 'At Risk',
  postponed: 'Postponed',
  event_ready: 'Event Ready',
  live: 'Live',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

// Internal shared components from DashboardPage
function LoadingSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-20 border-2 border-dashed border-gray-300 bg-white/50 animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState({ icon, title, subtitle, actionLabel, actionTo }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-gray-300 bg-white/30 text-center">
      <div className="mb-4 opacity-50">{icon}</div>
      <h3
        className="text-xl font-bold text-gray-900 mb-1"
        style={{ fontFamily: '"Permanent Marker", cursive' }}
      >
        {title}
      </h3>
      <p className="text-gray-500 mb-6 font-serif italic">{subtitle}</p>
      {actionLabel && (
        <Link
          to={actionTo}
          className="px-6 py-2 bg-yellow-300 border-2 border-gray-800 text-gray-900 font-bold hover:bg-yellow-400 transition-colors shadow-[3px_3px_0px_#333]"
          style={{ fontFamily: '"Permanent Marker", cursive' }}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

type SeriesDisplayItem = {
  type: 'series';
  seriesId: number;
  seriesName: string;
  events: EventListItem[];
  startTime: string;
};

type SingleDisplayItem = {
  type: 'single';
  event: EventListItem;
  startTime: string;
};

type DisplayItem = SeriesDisplayItem | SingleDisplayItem;

function formatSeriesDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function EventCardRow({
  event,
  actionsEnabled = true,
}: {
  event: EventListItem;
  actionsEnabled?: boolean;
}) {
  const badge = LIFECYCLE_BADGE_STYLES[event.lifecycle_state] || {
    bg: '#f3f4f6',
    text: '#6b7280',
    border: '#d1d5db',
  };

  const OverlaySection = () => {
    return (
      <div className="flex flex-col items-start justify-start gap-2 flex-shrink-0">
        <span
          className="text-xs font-bold px-3 py-1 border-2 whitespace-nowrap"
          style={{
            fontFamily: '"Permanent Marker", cursive',
            fontSize: '1.2rem',
            background: badge.bg,
            color: badge.text,
            borderColor: badge.border,
            transform: 'rotate(2deg)',
            boxShadow: '1px 1px 0px rgba(0,0,0,0.2)',
          }}
        >
          {LIFECYCLE_LABELS[event.lifecycle_state] || event.lifecycle_state}
        </span>
        {actionsEnabled ? (
          <Link
            to={`/events/${event.id}/host-event-management`}
            className="text-[1rem] font-bold px-3 py-1 border-2 border-gray-800 bg-yellow-300 text-gray-900 transition-colors hover:bg-yellow-400 whitespace-nowrap"
            style={{
              fontFamily: '"Permanent Marker", cursive',
              transform: 'rotate(-1deg)',
              boxShadow: '1px 1px 0px rgba(0,0,0,0.8)',
            }}
          >
            MANAGE EVENT
          </Link>
        ) : (
          <span
            className="text-[1rem] font-bold px-3 py-1 border-2 border-gray-400 bg-gray-200 text-gray-500 whitespace-nowrap opacity-60"
            style={{
              fontFamily: '"Permanent Marker", cursive',
              transform: 'rotate(-1deg)',
              boxShadow: '1px 1px 0px rgba(0,0,0,0.3)',
            }}
          >
            MANAGE EVENT
          </span>
        )}
      </div>
    );
  };
  return (
    <div className="space-y-1">
      <div className="flex items-stretch gap-2">
        <div className="flex-1 relative">
          <ScrapbookEventCardLandscape event={event} isBasicEventCard={false} />
          <div className="absolute inset-0 z-10 flex items-end justify-end">
            <div className="p-3">
              <OverlaySection />
            </div>
          </div>
        </div>
      </div>
      <EventNeedsSummary eventId={event.id} />
    </div>
  );
}

function RecurringSeriesGroup({
  group,
  isExpanded,
  onToggle,
}: {
  group: SeriesDisplayItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const firstEvent = group.events[0];

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full text-left"
      >
        <CategoricalBackground
          category={firstEvent.category}
          showDecoration={false}
          sx={{
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            boxShadow: '0 6px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
            px: 12,
            py: 10,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="h-20 w-28 rounded-md bg-white/80 border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center flex-shrink-0">
              {firstEvent.cover_image ? (
                <Media
                  src={firstEvent.cover_image}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Calendar className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {firstEvent.category?.name && (
                <p className="text-[0.65rem] uppercase tracking-widest text-gray-600 mb-0.5">
                  {firstEvent.category.name}
                </p>
              )}
              <p className="text-[0.65rem] uppercase tracking-widest text-gray-500">
                Recurring series
              </p>
              <h3
                className="text-base sm:text-lg font-bold text-gray-900 truncate"
                style={{ fontFamily: '"Permanent Marker", cursive' }}
              >
                {group.seriesName}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                {group.events.length} {group.events.length === 1 ? 'date' : 'dates'} ·
                next {formatSeriesDate(group.startTime)}
              </p>
              <p className="text-xs sm:text-sm text-gray-700 truncate">
                {firstEvent.title} · {firstEvent.location_name}
              </p>
            </div>
            <div className="flex flex-col items-end justify-between gap-1 pl-1">
              <span className="flex items-center gap-1 text-[0.65rem] sm:text-xs font-semibold uppercase tracking-wide text-gray-700">
                {isExpanded ? 'Hide dates' : 'View dates'}{' '}
                <span>{isExpanded ? '▴' : '▾'}</span>
              </span>
              <span className="text-[0.6rem] sm:text-[0.65rem] text-gray-500">
                {group.events.length} event
                {group.events.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </CategoricalBackground>
      </button>
      {isExpanded && (
        <div className="space-y-3">
          {group.events.map((event) => (
            <EventCardRow key={event.id} event={event} actionsEnabled />
          ))}
        </div>
      )}
    </div>
  );
}

export function EventsTab() {
  const { data: eventsResponse, isLoading } = useMyEvents();
  const events: EventListItem[] = eventsResponse?.data || [];

  const [expandedSeries, setExpandedSeries] = useState<Set<number>>(() => new Set());

  const displayItems = useMemo<DisplayItem[]>(() => {
    const seriesMap = new Map<number, EventListItem[]>();
    const standaloneEvents: EventListItem[] = [];

    events.forEach((event) => {
      if (event.series?.id) {
        const bucket = seriesMap.get(event.series.id) ?? [];
        bucket.push(event);
        seriesMap.set(event.series.id, bucket);
      } else {
        standaloneEvents.push(event);
      }
    });

    const groups: DisplayItem[] = [];

    seriesMap.forEach((occurrences, seriesId) => {
      if (occurrences.length > 1) {
        const sorted = [...occurrences].sort(
          (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
        );
        groups.push({
          type: 'series',
          seriesId,
          seriesName: sorted[0].series?.name ?? 'Series',
          events: sorted,
          startTime: sorted[0].start_time,
        });
      } else if (occurrences.length === 1) {
        standaloneEvents.push(occurrences[0]);
      }
    });

    const singles: DisplayItem[] = standaloneEvents.map((event) => ({
      type: 'single',
      event,
      startTime: event.start_time,
    }));

    const all = [...groups, ...singles];

    const getCreatedTime = (item: DisplayItem) => {
      if (item.type === 'series') {
        // Series order is based on the *oldest* created date among its occurrences.
        // If created_at is missing, fall back to start_time for that occurrence.
        return Math.min(
          ...item.events.map((ev) =>
            new Date(ev.created_at || ev.start_time).getTime(),
          ),
        );
      }

      const ev = item.event;
      return new Date(ev.created_at || '1/1/9999').getTime();
    };

    // Newest created first
    return all.sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
  }, [events]);

  const toggleSeries = (seriesId: number) => {
    setExpandedSeries((prev) => {
      const next = new Set(prev);
      if (next.has(seriesId)) next.delete(seriesId);
      else next.add(seriesId);
      return next;
    });
  };

  if (isLoading) return <LoadingSkeleton count={3} />;

  if (displayItems.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-12 w-12 text-gray-400" />}
        title="No events yet"
        subtitle="Create your first event and start hosting!"
        actionLabel="Create Event"
        actionTo="/events/create"
      />
    );
  }

  return (
    <div className="space-y-3">
      {displayItems.map((item) => {
        if (item.type === 'series') {
          return (
            <RecurringSeriesGroup
              key={`series-${item.seriesId}`}
              group={item}
              isExpanded={expandedSeries.has(item.seriesId)}
              onToggle={() => toggleSeries(item.seriesId)}
            />
          );
        }

        return <EventCardRow key={item.event.id} event={item.event} actionsEnabled />;
      })}
    </div>
  );
}
