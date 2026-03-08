/** Browse Events page — grid of events with filters. */

import { Search } from 'lucide-react';
import { useState } from 'react';

import { CategoryChips } from '@/features/events/CategoryChips';
import { ScrapbookEventCard } from '@/features/events/ScrapbookEventCard';
import { useFeed } from '@/features/events/hooks';

export default function BrowseEventsPage() {
  const [category, setCategory] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [page] = useState(1);

  const { data: response, isLoading } = useFeed({
    category,
    sort: 'newest',
    page,
  });
  const events = response?.data || [];

  const filtered = search
    ? events.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
    : events;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Browse Events</h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>
      </div>

      <CategoryChips selected={category} onSelect={setCategory} />

      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border bg-card overflow-hidden animate-pulse"
              >
                <div className="aspect-[16/9] bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-5 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold">No events found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters or search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event) => (
              <ScrapbookEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
