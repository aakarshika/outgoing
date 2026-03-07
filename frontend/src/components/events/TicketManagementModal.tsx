import {
    Box,
    Button as MuiButton,
    Dialog,
    DialogContent,
    IconButton,
    TextField,
    Typography,
} from '@mui/material';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ChevronLeft, ChevronRight, Download, Edit2, Info, Ticket as TicketIcon, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import Barcode from 'react-barcode';
import { toast } from 'sonner';

import { useCancelTicket, useUpdateTicket } from '@/features/events/hooks';

interface TicketManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    tickets: any[];
    initialIndex?: number;
}

export function TicketManagementModal({
    isOpen,
    onClose,
    tickets,
    initialIndex = 0,
}: TicketManagementModalProps) {
    const updateTicket = useUpdateTicket();
    const cancelTicket = useCancelTicket();

    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [isEditing, setIsEditing] = useState(false);
    const currentTicket = tickets?.[activeIndex];
    const [guestName, setGuestName] = useState(currentTicket?.guest_name || '');
    const ticketRef = useRef<HTMLDivElement>(null);

    // Reset index when modal opens with new index
    useState(() => {
        if (isOpen) setActiveIndex(initialIndex);
    });

    // Reset guest name when active ticket changes
    const lastTicketId = useRef<number | null>(null);
    if (currentTicket && currentTicket.id !== lastTicketId.current && !isEditing) {
        setGuestName(currentTicket.guest_name || '');
        lastTicketId.current = currentTicket.id;
    }

    if (!isOpen || !tickets || tickets.length === 0) return null;

    const handleUpdateName = () => {
        if (!currentTicket) return;
        updateTicket.mutate(
            { ticketId: currentTicket.id, guestName },
            {
                onSuccess: () => {
                    toast.success('Guest name updated!');
                    setIsEditing(false);
                },
                onError: () => toast.error('Failed to update guest name.'),
            }
        );
    };

    const handleCancelTicket = () => {
        if (!currentTicket) return;
        if (confirm('Are you sure you want to cancel this ticket? This cannot be undone.')) {
            cancelTicket.mutate(currentTicket.id, {
                onSuccess: (res: any) => {
                    toast.success(res?.message || 'Ticket cancelled.');
                    // If multiple tickets, maybe just stay on modal? Or close?
                    // For now, let's just refresh. 
                },
                onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to cancel ticket.'),
            });
        }
    };

    const handleExport = async () => {
        if (!ticketRef.current) return;

        try {
            const canvas = await html2canvas(ticketRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`Ticket-${currentTicket?.barcode || 'Export'}.pdf`);
            toast.success('Ticket PDF downloaded!');
        } catch (error) {
            console.error('Failed to generate PDF', error);
            toast.error('Failed to generate PDF. Please try again.');
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogContent sx={{ p: 4, position: 'relative', bgcolor: '#f4f1ea' }}>
                <IconButton sx={{ position: 'absolute', top: 8, right: 8 }} onClick={onClose}>
                    <X size={20} />
                </IconButton>

                <Typography variant="h5" sx={{ fontFamily: '"Permanent Marker"', mb: 1 }}>
                    Your Tickets
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                    Ticket {activeIndex + 1} of {tickets.length}
                </Typography>

                {/* Ticket Gallery Container with Navigation Arrows */}
                <Box sx={{ position: 'relative', mb: 2 }}>
                    {tickets.length > 1 && (
                        <>
                            <IconButton
                                onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))}
                                disabled={activeIndex === 0}
                                sx={{
                                    position: 'absolute',
                                    left: -40,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    bgcolor: 'rgba(255,255,255,0.7)',
                                    zIndex: 20,
                                    '&:hover': { bgcolor: 'white' },
                                    display: { xs: 'none', sm: 'flex' }
                                }}
                            >
                                <ChevronLeft size={24} />
                            </IconButton>
                            <IconButton
                                onClick={() => setActiveIndex(prev => Math.min(tickets.length - 1, prev + 1))}
                                disabled={activeIndex === tickets.length - 1}
                                sx={{
                                    position: 'absolute',
                                    right: -40,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    bgcolor: 'rgba(255,255,255,0.7)',
                                    zIndex: 20,
                                    '&:hover': { bgcolor: 'white' },
                                    display: { xs: 'none', sm: 'flex' }
                                }}
                            >
                                <ChevronRight size={24} />
                            </IconButton>
                        </>
                    )}

                    <Box
                        sx={{
                            display: 'flex',
                            overflow: 'hidden',
                            gap: 2,
                            pb: 1,
                        }}
                    >
                        {tickets.map((t, idx) => (
                            <Box
                                key={t.id}
                                ref={idx === activeIndex ? ticketRef : null}
                                sx={{
                                    minWidth: '100%',
                                    display: idx === activeIndex ? 'flex' : 'none',
                                    bgcolor: t.color || '#fff9e6',
                                    border: '2px solid #333',
                                    boxShadow: '4px 6px 0px #333',
                                    transform: idx % 2 === 0 ? 'rotate(-1deg)' : 'rotate(1deg)',
                                    position: 'relative',
                                    mb: 1
                                }}>
                                <Box sx={{ p: 3, borderRight: '2px dashed #999', display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.5)' }}>
                                    <TicketIcon size={32} style={{ transform: 'rotate(-45deg)' }} />
                                </Box>
                                <Box sx={{ p: 3, flexGrow: 1, position: 'relative' }}>
                                    {t.status === 'cancelled' && (
                                        <Box sx={{
                                            position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.7)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
                                        }}>
                                            <Typography variant="h4" sx={{ color: 'red', fontWeight: 'bold', border: '4px solid red', px: 2, transform: 'rotate(-15deg)', fontFamily: '"Permanent Marker"' }}>CANCELLED</Typography>
                                        </Box>
                                    )}
                                    <Typography variant="subtitle2" color="text.secondary">Event</Typography>
                                    <Typography variant="h6" sx={{ fontFamily: '"Caveat", cursive', fontSize: '1.5rem', lineHeight: 1 }}>{t.event_summary?.title}</Typography>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">TIER</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{t.ticket_type}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">PRICE</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>${t.price_paid}</Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'white', p: 1, borderRadius: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'flex-start', mb: 1 }}>BARCODE</Typography>
                                        {t.barcode ? (
                                            <Barcode value={t.barcode} width={1.5} height={40} displayValue={true} />
                                        ) : (
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', letterSpacing: 2 }}>PENDING</Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    {/* Mobile Navigation Controls */}
                    {tickets.length > 1 && (
                        <Box sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'center', gap: 4, mt: 1 }}>
                            <IconButton
                                onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))}
                                disabled={activeIndex === 0}
                                size="small"
                                sx={{ border: '1px solid #ccc' }}
                            >
                                <ChevronLeft size={20} />
                            </IconButton>
                            <IconButton
                                onClick={() => setActiveIndex(prev => Math.min(tickets.length - 1, prev + 1))}
                                disabled={activeIndex === tickets.length - 1}
                                size="small"
                                sx={{ border: '1px solid #ccc' }}
                            >
                                <ChevronRight size={20} />
                            </IconButton>
                        </Box>
                    )}
                </Box>

                {/* Actions & info for currentTicket */}
                {currentTicket && currentTicket.status !== 'cancelled' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                        {currentTicket.needs_aadhar_verification && (
                            <Box sx={{ bgcolor: '#fee2e2', color: '#b91c1c', p: 2, borderRadius: 1, border: '1px solid #f87171', display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Info size={20} />
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Add your Aadhaar to complete ticket purchase.
                                </Typography>
                            </Box>
                        )}

                        <Box sx={{ bgcolor: '#fff', p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: isEditing ? 2 : 0 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Guest Name</Typography>
                                {!isEditing ? (
                                    <IconButton size="small" onClick={() => { setIsEditing(true); setGuestName(currentTicket.guest_name || ''); }}>
                                        <Edit2 size={16} />
                                    </IconButton>
                                ) : null}
                            </Box>

                            {!isEditing ? (
                                <Typography>{currentTicket.guest_name || 'No name provided'}</Typography>
                            ) : (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        placeholder="Enter guest name"
                                    />
                                    <MuiButton variant="contained" size="small" onClick={handleUpdateName} disabled={updateTicket.isPending}>
                                        Save
                                    </MuiButton>
                                    <MuiButton variant="outlined" size="small" onClick={() => setIsEditing(false)}>
                                        Cancel
                                    </MuiButton>
                                </Box>
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <MuiButton
                                variant="outlined"
                                fullWidth
                                startIcon={<Download size={18} />}
                                onClick={handleExport}
                                sx={{ border: '2px solid #333', color: '#333', fontWeight: 'bold' }}
                            >
                                Export PDF
                            </MuiButton>

                            <MuiButton
                                variant="outlined"
                                color="error"
                                fullWidth
                                startIcon={<Trash2 size={18} />}
                                onClick={handleCancelTicket}
                                disabled={cancelTicket.isPending}
                                sx={{ border: '2px solid', fontWeight: 'bold' }}
                            >
                                Cancel Ticket
                            </MuiButton>
                        </Box>

                        {currentTicket.is_refundable && (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', color: 'text.secondary', mt: -1 }}>
                                <Info size={16} />
                                <Typography variant="caption">
                                    This ticket is refundable up to {currentTicket.refund_percentage}%.
                                </Typography>
                            </Box>
                        )}
                        {!currentTicket.is_refundable && (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', color: 'text.secondary', mt: -1 }}>
                                <Info size={16} />
                                <Typography variant="caption">
                                    This ticket is non-refundable.
                                </Typography>
                            </Box>
                        )}

                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
