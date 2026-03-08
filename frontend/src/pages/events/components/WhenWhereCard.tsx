import { Box, Chip, Collapse, Grid, Paper, Typography } from '@mui/material';
import { Calendar, ChevronDown, Clock, MapPin, Navigation } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { EventLocationMap } from '@/components/events/EventLocationMap';
import { HostCard } from '@/components/ui/HostCard';
import { Media } from '@/components/ui/media';
import { CATEGORY_THEMES } from '@/features/events/CategoricalBackground';

import { LIFECYCLE_LABELS, WashiTape } from './scrapbookHelpers';

// --- When & Where expandable card ---
export const WhenWhereCard = ({ event }: { event: any }) => {
    const [expanded, setExpanded] = useState(false);
    const [distanceMiles, setDistanceMiles] = useState<number | null>(null);

    // Calculate days to go
    const daysToGo = useMemo(() => {
        const now = new Date();
        const target = new Date(event.start_time);
        const diff = target.getTime() - now.getTime();
        if (diff <= 0) return 0;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }, [event.start_time]);

    // Calculate distance using browser geolocation
    useEffect(() => {
        if (!event.latitude || !event.longitude) return;
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const R = 3958.8; // Earth radius in miles
                const dLat = ((event.latitude - pos.coords.latitude) * Math.PI) / 180;
                const dLon = ((event.longitude - pos.coords.longitude) * Math.PI) / 180;
                const a =
                    Math.sin(dLat / 2) ** 2 +
                    Math.cos((pos.coords.latitude * Math.PI) / 180) *
                    Math.cos((event.latitude * Math.PI) / 180) *
                    Math.sin(dLon / 2) ** 2;
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                setDistanceMiles(Math.round(R * c));
            },
            () => {
                /* silently ignore if user denies location */
            },
            { timeout: 5000 },
        );
    }, [event.latitude, event.longitude]);

    const isPast = new Date(event.start_time) < new Date();
    const recurrenceRule = event.series?.recurrence_rule;

    const formatRecurrence = (rule: string) => {
        if (!rule) return null;
        if (rule.includes('FREQ=WEEKLY')) {
            const days = rule.match(/BYDAY=([^;]+)/)?.[1];
            const dayMap: Record<string, string> = {
                MO: 'Mondays',
                TU: 'Tuesdays',
                WE: 'Wednesdays',
                TH: 'Thursdays',
                FR: 'Fridays',
                SA: 'Saturdays',
                SU: 'Sundays',
            };
            if (days) {
                const dayNames = days
                    .split(',')
                    .map((d) => dayMap[d] || d)
                    .join(', ');
                return `Weekly on ${dayNames}`;
            }
            return 'Weekly';
        }
        if (rule.includes('FREQ=DAILY')) return 'Daily';
        if (rule.includes('FREQ=MONTHLY')) return 'Monthly';
        return 'Recurring';
    };

    // Build summary text
    const summaryParts: string[] = [];
    if (recurrenceRule) {
        const rText = formatRecurrence(recurrenceRule);
        if (rText) summaryParts.push(rText);
    }
    if (distanceMiles !== null) summaryParts.push(`${distanceMiles} miles away`);
    if (!isPast && daysToGo > 0)
        summaryParts.push(`${daysToGo} day${daysToGo !== 1 ? 's' : ''} to go`);
    else if (isPast) summaryParts.push('already happened');
    else summaryParts.push('happening today!');

    return (
        <Box
            onClick={() => setExpanded(!expanded)}
            sx={{
                position: expanded ? 'absolute' : 'relative',
                top: 0,
                left: 0,
                background: expanded ? 'rgba(253, 253, 253, 1)' : 'transparent',
                zIndex: expanded ? 100 : 10,
                mb: expanded ? 0 : 3,
                px: 2,
                py: expanded ? 3 : 1, // More padding when expanded
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: expanded
                    ? 'rotate(0deg) translateX(12px)'
                    : 'rotate(-0.5deg) translateX(12px)',
                '&:hover': {
                    transform: expanded
                        ? 'rotate(0deg) scale(1.01)  translateX(12px)'
                        : 'rotate(0deg) scale(1.01)  translateX(12px)',
                },
                overflow: 'visible', // For WashiTape
            }}
        >
            {/* Collapsed summary */}
            <Box sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Navigation size={14} style={{ opacity: 0.6, color: '#2563eb' }} />
                    <Typography
                        sx={{
                            fontFamily: '"Caveat", cursive',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            color: 'text.secondary',
                            letterSpacing: '0.5px',
                        }}
                    >
                        {summaryParts.join(' · ')}
                    </Typography>
                </Box>
            </Box>

            {/* Expanded content */}
            <Collapse in={expanded}>
                <Box sx={{ mt: 3, mb: 1 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Calendar size={16} style={{ color: '#ef4444' }} />
                            <Box>
                                <Typography
                                    sx={{
                                        fontFamily: '"Permanent Marker"',
                                        fontSize: '0.65rem',
                                        color: 'text.disabled',
                                        lineHeight: 1,
                                    }}
                                >
                                    DATE
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: '"Caveat"',
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {new Date(event.start_time).toLocaleDateString(undefined, {
                                        weekday: 'long',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Clock size={16} style={{ color: '#f59e0b' }} />
                            <Box>
                                <Typography
                                    sx={{
                                        fontFamily: '"Permanent Marker"',
                                        fontSize: '0.65rem',
                                        color: 'text.disabled',
                                        lineHeight: 1,
                                    }}
                                >
                                    TIME
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: '"Caveat"',
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {new Date(event.start_time).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </Typography>
                            </Box>
                        </Box>
                        {event.location_name && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MapPin size={16} style={{ color: '#22c55e' }} />
                                <Box>
                                    <Typography
                                        sx={{
                                            fontFamily: '"Permanent Marker"',
                                            fontSize: '0.65rem',
                                            color: 'text.disabled',
                                            lineHeight: 1,
                                        }}
                                    >
                                        LOCATION
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: '"Caveat"',
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {event.location_name}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>

                    {/* Map - Polaroid style */}
                    {event.location_name && (
                        <Box
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                                p: 1,
                                bgcolor: 'white',
                                borderRadius: '2px',
                                border: '1px solid #efefef',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                transform: 'rotate(0.5deg)',
                                overflow: 'hidden',
                            }}
                        >
                            <Box sx={{ borderRadius: '2px', overflow: 'hidden' }}>
                                <EventLocationMap
                                    locationName={event.location_name}
                                    locationAddress={event.location_address}
                                    latitude={event.latitude}
                                    longitude={event.longitude}
                                />
                            </Box>
                        </Box>
                    )}
                    <Typography
                        sx={{
                            fontFamily: '"Caveat", cursive',
                            fontSize: '0.85rem',
                            color: 'text.disabled',
                            textAlign: 'center',
                            mt: 2,
                        }}
                    >
                        tap to collapse map
                    </Typography>
                </Box>
            </Collapse>
        </Box>
    );
};
