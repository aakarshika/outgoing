import { Box, Stack, Typography, Avatar, Chip, Button, IconButton } from '@mui/material';
import {
  Briefcase,
  Coins,
  Plus,
  Edit2,
  ArrowLeft,
  Star,
  CheckCircle,
  Clock
} from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import type { NeedApplication } from '@/types/needs';
import { ServiceApplicationEventCard } from '@/components/events/ServiceApplicationEventCard';
import { useAuth } from '@/features/auth/hooks';
import { useServices } from '@/features/vendors/ServicesContext';
import { formatShortDate, formatTime } from '@/utils/date';
import { getCategoryVisuals } from '@/constants/categories';
import { FallbackBox } from '@/components/ui/FallbackBox';

export interface ServiceWithApplications {
  id: number | string;
  title: string;
  category: string;
  portfolio_image: string | null;
  is_active: boolean;
  location_city: string;
  created_at: string;
  base_price: string | null;
  applications: (NeedApplication & { eventDetail?: any })[];
  isDetached?: boolean;
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
  const { user } = useAuth();
  const { openEditService } = useServices();

  const acceptedGigs = serviceApplications.filter(app => app.status === 'accepted').length;

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 0, sm: 0 } }}>
      {/* PROFILE HERO */}
      <Box
        sx={{
          background: '#fff',
          borderRadius: '18px',
          p: 2.25,
          mb: 2.5,
          boxShadow: '0 4px 12px rgba(43, 33, 24, 0.04)',
          border: '1px solid rgba(43, 33, 24, 0.06)',

        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.75} sx={{ mb: 2 }}>
          <Avatar
            src={user?.avatar || undefined}
            sx={{
              width: 52,
              height: 52,
              bgcolor: '#D85A30',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: 18
            }}
          >
            {user?.first_name ? `${user.first_name[0]}${user.last_name?.[0] || ''}` : 'U'}
          </Avatar>
          <Box>
            <Typography sx={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#1A1A1A' }}>
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Your Profile'}
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#888780', mt: 0.25 }}>
              Contributor · Bengaluru
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ display: 'flex', borderTop: '0.5px solid #F0EDE8', pt: 1.75 }}>
          {[
            { label: 'Rating', val: '4.9', icon: <Star size={12} /> },
            { label: 'Events done', val: '7' },
            { label: 'Active gigs', val: String(acceptedGigs) },
          ].map((stat, idx) => (
            <Box
              key={idx}
              sx={{
                flex: 1,
                textAlign: 'center',
                borderRight: idx === 2 ? 'none' : '0.5px solid #F0EDE8'
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                <Typography sx={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#1A1A1A' }}>
                  {stat.val}
                </Typography>
                {stat.icon && <Box sx={{ color: '#F59E0B', mt: -0.25 }}>{stat.icon}</Box>}
              </Stack>
              <Typography sx={{ fontSize: 10, color: '#888780', mt: 0.25, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* SERVICES SECTION */}
      <Box sx={{ mb: 3.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5, px: 0.5 }}>

          <Button

            onClick={(e) => {
              e.stopPropagation();
              openEditService(null as any);
            }}
            startIcon={<Plus size={14} />}
            sx={{ fontSize: 12, color: '#D85A30', fontWeight: 600, textTransform: 'none', p: 0 }}
          >
            Add service
          </Button>
        </Stack>

        <Stack spacing={1}>
          {servicesWithApplications.filter(s => !s.isDetached).map((service) => {
            const categoryVisuals = getCategoryVisuals(service.category || '');
            return (
              <Box
                key={service.id}

                onClick={(e) => {
                  e.stopPropagation();
                  openEditService(service as any);
                }}
                sx={{
                  background: '#fff',
                  borderRadius: '14px',
                  p: 2,
                  cursor: 'pointer',
                  border: '1px solid rgba(43, 33, 24, 0.06)',
                  boxShadow: '0 2px 6px rgba(43, 33, 24, 0.03)',
                  '&:hover': {
                    borderColor: 'rgba(216, 90, 48, 0.3)',
                    boxShadow: '0 4px 12px rgba(43, 33, 24, 0.08)'
                  }
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '10px',
                      bgcolor: '#FAECE7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Briefcase size={18} color="#D85A30" />
                  </Box>
                  <Typography sx={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#1A1A1A', flex: 1 }}>
                    {service.title}
                    <br />
                    <Chip
                      icon={<Box>{categoryVisuals.icon}</Box>}
                      label={service.category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      size="small"
                      sx={{ height: 20, fontSize: 10, fontWeight: 500, bgcolor: '#F5F0EB', color: '#5F5E5A' }}
                    />
                  </Typography>
                </Stack>

                <Typography sx={{ fontSize: 12, color: '#888780', mt: 1.25, lineHeight: 1.5 }}>
                  Available for {service.category?.toLowerCase() || 'events'}. Created {formatShortDate(service.created_at)}.
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Box>

      {/* APPLICATIONS SECTION */}
      <Box>
        {servicesWithApplications.map((group) => {
          const categoryVisuals = getCategoryVisuals(group.category || '');
          return (<Box key={group.id} sx={{ mb: 2.5 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, px: 0.5 }}>
              <Box sx={{ color: '#888780' }}>{
                categoryVisuals.icon
              }</Box>
              <Typography sx={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>
                {group.title}
              </Typography>
              <Chip
                label={`${group.applications.length} applications`}
                size="small"
                sx={{ height: 18, fontSize: 10, fontWeight: 500, bgcolor: '#F5F0EB', color: '#5F5E5A', '.MuiChip-label': { px: 1 } }}
              />
            </Stack>

            <Stack spacing={0}>
              {group.applications.map((app) => (
                <ServiceApplicationEventCard
                  key={app.id}
                  application={app}
                  event={app.eventDetail || {
                    id: app.event_id || 0,
                    title: app.event_title || 'Unknown Event',
                    start_time: app.created_at, // Fallback
                    location_name: 'Location TBD'
                  }}
                  expanded={expandedServiceId === `app-${app.id}`}
                  onToggle={() => setExpandedServiceId(curr => curr === `app-${app.id}` ? null : `app-${app.id}`)}
                />
              ))}
            </Stack>
          </Box>)
        }
        )}


        {servicesWithApplications.length === 0 && (
          <FallbackBox
            title="Start your journey"
            description="No active services or applications yet. Share your skills and start collaborating on amazing events."
            icon={<Briefcase />}
            actionLabel="Add your first service"
            onAction={() => openEditService(null as any)}
          />
        )}
      </Box>
    </Box>
  );
}