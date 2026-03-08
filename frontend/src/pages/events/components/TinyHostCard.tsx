import { Box, Chip, Collapse, Grid, Paper, Typography } from '@mui/material';
import { Calendar, ChevronDown, Clock, MapPin, Navigation } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { EventLocationMap } from '@/components/events/EventLocationMap';
import { HostCard } from '@/components/ui/HostCard';
import { Media } from '@/components/ui/media';
import { CATEGORY_THEMES } from '@/features/events/CategoricalBackground';

import { LIFECYCLE_LABELS, WashiTape } from './scrapbookHelpers';
import { FEATURE_EMOJI_MAP } from './DetailsSection';

// --- Tiny Host Card with expand ---
export const TinyHostCard = ({
    host,
    categoryName,
    rating,
    tag,
    displayNeedsCount,
    displayNeeds,
    allChips,
    onClick,
}: {
    host: any;
    categoryName: string;
    rating?: number;
    tag: string;
    displayNeedsCount?: number;
    displayNeeds?: any[];
    allChips?: any[];
    onClick?: () => void;
}) => {
    const [expanded, setExpanded] = useState(false);

    const handleContainerClick = () => {
        setExpanded(!expanded);
        onClick?.();
    };

    return (
        <Box
            onClick={handleContainerClick}
            sx={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: expanded ? 'rotate(0deg)' : 'rotate(-1deg)',
            }}
        >
            <Box
                onClick={() => {
                    window.location.hash = 'services';
                    window.dispatchEvent(
                        new CustomEvent('section-scroll', { detail: 'services' }),
                    );
                }}
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 1,
                    bgcolor: 'transparent',
                    '&:hover': {
                        transform: 'scale(1.03)',
                    },
                }}
            >
                <Box
                    sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        bgcolor: '#eee',
                        flexShrink: 0,
                    }}
                >
                    <Media
                        src={host.avatar || undefined}
                        alt={host.username}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </Box>
                <Typography
                    sx={{
                        fontFamily: '"Caveat", cursive',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: 'text.secondary',
                    }}
                >
                    <span style={{ fontWeight: 'bolder', fontFamily: '"Permanent Marker"', fontSize: '1.2rem' }}>{categoryName}</span> event
                    organized by <span style={{ fontWeight: 'bolder', fontFamily: '"Permanent Marker"', fontSize: '1.2rem', color: '#333' }}>@{host.username}</span>
                    {!!displayNeedsCount &&
                        displayNeedsCount > 0 &&
                        ` and ${displayNeedsCount} others..`}
                </Typography>
            </Box>

            <>  {/* Features Header */}
                <Typography variant="h6" sx={{
                    fontFamily: '"Caveat", cursive',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: 'text.secondary',
                    mb: 2
                }}>Featuring</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                    {displayNeeds?.map((need: any, idx: number) => (
                        <Chip
                            key={need.id}
                            label={(<>
                                <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                    {need.category}</span> by
                                <span style={{ fontWeight: 'bolder', fontFamily: '"Permanent Marker"', fontSize: '1.2rem', color: '#333', marginLeft: '0.5rem' }}>
                                    @{need.assigned_vendor_name || 'Vendor_name'}
                                    {/* //replace with hostname later */}
                                </span></>)}
                            sx={{
                                bgcolor: '#d1fae5',
                                border: `0px solid #10b981`,
                                color: '#065f46',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                height: 'auto',
                                py: 0.5,
                                transform: `rotate(${idx % 2 === 0 ? -0.5 : 0.5}deg)`,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    transform: 'rotate(0deg) scale(1.05)',
                                    boxShadow: '2px 2px 0px rgba(0,0,0,0.1)',
                                },
                            }}
                        />
                    ))}
                    <Typography variant="h6" sx={{
                        fontFamily: '"Caveat", cursive',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: 'text.secondary',
                        mb: 2
                    }}>and</Typography>
                    {allChips?.map((feature: any, idx: number) => (
                        <Chip
                            key={feature.name}
                            label={`${FEATURE_EMOJI_MAP[feature.name] || '🏷️'} ${feature.name}`}
                            sx={{
                                bgcolor: '#fef3c7',
                                border: `0px solid #f59e0b`,
                                color: '#92400e',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                height: 'auto',
                                py: 0.5,
                                transform: `rotate(${idx % 2 === 0 ? -0.5 : 0.5}deg)`,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    transform: 'rotate(0deg) scale(1.05)',
                                    boxShadow: '2px 2px 0px rgba(0,0,0,0.1)',
                                },
                            }}
                        />
                    ))}
                    <Typography variant="h6" sx={{
                        fontFamily: '"Caveat", cursive',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: 'text.secondary',
                        mb: 2
                    }}>and more..</Typography>
                </Box>
            </>
        </Box>
    );
};