import { Box, Paper, Typography } from '@mui/material';

interface NormalCoverPhotoModuleProps {
  event: any;
}

export function NormalCoverPhotoModule({ event }: NormalCoverPhotoModuleProps) {
  if (!event.cover_image) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        mb: 3,
      }}
    >
      <Box
        component="img"
        src={event.cover_image}
        alt={event.title}
        sx={{
          width: '100%',
          height: 'auto',
          maxHeight: '400px',
          objectFit: 'cover',
        }}
      />
    </Paper>
  );
}
