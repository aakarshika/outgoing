import { Box, Typography, Button } from '@mui/material';
import { Ticket } from 'lucide-react';

interface PurchasedTicketsModuleProps {
  userTickets: any[];
  ticketTiers: any[];
  onViewTicket: (ticketId: number) => void;
}

const THEME_ORANGE = '#D85A30';

export function PurchasedTicketsModule({
  userTickets,
  ticketTiers,
  onViewTicket,
}: PurchasedTicketsModuleProps) {
  // Group tickets by type
  const groupedTickets: Record<string, any[]> = {};
  userTickets.forEach((t) => {
    if (!groupedTickets[t.ticket_type]) {
      groupedTickets[t.ticket_type] = [];
    }
    groupedTickets[t.ticket_type].push(t);
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        sx={{
          p: 2.5,
          bgcolor: '#f8fafc',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              p: 1,
              bgcolor: '#dcfce7',
              borderRadius: '10px',
              color: '#15803d',
            }}
          >
            <Ticket size={20} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              Your Tickets
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#64748b' }}>
              You have {userTickets.length} purchased ticket
              {userTickets.length > 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {Object.entries(groupedTickets).map(([type, tickets]) => {
            const tier = ticketTiers?.find((t) => t.name === type);
            const validTickets = tickets.filter((t) => t.status !== 'cancelled');
            const primaryTicket = validTickets[0] || tickets[0];
            if (!primaryTicket) return null;

            return (
              <Box
                key={type}
                onClick={() => onViewTicket(primaryTicket.id)}
                sx={{
                  p: 2,
                  bgcolor: '#fff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: THEME_ORANGE,
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  },
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                    {type}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: '#22c55e',
                      }}
                    />
                    <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                      {validTickets.length > 0
                        ? `${validTickets.length} Ticket${validTickets.length > 1 ? 's' : ''} • Valid`
                        : `0 Tickets • Cancelled`}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewTicket(primaryTicket.id);
                  }}
                  sx={{
                    textTransform: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    color: THEME_ORANGE,
                    '&:hover': { bgcolor: 'transparent', opacity: 0.8 },
                  }}
                >
                  View Details
                </Button>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
