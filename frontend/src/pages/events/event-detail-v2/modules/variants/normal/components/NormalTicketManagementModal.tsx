import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { ChevronLeft, ChevronRight, Copy, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useCancelTicket, useUpdateTicket } from '@/features/events/hooks';

interface NormalTicketManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: any[];
  initialIndex?: number;
}

export function NormalTicketManagementModal({
  isOpen,
  onClose,
  tickets,
  initialIndex = 0,
}: NormalTicketManagementModalProps) {
  const updateTicket = useUpdateTicket();
  const cancelTicket = useCancelTicket();

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex(initialIndex);
  }, [isOpen, initialIndex]);

  const currentTicket = tickets?.[activeIndex];

  useEffect(() => {
    setGuestName(currentTicket?.guest_name || '');
  }, [currentTicket?.id]);

  if (!isOpen || !tickets?.length || !currentTicket) return null;

  const handleSaveName = () => {
    updateTicket.mutate(
      { ticketId: currentTicket.id, guestName },
      {
        onSuccess: () => toast.success('Guest name updated'),
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
            p: 2,
            border: '1px solid #e5e7eb',
            borderRadius: 2,
            bgcolor: '#f9fafb',
          }}
        >
          <Typography sx={{ fontSize: 12, color: '#6b7280' }}>Event</Typography>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#111827', mb: 1 }}>
            {currentTicket.event_summary?.title}
          </Typography>

          <Typography sx={{ fontSize: 12, color: '#6b7280' }}>Tier</Typography>
          <Typography sx={{ fontSize: 14, color: '#111827', mb: 1 }}>
            {currentTicket.ticket_type}
          </Typography>

          <Typography sx={{ fontSize: 12, color: '#6b7280' }}>Guest name</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <TextField
              size="small"
              fullWidth
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={handleSaveName}
              disabled={updateTicket.isPending}
              sx={{ textTransform: 'none', minWidth: 72 }}
            >
              Save
            </Button>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            {qrValue ? (
              <Box
                sx={{ textAlign: 'center', p: 1, bgcolor: '#fff', borderRadius: 1.5 }}
              >
                <QRCodeSVG value={qrValue} size={136} includeMargin={true} />
                <Typography
                  sx={{
                    mt: 1,
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: '#374151',
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

        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
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
          {currentTicket.status !== 'cancelled' && (
            <Button
              fullWidth
              variant="outlined"
              color="error"
              onClick={handleCancelTicket}
              disabled={cancelTicket.isPending}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
          )}
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
