import { Box, Button as MuiButton, Grid, Paper, Typography } from '@mui/material';

export const PurchasedTicketStack = ({
  ticket,
  count = 1,
  tierPrice,
  description,
  onManage,
  themeColor,
}: {
  ticket: any;
  count?: number;
  tierPrice?: string | number;
  description?: string;
  onManage: (ticketId?: number) => void;
  themeColor?: { light: string; dark: string };
}) => {
  const type = ticket.ticket_type || 'Ticket';
  const darkColor = themeColor ? themeColor.dark : ticket.color || '#16a34a';
  const lightColor = themeColor ? themeColor.light : '#fff9e6';

  return (
    <Box sx={{ mb: 4, position: 'relative' }}>
      <Paper
        elevation={2}
        onClick={() => onManage && onManage()}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          bgcolor: lightColor,
          borderTop: '1px solid #e0d8c0',
          borderBottom: '1px solid #e0d8c0',
          borderLeft: '1px dashed #e0d8c0',
          borderRight: '1px dashed #e0d8c0',
          position: 'relative',
          borderRadius: '2px',
          zIndex: 1,
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease-in-out',
          },
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
        {/* purchased bookmark tag */}
        {count > 0 && (
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
            {/* Leaflet illusion for bookmark */}
            {Array.from({ length: Math.min(count, 5) }).map((_, idx) => (
              <Box
                key={`bookmark-bg-${idx}`}
                sx={{
                  position: 'absolute',
                  top: -(Math.min(count, 5) - idx) * 2,
                  left: -(Math.min(count, 5) - idx) * 2,
                  bgcolor: '#FFD700',
                  background:
                    'linear-gradient(135deg, #FFDF00 0%, #D4AF37 50%, #996515 100%)',
                  width: '100%',
                  height: '100%',
                  clipPath: 'polygon(0 0, 100% 0, 80% 50%, 100% 100%, 0 100%)',
                  boxShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                  transform: `rotate(${idx % 2 === 0 ? -2 : 2}deg)`,
                  zIndex: 40 + idx,
                  opacity: 0.7 + idx * 0.05,
                }}
              />
            ))}
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
              <span>{count}</span>
              <span style={{ fontSize: '0.65rem' }}>purchased</span>
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex' }}>
          <Box
            sx={{
              p: 2,
              borderRight: '2px dashed #e0d8c0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minWidth: 110,
              bgcolor: darkColor,
              color: 'white',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                right: -1,
                top: 0,
                bottom: 0,
                width: 2,
                background: `repeating-linear-gradient(to bottom, transparent, transparent 4px, ${lightColor} 4px, ${lightColor} 8px)`,
              },
            }}
          >
            <Typography
              variant="h5"
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                left: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"Permanent Marker"',
                mt: 1,
              }}
            >
              ${tierPrice ? parseFloat(tierPrice.toString()) : 0}
            </Typography>
            <Grid>
              {ticket.status !== 'used' && (
                <Box
                  sx={{
                    border: '3px solid #ef4444',
                    color: '#ef4444',
                    transform: 'rotate(-5deg)',
                    px: 1,
                    py: 0.5,
                    zIndex: 30,
                    fontFamily: '"Permanent Marker"',
                    fontSize: '1.2rem',
                    letterSpacing: 2,
                    borderRadius: 1,
                    opacity: 0.8,
                  }}
                >
                  BOUGHT
                </Box>
              )}

              {ticket.status === 'used' && (
                <Box
                  sx={{
                    border: '3px solid #059669', // emerald
                    color: '#059669',
                    transform: 'rotate(10deg)',
                    px: 1,
                    py: 0.5,
                    zIndex: 30,
                    fontFamily: '"Permanent Marker"',
                    fontSize: '1.2rem',
                    letterSpacing: 2,
                    borderRadius: 1,
                    opacity: 0.8,
                  }}
                >
                  ADMITTED
                </Box>
              )}
            </Grid>
          </Box>

          <Box
            sx={{
              p: 2,
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Permanent Marker"',
                fontSize: '1.2rem',
                color: 'black',
              }}
            >
              {type}
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontFamily: '"Caveat", cursive', fontSize: '1rem' }}
            >
              {description || ticket.description}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
