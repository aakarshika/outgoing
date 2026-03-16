import { Box, Collapse, Grid, IconButton, Typography } from '@mui/material';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import { TinyBusinessCard } from '@/components/ui/TinyBusinessCard';

import { ClassifiedAd } from './ClassifiedAd';

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
  const isEventOver = !['published', 'draft', 'postponed', 'event_ready'].includes(
    event.lifecycle_state,
  );
  const participatingVendors = event?.participating_vendors || [];
  const [isExpanded, setIsExpanded] = useState(!isEventOver ? false : true);

  useEffect(() => {
    const handleScroll = (e: any) => {
      if (e.detail === 'services') {
        setIsExpanded(true);
      }
    };
    window.addEventListener('section-scroll', handleScroll);
    return () => window.removeEventListener('section-scroll', handleScroll);
  }, []);

  useEffect(() => {
    localStorage.setItem('services_section_expanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

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
          {isEventOver
            ? 'Shoutout to people who made it possible...'
            : 'Service needs OPEN! See if they interest you!'}
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
                      isAuthenticated &&
                      !isEligible &&
                      (need.status === 'open' ||
                        !need.status ||
                        need.status === 'pending' ||
                        !need.status ||
                        need.status === 'pending');
                    const assigned_vendor = participatingVendors.find(
                      (vendor: any) => vendor.id === need.assigned_vendor_id,
                    );
                    const hostProfile = {
                      username:
                        assigned_vendor?.username ||
                        assigned_vendor?.vendor_name ||
                        assigned_vendor?.name ||
                        'host',
                      avatar: assigned_vendor?.avatar || null,
                      rating: assigned_vendor?.rating,
                    };
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={need.id}>
                        {!isEventOver ? (
                          <ClassifiedAd
                            need={need}
                            event={event}
                            myServices={myServices}
                            isEligible={isEligible}
                            isOpportunity={isOpportunity}
                            onInquire={(n) => {
                              setSelectedNeed(n);
                              setIsApplyModalOpen(true);
                            }}
                          />
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              sx={{
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                color: 'rgb(189, 187, 184)',
                              }}
                            >
                              {need.title} by
                            </Typography>

                            <TinyBusinessCard
                              name={hostProfile.username}
                              avatar={hostProfile.avatar || ''}
                              onClick={(event) => {
                                event.stopPropagation();
                              }}
                            />
                          </Box>
                        )}
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
