import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';

export const CuteTimer = ({ targetDate }: { targetDate: string }) => {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    React.useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = new Date(targetDate).getTime() - now;

            if (distance < 0) {
                clearInterval(timer);
                setTimeLeft(null);
            } else {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor(
                        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
                    ),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000),
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) return null;

    return (
        <Box
            sx={{
                display: 'inline-flex',
                gap: 1.5,
                p: 1.5,
                bgcolor: 'rgba(59, 130, 246, 0.08)',
                borderRadius: '8px',
                border: '1.5px dashed rgba(59, 130, 246, 0.3)',
                transform: 'rotate(-1deg)',
            }}
        >
            {[
                { val: timeLeft.days, label: 'days' },
                { val: timeLeft.hours, label: 'hrs' },
                { val: timeLeft.minutes, label: 'min' },
                { val: timeLeft.seconds, label: 'sec' },
            ].map((unit, idx) => (
                <React.Fragment key={unit.label}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography
                            sx={{
                                fontFamily: '"Permanent Marker"',
                                lineHeight: 1,
                                fontSize: '1.1rem',
                                color: '#1e40af',
                            }}
                        >
                            {unit.val.toString().padStart(2, '0')}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                fontFamily: 'serif',
                                fontSize: '0.6rem',
                                fontStyle: 'italic',
                                color: '#60a5fa',
                                display: 'block',
                            }}
                        >
                            {unit.label}
                        </Typography>
                    </Box>
                    {idx < 3 && (
                        <Typography
                            sx={{ fontFamily: '"Permanent Marker"', color: '#60a5fa' }}
                        >
                            :
                        </Typography>
                    )}
                </React.Fragment>
            ))}
        </Box>
    );
};
