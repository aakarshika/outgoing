import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { CheckCircle2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface QuickBuyPopupProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  tierId: number | null;
  quantity: number;
  user: any;
  onConfirm: (data: { guestName: string; paymentMethod: string }) => void;
  status: 'idle' | 'loading' | 'success' | 'error';
}

export const QuickBuyPopup = ({
  isOpen,
  onClose,
  event,
  tierId,
  quantity,
  user,
  onConfirm,
  status,
}: QuickBuyPopupProps) => {
  const [guestName, setGuestName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card_ending_4242');

  useEffect(() => {
    if (isOpen && user) {
      setGuestName(`${user.first_name || ''} ${user.last_name || ''}`.trim());
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const tier = event?.ticket_tiers?.find((t: any) => t.id === tierId);
  const total = tier ? (Number(tier.price) * quantity).toFixed(2) : '0.00';

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: '#fff',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        p: 3,
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: 600,
        mx: 'auto',
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease-out',
      }}
    >
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Typography variant="h6" sx={{ fontFamily: '"Permanent Marker", cursive' }}>
          Quick Buy Summary
        </Typography>
        <IconButton onClick={onClose} size="small" disabled={status === 'loading'}>
          <X size={20} />
        </IconButton>
      </Box>

      {status === 'success' ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 4,
            gap: 2,
          }}
        >
          <CheckCircle2 size={48} color="#10b981" />
          <Typography variant="h6">Ticket Confirmed!</Typography>
          <Button variant="contained" onClick={onClose} sx={{ mt: 2, bgcolor: '#000' }}>
            Done
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{ bgcolor: '#f9fafb', p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Order Details
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography fontWeight="bold">
                {quantity}x {tier?.name || 'Ticket'}
              </Typography>
              <Typography fontWeight="bold">${total}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {event?.title}
            </Typography>
          </Box>

          <TextField
            label="1st Guest Name"
            size="small"
            fullWidth
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            disabled={status === 'loading'}
          />

          <TextField
            select
            label="Payment Option"
            size="small"
            fullWidth
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            disabled={status === 'loading'}
          >
            <MenuItem value="card_ending_4242">Visa ending in 4242</MenuItem>
            <MenuItem value="apple_pay">Apple Pay</MenuItem>
            <MenuItem value="google_pay">Google Pay</MenuItem>
          </TextField>

          <Divider sx={{ my: 1 }} />

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => onConfirm({ guestName, paymentMethod })}
            disabled={status === 'loading' || !guestName.trim()}
            sx={{
              bgcolor: '#000',
              '&:hover': { bgcolor: '#333' },
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            {status === 'loading' ? (
              <CircularProgress size={24} sx={{ color: '#fff' }} />
            ) : (
              `Pay $${total}`
            )}
          </Button>
        </>
      )}
    </Box>
  );
};
