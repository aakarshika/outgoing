import React, { ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';

interface FallbackBoxProps {
  title: string;
  description: string;
  icon: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function FallbackBox({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: FallbackBoxProps) {
  return (
    <Box
      sx={{
        p: 6,
        textAlign: 'center',
        background: 'linear-gradient(135deg, #FFF9F7 0%, #FAF6F0 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(216, 90, 48, 0.1)',
        boxShadow: '0 10px 30px rgba(43, 33, 24, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2.5,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle, rgba(216, 90, 48, 0.03) 0%, transparent 70%)',
          zIndex: 0,
        }
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '20px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 16px rgba(216, 90, 48, 0.08)',
          zIndex: 1,
          border: '1px solid rgba(216, 90, 48, 0.05)'
        }}
      >
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { 
          size: 32, 
          color: "#D85A30", 
          strokeWidth: 1.5 
        }) : icon}
      </Box>

      <Box sx={{ zIndex: 1 }}>
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 22,
            fontWeight: 800,
            color: '#1A1A1A',
            mb: 1
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: 14,
            color: '#888780',
            maxWidth: '300px',
            lineHeight: 1.6,
            mx: 'auto'
          }}
        >
          {description}
        </Typography>
      </Box>

      {actionLabel && onAction && (
        <Button
          variant="contained"
          disableElevation
          onClick={(e) => {
            e.stopPropagation();
            onAction();
          }}
          sx={{
            bgcolor: '#D85A30',
            color: '#fff',
            textTransform: 'none',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: 14,
            px: 3,
            py: 1.2,
            borderRadius: '12px',
            zIndex: 1,
            '&:hover': {
              bgcolor: '#BF4A25',
              boxShadow: '0 4px 12px rgba(216, 90, 48, 0.2)'
            }
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
