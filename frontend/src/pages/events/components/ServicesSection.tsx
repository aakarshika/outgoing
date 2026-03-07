import { Box, Typography, IconButton, Collapse, Avatar, Rating, Stack } from '@mui/material';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ClassifiedAd } from './scrapbookHelpers';
import { Grid } from '@mui/material';

export const ServicesSection = ({
    event,
    displayNeeds,
    myServicesResponse,
    isAuthenticated,
    navigate,
    setSelectedNeed,
    setIsApplyModalOpen,
    highlights = []
}: {
    event: any;
    displayNeeds: any[];
    myServicesResponse: any;
    isAuthenticated: boolean;
    navigate: any;
    setSelectedNeed: (n: any) => void;
    setIsApplyModalOpen: (v: boolean) => void;
    highlights?: any[];
}) => {
    const [isExpanded, setIsExpanded] = useState(() => {
        const saved = localStorage.getItem('services_section_expanded');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('services_section_expanded', JSON.stringify(isExpanded));
    }, [isExpanded]);

    const participatingVendors = event?.participating_vendors || [];

    if (displayNeeds.length === 0 && participatingVendors.length === 0) return null;

    const myServices = myServicesResponse?.data || [];
    const isCenter = highlights.length === 0;

    return (
        <Box sx={{ mt: 6 }}>
            {/* Services Header Toggle */}
            <Box
                onClick={() => setIsExpanded(!isExpanded)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCenter ? 'center' : 'space-between',
                    cursor: 'pointer',
                    mb: 2,
                    p: 1,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                    transition: 'background-color 0.2s'
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontFamily: '"Permanent Marker"',
                        fontSize: '1rem',
                    }}
                >
                    Service Providers
                </Typography>
                <IconButton size="small">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </IconButton>
            </Box>

            <Collapse in={isExpanded}>
                <Box>
                    {displayNeeds.length > 0 && (
                        <Grid container spacing={2}>
                            {displayNeeds.map((need: any) => {
                                const isEligible = myServices.some(
                                    (s: any) =>
                                        s.category.toLowerCase().includes(need.category.toLowerCase()) ||
                                        need.category.toLowerCase().includes(s.category.toLowerCase()),
                                );
                                const isOpportunity = isAuthenticated && !isEligible && need.status === 'open';
                                return (
                                    <Grid size={{ xs: 12, md: 6 }} key={need.id}>
                                        <ClassifiedAd
                                            need={need}
                                            isEligible={isEligible}
                                            isOpportunity={isOpportunity}
                                            onInquire={(n) => {
                                                setSelectedNeed(n);
                                                setIsApplyModalOpen(true);
                                            }}
                                            navigate={navigate}
                                        />
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
                </Box>
            </Collapse>

            <Collapse in={!isExpanded}>
                <Box>
                    {participatingVendors.length > 0 ? (
                        <Grid container spacing={2}>
                            {participatingVendors.map((vendor: any) => (
                                <Grid size={{ xs: 12, md: 6 }} key={vendor.id}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            p: 1.5,
                                            bgcolor: 'rgba(255,255,255,0.6)',
                                            borderRadius: 2,
                                            border: '1px dashed #ccc',
                                            transition: 'transform 0.2s',
                                            '&:hover': { transform: 'scale(1.02)' }
                                        }}
                                    >
                                        <Avatar
                                            src={vendor.vendor_avatar}
                                            sx={{ width: 40, height: 40, border: '1px solid #ddd' }}
                                        >
                                            {vendor.vendor_name?.[0]}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                {vendor.vendor_name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Rating
                                                    value={vendor.rating}
                                                    readOnly
                                                    size="small"
                                                    icon={<Star size={12} fill="currentColor" />}
                                                    emptyIcon={<Star size={12} />}
                                                />
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    ({vendor.rating})
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled', textAlign: isCenter ? 'center' : 'left' }}>
                            No services active yet...
                        </Typography>
                    )}
                </Box>
            </Collapse>
        </Box>
    );
};

