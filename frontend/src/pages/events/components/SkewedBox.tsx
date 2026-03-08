import { Box } from '@mui/material';

export const SkewedBox = ({
  children,
  rotate = 0,
  bgcolor = 'white',
}: {
  children: React.ReactNode;
  rotate?: number;
  bgcolor?: string;
}) => (
  <Box
    sx={{
      display: 'inline-block',
      bgcolor,
      p: 0.5,
      px: 1,
      transform: `rotate(${rotate}deg)`,
      boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
      border: '1px solid #eee',
    }}
  >
    {children}
  </Box>
);
