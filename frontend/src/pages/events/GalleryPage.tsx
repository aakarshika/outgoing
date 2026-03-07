import {
    Avatar,
    Box,
    Button,
    Card,
    Container,
    Divider,
    Grid,
    IconButton,
    InputBase,
    Modal,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import {
    ChevronLeft,
    Heart,
    MessageCircle,
    Send,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';

import { HighlightComposer } from '@/components/events/HighlightComposer';
import { useAuth } from '@/features/auth/hooks';
import {
    useAddHighlightComment,
    useEvent,
    useEventHighlights,
    useHighlightComments,
    useToggleHighlightLike,
} from '@/features/events/hooks';
import { PolaroidFrame } from './components/scrapbookHelpers';

// --- Nested Comment Component ---
const CommentItem = ({ comment, onReply }: { comment: any; onReply: (id: number) => void }) => {
    return (
        <Box sx={{ mb: 2, ml: comment.parent ? 3 : 0, borderLeft: comment.parent ? '1px solid #eee' : 'none', pl: comment.parent ? 2 : 0 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Avatar src={comment.author_avatar} sx={{ width: 24, height: 24 }} />
                <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                            {comment.author_username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                        </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{comment.text}</Typography>
                    <Button
                        size="small"
                        onClick={() => onReply(comment.id)}
                        sx={{ minWidth: 0, p: 0, mt: 0.5, textTransform: 'none', fontSize: '0.75rem', color: 'text.secondary' }}
                    >
                        Reply
                    </Button>
                </Box>
            </Stack>
            {comment.replies?.map((reply: any) => (
                <CommentItem key={reply.id} comment={reply} onReply={onReply} />
            ))}
        </Box>
    );
};

// --- Full Page Highlight View ---
const HighlightDetailModal = ({ highlight, onClose }: { highlight: any; onClose: () => void }) => {
    const { isAuthenticated } = useAuth();
    const { data: commentsResponse } = useHighlightComments(highlight?.id);
    const toggleLike = useToggleHighlightLike();
    const addComment = useAddHighlightComment();
    const [commentText, setCommentText] = useState('');
    const [replyTo, setReplyTo] = useState<number | null>(null);

    if (!highlight) return null;

    const handleToggleLike = () => {
        if (!isAuthenticated) return;
        toggleLike.mutate(highlight.id);
    };

    const handleAddComment = () => {
        if (!commentText.trim()) return;
        addComment.mutate({
            highlightId: highlight.id,
            payload: { text: commentText, parent: replyTo || undefined }
        }, {
            onSuccess: () => {
                setCommentText('');
                setReplyTo(null);
            }
        });
    };

    return (
        <Modal open={!!highlight} onClose={onClose} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper sx={{
                width: '90vw',
                height: '90vh',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                bgcolor: '#fff',
                overflow: 'hidden',
                position: 'relative',
                borderRadius: 2
            }}>
                <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, zIndex: 10, bgcolor: 'rgba(255,255,255,0.8)' }}>
                    <X size={20} />
                </IconButton>

                {/* Left: Image */}
                <Box sx={{
                    flex: { md: 1.5 },
                    bgcolor: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: { xs: '40%', md: '100%' }
                }}>
                    <img src={highlight.media_file} alt={highlight.text} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </Box>

                {/* Right: Comments & Info */}
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: { xs: '60%', md: '100%' },
                    borderLeft: { md: '1px solid #eee' }
                }}>
                    {/* Header */}
                    <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar src={highlight.author_avatar} />
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700}>{highlight.author_username}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Uploaded {format(new Date(highlight.created_at), 'MMM d, yyyy h:mm a')}
                                </Typography>
                            </Box>
                        </Stack>
                        <Typography variant="body1" sx={{ mt: 2 }}>{highlight.text}</Typography>
                    </Box>

                    {/* Comments List */}
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#fafafa' }}>
                        {commentsResponse?.data?.map((comment) => (
                            <CommentItem key={comment.id} comment={comment} onReply={(id) => setReplyTo(id)} />
                        ))}
                    </Box>

                    {/* Actions & Input */}
                    <Box sx={{ p: 2, borderTop: '1px solid #eee' }}>
                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                            <Button
                                startIcon={<Heart fill={highlight.user_has_liked ? "red" : "none"} color={highlight.user_has_liked ? "red" : "currentColor"} />}
                                onClick={handleToggleLike}
                                sx={{ color: highlight.user_has_liked ? 'red' : 'text.primary' }}
                            >
                                {highlight.likes_count}
                            </Button>
                            <Button startIcon={<MessageCircle />} color="inherit">
                                {highlight.comments_count}
                            </Button>
                        </Stack>

                        {replyTo && (
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, bgcolor: '#f0f0f0', p: 1, borderRadius: 1 }}>
                                <Typography variant="caption">Replying to a comment</Typography>
                                <IconButton size="small" onClick={() => setReplyTo(null)}><X size={14} /></IconButton>
                            </Stack>
                        )}

                        <Paper sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', bgcolor: '#f5f5f5', borderRadius: 2 }}>
                            <InputBase
                                sx={{ ml: 1, flex: 1 }}
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                            />
                            <IconButton color="primary" sx={{ p: '10px' }} onClick={handleAddComment}>
                                <Send size={20} />
                            </IconButton>
                        </Paper>
                    </Box>
                </Box>
            </Paper>
        </Modal>
    );
};

export default function GalleryPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: eventResponse } = useEvent(Number(id));
    const { data: highlightsResponse } = useEventHighlights(Number(id), true);
    const [selectedHighlight, setSelectedHighlight] = useState<any>(null);
    const [isAddHighlightOpen, setIsAddHighlightOpen] = useState(false);

    const event = eventResponse?.data;
    const highlights = highlightsResponse?.data || [];

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                <IconButton onClick={() => navigate(-1)}><ChevronLeft /></IconButton>
                <Box>
                    <Typography variant="h4" sx={{ fontFamily: '"Permanent Marker"' }}>
                        Gallery: {event?.title}
                    </Typography>
                    <Typography color="text.secondary">All memories from this event series</Typography>
                </Box>
                <Box sx={{ flex: 1 }} />
                <Button variant="contained" onClick={() => setIsAddHighlightOpen(true)}>Add Highlight</Button>
            </Stack>

            <Grid container spacing={4}>
                {highlights.map((h) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={h.id}>
                        <Box onClick={() => setSelectedHighlight(h)} sx={{ cursor: 'pointer' }}>
                            <PolaroidFrame
                                src={h.media_file}
                                caption={h.text}
                                author={h.author_username}
                            />
                            <Stack direction="row" spacing={2} sx={{ mt: 1, px: 2 }} color="text.secondary">
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Heart size={16} fill={h.user_has_liked ? "currentColor" : "none"} />
                                    <Typography variant="caption">{h.likes_count}</Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <MessageCircle size={16} />
                                    <Typography variant="caption">{h.comments_count}</Typography>
                                </Stack>
                            </Stack>
                        </Box>
                    </Grid>
                ))}
            </Grid>

            <HighlightDetailModal
                highlight={selectedHighlight}
                onClose={() => setSelectedHighlight(null)}
            />

            <HighlightComposer
                eventId={Number(id)}
                isOpen={isAddHighlightOpen}
                onOpenChange={setIsAddHighlightOpen}
            />
        </Container>
    );
}
