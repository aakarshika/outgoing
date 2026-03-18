import type { UseMutationResult } from '@tanstack/react-query';

import { TicketsSection } from '@/pages/events/components/TicketsSection';

interface ComicTicketsModuleProps {
  event: any;
  purchaseTicket: UseMutationResult<any, any, any, any>;
  clearTicketformTrigger: number;
  handleBuyTicket: (tierId: number, quantity: number) => void;
  handleBuyMultiple: (selections: Array<{ tierId: number; quantity: number }>) => void;
  handleOneClickBuy: (tierId: number, quantity: number) => void;
  onViewTicket: (ticketId: number) => void;
}

export function ComicTicketsModule({
  event,
  purchaseTicket,
  clearTicketformTrigger,
  handleBuyTicket,
  handleBuyMultiple,
  handleOneClickBuy,
  onViewTicket,
}: ComicTicketsModuleProps) {
  return (
    <TicketsSection
      event={event}
      purchaseTicket={purchaseTicket}
      handleBuyTicket={handleBuyTicket}
      handleOneClickBuy={handleOneClickBuy}
      clearTicketformTrigger={clearTicketformTrigger}
    />
  );
}
