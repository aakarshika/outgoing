import { useNavigate } from 'react-router-dom';
import { VendorBusinessCard } from '@/components/ui/VendorBusinessCard';
import {
    Box,
    Button as MuiButton,
    Paper,
    Typography
} from '@mui/material';
export const ClassifiedAd = ({
    need,
    onInquire,
    isEligible = false,
    isOpportunity = false,
}: {
    need: any;
    onInquire: (n: any) => void;
    isEligible?: boolean;
    isOpportunity?: boolean;
}) => {
    const navigate = useNavigate();
    const assigned_vendor = need.applications.find((app: any) => app.status === 'accepted');

    return (
        <Box sx={{ position: 'relative', width: '100%' }}>
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 2,
                    bgcolor: '#fdfdfd',
                    backgroundImage:
                        'linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px)',
                    border: '1px solid #333',
                    outline: '3px solid #fdfdfd',
                    position: 'relative',
                    opacity: need.status === 'filled' ? 0.3 : 1,
                    filter: need.status === 'filled' ? 'grayscale(0.8)' : 'none',
                    transform: `rotate(${(Math.random() * 2 - 1).toFixed(1)}deg)`,
                    pointerEvents: need.status === 'filled' ? 'none' : 'auto',
                    transition: 'all 0.3s ease',
                }}
            >
                <Typography
                    sx={{
                        fontFamily: '"Playfair Display", serif',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        borderBottom: '2px solid #333',
                        mb: 1,
                        fontSize: '1rem',
                        color: need.status === 'filled' ? '#999' : 'inherit',
                    }}
                >
                    <span style={{ fontFamily: '"Playfair Display", serif', fontWeight: 900, textTransform: 'uppercase' }}>HELP WANTED: </span>{need.title}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{ fontFamily: 'serif', fontStyle: 'italic', mb: 2, lineHeight: 1.4 }}
                >
                    {need.description}
                </Typography>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        mt: 0,
                    }}
                >
                    <Box>
                        <Typography sx={{ fontSize: '0.7rem', color: '#666', mb: 0.5 }}>
                            Criticality: {need.criticality}
                        </Typography>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                            Budget: ${need.budget_max || '???'}
                        </Typography>
                    </Box>
                    {need.status === 'open' &&
                        (isEligible ? (
                            <MuiButton
                                variant="outlined"
                                size="small"
                                onClick={() => onInquire(need)}
                                sx={{
                                    borderRadius: 0,
                                    borderColor: '#333',
                                    color: '#333',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    '&:hover': { bgcolor: '#333', color: '#fff' },
                                }}
                            >
                                SEND INQUIRY →
                            </MuiButton>
                        ) : isOpportunity ? (
                            <MuiButton
                                variant="outlined"
                                size="small"
                                onClick={() => navigate(`/vendors/create?category=${need.category}`)}
                                sx={{
                                    borderRadius: 0,
                                    borderColor: '#001708ff',
                                    color: '#001708ff',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    '&:hover': { bgcolor: '#16a34a', color: '#fff' },
                                }}
                            >
                                CREATE SERVICE →
                            </MuiButton>
                        ) : null)}
                </Box>
            </Paper>

            {need.status === 'open' && isOpportunity && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        px: 1.5,
                        py: 0.5,
                        border: '2px solid rgba(22, 163, 74, 0.6)',
                        borderRadius: '2px',
                        transform: 'rotate(3deg)',
                        pointerEvents: 'none',
                        zIndex: 2,
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: '"Permanent Marker", cursive',
                            fontSize: '0.65rem',
                            color: 'rgba(22, 163, 74, 0.8)',
                            letterSpacing: 2,
                            textTransform: 'uppercase',
                        }}
                    >
                        OPPORTUNITY
                    </Typography>
                </Box>
            )}

            {need.status === 'filled' && (
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        pointerEvents: 'none',
                    }}
                >
                    <Box
                        sx={{
                            transform: 'rotate(-3deg) scale(0.95)',
                            pointerEvents: 'auto',
                            filter: 'drop-shadow(5px 5px 15px rgba(0,0,0,0.2))',
                        }}
                    >
                        <VendorBusinessCard
                            vendor={{
                                vendor_name: assigned_vendor?.vendor_name || 'Assigned Vendor',
                                category: need.category,
                                avg_rating: 4.8,
                                event_count: 12,
                            }}
                            onClick={() => {
                                if (assigned_vendor.service) {
                                    navigate(`/services/${assigned_vendor.service}`);
                                }
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -10,
                                left: '50%',
                                transform: 'translateX(-50%) rotate(5deg)',
                                width: 50,
                                height: 18,
                                bgcolor: 'rgba(59, 130, 246, 0.5)',
                                borderRadius: '1px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            }}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
};