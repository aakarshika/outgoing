/** Event Card component — the primary UI element for event browsing. */

import { Calendar, Heart, MapPin, Users, Play, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
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

    // Hover preview state for completed events
    const [isHovered, setIsHovered] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);
    const highlights = event.media?.filter(m => m.category === 'highlight') || [];

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isHovered && highlights.length > 0) {
            interval = setInterval(() => {
                setPreviewIndex((prev) => (prev + 1) % highlights.length);
            }, 2000);
        } else {
            setPreviewIndex(0);
        }
        return () => clearInterval(interval);
    }, [isHovered, highlights.length]);

    const handleInterestClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) return;
        toggleInterest.mutate({
            eventId: event.id,
            isInterested: event.user_is_interested,
        });
    };

    if (event.lifecycle_state === 'completed') {
        return (
            <Link
                to={`/events/${event.id}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group block rounded-2xl border bg-card overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:-translate-y-2 relative"
            >
                {/* Cover Image with Highlights Overlay */}
                <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    {/* Default Background */}
                    {event.cover_image && (
                        <img
                            src={event.cover_image}
                            alt={event.title}
                            className={`h-full w-full object-cover transition-all duration-700 ${isHovered && highlights.length > 0 ? 'opacity-50 scale-110' : 'opacity-100'}`}
                        />
                    )}

                    {/* Highlights Preview Layer */}
                    {highlights.length > 0 && highlights.map((media, idx) => (
                        <div
                            key={media.id}
                            className={`absolute inset-0 transition-opacity duration-1000 ${isHovered && idx === previewIndex ? 'opacity-100' : 'opacity-0'}`}
                        >
                            {media.media_type === 'video' ? (
                                <video
                                    src={media.file}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <img
                                    src={media.file}
                                    alt={`${event.title} highlight ${idx}`}
                                    className="h-full w-full object-cover"
                                />
                            )}
                        </div>
                    ))}

                    {!event.cover_image && highlights.length === 0 && (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                            <Calendar className="h-10 w-10 text-primary/30" />
                        </div>
                    )}

                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />

                    {/* Central Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transform transition-all duration-300 group-hover:scale-125 group-hover:bg-primary group-hover:border-primary group-hover:text-white text-white shadow-xl">
                            <Play className="h-5 w-5 fill-current" />
                        </div>
                    </div>

                    {/* Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                        <span className="bg-primary/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-white/20">
                            Rewind
                        </span>
                        {event.category && (
                            <span className="rounded-full bg-black/40 backdrop-blur-md px-3 py-1 text-[10px] font-medium text-white border border-white/10">
                                {event.category.name}
                            </span>
                        )}
                    </div>

                    {/* Review/Rating Overlay */}
                    <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 text-white/90">
                        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/10">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-bold">4.9</span>
                        </div>
                        <span className="text-[10px] font-medium opacity-80">(24 reviews)</span>
                    </div>
                </div>

                {/* Info Area - Clean and Premium */}
                <div className="p-5 space-y-3 bg-card border-t border-border/10">
                    <div>
                        <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors text-base">
                            {event.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{event.location_name}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-tight font-semibold">Attended</span>
                                <span className="text-sm font-bold text-foreground">{event.ticket_count || 120}+</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-tight font-semibold">Moments</span>
                                <span className="text-sm font-bold text-foreground">18 highlights</span>
                            </div>
                        </div>

                        <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            View Story →
                        </span>
                    </div>
                </div>
            </Link>
        );
    }

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
                <div className="absolute top-3 left-3 flex items-center gap-2">
                    {event.category && (
                        <span className="rounded-full bg-background/80 backdrop-blur-sm px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                            {event.category.name}
                        </span>
                    )}
                    {event.lifecycle_state === 'live' && (
                        <span className="flex items-center gap-1.5 rounded-full bg-red-500/90 text-white px-3 py-1 text-xs font-bold shadow-sm animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                            LIVE
                        </span>
                    )}
                </div>
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
