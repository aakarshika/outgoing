import { Box, Drawer, IconButton, InputBase, Paper, Typography } from '@mui/material';
import { Send, X } from 'lucide-react';
import { useState } from 'react';

import { Hostname } from '@/components/ui/Hostname';
import { useAuth } from '@/features/auth/hooks';
import { useAddReviewComment, useReviewComments } from '@/features/events/hooks';

// --- Comment Item Component ---
const CommentItem = ({
  comment,
  onReply,
  activeReplyId,
  onSubmitReply,
}: {
  comment: any;
  onReply: (id: number) => void;
  activeReplyId: number | null;
  onSubmitReply: (text: string, parentId: number) => void;
}) => {
  const [replyText, setReplyText] = useState('');

  const handleSubmit = () => {
    if (!replyText.trim()) return;
    onSubmitReply(replyText, comment.id);
    setReplyText('');
  };

  return (
    <Box
      sx={{
        mb: 2,
        ml: comment.parent ? 3 : 0,
        borderLeft: comment.parent ? '2px solid #333' : 'none',
        pl: comment.parent ? 2 : 0,
      }}
    >
      <Box sx={{ mb: 1 }}>
        <Hostname
          username={comment.author_username}
          avatarSrc={comment.author_avatar}
          mode="normal"
        />
      </Box>
      <Box sx={{ mt: 0.5, ml: 4.5 }}>
        <Typography
          variant="body2"
          sx={{
            fontFamily: '"Caveat", cursive',
            fontSize: '1.2rem',
            lineHeight: 1.2,
          }}
        >
          {comment.text}
        </Typography>
        <button
          onClick={() => onReply(comment.id)}
          className="font-bold text-blue-500 underline decoration-dashed underline-offset-4 hover:text-blue-600 transition-colors"
          style={{
            fontFamily: '"Caveat", cursive',
            fontSize: '1rem',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
          }}
        >
          Reply
        </button>

        {activeReplyId === comment.id && (
          <Box sx={{ mt: 2, mb: 1 }}>
            <Paper
              sx={{
                p: '4px 12px',
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'white',
                borderRadius: 0,
                border: '2px solid #333',
                boxShadow: '2px 2px 0px #333',
              }}
            >
              <InputBase
                sx={{
                  ml: 1,
                  flex: 1,
                  fontFamily: '"Caveat", cursive',
                  fontSize: '1.1rem',
                }}
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
              <IconButton
                sx={{ p: 1, color: '#333' }}
                onClick={handleSubmit}
                disabled={!replyText.trim()}
              >
                <Send size={18} />
              </IconButton>
            </Paper>
          </Box>
        )}
      </Box>
      {comment.replies?.map((reply: any) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          onReply={onReply}
          activeReplyId={activeReplyId}
          onSubmitReply={onSubmitReply}
        />
      ))}
    </Box>
  );
};

interface ReviewCommentDrawerProps {
  reviewId: number | null;
  commentsCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewCommentDrawer = ({
  reviewId,
  commentsCount,
  isOpen,
  onClose,
}: ReviewCommentDrawerProps) => {
  const { isAuthenticated } = useAuth();
  const { data: commentsResponse } = useReviewComments(reviewId || 0);
  const addComment = useAddReviewComment();
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);

  const handleAddComment = (text: string, parentId?: number) => {
    if (!text.trim() || !reviewId) return;
    addComment.mutate(
      {
        reviewId: reviewId,
        payload: { text, parent: parentId },
      },
      {
        onSuccess: () => {
          if (!parentId) setCommentText('');
          setReplyTo(null);
        },
      },
    );
  };

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
          borderBottom: 'none',
        },
      }}
      sx={{
        zIndex: 2500,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '2px solid #333',
          position: 'relative',
          bgcolor: 'white',
        }}
      >
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
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        />

        <Typography
          sx={{
            flex: 1,
            textAlign: 'center',
            fontWeight: 700,
            fontSize: '1.2rem',
            fontFamily: '"Permanent Marker", cursive',
            transform: 'rotate(-1deg)',
          }}
        >
          {commentsCount} comments 💬
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: '#333' }}>
          <X size={24} />
        </IconButton>
      </Box>

      {/* Comments List */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 3,
          backgroundImage: 'linear-gradient(transparent 95%, #e5e7eb 100%)',
          backgroundSize: '100% 32px',
        }}
      >
        {commentsResponse?.data?.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReply={(id) => setReplyTo(id)}
            activeReplyId={replyTo}
            onSubmitReply={(text, parentId) => handleAddComment(text, parentId)}
          />
        ))}
      </Box>

      {/* Bottom Input (Footer) - for new top-level comments */}
      <Box
        sx={{
          p: 2,
          borderTop: '2px solid #333',
          bgcolor: 'white',
          pb: 'calc(env(safe-area-inset-bottom) + 16px)',
        }}
      >
        <Paper
          sx={{
            p: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'white',
            borderRadius: 0,
            border: '2px solid #333',
            boxShadow: '3px 3px 0px #333',
          }}
        >
          <InputBase
            sx={{
              ml: 1,
              flex: 1,
              fontFamily: '"Caveat", cursive',
              fontSize: '1.2rem',
            }}
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(commentText)}
          />
          <IconButton
            sx={{ p: 1, color: '#333' }}
            onClick={() => handleAddComment(commentText)}
            disabled={!commentText.trim()}
          >
            <Send size={20} />
          </IconButton>
        </Paper>
      </Box>
    </Drawer>
  );
};
