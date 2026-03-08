import { Box, Typography } from '@mui/material';

import { useTopVendorsFeed } from '@/features/events/hooks';
import { useRequests } from '@/features/requests/hooks';

import { CommunityRequestsSection } from './CommunityRequestsSection';
import { VendorServicesSection } from './VendorServicesSection';

// --- Make Your Event Happen ---
export const MakeYourEventHappenSection = () => {
  const { data: requestsData, isLoading: requestsLoading } = useRequests({
    sort: 'trending',
    page: 1,
    page_size: 6,
  });
  const requests = requestsData?.data || [];

  const { data: servicesData, isLoading: servicesLoading } = useTopVendorsFeed();
  const services = servicesData?.data || [];

  // Always render the section
  return (
    <Box sx={{ px: { xs: 2, sm: 4, lg: 8 }, py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 8 }}>
        <Typography
          variant="h3"
          sx={{ fontFamily: '"Permanent Marker"', color: '#1a1a1a', mb: 2 }}
        >
          Make Your Event Happen
        </Typography>
        <Typography
          variant="body1"
          sx={{ fontFamily: 'serif', fontStyle: 'italic', color: '#666' }}
        >
          Everything you need to pull off the perfect party.
        </Typography>
      </Box>

      <CommunityRequestsSection requests={requests} />
      <VendorServicesSection services={services} />
    </Box>
  );
};
