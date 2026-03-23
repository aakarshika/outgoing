import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Typography,
  Stack,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Share,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';

import { useCancelTicket, useUpdateTicket } from '@/features/events/hooks';
import { getCategoryTheme } from '@/features/events/CategoricalBackground';
import { formatShortDate, formatTime } from '@/utils/date';
import { exportTicketAsPDF, shareTicket } from '@/features/events/utils/ticketSharing';
import { DottedQrCode } from '@/components/events/DottedQrCode';
import { TicketTier } from '@/pages/events/components/manage-redesign/TicketsAndCapacityForm';

interface NormalTicketManagementModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  tickets: any[];
  initialIndex?: number;
}

export function NormalTicketManagementModal({
  event,
  isOpen,
  onClose,
  tickets,
  initialIndex = 0,
}: NormalTicketManagementModalProps) {
  const updateTicket = useUpdateTicket();
  const cancelTicket = useCancelTicket();

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [guestName, setGuestName] = useState('');
  const [isInlineEditing, setIsInlineEditing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex(initialIndex);
  }, [isOpen, initialIndex]);

  const a = tickets?.[activeIndex];
  const t = event.ticket_tiers?.find((tier: TicketTier) => String(tier.id) === String(a?.tier_id));
  // Tier first, then ticket — so purchase id / guest fields win (spreading tier after ticket overwrote id with tier_id).
  const currentTicket = { ...t, ...a };

  useEffect(() => {
    setGuestName(currentTicket?.guest_name || '');
    setIsInlineEditing(false);
  }, [currentTicket?.id, currentTicket?.guest_name]);

  const qrValue = currentTicket?.qr_token || currentTicket?.barcode || '';
  
  const ticketCode = useMemo(() => {
    if (!currentTicket) return '';
    if (currentTicket.barcode) return currentTicket.barcode;
    const year = new Date(event?.start_time).getFullYear() || 2024;
    const titlePart = event?.title?.substring(0, 4).toUpperCase() || 'EVNT';
    const randomPart = Math.floor(Math.random() * 9000) + 1000;
    return `OG-${year}-${titlePart}-${randomPart}`;
  }, [currentTicket?.id, event?.start_time, event?.title]);

  if (!isOpen || !tickets?.length || !currentTicket) return null;

  const categoryTheme = getCategoryTheme(event?.category);
  const isCancelled = currentTicket.status === 'cancelled';

  const handleSaveName = () => {
    updateTicket.mutate(
      { ticketId: currentTicket.id, guestName },
      {
        onSuccess: () => {
          toast.success('Guest name updated');
          setIsInlineEditing(false);
          currentTicket.guest_name = guestName;
        },
        onError: () => toast.error('Failed to update guest name'),
      },
    );
  };

  const handleCancelTicket = () => {
    if (!confirm('Cancel this ticket?')) return;
    cancelTicket.mutate(currentTicket.id, {
      onSuccess: () => toast.success('Ticket cancelled'),
      onError: (err: any) =>
        toast.error(err?.response?.data?.message || 'Failed to cancel ticket'),
    });
  };

  const handleExport = () => {
    if (!event || !currentTicket) return;
    exportTicketAsPDF({ event, ticket: currentTicket, ticketTiers: [] });
  };

  const handleShare = () => {
    if (!event || !currentTicket) return;
    shareTicket({ event, ticket: currentTicket, ticketTiers: [] });
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth
      slotProps={{
        paper: {
          sx: {
            position: 'fixed',
            bottom: 0,
            m: 0,
            borderRadius: '24px 24px 0 0',
            bgcolor: '#F5F0EB',
            width: '100%',
            pb: 14
          }
        }
      }}
    >
      <DialogContent sx={{ p: 0, '&:first-of-type': { pt: 0 } }}>
        {/* HANDLE */}
        <Box sx={{ width: 36, height: 4, bgcolor: '#D3D1C7', borderRadius: 999, mx: 'auto', mt: 1.5 }} />

        {/* TOP BAR */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1.75, pb: 1 }}>
          <IconButton 
            onClick={onClose}
            sx={{ width: 28, height: 28, bgcolor: '#E0DDD8', '&:hover': { bgcolor: '#D3D1C7' } }}
          >
            <X size={14} color="#666" />
          </IconButton>

          {tickets.length > 1 && (
            <Stack direction="row" spacing={1.25} alignItems="center">
              <IconButton
                size="small"
                onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeIndex === 0}
                sx={{ width: 28, height: 28, bgcolor: '#E0DDD8', '&:hover': { bgcolor: '#D3D1C7' }, '&:disabled': { opacity: 0.3 } }}
              >
                <ChevronLeft size={18} color="#1A1A1A" />
              </IconButton>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A', minWidth: 60, textAlign: 'center' }}>
                {activeIndex + 1} of {tickets.length}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setActiveIndex((prev) => Math.min(tickets.length - 1, prev + 1))}
                disabled={activeIndex >= tickets.length - 1}
                sx={{ width: 28, height: 28, bgcolor: '#E0DDD8', '&:hover': { bgcolor: '#D3D1C7' }, '&:disabled': { opacity: 0.3 } }}
              >
                <ChevronRight size={18} color="#1A1A1A" />
              </IconButton>
            </Stack>
          )}
          <Box sx={{ width: 28 }} />
        </Box>

        {/* TICKET WRAP */}
        <Box sx={{ px: 2, py: 1 }}>
          <Box
            sx={{
              background: '#fff',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
              opacity: isCancelled ? 0.6 : 1
            }}
          >
            <Box sx={{ height: 8, bgcolor: categoryTheme.accent }} />
            <Box sx={{ p: '22px 22px 0' }}>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#1A1A1A',
                  lineHeight: 1.2,
                  mb: 0.25
                }}
              >
                {event?.title}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#888780', mb: 1.75 }}>
                Hosted by {event?.host?.first_name || 'Host'} · {event?.location_name}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', gap: 1.25, mb: 1.75 }}>
                {[
                  { label: 'Date', val: formatShortDate(event?.start_time) },
                  { label: 'Tier', val: currentTicket.name },
                  { label: 'Time', val: formatTime(event?.start_time) },
                  { label: 'Price', val: currentTicket.price === 0 ? 'Free' : `₹${currentTicket.price}` },
                ].map((detail, idx) => (
                  <Box key={idx} sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888780', mb: 0.4 }}>
                      {detail.label}
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>
                      {detail.val}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ bgcolor: '#F5F0EB', borderRadius: '10px', p: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888780', mb: 0.4 }}>
                    Guest name
                  </Typography>
                  {isInlineEditing ? (
                    <TextField
                      variant="standard"
                      size="small"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      onBlur={() => {
                        if (guestName === currentTicket.guest_name) setIsInlineEditing(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') {
                          setIsInlineEditing(false);
                          setGuestName(currentTicket.guest_name || '');
                        }
                      }}
                      autoFocus
                      InputProps={{ disableUnderline: false, sx: { fontSize: 14, fontWeight: 500, pb: 0.5 } }}
                      sx={{ width: '100%' }}
                    />
                  ) : (
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A' }}>
                      {guestName || 'Add Guest Name'}
                    </Typography>
                  )}
                </Box>
                <Typography 
                  onClick={() => isInlineEditing ? handleSaveName() : setIsInlineEditing(true)}
                  sx={{ fontSize: 11, color: categoryTheme.accent, fontWeight: 500, cursor: 'pointer', ml: 1 }}
                >
                  {isInlineEditing ? 'Save' : 'Edit ✎'}
                </Typography>
              </Box>
            </Box>

            {/* TEAR */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.75 }}>
              <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#F5F0EB', ml: -1.25, flexShrink: 0 }} />
              <Box sx={{ flex: 1, borderTop: '2px dashed #E8E5E0', mx: 0.5 }} />
              <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#F5F0EB', mr: -1.25, flexShrink: 0 }} />
            </Box>

            {/* STUB */}
            <Box sx={{ p: '18px 22px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.25 }}>
              <Typography sx={{ fontFamily: '"Courier Prime", monospace', fontSize: 11, fontWeight: 700, color: '#1A1A1A', textAlign: 'center', textTransform: 'uppercase' }}>
                {currentTicket.ticket_type} · Ticket {activeIndex + 1} of {tickets.length}
              </Typography>
              
              <Box sx={{ borderRadius: '14px', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                {qrValue ? (
                  <DottedQrCode value={qrValue} 
                  size={200} 
                  bgColor="#1A1A1A" 
                  fgColor={categoryTheme.accent} errorCorrectionLevel="M" />
                ) : (
                  <Box sx={{ width: 130, height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: '1px dashed #333' }}>
                    QR PENDING
                  </Box>
                )}
                <Typography sx={{ fontFamily: '"Courier Prime", monospace', fontSize: 9, color: '#666', letterSpacing: '0.1em' }}>
                  {ticketCode}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ACTIONS */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, px: 2, mt: 1 }}>
          <Button
            onClick={handleShare}
            fullWidth
            sx={{ 
              gridColumn: 'span 2', 
              bgcolor: categoryTheme.accent, 
              color: '#fff', 
              borderRadius: '12px', 
              py: 1.5, 
              fontSize: 13, 
              fontWeight: 500, 
              textTransform: 'none',
              '&:hover': { bgcolor: categoryTheme.accent, opacity: 0.9 }
            }}
            startIcon={<Share size={14} />}
          >
            Share ticket
          </Button>
          <Button
            onClick={handleExport}
            sx={{ 
              bgcolor: '#fff', 
              color: '#1A1A1A', 
              border: '0.5px solid #D3D1C7', 
              borderRadius: '12px', 
              py: 1.5, 
              fontSize: 13, 
              fontWeight: 500, 
              textTransform: 'none',
              '&:hover': { bgcolor: '#F9F9F9' }
            }}
            startIcon={<Download size={14} />}
          >
            Export PDF
          </Button>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(ticketCode);
              toast.success('Ticket code copied');
            }}
            sx={{ 
              bgcolor: '#fff', 
              color: '#1A1A1A', 
              border: '0.5px solid #D3D1C7', 
              borderRadius: '12px', 
              py: 1.5, 
              fontSize: 13, 
              fontWeight: 500, 
              textTransform: 'none',
              '&:hover': { bgcolor: '#F9F9F9' }
            }}
            startIcon={<Copy size={14} />}
          >
            Copy code
          </Button>
          {!isCancelled && (
            <Button
              onClick={handleCancelTicket}
              fullWidth
              sx={{ 
                gridColumn: 'span 2',
                bgcolor: '#FCEBEB', 
                color: '#E24B4A', 
                border: '0.5px solid #F09595', 
                borderRadius: '12px', 
                py: 1.5, 
                fontSize: 13, 
                fontWeight: 500, 
                textTransform: 'none',
                mt: 0.5,
                '&:hover': { bgcolor: '#FCEBEB', opacity: 0.9 }
              }}
              startIcon={<X size={14} />}
            >
              Cancel ticket
            </Button>
          )}
        </Box>

        <Typography sx={{ textAlign: 'center', fontSize: 11, color: '#888780', mt: 1.5 }}>
          My tickets · {activeIndex + 1} of {tickets.length}
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
