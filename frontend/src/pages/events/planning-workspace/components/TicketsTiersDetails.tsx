import { Box, Typography } from '@mui/material';

import { TICKET_COLORS } from '@/features/events/constants';
import { formatMoney } from '@/pages/events/AddNeedOverlay';
import type { EventDetail } from '@/types/events';
import { TicketStatusBadge } from '@/features/events/TicketStatusBadge';

interface TicketsTiersDetailsProps {
  event: EventDetail;
  setEditingTicketId: (id: number | null) => void;
}

function getTicketIcon(index: number) {
  const icons = ['🎫', '🎟️', '💎', '⭐', '🌟', '✨', '🪩'];
  return icons[index % icons.length];
}

function getStatusPill(soldCount: number, capacity: number | null) {
  if (!capacity) {
    return {
      label: `${soldCount} sold`,
      bg: '#FAEEDA',
      color: '#704707',
    };
  }
  const pct = (soldCount / capacity) * 100;
  if (pct >= 100) {
    return { label: 'Sold out', bg: '#EAF3DE', color: '#3B6D11' };
  }
  if (pct >= 50) {
    return { label: `${soldCount}/${capacity}`, bg: '#E6F1FB', color: '#185FA5' };
  }
  return { label: `${soldCount}/${capacity}`, bg: '#FAEEDA', color: '#704707' };
}

export function TicketsTiersDetails({
  event,
  setEditingTicketId,
}: TicketsTiersDetailsProps) {
  const tiers = event.ticket_tiers ?? [];

  return (
    <Box sx={{ mx: 2.1, mt: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            color: '#888780',
          }}
        >
          All tickets
        </Typography>
        <Typography
          sx={{ fontSize: 12, color: '#D85A30', fontWeight: 500, cursor: 'pointer' }}
          onClick={() => setEditingTicketId(-1)}
        >
          + Add
        </Typography>
      </Box>

      <Box sx={{ background: '#fff', borderRadius: '14px', px: 1.5, py: 1.1 }}>
        {tiers.length === 0 ? (
          <Typography sx={{ fontSize: 13, color: 'var(--color-text-secondary)', py: 1.5 }}>
            No ticket tiers yet. Add one to start selling.
          </Typography>
        ) : (
          tiers.map((tier, index) => {
            const soldCount = tier.sold_count ?? 0;
            const status = getStatusPill(soldCount, tier.capacity);
            const icon = getTicketIcon(index);

            return (
              <Box
                key={tier.id ?? `tier-${index}`}
                onClick={() => setEditingTicketId(tier.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.1,
                  py: 1,
                  cursor: 'pointer',
                  borderTop: index === 0 ? 'none' : '0.5px solid #F0EDE8',
                }}
              >

                <Box sx={{ fontSize: 15, width: 52, textAlign: 'center', flexShrink: 0 }}>
                  <TicketStatusBadge
                    ticketCount={soldCount}
                    capacity={tier.capacity}
                    highlighted={false}
                    variant="large"
                    rightAligned={true}
                    userTicketCount={0}
                    sx={{
                      transform: 'none',
                      backgroundColor: TICKET_COLORS[index].light,
                    }}
                  />
                </Box>
                <Typography sx={{ fontSize: 13, color: '#1A1A1A', flex: 1, fontWeight: 500 }}>
                  {tier.name}
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#888780', mr: 0.5, whiteSpace: 'nowrap' }}>
                  {formatMoney(tier.price)}
                </Typography>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
