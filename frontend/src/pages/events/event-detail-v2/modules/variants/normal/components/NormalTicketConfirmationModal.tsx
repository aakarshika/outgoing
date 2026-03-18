import { Box, Button, Dialog, DialogContent, Typography } from '@mui/material';
import { CheckCircle2 } from 'lucide-react';

interface NormalTicketConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  ticketType: string;
  price: string;
  needsAadharVerification?: boolean;
}

export function NormalTicketConfirmationModal({
  isOpen,
  onClose,
  eventTitle,
  ticketType,
  price,
  needsAadharVerification,
}: NormalTicketConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CheckCircle2 size={44} color="#16a34a" />
          <Typography
            sx={{
              fontFamily: '"Syne", sans-serif',
              fontSize: 22,
              fontWeight: 700,
              textAlign: 'center',
              color: '#111827',
            }}
          >
            Ticket Confirmed
          </Typography>

          <Box
            sx={{
              width: '100%',
              border: '1px solid #e5e7eb',
              borderRadius: 2,
              p: 2,
              bgcolor: '#f9fafb',
            }}
          >
            <Typography sx={{ fontSize: 12, color: '#6b7280', mb: 0.5 }}>
              Event
            </Typography>
            <Typography
              sx={{ fontSize: 15, fontWeight: 600, color: '#111827', mb: 1.5 }}
            >
              {eventTitle}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: 13, color: '#6b7280' }}>
                {ticketType} access
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#D85A30' }}>
                ${price}
              </Typography>
            </Box>
          </Box>

          {needsAadharVerification && (
            <Box
              sx={{
                width: '100%',
                p: 1.5,
                borderRadius: 1.5,
                border: '1px solid #fecaca',
                bgcolor: '#fef2f2',
              }}
            >
              <Typography sx={{ fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>
                Add your Aadhaar to complete ticket verification.
              </Typography>
            </Box>
          )}

          <Button
            fullWidth
            variant="contained"
            onClick={onClose}
            sx={{
              mt: 0.5,
              py: 1.1,
              textTransform: 'none',
              borderRadius: 2,
              bgcolor: '#111827',
              '&:hover': { bgcolor: '#1f2937' },
            }}
          >
            Done
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
