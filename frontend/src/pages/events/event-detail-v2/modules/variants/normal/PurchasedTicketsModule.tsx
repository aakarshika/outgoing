import { Box, Typography } from '@mui/material';
import { useMemo } from 'react';

import { EventPurchasedTicketCard } from '@/components/events/EventPurchasedTicketCard';
import { Check, CheckCircle2 } from 'lucide-react';
import { Icon } from '@iconify/react';
import { SubHeaderEventPage } from './SubHeaderEventPage';

interface PurchasedTicketsModuleProps {
  event: any;
  userTickets: any[];
  ticketTiers: any[];
  onViewTicket: (ticketId: number) => void;
}

function groupTicketsByTier(userTickets: any[], ticketTiers: any[]) {
  const byTier = new Map<string, any[]>();
  (userTickets || []).forEach((t) => {
    const key = String(t.tier_id ?? '');
    if (!byTier.has(key)) byTier.set(key, []);
    byTier.get(key)!.push(t);
  });

  const ordered: { tierKey: string; tickets: any[] }[] = [];
  const seen = new Set<string>();

  (ticketTiers || []).forEach((tt: any) => {
    const key = String(tt.id);
    const list = byTier.get(key);
    if (list?.length) {
      ordered.push({ tierKey: key, tickets: list });
      seen.add(key);
    }
  });

  byTier.forEach((tickets, key) => {
    if (!seen.has(key) && tickets.length) {
      ordered.push({ tierKey: key, tickets });
    }
  });

  return ordered;
}

export function PurchasedTicketsModule({
  event,
  userTickets,
  ticketTiers,
  onViewTicket,
}: PurchasedTicketsModuleProps) {
  if (!userTickets?.length) return null;

  const tierGroups = useMemo(
    () => groupTicketsByTier(userTickets, ticketTiers),
    [userTickets, ticketTiers],
  );
  const went = (userTickets.some((ticket: any) => ticket.status === 'used'));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

      <SubHeaderEventPage
        heading={(event.lifecycle_state == 'completed' && went) ? 'You went!' :
          (!went) ? 'You\'re in!' :
            (went) ? 'You\'re there!' :
              ''}
        icon="emojione-monotone:old-key"
        description={(userTickets.some((ticket: any) => ticket.status === 'used')) ? 'How\'s it? Add some Highlightings of your experience there' : ''}
      />
      {!(event.lifecycle_state == 'completed' && went) && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {tierGroups.map(({ tierKey, tickets }) => (
            <EventPurchasedTicketCard
              key={tierKey}
              event={event}
              tierTickets={tickets}
              ticketTiers={ticketTiers}
              onViewTicket={onViewTicket}
            />
          ))}
        </Box>
      )}

    </Box>
  );
}
