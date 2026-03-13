import { Box, Typography } from '@mui/material';
import { Camera } from 'lucide-react';

export const StarCutoutCard = () => {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: 280,
        p: 3,
        bgcolor: '#fde047', // Bright yellow
        clipPath:
          'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Box sx={{ mt: 4, mb: 1, color: '#854d0e' }}>
        <Camera size={40} />
      </Box>

      <Typography
        sx={{
          fontFamily: '"serif"',
          color: '#713f12',
          fontSize: '1.2rem',
          lineHeight: 1.1,
          px: 4,
        }}
      >
        Capture
        <br />
        Moments!
      </Typography>

      <Typography
        variant="body2"
        sx={{
          fontFamily: '"Caveat", cursive',
          fontSize: '1.1rem',
          color: '#854d0e',
          mt: 1,
          fontWeight: 'bold',
          px: 2,
        }}
      >
        Add highlights to completed events to verify your attendance and earn stars!
      </Typography>
    </Box>
  );
};
