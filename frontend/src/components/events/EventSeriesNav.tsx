import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import type { EventListItem } from '@/types/events';

interface EventSeriesNavProps {
    occurrences: EventListItem[];
    currentEventId: number;
}

function formatDateShort(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function EventSeriesNav({ occurrences, currentEventId }: EventSeriesNavProps) {
    if (!occurrences || occurrences.length <= 1) return null;

    // Sort occurrences chronologically
    const sorted = [...occurrences].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Series Schedule</h2>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
                {sorted.map((occ) => {
                    const isCurrent = occ.id === currentEventId;
                    const isPast = new Date(occ.start_time) < new Date();

                    return (
                        <Link
                            key={occ.id}
                            to={`/events/${occ.id}`}
                            className={`
                                flex-shrink-0 w-64 p-4 rounded-xl border snap-start transition-colors
                                ${isCurrent
                                    ? 'bg-primary border-primary text-primary-foreground shadow-md'
                                    : 'bg-card hover:border-primary/50'
                                }
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isCurrent ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {occ.lifecycle_state.replace('_', ' ').toUpperCase()}
                                </span>
                                {isPast && !isCurrent && (
                                    <span className="text-xs text-muted-foreground">Past</span>
                                )}
                            </div>

                            <h3 className={`font-medium truncate mb-1 ${isCurrent ? 'text-primary-foreground' : ''}`}>
                                {occ.title}
                            </h3>

                            <p className={`text-sm ${isCurrent ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                {formatDateShort(occ.start_time)} • {formatTime(occ.start_time)}
                            </p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
