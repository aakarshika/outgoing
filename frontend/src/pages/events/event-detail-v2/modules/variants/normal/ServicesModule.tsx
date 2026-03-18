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
            ? 'See if they interest you - chip in and get in cheaper.'
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

  const renderAfterEvent = () => (
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
          Shoutout to people who made it possible...
        </Typography>
        <Typography
          sx={{ fontSize: 12, color: 'var(--color-text-secondary, #6b7280)' }}
        >
          Without these people, this night wouldn't have happened.
        </Typography>
      </Box>

      {participatingVendors.map((vendor: any) => (
        <Box
          key={vendor.id}
          sx={{
            bgcolor: 'var(--color-background-primary, #fff)',
            border: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
            borderRadius: 'var(--border-radius-lg, 12px)',
            p: 1.375,
            mb: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
          }}
        >
          <UserAvatar
            src={vendor.vendor_avatar}
            username={vendor.vendor_name}
            size="sm"
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-text-primary, #111)',
              }}
            >
              {vendor.vendor_name}
            </Typography>
            <Typography
              sx={{
                fontSize: 11,
                color: 'var(--color-text-secondary, #6b7280)',
                mt: 0.125,
              }}
            >
              {vendor.category?.replace('_', ' ') || 'Service'}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 0.5,
              flexShrink: 0,
            }}
          >
            <Box sx={{ fontSize: 12, color: '#EF9F27', letterSpacing: -1 }}>
              {'★'.repeat(5)}
            </Box>
            <Box
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                fontWeight: 500,
                px: 1.25,
                py: 0.25,
                borderRadius: 999,
                border: '0.5px solid var(--color-border-secondary, #e5e7eb)',
                bgcolor: 'transparent',
                color: 'var(--color-text-primary, #111)',
                cursor: 'pointer',
              }}
            >
              Rate →
            </Box>
          </Box>
        </Box>
      ))}
    </>
  );

  return (
    <Box sx={{ px: 2, pt: 2 }}>
      {capabilities.showServiceShoutoutOnly ? renderAfterEvent() : renderOpenNeeds()}
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
