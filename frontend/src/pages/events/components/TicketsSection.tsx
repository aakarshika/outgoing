import { Box, Button } from '@mui/material';
import { useState } from 'react';

import { TicketManagementModal } from '@/components/events/TicketManagementModal';
import { TICKET_COLORS } from '@/features/events/constants';

import { PurchasedTicketStack, TicketStub } from './scrapbookHelpers';

export const TicketsSection = ({
  event,
  purchaseTicket,
  handleBuyTicket,
  handleOneClickBuy,
  clearTicketformTrigger,
}: {
  event: any;
  purchaseTicket: any;
  handleBuyTicket: (tierId: number, quantity: number) => void;
  handleOneClickBuy: (tierId: number, quantity: number) => void;
  clearTicketformTrigger?: number;
}) => {
  const isEventActive = !['draft', 'completed', 'closed'].includes(
    event.lifecycle_state,
  );

  const hasPurchasedTickets = event.user_tickets && event.user_tickets.length > 0;
  const [showStubs, setShowStubs] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  return (
    <>
      {/* Purchased Tickets (if applicable) */}
      {hasPurchasedTickets && (
        <Box sx={{ mt: 0 }}>
          {(() => {
            const groups: Record<string, any[]> = {};
            event.user_tickets.forEach((t: any) => {
              if (!groups[t.ticket_type]) groups[t.ticket_type] = [];
              groups[t.ticket_type].push(t);
            });

            return Object.entries(groups).map(([type, tickets]) => {
              const tierIndex = event.ticket_tiers?.findIndex(
                (tier: any) => tier.name === type,
              );
              const tier = event.ticket_tiers?.[tierIndex !== -1 ? tierIndex : 0];
              const themeColor =
                tierIndex !== undefined && tierIndex !== -1
                  ? TICKET_COLORS[tierIndex % TICKET_COLORS.length]
                  : undefined;

              return (
                <PurchasedTicketStack
                  key={type}
                  ticket={tickets[0]}
                  count={tickets.length}
                  tierPrice={tier?.price}
                  description={tier?.description}
                  onManage={() => setSelectedTicketId(tickets[0].id)}
                  themeColor={themeColor}
                />
              );
            });
          })()}
        </Box>
      )}

      {hasPurchasedTickets && (
        <Box sx={{ mt: 0, mb: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => setShowStubs(!showStubs)}
            disabled={!isEventActive}
            sx={{
              bgcolor: '#333',
              '&:hover': { bgcolor: '#000' },
              fontFamily: '"Permanent Marker"',
              fontSize: '1rem',
              py: 1,
              px: 4,
            }}
          >
            {showStubs ? 'Hide Stubs' : 'Buy More'}
          </Button>
        </Box>
      )}

      {/* Ticket Stubs (if applicable) - Always on Left */}
      {event.ticket_tiers &&
        event.ticket_tiers.length > 0 &&
        (!hasPurchasedTickets || showStubs) && (
          <Box sx={{ mt: 0 }}>
            {event.ticket_tiers.map((tier: any, index: number) => {
              const userPurchasedCount =
                event.user_tickets?.filter((t: any) => t.ticket_type === tier.name)
                  .length || 0;

              const themeColor = TICKET_COLORS[index % TICKET_COLORS.length];

              return (
                <TicketStub
                  key={tier.id}
                  type={tier.name}
                  price={parseFloat(tier.price)}
                  color={tier.color}
                  capacity={tier.capacity}
                  soldCount={tier.sold_count}
                  userPurchasedCount={userPurchasedCount}
                  onBuy={(qty) => handleBuyTicket(tier.id, qty)}
                  onOneClickBuy={(qty) => handleOneClickBuy(tier.id, qty)}
                  isLoading={purchaseTicket.isPending}
                  disabled={!isEventActive}
                  clearTicketformTrigger={clearTicketformTrigger}
                  themeColor={themeColor}
                />
              );
            })}
          </Box>
        )}
      <TicketManagementModal
        isOpen={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        tickets={event.user_tickets}
        ticketTiers={event.ticket_tiers}
        initialIndex={Math.max(
          0,
          event.user_tickets?.findIndex((t: any) => t.id === selectedTicketId) ?? 0,
        )}
      />
    </>
  );
};
