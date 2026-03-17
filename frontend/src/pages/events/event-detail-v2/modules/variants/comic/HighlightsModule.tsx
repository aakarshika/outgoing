import { useState } from 'react';

import { MemoryBoxSection } from '@/pages/events/components/MemoryBoxSection';

interface ComicHighlightsModuleProps {
  event: any;
  highlights: any[];
  canAccessEventChat: boolean;
}

export function ComicHighlightsModule({
  event,
  highlights,
  canAccessEventChat,
}: ComicHighlightsModuleProps) {
  const [, setIsHighlightOpen] = useState(false);

  if (!canAccessEventChat) {
    return null;
  }

  return (
    <MemoryBoxSection
      event={event}
      highlights={highlights}
      setIsHighlightOpen={setIsHighlightOpen}
    />
  );
}
