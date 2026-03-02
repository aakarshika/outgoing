import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

import { EventCard } from './EventCard';
import type { EventListItem } from '@/types/events';

interface HorizontalEventListProps {
    title: string;
    events: EventListItem[];
    isLoading?: boolean;
    emptyMessage?: string;
    onSeeAll?: () => void;
    cardWidth?: string; // e.g. "w-[280px] sm:w-[320px]"
}

export function HorizontalEventList({
    title,
    events,
    isLoading,
    emptyMessage = 'No events found.',
    onSeeAll,
    cardWidth = 'w-[280px] sm:w-[320px]',
}: HorizontalEventListProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftChevron, setShowLeftChevron] = useState(false);
    const [showRightChevron, setShowRightChevron] = useState(true);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftChevron(scrollLeft > 0);
        setShowRightChevron(scrollLeft < scrollWidth - clientWidth - 10);
    };

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const scrollAmount = direction === 'left' ? -400 : 400;
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    if (!isLoading && events.length === 0) {
        if (!emptyMessage) return null;
        return (
            <div className="py-8 px-4 sm:px-6 lg:px-8 text-center border rounded-xl border-dashed bg-muted/20">
                <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <section className="py-4 group">
            <div className="mb-3 flex items-center justify-between px-4 sm:px-6 lg:px-8">
                <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
                {onSeeAll && (
                    <button
                        onClick={onSeeAll}
                        className="text-sm font-medium text-primary hover:underline transition-all"
                    >
                        Explore all
                    </button>
                )}
            </div>

            <div className="relative">
                {/* Left Chevron */}
                <div
                    className={`absolute left-0 top-0 bottom-0 z-10 w-12 sm:w-16 bg-gradient-to-r from-background to-transparent transition-opacity duration-300 pointer-events-none ${showLeftChevron ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-md hover:bg-background hover:scale-110 transition-all pointer-events-auto"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                </div>

                {/* Scrollable Container */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 sm:px-6 lg:px-8 pb-4 pt-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {/* Webkit scrollbar hiding is done in index.css ideally, but just in case, inline hide */}
                    <style>{`
            .overflow-x-auto::-webkit-scrollbar {
              display: none;
            }
          `}</style>

                    {isLoading
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className={`${cardWidth} flex-none rounded-xl border bg-card overflow-hidden animate-pulse snap-start`}
                            >
                                <div className="aspect-[16/9] bg-muted" />
                                <div className="p-4 space-y-3">
                                    <div className="h-3 w-24 rounded bg-muted" />
                                    <div className="h-5 w-3/4 rounded bg-muted" />
                                    <div className="h-3 w-1/2 rounded bg-muted" />
                                </div>
                            </div>
                        ))
                        : events.map((event) => (
                            <div key={event.id} className={`${cardWidth} flex-none snap-start`}>
                                <EventCard event={event} />
                            </div>
                        ))}
                </div>

                {/* Right Chevron */}
                <div
                    className={`absolute right-0 top-0 bottom-0 z-10 w-12 sm:w-16 bg-gradient-to-l from-background to-transparent transition-opacity duration-300 pointer-events-none md:opacity-0 md:group-hover:opacity-100 ${showRightChevron ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-md hover:bg-background hover:scale-110 transition-all pointer-events-auto"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </div>
            </div>
        </section>
    );
}
