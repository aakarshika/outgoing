import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useTrendingHighlights } from '@/features/events/hooks';

import { HighlightFeedViewer } from '@/pages/events/components/HighlightFeedViewer';

export default function HighlightsReelsPage() {
  const navigate = useNavigate();
  const { highlightId } = useParams();
  const initialHighlightId = highlightId ? Number(highlightId) : undefined;

  const { data: trendingResponse, isLoading } = useTrendingHighlights(32);
  const trendingHighlights = (trendingResponse?.data || []) as any[];

  const [activeHighlightId, setActiveHighlightId] = useState<number | null>(
    initialHighlightId || null,
  );

  useEffect(() => {
    if (!isLoading && trendingHighlights.length > 0 && !activeHighlightId) {
      setActiveHighlightId(initialHighlightId || trendingHighlights[0].id);
    }
  }, [isLoading, trendingHighlights, activeHighlightId, initialHighlightId]);

  const handleClose = () => {
    navigate('/');
  };

  if (isLoading || trendingHighlights.length === 0) {
    return null;
  }

  return (
    <HighlightFeedViewer
      highlights={trendingHighlights}
      isOpen={true}
      onClose={handleClose}
      initialHighlightId={activeHighlightId || undefined}
      urlPattern="highlightsreels"
    />
  );
}
