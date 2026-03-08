import React from 'react';

import { ManageNeedsTab } from '@/components/events/ManageNeedsTab';

interface ManageNeedsSectionProps {
  eventId: number;
  isSeries: boolean;
}

export const ManageNeedsSection: React.FC<ManageNeedsSectionProps> = ({
  eventId,
  isSeries,
}) => {
  return <ManageNeedsTab eventId={eventId} isSeries={isSeries} />;
};
