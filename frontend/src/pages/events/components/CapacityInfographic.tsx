import { Box, Typography } from '@mui/material';

export const CapacityInfographic = ({
    capacity,
    filled,
    variant = 'default',
}: {
    capacity: number;
    filled: number;
    variant?: 'default' | 'mini';
}) => {
    const percent = Math.min(100, (filled / capacity) * 100);
    const isMini = variant === 'mini';

    return (
        <Box sx={{ width: '100%', mb: isMini ? 1 : 4 }}>
            {!isMini && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography
                        variant="caption"
                        sx={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
                    >
                        crowd meter
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{ fontFamily: '"Permanent Marker"', color: 'text.secondary' }}
                    >
                        {filled}/{capacity}
                    </Typography>
                </Box>
            )}

            <Box
                sx={{
                    height: isMini ? 4 : 12,
                    bgcolor: 'rgba(0,0,0,0.05)',
                    borderRadius: 6,
                    position: 'relative',
                    overflow: 'hidden',
                    border: isMini ? 'none' : '1px solid #eee',
                }}
            >
                <Box
                    sx={{
                        height: '100%',
                        width: `${percent}%`,
                        bgcolor:
                            percent > 90
                                ? '#ef4444'
                                : percent > 70
                                    ? '#f59e0b'
                                    : 'primary.main',
                        transition: 'width 1s ease-out',
                        borderRadius: 6,
                    }}
                />
            </Box>

            {isMini && (
                <Typography
                    variant="caption"
                    sx={{
                        fontSize: '0.65rem',
                        fontFamily: 'serif',
                        fontStyle: 'italic',
                        color: 'text.disabled',
                        display: 'block',
                        textAlign: 'right',
                        mt: 0.5,
                    }}
                >
                    {capacity - filled} spots left
                </Typography>
            )}
        </Box>
    );
};
