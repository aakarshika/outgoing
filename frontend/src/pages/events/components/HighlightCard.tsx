import { Box, Stack, Typography } from '@mui/material';
import { Heart, MessageCircle } from 'lucide-react';
import { PolaroidFrame } from './scrapbookHelpers';

interface HighlightCardProps {
    highlight: any;
    onClick?: () => void;
    rotation?: number;
}

export const HighlightCard = ({ highlight, onClick, rotation = 0 }: HighlightCardProps) => {
    return (
        <Box
            onClick={onClick}
            sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                    transform: `scale(1.02) rotate(${rotation + 2}deg)`,
                }
            }}
        >
            <Box sx={{ position: 'relative' }}>
                <PolaroidFrame
                    src={highlight.media_file}
                    caption={highlight.text}
                    author={highlight.author_username}
                    rotation={rotation}
                />

                {/* Cute Interaction Badges */}
                <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{
                        position: 'absolute',
                        bottom: 20,
                        right: 15,
                        zIndex: 2,
                        transform: 'rotate(-5deg)'
                    }}
                >
                    <Box sx={{
                        bgcolor: 'rgba(255,255,255,0.9)',
                        px: 1,
                        py: 0.5,
                        borderRadius: '4px',
                        boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        border: '1px solid #eee'
                    }}>
                        <Heart size={14} fill={highlight.user_has_liked ? "#ef4444" : "none"} color={highlight.user_has_liked ? "#ef4444" : "#666"} />
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: '"Caveat"', fontWeight: 700 }}>
                            {highlight.likes_count}
                        </Typography>
                    </Box>
                    <Box sx={{
                        bgcolor: 'rgba(255,255,255,0.9)',
                        px: 1,
                        py: 0.5,
                        borderRadius: '4px',
                        boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        border: '1px solid #eee'
                    }}>
                        <MessageCircle size={14} color="#666" />
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: '"Caveat"', fontWeight: 700 }}>
                            {highlight.comments_count}
                        </Typography>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
};
