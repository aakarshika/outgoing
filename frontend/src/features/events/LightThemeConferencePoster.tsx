import { Box, keyframes, Stack, Typography } from '@mui/material';
import { ArrowDown, Circle, MessageSquare, Mic, Square } from 'lucide-react';

import { EventListItem } from '@/types/events';

import {
  MainInfoTimeLocationBox,
  OnlineTimeLocationBox,
} from './EventItemUIComponents';

/**
 * LightThemeConferencePoster
 *
 * A high-fidelity, light-themed reproduction of the "Online conference" poster.
 * Uses a soft gray and purple palette with vibrant green/teal accents.
 * Just UI, no data.
 */

const float = keyframes`
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(15px, -15px); }
  50% { transform: translate(0, -30px); }
  75% { transform: translate(-15px, -15px); }
`;

const shadowBehavior = keyframes`
  0%, 100% { 
    transform: translateX(-50%) scale(1); 
    opacity: 0.4;
  }
  25% { 
    transform: translateX(-30%) scale(0.8); 
    opacity: 0.3;
  }
  50% { 
    transform: translateX(-50%) scale(0.65); 
    opacity: 0.2;
  }
  75% { 
    transform: translateX(-70%) scale(0.8); 
    opacity: 0.3;
  }
`;

export const LightThemeConferencePoster = ({ event }: { event: EventListItem }) => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        bgcolor: 'transparent', // slate-50
        overflow: 'hidden',
        color: '#1e293b', // slate-800
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background Patterns */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: 0.0,
          background: `
            radial-gradient(#cbd5e1 0.5px, transparent 0.5px) 0 0 / 20px 20px,
            repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(203, 213, 225, 0.1) 10px, rgba(203, 213, 225, 0.1) 11px)
          `,
        }}
      />

      {/* Top Left Decoration: Speech Bubbles */}
      <Box sx={{ position: 'relative', mb: 2 }}>
        <Box sx={{ position: 'absolute', top: 30, left: 45, zIndex: 2 }}>
          <MessageSquare size={32} color="#10b981" fill="#10b981" />
        </Box>
        <Box sx={{ position: 'absolute', top: 70, left: -10, zIndex: 1 }}>
          <MessageSquare size={40} color="#059669" fill="#059669" />
        </Box>
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 12,
          height: 12,
          borderTop: '2px solid white',
          borderRight: '2px solid white',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          width: 12,
          height: 12,
          borderBottom: '2px solid white',
          borderLeft: '2px solid white',
        }}
      />

      {/* Main Center Content */}
      <Box
        sx={{
          aspectRatio: '1 / 1',
          position: 'relative',
          height: '100%',
          mt: 4,
          bgcolor: 'rgba(231, 208, 255, 0.2)', // purple-300 with transparency
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          p: 4,
          zIndex: 3,
          boxShadow: '15px 15px 30px rgba(168, 85, 247, 0.15)',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: '2px solid rgba(255,255,255,0.3)',
            m: 1,
          },
        }}
      >
        {/* Corner Brackets */}
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            width: 12,
            height: 12,
            borderTop: '2px solid white',
            borderLeft: '2px solid white',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            width: 12,
            height: 12,
            borderBottom: '2px solid white',
            borderRight: '2px solid white',
          }}
        />

        <Typography
          sx={{
            letterSpacing: '0.2em',
            fontWeight: 700,
            color: '#6d28d9',
            fontSize: '0.9rem',
          }}
        >
          «{event?.title}»
        </Typography>

        <Box sx={{}}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#4c1d95' }}>
            @ host_name
          </Typography>
          <Typography
            sx={{
              color: '#5b21b6',
              fontSize: '0.75rem',
              lineHeight: 1.4,
              mt: 1,
              maxWidth: '100%',
            }}
          >
            {event?.description}
          </Typography>
        </Box>

        <Box
          sx={{
            mt: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            pt: 2,
          }}
        >
          <OnlineTimeLocationBox />
        </Box>
      </Box>

      {/* Side Decorations (Floating) */}
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          right: '10%',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {/* Circular patterns */}
        <Box sx={{ position: 'relative', width: 80, height: 80 }}>
          <Circle size={80} color="#a78bfa" strokeWidth={1} />
          <Circle
            size={64}
            color="#a78bfa"
            strokeWidth={0.5}
            style={{ position: 'absolute', top: 8, left: 8 }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '30%',
              right: -15,
              width: 40,
              height: 12,
              bgcolor: '#c084fc',
              opacity: 0.6,
            }}
          />
        </Box>

        {/* Abstract squares */}
        <Stack spacing={0.8} sx={{ ml: 3 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#a78bfa' }} />
          <Box sx={{ width: 12, height: 12, bgcolor: '#c084fc' }} />
          <Box sx={{ width: 8, height: 8, bgcolor: '#4ade80' }} />
        </Stack>
      </Box>
      {/* Microphone Icon */}
      <Box sx={{ position: 'absolute', bottom: '15%', right: '15%', zIndex: 4 }}>
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Box sx={{ animation: `${float} 5s ease-in-out infinite` }}>
            <Mic size={48} color="#10b981" strokeWidth={1.5} />
          </Box>
          <Box
            sx={{
              position: 'absolute',
              bottom: -8,
              left: '50%',
              width: 52,
              height: 6,
              bgcolor: '#10b981',
              borderRadius: '50%',
              filter: 'blur(4px)',
              animation: `${shadowBehavior} 5s ease-in-out infinite`,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};
