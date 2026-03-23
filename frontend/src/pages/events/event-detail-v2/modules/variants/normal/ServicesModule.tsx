import { Box, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { UserAvatar } from '@/components/ui/UserAvatar';
import { QuickCreateServiceDialog } from '@/components/vendors/QuickCreateServiceDialog';
import { fetchMyServices } from '@/features/vendors/api';

import { useEventDetailV2 } from '../../context';

import { NormalServiceCard } from './components/NormalServiceCard';

interface NormalServicesModuleProps {
  event: any;
  displayNeeds: any[];
  isAuthenticated: boolean;
}

export function NormalServicesModule({
  event,
  displayNeeds,
  isAuthenticated,
}: NormalServicesModuleProps) {
  const { capabilities } = useEventDetailV2();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: myServicesResponse } = useQuery({
    queryKey: ['myServices'],
    queryFn: fetchMyServices,
    enabled: isAuthenticated,
  });

  const [isQuickCreateServiceOpen, setIsQuickCreateServiceOpen] = useState(false);
  const [quickCreateServiceCategory, setQuickCreateServiceCategory] = useState('');

  const openQuickCreateService = (category?: string) => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    setQuickCreateServiceCategory(category || '');
    setIsQuickCreateServiceOpen(true);
  };

  const myServices = myServicesResponse?.data || [];
  const participatingVendors = event.participating_vendors || [];
  const openNeeds =
    displayNeeds?.filter(
      (n: any) => n.status !== 'filled' && n.status !== 'cancelled',
    ) || [];
  const filledNeeds = displayNeeds?.filter((n: any) => n.status === 'filled') || [];

  if (participatingVendors.length === 0 && displayNeeds?.length === 0) {
    return null;
  }

  const renderOpenNeeds = () => (
    <>
      <Box sx={{ mb: 1.5 }}>
        <Typography
          sx={{
            fontFamily: '"Syne", sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--color-text-primary, #111)',
            mb: 0.5,
          }}
        >
          Chip-in opportunities
        </Typography>
        <Typography
          sx={{ fontSize: 12, color: 'var(--color-text-secondary, #6b7280)' }}
        >
          {capabilities.canManageServices
            ? 'See if they interest you - get in cheaper, or get compensated in cash.'
            : 'Services are locked while this event is in draft.'}
        </Typography>
      </Box>

      {openNeeds.map((need: any) => (
        <NormalServiceCard
          key={need.id}
          event={event}
          need={need}
          isAuthenticated={isAuthenticated}
          myServices={myServices}
          onCreateService={openQuickCreateService}
          isInteractionDisabled={!capabilities.canManageServices}
        />
      ))}

      {filledNeeds.map((need: any) => (
        <NormalServiceCard
          key={need.id}
          event={event}
          need={need}
          isAuthenticated={isAuthenticated}
          myServices={myServices}
          onCreateService={openQuickCreateService}
          isInteractionDisabled={!capabilities.canManageServices}
        />
      ))}
    </>
  );


  return (
    <Box sx={{ px: 2, pt: 2,
      pb: 4,
      backgroundColor: 'rgba(237, 232, 226, 0.3)',
     }}>
      {capabilities.showServiceShoutoutOnly ? null : renderOpenNeeds()}
      <QuickCreateServiceDialog
        open={isQuickCreateServiceOpen}
        defaultCategory={quickCreateServiceCategory}
        onClose={async () => {
          setIsQuickCreateServiceOpen(false);
          setQuickCreateServiceCategory('');
          await queryClient.invalidateQueries({ queryKey: ['myServices'] });
        }}
      />
    </Box>
  );
}
