import {
  Box,
  Button as MuiButton,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { CheckCircle2, CreditCard, Minus, Plus, Wallet, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { User } from '@/features/auth/api';
import { usePurchaseTicket } from '@/features/events/hooks';

interface TicketingServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  user: User | null;
  selectedTierId: number | null;
  selectedQuantity: number | null;
  onSuccess: (ticketsData: any[]) => void;
}

export function TicketingServiceModal({
  isOpen,
  onClose,
  event,
  user,
  selectedTierId,
  selectedQuantity,
  onSuccess,
}: TicketingServiceModalProps) {
  const navigate = useNavigate();
  const purchaseTicket = usePurchaseTicket();

  const [tabValue, setTabValue] = useState(0);
  const [ticketCount, setTicketCount] = useState(1);
  const [guests, setGuests] = useState<
    Array<{ tier_id: number | null; guest_name: string; is_18_plus: boolean }>
  >([]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSummary, setPurchaseSummary] = useState<any[] | null>(null);

  // Initialize guests when modal opens or ticket count changes
  useEffect(() => {
    if (isOpen && guests.length === 0) {
      const initialCount = selectedQuantity || 1;
      const initialGuests = Array.from({ length: initialCount }).map((_, i) => ({
        tier_id: selectedTierId || event.ticket_tiers?.[0]?.id || null,
        guest_name: i === 0 && user ? `${user.first_name} ${user.last_name}`.trim() : '',
        is_18_plus: true, // Default to adult as requested
      }));
      setGuests(initialGuests);
      setTicketCount(initialCount);
      setTabValue(0);
      setPurchaseSummary(null);
    }
  }, [isOpen, selectedTierId, selectedQuantity, event.ticket_tiers, user]);

  const handleTicketCountChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(10, ticketCount + delta));
    setTicketCount(newCount);

    setGuests((prev) => {
      const newGuests = [...prev];
      if (newCount > prev.length) {
        for (let i = prev.length; i < newCount; i++) {
          newGuests.push({
            tier_id: selectedTierId || event.ticket_tiers?.[0]?.id || null,
            guest_name: '',
            is_18_plus: true,
          });
        }
      } else {
        newGuests.length = newCount;
      }
      return newGuests;
    });
  };

  const handleGuestChange = (index: number, field: string, value: any) => {
    const newGuests = [...guests];
    newGuests[index] = { ...newGuests[index], [field]: value };
    setGuests(newGuests);
  };

  const subtotal = guests.reduce((total, guest) => {
    if (guest.tier_id) {
      const tier = event.ticket_tiers?.find((t: any) => t.id === guest.tier_id);
      return total + (Number(tier?.price) || 0);
    }
    return total;
  }, 0);

  const tax = subtotal * 0.1;
  const serviceFee = subtotal > 0 ? 2.0 : 0;
  const totalAmount = subtotal + tax + serviceFee;

  const handlePayment = () => {
    if (!guests.some((g) => g.is_18_plus)) {
      toast.error('At least one guest must be 18+.');
      return;
    }

    setIsProcessing(true);
    // Simulate bank delay
    setTimeout(() => {
      purchaseTicket.mutate(
        { eventId: event.id, tickets: guests },
        {
          onSuccess: (res: any) => {
            setPurchaseSummary(res.data);
            setTabValue(3); // Move to confirmation
            setIsProcessing(false);
          },
          onError: (err: any) => {
            setIsProcessing(false);
            if (err?.response?.data?.errors?.code === 'AADHAR_REQUIRED') {
              toast.error(err.response.data.message);
              navigate('/settings');
            } else {
              toast.error(err?.response?.data?.message || 'Failed to purchase ticket');
            }
          },
        },
      );
    }, 2000);
  };

  if (!isOpen) return null;

  const isConfirmed = tabValue === 3;

  return (
    <Dialog
      open={isOpen}
      onClose={isConfirmed || isProcessing ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1,
          overflow: 'hidden',
          border: '2px solid #333',
          boxShadow: '8px 8px 0px rgba(0,0,0,0.8)',
          bgcolor: '#f4f1ea',
        },
      }}
    >
      <DialogContent
        sx={{ p: 0, bgcolor: '#f4f1ea', '& .MuiDialogContent-root': { padding: 0 } }}
      >
        {/* Header with Tabs */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: '2px dashed #999' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1.5,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Permanent Marker"',
                color: '#1a1a1a',
                fontSize: '1.1rem',
              }}
            >
              {isConfirmed ? 'Success!' : 'Get Your Tickets'}
            </Typography>
            {!isConfirmed && !isProcessing && (
              <IconButton
                onClick={onClose}
                size="small"
                sx={{
                  border: '2px solid #333',
                  bgcolor: '#fff',
                  '&:hover': { bgcolor: '#f0f0f0' },
                  boxShadow: '2px 2px 0px #333',
                }}
              >
                <X size={20} />
              </IconButton>
            )}
          </Box>

          <Tabs
            value={tabValue}
            onChange={(_, v) => !isConfirmed && !isProcessing && setTabValue(v)}
            variant="fullWidth"
            TabIndicatorProps={{ sx: { bgcolor: '#000', height: 3 } }}
            sx={{
              '& .MuiTab-root': {
                minWidth: 0,
                fontSize: '1rem',
                minHeight: '32px',
                py: 0,
                fontFamily: '"Caveat", cursive',
                fontWeight: 800,
                color: '#666',
              },
              '& .Mui-selected': { color: '#000 !important' },
              '& .Mui-disabled': { opacity: 0.5 },
            }}
          >
            <Tab label="Selection" disabled={isConfirmed || isProcessing} />
            <Tab
              label="Guests"
              disabled={isConfirmed || isProcessing || subtotal === 0}
            />
            <Tab
              label="Payment"
              disabled={isConfirmed || isProcessing || guests.some((g) => !g.tier_id)}
            />
            <Tab label="Confirm" disabled={!isConfirmed} />
          </Tabs>
        </Box>

        <Box sx={{ p: 2 }}>
          {tabValue === 0 && (
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1.5, fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
              >
                How many tickets?
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  py: 1,
                  px: 2,
                  bgcolor: '#fff9e6',
                  borderRadius: 1,
                  border: '2px solid #333',
                  boxShadow: '4px 4px 0px rgba(0,0,0,0.8)',
                  transform: 'rotate(-1deg)',
                  mb: 2,
                }}
              >
                <IconButton
                  onClick={() => handleTicketCountChange(-1)}
                  disabled={ticketCount <= 1}
                  sx={{
                    bgcolor: '#fff',
                    border: '2px solid #333',
                    '&:hover': { bgcolor: '#eee' },
                    '&.Mui-disabled': { opacity: 0.5 },
                  }}
                >
                  <Minus />
                </IconButton>
                <Typography variant="h5" sx={{ fontFamily: '"Permanent Marker"' }}>
                  {ticketCount}
                </Typography>
                <IconButton
                  onClick={() => handleTicketCountChange(1)}
                  disabled={ticketCount >= 10}
                  sx={{
                    bgcolor: '#fff',
                    border: '2px solid #333',
                    '&:hover': { bgcolor: '#eee' },
                    '&.Mui-disabled': { opacity: 0.5 },
                  }}
                >
                  <Plus />
                </IconButton>
              </Box>

              <Typography
                variant="subtitle1"
                sx={{ mb: 1.5, fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
              >
                Select Tier
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {event.ticket_tiers?.map((tier: any) => (
                  <Box
                    key={tier.id}
                    onClick={() => handleGuestChange(0, 'tier_id', tier.id)}
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      border: '2px solid #333',
                      bgcolor: guests[0]?.tier_id === tier.id ? '#ffde59' : '#fff',
                      boxShadow:
                        guests[0]?.tier_id === tier.id
                          ? '4px 4px 0px rgba(0,0,0,0.8)'
                          : '2px 2px 0px rgba(0,0,0,0.8)',
                      cursor: 'pointer',
                      transition: 'all 0.1s',
                      '&:hover':
                        guests[0]?.tier_id !== tier.id
                          ? {
                            transform: 'translate(-2px, -2px)',
                            boxShadow: '4px 4px 0px rgba(0,0,0,0.8)',
                          }
                          : {},
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transform: 'rotate(0.5deg)',
                      mb: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontFamily: '"Caveat", cursive',
                          fontSize: '1.2rem',
                          lineHeight: 1.2,
                        }}
                      >
                        {tier.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tier.description}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.1rem' }}
                    >
                      ${tier.price}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ mt: 2 }}>
                <MuiButton
                  fullWidth
                  variant="contained"
                  size="medium"
                  onClick={() => setTabValue(1)}
                  sx={{
                    borderRadius: 1,
                    py: 0.75,
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    bgcolor: '#000',
                    color: '#fff',
                    border: '2px solid #000',
                    '&:hover': { bgcolor: '#333' },
                    boxShadow: '4px 4px 0px rgba(0,0,0,0.8)',
                  }}
                >
                  Continue to Guests
                </MuiButton>
              </Box>
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1.5, fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
              >
                Guest Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {guests.map((guest, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      px: 1.5,
                      py: 1.5,
                      border: '2px solid #333',
                      borderRadius: 1,
                      bgcolor: '#fff',
                      boxShadow: '4px 4px 0px rgba(0,0,0,0.8)',
                      transform: idx % 2 === 0 ? 'rotate(-0.5deg)' : 'rotate(0.5deg)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        color: '#333',
                        mb: 1,
                        display: 'block',
                        fontSize: '0.9rem',
                      }}
                    >
                      GUEST {idx + 1} {idx === 0 && '(You)'}
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Full Name"
                      value={guest.guest_name}
                      onChange={(e) =>
                        handleGuestChange(idx, 'guest_name', e.target.value)
                      }
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          border: '2px solid transparent',
                          '& fieldset': { border: '2px solid #ccc' },
                          '&:hover fieldset': { borderColor: '#333' },
                          '&.Mui-focused fieldset': { borderColor: '#333' },
                        },
                      }}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            sx={{ color: '#333', '&.Mui-checked': { color: '#000' } }}
                            checked={guest.is_18_plus}
                            onChange={(e) =>
                              handleGuestChange(idx, 'is_18_plus', e.target.checked)
                            }
                          />
                        }
                        label={
                          <Typography variant="body1" sx={{ fontWeight: 700 }}>
                            18+ Years Old
                          </Typography>
                        }
                      />
                      {event.ticket_tiers?.length > 1 && (
                        <Select
                          size="small"
                          value={guest.tier_id || ''}
                          onChange={(e) =>
                            handleGuestChange(idx, 'tier_id', e.target.value)
                          }
                          sx={{
                            minWidth: 150,
                            borderRadius: 1,
                            '& .MuiOutlinedInput-notchedOutline': {
                              border: '2px solid #ccc',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#333',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#333',
                            },
                          }}
                        >
                          {event.ticket_tiers.map((t: any) => (
                            <MenuItem key={t.id} value={t.id}>
                              {t.name} (${t.price})
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <MuiButton
                  fullWidth
                  onClick={() => setTabValue(0)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 800,
                    color: '#333',
                    border: '2px solid transparent',
                    '&:hover': { border: '2px solid #ccc' },
                  }}
                >
                  Back
                </MuiButton>
                <MuiButton
                  fullWidth
                  variant="contained"
                  size="medium"
                  onClick={() => setTabValue(2)}
                  sx={{
                    borderRadius: 1,
                    py: 0.75,
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    bgcolor: '#000',
                    color: '#fff',
                    border: '2px solid #000',
                    '&:hover': { bgcolor: '#333' },
                    boxShadow: '4px 4px 0px rgba(0,0,0,0.8)',
                  }}
                >
                  Review & Pay
                </MuiButton>
              </Box>
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1.5, fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
              >
                Order Summary
              </Typography>
              <Box
                sx={{
                  bgcolor: '#fff',
                  p: 1.5,
                  borderRadius: 1,
                  border: '2px solid #333',
                  boxShadow: '4px 4px 0px rgba(0,0,0,0.8)',
                  mb: 2,
                  transform: 'rotate(1deg)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    Tickets ({ticketCount})
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    ${subtotal.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    Taxes (10%)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    ${tax.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    Service Fee
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    ${serviceFee.toFixed(2)}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 1.5, borderBottom: '2px dashed #ccc' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
                    Total
                  </Typography>
                  <Typography
                    sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.4rem' }}
                  >
                    ${totalAmount.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Typography
                variant="subtitle1"
                sx={{ mb: 1.5, fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
              >
                Payment Method
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <Box
                  onClick={() => setPaymentMethod('card')}
                  sx={{
                    flex: 1,
                    p: 1,
                    borderRadius: 1,
                    border: '2px solid #333',
                    bgcolor: paymentMethod === 'card' ? '#ffde59' : '#fff',
                    boxShadow:
                      paymentMethod === 'card'
                        ? '4px 4px 0px rgba(0,0,0,0.8)'
                        : '2px 2px 0px rgba(0,0,0,0.8)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.1s',
                    '&:hover':
                      paymentMethod !== 'card'
                        ? {
                          transform: 'translate(-2px, -2px)',
                          boxShadow: '4px 4px 0px rgba(0,0,0,0.8)',
                        }
                        : {},
                  }}
                >
                  <CreditCard size={20} style={{ marginBottom: 4 }} />
                  <Typography
                    variant="body1"
                    sx={{ display: 'block', fontWeight: 800 }}
                  >
                    Card
                  </Typography>
                </Box>
                <Box
                  onClick={() => setPaymentMethod('upi')}
                  sx={{
                    flex: 1,
                    p: 1,
                    borderRadius: 1,
                    border: '2px solid #333',
                    bgcolor: paymentMethod === 'upi' ? '#ffde59' : '#fff',
                    boxShadow:
                      paymentMethod === 'upi'
                        ? '4px 4px 0px rgba(0,0,0,0.8)'
                        : '2px 2px 0px rgba(0,0,0,0.8)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.1s',
                    '&:hover':
                      paymentMethod !== 'upi'
                        ? {
                          transform: 'translate(-2px, -2px)',
                          boxShadow: '4px 4px 0px rgba(0,0,0,0.8)',
                        }
                        : {},
                  }}
                >
                  <Wallet size={20} style={{ marginBottom: 4 }} />
                  <Typography
                    variant="body1"
                    sx={{ display: 'block', fontWeight: 800 }}
                  >
                    UPI
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 4 }}>
                <MuiButton
                  fullWidth
                  variant="contained"
                  size="medium"
                  onClick={handlePayment}
                  disabled={isProcessing}
                  sx={{
                    borderRadius: 1,
                    py: 0.75,
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    bgcolor: '#000',
                    color: '#fff',
                    border: '2px solid #000',
                    '&:hover': { bgcolor: '#333' },
                    boxShadow: '4px 4px 0px rgba(0,0,0,0.8)',
                  }}
                >
                  {isProcessing ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CircularProgress size={20} color="inherit" />
                      Verifying with bank...
                    </Box>
                  ) : (
                    `Pay $${totalAmount.toFixed(2)}`
                  )}
                </MuiButton>
                {!isProcessing && (
                  <MuiButton
                    fullWidth
                    onClick={() => setTabValue(1)}
                    sx={{
                      mt: 2,
                      textTransform: 'none',
                      fontWeight: 800,
                      color: '#333',
                    }}
                  >
                    Back to Guests
                  </MuiButton>
                )}
              </Box>
            </Box>
          )}

          {tabValue === 3 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Box sx={{ color: '#10b981', mb: 1.5 }}>
                <CheckCircle2 size={40} strokeWidth={2} />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: '"Permanent Marker"',
                  mb: 1,
                  transform: 'rotate(-2deg)',
                }}
              >
                You're In!
              </Typography>
              <Typography
                variant="body2"
                sx={{ mb: 2, fontWeight: 700, color: '#444' }}
              >
                Your tickets have been confirmed and sent to your email.
              </Typography>

              <Box
                sx={{
                  bgcolor: '#f0fdf4',
                  p: 1.5,
                  borderRadius: 1,
                  border: '2px solid #10b981',
                  boxShadow: '4px 4px 0px rgba(16, 185, 129, 0.4)',
                  mb: 3,
                  textAlign: 'left',
                  transform: 'rotate(1deg)',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem', mb: 1 }}
                >
                  Order Details
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, mb: 1 }}>
                  {event.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {ticketCount} {ticketCount > 1 ? 'Tickets' : 'Ticket'} • Total: $
                  {totalAmount.toFixed(2)}
                </Typography>
              </Box>

              <MuiButton
                fullWidth
                variant="outlined"
                size="medium"
                onClick={() => {
                  onSuccess(purchaseSummary || []);
                  onClose();
                }}
                sx={{
                  borderRadius: 1,
                  py: 0.75,
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: '#000',
                  border: '2px solid #000',
                  '&:hover': { bgcolor: '#f0f0f0', border: '2px solid #000' },
                }}
              >
                View My Tickets
              </MuiButton>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
