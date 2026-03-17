import { useState } from 'react';

import { ServicesSection } from '@/pages/events/components/ServicesSection';

interface ComicServicesModuleProps {
  event: any;
  displayNeeds: any[];
  myServicesResponse: any;
  isAuthenticated: boolean;
}

export function ComicServicesModule({
  event,
  displayNeeds,
  myServicesResponse,
  isAuthenticated,
}: ComicServicesModuleProps) {
  const [, setSelectedNeed] = useState<any>(null);
  const [, setIsApplyModalOpen] = useState(false);

  return (
    <ServicesSection
      event={event}
      displayNeeds={displayNeeds}
      myServicesResponse={myServicesResponse}
      isAuthenticated={isAuthenticated}
      setSelectedNeed={setSelectedNeed}
      setIsApplyModalOpen={setIsApplyModalOpen}
      highlights={[]}
    />
  );
}
