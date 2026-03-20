import { Box, Button, Typography } from '@mui/material';
import { useState } from 'react';

import { useEventDetailV2 } from '../../context';
import { PurchasedTicketsModule } from './PurchasedTicketsModule';

interface NormalTicketsModuleProps {
  className?: string;
}

const TicketIcon = ({ color }: { color: string }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22 10V6C22 4.89543 21.1046 4 20 4H4C2.89543 4 2 4.89543 2 6V10C3.10457 10 4 10.8954 4 12C4 13.1046 3.10457 14 2 14V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V14C20.8954 14 20 13.1046 20 12C20 10.8954 20.8954 10 22 10Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M15 4V20" stroke={color} strokeWidth="2" strokeDasharray="2 2" />
  </svg>
);

const THEME_ORANGE = '#D85A30';

const Stepper = ({
  value,
  onIncrement,
  onDecrement,
}: {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Button
      onClick={(e) => {
        e.stopPropagation();
        onDecrement();
      }}
      disabled={value === 0}
      sx={{
        minWidth: 24,
        width: 24,
        height: 24,
        p: 0,
        bgcolor: THEME_ORANGE,
        color: '#fff',
        borderRadius: '7px',
        '&:hover': { opacity: 0.9, bgcolor: THEME_ORANGE },
        '&.Mui-disabled': { bgcolor: '#f3f4f6', color: '#9ca3af' },
        fontSize: 16,
        lineHeight: 1,
      }}
    >
      −
    </Button>
    <Typography
      sx={{
        fontSize: 12,
        fontWeight: 500,
        minWidth: 12,
        textAlign: 'center',
        color: '#000',
      }}
    >
      {value}
    </Typography>
    <Button
      onClick={(e) => {
        e.stopPropagation();
        onIncrement();
      }}
      sx={{
        minWidth: 24,
        width: 24,
        height: 24,
        p: 0,
        bgcolor: THEME_ORANGE,
        color: '#fff',
        borderRadius: '7px',
        '&:hover': { opacity: 0.9, bgcolor: THEME_ORANGE },
        fontSize: 16,
        lineHeight: 1,
      }}
    >
      +
    </Button>
  </Box>
);

export function NormalTicketsModule({ className }: NormalTicketsModuleProps) {
  const { event, handleBuyMultiple, onViewTicket, capabilities } = useEventDetailV2();
  const tiers = event.ticket_tiers || [];
  const hasPurchased = event.user_tickets && event.user_tickets.length > 0;
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [showStubs, setShowStubs] = useState(!hasPurchased);

  const handleUpdateQty = (tierId: number, delta: number, max: number) => {
    setQuantities((prev) => {
      const current = prev[tierId] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [tierId]: next };
    });
  };

  const totalQuantity = Object.values(quantities).reduce((a, b) => a + b, 0);

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
          {event.lifecycle_state === 'live' ? 'Event is live!' : 'This event has ended'}
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
    <Box sx={{ px: 2, pt: 2, pb: 4 }}>
      <Typography
        sx={{
          fontFamily: '"Syne", sans-serif',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-text-primary, #111)',
          mb: 2,
          letterSpacing: '0.01em',
        }}
      >
        Tickets
      </Typography>

      {hasPurchased && (
        <Box sx={{ mb: 3 }}>
          <PurchasedTicketsModule
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
                {showStubs ? 'Hide ticket options' : 'Buy more tickets'}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {capabilities.showTicketPurchase && (!hasPurchased || showStubs) && (
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
                : `₹${tier.price}`;
            const isFree = price === 'Free';
            const { bg, icon } = getTierColors(idx);
            const currentQty = quantities[tier.id] || 0;
            const leftCount = tierCapacity != null ? Math.max(tierCapacity - soldCount, 0) : null;

            return (
              <Box
                key={tier.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: '12px',
                  bgcolor: '#fff',
                  borderRadius: '14px',
                  border: '0.5px solid #e5e7eb',
                  opacity: isSoldOut ? 0.4 : 1,
                  filter: isSoldOut ? 'grayscale(1)' : 'none',
                  pointerEvents: isSoldOut ? 'none' : 'auto',
                  position: 'relative',
                }}
              >
                {/* Thumbnail */}
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    minWidth: 46,
                    borderRadius: '10px',
                    bgcolor: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.05)' },
                  }}
                >
                  <TicketIcon color={icon} />
                </Box>

                {/* Middle Section */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    noWrap
                    sx={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#000',
                      lineHeight: 1.2,
                      mb: 0.25,
                    }}
                  >
                    {tier.name}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 10,
                        color: isSoldOut ? '#ef4444' : '#6b7280',
                        fontWeight: 400,
                      }}
                    >
                      {isSoldOut ? 'Sold out' : isInfiniteTier ? 'Unlimited' : `${leftCount} left`}
                    </Typography>
                    {tier.sales_end_date && (
                      <>
                        <Typography sx={{ fontSize: 10, color: '#9ca3af' }}>
                          ·
                        </Typography>
                        <Typography sx={{ fontSize: 10, color: '#6b7280' }}>
                          Ends{' '}
                          {new Date(tier.sales_end_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Typography>
                      </>
                    )}
                  </Box>
                  {tier.name?.toLowerCase().includes('contributor') && (
                    <Typography
                      sx={{ fontSize: 9, color: '#b45309', mt: 0.5, fontWeight: 500 }}
                    >
                      Chip in and get in free
                    </Typography>
                  )}
                </Box>

                {/* Right Column */}
                {!isSoldOut && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 0.5,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 18,
                        fontWeight: 500,
                        color: isFree ? '#1D9E75' : '#D85A30',
                        lineHeight: 1,
                      }}
                    >
                      {price}
                    </Typography>
                    <Stepper
                      value={currentQty}
                      onIncrement={() =>
                        handleUpdateQty(
                          tier.id,
                          1,
                          isInfiniteTier ? 999 : Math.min(leftCount ?? 0, 10),
                        )
                      }
                      onDecrement={() => handleUpdateQty(tier.id, -1, isInfiniteTier ? 999 : 10)}
                    />
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* Get Ticket Button - Static at the bottom of the list */}
      {capabilities.showTicketPurchase && (!hasPurchased || showStubs) && (
        <Box sx={{ mt: 3 }}>
          <Button
            fullWidth
            disabled={totalQuantity === 0}
            onClick={() => {
              const selections = Object.entries(quantities)
                .filter(([_, qty]) => qty > 0)
                .map(([tierId, qty]) => ({ tierId: Number(tierId), quantity: qty }));
              handleBuyMultiple(selections);
            }}
            sx={{
              fontFamily: '"Syne", sans-serif',
              fontSize: 15,
              fontWeight: 700,
              py: 1.75,
              borderRadius: '12px',
              bgcolor: THEME_ORANGE,
              color: '#fff',
              textTransform: 'none',
              '&:hover': {
                bgcolor: THEME_ORANGE,
                opacity: 0.9,
              },
              '&.Mui-disabled': {
                bgcolor: '#f3f4f6',
                color: '#9ca3af',
                border: '1px solid #e1e4e8',
              },
            }}
          >
            {totalQuantity > 0
              ? `Get ${totalQuantity} ticket${totalQuantity > 1 ? 's' : ''}`
              : 'Get ticket'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
