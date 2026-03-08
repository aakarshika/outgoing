import {
    Box,
    IconButton,
    Typography,
    Drawer,
} from '@mui/material';
import { X } from 'lucide-react';
import { HighlightComments } from './HighlightComments';

interface HighlightCommentDrawerProps {
    highlightId: number | null;
    commentsCount: number;
    isOpen: boolean;
    onClose: () => void;
}

export const HighlightCommentDrawer = ({ highlightId, commentsCount, isOpen, onClose }: HighlightCommentDrawerProps) => {
    return (
        <Drawer
            anchor="bottom"
            open={isOpen}
            onClose={onClose}
            PaperProps={{
                sx: {
                    height: '85%',
                    maxWidth: { md: '600px' },
                    mx: 'auto',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: '#f4f1ea',
                    backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
                    backgroundSize: '15px 15px',
                    borderTopLeftRadius: '20px',
                    borderTopRightRadius: '20px',
                    border: '3px solid #333',
                    borderBottom: 'none'
                }
            }}
            sx={{
                zIndex: 2500
            }}
        >
            {/* Header */}
            <Box sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                borderBottom: '2px solid #333',
                position: 'relative',
                bgcolor: 'white'
            }}>
                {/* Washi tape decor */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -10,
                        left: '40%',
                        width: '80px',
                        height: '20px',
                        bgcolor: 'rgba(252, 211, 77, 0.6)',
                        transform: 'rotate(-2deg)',
                        zIndex: 1,
                        border: '1px solid rgba(0,0,0,0.1)'
                    }}
                />

                <Typography
                    sx={{
                        flex: 1,
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '1.2rem',
                        fontFamily: '"Permanent Marker", cursive',
                        transform: 'rotate(-1deg)'
                    }}
                >
                    {commentsCount} thoughts ✏️
                </Typography>
                <IconButton onClick={onClose} size="small" sx={{ color: '#333' }}>
                    <X size={24} />
                </IconButton>
            </Box>

            <HighlightComments
                highlightId={highlightId}
                commentsCount={commentsCount}
            />
        </Drawer>
    );
};
