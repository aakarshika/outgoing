import {
  Box,
  Button as MuiButton,
  Checkbox,
  FormControlLabel,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import { Minus, Plus } from 'lucide-react';
import React, { useState } from 'react';

import { TermsDialog } from './TermsDialog';

export const TicketStub = ({
  type,
  price,
  color,
  capacity,
  soldCount,
  onBuy,
  onOneClickBuy,
  isLoading,
  disabled,
  userPurchasedCount = 0,
  clearTicketformTrigger,
  themeColor,
}: {
  type: string;
  price: number;
  color?: string;
  capacity?: number | null;
  soldCount?: number;
  onBuy: (quantity: number) => void;
  onOneClickBuy: (quantity: number) => void;
  isLoading?: boolean;
  disabled?: boolean;
  userPurchasedCount?: number;
  clearTicketformTrigger?: number;
  themeColor?: { light: string; dark: string };
}) => {
  const [quantity, setQuantity] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  React.useEffect(() => {
    if (clearTicketformTrigger) {
      setQuantity(1);
    }
  }, [clearTicketformTrigger]);

  const isSoldOut =
    capacity !== null &&
    capacity !== undefined &&
    soldCount !== undefined &&
    soldCount >= capacity;
  const total = price * quantity;

  // For leaflet illusion
  const visualPages = Math.min(userPurchasedCount, 5); // show up to 5 background pages

  return (
    <Box sx={{ mb: 2 }}>
      <Paper
        elevation={2}
        sx={{
          display: 'flex',
          my: 1,
          flexDirection: 'column',
          position: 'relative',
          bgcolor: themeColor ? themeColor.light : '#fff9e6',
          borderTop: '1px solid #e0d8c0',
          borderBottom: '1px solid #e0d8c0',
          borderLeft: '1px dashed #e0d8c0',
          borderRight: '1px dashed #e0d8c0',
          transform: 'rotate(-0.5deg)',
          overflow: 'visible',
          opacity: isSoldOut ? 0.8 : 1,
          zIndex: 1,
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
        {userPurchasedCount > 0 && (
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
            {Array.from({ length: visualPages }).map((_, idx) => (
              <Box
                key={`bookmark-bg-${idx}`}
                sx={{
                  position: 'absolute',
                  top: -(visualPages - idx) * 2,
                  left: -(visualPages - idx) * 2,
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
              <span>{userPurchasedCount}</span>
              <span style={{ fontSize: '0.65rem' }}>purchased</span>
            </Box>
          </Box>
        )}
        {isSoldOut && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              right: '0%',
              transform: 'rotate(-10deg)',
              bgcolor: '#ef4444',
              color: 'white',
              px: 2,
              py: 0.5,
              border: '3px solid #fff',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              fontFamily: '"Permanent Marker"',
              fontSize: '1.4rem',
              whiteSpace: 'nowrap',
              zIndex: 50,
              pointerEvents: 'none',
              letterSpacing: 1,
            }}
          >
            FULL HOUSE
          </Box>
        )}
        {capacity !== null && capacity !== undefined && soldCount !== undefined && (
          <Box
            sx={{
              position: 'absolute',
              top: -15,
              left: 20,
              zIndex: 60,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            {(() => {
              const remaining = capacity - soldCount;
              const fillRate = soldCount / capacity;

              let urgencyText = '';
              let urgencyColor = '#333';
              let urgencyBgColor = '#fff';

              if (remaining > 0 && remaining <= 5) {
                urgencyText = `Only ${remaining} left!`;
                urgencyColor = '#fff';
                urgencyBgColor = '#f43f5e'; // rose-500
              } else if (fillRate >= 0.7 && !isSoldOut) {
                urgencyText = 'Filling Fast!';
                urgencyColor = '#000';
                urgencyBgColor = '#fbbf24'; // amber-400
              }
              //  add urgency for being early bird .. color calm pink.
              else if (fillRate < 0.1 && !isSoldOut) {
                urgencyText = 'Early Bird!';
                urgencyColor = '#fff';
                urgencyBgColor = '#f48fb1'; // rose-300
              }
              return (
                <>
                  {urgencyText && (
                    <Box
                      sx={{
                        bgcolor: urgencyBgColor,
                        color: urgencyColor,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '2px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        fontFamily: '"Permanent Marker"',
                        boxShadow: '2px 2px 0px rgba(0,0,0,0.1)',
                        transform: 'rotate(-3deg)',
                        border: '1px solid currentColor',
                        animation: 'pulse 2s infinite ease-in-out',
                        '@keyframes pulse': {
                          '0%': { transform: 'rotate(-3deg) scale(1)' },
                          '50%': { transform: 'rotate(-2deg) scale(1.05)' },
                          '100%': { transform: 'rotate(-3deg) scale(1)' },
                        },
                      }}
                    >
                      {urgencyText}
                    </Box>
                  )}
                  <Box
                    sx={{
                      bgcolor: '#fff',
                      color: '#666',
                      px: 1,
                      py: 0.2,
                      borderRadius: '2px',
                      fontSize: '0.65rem',
                      fontFamily: '"Permanent Marker"',
                      boxShadow: '1px 1px 0px rgba(0,0,0,0.1)',
                      transform: 'rotate(2deg)',
                      border: '1px dashed #ccc',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    SOLD {soldCount} / {capacity}
                  </Box>
                </>
              );
            })()}
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
              minWidth: 100,
              bgcolor: themeColor ? themeColor.dark : color || '#555',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                right: -1,
                top: 0,
                bottom: 0,
                width: 2,
                background: `repeating-linear-gradient(to bottom, transparent, transparent 4px, ${themeColor ? themeColor.light : '#fff9e6'} 4px, ${themeColor ? themeColor.light : '#fff9e6'} 8px)`,
              },
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
              ADMIT ONE
            </Typography>
            <Typography variant="h5" sx={{ fontFamily: '"Permanent Marker"', mt: 1 }}>
              ${price}
            </Typography>
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
                fontSize: '1.1rem',
                color: 'black',
              }}
            >
              {type}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
              {!isSoldOut && !disabled && (
                <>
                  <IconButton
                    size="small"
                    onClick={() => setQuantity((q) => Math.max(0, q - 1))}
                    sx={{ border: '1px solid #ddd', p: 0.5 }}
                  >
                    <Minus size={14} />
                  </IconButton>
                  <Typography
                    sx={{ fontWeight: 800, minWidth: 20, textAlign: 'center' }}
                  >
                    {quantity}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setQuantity((q) => q + 1)}
                    sx={{ border: '1px solid #ddd', p: 0.5 }}
                  >
                    <Plus size={14} />
                  </IconButton>
                </>
              )}
            </Box>
          </Box>
        </Box>

        {/* Total and Actions Overlay */}
        {!isSoldOut && quantity > 0 && (
          <Box
            sx={{
              p: 1.5,
              pt: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #e0d8c0',
                pt: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"Caveat", cursive',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                }}
              >
                Total:
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontFamily: '"Permanent Marker"', color: 'black' }}
              >
                ${total.toFixed(2)}
              </Typography>
            </Box>

            <FormControlLabel
              sx={{
                '& .MuiTypography-root': {
                  fontSize: '0.65rem',
                  fontFamily: '"Permanent Marker"',
                  color: 'text.secondary',
                },
              }}
              control={
                <Checkbox
                  size="small"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
              }
              label={
                <Typography variant="caption">
                  I accept the{' '}
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      setIsTermsOpen(true);
                    }}
                    style={{ textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    terms & conditions
                  </span>
                </Typography>
              }
            />

            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <MuiButton
                fullWidth
                variant="contained"
                size="small"
                onClick={() => onBuy(quantity)}
                disabled={disabled || isSoldOut || isLoading || !termsAccepted}
                sx={{
                  borderRadius: 1,
                  bgcolor: '#333',
                  '&:hover': { bgcolor: '#000', opacity: 0.9 },
                  fontSize: '0.7rem',
                }}
              >
                {isLoading ? '...' : 'BUY TICKET'}
              </MuiButton>
              <MuiButton
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => onOneClickBuy(quantity)}
                disabled={disabled || isSoldOut || isLoading || !termsAccepted}
                sx={{
                  borderRadius: 1,
                  borderColor: '#000',
                  color: '#000',
                  fontSize: '0.7rem',
                }}
              >
                Quick Buy
              </MuiButton>
            </Box>
          </Box>
        )}
      </Paper>
      <TermsDialog isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </Box>
  );
};
