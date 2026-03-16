import { Avatar, Box, Typography } from '@mui/material';
import type { MouseEvent } from 'react';

export const TinyBusinessCard = ({
  name,
  avatar,
  onClick,
  subtitle = 'Filled by',
}: {
  name: string;
  avatar: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  subtitle?: string;
}) => {
  return (
    <Box
      component={onClick ? 'button' : 'div'}
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 1,
        backgroundColor: '#e8ffff',
        border: '2px solid #00CCCC',
        borderRadius: '8px',
        boxShadow: '4px 5px #00CCCC',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: '"Caveat", cursive',
        textAlign: 'left',
        minWidth: 140,
        '&:hover': onClick
          ? {
              transform: 'translate(-1px, -1px)',
              boxShadow: '6px 7px #00CCCC',
            }
          : {},
      }}
    >
      <Avatar src={avatar} sx={{ width: 26, height: 26, border: '2px solid #fff' }} />
      <Box>
        <Typography
          variant="body2"
          sx={{ fontSize: '0.65rem', color: '#6b5b4a', lineHeight: 1 }}
        >
          {subtitle}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#2b2b2b' }}>
          {name}
        </Typography>
      </Box>
    </Box>
  );
};
