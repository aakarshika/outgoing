import {
  Box,
  Collapse,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ClassifiedAd } from './ClassifiedAd';
import { HostBusinessCard } from './HostBusinessCard';
import { MiniBusinessCard } from './MiniBusinessCard';
import { getCategoryLabel } from '@/constants/categories';

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
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('services_section_expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

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
          Meet the planners
        </Typography>
        <IconButton size="small">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Box>
          <Grid container spacing={2}>
            {/* Host Card is always first */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{
                width: '100%',
                columns: 2,
                aspectRatio: '1.75 / 1',
              }}>
                <HostBusinessCard host={event.host} />


                {(!(event.features?.length === 0 && displayNeeds.filter(n => n.status === 'override_filled').length === 0)) && (

                  <Box sx={{
                    maxWidth: 320,
                  }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: '"Permanent Marker"',
                        color: '#ef4444',
                        display: 'block',
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}
                    >
                      Services by the host
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      {[
                        ...displayNeeds
                          .filter(n => n.status === 'override_filled')
                          .map(n => getCategoryLabel(n.category)),
                        ...(event.features || [])
                      ].map((item: any, idx) => (
                        <Typography
                          key={idx}
                          sx={{
                            fontFamily: '"Caveat", cursive',
                            fontSize: '1.2rem',
                            color: '#555',
                            lineHeight: 1.1,
                            position: 'relative',
                            pl: 1,
                            '&::before': {
                              content: '"•"',
                              position: 'absolute',
                              left: 0,
                              color: '#ef4444'
                            }
                          }}
                        >
                          {typeof item === 'string' ? item : item.name}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Grid>

            {displayNeeds.length > 0 && (
              <>
                {displayNeeds.filter(n => n.status !== 'override_filled').map((need: any) => {
                  const isEligible = myServices.some(
                    (s: any) =>
                      s.category.toLowerCase().includes(need.category.toLowerCase()) ||
                      need.category.toLowerCase().includes(s.category.toLowerCase()),
                  );
                  const isOpportunity =
                    isAuthenticated && !isEligible && need.status === 'open';
                  return (
                    <Grid size={{ xs: 12, md: 6 }} key={need.id}>
                      <ClassifiedAd
                        need={need}
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

      <Collapse in={!isExpanded}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            alignItems: 'center',
          }}
        >
          <MiniBusinessCard
            name={event.host.username}
            avatar={event.host.avatar}
            rating={5.0}
            service="Host & Curator"
            type="host"
          />

          {participatingVendors.map((vendor: any) => (
            <MiniBusinessCard
              key={vendor.id}
              name={vendor.vendor_name}
              avatar={vendor.vendor_avatar}
              rating={vendor.rating || 5.0}
              service={vendor.category || 'Service Specialist'}
              onClick={() => {
                if (vendor.service) {
                  window.location.href = `/services/${vendor.service}`;
                }
              }}
            />
          ))}

          <Typography
            variant="caption"
            sx={{
              fontFamily: '"Permanent Marker"',
              color: 'text.secondary',
              ml: 1,
              fontSize: '0.75rem',
            }}
          >
            {participatingVendors.length} of {displayNeeds.length} need
            {displayNeeds.length > 1 ? 's' : ''} met
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
};
