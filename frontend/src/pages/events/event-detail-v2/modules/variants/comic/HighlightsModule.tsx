import { useState } from 'react';

import { MemoryBoxSection } from '@/pages/events/components/MemoryBoxSection';

interface ComicHighlightsModuleProps {
  event: any;
  highlights: any[];
  canUploadHighlights: boolean;
}

export function ComicHighlightsModule({
  event,
  highlights,
  canUploadHighlights,
}: ComicHighlightsModuleProps) {
  const [, setIsHighlightOpen] = useState(false);

  return (
    <MemoryBoxSection
      event={event}
      highlights={highlights}
      setIsHighlightOpen={setIsHighlightOpen}
      canUpload={canUploadHighlights}
    />
  );
}
