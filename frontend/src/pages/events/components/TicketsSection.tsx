import {
    Box,
    Typography,
} from '@mui/material';

import { PurchasedTicketStack, TicketStub } from './scrapbookHelpers';

export const TicketsSection = ({
    event,
    purchaseTicket,
    handleBuyTicket,
    handleManageTicket,
}: {
    event: any;
    purchaseTicket: any;
    handleBuyTicket: () => void;
    handleManageTicket: (ticketId?: number) => void;
}) => (
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
                                onBuyMore={() => handleBuyTicket()}
                                onManage={(tid) => handleManageTicket(tid)}
                                isLoading={purchaseTicket.isPending}
                                capacity={tier?.capacity}
                                soldCount={tier?.sold_count}
                            />
                        );
                    });
                })()}
            </Box>
        )}

        {/* Ticket Stubs (if applicable) - Always on Left */}
        {event.ticket_tiers && event.ticket_tiers.length > 0 && (
            <Box sx={{ mt: 0 }}>
                {/* Only show tiers that have NOT been purchased yet */}
                {(() => {
                    const boughtTypes = new Set(event.user_tickets?.map((t: any) => t.ticket_type) || []);
                    const availableTiers = event.ticket_tiers.filter((tier: any) => !boughtTypes.has(tier.name));

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
                                    onBuy={() => handleBuyTicket()}
                                    isLoading={purchaseTicket.isPending}
                                />
                            ))}
                        </>
                    );
                })()}
            </Box>
        )}
    </>
);
