import { Box, Collapse, Grid, IconButton, Typography } from '@mui/material';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getCategoryLabel } from '@/constants/categories';

import { ClassifiedAd } from './ClassifiedAd';
import { HostBusinessCard } from './HostBusinessCard';
import { MiniBusinessCard } from './MiniBusinessCard';

export const ServicesSection = ({
  event,
  displayNeeds,
  myServicesResponse,
  isAuthenticated,
  setSelectedNeed,
  setIsApplyModalOpen,
  highlights = [],
}: {
  event: any;
  displayNeeds: any[];
  myServicesResponse: any;
  isAuthenticated: boolean;
  setSelectedNeed: (n: any) => void;
  setIsApplyModalOpen: (v: boolean) => void;
  highlights?: any[];
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    localStorage.setItem('services_section_expanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  useEffect(() => {
    const handleScroll = (e: any) => {
      if (e.detail === 'services') {
        setIsExpanded(true);
      }
    };
    window.addEventListener('section-scroll', handleScroll);
    return () => window.removeEventListener('section-scroll', handleScroll);
  }, []);

  const participatingVendors = event?.participating_vendors || [];

  const myServices = myServicesResponse?.data || [];
  const isCenter = highlights.length === 0;

  // return displayNeeds.filter(n => n.status !== 'override_filled' && n.status !== 'filled').length > 0 && (
  return (
    <Box sx={{ mt: 6 }}>
      {/* Services Header Toggle */}
      <Box
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCenter ? 'center' : 'space-between',
          cursor: 'pointer',
          mb: 2,
          p: 1,
          borderRadius: 1,
          '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
          transition: 'background-color 0.2s',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontFamily: '"Permanent Marker"',
            fontSize: '1rem',
          }}
        >
          hustler APPLICATIONS OPEN!
        </Typography>
        <IconButton size="small">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Box>
          <Grid container spacing={2}>
            {displayNeeds.length > 0 && (
              <>
                {displayNeeds
                  .filter((n) => n.status !== 'override_filled')
                  .map((need: any) => {
                    const isEligible = myServices.some(
                      (s: any) =>
                        s.category
                          .toLowerCase()
                          .includes(need.category.toLowerCase()) ||
                        need.category.toLowerCase().includes(s.category.toLowerCase()),
                    );
                    const isOpportunity =
                      isAuthenticated && !isEligible && ((need.status === 'open' || !need.status || need.status === "pending") || !need.status || need.status === "pending");
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={need.id}>
                        <ClassifiedAd
                          need={need}
                          event={event}
                          isEligible={isEligible}
                          isOpportunity={isOpportunity}
                          onInquire={(n) => {
                            setSelectedNeed(n);
                            setIsApplyModalOpen(true);
                          }}
                        />
                      </Grid>
                    );
                  })}
              </>
            )}
          </Grid>
        </Box>
      </Collapse>
    </Box>
  );
};
