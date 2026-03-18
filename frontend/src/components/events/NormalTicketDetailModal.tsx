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
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  Share,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useUpdateTicket } from '@/features/events/hooks';
  isOpen: boolean;
  onClose: () => void;
  tickets: any[];
  ticketTiers?: any[];
  initialIndex?: number;
}

const THEME_ORANGE = '#D85A30';
const PRIMARY_BG = '#FFFFFF';
const SECONDARY_BG = '#F8FAFC';
const BORDER_COLOR = '#E2E8F0';

export function NormalTicketDetailModal({
  isOpen,
  onClose,
  tickets,
  ticketTiers = [],
  initialIndex = 0,
}: NormalTicketDetailModalProps) {
  const updateTicket = useUpdateTicket();

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const currentTicket = tickets?.[activeIndex];
  const [guestName, setGuestName] = useState(currentTicket?.guest_name || '');
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const lastTicketId = useRef<number | null>(null);
  useEffect(() => {
    if (
      currentTicket &&
      currentTicket.id !== lastTicketId.current &&
      !isInlineEditing
    ) {
      setGuestName(currentTicket.guest_name || '');
      setIsInlineEditing(false);
      lastTicketId.current = currentTicket.id;
    }
  }, [currentTicket, isInlineEditing]);

  if (!isOpen || !tickets || tickets.length === 0) return null;

  const handleUpdateName = () => {
    if (!currentTicket) return;
    updateTicket.mutate(
      { ticketId: currentTicket.id, guestName },
      {
        onSuccess: () => {
          toast.success('Guest name updated!');
          setIsInlineEditing(false);
        },
        onError: () => toast.error('Failed to update guest name.'),
      },
    );
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

  const handleShare = async () => {
    if (!ticketRef.current || !currentTicket) return;

    try {
      const canvas = await html2canvas(ticketRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      const pdfBlob = pdf.output('blob');
      const pdfFile = new File(
        [pdfBlob],
        `Ticket-${currentTicket.barcode || 'Export'}.pdf`,
        {
          type: 'application/pdf',
        },
      );

      const eventTitle = currentTicket.event_summary?.title || 'the event';
      const guestNameValue = currentTicket.guest_name || 'guest';
      const shareText = `Here is ${guestNameValue}'s ticket for ${eventTitle}`;
      const eventSlug = currentTicket.event_summary?.slug;
      const eventUrl = eventSlug
        ? `${window.location.origin}/events/${eventSlug}`
        : window.location.href;

      const shareData = {
        title: 'My Ticket',
        text: shareText,
        url: eventUrl,
        files: [pdfFile],
      };

      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        toast.success('Ticket shared!');
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${eventUrl}`);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to share ticket', error);
      if ((error as Error).name !== 'AbortError') {
        toast.error('Failed to share ticket. Please try again.');
      }
    }
  };

  const handleAddToCalendar = () => {
    if (!currentTicket?.event_summary) return;

    const event = currentTicket.event_summary;
    const eventTitle = event.title || 'Event';
    const startDate = event.start_date || event.start_datetime;
    const endDate = event.end_date || event.end_datetime;

    if (!startDate) {
      toast.error('Event date not available');
      return;
    }

    const formatDateForCalendar = (date: string) => {
      return new Date(date).toISOString().replace(/-|:|\.\d{3}/g, '');
    };

    const start = formatDateForCalendar(startDate);
    const end = endDate ? formatDateForCalendar(endDate) : '';

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${start}${end ? '/' + end : ''}&details=${encodeURIComponent('Ticket for ' + eventTitle)}`;

    window.open(calendarUrl, '_blank');
    toast.success('Opening calendar...');
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatEventTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const tierInfo = ticketTiers?.find(
    (t: any) => t.name === currentTicket?.ticket_type,
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          maxWidth: 420,
          mx: 1,
          overflow: 'hidden',
        },
      }}
    >
      <DialogContent sx={{ p: 0, bgcolor: SECONDARY_BG, position: 'relative' }}>
        <IconButton
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            bgcolor: 'rgba(255,255,255,0.9)',
            '&:hover': { bgcolor: 'white' },
          }}
          onClick={onClose}
        >
          <X size={20} />
        </IconButton>

        {tickets.length > 1 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              py: 1.5,
              bgcolor: PRIMARY_BG,
              borderBottom: `1px solid ${BORDER_COLOR}`,
            }}
          >
            <IconButton
              size="small"
              onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeIndex === 0}
              sx={{
                bgcolor: BORDER_COLOR,
                '&:hover': { bgcolor: '#d1d5db' },
                '&.Mui-disabled': { bgcolor: '#f3f4f6' },
              }}
            >
              <ChevronLeft size={18} />
            </IconButton>
            <Typography
              sx={{
                fontFamily: '"Syne", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
              }}
            >
              {activeIndex + 1} of {tickets.length}
            </Typography>
            <IconButton
              size="small"
              onClick={() =>
                setActiveIndex((prev) => Math.min(tickets.length - 1, prev + 1))
              }
              disabled={activeIndex === tickets.length - 1}
              sx={{
                bgcolor: BORDER_COLOR,
                '&:hover': { bgcolor: '#d1d5db' },
                '&.Mui-disabled': { bgcolor: '#f3f4f6' },
              }}
            >
              <ChevronRight size={18} />
            </IconButton>
          </Box>
        )}

        <Box sx={{ p: 2.5 }}>
          {currentTicket && (
            <Box
              ref={ticketRef}
              sx={{
                bgcolor: PRIMARY_BG,
                borderRadius: '20px',
                border: `1px solid ${BORDER_COLOR}`,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              {currentTicket.status === 'cancelled' && (
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
                    sx={{
                      color: '#ef4444',
                      fontFamily: '"Syne", sans-serif',
                      fontWeight: 700,
                      fontSize: '1.5rem',
                      border: '4px solid #ef4444',
                      px: 3,
                      py: 1,
                      transform: 'rotate(-10deg)',
                    }}
                  >
                    CANCELLED
                  </Typography>
                </Box>
              )}

              {currentTicket.status === 'used' && (
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
                    sx={{
                      color: '#059669',
                      fontFamily: '"Syne", sans-serif',
                      fontWeight: 700,
                      fontSize: '1.5rem',
                      border: '4px solid #059669',
                      px: 3,
                      py: 1,
                      transform: 'rotate(10deg)',
                    }}
                  >
                    ADMITTED
                  </Typography>
                </Box>
              )}

              <Box sx={{ p: 2.5 }}>
                <Typography
                  sx={{
                    fontFamily: '"Syne", sans-serif',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#111827',
                    lineHeight: 1.2,
                    mb: 1.5,
                  }}
                >
                  {currentTicket.event_summary?.title}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Date
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Syne", sans-serif',
                        fontSize: 14,
                        fontWeight: 600,
                        color: THEME_ORANGE,
                      }}
                    >
                      {currentTicket.event_summary?.start_date
                        ? formatEventDate(currentTicket.event_summary.start_date)
                        : 'TBD'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Time
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Syne", sans-serif',
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#111827',
                      }}
                    >
                      {currentTicket.event_summary?.start_datetime
                        ? formatEventTime(currentTicket.event_summary.start_datetime)
                        : 'TBD'}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    borderTop: `2px dashed ${BORDER_COLOR}`,
                    my: 2,
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -10,
                      left: -8,
                      width: 20,
                      height: 20,
                      bgcolor: SECONDARY_BG,
                      borderRadius: '50%',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -10,
                      right: -8,
                      width: 20,
                      height: 20,
                      bgcolor: SECONDARY_BG,
                      borderRadius: '50%',
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    py: 2,
                  }}
                >
                  {currentTicket.qr_token || currentTicket.barcode ? (
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: '#fff',
                        borderRadius: '16px',
                        border: `2px solid ${BORDER_COLOR}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                    >
                      <QRCodeSVG
                        value={currentTicket.qr_token || currentTicket.barcode}
                        size={160}
                        level="H"
                        includeMargin={false}
                        fgColor="#111827"
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        p: 4,
                        bgcolor: '#f3f4f6',
                        borderRadius: '16px',
                        border: `2px dashed ${BORDER_COLOR}`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: 14,
                          color: '#6b7280',
                        }}
                      >
                        PENDING
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 2,
                    p: 1.5,
                    bgcolor: SECONDARY_BG,
                    borderRadius: '12px',
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        mb: 0.5,
                      }}
                    >
                      Guest
                    </Typography>
                    {isInlineEditing ? (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <TextField
                          size="small"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Enter guest name"
                          sx={{
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px',
                              fontSize: 14,
                            },
                          }}
                          autoFocus
                        />
                        <MuiButton
                          variant="contained"
                          size="small"
                          onClick={handleUpdateName}
                          disabled={updateTicket.isPending}
                          sx={{
                            bgcolor: THEME_ORANGE,
                            borderRadius: '8px',
                            fontSize: 12,
                            fontWeight: 600,
                            px: 1.5,
                            '&:hover': { bgcolor: THEME_ORANGE },
                          }}
                        >
                          Save
                        </MuiButton>
                        <MuiButton
                          size="small"
                          onClick={() => {
                            setIsInlineEditing(false);
                            setGuestName(currentTicket?.guest_name || '');
                          }}
                          sx={{
                            fontSize: 12,
                            color: '#6b7280',
                          }}
                        >
                          Cancel
                        </MuiButton>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: '"Syne", sans-serif',
                            fontSize: 15,
                            fontWeight: 600,
                            color: '#111827',
                          }}
                        >
                          {currentTicket.guest_name || 'Not specified'}
                        </Typography>
                        {currentTicket.status !== 'cancelled' && (
                          <IconButton
                            size="small"
                            onClick={() => {
                              setIsInlineEditing(true);
                              setGuestName(currentTicket.guest_name || '');
                            }}
                            sx={{
                              p: 0.5,
                              color: '#9ca3af',
                              '&:hover': { color: THEME_ORANGE },
                            }}
                          >
                            <Edit2 size={14} />
                          </IconButton>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 1.5,
                    px: 1.5,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Ticket Type
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Syne", sans-serif',
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#111827',
                      }}
                    >
                      {currentTicket.ticket_type}
                      {tierInfo?.description && (
                        <Typography
                          component="span"
                          sx={{
                            fontSize: 11,
                            color: '#6b7280',
                            fontWeight: 400,
                            ml: 0.5,
                          }}
                        >
                          • {tierInfo.description}
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Price
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Syne", sans-serif',
                        fontSize: 16,
                        fontWeight: 700,
                        color: THEME_ORANGE,
                      }}
                    >
                      ₹{currentTicket.price_paid}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <MuiButton
              variant="contained"
              fullWidth
              startIcon={<Share size={18} />}
              onClick={handleShare}
              sx={{
                bgcolor: THEME_ORANGE,
                color: '#fff',
                fontFamily: '"Syne", sans-serif',
                fontSize: 14,
                fontWeight: 700,
                py: 1.5,
                borderRadius: '14px',
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(216, 90, 48, 0.3)',
                '&:hover': {
                  bgcolor: THEME_ORANGE,
                  opacity: 0.9,
                },
              }}
            >
              Share Ticket
            </MuiButton>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <MuiButton
                variant="outlined"
                fullWidth
                startIcon={<Download size={16} />}
                onClick={handleExport}
                sx={{
                  borderColor: BORDER_COLOR,
                  color: '#374151',
                  fontFamily: '"Syne", sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  py: 1.25,
                  borderRadius: '14px',
                  textTransform: 'none',
                  borderWidth: '1.5px',
                  '&:hover': {
                    borderColor: '#9ca3af',
                    bgcolor: 'transparent',
                  },
                }}
              >
                Download PDF
              </MuiButton>

              <MuiButton
                variant="outlined"
                fullWidth
                startIcon={<Calendar size={16} />}
                onClick={handleAddToCalendar}
                sx={{
                  borderColor: BORDER_COLOR,
                  color: '#374151',
                  fontFamily: '"Syne", sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  py: 1.25,
                  borderRadius: '14px',
                  textTransform: 'none',
                  borderWidth: '1.5px',
                  '&:hover': {
                    borderColor: '#9ca3af',
                    bgcolor: 'transparent',
                  },
                }}
              >
                Add to Calendar
              </MuiButton>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
