/** Hero section — featured event spotlight for the home page. */

import { ArrowRight, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import type { EventListItem } from '@/types/events';
import { useFeaturedEvent } from './hooks';

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

export function HeroSection() {
    const { data: response, isLoading } = useFeaturedEvent();
    const event: EventListItem | null = response?.data || null;

    if (isLoading) {
        return (
            <div className="relative h-[50vh] min-h-[400px] animate-pulse bg-muted rounded-2xl" />
        );
    }

    // Fallback hero if no featured event
    if (!event) {
        return (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/70 p-8 md:p-12 lg:p-16">
                <div className="relative z-10 max-w-2xl space-y-4">
                    <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight">
                        Discover Outgoing Events
                    </h1>
                    <p className="text-lg text-white/80 max-w-lg">
                        Find events, connect with vendors, and create unforgettable experiences in your city.
                    </p>
                    <Button asChild size="lg" variant="secondary" className="mt-4">
                        <Link to="/events">
                            Browse Events <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
                {/* Decorative gradient circles */}
                <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
            </div>
        );
    }

    return (
        <Link to={`/events/${event.id}`} className="group block">
            <div className="relative overflow-hidden rounded-2xl h-[50vh] min-h-[400px]">
                {/* Background */}
                {event.cover_image ? (
                    <img
                        src={event.cover_image}
                        alt={event.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-primary/70" />
                )}
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Content */}
                <div className="relative z-10 flex h-full flex-col justify-end p-6 md:p-8 lg:p-12">
                    <div className="max-w-2xl space-y-3">
                        {event.category && (
                            <span className="inline-block rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
                                {event.category.name}
                            </span>
                        )}
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                            {event.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                {formatDate(event.start_time)}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                {event.location_name}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <Button size="lg" className="group-hover:bg-primary/90">
                                Get Tickets <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <span className="text-sm text-white/60">
                                {event.interest_count} interested
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
