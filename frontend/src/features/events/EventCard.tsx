/** Event Card component — the primary UI element for event browsing. */

import { Calendar, Heart, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks';
import type { EventListItem } from '@/types/events';
import { useToggleInterest } from './hooks';

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatPrice(standard: string | null, flexible: string | null) {
    if (!standard && !flexible) return 'Free';
    const price = parseFloat(standard || '0');
    return price === 0 ? 'Free' : `$${price.toFixed(0)}`;
}

interface EventCardProps {
    event: EventListItem;
}

export function EventCard({ event }: EventCardProps) {
    const { isAuthenticated } = useAuth();
    const toggleInterest = useToggleInterest();

    const handleInterestClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) return;
        toggleInterest.mutate({
            eventId: event.id,
            isInterested: event.user_is_interested,
        });
    };

    return (
        <Link
            to={`/events/${event.id}`}
            className="group block rounded-xl border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
        >
            {/* Cover Image */}
            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                {event.cover_image ? (
                    <img
                        src={event.cover_image}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <Calendar className="h-12 w-12 text-primary/40" />
                    </div>
                )}
                {/* Category badge */}
                {event.category && (
                    <span className="absolute top-3 left-3 rounded-full bg-background/80 backdrop-blur-sm px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                        {event.category.name}
                    </span>
                )}
                {/* Interest heart */}
                <button
                    onClick={handleInterestClick}
                    className="absolute top-3 right-3 rounded-full bg-background/80 backdrop-blur-sm p-2 transition-all hover:bg-background hover:scale-110"
                    aria-label={event.user_is_interested ? 'Remove interest' : 'Mark interested'}
                >
                    <Heart
                        className={`h-4 w-4 transition-colors ${event.user_is_interested
                            ? 'fill-red-500 text-red-500'
                            : 'text-muted-foreground'
                            }`}
                    />
                </button>
                {/* Price tag */}
                <span className="absolute bottom-3 right-3 rounded-full bg-background/90 backdrop-blur-sm px-3 py-1 text-sm font-semibold text-foreground">
                    {formatPrice(event.ticket_price_standard, event.ticket_price_flexible)}
                </span>
            </div>

            {/* Info */}
            <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                        {formatDate(event.start_time)} · {formatTime(event.start_time)}
                    </span>
                </div>

                <h3 className="font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {event.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{event.location_name}</span>
                </div>

                {/* Footer: social proof */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-2">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" /> {event.interest_count}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {event.ticket_count}
                        </span>
                    </div>
                    {/* Host avatar */}
                    <div className="flex items-center gap-1.5">
                        {event.host.avatar ? (
                            <img
                                src={event.host.avatar}
                                alt={event.host.first_name}
                                className="h-5 w-5 rounded-full object-cover"
                            />
                        ) : (
                            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                {(event.host.first_name?.[0] || event.host.username[0]).toUpperCase()}
                            </div>
                        )}
                        <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                            {event.host.first_name || event.host.username}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
