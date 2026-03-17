import { Box, IconButton, InputBase, Paper, Typography } from '@mui/material';
import { Send } from 'lucide-react';
import { useState } from 'react';

import { Hostname } from '@/components/ui/Hostname';
import { useAuth } from '@/features/auth/hooks';
import { useAddHighlightComment, useHighlightComments } from '@/features/events/hooks';

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
                shadow: '2px 2px 0px #333',
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
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
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

interface HighlightCommentsProps {
  highlightId: number | null;
  commentsCount: number;
  maxHeight?: string | number;
}

export const HighlightComments = ({
  highlightId,
  commentsCount,
  maxHeight,
}: HighlightCommentsProps) => {
  const { isAuthenticated } = useAuth();
  const { data: commentsResponse } = useHighlightComments(highlightId || 0);
  const addComment = useAddHighlightComment();
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);

  const handleAddComment = (text: string, parentId?: number) => {
    if (!text.trim() || !highlightId) return;
    addComment.mutate(
      {
        highlightId: highlightId,
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header Section for Web/Context if needed, otherwise just list */}
      {/* Comments List */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 3,
          backgroundImage: 'linear-gradient(transparent 95%, #e5e7eb 100%)',
          backgroundSize: '100% 32px',
          maxHeight: maxHeight,
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
            shadow: '3px 3px 0px #333',
          }}
        >
          <InputBase
            sx={{
              ml: 1,
              flex: 1,
              fontFamily: '"Caveat", cursive',
              fontSize: '1.2rem',
            }}
            placeholder={
              isAuthenticated ? 'Add a comment...' : 'Sign in to like and comment'
            }
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(commentText)}
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
    </Box>
  );
};
