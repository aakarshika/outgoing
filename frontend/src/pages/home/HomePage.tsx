/** Home Page — event-centric feed with Hero, Category Chips, and Event Cards. */

import { useState } from 'react';

import { CategoryChips } from '@/features/events/CategoryChips';
import { EventCard } from '@/features/events/EventCard';
import { HeroSection } from '@/features/events/HeroSection';
import { useFeed } from '@/features/events/hooks';

type SortOption = 'trending' | 'newest' | 'popular';

const SORT_TABS: { key: SortOption; label: string }[] = [
  { key: 'trending', label: '🔥 Trending' },
  { key: 'newest', label: '✨ New' },
  { key: 'popular', label: '❤️ Popular' },
];

export default function HomePage() {
  const [category, setCategory] = useState<string | undefined>();
  const [sort, setSort] = useState<SortOption>('trending');
  const [page] = useState(1);

  const { data: response, isLoading } = useFeed({ category, sort, page });
  const events = response?.data || [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
      {/* Hero Section */}
      <section className="pt-6 pb-4">
        <HeroSection />
      </section>

      {/* Category Chips */}
      <section className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <CategoryChips selected={category} onSelect={setCategory} />
      </section>

      {/* Sort Tabs */}
      <section className="flex gap-2 pt-4 pb-2">
        {SORT_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSort(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
              ${sort === tab.key
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {/* Events Feed */}
      <section className="pt-2">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden animate-pulse">
                <div className="aspect-[16/9] bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-5 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold text-foreground">No events yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {category
                ? 'No events in this category yet. Try another one!'
                : 'Be the first to create an event.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
