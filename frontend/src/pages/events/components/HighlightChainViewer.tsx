import React, { useMemo } from 'react';

import { useEventHighlights, useTrendingHighlights } from '@/features/events/hooks';

import { HighlightFeedViewer } from './HighlightFeedViewer';

interface HighlightChainViewerProps {
  initialHighlightId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const HighlightChainViewer: React.FC<HighlightChainViewerProps> = ({
  initialHighlightId,
  isOpen,
  onClose,
}) => {
  const { data: trendingResponse } = useTrendingHighlights(32);
  const trendingHighlights = (trendingResponse?.data || []) as any[];

  const seedHighlight = trendingHighlights.find(
    (h: any) => h.id === initialHighlightId,
  );

  const eventId = seedHighlight?.event_id as number | undefined;

  const { data: eventHighlightsResponse } = useEventHighlights(eventId || 0);
  const eventHighlights = (eventHighlightsResponse?.data || []) as any[];

  const combinedHighlights = useMemo(() => {
    if (!seedHighlight && !eventHighlights.length && !trendingHighlights.length)
      return [];

    const seen = new Set<number>();

    const result: any[] = [];

    const pushUnique = (h: any) => {
      if (h && typeof h.id === 'number' && !seen.has(h.id)) {
        seen.add(h.id);
        result.push(h);
      }
    };

    // 1) Start with the initial highlight (if found in trending)
    if (seedHighlight) {
      pushUnique(seedHighlight);
    }

    // 2) Then all other highlights from the same event
    eventHighlights.forEach(pushUnique);

    // 3) When those are exhausted, continue with trending highlights
    trendingHighlights.forEach(pushUnique);

    return result;
  }, [seedHighlight, eventHighlights, trendingHighlights]);

  return (
    <HighlightFeedViewer
      highlights={combinedHighlights}
      isOpen={isOpen}
      onClose={onClose}
      initialHighlightId={initialHighlightId}
    />
  );
};
