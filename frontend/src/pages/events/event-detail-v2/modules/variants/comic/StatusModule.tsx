import { useNavigate } from 'react-router-dom';

import { useToggleInterest } from '@/features/events/hooks';
import { StatusBannerSection } from '@/pages/events/components/StatusBannerSection';

interface ComicStatusModuleProps {
  event: any;
  isHost: boolean;
}

export function ComicStatusModule({ event, isHost }: ComicStatusModuleProps) {
  const navigate = useNavigate();
  const toggleInterest = useToggleInterest();

  return (
    <StatusBannerSection
      event={event}
      isHost={isHost}
      isAuthenticated={false}
      navigate={navigate}
      toggleInterest={toggleInterest}
      occurrences={[]}
    />
  );
}
