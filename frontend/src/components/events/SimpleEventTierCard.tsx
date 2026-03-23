import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { TermsDialog } from '@/pages/events/components/TermsDialog';

const THEME_ORANGE = '#D85A30';

const TicketGlyph = ({ color }: { color: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
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

function TierQuantityStepper({
  value,
  onIncrement,
  onDecrement,
}: {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
          fontWeight: 600,
          minWidth: 14,
          textAlign: 'center',
          color: '#1A1A1A',
          fontFamily: 'Syne, sans-serif',
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
}

export interface SimpleEventTierCardProps {
  tierName: string;
  priceLabel: string;
  isFree: boolean;
  isSoldOut: boolean;
  isInfiniteTier: boolean;
  leftCount: number | null;
  salesEndDate?: string | null;
  showContributorHint?: boolean;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  /** Top accent stripe (tier / category tone) */
  accentColor: string;
  /** Icon color on stub panel */
  iconTint: string;
  /** Stub panel background */
  stubPanelBg: string;
  /** Per-unit price for line total (0 when free) */
  unitPrice: number;
  onBuy: (quantity: number) => void;
  onOneClickBuy: (quantity: number) => void;
  isLoading?: boolean;
  disabled?: boolean;
  clearTicketformTrigger?: number;
}

/**
 * Minimal event-detail tier row: ServiceTicketCard-inspired shell (white, soft edge, top accent)
 * with TicketStub-style admit/price column, quantity stepper, terms, and buy actions.
 */
export function SimpleEventTierCard({
  tierName,
  priceLabel,
  isFree,
  isSoldOut,
  isInfiniteTier,
  leftCount,
  salesEndDate,
  showContributorHint,
  quantity,
  onIncrement,
  onDecrement,
  accentColor,
  iconTint,
  stubPanelBg,
  unitPrice,
  onBuy,
  onOneClickBuy,
  isLoading = false,
  disabled = false,
  clearTicketformTrigger,
}: SimpleEventTierCardProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  useEffect(() => {
    if (clearTicketformTrigger) {
      setTermsAccepted(false);
    }
  }, [clearTicketformTrigger]);

  const numericUnit = Number(unitPrice) || 0;
  const lineTotal =
    isFree || numericUnit === 0
      ? 'Free'
      : `₹${(numericUnit * quantity).toFixed(0)}`;

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#fff',
        border: '0.5px solid #eceae6',
        boxShadow: '0 1px 2px rgb(176, 167, 156)',
        opacity: isSoldOut ? 0.45 : 1,
        filter: isSoldOut ? 'grayscale(1)' : 'none',
        pointerEvents: isSoldOut ? 'none' : 'auto',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 0,
          minHeight: 72,
        }}
      >
        {/* Stub column — ADMIT ONE + price (TicketStub semantics), toned down */}
        <Box
          sx={{
            width: 96,
            minWidth: 96,
            px: 1.25,
            py: 1.25,
            bgcolor: stubPanelBg,
            borderRight: '3px dashed rgb(176, 167, 156)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
          }}
        >
          <TicketGlyph color={iconTint} />
          <Typography
            sx={{
              fontSize: 8,
              fontWeight: 600,
              letterSpacing: '0.07em',
              color: '#888780',
              textTransform: 'uppercase',
            }}
          >
            ADMIT ONE
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 15,
              fontWeight: 800,
              color: isFree ? '#1D9E75' : '#D85A30',
              lineHeight: 1.1,
            }}
          >
            {priceLabel}
          </Typography>
        </Box>

        {/* Body */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            px: 1.25,
            py: 1.15,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 14,
                fontWeight: 700,
                color: '#1A1A1A',
                lineHeight: 1.2,
                mb: 0.35,
              }}
            >
              {tierName}
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
              {salesEndDate && (
                <>
                  <Typography sx={{ fontSize: 10, color: '#9ca3af' }}>·</Typography>
                  <Typography sx={{ fontSize: 10, color: '#6b7280' }}>
                    Ends{' '}
                    {new Date(salesEndDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Typography>
                </>
              )}
            </Box>
            {showContributorHint && (
              <Typography
                sx={{ fontSize: 9, color: '#b45309', mt: 0.4, fontWeight: 500 }}
              >
                Chip in and get in free
              </Typography>
            )}
          </Box>

          {!isSoldOut && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexShrink: 0,
              }}
            >
              <TierQuantityStepper
                value={quantity}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
              />
            </Box>
          )}
        </Box>
      </Box>

      {!isSoldOut && quantity > 0 && (
        <Box
          sx={{
            px: 1.5,
            pb: 1.5,
            pt: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e8e4df',
              pt: 1.25,
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: '#6b7280',
              }}
            >
              Total
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 16,
                fontWeight: 800,
                color: lineTotal === 'Free' ? '#1D9E75' : '#1A1A1A',
              }}
            >
              {lineTotal}
            </Typography>
          </Box>

          <FormControlLabel
            sx={{
              alignItems: 'flex-start',
              m: 0,
              gap: 0.75,
              '& .MuiTypography-root': {
                fontSize: '0.7rem',
                color: 'text.secondary',
                lineHeight: 1.35,
              },
            }}
            control={
              <Checkbox
                size="small"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                sx={{ p: 0, pt: 0.25 }}
              />
            }
            label={
              <Typography variant="caption" component="span">
                I accept the{' '}
                <Box
                  component="span"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsTermsOpen(true);
                  }}
                  sx={{ textDecoration: 'underline', cursor: 'pointer' }}
                >
                  terms & conditions
                </Box>
              </Typography>
            }
          />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              fullWidth
              variant="contained"
              size="small"
              onClick={() => onBuy(quantity)}
              disabled={disabled || isSoldOut || isLoading || !termsAccepted}
              sx={{
                borderRadius: '10px',
                bgcolor: '#D85A30',
                fontSize: '0.7rem',
                fontWeight: 700,
                py: 1,
                textTransform: 'none',
                fontFamily: 'Syne, sans-serif',
                '&:hover': { bgcolor: '#000', opacity: 0.92 },
              }}
            >
              {isLoading ? '…' : `BUY ${quantity} TICKET${quantity > 1 ? 'S' : ''}`}
            </Button>
          </Box>
        </Box>
      )}

      <TermsDialog isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </Box>
  );
}
