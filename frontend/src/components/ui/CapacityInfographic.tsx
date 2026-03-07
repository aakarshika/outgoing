import { Box, Typography } from '@mui/material';
import React from 'react';

interface CapacityInfographicProps {
  capacity: number;
  filled: number;
}

export const CapacityInfographic = ({ capacity, filled }: CapacityInfographicProps) => {
  const percentage = Math.min(100, Math.round((filled / capacity) * 100));
  const rotation = React.useMemo(() => (Math.random() * 4 - 2).toFixed(1), []);

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: '#fff',
        border: '2px solid #333',
        borderRadius: '4px',
        boxShadow: '4px 4px 0px #333',
        transform: `rotate(${rotation}deg)`,
        maxWidth: 240,
        position: 'relative',
        overflow: 'hidden',
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
            fontSize: '1rem',
            mb: 2,
            textAlign: 'center',
            color: '#ef4444',
          }}
        >
          CAPACITY MONITOR
        </Typography>

        <Box
          sx={{
            height: 12,
            width: '100%',
            bgcolor: '#eee',
            border: '1px solid #333',
            mb: 1.5,
            position: 'relative',
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${percentage}%`,
              bgcolor: percentage > 90 ? '#ef4444' : '#22c55e',
              transition: 'width 1s ease-in-out',
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#666' }}>
              FILLED
            </Typography>
            <Typography sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.2rem' }}>
              {filled}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#666' }}>
              TOTAL
            </Typography>
            <Typography sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.2rem' }}>
              {capacity}
            </Typography>
          </Box>
        </Box>

        {percentage >= 100 && (
          <Box
            sx={{
              mt: 2,
              p: 0.5,
              border: '2px double #ef4444',
              color: '#ef4444',
              textAlign: 'center',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              transform: 'rotate(-5deg)',
              fontSize: '0.8rem',
            }}
          >
            Sold Out!
          </Box>
        )}
      </Box>
    </Box>
  );
};
