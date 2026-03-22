import { Box, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ManagingItem } from '@/pages/managing/MyUpcoming';
import { getCategoryTheme } from '@/features/events/CategoricalBackground';
import { formatShortDate, formatTime } from '@/utils/date';
import { NormalTicketManagementModal } from '@/pages/events/event-detail-v2/modules/variants/normal/components/NormalTicketManagementModal';

import { PseudoBarcode } from './PseudoBarcode';

interface ServiceTicketCardProps {
  item: ManagingItem;
}

export function ServiceTicketCard({ item }: ServiceTicketCardProps) {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const event = item.event;
  console.log(event?.user_tickets?.length, event?.user_tickets);
  if (!event || event.lifecycle_state == 'draft' || event.user_tickets?.length == 0) return null;

  const categoryTheme = getCategoryTheme(event.category);


  // Derive display values
  const userTickets = event.user_tickets ?? [];
  const ticketCount = userTickets.length;

  const tiersAndCount = useMemo(() => {
    const counts: Record<string, number> = {};
    userTickets.forEach((ticket) => {
      const tierName = event.ticket_tiers?.find(
        (tier) => String(tier.id) === String(ticket.tier_id),
      )?.name;
      if (tierName) {
        counts[tierName] = (counts[tierName] || 0) + 1;
      }
    });

    const y = Object.entries(counts)
      .map(([name, count]) => `${name} × ${count}`)
      .join('\n');
    return y;
  }, [userTickets, event.ticket_tiers]);

  const admittedCount = userTickets.filter((t) => t.status === 'used').length;
  const cancelledCount = userTickets.filter((t) => t.status === 'cancelled').length;

  const isAllCancelled = cancelledCount === ticketCount;


  const uniqueTierNames = useMemo(() => {
    const names = new Set<string>();
    userTickets.forEach((ticket) => {
      const tier_found = event.ticket_tiers?.find(
        (tier) => String(tier.id) === String(ticket.tier_id),
      );
      if (tier_found) {
        names.add(tier_found.name);
      }
    });
    return names;
  }, [userTickets, event.ticket_tiers]);


  const paidAmountNumber = userTickets.reduce(
    (total, ticket) => total + Number(ticket.price_paid ?? 0),
    0,
  );
  const paidAmount = paidAmountNumber > 0 ? `₹${paidAmountNumber}` : '₹0';
  const ticketCode =
    userTickets.length > 0
      ? (() => {
        const codes = userTickets
          .map((t) => (t.barcode != null ? String(t.barcode) : ''))
          .filter(Boolean);
        const primary = codes[0];
        if (!primary) {
          return `OG-${new Date(event.start_time).getFullYear()}-${event.title?.substring(0, 4).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`;
        }
        return codes.length > 1 ? `${primary} +${codes.length - 1}` : primary;
      })()
      : `OG-${new Date(event.start_time).getFullYear()}-${event.title?.substring(0, 4).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`;

  return (
    <Box
      sx={{
        position: 'relative',
        mb: 2,
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.10))',
        opacity: isAllCancelled ? 0.6 : 1
      }}
    >
      <Box
        sx={{
          background: '#fff',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* TOP BAND */}
        <Box sx={{ height: 6, width: '100%', background: categoryTheme.accent }} />
        {/* MAIN BODY */}
        <Box
          onClick={() => navigate(`/events-new/${event.id}`)}
          sx={{ p: '16px 18px 0', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0,0,0,0.01)' } }}
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>

            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: '#FAECE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                flexShrink: 0
              }}
            >
              {event.cover_image ? (
                <Box component="img" src={event.cover_image} sx={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
              ) : '🎵'}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 17,
                  fontWeight: 800,
                  color: '#1A1A1A',
                  lineHeight: 1.2,
                  mb: 0.4
                }}
              >
                {event.title}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#888780' }}>
                Hosted by {event.host?.first_name || 'Host'} · {event.location_name}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography sx={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#1A1A1A', lineHeight: 1 }}>
                {ticketCount}
              </Typography>
              <Typography sx={{ fontSize: 9, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {ticketCount === 1 ? 'ticket' : 'tickets'}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" sx={{ mb: 1.75 }}>
            {[
              { label: 'Date', val: formatShortDate(event.start_time) },
              { label: 'Time', val: formatTime(event.start_time) },
              { label: 'Tier', val: Array.from(uniqueTierNames).join(', ') },
              { label: 'Paid', val: paidAmount },
            ].map((detail, idx) => (
              <Box
                key={idx}
                sx={{
                  flex: 1,
                  borderRight: idx === 3 ? 'none' : '0.5px solid #F0EDE8',
                  pr: idx === 3 ? 0 : 1.25,
                  mr: idx === 3 ? 0 : 1.25
                }}
              >
                <Typography sx={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888780', mb: 0.4 }}>
                  {detail.label}
                </Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', lineHeight: 1.3 }}>
                  {detail.val}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* TEAR LINE */}
        <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', height: 18 }}>
          <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: '#F5F0EB', ml: -1.1 }} />
          <Box sx={{ flex: 1, borderTop: '2px dashed #E0DDD8', mx: 0.5 }} />
          <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: '#F5F0EB', mr: -1.1 }} />
        </Box>

        {/* TICKET STUB */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1.5}
          onClick={() => setIsModalOpen(true)}
          sx={{ p: '12px 18px 16px', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0,0,0,0.01)' } }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: 'Courier Prime, monospace',
                fontSize: 13,
                fontWeight: 700,
                color: '#1A1A1A',
                textTransform: 'uppercase',
                whiteSpace: 'pre-line',
                lineHeight: 1.1,
              }}
            >
              {tiersAndCount}
            </Typography>
            {/* <Typography sx={{ fontFamily: 'Courier Prime, monospace', fontSize: 11, color: '#888780' }}>
              {paidAmountNumber === 0 ? 'Free' : +''}
            </Typography> */}
          </Box>

          <Stack alignItems="flex-end" spacing={0.5}>
            <PseudoBarcode seed={event.id} />
            <Typography sx={{ fontFamily: 'Courier Prime, monospace', fontSize: 8, color: '#888780', letterSpacing: '0.08em' }}>
              {ticketCode}
            </Typography>
          </Stack>

          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: isAllCancelled ? '#888780' : '#D85A30',
              cursor: isAllCancelled ? 'default' : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {isAllCancelled ? 'View ›' : 'View details ›'}
          </Typography>
        </Stack>
      </Box>

      {/* STAMPS */}
      {(admittedCount > 0) && !isAllCancelled && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translate(-50%, -50%) rotate(-18deg)',
            border: '3px solid #1D9E75',
            borderRadius: '8px',
            px: 2.25,
            py: 0.75,
            color: '#1D9E75',
            fontFamily: 'Syne, sans-serif',
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
            opacity: 0.85,
            zIndex: 10,
            bgcolor: 'rgba(255,255,255,0.7)'
          }}
        >
          Admitted X {admittedCount}
        </Box>
      )}

      {cancelledCount > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-18deg)',
            border: '3px solid #E24B4A',
            borderRadius: '8px',
            px: 2.25,
            py: 0.75,
            color: '#E24B4A',
            fontFamily: 'Syne, sans-serif',
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
            opacity: 0.85,
            zIndex: 10,
            bgcolor: 'rgba(255,255,255,0.7)'
          }}
        >
          Cancelled X {cancelledCount}
        </Box>
      )}

      {/* TICKET MODAL */}
      <NormalTicketManagementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={event}
        tickets={event.user_tickets || []}
      />
    </Box>
  );
}
