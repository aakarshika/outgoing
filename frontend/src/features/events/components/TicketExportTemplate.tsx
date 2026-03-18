import { Box, Typography } from '@mui/material';
import { Calendar, MapPin, Ticket as TicketIcon, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { TICKET_COLORS } from '../constants';

interface TicketExportTemplateProps {
  event: any;
  ticket: any;
  ticketTiers?: any[];
}

export const TicketExportTemplate = ({
  event,
  ticket,
  ticketTiers = [],
}: TicketExportTemplateProps) => {
  const tierIndex = ticketTiers.findIndex(
    (tier: any) => tier.name === ticket.ticket_type,
  );
  const themeColor =
    tierIndex !== -1
      ? TICKET_COLORS[tierIndex % TICKET_COLORS.length]
      : { light: '#FDFCF0', dark: '#111827' };

  const qrValue = ticket.qr_token || ticket.barcode || '';

  // Format dates
  const startDate = event.start_time ? new Date(event.start_time) : null;
  const day = startDate
    ? startDate.toLocaleDateString('en-US', { day: '2-digit' })
    : '';
  const monthNames = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ];
  const month = startDate ? monthNames[startDate.getMonth()] : '';
  const year = startDate ? startDate.getFullYear() : '';
  const timeString = startDate
    ? startDate
        .toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
        .toUpperCase()
    : '';

  return (
    <Box
      id="ticket-export-root"
      sx={{
        width: '420px', // Standard phone width scale
        height: '750px',
        bgcolor: '#FDFCF0',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Syne", sans-serif',
        border: '10px solid #fff',
        boxSizing: 'border-box',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          backgroundImage:
            'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
          pointerEvents: 'none',
          zIndex: 1,
        },
      }}
    >
      {/* Top Section: Visual Hero */}
      <Box sx={{ height: '320px', position: 'relative', overflow: 'hidden' }}>
        <img
          src={event.cover_image || '/placeholder-event.jpg'}
          alt={event.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, #FDFCF0 0%, rgba(253,252,240,0.5) 20%, transparent 60%)',
          }}
        />

        {/* Date Badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            bgcolor: '#fff',
            px: 1.5,
            py: 1,
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            minWidth: '50px',
          }}
        >
          <Typography
            sx={{ fontSize: 18, fontWeight: 900, lineHeight: 1, color: '#111827' }}
          >
            {day}
          </Typography>
          <Typography sx={{ fontSize: 10, fontWeight: 800, color: '#ef4444' }}>
            {month}
          </Typography>
        </Box>

        <Box sx={{ position: 'absolute', bottom: 20, left: 24, right: 24 }}>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: '#b45309', // Deep Amber
              mb: 0.5,
            }}
          >
            Official Invitation
          </Typography>
          <Typography
            sx={{
              fontSize: 26,
              fontWeight: 800,
              lineHeight: 1.1,
              color: '#111827',
              fontFamily: '"Syne", sans-serif',
            }}
          >
            {event.title}
          </Typography>
        </Box>
      </Box>

      {/* Main Info Section */}
      <Box
        sx={{
          flex: 1,
          px: 4,
          pt: 1,
          pb: 4,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              mb: 0.5,
            }}
          >
            Guest of Honor
          </Typography>
          <Typography sx={{ fontSize: 32, fontWeight: 800, color: '#111827' }}>
            {ticket.guest_name || 'VIP Guest'}
          </Typography>
          <Typography
            sx={{ fontSize: 14, fontStyle: 'italic', color: '#6b7280', mt: 0.5 }}
          >
            You're confirmed for this experience.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gap: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                bgcolor: '#fff',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              <Calendar size={16} color="#6b7280" />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>
                {day} {month} {year}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#9ca3af' }}>
                {timeString}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                bgcolor: '#fff',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              <MapPin size={16} color="#6b7280" />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>
                {event.venue_name || 'The Venue'}
              </Typography>
              <Typography
                noWrap
                sx={{ fontSize: 11, color: '#9ca3af', maxWidth: '240px' }}
              >
                {event.address || event.location_name || 'See details in app'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            mt: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              p: 3,
              bgcolor: '#fff',
              borderRadius: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
              position: 'relative',
              border: '1px solid #e5e7eb',
            }}
          >
            {qrValue ? (
              <QRCodeSVG value={qrValue} size={150} level="H" includeMargin={false} />
            ) : (
              <Box sx={{ width: 150, height: 150, bgcolor: '#f3f4f6' }} />
            )}

            {/* Corner Markers */}
            <Box
              sx={{
                position: 'absolute',
                top: 15,
                left: 15,
                width: 15,
                height: 15,
                borderTop: '2px solid #111827',
                borderLeft: '2px solid #111827',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 15,
                right: 15,
                width: 15,
                height: 15,
                borderTop: '2px solid #111827',
                borderRight: '2px solid #111827',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 15,
                left: 15,
                width: 15,
                height: 15,
                borderBottom: '2px solid #111827',
                borderLeft: '2px solid #111827',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 15,
                right: 15,
                width: 15,
                height: 15,
                borderBottom: '2px solid #111827',
                borderRight: '2px solid #111827',
              }}
            />
          </Box>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#111827', mb: 0.5 }}>
            {ticket.ticket_type}
          </Typography>
          <Typography sx={{ fontSize: 10, color: '#d1d5db', letterSpacing: '0.2em' }}>
            {ticket.barcode || 'CONFIRMED'}
          </Typography>
        </Box>
      </Box>

      {/* Brand Footer */}
      <Box
        sx={{
          height: '40px',
          bgcolor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: '1px dashed #e5e7eb',
          px: 3,
        }}
      >
        <Typography
          sx={{
            fontSize: 9,
            fontWeight: 900,
            color: '#9ca3af',
            letterSpacing: '0.1em',
          }}
        >
          POWERED BY OUTGOING
        </Typography>
      </Box>

      {/* Confirmed Badge Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 310,
          right: 40,
          width: 60,
          height: 60,
          borderRadius: '50%',
          bgcolor: '#10b981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
          transform: 'rotate(-15deg)',
          zIndex: 10,
        }}
      >
        <CheckCircle2 size={32} />
      </Box>

      {/* Status Overlays */}
      {ticket.status === 'cancelled' && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(255,255,255,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <Typography
            sx={{
              color: '#ef4444',
              fontWeight: 900,
              fontSize: 50,
              border: '6px solid #ef4444',
              px: 3,
              py: 1,
              transform: 'rotate(-15deg)',
              fontFamily: '"Permanent Marker", cursive',
            }}
          >
            CANCELLED
          </Typography>
        </Box>
      )}
    </Box>
  );
};
