import { Box, Button, Typography } from '@mui/material';
import { useMemo } from 'react';

import { PseudoBarcode } from './PseudoBarcode';

const THEME_ORANGE = '#D85A30';

const TIER_PALETTE = [
  { bg: '#EFF6FF', icon: '#3B82F6' },
  { bg: '#F5F3FF', icon: '#8B5CF6' },
  { bg: '#FFFBEB', icon: '#F59E0B' },
  { bg: '#ECFDF5', icon: '#10B981' },
];

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

export interface EventPurchasedTicketCardProps {
  event: any;
  /** Tickets for this tier only (same tier_id) */
  tierTickets: any[];
  ticketTiers: any[];
  onViewTicket: (ticketId: number) => void;
}

export function EventPurchasedTicketCard({
  event,
  tierTickets,
  ticketTiers,
  onViewTicket,
}: EventPurchasedTicketCardProps) {
  const validTickets = useMemo(
    () => (tierTickets || []).filter((t) => t.status !== 'cancelled'),
    [tierTickets],
  );

  const ticketsForDisplay =
    validTickets.length > 0 ? validTickets : tierTickets || [];

  const allCancelled =
    (tierTickets?.length ?? 0) > 0 && validTickets.length === 0;
  const allAdmitted =
    validTickets.length > 0 &&
    validTickets.every((t) => String(t.status || '').toLowerCase() === 'used');

  const primaryTicket = ticketsForDisplay[0];
  const tierIdx = useMemo(() => {
    if (!primaryTicket) return 0;
    const i = ticketTiers?.findIndex(
      (tt: any) => String(tt.id) === String(primaryTicket.tier_id),
    );
    return i !== undefined && i >= 0 ? i : 0;
  }, [primaryTicket, ticketTiers]);

  const { bg: stubPanelBg, icon: iconTint } = TIER_PALETTE[tierIdx % TIER_PALETTE.length];

  const tierLine = useMemo(() => {
    const t0 = ticketsForDisplay[0];
    if (!t0) return allCancelled ? 'Cancelled' : '—';
    const tier = ticketTiers?.find(
      (tt: any) => String(tt.id) === String(t0.tier_id),
    );
    return tier?.name || t0.ticket_type || 'Ticket';
  }, [ticketsForDisplay, ticketTiers, allCancelled]);

  const paidAmountNumber = Number(event.ticket_tiers[tierIdx]?.price);
  const isFree = paidAmountNumber <= 0 && ticketsForDisplay.length > 0;
  const priceLabel =
    ticketsForDisplay.length === 0
      ? '—'
      : isFree
        ? 'Free'
        : `₹${paidAmountNumber.toFixed(0)}`;

  const attendeeLine = useMemo(() => {
    const n = ticketsForDisplay.length;
    if (n === 0) return '—';
    const raw = primaryTicket?.guest_name?.trim();
    const name = raw || 'Guest';
    if (n <= 1) return name;
    return `${name} +${n - 1} others`;
  }, [ticketsForDisplay.length, primaryTicket?.guest_name]);

  const barcodeSeed = useMemo(() => {
    const base = Number(event?.id) || 0;
    const salt = ticketsForDisplay.reduce((n, t) => n + Number(t.id || 0), 0);
    return base + salt;
  }, [event?.id, ticketsForDisplay]);

  const ticketCode = useMemo(() => {
    if (ticketsForDisplay.length > 0) {
      const codes = ticketsForDisplay
        .map((t) => (t.barcode != null ? String(t.barcode) : ''))
        .filter(Boolean);
      const primary = codes[0];
      if (primary) {
        return codes.length > 1 ? `${primary} +${codes.length - 1}` : primary;
      }
    }
    const year = new Date(event?.start_time).getFullYear() || new Date().getFullYear();
    const titlePart = event?.title?.substring(0, 4).toUpperCase() || 'EVNT';
    return `OG-${year}-${titlePart}-${String(barcodeSeed).slice(-4)}`;
  }, [ticketsForDisplay, event?.start_time, event?.title, barcodeSeed]);

  const canOpenTicket = Boolean(primaryTicket);

  const handleOpenTicket = () => {
    if (primaryTicket) onViewTicket(primaryTicket.id);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        mb: 0,
        overflow: 'hidden',
        bgcolor: '#fff',
        border: '0.5px solid #eceae6',
        boxShadow: '0 1px 2px rgb(176, 167, 156)',
        opacity: allCancelled ? 0.72 : 1,
        filter: allCancelled ? 'grayscale(0.35)' : 'none',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 0,
          minHeight: 96,
        }}
      >
        {/* Left stub — color + price (same orientation as SimpleEventTierCard) */}
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

        {/* Main body */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            px: 1.5,
            py: 1.25,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: '#888780',
                textTransform: 'uppercase',
                mb: 0.35,
              }}
            >
              Tier
            </Typography>
            <Typography
              noWrap
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 15,
                fontWeight: 700,
                color: allCancelled ? '#888780' : '#1A1A1A',
                lineHeight: 1.25,
                mb: 1,
              }}
            >
              {tierLine} <span style={{ fontSize: 20, fontWeight: 500, color: '#4b5563' }}>X {ticketsForDisplay.length}</span>
            </Typography>
            <Typography
              noWrap
              sx={{
                fontSize: 13,
                fontWeight: 500,
                color: '#4b5563',
              }}
            >
              {attendeeLine}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 0.75,
              flexShrink: 0,
            }}
          >
            <PseudoBarcode seed={barcodeSeed} />
            <Typography
              sx={{
                fontFamily: 'Courier Prime, monospace',
                fontSize: 7,
                color: '#888780',
                letterSpacing: '0.06em',
                maxWidth: 112,
                textAlign: 'right',
                wordBreak: 'break-all',
                lineHeight: 1.2,
              }}
            >
              {ticketCode}
            </Typography>
            <Button
              variant="text"
              size="small"
              disabled={!canOpenTicket}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenTicket();
              }}
              sx={{
                textTransform: 'none',
                fontSize: 12,
                fontWeight: 600,
                color: allCancelled ? '#888780' : THEME_ORANGE,
                minWidth: 0,
                px: 0,
                py: 0.25,
                '&:hover': { bgcolor: 'transparent', opacity: 0.8 },
              }}
            >
              {allCancelled ? 'View ›' : 'View details'}
            </Button>
          </Box>
        </Box>
      </Box>

      {allAdmitted && !allCancelled && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-14deg)',
            border: '3px solid #1D9E75',
            borderRadius: '8px',
            px: 2,
            py: 0.65,
            color: '#1D9E75',
            fontFamily: 'Syne, sans-serif',
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
            opacity: 0.78,
            zIndex: 10,
            bgcolor: 'rgba(255,255,255,0.72)',
          }}
        >
          Admitted
        </Box>
      )}

      {allCancelled && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-14deg)',
            border: '3px solid #E24B4A',
            borderRadius: '8px',
            px: 2,
            py: 0.65,
            color: '#E24B4A',
            fontFamily: 'Syne, sans-serif',
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
            opacity: 0.78,
            zIndex: 10,
            bgcolor: 'rgba(255,255,255,0.72)',
          }}
        >
          Cancelled
        </Box>
      )}
    </Box>
  );
}
