import { Typography, Box } from '@mui/material';
import React, { useMemo } from 'react';
import { UserIcon } from 'lucide-react';

interface CapacityInfographicProps {
  capacity: number;
  filled: number;
  startDate?: string;
  variant?: 'default' | 'mini';
}

export const CapacityInfographic = ({
  capacity,
  filled,
  startDate,
  variant = 'default',
}: CapacityInfographicProps) => {
  const isMini = variant === 'mini';
  const percentage = Math.min(100, Math.round((filled / capacity) * 100));
  const rotation = useMemo(() => (Math.random() * 4 - 2).toFixed(1), []);

  const MAX_VISUAL_SEATS = isMini ? 10 : 20;
  const isCapped = capacity > MAX_VISUAL_SEATS;
  const totalVisualSeats = isCapped ? MAX_VISUAL_SEATS : capacity;
  const filledVisualSeats = isCapped
    ? Math.round((filled / capacity) * MAX_VISUAL_SEATS)
    : filled;

  const getDaysLeftText = () => {
    if (!startDate || percentage >= 100 || isMini) return null;
    const now = new Date();
    const target = new Date(startDate);
    const diffTime = target.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) return null;

    const remainingSeats = capacity - filled;
    return (
      <React.Fragment>
        {daysLeft} days left to fill{' '}
        <Typography
          component="span"
          sx={{
            fontFamily: '"Permanent Marker"',
            fontSize: '1.4rem',
            fontWeight: 'bold',
            mx: 0.5,
          }}
        >
          {remainingSeats}
        </Typography>{' '}
        seat{remainingSeats > 1 ? 's' : ''} for the event to take place!
      </React.Fragment>
    );
  };

  const daysLeftText = getDaysLeftText();

  return (
    <Box
      sx={{
        p: isMini ? 0 : 3,
        bgcolor: isMini ? 'transparent' : '#fff',
        border: isMini ? 'none' : '2px solid #333',
        borderRadius: isMini ? '0px' : '8px',
        boxShadow: isMini ? 'none' : '4px 4px 0px #333',
        transform: isMini ? 'none' : `rotate(${rotation}deg)`,
        maxWidth: isMini ? '100%' : 280,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Caveat", cursive',
      }}
    >
      {/* Background Texture - Only for default variant */}
      {!isMini && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(#eee 1px, transparent 0)',
            backgroundSize: '10px 10px',
            opacity: 0.5,
          }}
        />
      )}

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Visual Seats Grid */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: isMini ? 0.5 : 1,
            justifyContent: isMini ? 'flex-start' : 'center',
            position: 'relative',
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Permanent Marker"',
              fontSize: isMini ? '0.8rem' : '1.2rem',
              textAlign: isMini ? 'left' : 'center',
              color: '#ef4444',
              transform: isMini ? 'none' : 'rotate(-2deg)',
            }}
          >
            {isMini ? 'SOLD' : 'ATTENDANCE'}
          </Typography>

          {percentage >= 100 && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-10deg)',
                bgcolor: '#ef4444',
                color: 'white',
                px: isMini ? 1 : 2,
                border: isMini ? '1px solid #fff' : '3px solid #fff',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                fontFamily: '"Permanent Marker"',
                fontSize: isMini ? '0.8rem' : '1.4rem',
                whiteSpace: 'nowrap',
                zIndex: 10,
                pointerEvents: 'none',
                letterSpacing: 1,
              }}
            >
              FULL HOUSE
            </Box>
          )}
          {Array.from({ length: totalVisualSeats }).map((_, index) => {
            const isFilled = index < filledVisualSeats;
            return (
              <Box
                key={index}
                sx={{
                  width: isMini ? 12 : 24,
                  height: isMini ? 12 : 24,
                  borderRadius: '50%',
                  bgcolor: isFilled ? '#3b82f6' : '#e5e7eb',
                  border: isMini ? '1px solid' : '2px solid',
                  borderColor: isFilled ? '#1d4ed8' : '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isMini ? 'none' : `rotate(${Math.random() * 20 - 10}deg)`,
                  boxShadow: !isMini && isFilled ? '1px 1px 0px rgba(0,0,0,0.2)' : 'none',
                }}
              >
                <UserIcon
                  size={isMini ? 8 : 14}
                  color={isFilled ? 'white' : '#9ca3af'}
                  strokeWidth={isFilled ? 2.5 : 2}
                />
              </Box>
            );
          })}

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: isMini ? ' ' : '2px dashed #ccc',
              pt: isMini ? 0 : 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography sx={{ fontSize: isMini ? '0.6rem' : '0.8rem', fontWeight: 'bold', color: '#666' }}>
                {isMini ? '' : 'FILLED'}
              </Typography>
              <Typography sx={{ fontFamily: '"Permanent Marker"', fontSize: isMini ? '0.9rem' : '1.4rem' }}>
                {filled}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontFamily: '"Caveat", cursive',
                fontSize: isMini ? '0.7rem' : '1.1rem',
                color: '#666',
                mx: 0.5,
              }}
            >
              /
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography sx={{ fontFamily: '"Permanent Marker"', fontSize: isMini ? '0.9rem' : '1.4rem' }}>
                {capacity}
              </Typography>
            </Box>
          </Box>
        </Box>


        {daysLeftText && (
          <Typography
            sx={{
              mt: 2,
              fontFamily: '"Caveat", cursive',
              fontSize: '1.1rem',
              color: '#d97706',
              textAlign: 'center',
              lineHeight: 1.2,
              fontWeight: 600,
            }}
          >
            {daysLeftText}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
