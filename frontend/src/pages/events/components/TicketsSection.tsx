import { Box } from '@mui/material';
import { TicketStub, PurchasedTicketStack } from './scrapbookHelpers';

export const TicketsSection = ({
  event,
  purchaseTicket,
  handleBuyTicket,
  handleOneClickBuy,
  handleManageTicket,
  clearTicketformTrigger,
}: {
  event: any;
  purchaseTicket: any;
  handleBuyTicket: (tierId: number, quantity: number) => void;
  handleOneClickBuy: (tierId: number, quantity: number) => void;
  handleManageTicket: (ticketId?: number) => void;
  clearTicketformTrigger?: number;
}) => {
  const isEventActive = !['draft', 'completed', 'closed'].includes(
    event.lifecycle_state,
  );

  return (
    <>
      {/* Purchased Tickets (if applicable) */}
      {event.user_tickets && event.user_tickets.length > 0 && (
        <Box sx={{ mt: 0 }}>
          {(() => {
            // Group tickets by type
            const groups: Record<string, any[]> = {};
            event.user_tickets.forEach((t: any) => {
              if (!groups[t.ticket_type]) groups[t.ticket_type] = [];
              groups[t.ticket_type].push(t);
            });

            return Object.entries(groups).map(([type, tickets]) => {
              const tier = event.ticket_tiers?.find((t: any) => t.name === type);
              return (
                <PurchasedTicketStack
                  key={type}
                  tickets={tickets}
                  onBuyMore={(qty) => handleBuyTicket(tier?.id || 0, qty)}
                  onManage={(tid) => handleManageTicket(tid)}
                  isLoading={purchaseTicket.isPending}
                  capacity={tier?.capacity}
                  soldCount={tier?.sold_count}
                  disabled={!isEventActive}
                />
              );
            });
          })()}
        </Box>
      )}

      {/* Ticket Stubs (if applicable) - Always on Left */}
      {event.ticket_tiers && event.ticket_tiers.length > 0 && (
        <Box sx={{ mt: 0 }}>
          {(() => {
            const boughtTypes = new Set(
              event.user_tickets?.map((t: any) => t.ticket_type) || [],
            );
            const availableTiers = event.ticket_tiers.filter(
              (tier: any) => !boughtTypes.has(tier.name),
            );

            if (availableTiers.length === 0) return null;

            return (
              <>
                {availableTiers.map((tier: any) => (
                  <TicketStub
                    key={tier.id}
                    type={tier.name}
                    price={parseFloat(tier.price)}
                    color={tier.color}
                    capacity={tier.capacity}
                    soldCount={tier.sold_count}
                    onBuy={(qty) => handleBuyTicket(tier.id, qty)}
                    onOneClickBuy={(qty) => handleOneClickBuy(tier.id, qty)}
                    isLoading={purchaseTicket.isPending}
                    disabled={!isEventActive}
                    clearTicketformTrigger={clearTicketformTrigger}
                  />
                ))}
              </>
            );
          })()}
        </Box>
      )}
    </>
  );
};
