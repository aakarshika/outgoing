/** Hero section — event carousel for the home page. */

import { ArrowRight, Calendar, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Media } from '@/components/ui/media';
import type { EventListItem } from '@/types/events';

import { useCarouselEvents } from './hooks';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getEventMediaUrl(event: EventListItem): {
  url: string;
  type: 'image' | 'video';
} {
  if (event.media && event.media.length > 0) {
    const firstMedia = event.media[0];
    return {
      url: firstMedia.file,
      type: firstMedia.media_type,
    };
  }
  return {
    url: event.cover_image || '',
    type: 'image',
  };
}

export function HeroSection() {
  const { data: response, isLoading } = useCarouselEvents();
  const events: EventListItem[] = response?.data || [];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (events.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 5000); // 5 seconds autoplay

    return () => clearInterval(timer);
  }, [events.length]);

  if (isLoading) {
    return (
      <div className="relative h-[50vh] min-h-[400px] animate-pulse bg-muted rounded-2xl" />
    );
  }

  if (events.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/70 p-8 md:p-12 lg:p-16">
        <div className="relative z-10 max-w-2xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight">
            Discover Outgoing Events
          </h1>
          <p className="text-lg text-white/80 max-w-lg">
            Find events, connect with vendors, and create unforgettable experiences in
            your city.
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

  const currentEvent = events[currentIndex];

  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % events.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl h-[50vh] min-h-[400px] group">
      {/* Background Slides */}
      {events.map((event, index) => {
        const eventMedia = getEventMediaUrl(event);
        const isActive = index === currentIndex;

        return (
          <div
            key={event.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10'}`}
          >
            {eventMedia.type === 'video' ? (
              <Media
                type="video"
                src={eventMedia.url}
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : eventMedia.url ? (
              <Media
                src={eventMedia.url}
                alt={event.title}
                className={`absolute inset-0 h-full w-full object-cover transition-transform duration-&lsqb;5000ms&rsqb; ${isActive ? 'scale-105' : 'scale-100'}`}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-primary/70" />
            )}
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          </div>
        );
      })}

      {/* Arrows */}
      {events.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Indicators */}
      {events.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {events.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault();
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'}`}
            />
          ))}
        </div>
      )}

      {/* Content (Changes with slide) */}
      <div className="relative z-10 flex h-full flex-col justify-end p-6 md:p-8 lg:p-12 pointer-events-none">
        <div className="max-w-2xl space-y-3 pointer-events-auto">
          {currentEvent.lifecycle_state === 'completed' && (
            <span className="inline-block rounded-full bg-primary/80 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-primary-foreground mb-1 uppercase tracking-wider">
              Event Highlight
            </span>
          )}
          {currentEvent.category && currentEvent.lifecycle_state !== 'completed' && (
            <span className="inline-block rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white mb-1">
              {currentEvent.category.name}
            </span>
          )}

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight drop-shadow-md">
            <Link to={`/events-new/${currentEvent.id}`} className="hover:underline">
              {currentEvent.title}
            </Link>
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-white/90 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(currentEvent.start_time)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {currentEvent.location_name}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              <Link to={`/events/${currentEvent.id}`}>
                {currentEvent.lifecycle_state === 'completed'
                  ? 'View Gallery'
                  : 'Get Tickets'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {currentEvent.interest_count > 0 && (
              <span className="text-sm font-medium text-white/80 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                🔥 {currentEvent.interest_count} interested
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
