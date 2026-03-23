import { Box, Button, Typography } from '@mui/material';
import { useState } from 'react';

import { SimpleEventTierCard } from '@/components/events/SimpleEventTierCard';

import { useEventDetailV2 } from '../../context';

interface NormalTicketsModuleProps {
  className?: string;
}

const THEME_ORANGE = '#D85A30';

export function NormalTicketsModule({ className }: NormalTicketsModuleProps) {
  const {
    event,
    handleBuyTicket,
    handleOneClickBuy,
    purchaseTicket,
    clearTicketformTrigger,
    onViewTicket,
    capabilities,
  } = useEventDetailV2();
  const tiers = event.ticket_tiers || [];
  const hasPurchased = event.user_tickets && event.user_tickets.length > 0;
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const handleUpdateQty = (tierId: number, delta: number, max: number) => {
    setQuantities((prev) => {
      const current = prev[tierId] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      if (next > 0) {
        return { [tierId]: next };
      }
      const { [tierId]: _, ...rest } = prev;
      return rest;
    });
  };

  if (tiers.length === 0 && !hasPurchased) return null;

  const isEventActive = capabilities.canBuyTickets;

  if (!isEventActive && !hasPurchased) {
    return (
      <Box sx={{ px: 2, pt: 2 }}>
        <Typography
          sx={{
            fontSize: 14,
            color: 'var(--color-text-secondary, #6b7280)',
            textAlign: 'center',
            py: 2,
          }}
        >
          {event.lifecycle_state === 'live' ? 'Event is live!' : 
          event.lifecycle_state == 'draft' ? 'This event is in DRAFT mode, only visible to the host' : 
          'This event has ended'
          }
        </Typography>
      </Box>
    );
  }

  const getTierColors = (index: number) => {
    const palette = [
      { bg: '#EFF6FF', icon: '#3B82F6' }, // Blue
      { bg: '#F5F3FF', icon: '#8B5CF6' }, // Purple
      { bg: '#FFFBEB', icon: '#F59E0B' }, // Yellow/Amber
      { bg: '#ECFDF5', icon: '#10B981' }, // Green
    ];
    return palette[index % palette.length];
  };

  return (
    <Box sx={{ px: 2, pt: 2, pb: 4,
      backgroundColor: 'rgba(237, 232, 226, 0.3)',
     }}>

<Box sx={{ mb: 1.5 }}>
        <Typography
          sx={{
            fontFamily: '"Syne", sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--color-text-primary, #111)',
            mb: 0.5,
          }}
        >
         Get Your Tickets
        </Typography>
        <Typography
          sx={{ fontSize: 12, color: 'var(--color-text-secondary, #6b7280)' }}
        >
          Save your spot, get your tickets now.
        </Typography>
      </Box>

      {capabilities.showTicketPurchase  && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {tiers.map((tier: any, idx: number) => {
            const soldCount = tier.sold_count || 0;
            const rawTierCapacity = tier.capacity;
            // Treat missing/0 tier capacity as "infinite" (no cap).
            const isInfiniteTier = rawTierCapacity == null || Number(rawTierCapacity) <= 0;

            const tierCapacity = isInfiniteTier ? null : Number(rawTierCapacity);
            const isSoldOut = isInfiniteTier
              ? false
              : Boolean(tier.sold_out) || (tierCapacity ?? 0) <= soldCount;
            const price =
              tier.price === 0 || tier.price === '0' || tier.price === 'Free'
                ? 'Free'
                : `₹${Number(tier.price).toFixed(0)}`;
            const isFree = price === 'Free';
            const { bg, icon } = getTierColors(idx);
            const currentQty = quantities[tier.id] || 0;
            const leftCount = tierCapacity != null ? Math.max(tierCapacity - soldCount, 0) : null;

            return (
              <SimpleEventTierCard
                key={tier.id}
                tierName={tier.name}
                priceLabel={price}
                isFree={isFree}
                isSoldOut={isSoldOut}
                isInfiniteTier={isInfiniteTier}
                leftCount={leftCount}
                salesEndDate={tier.sales_end_date}
                showContributorHint={tier.name?.toLowerCase().includes('contributor')}
                quantity={currentQty}
                onIncrement={() =>
                  handleUpdateQty(
                    tier.id,
                    1,
                    isInfiniteTier ? 999 : Math.min(leftCount ?? 0, 10),
                  )
                }
                onDecrement={() => handleUpdateQty(tier.id, -1, isInfiniteTier ? 999 : 10)}
                accentColor={icon}
                iconTint={icon}
                stubPanelBg={bg}
                unitPrice={Number(tier.price) || 0}
                onBuy={(qty) => handleBuyTicket(tier.id, qty)}
                onOneClickBuy={(qty) => handleOneClickBuy(tier.id, qty)}
                isLoading={purchaseTicket.isPending}
                disabled={!isEventActive}
                clearTicketformTrigger={clearTicketformTrigger}
              />
            );
          })}
        </Box>
      )}
    </Box>
  );
}
