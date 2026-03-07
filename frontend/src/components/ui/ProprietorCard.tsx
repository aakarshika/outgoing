import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { Media } from '@/components/ui/media';

interface ProprietorCardProps {
    vendor: {
        vendor_name: string;
        vendor_avatar: string | null;
    };
    rating?: number;
    tag?: string;
    rotation?: number;
}

export const ProprietorCard = ({ vendor, rating, tag = 'Certified Proprietor', rotation: customRotation }: ProprietorCardProps) => {
    const grade = rating ? (rating >= 4.8 ? 'A+' : rating >= 4.5 ? 'A' : rating >= 4.0 ? 'B+' : 'B') : 'A';
    const rotation = useMemo(() => customRotation ?? (Math.random() * 4 - 2).toFixed(1), [customRotation]);

    return (
        <Box sx={{
            position: 'relative',
            p: 3,
            bgcolor: '#fef3c7', // Aged yellow/manila folder color for vendors
            backgroundImage: `
                repeating-linear-gradient(45deg, rgba(0,0,0,0.01) 0, rgba(0,0,0,0.01) 1px, transparent 0, transparent 50%),
                repeating-linear-gradient(-45deg, rgba(0,0,0,0.01) 0, rgba(0,0,0,0.01) 1px, transparent 0, transparent 50%)
            `,
            backgroundSize: '4px 4px',
            boxShadow: '4px 6px 15px rgba(0,0,0,0.12)',
            transform: `rotate(${rotation}deg)`,
            maxWidth: 220,
            border: '1px solid #e2e8f0',
            borderRadius: '2px',
            display: 'inline-block',
            '&::after': {
                content: '""',
                position: 'absolute',
                inset: -3,
                border: '1px solid rgba(0,0,0,0.05)',
                pointerEvents: 'none'
            }
        }}>
            {/* Ink Stamp Effect */}
            <Box sx={{
                position: 'absolute',
                top: -10,
                right: -10,
                width: 60,
                height: 60,
                borderRadius: '50%',
                border: '4px double #991b1b',
                opacity: 0.3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(25deg)',
                color: '#991b1b',
                fontWeight: 'bold',
                fontSize: '0.6rem',
                textAlign: 'center',
                lineHeight: 1,
                zIndex: 0,
                pointerEvents: 'none'
            }}>
                LICENSED<br />VENDOR
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <Box sx={{
                    width: 100,
                    height: 100,
                    borderRadius: 0, // Squared for a more industrial/classified look
                    overflow: 'hidden',
                    border: '1px solid #1a1a1a',
                    p: 0.5,
                    bgcolor: '#fff',
                    mb: 1.5,
                    position: 'relative',
                }}>
                    <Media
                        src={vendor.vendor_avatar || undefined}
                        alt={vendor.vendor_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%) contrast(110%)' }}
                    />
                </Box>

                <Typography sx={{
                    fontFamily: '"Playfair Display", serif',
                    fontWeight: 900,
                    fontSize: '1.4rem',
                    color: '#1a1a1a',
                    lineHeight: 1,
                    mb: 0.5,
                    textTransform: 'uppercase'
                }}>
                    {vendor.vendor_name}
                </Typography>

                <Typography sx={{
                    fontFamily: '"Courier New", Courier, monospace',
                    fontSize: '0.7rem',
                    color: '#666',
                    mb: 1.5,
                    fontWeight: 'bold'
                }}>
                    ID: V-{1000 + Math.floor(Math.random() * 9000)}
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                    <Box sx={{
                        px: 1, py: 0.2,
                        bgcolor: '#1a1a1a',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        letterSpacing: 1
                    }}>
                        RATING: {grade}
                    </Box>
                    <Box sx={{
                        px: 1, py: 0.2,
                        border: '1px solid #1a1a1a',
                        fontSize: '0.7rem',
                        fontFamily: 'serif',
                        fontWeight: 'bold',
                        color: '#1a1a1a',
                        textTransform: 'uppercase'
                    }}>
                        {tag}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};
