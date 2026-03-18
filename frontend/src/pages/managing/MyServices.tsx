import { Box, Stack, Typography } from '@mui/material';
import { Briefcase, Coins, ExternalLink } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import type { NeedApplication } from '@/types/needs';
import { ServiceApplicationsRow, SummaryValueCard } from './useManaging';

export interface ServiceWithApplications {
  id: number | string;
  applications: NeedApplication[];
}

interface MyServicesProps {
  servicesWithApplications: ServiceWithApplications[];
  serviceApplications: NeedApplication[];
  expandedServiceId: string | null;
  setExpandedServiceId: Dispatch<SetStateAction<string | null>>;
}

export function MyServices({
  servicesWithApplications,
  serviceApplications,
  expandedServiceId,
  setExpandedServiceId,
}: MyServicesProps) {
  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2.5, md: 3.5 } }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 1,
          mb: 2.2,
          overflowX: 'auto',
          pb: 0.5,
          scrollbarWidth: 'thin',
          '& > *': {
            flex: { xs: '1 1 0', md: '1 1 0' },
            minWidth: { xs: 180, sm: 200 },
          },
        }}
      >
        <SummaryValueCard
          label="My services"
          value={String(servicesWithApplications.length)}
          hint="Each service can expand to reveal applications sent to events."
          icon={<Briefcase size={18} />}
          compact
        />
        <SummaryValueCard
          label="Applications sent"
          value={String(serviceApplications.length)}
          hint="Grouped below by service instead of event."
          icon={<ExternalLink size={18} />}
          compact
        />
        <SummaryValueCard
          label="Accepted gigs"
          value={String(
            serviceApplications.filter((application) => application.status === 'accepted')
              .length,
          )}
          hint="Accepted applications across all your services."
          icon={<Coins size={18} />}
          compact
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(66, 50, 28, 0.62)',
          }}
        >
          Service applications
        </Typography>
        <Typography
          sx={{
            mt: 0.6,
            fontFamily: 'Syne, sans-serif',
            fontSize: { xs: 22, sm: 28 },
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: '#2B2118',
          }}
        >
          All applications by service
        </Typography>
      </Box>

      {servicesWithApplications.length === 0 ? (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: '28px',
            background: 'rgba(255,255,255,0.88)',
            border: '1px solid rgba(143, 105, 66, 0.12)',
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 20,
              fontWeight: 800,
              color: '#2B2118',
            }}
          >
            No services yet
          </Typography>
          <Typography sx={{ mt: 1, fontSize: 14, color: 'rgba(66, 50, 28, 0.72)' }}>
            Your listed services will appear here once they are created.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {servicesWithApplications.map((service) => (
            <ServiceApplicationsRow
              key={service.id}
              service={service as any}
              expanded={expandedServiceId === String(service.id)}
              onToggle={() =>
                setExpandedServiceId((current) =>
                  current === String(service.id) ? null : String(service.id),
                )
              }
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}