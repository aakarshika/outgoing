import { useRef, useState, useEffect, useMemo } from 'react';
import {
    Box,
    IconButton,
    Stack,
    Typography,
} from '@mui/material';
import {
    Heart,
    MessageCircle,
    X,
} from 'lucide-react';
import { useParams, useLocation } from 'react-router-dom';
import { Hostname } from '@/components/ui/Hostname';

import { useAuth } from '@/features/auth/hooks';
import {
    useToggleHighlightLike,
} from '@/features/events/hooks';

import { HighlightCommentDrawer } from './HighlightCommentDrawer';

// --- Highlight Interaction Section ---
const HighlightInteractions = ({ highlight, onOpenComments }: { highlight: any; onOpenComments: () => void }) => {
    const { isAuthenticated } = useAuth();
    const toggleLike = useToggleHighlightLike();

    return (
        <Stack
            spacing={3}
            alignItems="center"
            sx={{
                position: 'absolute',
                right: 16,
                bottom: 150,
                zIndex: 50,
                color: 'white'
            }}
        >
            <Box sx={{ textAlign: 'center' }}>
                <Hostname
                    username={highlight.author_username}
                    avatarSrc={highlight.author_avatar}
                    mode="bigger"
                    className="!text-white"
                />
            </Box>

            <Box sx={{ textAlign: 'center' }}>
                <IconButton
                    onClick={() => isAuthenticated && toggleLike.mutate(highlight.id)}
                    sx={{
                        color: highlight.user_has_liked ? '#ef4444' : 'white',
                        bgcolor: 'rgba(0,0,0,0.3)',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
                    }}
                >
                    <Heart fill={highlight.user_has_liked ? "#ef4444" : "none"} />
                </IconButton>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{highlight.likes_count}</Typography>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
                <IconButton
                    onClick={onOpenComments}
                    sx={{
                        color: 'white',
                        bgcolor: 'rgba(0,0,0,0.3)',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
                    }}
                >
                    <MessageCircle />
                </IconButton>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{highlight.comments_count}</Typography>
            </Box>
        </Stack>
    );
};

interface HighlightFeedViewerProps {
    highlights: any[];
    isOpen: boolean;
    onClose: () => void;
    initialHighlightId?: number;
}

export const HighlightFeedViewer = ({ highlights, isOpen, onClose, initialHighlightId }: HighlightFeedViewerProps) => {
    const { id: eventId } = useParams();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [activeHighlightId, setActiveHighlightId] = useState<number | null>(initialHighlightId || null);

    const activeHighlight = useMemo(() =>
        highlights.find(h => h.id === activeHighlightId),
        [highlights, activeHighlightId]);

    // Ensure we have an active highlight id if not provided
    useEffect(() => {
        if (isOpen && !activeHighlightId && highlights.length > 0) {
            setActiveHighlightId(highlights[0].id);
        }
    }, [isOpen, activeHighlightId, highlights]);

    useEffect(() => {
        if (isOpen && initialHighlightId && scrollContainerRef.current) {
            const index = highlights.findIndex(h => h.id === initialHighlightId);
            if (index !== -1) {
                scrollContainerRef.current.scrollTop = index * window.innerHeight;
                setActiveHighlightId(initialHighlightId);
            }
        }
    }, [isOpen, initialHighlightId, highlights]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        const index = Math.round(scrollTop / window.innerHeight);
        const highlight = highlights[index];
        if (highlight && highlight.id !== activeHighlightId) {
            setActiveHighlightId(highlight.id);
            // Update URL gently
            window.history.replaceState(null, '', `/events/${eventId}/gallery/${highlight.id}`);
        }
    };

    if (!isOpen) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 2000,
                bgcolor: 'black',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Close Button */}
            <IconButton
                onClick={onClose}
                sx={{ position: 'absolute', top: 16, left: 16, zIndex: 3000, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
            >
                <X />
            </IconButton>

            {/* Scrollable Feed Container */}
            <Box
                ref={scrollContainerRef}
                onScroll={handleScroll}
                sx={{
                    flex: 1,
                    overflowY: 'scroll',
                    scrollSnapType: 'y mandatory',
                    height: '100%',
                    '&::-webkit-scrollbar': { display: 'none' },
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none'
                }}
            >
                {highlights.map((h) => (
                    <Box
                        key={h.id}
                        sx={{
                            height: '100vh',
                            width: '100%',
                            scrollSnapAlign: 'start',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Background Blur */}
                        <Box sx={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundImage: `url(${h.media_file})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'blur(30px)',
                            opacity: 0.4,
                            transform: 'scale(1.1)'
                        }} />

                        {/* Main Content */}
                        <Box sx={{
                            position: 'relative',
                            zIndex: 1,
                            maxHeight: '100%',
                            maxWidth: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}>
                            <img
                                src={h.media_file}
                                alt={h.text}
                                style={{
                                    maxHeight: '100vh',
                                    maxWidth: '100vw',
                                    objectFit: 'contain',
                                    display: 'block'
                                }}
                            />

                            {/* Caption Overlay */}
                            <Box sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                p: 4,
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                color: 'white'
                            }}>
                                <Hostname
                                    username={h.author_username}
                                    mode="simple"
                                    className="!text-white mb-2"
                                />
                                <Typography variant="body1">{h.text}</Typography>
                            </Box>
                        </Box>

                        {/* Side Interactions */}
                        <HighlightInteractions
                            highlight={h}
                            onOpenComments={() => setIsCommentsOpen(true)}
                        />
                    </Box>
                ))}
            </Box>

            {/* TikTok-style Comments Drawer */}
            <HighlightCommentDrawer
                highlightId={activeHighlightId}
                commentsCount={activeHighlight?.comments_count || 0}
                isOpen={isCommentsOpen}
                onClose={() => setIsCommentsOpen(false)}
            />
        </Box>
    );
};
