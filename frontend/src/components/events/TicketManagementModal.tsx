import {
  Box,
  Button as MuiButton,
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  Info,
  Ticket as TicketIcon,
  Trash2,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { TICKET_COLORS } from '@/features/events/constants';
import { useCancelTicket, useUpdateTicket } from '@/features/events/hooks';

interface TicketManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: any[];
  ticketTiers?: any[];
  initialIndex?: number;
}

export function TicketManagementModal({
  isOpen,
  onClose,
  tickets,
  ticketTiers = [],
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
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Reset guest name when active ticket changes
  const lastTicketId = useRef<number | null>(null);
  useEffect(() => {
    if (currentTicket && currentTicket.id !== lastTicketId.current && !isEditing) {
      setGuestName(currentTicket.guest_name || '');
      lastTicketId.current = currentTicket.id;
    }
  }, [currentTicket, isEditing]);

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
      },
    );
  };

  const handleCancelTicket = () => {
    if (!currentTicket) return;
    if (
      confirm('Are you sure you want to cancel this ticket? This cannot be undone.')
    ) {
      cancelTicket.mutate(currentTicket.id, {
        onSuccess: (res: any) => {
          toast.success(res?.message || 'Ticket cancelled.');
          // If multiple tickets, maybe just stay on modal? Or close?
          // For now, let's just refresh.
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.message || 'Failed to cancel ticket.'),
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
        format: [canvas.width, canvas.height],
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
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: 3 }}
        >
          Ticket {activeIndex + 1} of {tickets.length}
        </Typography>

        {/* Ticket Gallery Container with Navigation Arrows */}
        <Box sx={{ position: 'relative', mb: 2 }}>
          {tickets.length > 1 && (
            <>
              <IconButton
                onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeIndex === 0}
                sx={{
                  position: 'absolute',
                  left: -40,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255,255,255,0.7)',
                  zIndex: 20,
                  '&:hover': { bgcolor: 'white' },
                  display: { xs: 'none', sm: 'flex' },
                }}
              >
                <ChevronLeft size={24} />
              </IconButton>
              <IconButton
                onClick={() =>
                  setActiveIndex((prev) => Math.min(tickets.length - 1, prev + 1))
                }
                disabled={activeIndex === tickets.length - 1}
                sx={{
                  position: 'absolute',
                  right: -40,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255,255,255,0.7)',
                  zIndex: 20,
                  '&:hover': { bgcolor: 'white' },
                  display: { xs: 'none', sm: 'flex' },
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
            {tickets.map((t, idx) => {
              const tierIndex = ticketTiers.findIndex(
                (tier: any) => tier.name === t.ticket_type,
              );
              const themeColor =
                tierIndex !== -1
                  ? TICKET_COLORS[tierIndex % TICKET_COLORS.length]
                  : { light: '#fff9e6', dark: '#333' };

              return (
                <Box
                  key={t.id}
                  ref={idx === activeIndex ? ticketRef : null}
                  sx={{
                    minWidth: '100%',
                    display: idx === activeIndex ? 'flex' : 'none',
                    bgcolor: themeColor.light,
                    borderTop: '1px solid #e0d8c0',
                    borderBottom: '1px solid #e0d8c0',
                    borderLeft: '1px dashed #e0d8c0',
                    borderRight: '1px dashed #e0d8c0',
                    boxShadow: '4px 6px 0px #333',
                    transform: idx % 2 === 0 ? 'rotate(-1deg)' : 'rotate(1deg)',
                    position: 'relative',
                    mb: 1,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: -6,
                      top: 0,
                      bottom: 0,
                      width: 12,
                      background:
                        'radial-gradient(circle at 0 0, transparent 0, transparent 4px, #fff9e6 5px)',
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
                        'radial-gradient(circle at 100% 0, transparent 0, transparent 4px, #fff9e6 5px)',
                      backgroundSize: '12px 12px',
                      backgroundPosition: '0 0',
                    },
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      borderRight: '2px dashed #e0d8c0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      bgcolor: themeColor.dark,
                      color: 'white',
                      minWidth: 80,
                      alignItems: 'center',
                    }}
                  >
                    <TicketIcon size={32} style={{ transform: 'rotate(-45deg)' }} />
                  </Box>
                  <Box sx={{ p: 3, flexGrow: 1, position: 'relative' }}>
                    {/* purchased bookmark tag */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: -12,
                        zIndex: 50,
                        transform: 'rotate(-2deg)',
                        animation: 'wiggle 4s ease-in-out infinite alternate',
                        '@keyframes wiggle': {
                          '0%': { transform: 'rotate(-3deg)' },
                          '100%': { transform: 'rotate(-1deg)' },
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          bgcolor: '#FFD700',
                          background:
                            'linear-gradient(110deg, #FFD700 0%, #FDB931 20%, #fff 40%, #FDB931 60%, #FFD700 100%)',
                          backgroundSize: '200% auto',
                          animation: 'shine 3s linear infinite',
                          '@keyframes shine': {
                            to: {
                              backgroundPosition: '200% center',
                            },
                          },
                          color: 'black',
                          px: 2,
                          py: 0.5,
                          pr: 3,
                          fontWeight: 'bold',
                          fontFamily: '"Permanent Marker"',
                          fontSize: '0.8rem',
                          zIndex: 50,
                          clipPath: 'polygon(0 0, 100% 0, 80% 50%, 100% 100%, 0 100%)', // Bookmark shape
                          boxShadow: '2px 4px 6px rgba(0,0,0,0.2)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span>{idx + 1}</span>
                        <span style={{ fontSize: '0.65rem' }}>of {tickets.length}</span>
                      </Box>
                    </Box>
                    {t.status === 'cancelled' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          bgcolor: 'rgba(255,255,255,0.85)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
                        }}
                      >
                        <Typography
                          variant="h4"
                          sx={{
                            color: 'red',
                            fontWeight: 'bold',
                            border: '4px solid red',
                            px: 2,
                            transform: 'rotate(-15deg)',
                            fontFamily: '"Permanent Marker"',
                            mb: 2,
                          }}
                        >
                          CANCELLED
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 'bold',
                            fontFamily: '"Permanent Marker", cursive',
                          }}
                        >
                          On {new Date(t.updated_at).toLocaleDateString()}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 'bold',
                            fontFamily: '"Permanent Marker", cursive',
                          }}
                        >
                          Refunded: $
                          {(
                            parseFloat(t.price_paid) *
                            (t.is_refundable && t.refund_percentage
                              ? t.refund_percentage / 100
                              : 0)
                          ).toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    {t.status === 'used' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
                          pointerEvents: 'none',
                        }}
                      >
                        <Typography
                          variant="h3"
                          sx={{
                            color: '#059669',
                            fontWeight: 'bold',
                            border: '5px solid #059669',
                            px: 3,
                            py: 1,
                            transform: 'rotate(15deg)',
                            fontFamily: '"Permanent Marker", cursive',
                            opacity: 0.85,
                            boxShadow: '0 0 15px rgba(5,150,105,0.3)',
                          }}
                        >
                          ADMITTED
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="subtitle2" color="text.secondary">
                      Event
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: '"Caveat", cursive',
                        fontSize: '1.5rem',
                        lineHeight: 1,
                      }}
                    >
                      {t.event_summary?.title}
                    </Typography>

                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}
                    >
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          TIER
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {t.ticket_type}
                        </Typography>
                      </Box>
                      {t.guest_name && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            GUEST
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {t.guest_name}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">
                          PRICE
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          ${t.price_paid}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        mt: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        bgcolor: 'white',
                        p: 1,
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ alignSelf: 'flex-start', mb: 1 }}
                      >
                        BARCODE / QR
                      </Typography>
                      {t.qr_token || t.barcode ? (
                        <>
                          <QRCodeSVG
                            value={t.qr_token || t.barcode}
                            size={120}
                            level="M"
                            includeMargin={true}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              mt: 1,
                              fontFamily: 'monospace',
                              letterSpacing: 2,
                              fontWeight: 'bold',
                            }}
                          >
                            {t.barcode}
                          </Typography>
                        </>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: 'monospace', letterSpacing: 2 }}
                        >
                          PENDING
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Mobile Navigation Controls */}
          {tickets.length > 1 && (
            <Box
              sx={{
                display: { xs: 'flex', sm: 'none' },
                justifyContent: 'center',
                gap: 4,
                mt: 1,
              }}
            >
              <IconButton
                onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeIndex === 0}
                size="small"
                sx={{ border: '1px solid #ccc' }}
              >
                <ChevronLeft size={20} />
              </IconButton>
              <IconButton
                onClick={() =>
                  setActiveIndex((prev) => Math.min(tickets.length - 1, prev + 1))
                }
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
              <Box
                sx={{
                  bgcolor: '#fee2e2',
                  color: '#b91c1c',
                  p: 2,
                  borderRadius: 1,
                  border: '1px solid #f87171',
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <Info size={20} />
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Add your Aadhaar to complete ticket purchase.
                </Typography>
              </Box>
            )}

            <Box
              sx={{ bgcolor: '#fff', p: 2, border: '1px solid #ddd', borderRadius: 1 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: isEditing ? 2 : 0,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Guest Name
                </Typography>
                {!isEditing ? (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setIsEditing(true);
                      setGuestName(currentTicket.guest_name || '');
                    }}
                  >
                    <Edit2 size={16} />
                  </IconButton>
                ) : null}
              </Box>

              {!isEditing ? (
                <Typography>
                  {currentTicket.guest_name || 'No name provided'}
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter guest name"
                  />
                  <MuiButton
                    variant="contained"
                    size="small"
                    onClick={handleUpdateName}
                    disabled={updateTicket.isPending}
                  >
                    Save
                  </MuiButton>
                  <MuiButton
                    variant="outlined"
                    size="small"
                    onClick={() => setIsEditing(false)}
                  >
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
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                  color: 'text.secondary',
                  mt: -1,
                }}
              >
                <Info size={16} />
                <Typography variant="caption">
                  This ticket is refundable up to {currentTicket.refund_percentage}%.
                </Typography>
              </Box>
            )}
            {!currentTicket.is_refundable && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                  color: 'text.secondary',
                  mt: -1,
                }}
              >
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
