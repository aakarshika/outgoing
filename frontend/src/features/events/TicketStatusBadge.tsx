import { Box, Typography } from '@mui/material';
import { Ticket } from 'lucide-react';

interface TicketStatusBadgeProps {
  ticketCount?: number;
  capacity?: number | null;
  highlighted?: boolean;
  sx?: any;
}

export const TicketStatusBadge = ({
  ticketCount,
  capacity,
  highlighted,
  sx = {},
}: TicketStatusBadgeProps) => {
  if (!capacity) return null;

  return (
    <Box
      sx={{
        bgcolor: highlighted ? '#fef08a' : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(4px)',
        border: '1px dashed',
        borderColor: highlighted ? '#eab308' : '#ccc',
        color: '#1a1a1a',
        px: 1,
        py: '2px',
        borderRadius: '4px',
        boxShadow: highlighted
          ? '1px 2px 5px rgba(234, 179, 8, 0.3)'
          : '1px 1px 3px rgba(0,0,0,0.1)',
        transform: 'rotate(-2deg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        ...sx,
      }}
    >
      <Ticket size={12} color={highlighted ? '#ca8a04' : '#1a1a1a'} />
      <Typography
        sx={{
          fontSize: '0.7rem',
          fontWeight: 'bold',
          fontFamily: '"Caveat", cursive',
          letterSpacing: '0.5px',
          pt: '1px', // align baseline with icon visually
        }}
      >
        {ticketCount || 0}/{capacity}
      </Typography>
    </Box>
  );
};
