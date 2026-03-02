import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface CarouselMedia {
    id: string | number;
    url: string;
    type: 'image' | 'video';
    alt?: string;
}

interface EventCarouselProps {
    items: CarouselMedia[];
    autoPlayInterval?: number;
}

export function EventCarousel({ items, autoPlayInterval = 5000 }: EventCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (items.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, autoPlayInterval);

        return () => clearInterval(timer);
    }, [items.length, autoPlayInterval]);

    const goNext = () => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
    };

    const goPrev = () => {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    };

    if (!items || items.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-2xl aspect-[2/1] bg-muted mb-8 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <ImageIcon className="h-16 w-16 text-primary/30" />
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl aspect-[2/1] bg-muted mb-8 group">
            <div
                className="flex h-full transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {items.map((item) => (
                    <div key={item.id} className="min-w-full h-full relative">
                        {item.type === 'video' ? (
                            <video
                                src={item.url}
                                className="w-full h-full object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                        ) : (
                            <img
                                src={item.url}
                                alt={item.alt || 'Event media'}
                                className="h-full w-full object-cover"
                            />
                        )}
                    </div>
                ))}
            </div>

            {items.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.preventDefault(); goPrev(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); goNext(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {items.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => { e.preventDefault(); setCurrentIndex(idx); }}
                                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
