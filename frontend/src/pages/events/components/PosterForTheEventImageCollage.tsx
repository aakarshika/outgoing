import { Box, Typography } from '@mui/material';
import zIndex from 'node_modules/@mui/material/esm/styles/zIndex';

const SCRAPBOOK_BORDER = '1px dashed #e0d8c0';
const SCRAPBOOK_PAPER = '#fff9e6';
const SCRAPBOOK_SHADOW = '4px 4px 10px rgba(0,0,0,0.1)';

interface PosterProps {
  imageUrl: string;
  title: string;
}

export const PosterForTheEventImageCollage = ({ imageUrl, title }: PosterProps) => {
  if (!imageUrl) return null;

  // "Crazy scissor" cut effect using polygon clip-path
  const scissorCutPath =
    'polygon(0% 0%, 100% 0%, 100% 15%, 92% 25%, 100% 35%, 92% 45%, 100% 55%, 92% 65%, 100% 75%, 92% 85%, 100% 95%, 100% 100%, 0% 100%, 0% 95%, 8% 85%, 0% 75%, 8% 65%, 0% 55%, 8% 45%, 0% 35%, 8% 25%, 0% 15%)';

  return (
    <Box
      sx={{
        width: '100%',
        aspectRatio: { xs: '4/3', md: '16/9' },
        position: 'relative',
        margin: '0 auto',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '350px',
          position: 'absolute',
          padding: 4,
          bgcolor: SCRAPBOOK_PAPER,
          border: '1px solid rgba(224, 216, 192, 0)',
          boxShadow: SCRAPBOOK_SHADOW,
          overflow: 'hidden',
          backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
          backgroundSize: '20px 20px',
          transform: 'rotate(3deg) scale(0.97)',
        }}
      ></Box>
      {/* Scissor-Cut Image Container */}
      <Box
        sx={{
          width: '100%',
          aspectRatio: '4/3',
          position: 'absolute',
          filter: 'drop-shadow(3px 3px 5px rgba(0,0,0,0.2))', // better than boxShadow for clip-path
          p: 1, // small padding to show the shadow around the jagged edge
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            clipPath: scissorCutPath,
            bgcolor: '#eee',
            transform: 'rotate(8deg)',
            zIndex: 30,
          }}
        >
          <img
            src={imageUrl}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>
      </Box>

    </Box>
  );
};
