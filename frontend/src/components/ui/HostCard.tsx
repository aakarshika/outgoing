import { Box, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Media } from '@/components/ui/media';

interface HostCardProps {
  host: {
    username: string;
    avatar: string | null;
  };
  rating?: number;
  tag?: string;
  rotation?: number;
}

export const HostCard = ({
  host,
  rating,
  tag = 'Vibe Architect',
  rotation: customRotation,
}: HostCardProps) => {
  const grade = rating
    ? rating >= 4.8
      ? 'A+'
      : rating >= 4.5
        ? 'A'
        : rating >= 4.0
          ? 'B+'
          : 'B'
    : 'A';
  const rotation = useMemo(
    () => customRotation ?? (Math.random() * 4 - 2).toFixed(1),
    [customRotation],
  );
  const navigate = useNavigate();
  return (
    <Box
      onClick={() => {
        navigate(`/user/${host.username}`);
      }}
      sx={{
        position: 'relative',
        p: 3,
        bgcolor: '#fff9e6', // Warmer, more vibrant paper color
        backgroundImage: `
                linear-gradient(rgba(255,165,0,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,165,0,0.05) 1px, transparent 1px)
            `,
        backgroundSize: '20px 20px',
        boxShadow: '3px 6px 15px rgba(0,0,0,0.12)',
        transform: `rotate(${rotation}deg)`,
        maxWidth: 240,
        border: '2px solid #e0d8c0',
        borderRadius: '4px',
        display: 'inline-block',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 4,
          border: '2px dashed rgba(255,165,0,0.3)',
          borderRadius: '2px',
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box
          sx={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '4px solid white',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            mb: 1.5,
            zIndex: 30,
            position: 'relative',
            bgcolor: '#eee',
            transform: 'scale(1.52) translateY(-1rem)',
          }}
        >
          <Media
            src={host.avatar || undefined}
            alt={host.username}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>

        <Typography
          sx={{
            fontFamily: '"Permanent Marker"',
            fontSize: '1.2rem',
            color: '#333',
            lineHeight: 1,
            mb: 1,
          }}
        >
          @{host.username}
        </Typography>

        <Box
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}
        >
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              bgcolor: '#ec4899', // Pink accent
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              letterSpacing: 1,
              borderRadius: '12px',
              transform: 'rotate(-2deg)',
            }}
          >
            GRADE: {grade}
          </Box>
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              bgcolor: '#fcd34d', // Yellow accent
              color: '#b45309',
              fontSize: '0.8rem',
              fontFamily: '"Caveat"',
              fontWeight: 'bold',
              borderRadius: '12px',
              transform: 'rotate(1deg)',
            }}
          >
            {tag}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
