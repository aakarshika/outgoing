import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

export const CuteTimer = ({ targetDate }: { targetDate: string }) => {
    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

    useEffect(() => {
        const calculate = () => {
            const now = new Date();
            const target = new Date(targetDate);
            const diff = target.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
                return;
            }

            setTimeLeft({
                d: Math.floor(diff / (1000 * 60 * 60 * 24)),
                h: Math.floor((diff / (1000 * 60 * 60)) % 24),
                m: Math.floor((diff / 1000 / 60) % 60),
                s: Math.floor((diff / 1000) % 60),
            });
        };
        calculate();
        const interval = setInterval(calculate, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    const colors = [
        { bg: '#fef08a', border: '#ca8a04', text: '#854d0e' }, // Yellow
        { bg: '#fecdd3', border: '#e11d48', text: '#9f1239' }, // Pink
        { bg: '#bfdbfe', border: '#2563eb', text: '#1e3a8a' }, // Blue
        { bg: '#bbf7d0', border: '#16a34a', text: '#14532d' }, // Green
    ];

    return (
        <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
            {Object.entries(timeLeft).map(([unit, value], index) => {
                const color = colors[index % colors.length];
                return (
                    <Box
                        key={unit}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            animation: `pulse ${2 + index * 0.5}s infinite alternate`,
                            '@keyframes pulse': {
                                '0%': { transform: 'scale(1)' },
                                '100%': { transform: 'scale(1.05)' },
                            },
                        }}
                    >
                        <Box
                            sx={{
                                width: 38,
                                height: 38,
                                borderRadius: index % 2 === 0 ? '40% 60% 70% 30% / 40% 50% 60% 50%' : '50% 50% 30% 70% / 50% 40% 60% 50%',
                                border: `2px solid ${color.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: color.bg,
                                transform: `rotate(${Math.random() * 10 - 5}deg)`,
                                boxShadow: '2px 3px 0px rgba(0,0,0,0.15)',
                                position: 'relative',
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: '10%',
                                    right: '15%',
                                    width: '20%',
                                    height: '20%',
                                    bgcolor: 'rgba(255,255,255,0.6)',
                                    borderRadius: '50%',
                                }
                            }}
                        >
                            <Typography sx={{ fontFamily: '"Fredoka One", cursive', fontSize: '1.2rem', color: color.text }}>
                                {value}
                            </Typography>
                        </Box>
                        <Typography
                            sx={{
                                fontSize: '0.65rem',
                                fontFamily: '"Caveat", cursive',
                                mt: 0.5,
                                fontWeight: 'bold',
                                color: 'text.secondary',
                                letterSpacing: 1,
                                textTransform: 'uppercase',
                            }}
                        >
                            {unit === 'd' ? 'days' : unit === 'h' ? 'hrs' : unit === 'm' ? 'min' : 'sec'}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
};
