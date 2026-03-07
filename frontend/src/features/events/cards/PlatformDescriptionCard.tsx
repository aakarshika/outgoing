import { Box, Typography } from '@mui/material';
import { Star } from 'lucide-react';

export const PlatformDescriptionCard = () => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 280,
        p: 3,
        bgcolor: '#f8fafc', // Very subtle slate/white paper
        backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
        backgroundSize: '16px 16px',
        boxShadow: '3px 4px 10px rgba(0,0,0,0.1)',
        transform: 'rotate(-2deg)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        border: '1px solid #e2e8f0',
        '&:hover': { zIndex: 5, transform: 'scale(1.02) rotate(-1deg)' },
        transition: 'all 0.3s ease',
      }}
    >
      {/* Top Tape */}
      <Box
        sx={{
          position: 'absolute',
          top: -12,
          left: '20%',
          width: 70,
          height: 25,
          bgcolor: 'rgba(239, 68, 68, 0.4)', // Red tape
          transform: 'rotate(5deg)',
          zIndex: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      />

      <Typography
        variant="h5"
        sx={{
          fontFamily: '"Permanent Marker"',
          color: '#0f172a',
          mb: 2,
          transform: 'rotate(-2deg)',
        }}
      >
        What is Outgoing?
      </Typography>

      <Typography
        variant="body1"
        sx={{
          fontFamily: '"Caveat", cursive',
          fontSize: '1.4rem',
          lineHeight: 1.3,
          color: '#334155',
          transform: 'rotate(1deg)',
        }}
      >
        We believe your living room, your backyard, or that rooftop you found is the
        best venue in the city.
      </Typography>

      <Typography
        variant="body1"
        sx={{
          fontFamily: '"Caveat", cursive',
          fontSize: '1.4rem',
          lineHeight: 1.3,
          color: '#334155',
          mt: 2,
          transform: 'rotate(1deg)',
        }}
      >
        We connect people who love hosting with the talent to make it happen. Stop
        searching, start doing!
      </Typography>

      <Box
        sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-end', opacity: 0.6 }}
      >
        <Star size={24} fill="#fbbf24" color="#d97706" />
        <Star size={24} fill="#fbbf24" color="#d97706" />
        <Star size={24} fill="#fbbf24" color="#d97706" />
      </Box>
    </Box>
  );
};
