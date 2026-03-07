import {
    Box,
    Button as MuiButton,
    Checkbox,
    Dialog,
    DialogContent,
    FormControlLabel,
    IconButton,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import { Minus, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { usePurchaseTicket } from '@/features/events/hooks';

interface TicketingServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: any;
    onSuccess: (ticketsData: any[]) => void;
}

export function TicketingServiceModal({
    isOpen,
    onClose,
    event,
    onSuccess,
}: TicketingServiceModalProps) {
    const navigate = useNavigate();
    const purchaseTicket = usePurchaseTicket();

    const [step, setStep] = useState(1);
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [ticketCount, setTicketCount] = useState(1);
    const [guests, setGuests] = useState<
        Array<{ tier_id: number | null; guest_name: string; is_18_plus: boolean }>
    >([{ tier_id: null, guest_name: '', is_18_plus: false }]);

    const handleNext = () => setStep((s) => s + 1);
    const handlePrev = () => setStep((s) => s - 1);

    const handleTicketCountChange = (delta: number) => {
        const newCount = Math.max(1, Math.min(10, ticketCount + delta));
        setTicketCount(newCount);

        setGuests((prev) => {
            const newGuests = [...prev];
            if (newCount > prev.length) {
                for (let i = prev.length; i < newCount; i++) {
                    newGuests.push({ tier_id: null, guest_name: '', is_18_plus: false });
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

    const calculateTotal = () => {
        return guests.reduce((total, guest) => {
            if (guest.tier_id) {
                const tier = event.ticket_tiers?.find((t: any) => t.id === guest.tier_id);
                return total + (Number(tier?.price) || 0);
            }
            return total;
        }, 0);
    };

    const handlePayment = () => {
        // Validate
        if (!guests.some((g) => g.is_18_plus)) {
            toast.error('At least one member must be 18+.');
            return;
        }

        // Mock payment taking place... 
        purchaseTicket.mutate(
            { eventId: event.id, tickets: guests },
            {
                onSuccess: (res: any) => {
                    onSuccess(res.data);
                },
                onError: (err: any) => {
                    if (err?.response?.data?.errors?.code === 'AADHAR_REQUIRED') {
                        toast.error(err.response.data.message);
                        // Optionally redirect
                        navigate('/settings');
                    } else {
                        toast.error(err?.response?.data?.message || 'Failed to purchase ticket');
                    }
                },
            }
        );
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogContent sx={{ p: 4, position: 'relative', bgcolor: '#fff9e6' }}>
                <IconButton sx={{ position: 'absolute', top: 8, right: 8 }} onClick={onClose}>
                    <X size={20} />
                </IconButton>

                <Typography variant="h5" sx={{ fontFamily: '"Permanent Marker"', mb: 3 }}>
                    Buy Tickets for {event.title}
                </Typography>

                {step === 1 && (
                    <Box>
                        <Typography sx={{ mb: 2 }}>
                            Please review the terms and conditions before purchasing.
                        </Typography>
                        <Box sx={{ height: 150, overflowY: 'scroll', bgcolor: '#fff', p: 2, mb: 2, border: '1px solid #ccc' }}>
                            <Typography variant="body2">
                                1. No refunds unless event is cancelled or ticket is flexible. <br />
                                2. Adhar card matching the purchasing profile may be verified at the venue. <br />
                                3. At least one person in the group must be 18+ and take responsibility for minors.
                            </Typography>
                        </Box>
                        <FormControlLabel
                            control={<Checkbox checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} />}
                            label="I agree to the terms and conditions"
                        />
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <MuiButton variant="contained" disabled={!agreedTerms} onClick={handleNext}>
                                Next
                            </MuiButton>
                        </Box>
                    </Box>
                )}

                {step === 2 && (
                    <Box>
                        <Typography sx={{ mb: 2, fontWeight: 'bold' }}>How many tickets? (Max 10)</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                            <IconButton onClick={() => handleTicketCountChange(-1)} disabled={ticketCount <= 1}>
                                <Minus />
                            </IconButton>
                            <Typography variant="h6">{ticketCount}</Typography>
                            <IconButton onClick={() => handleTicketCountChange(1)} disabled={ticketCount >= 10}>
                                <Plus />
                            </IconButton>
                        </Box>

                        <Typography sx={{ mb: 2, fontWeight: 'bold' }}>Guest Details</Typography>
                        {guests.map((guest, idx) => (
                            <Box key={idx} sx={{ bgcolor: '#fff', p: 2, mb: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Guest {idx + 1}</Typography>

                                {event.ticket_tiers?.length > 0 ? (
                                    <Select
                                        size="small"
                                        fullWidth
                                        displayEmpty
                                        value={guest.tier_id || ''}
                                        onChange={(e) => handleGuestChange(idx, 'tier_id', e.target.value)}
                                        sx={{ mb: 2 }}
                                    >
                                        <MenuItem value="" disabled>Select Ticket Tier</MenuItem>
                                        {event.ticket_tiers.map((tier: any) => (
                                            <MenuItem key={tier.id} value={tier.id}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                    <span>{tier.name} - ${tier.price} {tier.color ? `(${tier.color})` : ''} - {tier.is_refundable ? 'Refundable' : 'Non-Refundable'}</span>
                                                    <span style={{ color: 'gray', fontSize: '0.8rem', marginLeft: '10px' }}>{tier.description ? ` - ${tier.description}` : ''}</span>
                                                </div>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                ) : (
                                    <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                                        Event has no ticket tiers set up. Defaulting to free Standard entry.
                                    </Typography>
                                )}

                                <TextField
                                    size="small"
                                    fullWidth
                                    label="Guest Name (Optional)"
                                    value={guest.guest_name}
                                    onChange={(e) => handleGuestChange(idx, 'guest_name', e.target.value)}
                                    sx={{ mb: 1 }}
                                />

                                <FormControlLabel
                                    control={<Checkbox checked={guest.is_18_plus} onChange={(e) => handleGuestChange(idx, 'is_18_plus', e.target.checked)} />}
                                    label="This guest is 18+"
                                />
                            </Box>
                        ))}

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                            <MuiButton onClick={handlePrev}>Back</MuiButton>
                            <MuiButton variant="contained" onClick={handleNext} disabled={event.ticket_tiers?.length > 0 && guests.some(g => !g.tier_id)}>
                                Next
                            </MuiButton>
                        </Box>
                    </Box>
                )}

                {step === 3 && (
                    <Box>
                        <Typography sx={{ mb: 2, fontWeight: 'bold' }}>Payment Confirmation</Typography>
                        <Box sx={{ bgcolor: '#fff', p: 2, mb: 2, border: '1px dashed #ccc' }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>Total: ${calculateTotal()}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Taxes & Fees included.
                            </Typography>
                        </Box>

                        <Box sx={{ bgcolor: '#f0f0f0', p: 2, mb: 3, borderRadius: 1, textAlign: 'center' }}>
                            <Typography variant="body2">[ Mock Payment Gateway ]</Typography>
                        </Box>

                        <FormControlLabel
                            control={<Checkbox checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} />}
                            label={
                                <Typography variant="body2" color="text.secondary">
                                    I agree to the Event Terms & Conditions and the Refund Policy.
                                </Typography>
                            }
                            sx={{ mb: 2 }}
                        />

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                            <MuiButton onClick={handlePrev} disabled={purchaseTicket.isPending}>Back</MuiButton>
                            <MuiButton variant="contained" color="success" onClick={handlePayment} disabled={purchaseTicket.isPending || !agreedTerms}>
                                {purchaseTicket.isPending ? 'Processing...' : 'Pay & Confirm'}
                            </MuiButton>
                        </Box>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
