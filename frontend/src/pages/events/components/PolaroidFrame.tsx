import { Box, Paper, Typography } from '@mui/material';
import { useMemo } from 'react';

import { Media } from '@/components/ui/media';

import { Hostname } from './Hostname';

const PhotoClip = () => (
  <Box
    sx={{
      position: 'absolute',
      top: -15,
      left: '50%',
      width: 14,
      height: 35,
      bgcolor: '#E8D5B5', // Wood/Bamboo peg color
      border: '1px solid rgba(0,0,0,0.1)',
      borderRadius: '2px',
      zIndex: 40, // Above everything
      boxShadow: '1px 2px 4px rgba(0,0,0,0.1)',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 8,
        left: 0,
        right: 0,
        height: '2px',
        bgcolor: 'rgba(0,0,0,0.15)',
      },
    }}
  />
);

export const PolaroidFrame = ({
  src,
  caption,
  author,
  type = 'image',
  rotation,
  rotationhover,
  showClip = false,
  isFocused = false,
  disableHover = false,
}: {
  src?: string | null;
  caption?: string;
  author?: string;
  type?: 'image' | 'video';
  rotation?: number;
  rotationhover?: number;
  showClip?: boolean;
  isFocused?: boolean;
  disableHover?: boolean;
}) => {
  const baseRotation = useMemo(() => rotation ?? (Math.random() * 8 - 4), [rotation]);
  const hoverRotation = useMemo(
    () => (rotationhover !== undefined ? rotationhover : baseRotation + (1 + Math.random() * 2)),
    [rotationhover, baseRotation],
  );

  return (
    <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      {/* {showClip && (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40 }}>
          <PhotoClip />
        </Box>
      )} */}
      <Paper
        elevation={3}
        className="polaroid-body"
        sx={{
          p: 1.5,
          pb: 6,
          bgcolor: 'white',
          position: 'relative',
          maxWidth: '100%',
          border: '1px solid #efefef',
          transformOrigin: 'top center',
          transform: `rotate(${baseRotation}deg)`,
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: disableHover ? 'none' : `rotate(${hoverRotation}deg)`,
          },
        }}
      >
        <Box
          sx={{
            aspectRatio: '1/1',
            bgcolor: '#f0f0f0',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {type === 'video' ? (
            <Media
              type="video"
              src={src || undefined}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <Media src={src || undefined} className="w-full h-full object-cover" />
          )}
        </Box>
        {caption && (
          <Typography
            sx={{
              fontFamily: '"Permanent Marker", cursive',
              fontSize: '1rem',
              mt: 0,
              textAlign: 'center',
              lineClamp: 2,
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
            }}
          >
            {caption}
          </Typography>
        )}
        {author && (
          <Typography
            variant="caption"
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              mt: 1,
              color: 'text.secondary',
            }}
          >
            — <Hostname username={author} mode="simple" />
          </Typography>
        )}
      </Paper>
    </Box>
  );
};
