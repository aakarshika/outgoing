import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Minus, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { User } from '@/features/auth/api';
import { usePurchaseTicket } from '@/features/events/hooks';

interface NormalTicketPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  user: User | null;
  selectedTierId: number | null;
  selectedQuantity: number | null;
  selections?: Array<{ tierId: number; quantity: number }>;
  onSuccess: (ticketsData: any[]) => void;
}

interface GuestTicket {
  tier_id: number | null;
  guest_name: string;
  is_18_plus: boolean;
}

export function NormalTicketPurchaseModal({
  isOpen,
  onClose,
  event,
  user,
  selectedTierId,
  selectedQuantity,
  selections,
  onSuccess,
}: NormalTicketPurchaseModalProps) {
  const navigate = useNavigate();
  const purchaseTicket = usePurchaseTicket();

  const [ticketCount, setTicketCount] = useState(1);
  const [guests, setGuests] = useState<GuestTicket[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    if (selections && selections.length > 0) {
      const seeded = selections.flatMap((s) =>
        Array.from({ length: s.quantity }).map((_, idx) => ({
          tier_id: s.tierId,
          guest_name:
            idx === 0 && user
              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
              : '',
          is_18_plus: true,
        })),
      );
      setGuests(seeded);
      setTicketCount(seeded.length);
      return;
    }

    const initialCount = Math.max(1, selectedQuantity || 1);
    setTicketCount(initialCount);
    setGuests(
      Array.from({ length: initialCount }).map((_, idx) => ({
        tier_id: selectedTierId || event.ticket_tiers?.[0]?.id || null,
        guest_name:
          idx === 0 && user
            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
            : '',
        is_18_plus: true,
      })),
    );
  }, [isOpen, selections, selectedQuantity, selectedTierId, event.ticket_tiers, user]);

  const subtotal = useMemo(() => {
    return guests.reduce((total, guest) => {
      const tier = event.ticket_tiers?.find((t: any) => t.id === guest.tier_id);
      return total + Number(tier?.price || 0);
    }, 0);
  }, [guests, event.ticket_tiers]);

  const serviceFee = subtotal > 0 ? 2 : 0;
  const total = subtotal + serviceFee;

  const updateGuest = (index: number, patch: Partial<GuestTicket>) => {
    setGuests((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const updateCount = (delta: number) => {
    const nextCount = Math.max(1, Math.min(10, ticketCount + delta));
    setTicketCount(nextCount);

    setGuests((prev) => {
      if (nextCount === prev.length) return prev;
      if (nextCount < prev.length) return prev.slice(0, nextCount);

      const seedTier =
        prev[0]?.tier_id || selectedTierId || event.ticket_tiers?.[0]?.id || null;
      const appended = Array.from({ length: nextCount - prev.length }).map(() => ({
        tier_id: seedTier,
        guest_name: '',
        is_18_plus: true,
      }));
      return [...prev, ...appended];
    });
  };

  const handleConfirm = () => {
    if (!guests.every((g) => g.tier_id)) {
      toast.error('Please choose a ticket tier for each guest.');
      return;
    }

    purchaseTicket.mutate(
      { eventId: event.id, tickets: guests },
      {
        onSuccess: (res: any) => {
          onSuccess(res?.data || []);
        },
        onError: (err: any) => {
          if (err?.response?.data?.errors?.code === 'AADHAR_REQUIRED') {
            toast.error(err.response.data.message || 'Aadhaar verification required');
            navigate('/settings');
            return;
          }
          toast.error(err?.response?.data?.message || 'Failed to purchase tickets');
        },
      },
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={purchaseTicket.isPending ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography
            sx={{ fontFamily: '"Syne", sans-serif', fontSize: 20, fontWeight: 700 }}
          >
            Get Tickets
          </Typography>
          <IconButton onClick={onClose} disabled={purchaseTicket.isPending}>
            <X size={18} />
          </IconButton>
        </Box>

        <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2, mb: 2 }}>
          <Typography sx={{ fontSize: 12, color: '#6b7280', mb: 1 }}>
            How many tickets
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton onClick={() => updateCount(-1)} disabled={ticketCount <= 1}>
              <Minus size={16} />
            </IconButton>
            <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>
              {ticketCount}
            </Typography>
            <IconButton onClick={() => updateCount(1)} disabled={ticketCount >= 10}>
              <Plus size={16} />
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            maxHeight: 320,
            overflowY: 'auto',
            pr: 0.5,
          }}
        >
          {guests.map((guest, idx) => (
            <Box
              key={idx}
              sx={{ p: 1.5, border: '1px solid #e5e7eb', borderRadius: 2 }}
            >
              <Typography sx={{ fontSize: 12, color: '#6b7280', mb: 1 }}>
                Guest {idx + 1}
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="Guest name"
                value={guest.guest_name}
                onChange={(e) => updateGuest(idx, { guest_name: e.target.value })}
                sx={{ mb: 1 }}
              />
              <Select
                size="small"
                fullWidth
                value={guest.tier_id || ''}
                onChange={(e) => updateGuest(idx, { tier_id: Number(e.target.value) })}
              >
                {event.ticket_tiers?.map((tier: any) => (
                  <MenuItem key={tier.id} value={tier.id}>
                    {tier.name} - ${tier.price}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography sx={{ fontSize: 14, color: '#6b7280' }}>Subtotal</Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
            ${subtotal.toFixed(2)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontSize: 14, color: '#6b7280' }}>Service fee</Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
            ${serviceFee.toFixed(2)}
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={handleConfirm}
          disabled={purchaseTicket.isPending}
          sx={{
            py: 1.1,
            textTransform: 'none',
            borderRadius: 2,
            bgcolor: '#111827',
            '&:hover': { bgcolor: '#1f2937' },
          }}
        >
          {purchaseTicket.isPending ? 'Processing...' : `Pay $${total.toFixed(2)}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
