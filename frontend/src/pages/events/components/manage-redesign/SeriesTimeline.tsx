import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { EventListItem } from '@/types/events';

interface SeriesTimelineProps {
    occurrences: EventListItem[];
    currentEventId: number;
}

export function SeriesTimeline({ occurrences, currentEventId }: SeriesTimelineProps) {
    const navigate = useNavigate();

    if (!occurrences || occurrences.length <= 1) return null;

    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pb: 4, position: 'relative' }}>
            {occurrences.map((occ: any, idx: number) => {
                const isCurrent = occ.id === currentEventId;
                const d = new Date(occ.start_time);
                // Sketchy border and color logic
                return (
                    <Box
                        key={occ.id}
                        onClick={() => !isCurrent && navigate(`/events/${occ.id}/host-event-management`)}
                        sx={{
                            cursor: isCurrent ? 'default' : 'pointer',
                            px: 1.5,
                            py: 0.5,
                            bgcolor: isCurrent ? 'rgba(239, 68, 68, 0.1)' : 'white',
                            border: '1.5px solid',
                            borderColor: isCurrent ? '#ef4444' : 'rgba(0,0,0,0.1)',
                            borderRadius: '4px',
                            transform: `rotate(${((idx % 3) - 1) * 2}deg)`,
                            boxShadow: isCurrent
                                ? '2px 2px 0px rgba(239, 68, 68, 0.2)'
                                : '1px 1px 3px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            '&:hover': !isCurrent
                                ? {
                                    transform: 'scale(1.1) rotate(0deg)',
                                    boxShadow: '2px 2px 8px rgba(0,0,0,0.1)',
                                    borderColor: 'rgba(0,0,0,0.3)',
                                    zIndex: 2,
                                }
                                : {},
                            position: 'relative',
                        }}
                    >
                        <Typography
                            sx={{
                                fontFamily: '"Caveat", cursive',
                                fontSize: '0.9rem',
                                fontWeight: isCurrent ? 'bold' : 'normal',
                                color: isCurrent ? '#ef4444' : 'text.secondary',
                                lineHeight: 1,
                                pointerEvents: 'none',
                            }}
                        >
                            #{idx + 1}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                fontFamily: 'serif',
                                fontSize: '0.65rem',
                                color: isCurrent ? '#ef4444' : '#666',
                                display: 'block',
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none',
                            }}
                        >
                            {d.toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                            })}
                        </Typography>
                        {isCurrent && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: -2,
                                    right: -2,
                                    width: 6,
                                    height: 6,
                                    bgcolor: '#ef4444',
                                    borderRadius: '50%',
                                }}
                            />
                        )}
                    </Box>
                );
            })}
            {/* Scrapbook decoration: dotted line */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    borderBottom: '2px dotted',
                    borderColor: 'rgba(0,0,0,0.2)',
                    zIndex: -1,
                }}
            />
        </Box>
    );
}
