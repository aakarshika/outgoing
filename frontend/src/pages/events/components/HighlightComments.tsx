import { Box } from '@mui/material';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/hooks';
import { useAddHighlightComment, useHighlightComments } from '@/features/events/hooks';

import { NestedCommentsThread } from './NestedCommentsThread';

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
  const [replyTo, setReplyTo] = useState<string | number | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const comments = commentsResponse?.data || [];

  const setReplyDraft = (commentId: string | number, value: string) => {
    setReplyDrafts((current) => ({
      ...current,
      [String(commentId)]: value,
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
      <NestedCommentsThread
        comments={comments}
        commentsCount={commentsCount}
        isAuthenticated={isAuthenticated}
        commentText={commentText}
        onCommentTextChange={setCommentText}
        onSubmitComment={() => handleAddComment(commentText)}
        isSubmitting={addComment.isPending || !highlightId}
        activeReplyId={replyTo}
        onReply={setReplyTo}
        onReplyTextChange={setReplyDraft}
        replyDrafts={replyDrafts}
        onSubmitReply={(text, parentId) => handleAddComment(text, Number(parentId))}
        emptyTitle="No comments yet"
        emptySubtitle={
          isAuthenticated
            ? 'Start the conversation on this highlight.'
            : 'Sign in to leave the first comment.'
        }
        maxHeight={maxHeight}
      />
    </Box>
  );
};
