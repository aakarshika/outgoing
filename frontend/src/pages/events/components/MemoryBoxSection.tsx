import {
    Box,
    Button as MuiButton,
    Grid,
    Typography,
    Paper,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

import { Highlighter, DoodleStar, DoodleHeart, DoodleArrow, DoodleSwirl, DoodleCloud, DoodleFlower } from './scrapbookHelpers';
import { HighlightCard } from './HighlightCard';
import { HighlightFeedViewer } from './HighlightFeedViewer';

export const MemoryBoxSection = ({
    highlights,
    setIsHighlightOpen,
}: {
    highlights: any[];
    setIsHighlightOpen: (v: boolean) => void;
}) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedHighlightId, setSelectedHighlightId] = useState<number | null>(null);

    const displayedHighlights = highlights.slice(0, 8); // Show a bit more now that they are smaller

    const handleHighlightClick = (highlightId: number) => {
        setSelectedHighlightId(highlightId);
        setViewerOpen(true);
    };

    return (
        <Box sx={{ mt: 6, position: 'relative' }}>
            {/* Highlights Grid in a Decorative Container */}
            <Paper
                elevation={0}
                sx={{
                    position: 'relative',
                    maxWidth: '1000px',
                    mx: 'auto',
                    p: { xs: 2, sm: 4 },
                    bgcolor: '#fffef9',
                    backgroundImage: `
                        linear-gradient(90deg, transparent 79px, #abced4 79px, #abced4 81px, transparent 81px),
                        linear-gradient(#eee .1em, transparent .1em)
                    `,
                    backgroundSize: '100% 20px',
                    border: '1px solid #dcdcdc',
                    borderRadius: '4px',
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.05), 5px 5px 15px rgba(0,0,0,0.05)',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0, left: 0, bottom: 0,
                        width: '80px',
                        borderRight: '2px solid rgba(255, 100, 100, 0.2)',
                        pointerEvents: 'none',
                        zIndex: 1
                    }
                }}
            >
                <Box sx={{ textAlign: 'center', position: 'relative', mb: 4 }}>
                    <Typography
                        variant="h3"
                        sx={{
                            fontFamily: '"Permanent Marker", cursive',
                            fontSize: { xs: '2rem', sm: '3rem' },
                            display: 'inline-block',
                            position: 'relative'
                        }}
                    >
                        <Highlighter color="rgba(252, 211, 77, 0.4)">Memories made</Highlighter>
                    </Typography>
                </Box>

                {/* Decorative Doodles behind the grid - spread all over */}
                <Box sx={{ position: 'absolute', top: 40, left: 40, opacity: 0.2, pointerEvents: 'none', zIndex: 1 }}>
                    <DoodleStar size={40} rotate={15} color="#fcd34d" />
                </Box>
                <Box sx={{ position: 'absolute', top: 60, right: 60, opacity: 0.15, pointerEvents: 'none', zIndex: 1 }}>
                    <DoodleCloud size={70} rotate={-5} color="#94a3b8" />
                </Box>
                <Box sx={{ position: 'absolute', top: 150, left: '15%', opacity: 0.3, pointerEvents: 'none', zIndex: 1 }}>
                    <DoodleStar size={60} rotate={15} color="#fcd34d" />
                </Box>
                <Box sx={{ position: 'absolute', top: 120, right: '25%', opacity: 0.2, pointerEvents: 'none', zIndex: 1 }}>
                    <DoodleFlower size={50} rotate={20} color="#f472b6" />
                </Box>
                <Box sx={{ position: 'absolute', top: 200, right: 120, opacity: 0.3, pointerEvents: 'none', zIndex: 1 }}>
                    <DoodleHeart size={50} rotate={-10} color="#f87171" />
                </Box>
                <Box sx={{ position: 'absolute', top: '35%', left: 40, opacity: 0.2, pointerEvents: 'none', zIndex: 1 }}>
                    <DoodleArrow size={60} rotate={-30} color="#60a5fa" />
                </Box>
                <Box sx={{ position: 'absolute', top: '40%', left: '45%', opacity: 0.15, pointerEvents: 'none', zIndex: 1 }}>
                    <DoodleSwirl size={120} rotate={45} color="#a78bfa" />
                </Box>
                <Box sx={{ position: 'absolute', top: '55%', right: '10%', opacity: 0.2, pointerEvents: 'none', zIndex: 1 }}>
                    <DoodleStar size={45} rotate={35} color="#fbbf24" />
                </Box>
                <Box sx={{ position: 'absolute', bottom: 180, left: 150, opacity: 0.2, pointerEvents: 'none', zIndex: 1 }}>
                    <DoodleArrow size={80} rotate={160} color="#3b82f6" />
                </Box>
                <Box sx={{ position: 'absolute', bottom: 220, right: '35%', opacity: 0.15, pointerEvents: 'none', zIndex: 1 }}>
                    <DoodleCloud size={60} rotate={10} color="#64748b" />
                </Box>
                <Box sx={{ position: 'absolute', bottom: 100, left: '20%', opacity: 0.25, pointerEvents: 'none', zIndex: 1 }}>
                    <DoodleHeart size={40} rotate={15} color="#ef4444" />
                </Box>
                <Box sx={{ position: 'absolute', bottom: 120, right: 200, opacity: 0.2, pointerEvents: 'none', zIndex: 1 }}>
                    <DoodleFlower size={45} rotate={-15} color="#ec4899" />
                </Box>
                <Box sx={{ position: 'absolute', bottom: 100, right: 80, opacity: 0.3, pointerEvents: 'none', zIndex: 1 }}>
                    <DoodleStar size={40} rotate={-20} color="#fbbf24" />
                </Box>
                <Box sx={{ position: 'absolute', bottom: 40, left: '45%', opacity: 0.15, pointerEvents: 'none', zIndex: 1 }}>
                    <DoodleSwirl size={80} rotate={-20} color="#8b5cf6" />
                </Box>

                {displayedHighlights.length > 0 ? (
                    <Grid container spacing={2} sx={{ position: 'relative', zIndex: 2 }}>
                        {displayedHighlights.map((h: any, index: number) => {
                            return (
                                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={h.id}>
                                    <HighlightCard
                                        highlight={h}
                                        rotation={((index % 4) - 1.5) * 3}
                                        onClick={() => handleHighlightClick(h.id)}
                                    />
                                </Grid>
                            );
                        })}
                    </Grid>
                ) : (
                    <Box
                        sx={{
                            p: 6,
                            textAlign: 'center',
                            border: '2px dashed #ccc',
                            bgcolor: 'rgba(255,255,255,0.8)',
                            borderRadius: '4px',
                            position: 'relative',
                            zIndex: 2
                        }}
                    >
                        <Typography sx={{ fontFamily: '"Caveat", cursive', fontSize: '1.5rem', color: 'text.secondary' }}>
                            no memories yet... be the first to start the pile!
                        </Typography>
                    </Box>
                )}

                {/* Action Buttons - Sticker Style moved inside container for cohesiveness */}
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: 3,
                        mt: 4,
                        position: 'relative',
                        zIndex: 2
                    }}
                >
                    <MuiButton
                        variant="outlined"
                        onClick={() => setIsHighlightOpen(true)}
                        startIcon={<Camera size={20} />}
                        sx={{
                            fontFamily: '"Permanent Marker"',
                            fontSize: '0.9rem',
                            py: 1.2,
                            px: 3,
                            border: '2px dashed #999',
                            color: '#666',
                            bgcolor: 'white',
                            transform: 'rotate(-2deg)',
                            transition: 'all 0.2s',
                            '&:hover': {
                                border: '2px dashed #333',
                                color: '#333',
                                bgcolor: '#fdf6e3',
                                transform: 'rotate(0deg) scale(1.05)',
                                boxShadow: '4px 4px 10px rgba(0,0,0,0.1)'
                            },
                            borderRadius: '2px',
                            textTransform: 'none'
                        }}
                    >
                        Add to the pile
                    </MuiButton>

                    <MuiButton
                        variant="contained"
                        onClick={() => navigate(`/events/${id}/gallery`)}
                        startIcon={<ImageIcon size={20} />}
                        sx={{
                            fontFamily: '"Permanent Marker"',
                            fontSize: '0.9rem',
                            py: 1.2,
                            px: 3,
                            background: '#333',
                            color: 'white',
                            transform: 'rotate(1deg)',
                            transition: 'all 0.2s',
                            '&:hover': {
                                background: '#000',
                                transform: 'rotate(0deg) scale(1.05)',
                                boxShadow: '4px 4px 15px rgba(0,0,0,0.2)'
                            },
                            borderRadius: '2px',
                            textTransform: 'none'
                        }}
                    >
                        Go to gallery
                    </MuiButton>
                </Box>
            </Paper>

            <HighlightFeedViewer
                isOpen={viewerOpen}
                highlights={highlights}
                initialHighlightId={selectedHighlightId || undefined}
                onClose={() => setViewerOpen(false)}
            />
        </Box>
    );
};
