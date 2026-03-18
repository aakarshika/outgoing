import { Box, Button, Typography } from '@mui/material';
import { ArrowRight, Lightbulb, Sparkle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MyHomeActionsSection() {
  return (
    <>
      <Box
        sx={{
          borderRadius: '30px',
          p: { xs: 2.2, sm: 2.8 },
          background:
            'linear-gradient(135deg, rgba(255,247,236,0.95) 0%, rgba(255,255,255,0.96) 100%)',
          border: '1px solid rgba(143, 105, 66, 0.12)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '18px',
            display: 'grid',
            placeItems: 'center',
            background: '#FAECE7',
            color: '#D85A30',
            flexShrink: 0,
          }}
        >
          <Sparkle size={24} />
        </Box>
        <Button
          component={Link}
          to="/search?tab=trending"
          variant="contained"
          endIcon={<ArrowRight size={16} />}
          sx={{
            minHeight: 44,
            px: 2.2,
            color: '#5c4138',
            borderRadius: '999px',
            textTransform: 'none',
            fontWeight: 700,
            background: '#fcf5f1',
            boxShadow: 'none',
            '&:hover': { background: '#e4dcd9', boxShadow: 'none' },
          }}
        >
          Browse more events
        </Button>
      </Box>
      <Box
        sx={{
          borderRadius: '30px',
          p: { xs: 2.2, sm: 2.8 },
          background:
            'linear-gradient(135deg, rgba(255,247,236,0.95) 0%, rgba(255,255,255,0.96) 100%)',
          border: '1px solid rgba(143, 105, 66, 0.12)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '18px',
            display: 'grid',
            placeItems: 'center',
            background: '#FAECE7',
            color: '#D85A30',
            flexShrink: 0,
          }}
        >
          <Lightbulb size={24} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 18,
              fontWeight: 800,
              color: '#2B2118',
            }}
          >
            Got an idea for an event?
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              fontSize: 14,
              color: 'rgba(66, 50, 28, 0.72)',
              maxWidth: 640,
            }}
          >
            Post it, find contributors, and let your community build it with you.
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/events/create"
          variant="contained"
          endIcon={<ArrowRight size={16} />}
          sx={{
            minHeight: 44,
            px: 2.2,
            borderRadius: '999px',
            textTransform: 'none',
            fontWeight: 700,
            background: '#D85A30',
            boxShadow: 'none',
            '&:hover': { background: '#C24E27', boxShadow: 'none' },
          }}
        >
          Start an event
        </Button>
      </Box>
    </>
  );
}

