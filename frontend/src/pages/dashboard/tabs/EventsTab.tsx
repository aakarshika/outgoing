import { Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Media } from '@/components/ui/media';
import { EventNeedsSummary } from '@/components/events/EventNeedsSummary';
import { useMyEvents } from '@/features/events/hooks';

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
            <h3 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: '"Permanent Marker", cursive' }}>{title}</h3>
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

export function EventsTab() {
    const { data: eventsResponse, isLoading } = useMyEvents();
    const events = eventsResponse?.data || [];

    if (isLoading) return <LoadingSkeleton count={3} />;

    if (events.length === 0) {
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
            {events.map((event: any, idx: number) => {
                const badge = LIFECYCLE_BADGE_STYLES[event.lifecycle_state] || {
                    bg: '#f3f4f6',
                    text: '#6b7280',
                    border: '#d1d5db',
                };
                return (
                    <div
                        key={event.id}
                        className="flex items-center gap-4 border-2 border-gray-800 bg-white p-4 shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333]"
                        style={{ transform: `rotate(${idx % 2 === 0 ? -0.3 : 0.3}deg)` }}
                    >
                        <Link to={`/events/${event.id}`} className="flex-shrink-0 block">
                            {event.cover_image ? (
                                <div
                                    className="h-16 w-24 border-2 border-white shadow-md overflow-hidden"
                                    style={{ transform: 'rotate(-2deg)' }}
                                >
                                    <Media
                                        src={event.cover_image}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="h-16 w-24 border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-gray-300 relative group overflow-hidden">
                                    <Calendar className="h-6 w-6" />
                                </div>
                            )}
                        </Link>
                        <div className="flex-1 min-w-0">
                            <Link to={`/events/${event.id}`} className="hover:underline">
                                <h3
                                    className="font-bold text-gray-900 truncate"
                                    style={{
                                        fontFamily: '"Caveat", cursive',
                                        fontSize: '1.2rem',
                                    }}
                                >
                                    {event.title}
                                </h3>
                            </Link>
                            <p
                                className="text-gray-500 text-sm"
                                style={{ fontFamily: '"Caveat", cursive' }}
                            >
                                {new Date(event.start_time).toLocaleDateString()} ·{' '}
                                {event.location_name}
                            </p>
                            <EventNeedsSummary eventId={event.id} />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span
                                className="text-xs font-bold px-3 py-1 border-2 whitespace-nowrap"
                                style={{
                                    fontFamily: '"Permanent Marker", cursive',
                                    fontSize: '0.65rem',
                                    background: badge.bg,
                                    color: badge.text,
                                    borderColor: badge.border,
                                    transform: 'rotate(2deg)',
                                    boxShadow: '1px 1px 0px rgba(0,0,0,0.2)',
                                }}
                            >
                                {LIFECYCLE_LABELS[event.lifecycle_state] ||
                                    event.lifecycle_state}
                            </span>
                            <Link
                                to={`/events/${event.id}/manage`}
                                className="text-[0.65rem] font-bold px-3 py-1 border-2 border-gray-800 bg-yellow-300 text-gray-900 transition-colors hover:bg-yellow-400 whitespace-nowrap"
                                style={{
                                    fontFamily: '"Permanent Marker", cursive',
                                    transform: 'rotate(-1deg)',
                                    boxShadow: '1px 1px 0px rgba(0,0,0,0.8)',
                                }}
                            >
                                MANAGE EVENT
                            </Link>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
