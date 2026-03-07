import {
    Box,
    Button as MuiButton,
    Grid,
    Typography,
} from '@mui/material';

import { PolaroidFrame } from './scrapbookHelpers';

import { useNavigate, useParams } from 'react-router-dom';

export const MemoryBoxSection = ({
    highlights,
    setIsHighlightOpen,
}: {
    highlights: any[];
    setIsHighlightOpen: (v: boolean) => void;
}) => {
    const navigate = useNavigate();
    const { id } = useParams();

    const displayedHighlights = highlights.slice(0, 5);

    return (
        <Box>
            <Typography variant="h2" sx={{ mb: 4, textAlign: 'center' }}>
                Memory Box
            </Typography>

            {/* Highlights */}
            {displayedHighlights.length > 0 && (
                <Grid container spacing={3} sx={{ mb: 6 }}>
                    {displayedHighlights.map((h: any, index: number) => {
                        // First 2 are 6 (1/2 row), next 3 are 4 (1/3 row)
                        const size = index < 2 ? 6 : 4;
                        return (
                            <Grid size={{ xs: size }} key={h.id}>
                                <PolaroidFrame
                                    src={h.media_file}
                                    caption={h.text}
                                    author={h.author_username}
                                />
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            <MuiButton
                fullWidth
                variant="outlined"
                onClick={() => setIsHighlightOpen(true)}
                sx={{
                    fontFamily: '"Permanent Marker"',
                    p: 2,
                    border: '2px dashed #ccc',
                    mb: 2,
                }}
            >
                + Add to the pile
            </MuiButton>

            <MuiButton
                fullWidth
                variant="contained"
                onClick={() => navigate(`/events/${id}/gallery`)}
                sx={{
                    fontFamily: '"Permanent Marker"',
                    p: 2,
                    mb: 6,
                    background: '#333',
                    '&:hover': { background: '#000' }
                }}
            >
                Go to gallery
            </MuiButton>
        </Box>
    );
};
