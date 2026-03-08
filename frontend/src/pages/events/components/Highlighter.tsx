import { Box } from '@mui/material';
import React from 'react';

export const Highlighter = ({
    children,
    color,
}: {
    children: React.ReactNode;
    color?: string;
}) => (
    <Box
        component="span"
        sx={{
            position: 'relative',
            zIndex: 1,
            px: 0.5,
            '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '10%',
                left: 0,
                width: '100%',
                height: '40%',
                bgcolor: color || 'rgba(252, 211, 77, 0.5)',
                zIndex: -1,
                transform: 'rotate(-1deg)',
            },
        }}
    >
        {children}
    </Box>
);
