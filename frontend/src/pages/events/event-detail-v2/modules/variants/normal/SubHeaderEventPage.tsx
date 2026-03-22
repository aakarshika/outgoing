import { Box, Typography } from '@mui/material';
import { useMemo } from 'react';

import { EventPurchasedTicketCard } from '@/components/events/EventPurchasedTicketCard';
import { Check, CheckCircle2 } from 'lucide-react';
import { Icon } from '@iconify/react';

interface SubHeaderEventPageProps {
  heading: string;
  icon?: string | null;
  color?: string;
  accentColor?: string;
  description: string;
  size?: number;
  iconSide?: 'left' | 'right';
}


export function SubHeaderEventPage({
    heading,
    icon = null,
    color= 'rgb(255, 217, 183)',
    accentColor= '#D85A30',
    description='',
    size= 44,
    iconSide= 'left',
}: SubHeaderEventPageProps) {

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

      <Box sx={{ display: 'flex', width: '100%', flexDirection: 'row', alignItems: 'center', gap: 1.5 }}>
        
      {iconSide === 'right' && (
        <Box sx={{ flex: 1, minWidth: 0, height: '1px', backgroundColor: '#e5e7eb' }} />
        )}
        {icon && iconSide === 'left' && (
        <Box sx={{
          // circle with checkmark
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1,
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
        }}>
          <Box position="absolute" >
            <Icon icon={icon}
              width={size+10} height={size+10}
              color={accentColor} />
          </Box>
        </Box>
        )}
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            pt: 3,
            px: 2,
            fontSize: 13,
            fontWeight: 700,
            color: '#64748b',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}
        >
            {heading}
        </Typography>
        {icon && iconSide === 'right' && (

        <Box sx={{
            // circle with checkmark
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: color,
          }}>
            <Box position="absolute" >
              <Icon icon={icon}
                width={size+10} height={size+10}
                color={accentColor} />
            </Box>
          </Box>
        )}
        {iconSide === 'left' && (
        <Box sx={{ flex: 1, minWidth: 0, height: '1px', backgroundColor: '#e5e7eb' }} />
        )}
      </Box>

      {description && (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography
            sx={{
              textAlign: iconSide === 'right' ? 'right' : 'left',
              fontSize: 13,
              fontWeight: 700,
              color: 'rgb(160, 160, 160)',
              px: 2,
              letterSpacing: '0.02em',
            }}
          >
            {description}
          </Typography>
        </Box>)}
      
    </Box>
  );
}
