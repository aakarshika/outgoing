import { Box, IconButton, InputBase, Paper, Typography } from '@mui/material';
import { Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Hostname } from '@/components/ui/Hostname';
import { useAuth } from '@/features/auth/hooks';
import { useAddHighlightComment, useHighlightComments } from '@/features/events/hooks';

const surfaceBorder = '1px solid rgba(148, 163, 184, 0.18)';

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
        ml: comment.parent ? 3.5 : 0,
        pl: comment.parent ? 2 : 0,
        borderLeft: comment.parent ? '2px solid rgba(216, 90, 48, 0.16)' : 'none',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          mb: 1.5,
          p: 1.5,
          borderRadius: 3,
          bgcolor: 'rgba(255,255,255,0.82)',
          border: surfaceBorder,
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
          <Hostname
            username={comment.author_username}
            avatarSrc={comment.author_avatar}
            mode="normal"
            sx={{
              flex: 1,
              minWidth: 0,
              '& .MuiTypography-root': {
                fontFamily: 'inherit',
              },
            }}
          />
        </Box>

        <Typography
          sx={{
            mt: 1,
            ml: 5.25,
            color: '#0f172a',
            fontSize: '0.97rem',
            lineHeight: 1.55,
          }}
        >
          {comment.text}
        </Typography>

        <Box sx={{ mt: 1, ml: 5.25 }}>
          <button
            onClick={() => onReply(comment.id)}
            style={{
              border: 'none',
              background: 'none',
              padding: 0,
              cursor: 'pointer',
              color: '#D85A30',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}
          >
            Reply
          </button>
        </Box>

        {activeReplyId === comment.id && (
          <Paper
            elevation={0}
            sx={{
              mt: 1.5,
              ml: 5.25,
              px: 1.5,
              py: 0.75,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              borderRadius: 999,
              bgcolor: '#fff',
              border: surfaceBorder,
            }}
          >
            <InputBase
              sx={{ flex: 1, fontSize: '0.94rem', color: '#0f172a' }}
              placeholder="Write a reply..."
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleSubmit()}
              autoFocus
            />
            <IconButton
              size="small"
              onClick={handleSubmit}
              disabled={!replyText.trim()}
              sx={{
                bgcolor: '#D85A30',
                color: 'white',
                '&:hover': { bgcolor: '#c44c22' },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(148, 163, 184, 0.3)',
                  color: 'rgba(255,255,255,0.9)',
                },
              }}
            >
              <Send size={16} />
            </IconButton>
          </Paper>
        )}
      </Paper>

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
    if (!highlightId) return;
    if (!isAuthenticated) {
      toast.error('Sign in to join the conversation');
      return;
    }
    if (!text.trim()) return;

    addComment.mutate(
      {
        highlightId,
        payload: { text, parent: parentId },
      },
      {
        onSuccess: () => {
          if (!parentId) setCommentText('');
          setReplyTo(null);
        },
        onError: () => {
          toast.error('Could not send your comment');
        },
      },
    );
  };

  const comments = commentsResponse?.data || [];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          py: 2,
          maxHeight,
          background:
            'linear-gradient(180deg, rgba(248,250,252,0.72) 0%, rgba(241,245,249,0.9) 100%)',
        }}
      >
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={(id) => setReplyTo(id)}
              activeReplyId={replyTo}
              onSubmitReply={(text, parentId) => handleAddComment(text, parentId)}
            />
          ))
        ) : (
          <Box
            sx={{
              minHeight: 220,
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
              px: 3,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                No comments yet
              </Typography>
              <Typography sx={{ mt: 0.75, fontSize: '0.92rem', color: '#64748b' }}>
                {isAuthenticated
                  ? 'Start the conversation on this highlight.'
                  : 'Sign in to leave the first comment.'}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          p: 2,
          borderTop: surfaceBorder,
          bgcolor: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(14px)',
          pb: 'calc(env(safe-area-inset-bottom) + 16px)',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            px: 1.75,
            py: 0.8,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            borderRadius: 999,
            bgcolor: '#fff',
            border: surfaceBorder,
            boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
          }}
        >
          <InputBase
            sx={{
              flex: 1,
              color: '#0f172a',
              fontSize: '0.95rem',
            }}
            placeholder={
              isAuthenticated ? 'Add a comment...' : 'Sign in to like and comment'
            }
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            onKeyDown={(event) =>
              event.key === 'Enter' && handleAddComment(commentText)
            }
            disabled={!highlightId}
          />
          <IconButton
            onClick={() => handleAddComment(commentText)}
            disabled={!commentText.trim() || addComment.isPending || !highlightId}
            sx={{
              bgcolor: '#D85A30',
              color: 'white',
              '&:hover': { bgcolor: '#c44c22' },
              '&.Mui-disabled': {
                bgcolor: 'rgba(148, 163, 184, 0.3)',
                color: 'rgba(255,255,255,0.9)',
              },
            }}
          >
            <Send size={18} />
          </IconButton>
        </Paper>

        <Typography sx={{ mt: 1, px: 0.5, fontSize: '0.78rem', color: '#94a3b8' }}>
          {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
        </Typography>
      </Box>
    </Box>
  );
};
