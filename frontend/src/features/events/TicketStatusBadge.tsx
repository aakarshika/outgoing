import { Box, Typography } from '@mui/material';
import { Ticket } from 'lucide-react';

interface TicketStatusBadgeProps {
  ticketCount?: number;
  capacity?: number | null;
  highlighted?: boolean;
  variant?: 'default' | 'large';
  rightAligned?: boolean;
  userTicketCount?: number;
  sx?: any;
}

export const TicketStatusBadge = ({
  ticketCount,
  capacity,
  highlighted,
  variant = 'default',
  rightAligned = false,
  userTicketCount,
  sx = {},
}: TicketStatusBadgeProps) => {
  if (!capacity) return null;

  const isLarge = userTicketCount && userTicketCount > 0;
  const soldCopy = `${ticketCount || 0}/${capacity}${isLarge ? ' Sold' : ''}`;
  const ticketCopy =
    isLarge && typeof userTicketCount === 'number'
      ? `${userTicketCount} ticket${userTicketCount === 1 ? '' : 's'}.`
      : `0 tickets`;

  return (
    <Box
      sx={{
        bgcolor: highlighted ? '#fef08a' : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(4px)',
        border: '1px dashed',
        borderColor: highlighted ? '#eab308' : '#ccc',
        color: '#1a1a1a',
        px: isLarge ? 1.25 : 1,
        py: isLarge ? 0.75 : '2px',
        borderRadius: '4px',
        boxShadow: highlighted
          ? '1px 2px 5px rgba(234, 179, 8, 0.3)'
          : '1px 1px 3px rgba(0,0,0,0.1)',
        transform: 'rotate(-2deg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: rightAligned ? 'flex-end' : 'center',
        flexDirection: rightAligned ? 'row-reverse' : 'row',
        textAlign: rightAligned ? 'right' : 'left',
        gap: isLarge ? 0.75 : 0.5,
        ...sx,
      }}
    >
      <Ticket size={isLarge ? 14 : 12} color={highlighted ? '#ca8a04' : '#1a1a1a'} />
      {isLarge ? (
        <Box>
          {/* {ticketCopy && ( */}
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 'bold',
              fontFamily: '"Caveat", cursive',
              letterSpacing: '0.3px',
              lineHeight: 1.05,
            }}
          >
            {ticketCopy}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.78rem',
              fontWeight: 'bold',
              fontFamily: '"Caveat", cursive',
              letterSpacing: '0.4px',
              lineHeight: 1.05,
              pt: ticketCopy ? 0.15 : '1px',
            }}
          >
            {soldCopy}
          </Typography>
        </Box>
      ) : (
        <Typography
          sx={{
            fontSize: '0.7rem',
            fontWeight: 'bold',
            fontFamily: '"Caveat", cursive',
            letterSpacing: '0.5px',
            pt: '1px',
          }}
        >
          {soldCopy}
        </Typography>
      )}
    </Box>
  );
};
