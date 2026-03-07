import { Typography, Box } from '@mui/material';
import React, { useMemo } from 'react';
import UserIcon from 'lucide-react/dist/esm/icons/user';

interface CapacityInfographicProps {
  capacity: number;
  filled: number;
  startDate?: string;
}

export const CapacityInfographic = ({
  capacity,
  filled,
  startDate,
}: CapacityInfographicProps) => {
  const percentage = Math.min(100, Math.round((filled / capacity) * 100));
  const rotation = useMemo(() => (Math.random() * 4 - 2).toFixed(1), []);

  const MAX_VISUAL_SEATS = 20;
  const isCapped = capacity > MAX_VISUAL_SEATS;
  const totalVisualSeats = isCapped ? MAX_VISUAL_SEATS : capacity;
  const filledVisualSeats = isCapped
    ? Math.round((filled / capacity) * MAX_VISUAL_SEATS)
    : filled;

  const getDaysLeftText = () => {
    if (!startDate || percentage >= 100) return null;
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
        p: 3,
        bgcolor: '#fff',
        border: '2px solid #333',
        borderRadius: '8px',
        boxShadow: '4px 4px 0px #333',
        transform: `rotate(${rotation}deg)`,
        maxWidth: 280,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Caveat", cursive',
      }}
    >
      {/* Background Texture */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(#eee 1px, transparent 0)',
          backgroundSize: '10px 10px',
          opacity: 0.5,
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography
          sx={{
            fontFamily: '"Permanent Marker"',
            fontSize: '1.2rem',
            mb: 2,
            textAlign: 'center',
            color: '#ef4444',
            transform: 'rotate(-2deg)',
          }}
        >
          ATTENDANCE
        </Typography>

        {/* Visual Seats Grid */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            justifyContent: 'center',
            mb: 2,
            px: 1,
            position: 'relative',
          }}
        >
          {percentage >= 100 && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-10deg)',
                bgcolor: '#ef4444',
                color: 'white',
                px: 2,
                py: 0.5,
                border: '3px solid #fff',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                fontFamily: '"Permanent Marker"',
                fontSize: '1.4rem',
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
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: isFilled ? '#3b82f6' : '#e5e7eb', // Blue for filled, Gray for empty
                  border: '2px solid',
                  borderColor: isFilled ? '#1d4ed8' : '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `rotate(${Math.random() * 20 - 10}deg)`,
                  boxShadow: isFilled ? '1px 1px 0px rgba(0,0,0,0.2)' : 'none',
                }}
              >
                <UserIcon
                  size={14}
                  color={isFilled ? 'white' : '#9ca3af'}
                  strokeWidth={isFilled ? 2.5 : 2}
                />
              </Box>
            );
          })}
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '2px dashed #ccc',
            pt: 1.5,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#666' }}>
              FILLED
            </Typography>
            <Typography sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.4rem' }}>
              {filled}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontFamily: '"Caveat", cursive',
              fontSize: '1.1rem',
              color: '#666',
              mx: 1,
            }}
          >
            out of
          </Typography>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#666' }}>
              TOTAL
            </Typography>
            <Typography sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.4rem' }}>
              {capacity}
            </Typography>
          </Box>
        </Box>

        {daysLeftText && (
          <Typography
            sx={{
              mt: 2,
              fontFamily: '"Caveat", cursive',
              fontSize: '1.1rem',
              color: '#d97706', // amber-600
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
