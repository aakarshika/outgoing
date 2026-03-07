import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

// --- CTAs ---
export const CreateEventCTASection = () => (
  <Box
    sx={{
      px: { xs: 2, sm: 4, lg: 8 },
      py: 6,
      display: 'flex',
      justifyContent: 'center',
    }}
  >
    <Box
      component={Link}
      to="/events/create"
      sx={{
        maxWidth: 600,
        width: '100%',
        textDecoration: 'none',
        color: 'inherit',
        p: 4,
        bgcolor: '#fff',
        border: '1px solid #e5e7eb',
        boxShadow: '2px 4px 12px rgba(0,0,0,0.1)',
        transform: 'rotate(-1deg)',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        '&:hover': {
          transform: 'scale(1.02) rotate(0deg)',
          zIndex: 10,
          boxShadow: '4px 8px 24px rgba(0,0,0,0.15)',
        },
      }}
    >
      <Typography variant="h3" sx={{ mb: 2 }}>
        🎉
      </Typography>
      <Typography variant="h4" sx={{ fontFamily: '"Permanent Marker"', mb: 1 }}>
        Host an Event
      </Typography>
      <Typography variant="body1" sx={{ fontFamily: 'serif', mb: 3 }}>
        Turn your living room into the next big thing.
      </Typography>
      <Box
        sx={{
          bgcolor: '#3b82f6',
          color: '#fff',
          px: 4,
          py: 1.5,
          borderRadius: '4px',
          fontFamily: '"Permanent Marker"',
          fontSize: '1.2rem',
          boxShadow: '2px 3px 0px #1e3a8a',
        }}
      >
        Start Creating →
      </Box>
    </Box>
  </Box>
);

export const SignUpCTASection = () => (
  <Box
    sx={{
      px: { xs: 2, sm: 4, lg: 8 },
      py: 8,
      display: 'flex',
      justifyContent: 'center',
      bgcolor: '#f1ede4',
      borderTop: '2px dashed #9ca3af',
    }}
  >
    <Box
      component={Link}
      to="/signup"
      sx={{
        maxWidth: 500,
        width: '100%',
        textDecoration: 'none',
        color: '#1a1a1a',
        p: 4,
        bgcolor: '#fcd34d',
        border: '3px solid #1a1a1a',
        boxShadow: '4px 6px 0px #1a1a1a',
        transform: 'rotate(1deg)',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        '&:hover': {
          transform: 'translate(2px, 2px) rotate(1deg)',
          boxShadow: '2px 4px 0px #1a1a1a',
        },
      }}
    >
      <Typography variant="h4" sx={{ fontFamily: '"Permanent Marker"', mb: 3 }}>
        Join the Party! 🎈
      </Typography>
      <Box
        sx={{
          bgcolor: '#1a1a1a',
          color: '#fff',
          px: 4,
          py: 1.5,
          borderRadius: '4px',
          fontFamily: '"Permanent Marker"',
          fontSize: '1.1rem',
        }}
      >
        Sign Up Now
      </Box>
    </Box>
  </Box>
);
