import { Box, Rating, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { UserAvatar } from '@/components/ui/UserAvatar';
import { QuickCreateServiceDialog } from '@/components/vendors/QuickCreateServiceDialog';
import { fetchMyServices } from '@/features/vendors/api';

import { useEventDetailV2 } from '../../context';

import { NormalServiceCard } from './components/NormalServiceCard';
import { VENDOR_CATEGORIES } from '@/constants/categories';
import { Attendee, AttendeePopover } from '@/components/ui/AttendeePopover';
import { Briefcase } from 'lucide-react';
import { Icon } from '@iconify/react';
import { SubHeaderEventPage } from './SubHeaderEventPage';

interface NormalServicesModuleProps {
  event: any;
  displayNeeds: any[];
  isAuthenticated: boolean;
}

export function NormalServicesAfterModule({
  event,
  displayNeeds,
  isAuthenticated,
}: NormalServicesModuleProps) {
  const { capabilities } = useEventDetailV2();
  const navigate = useNavigate();

  const participatingVendors = event.participating_vendors || [];
  
  if (participatingVendors.length === 0 && displayNeeds?.length === 0) {
    return null;
  }


  const renderAfterEvent = () => (
    
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

      <SubHeaderEventPage
        heading="Shoutouts..."
        icon="emojione-monotone:clinking-glasses"
        description="Without these people, this night wouldn't have happened."
        iconSide="right"
      />
      {participatingVendors.map((vendor: any) => (
        
    <Box
    sx={{
      bgcolor: 'rgba(237, 232, 226, 0.3)',
      border: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
      mb: 1.5,
      p: 1.375,
      opacity:  1,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 'var(--border-radius-md, 8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          flexShrink: 0,
        }}
      >
        { VENDOR_CATEGORIES.find((category: any) => category.items.find((item: any) => item.id === vendor.need_category))?.items.find((item: any) => item.id === vendor.need_category)?.icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: '"Syne", sans-serif',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-text-primary, #111)',
          }}
        >
          {vendor.title}
        </Typography>
      </Box>
    </Box>

    <Box >
      <Box display="flex" flexDirection="row" justifyContent="flex-end" gap={1}>
        {/* Accepted Vendor Section */}
      <Rating value={4} readOnly />
      <AttendeePopover
        attendee={
          {
            username:
              vendor.username || vendor.vendor_name || 'user',
            name: vendor.name,
            avatar: vendor.avatar,
            is_verified: vendor.is_verified || false,
            bio: vendor.bio,
          } as Attendee
        }
        variant="normal"
      >
        <Box
          sx={{
            display: 'inline-flex',
            px: 1.25,
          }}
        >
          <Typography
            sx={{
              fontSize: 15,
              color: '#166534',
              fontWeight: 800,
            }}
          >
            <Box component="span" sx={{ fontWeight: 800, color: '#111' }}>
             
            <span>by </span > 

            <span style={{ fontWeight: 600, color: '#D85A30' }}>{vendor.username || vendor.vendor_name}</span>
            </Box>
          </Typography>
        </Box>
      </AttendeePopover>
  

      </Box>

    </Box>

  </Box>
      ))}
    </Box>
  );

  return (
    <Box sx={{ px: 2, pt: 2,
      pb: 4,
     }}>
      {renderAfterEvent()}
    </Box>
  );
}
