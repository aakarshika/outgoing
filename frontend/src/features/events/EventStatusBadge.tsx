import { Box, Typography } from '@mui/material';
import { EventLifecycleState } from '@/types/events';
import { Star } from 'lucide-react';

interface EventStatusBadgeProps {
  status: EventLifecycleState | string;
  sx?: any;
}

const getStatusStyles = (status: EventLifecycleState | string) => {
  switch (status) {
    case 'live':
      return {
        bg: 'rgba(182, 0, 0, 0.8)',
        color: '#ff0000',
        label: 'Live',
      };
    case 'event_ready':
      return {
        bg: 'rgba(227, 242, 253, 0.8)',
        color: '#1976D2',
        label: 'Ready',
      };
    case 'cancelled':
      return {
        bg: 'rgba(255, 235, 238, 0.8)',
        color: '#C62828',
        label: 'Cancelled',
      };
    case 'postponed':
      return {
        bg: 'rgba(243, 229, 245, 0.8)',
        color: '#7B1FA2',
        label: 'Postponed',
      };
    case 'completed':
      return {
        bg: 'rgba(245, 245, 245, 0.8)',
        color: '#616161',
        label: 'Completed',
      };
    case 'draft':
      return {
        bg: 'rgba(238, 238, 238, 0.8)',
        color: '#757575',
        label: 'Draft',
      };
    case 'published':
      return {
        bg: 'rgba(232, 245, 232, 0.8)',
        color: '#2E7D32',
        label: 'Published',
      };
    default:
      return {
        bg: 'rgba(245, 245, 245, 0.8)',
        color: '#616161',
        label: status,
      };
  }
};

export const EventStatusBadge = ({ status, sx = {} }: EventStatusBadgeProps) => {
  if (!status) return null;
  const styles = getStatusStyles(status);

  return (
    <Box
      sx={{
        px: 1,
        py: 0.25,
        borderRadius: '6px',
        backgroundColor: styles.bg,
        color: styles.color,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
        display: 'inline-flex',
        alignItems: 'center',
        backdropFilter: 'blur(4px)',
        border: `1px solid ${styles.color}20`,
        ...sx,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontSize: 'inherit',
          fontWeight: 'inherit',
          lineHeight: 1,
        }}
      >
        {styles.label}
      </Typography>
    </Box>
  );
};


export const HostStatusBadge = ({ status, sx = {} }: EventStatusBadgeProps) => {
  if (!status) return null;
  const styles = getStatusStyles(status);
  
  return (
    <Box
      sx={{
        px: 1,
        py: 0.25,
        color: styles.color,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.02em',
        display: 'inline-flex',
        alignItems: 'center',
        // border: `1px solid ${styles.color}20`,
        ...sx,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontSize: 13,
          display: 'inline-flex',
          gap: 0.5,
        }}
      >
      <Typography
        variant="caption"
        sx={{
          pt: ['1px'],
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        by 
      </Typography>
      {' ' + styles.label} 
      </Typography>
    </Box>
  );
}