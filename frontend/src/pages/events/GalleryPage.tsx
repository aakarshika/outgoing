import {
    Box,
    Button,
    Container,
    Grid,
    IconButton,
    Stack,
    Typography,
} from '@mui/material';
import {
    ChevronLeft,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

import { HighlightComposer } from '@/components/events/HighlightComposer';
import {
    useEvent,
    useEventHighlights,
} from '@/features/events/hooks';
import { HighlightCard } from './components/HighlightCard';
import { HighlightFeedViewer } from './components/HighlightFeedViewer';
import { DoodleHeart, DoodleStar, WashiTape } from './components/scrapbookHelpers';

export default function GalleryPage() {
    const { id, highlightId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { data: eventResponse } = useEvent(Number(id));
    const { data: highlightsResponse } = useEventHighlights(Number(id), true);

    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedHighlightId, setSelectedHighlightId] = useState<number | null>(null);
    const [isAddHighlightOpen, setIsAddHighlightOpen] = useState(false);

    const event = eventResponse?.data;
    const highlights = highlightsResponse?.data || [];

    // Handle deep linking and initial state
    useEffect(() => {
        if (highlightId) {
            setSelectedHighlightId(Number(highlightId));
            setViewerOpen(true);
        }
    }, [highlightId]);

    const handleHighlightClick = (hId: number) => {
        setSelectedHighlightId(hId);
        setViewerOpen(true);
        // Update URL to include highlight ID
        window.history.pushState(null, '', `/events/${id}/gallery/${hId}`);
    };

    const handleCloseViewer = () => {
        setViewerOpen(false);
        // Restore gallery URL
        window.history.pushState(null, '', `/events/${id}/gallery`);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4, position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
            {/* Background Doodles */}
            <Box sx={{ position: 'absolute', top: 50, left: -20, opacity: 0.1, pointerEvents: 'none' }}>
                <DoodleStar size={120} rotate={-15} />
            </Box>
            <Box sx={{ position: 'absolute', bottom: 100, right: -40, opacity: 0.1, pointerEvents: 'none' }}>
                <DoodleHeart size={150} rotate={10} />
            </Box>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4, position: 'relative' }}>
                <IconButton onClick={() => navigate(`/events/${id}`)}><ChevronLeft /></IconButton>
                <Box>
                    <Typography variant="h4" sx={{ fontFamily: '"Permanent Marker"' }}>
                        Gallery: {event?.title}
                    </Typography>
                    <Typography color="text.secondary">All memories from this event series</Typography>
                </Box>
                <Box sx={{ flex: 1 }} />
                <Button
                    variant="contained"
                    onClick={() => setIsAddHighlightOpen(true)}
                    sx={{
                        bgcolor: '#000',
                        color: 'white',
                        fontFamily: '"Permanent Marker"',
                        borderRadius: 0,
                        px: 3,
                        transform: 'rotate(-1deg)',
                        boxShadow: '4px 4px 0px rgba(0,0,0,0.2)',
                        '&:hover': { bgcolor: '#333' }
                    }}
                >
                    Add Highlight
                </Button>
            </Stack>

            <Grid container spacing={4} sx={{ position: 'relative' }}>
                {highlights.map((h: any, index: number) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={h.id} sx={{ position: 'relative' }}>
                        {index % 4 === 0 && <WashiTape color="rgba(96, 165, 250, 0.4)" rotate="-5deg" />}
                        {index % 7 === 0 && <Box sx={{ position: 'absolute', bottom: -20, left: -20, zIndex: 5 }}><DoodleStar size={40} rotate={15} /></Box>}
                        <HighlightCard
                            highlight={h}
                            rotation={((index % 3) - 1) * 2}
                            onClick={() => handleHighlightClick(h.id)}
                        />
                    </Grid>
                ))}
            </Grid>

            {highlights.length > 0 && (
                <HighlightFeedViewer
                    highlights={highlights}
                    isOpen={viewerOpen}
                    initialHighlightId={selectedHighlightId || undefined}
                    onClose={handleCloseViewer}
                />
            )}

            <HighlightComposer
                eventId={Number(id)}
                isOpen={isAddHighlightOpen}
                onOpenChange={setIsAddHighlightOpen}
            />
        </Container>
    );
}
