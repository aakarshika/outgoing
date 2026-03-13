import { Box, Typography } from '@mui/material';
import { Briefcase, CalendarPlus, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UserActionCard = () => {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: 280,
        p: 3,
        bgcolor: '#ebf8ff', // Soft blue
        boxShadow: '3px 4px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        border: '2px dashed #93c5fd',
        borderRadius: '4px',
      }}
    >
      {/* Cute sticker */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          color: '#3b82f6',
          transform: 'rotate(15deg)',
        }}
      >
        <Sparkles size={28} />
      </Box>

      <Typography
        variant="h5"
        sx={{ fontFamily: '"serif"', color: '#1e3a8a', mb: 3 }}
      >
        Get Involved!
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box
          component={Link}
          to="/events/create"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            bgcolor: '#ffffff',
            borderRadius: 2,
            textDecoration: 'none',
            color: '#1e3a8a',
            boxShadow: '1px 2px 5px rgba(0,0,0,0.05)',
            '&:hover': { bgcolor: '#f0f9ff', transform: 'translateX(5px)' },
            transition: 'all 0.2s ease',
          }}
        >
          <Box sx={{ p: 1, bgcolor: '#dbeafe', borderRadius: '50%' }}>
            <CalendarPlus size={16} />
          </Box>
          <Typography
            sx={{ fontFamily: 'serif', fontWeight: 'bold', fontSize: '0.9rem' }}
          >
            Host a Party
          </Typography>
        </Box>

        <Box
          component={Link}
          to="/services/new"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            bgcolor: '#ffffff',
            borderRadius: 2,
            textDecoration: 'none',
            color: '#1e3a8a',
            boxShadow: '1px 2px 5px rgba(0,0,0,0.05)',
            '&:hover': { bgcolor: '#f0f9ff', transform: 'translateX(5px)' },
            transition: 'all 0.2s ease',
          }}
        >
          <Box sx={{ p: 1, bgcolor: '#dbeafe', borderRadius: '50%' }}>
            <Briefcase size={16} />
          </Box>
          <Typography
            sx={{ fontFamily: 'serif', fontWeight: 'bold', fontSize: '0.9rem' }}
          >
            Offer a Service
          </Typography>
        </Box>

        <Box
          component={Link}
          to="/requests"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            bgcolor: '#ffffff',
            borderRadius: 2,
            textDecoration: 'none',
            color: '#1e3a8a',
            boxShadow: '1px 2px 5px rgba(0,0,0,0.05)',
            '&:hover': { bgcolor: '#f0f9ff', transform: 'translateX(5px)' },
            transition: 'all 0.2s ease',
          }}
        >
          <Box sx={{ p: 1, bgcolor: '#dbeafe', borderRadius: '50%' }}>
            <Search size={16} />
          </Box>
          <Typography
            sx={{ fontFamily: 'serif', fontWeight: 'bold', fontSize: '0.9rem' }}
          >
            Find Ideas
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
