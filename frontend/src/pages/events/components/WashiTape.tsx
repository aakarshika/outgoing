import { Box } from '@mui/material';

export const WashiTape = ({
  color,
  rotate,
  width = 120,
}: {
  color?: string;
  rotate?: string;
  width?: number | string;
}) => (
  <Box
    sx={{
      width,
      height: 35,
      bgcolor: color || 'rgba(252, 211, 77, 0.4)',
      transform: `rotate(${rotate || '3deg'})`,
      position: 'absolute',
      top: -15,
      left: '50%',
      marginLeft: typeof width === 'number' ? -width / 2 : '-60px',
      zIndex: 20,
      opacity: 0.7,
      boxShadow: '1px 1px 2px rgba(0,0,0,0.1)',
      '&::before, &::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 10,
        background:
          'linear-gradient(90deg, transparent, transparent 50%, #fff 50%, #fff)',
        backgroundSize: '4px 100%',
      },
      '&::before': { left: -2 },
      '&::after': { right: -2 },
    }}
  />
);
