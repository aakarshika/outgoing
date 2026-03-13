import { Box } from '@mui/material';
import { type ReactNode } from 'react';

export const SideEnvelope = ({ children }: { children: ReactNode }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        pr: { xs: 4, sm: 6 }, // slightly less padding so envelope shows more
      }}
    >
      {/* Envelope back */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          right: 40, // move envelope well into view from the right edge
          transform: 'translateY(-50%)',
          height: 430,
          width: 160, // slightly narrower so it doesn't cover too many cards
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '60px 0 0 60px',
            borderLeft: '3px solid rgb(201, 181, 141)',
            borderTop: '3px solid rgb(201, 181, 141)',
            borderBottom: '3px solid rgb(201, 181, 141)',
            backgroundImage:
              'linear-gradient(135deg, #f8f1df 0%, #e5d4b5 50%, #f3e5c6 100%)',
            boxShadow:
              '0 18px 32px rgba(15,23,42,0.18), inset 0 2px 10px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}
        >
          {/* Subtle paper grain */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: 0.3,
              backgroundImage:
                'repeating-linear-gradient(135deg, rgba(255,255,255,0.4) 0, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 3px)',
              mixBlendMode: 'soft-light',
              pointerEvents: 'none',
            }}
          />

          {/* Airmail edge stripe */}
          <Box
            sx={{
              position: 'absolute',
              top: 22,
              bottom: 22,
              right: -2,
              width: 26,
              borderRadius: '999px',
              backgroundImage:
                'repeating-linear-gradient(135deg, #e11d48 0, #e11d48 6px, #1d4ed8 6px, #1d4ed8 12px)',
              boxShadow: 'inset 0 0 0 3px rgba(248, 250, 252, 0.9)',
            }}
          />
        </Box>
      </Box>

      {/* this is a horizontal list of items that are scrollable left and right.
          the envelope is shaped in a way that it feels they are coming out of the envelope.
          the envelope is rotated by 90 degrees to the right. */}

      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
        }}
      >
        {children}
      </Box>

      {/* Envelope front (raised lip) */}
      <Box
        sx={{
          position: 'absolute',
          right: 32, // shift lip left to match the envelope body
          top: '50%',
          transform: 'translateY(-50%)',
          height: 400,
          width: 96,
          mt: 1,
          bgcolor: 'rgba(248, 241, 223, 0.96)',
          borderLeft: '3px solid rgb(201, 181, 141)',
          borderTop: '3px solid rgb(201, 181, 141)',
          borderBottom: '3px solid rgb(201, 181, 141)',
          borderRadius: '32px 0 0 32px',
          boxShadow:
            '0 12px 24px rgba(15,23,42,0.22), inset 0 1px 4px rgba(0,0,0,0.12)',
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Soft diagonal highlight */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0) 40%)',
            opacity: 0.7,
          }}
        />

        {/* Circular seal */}
        <Box
          sx={{
            position: 'absolute',
            left: -26,
            bottom: '50%',
            transform: 'translateY(50%)',
            width: 60,
            height: 60,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 30% 20%, #fecaca, #dc2626 60%, #7f1d1d 100%)',
            boxShadow:
              '0 10px 18px rgba(127,29,29,0.45), inset 0 1px 3px rgba(254,242,242,0.7)',
            border: '3px solid rgba(248, 250, 252, 0.9)',
          }}
        />
      </Box>
    </Box>
  );
};