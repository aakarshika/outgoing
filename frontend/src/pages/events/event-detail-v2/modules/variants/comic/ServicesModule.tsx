import { Box, Typography } from '@mui/material';
import { useState } from 'react';

import { ServicesSection } from '@/pages/events/components/ServicesSection';

import { useEventDetailV2 } from '../../context';

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
  const { capabilities } = useEventDetailV2();
  const [, setSelectedNeed] = useState<any>(null);
  const [, setIsApplyModalOpen] = useState(false);

  if (!capabilities.canManageServices && !capabilities.showServiceShoutoutOnly) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography
          variant="h6"
          sx={{ fontFamily: '"Caveat"', color: 'rgb(216, 90, 48)', mb: 1 }}
        >
          Service needs are locked while this event is in draft.
        </Typography>
      </Box>
    );
  }

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
