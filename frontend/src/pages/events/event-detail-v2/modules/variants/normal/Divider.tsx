import { Box, Typography } from '@mui/material';

export function NormalDivider() {
  return (
    <Box
      sx={{
        height: 0.5,
        bgcolor: 'var(--color-border-tertiary, #e5e7eb)',
        mx: 2,
        my: 1.75,
      }}
    />
  );
}
