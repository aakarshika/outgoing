import { Box, Chip, Stack, Typography } from '@mui/material';
import { type MouseEvent, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks';
import { getEventCardRoles, HostVendorBadge } from '@/features/events/scrapbookCard';
import { useEventCards } from './useEventCards';
import type { EventCardEvent, EventCardProps } from './useEventCards';

const IMAGE_HEIGHT = 126;
const IMAGE_WIDTH = 116;

export function ExpandableEventCardBox({
    event,
    sx,
}: { showNeeds?: boolean } & EventCardProps & { event: EventCardEvent }) {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { isHost, isVendor } = getEventCardRoles(event, {
        user: user ?? null,
        isAuthenticated,
    });
    const isLive = event.lifecycle_state === 'live';
    const {
        ImageFrame,
        Category,
        Description,
        LocationStuff,
        DateAndLocationFlat,
        Going,
        getCardSx,
        getContentSx,
    } = useEventCards({
        event,
        imageHeight: IMAGE_HEIGHT,
        imageWidth: IMAGE_WIDTH,
        layout: 'landscape',
    });

    const handleCardClick = useCallback(
        (clickEvent: MouseEvent<HTMLElement>) => {
            if (clickEvent.defaultPrevented) return;
            const target = clickEvent.target as HTMLElement | null;
            if (
                target?.closest(
                    'button, a, input, textarea, select, [role="button"], [data-card-action="true"]',
                )
            ) {
                return;
            }

            navigate(`/events-new/${event.id}`);
        },
        [event.id, navigate],
    );

    return (
        <Box
            onClick={handleCardClick}
            sx={getCardSx([
                {
                    mb: 2,
                    minWidth: 0,
                },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ])}
        >
            {isLive ? (
                <Chip
                    label="Live now"
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        zIndex: 3,
                        height: 24,
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: '#fff',
                        background:
                            'linear-gradient(135deg, rgba(255, 94, 98, 0.98) 0%, rgba(124, 58, 237, 0.98) 100%)',
                        border: '1px solid rgba(255,255,255,0.24)',
                        boxShadow: '0 12px 24px rgba(124, 58, 237, 0.22)',
                        backdropFilter: 'blur(8px)',
                    }}
                />
            ) : null}

            {isHost || isVendor ? (
                <HostVendorBadge
                    isHost={isHost}
                    variant="short"
                    sx={{
                        left: 10,
                        top: 40,
                        zIndex: 3,
                        boxShadow: '0 8px 18px rgba(43, 33, 24, 0.18)',
                        height: 20,
                    }}
                />
            ) : null}

            <Stack
                spacing={1}
                sx={getContentSx({
                    pt: 1,
                    pl: 1,
                    pr: 1.35,
                    borderRadius: '24px',
                    background: 'rgba(255,255,255,0.94)',
                    borderLeftWidth: '5px',
                    overflow: 'visible',
                })}
            >
                <Stack direction="column" spacing={1}>
                    <Stack
                        direction="row"
                        spacing={1.2}
                        sx={{
                            minHeight: IMAGE_HEIGHT,
                            p: 1.2,
                            pl: 0,
                            alignItems: 'stretch',
                        }}
                    >
                        <Box
                            sx={{
                                position: 'relative',
                                width: IMAGE_WIDTH,
                                minWidth: IMAGE_WIDTH,
                                height: IMAGE_HEIGHT,
                            }}
                        >
                            <ImageFrame />
                        </Box>

                        <Stack
                            spacing={0.8}
                            sx={{ flex: 1, pl: 2, minWidth: 0 }}
                        >
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                justifyContent="space-between"
                                sx={{ minWidth: 0 }}
                            >
                                <Category />
                                <DateAndLocationFlat />
                            </Stack>

                            <Typography
                                sx={{
                                    fontFamily: 'Syne, sans-serif',
                                    fontSize: 15,
                                    fontWeight: 700,
                                    lineHeight: 1.15,
                                    letterSpacing: '-0.03em',
                                    color: '#2B2118',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                {event.title}
                            </Typography>

                            <Box sx={{ minWidth: 0 }}>
                                <Description />
                            </Box>

                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                justifyContent={"space-between"}
                                sx={{ minWidth: 0, mt: 'auto' }}
                            >
                                <LocationStuff />
                                <Going />
                            </Stack>
                        </Stack>
                    </Stack>
                </Stack>
            </Stack>

        </Box>
    );
}
