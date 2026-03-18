import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/hooks';
import { useAddHighlightComment, useHighlightComments } from '@/features/events/hooks';

import {
  HighlightCommentComposer,
  HighlightCommentList,
} from './HighlightCommentSheetParts';

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
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});

  const comments = commentsResponse?.data || [];

  const setReplyDraft = (commentId: number, value: string) => {
    setReplyDrafts((current) => ({
      ...current,
      [commentId]: value,
    }));
  };

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
        payload: { text: text.trim(), parent: parentId },
      },
      {
        onSuccess: () => {
          if (parentId) {
            setReplyDraft(parentId, '');
          } else {
            setCommentText('');
          }
          setReplyTo(null);
        },
        onError: () => {
          toast.error('Could not send your comment');
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
        bgcolor: '#fff',
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: { xs: 1.5, sm: 2 },
          py: 1,
          maxHeight,
          background:
            'linear-gradient(180deg, #ffffff 0%, #f8fafc 72%, #f8fafc 100%)',
        }}
      >
        {comments.length > 0 ? (
          <HighlightCommentList
            comments={comments}
            activeReplyId={replyTo}
            onReply={setReplyTo}
            onReplyTextChange={setReplyDraft}
            replyDrafts={replyDrafts}
            onSubmitReply={(text, parentId) => handleAddComment(text, parentId)}
          />
        ) : (
          <Box
            sx={{
              minHeight: 240,
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
              px: 3,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                No comments yet
              </Typography>
              <Typography sx={{ mt: 0.75, fontSize: '0.92rem', color: '#6b7280' }}>
                {isAuthenticated
                  ? 'Start the conversation on this highlight.'
                  : 'Sign in to leave the first comment.'}
              </Typography>
              <Typography sx={{ mt: 1, fontSize: '0.8rem', color: '#9ca3af' }}>
                {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <HighlightCommentComposer
        isAuthenticated={isAuthenticated}
        commentText={commentText}
        onChange={setCommentText}
        onSubmit={() => handleAddComment(commentText)}
        isSubmitting={addComment.isPending || !highlightId}
      />
    </Box>
  );
};
