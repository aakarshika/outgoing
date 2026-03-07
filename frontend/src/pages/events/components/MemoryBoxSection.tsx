import {
    Box,
    Button as MuiButton,
    Grid,
    Typography,
} from '@mui/material';

import { PolaroidFrame } from './scrapbookHelpers';

export const MemoryBoxSection = ({
    highlights,
    setIsHighlightOpen,
}: {
    highlights: any[];
    setIsHighlightOpen: (v: boolean) => void;
}) => (
    <Box>
        <Typography variant="h2" sx={{ mb: 4, textAlign: 'center' }}>
            Memory Box
        </Typography>

        {/* Highlights */}
        {highlights.length > 0 && (
            <Grid container spacing={3} sx={{ mb: 6 }}>
                {highlights.map((h: any) => (
                    <Grid size={{ xs: 6 }} key={h.id}>
                        <PolaroidFrame
                            src={h.media_file}
                            caption={h.text}
                            author={h.author_username}
                        />
                    </Grid>
                ))}
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
                mb: 6,
            }}
        >
            + Add to the pile
        </MuiButton>
    </Box>
);
