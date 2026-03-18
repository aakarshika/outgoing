import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Edit2,
  Share,
  Ticket as TicketIcon,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useCancelTicket, useUpdateTicket } from '@/features/events/hooks';
import { CATEGORY_COLORS_LIGHT } from '@/features/events/constants';
import { exportTicketAsPDF, shareTicket } from '@/features/events/utils/ticketSharing';

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

  const currentTicket = tickets?.[activeIndex];

  useEffect(() => {
    setGuestName(currentTicket?.guest_name || '');
    setIsInlineEditing(false);
  }, [currentTicket?.id]);

  if (!isOpen || !tickets?.length || !currentTicket) return null;

  const handleSaveName = () => {
    updateTicket.mutate(
      { ticketId: currentTicket.id, guestName },
      {
        onSuccess: () => {
          toast.success('Guest name updated');
          setIsInlineEditing(false);
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

  const qrValue = currentTicket.qr_token || currentTicket.barcode || '';
  console.log('event', event);

  const handleExport = () => {
    if (!event || !currentTicket) return;
    exportTicketAsPDF({ event, ticket: currentTicket, ticketTiers: [] });
  };

  const handleShare = () => {
    if (!event || !currentTicket) return;
    shareTicket({ event, ticket: currentTicket, ticketTiers: [] });
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Typography
            sx={{ fontFamily: '"Syne", sans-serif', fontSize: 20, fontWeight: 700 }}
          >
            My Ticket
          </Typography>
          <IconButton onClick={onClose}>
            <X size={18} />
          </IconButton>
        </Box>

        <Typography sx={{ fontSize: 12, color: '#6b7280', mb: 2 }}>
          Ticket {activeIndex + 1} of {tickets.length}
        </Typography>

        <Box
          sx={{
            position: 'relative',
            mt: 1,
            mb: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              bgcolor: '#f4f1ea',
              borderTop: '1px solid '+CATEGORY_COLORS_LIGHT[event?.category?.slug as string],
              borderBottom: '1px solid '+CATEGORY_COLORS_LIGHT[event?.category?.slug as string],
              borderLeft: '1px dashed '+CATEGORY_COLORS_LIGHT[event?.category?.slug as string],
              borderRight: '1px dashed '+CATEGORY_COLORS_LIGHT[event?.category?.slug as string],
              boxShadow: '3px 4px 0px #333',
              transform: activeIndex % 2 === 0 ? 'rotate(-1deg)' : 'rotate(1deg)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: -6,
                top: 0,
                bottom: 0,
                width: 12,
                background: 'radial-gradient(circle at 0 0, transparent 0, transparent 4px, '+CATEGORY_COLORS_LIGHT[event?.category?.slug as string]+' 5px)',
                backgroundSize: '12px 12px',
                backgroundPosition: '0 0',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                right: -6,
                top: 0,
                bottom: 0,
                width: 12,
                background:
                  'radial-gradient(circle at 100% 0, transparent 0, transparent 4px, '+CATEGORY_COLORS_LIGHT[event?.category?.slug as string]+' 5px)',
                backgroundSize: '12px 12px',
                backgroundPosition: '0 0',
              },
            }}
          >
            <Box
              sx={{
                p: 2,
                borderRight: '2px dashed '+CATEGORY_COLORS_LIGHT[event?.category?.slug as string],
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                bgcolor:'#141414',
                color: 'white',
                minWidth: 72,
                alignItems: 'center',
              }}
            >
              <TicketIcon size={26} style={{ transform: 'rotate(-45deg)' }} />
            </Box>
            <Box sx={{ p: 2.5, flexGrow: 1, bgcolor: CATEGORY_COLORS_LIGHT[event?.category?.slug as string] }}>
              <Typography sx={{ fontSize: 11, color: '#6b7280' }}>Event</Typography>
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#111827',
                  mb: 1,
                  fontFamily: '"Caveat", cursive',
                  lineHeight: 1.1,
                }}
              >
                {currentTicket.event_summary?.title}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: 11, color: '#6b7280' }}>Tier</Typography>
                  <Typography sx={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>
                    {currentTicket.ticket_type}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
                    Guest
                  </Typography>
                  {isInlineEditing ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <TextField
                        size="small"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Guest name"
                        sx={{ minWidth: 120 }}
                        autoFocus
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleSaveName}
                        disabled={updateTicket.isPending}
                        sx={{ textTransform: 'none', fontSize: 11, px: 1.5 }}
                      >
                        Save
                      </Button>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => {
                          setIsInlineEditing(false);
                          setGuestName(currentTicket?.guest_name || '');
                        }}
                        sx={{ textTransform: 'none', fontSize: 11, px: 0.5 }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  ) : currentTicket.guest_name ? (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 0.5,
                        mt: 0.5,
                      }}
                    >
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                        {guestName || currentTicket.guest_name}
                      </Typography>
                      {currentTicket.status !== 'cancelled' && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setIsInlineEditing(true);
                            setGuestName(currentTicket.guest_name || '');
                          }}
                          sx={{ p: 0.25 }}
                        >
                          <Edit2 size={14} />
                        </IconButton>
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <TextField
                        size="small"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Guest name"
                        sx={{ minWidth: 120 }}
                        autoFocus
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleSaveName}
                        disabled={updateTicket.isPending}
                        sx={{ textTransform: 'none', fontSize: 11, px: 1.5 }}
                      >
                        Save
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                {qrValue ? (
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 1,
                      bgcolor: '#ffffff',
                      borderRadius: 1.5,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: '#6b7280',
                        mb: 0.5,
                        textAlign: 'left',
                      }}
                    >
                      Barcode / QR
                    </Typography>
                    <QRCodeSVG value={qrValue} size={120} includeMargin={true} />
                    <Typography
                      sx={{
                        mt: 1,
                        fontSize: 11,
                        fontFamily: 'monospace',
                        color: '#374151',
                        letterSpacing: 1.5,
                        fontWeight: 600,
                      }}
                    >
                      {currentTicket.barcode || 'QR'}
                    </Typography>
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                    QR pending
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Share size={14} />}
            onClick={handleShare}
            sx={{
              textTransform: 'none',
              bgcolor: '#111827',
              '&:hover': { bgcolor: '#374151' },
            }}
          >
            Share Ticket
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Download size={14} />}
              onClick={handleExport}
              sx={{ textTransform: 'none' }}
            >
              Export PDF
            </Button>
            {currentTicket.status !== 'cancelled' && (
              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={handleCancelTicket}
                disabled={cancelTicket.isPending}
                sx={{ textTransform: 'none' }}
              >
                Cancel Ticket
              </Button>
            )}
          </Box>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<Copy size={14} />}
            onClick={async () => {
              await navigator.clipboard.writeText(
                currentTicket.barcode || qrValue || '',
              );
              toast.success('Code copied');
            }}
            sx={{ textTransform: 'none' }}
          >
            Copy Code
          </Button>
        </Box>

        {tickets.length > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <IconButton
              onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeIndex === 0}
            >
              <ChevronLeft size={18} />
            </IconButton>
            <IconButton
              onClick={() =>
                setActiveIndex((prev) => Math.min(tickets.length - 1, prev + 1))
              }
              disabled={activeIndex >= tickets.length - 1}
            >
              <ChevronRight size={18} />
            </IconButton>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
