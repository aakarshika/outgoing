import { Box, Chip, Collapse, Grid, Paper, Typography } from '@mui/material';
import { Calendar, ChevronDown, Clock, MapPin, Navigation } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { EventLocationMap } from '@/components/events/EventLocationMap';
import { HostCard } from '@/components/ui/HostCard';
import { Media } from '@/components/ui/media';
import { CATEGORY_THEMES } from '@/features/events/CategoricalBackground';

import { LIFECYCLE_LABELS, WashiTape } from './scrapbookHelpers';

// --- Tiny Host Card with expand ---
export const TinyHostCard = ({
    host,
    rating,
    tag,
    displayNeedsCount,
    onClick,
}: {
    host: any;
    rating?: number;
    tag: string;
    displayNeedsCount?: number;
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
            <Paper
                elevation={0}
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
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        color: 'text.secondary',
                    }}
                >
                    planned by <span style={{ fontWeight: 'bolder' }}>@{host.username}</span>
                    {!!displayNeedsCount &&
                        displayNeedsCount > 0 &&
                        ` and ${displayNeedsCount} others..`}
                </Typography>
            </Paper>
        </Box>
    );
};