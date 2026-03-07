import {
    Box,
} from '@mui/material';

import { TicketStub } from './scrapbookHelpers';

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
    const isEventActive = !['draft', 'completed', 'closed'].includes(event.lifecycle_state);

    return (
        <>
            {/* Ticket Stubs - Always Show All */}
            {event.ticket_tiers && event.ticket_tiers.length > 0 && (
                <Box sx={{ mt: 0 }}>
                    {(() => {
                        // Count user purchases by type
                        const purchasedCountByType = event.user_tickets?.reduce((acc: any, t: any) => {
                            acc[t.ticket_type] = (acc[t.ticket_type] || 0) + 1;
                            return acc;
                        }, {}) || {};

                        return (
                            <>
                                {event.ticket_tiers.map((tier: any) => (
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
                                        userPurchasedCount={purchasedCountByType[tier.name] || 0}
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
