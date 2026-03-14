import { Box, Typography } from '@mui/material';
import { Calendar } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Media } from '@/components/ui/media';
import { useAuth } from '@/features/auth/hooks';
import { PosterForEventCard } from '@/pages/events/components/PosterForEventCard';
import { formatEventRelativeTime } from '@/utils/dateUtils';

import { CategoricalBackground, getCategoryTheme } from './CategoricalBackground';
import { LikeButton } from './LikeButton';
import { LocationTag } from './LocationTag';
import {
    CategorySticker,
    CategoryStickerCompact,
    CompletedRatedBadge,
    formatEventPrice,
    FullHouseBadge,
    getEventCardRoles,
    HostVendorBadge,
    LiveBadge,
    ImageWatermarkPlaceholder,
    PriceBadge,
} from './scrapbookCard';
import { TicketStatusBadge } from './TicketStatusBadge';
import { EventListItem, TicketInfo } from '@/types/events';

/** Landscape list card: full-width row, image left, content right. Use in lists. */
interface ScrapbookEventCardLandscapeProps {
    event: EventListItem & {
        user_tickets?: TicketInfo[];
    };
    isFocused?: boolean;
    isBasicEventCard?: boolean;
    size?: 'default' | 'compact';
    ticketStatusVariant?: 'default' | 'large';
    ticketStatusRightAligned?: boolean;
    userTicketCount?: number;
}

export const ScrapbookEventCardLandscape = ({
    event,
    isFocused,
    isBasicEventCard = false,
    size = 'default',
    ticketStatusVariant = 'large',
    ticketStatusRightAligned = true,
    userTicketCount,
}: ScrapbookEventCardLandscapeProps) => {
    const { user, isAuthenticated } = useAuth();
    const { isHost, isVendor } = getEventCardRoles(event, {
        user: user ?? null,
        isAuthenticated,
    });

    const theme = getCategoryTheme(event.category ?? undefined);
    const relativeTime = formatEventRelativeTime(event.start_time);
    const price = formatEventPrice(event.ticket_price_standard);
    const isNoImageCard = !event.cover_image;
    const isCompact = size === 'compact';
    const resolvedUserTicketCount = userTicketCount ?? event.user_tickets?.length;

    return (
        <Box
            component={Link}
            to={`/events/${event.id}`
            }
            sx={{
                display: 'flex',
                width: '100%',
                minHeight: isCompact ? { xs: 90, sm: 110 } : { xs: 120, sm: 140 },
                maxHeight: isCompact ? { xs: 130, sm: 160 } : { xs: 160, sm: 200 },
                textDecoration: 'none',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 1,
                border: '1px solid #e5e7eb',
                boxShadow: isFocused
                    ? '0 12px 28px rgba(0,0,0,0.15), 0 6px 12px rgba(0,0,0,0.08)'
                    : '0 6px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.3s ease, transform 0.2s ease',
                '&:hover': {
                    boxShadow: '0 12px 28px rgba(0,0,0,0.12), 0 6px 12px rgba(0,0,0,0.06)',
                },
            }}
        >
            {/* Image strip (left) */}
            < Box
                sx={{
                    width: isCompact ? { xs: 110, sm: 140 } : { xs: 140, sm: 200 },
                    minWidth: isCompact ? { xs: 110, sm: 140 } : { xs: 140, sm: 200 },
                    flexShrink: 0,
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: theme.bg,
                    alignSelf: 'stretch',
                }}
            >
                {
                    isNoImageCard ? (
                        <ImageWatermarkPlaceholder theme={theme} size="sm" />
                    ) : (
                        <Box
                            sx={{
                                width: '100%',
                                height: '100%',
                                position: 'absolute',
                                inset: 0,
                                '& img': { objectFit: 'cover', width: '100%', height: '100%' },
                            }}
                        >
                            <Media src={event.cover_image || ''} />
                        </Box>
                    )}
            </Box>

            {/* Content (right) */}
            <CategoricalBackground
                category={event.category}
                showDecoration={false}
                sx={{
                    flex: 1,
                    minWidth: 0,
                    p: isCompact ? 1 : 1.5,
                    pr: isCompact ? 2 : 3,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >

                <Typography
                    sx={
                        {
                            fontFamily: '"serif"',
                            fontSize: isCompact
                                ? { xs: '0.9rem', sm: '1rem' }
                                : { xs: '1rem', sm: '1.15rem' },
                            color: '#1a1a1a',
                            lineHeight: 1.2,
                            mb: 0.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            pr: 4,
                        }
                    }
                >
                    {event.title}
                </Typography>

                < Typography
                    sx={{
                        fontSize: isCompact ? '0.7rem' : '0.75rem',
                        color: '#555',
                        fontFamily: 'serif',
                        display: '-webkit-box',
                        WebkitLineClamp: isCompact ? 1 : 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: 0.75,
                    }}
                >
                    {event.description?.slice(0, 120) || ''}
                    {(event.description?.length || 0) > 120 ? '...' : ''}
                </Typography>

                < Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        flexWrap: 'wrap',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Calendar size={12} color="#666" />
                        <Typography
                            sx={
                                {
                                    fontSize: isCompact ? '0.65rem' : '0.7rem',
                                    fontWeight: 'bolder',
                                    color: '#666',
                                    fontFamily: 'serif',
                                    whiteSpace: 'nowrap',
                                }
                            }
                        >
                            {relativeTime}
                        </Typography>
                    </Box>
                    < LocationTag
                        locationName={event.location_name}
                        locationAddress={event.location_address}
                        latitude={event.latitude}
                        longitude={event.longitude}
                        size={12}
                        color="#666"
                    />
                </Box>

                {
                    !isBasicEventCard && (<>
                        {
                            event.category && (
                                <CategoryStickerCompact
                                    categoryName={event.category.name!}
                                    theme={theme}
                                    sx={{
                                        right: ticketStatusRightAligned
                                            ? ticketStatusVariant === 'large'
                                                ? 156
                                                : 84
                                            : 8,
                                    }}
                                />
                            )
                        }
                        <LikeButton
                            eventId={event.id}
                            initialIsInterested={event.user_is_interested}
                            initialInterestCount={event.interest_count}
                        />

                        <TicketStatusBadge
                            ticketCount={event.ticket_count}
                            capacity={event.capacity}
                            highlighted={event.user_has_ticket}
                            variant={ticketStatusVariant}
                            rightAligned={ticketStatusRightAligned}
                            userTicketCount={resolvedUserTicketCount}
                            sx={{
                                position: 'absolute',
                                top: 8,
                                left: ticketStatusRightAligned ? 'auto' : 8,
                                right: ticketStatusRightAligned ? 8 : 'auto',
                                zIndex: 2,
                            }}
                        />

                        {
                            event.lifecycle_state === 'live' && (
                                <LiveBadge compact sx={{ bottom: 8, left: 8 }
                                } />
                            )}

                        {
                            (isHost || isVendor) && (
                                <HostVendorBadge
                                    isHost={isHost}
                                    variant="full"
                                    bottomOffset={
                                        event.lifecycle_state === 'published' ||
                                            event.lifecycle_state === 'live'
                                            ? 34
                                            : 8
                                    }
                                    sx={{
                                        left: 'auto',
                                        right: 8,
                                    }}
                                />
                            )}

                        {
                            (event.lifecycle_state === 'published' ||
                                event.lifecycle_state === 'live') && (
                                <PriceBadge price={price} variant="landscape" />
                            )
                        }
                    </>)}
            </CategoricalBackground>
        </Box>
    );
};
