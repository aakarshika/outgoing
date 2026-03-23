import { Box, Button, Typography } from '@mui/material';

import { useEventDetailV2 } from '../../context';
import { PurchasedTicketsModule } from './PurchasedTicketsModule';

interface NormalTicketsModuleProps {
  className?: string;
  showStubs: boolean;
  setShowStubs: (showStubs: boolean) => void;
}

const THEME_ORANGE = '#D85A30';

export function PurchasedTickets({ className, showStubs, setShowStubs }: NormalTicketsModuleProps) {
  const {
    event,
    onViewTicket,
    capabilities,
  } = useEventDetailV2();
  const tiers = event.ticket_tiers || [];
  const hasPurchased = event.user_tickets && event.user_tickets.length > 0;


  if (tiers.length === 0 && !hasPurchased) return null;


  return (
    <Box sx={{ px: 2, pt: 2, }}>
      {hasPurchased && (
        <Box sx={{ }}>
          <PurchasedTicketsModule
            event={event}
            userTickets={event.user_tickets}
            ticketTiers={tiers}
            onViewTicket={onViewTicket}
          />

          {capabilities.showTicketPurchase && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                onClick={() => setShowStubs(!showStubs)}
                sx={{
                  textTransform: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  color: THEME_ORANGE,
                  '&:hover': { bgcolor: 'transparent', opacity: 0.8 },
                }}
              >
                {showStubs ? 'Hide options' : 'More Way In Options'}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
