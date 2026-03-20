import { Box, Typography } from '@mui/material';
import { Ticket } from 'lucide-react';

import { TICKET_COLORS } from '@/features/events/constants';
import { formatMoney } from '@/pages/events/AddNeedOverlay';
import type { EventDetail } from '@/types/events';

interface TicketsTiersDetailsProps {
  event: EventDetail;
  setEditingTicketId: (id: number | null) => void;
}

function getTierReadiness(soldCount: number, capacity: number | null) {
  const hasCapacity = capacity != null && capacity > 0;
  const minRequired = hasCapacity ? Math.ceil(capacity * 0.2) : 1;
  const isReady = soldCount >= minRequired;
  return { hasCapacity, minRequired, isReady };
}

function TierSalesIndicator({
  soldCount,
  capacity,
  colorIndex,
}: {
  soldCount: number;
  capacity: number | null;
  colorIndex: number;
}) {
  const tint = TICKET_COLORS[colorIndex % TICKET_COLORS.length].light;
  const { hasCapacity, minRequired, isReady } = getTierReadiness(soldCount, capacity);
  const soldLabel = hasCapacity ? `${soldCount}/${capacity}` : `${soldCount}/∞`;
  const requirementLabel = hasCapacity ? `Min ${minRequired} (${Math.round((minRequired / Number(capacity)) * 100)}%)` : 'Min 1';

  return (
    <Box
      sx={{
        minWidth: 92,
        px: 1.05,
        py: 0.55,
        borderRadius: '7px',
        border: '1px dashed #C9C4BA',
        bgcolor: tint,
        boxShadow: '1px 1px 3px rgba(0,0,0,0.08)',
        transform: 'rotate(-2deg)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.7,
      }}
    >
      <Ticket size={12} color="#1A1A1A" />
      <Box>
        <Typography
          sx={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#1A1A1A',
            fontFamily: '"Caveat", cursive',
            letterSpacing: '0.35px',
            lineHeight: 1.05,
          }}
        >
          {soldLabel}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.63rem',
            mt: 0.1,
            fontWeight: 700,
            color: isReady ? '#3B6D11' : '#704707',
            fontFamily: '"Caveat", cursive',
            letterSpacing: '0.3px',
            lineHeight: 1.05,
            whiteSpace: 'nowrap',
          }}
        >
          {isReady ? 'Ready' : requirementLabel}
        </Typography>
      </Box>
    </Box>
  );
}

export function TicketsTiersDetails({
  event,
  setEditingTicketId,
}: TicketsTiersDetailsProps) {
  const tiers = event.ticket_tiers ?? [];

  return (
    <Box sx={{ mx: 1.75, mt: 1.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            color: '#888780',
            pl: 0.25,
          }}
        >
          Ticket tiers
        </Typography>
        <Typography
          sx={{ fontSize: 12, color: '#D85A30', fontWeight: 500, cursor: 'pointer' }}
          onClick={() => setEditingTicketId(-1)}
        >
          + Add Ticket Tier
        </Typography>
      </Box>

      <Box
        sx={{
          background: '#fff',
          borderRadius: '14px',
          px: 1.75,
          py: 1.5,
          border: '0.5px solid #F0EDE8',
        }}
      >
        {tiers.length === 0 ? (
          <Typography sx={{ fontSize: 13, color: 'var(--color-text-secondary)', py: 1.5 }}>
            No ticket tiers yet. Add one to start selling.
          </Typography>
        ) : (
          tiers.map((tier, index) => {
            const soldCount = tier.sold_count ?? 0;

            return (
              <Box
                key={tier.id ?? `tier-${index}`}
                onClick={() => setEditingTicketId(tier.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  py: 1.15,
                  cursor: 'pointer',
                  borderTop: index === 0 ? 'none' : '0.5px solid #F0EDE8',
                  '&:hover': {
                    '& .tier-title': { color: '#D85A30' },
                  },
                }}
              >
                <Box
                  sx={{
                    minWidth: 72,
                    flexShrink: 0,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <TierSalesIndicator
                    soldCount={soldCount}
                    capacity={tier.capacity ?? null}
                    colorIndex={index}
                  />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    className="tier-title"
                    sx={{
                      fontSize: 13,
                      color: '#1A1A1A',
                      fontWeight: 500,
                      transition: 'color 0.2s',
                      lineHeight: 1.35,
                    }}
                  >
                    {tier.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: '#888780',
                      mt: 0.25,
                      lineHeight: 1.3,
                    }}
                  >
                    Capacity: {tier.capacity == null ? 'Unlimited' : tier.capacity}
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#1A1A1A',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    ml: 1,
                  }}
                >
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
