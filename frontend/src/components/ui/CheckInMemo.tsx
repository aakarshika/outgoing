import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Info } from 'lucide-react';

interface CheckInMemoProps {
    instructions: string;
}

export const CheckInMemo = ({ instructions }: CheckInMemoProps) => {
    const rotation = React.useMemo(() => (Math.random() * 2 - 1).toFixed(1), []);

    return (
        <Paper elevation={2} sx={{
            p: 3,
            bgcolor: '#fef08a', // Yellow memo color
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)',
            backgroundSize: '100% 1.5rem',
            transform: `rotate(${rotation}deg)`,
            border: '1px solid #fde047',
            position: 'relative',
            maxWidth: '100%',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 40,
                height: 15,
                bgcolor: 'rgba(59, 130, 246, 0.4)', // Blue tape
                borderRadius: '1px',
                zIndex: 2
            }
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Info size={16} color="#854d0e" />
                <Typography sx={{
                    fontFamily: '"Permanent Marker"',
                    fontSize: '1rem',
                    color: '#854d0e',
                    letterSpacing: 0.5
                }}>
                    Check-in Instructions
                </Typography>
            </Box>

            <Typography sx={{
                fontFamily: 'serif',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                color: '#422006',
                whiteSpace: 'pre-wrap'
            }}>
                {instructions}
            </Typography>

            <Box sx={{
                position: 'absolute',
                bottom: 5,
                right: 10,
                opacity: 0.2,
                transform: 'rotate(-15deg)'
            }}>
                <Typography sx={{ fontFamily: '"Permanent Marker"', fontSize: '0.8rem' }}>TOP SECRET</Typography>
            </Box>
        </Paper>
    );
};
