import { Box, Paper, Typography } from '@mui/material';

import { Media } from '@/components/ui/media';

import { Hostname } from './Hostname';

export const PolaroidFrame = ({
  src,
  caption,
  author,
  type = 'image',
  rotation,
}: {
  src?: string | null;
  caption?: string;
  author?: string;
  type?: 'image' | 'video';
  rotation?: number;
}) => {
  const rot = rotation ?? Math.random() * 8 - 4;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 1.5,
        pb: 6,
        bgcolor: 'white',
        transform: `rotate(${rot}deg)`,
        transition: 'transform 0.3s ease',
        '&:hover': { transform: 'scale(1.05) rotate(0deg)', zIndex: 10 },
        maxWidth: '100%',
        border: '1px solid #efefef',
        position: 'relative',
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
  );
};
