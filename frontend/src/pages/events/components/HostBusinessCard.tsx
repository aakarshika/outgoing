import { useNavigate } from 'react-router-dom';
import { VendorBusinessCard } from '@/components/ui/VendorBusinessCard';
import {
    Box,
    Button as MuiButton,
    Paper,
    Typography
} from '@mui/material';
import { Media } from '@/components/ui/media';

export const HostBusinessCard = ({
    host,
}: {
    host: any;
}) => {
    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: 320,
                aspectRatio: '1.75 / 1',
                bgcolor: '#f5f5f0', // Linen/Off-white (matches Vendor card)
                backgroundImage:
                    'repeating-linear-gradient(45deg, rgba(0,0,0,0.01) 0px, rgba(0,0,0,0.01) 2px, transparent 2px, transparent 4px)',
                border: '1px solid #d1d5db',
                boxShadow: '3px 3px 10px rgba(0,0,0,0.1)',
                position: 'relative',
                p: 2.5,
                mb: 2, // Match ClassifiedAd margin
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                transform: 'rotate(-3deg) scale(0.95)', // Match "filled" ad positioning
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                    transform: 'rotate(0deg) scale(1) translateY(-5px)',
                    boxShadow: '5px 5px 15px rgba(0,0,0,0.15)',
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 4,
                    border: '1px solid rgba(0,0,0,0.05)',
                    pointerEvents: 'none',
                },
            }
            }
        >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box
                    sx={
                        {
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            bgcolor: '#ddd',
                            flexShrink: 0,
                            border: '1px solid #ccc',
                            overflow: 'hidden',
                            boxShadow: 'inset 0 0 5px rgba(0,0,0,0.1)',
                            position: 'relative',
                        }
                    }
                >
                    {
                        host.avatar ? (
                            <Media src={host.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '1.5rem' }}>
                                👤
                            </Box>
                        )}
                </Box>
                < Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        sx={
                            {
                                fontFamily: '"Lora", serif',
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                color: '#1a1a1a',
                                lineHeight: 1.2,
                                mb: 0.5,
                                letterSpacing: '0.5px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }
                        }
                    >
                        {host.username}
                    </Typography>
                    < Typography
                        sx={{
                            fontFamily: '"Permanent Marker"',
                            fontSize: '0.75rem',
                            color: '#ef4444',
                            textTransform: 'uppercase',
                            mb: 1,
                        }}
                    >
                        Host & Curator
                    </Typography>
                    < Typography
                        sx={{ fontSize: '0.6rem', color: '#888', fontFamily: 'monospace' }}
                    >
                        JOI. 2026 - 11 EVENTS
                    </Typography>
                </Box>
            </Box>

            < Box
                sx={{
                    mt: 'auto',
                    borderTop: '1px solid rgba(0,0,0,0.05)',
                    pt: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                }}
            >
                <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: '#888', fontStyle: 'italic' }}>
                        Verified Outgoing™ Host
                    </Typography>
                    < Box sx={{ display: 'flex', color: '#fbbf24', fontSize: '1rem' }}>
                        {'★'.repeat(5)}
                    </Box>
                </Box>
                < Box
                    sx={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        border: '1px solid rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.4,
                        background: 'radial-gradient(circle, transparent 70%, rgba(0,0,0,0.05) 100%)',
                    }}
                >
                    <Typography
                        sx={{ fontSize: '0.45rem', fontWeight: 'bold', textAlign: 'center', color: '#ef4444' }}
                    >
                        HOST
                        < br />
                        SEAL
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};
