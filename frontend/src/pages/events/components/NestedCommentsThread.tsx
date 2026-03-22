import { Box, IconButton, InputBase, Paper, Stack, Typography } from '@mui/material';
import { Send, Smile, X } from 'lucide-react';

import { UserAvatar } from '@/components/ui/UserAvatar';

const threadBorder = '1px solid rgba(15, 23, 42, 0.08)';
const mutedText = '#6b7280';
const primaryText = '#111827';
const accent = '#ff6b4a';

const QUICK_REACTIONS = ['❤️', '🔥', '👏', '😍', '😂', '🙌'];

export type NestedComment = {
  id: string | number;
  author_username: string;
  author_avatar?: string | null;
  text: string;
  parent?: string | number | null;
  created_at?: string;
  replies?: NestedComment[];
};

function formatRelativeTime(value?: string) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute');
  }

  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }

  if (Math.abs(diffDays) < 7) {
    return formatter.format(diffDays, 'day');
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function NestedCommentsHeader({
  commentsCount,
  onClose,
}: {
  commentsCount: number;
  onClose: () => void;
}) {
  return (
    <Box
      sx={{
        px: 2,
        pt: 1,
        pb: 1.25,
        borderBottom: threadBorder,
        bgcolor: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(18px)',
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 4,
          borderRadius: 999,
          bgcolor: 'rgba(148, 163, 184, 0.65)',
          mx: 'auto',
          mb: 1.25,
        }}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '40px 1fr 40px',
          alignItems: 'center',
          minHeight: 40,
        }}
      >
        <Box />
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.97rem', fontWeight: 700, color: primaryText }}>
            Comments
          </Typography>
          <Typography sx={{ mt: 0.15, fontSize: '0.75rem', color: mutedText }}>
            {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            justifySelf: 'end',
            color: '#475569',
          }}
        >
          <X size={18} />
        </IconButton>
      </Box>
    </Box>
  );
}

function ReplyComposer({
  value,
  onChange,
  onSubmit,
  onCancel,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        mt: 1,
        ml: 5.5,
        px: 1.25,
        py: 0.75,
        borderRadius: 3,
        border: threadBorder,
        bgcolor: '#f9fafb',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <InputBase
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Write a reply..."
          sx={{
            flex: 1,
            fontSize: '0.92rem',
            color: primaryText,
          }}
        />
        <Typography
          component="button"
          onClick={onCancel}
          sx={{
            border: 'none',
            background: 'none',
            p: 0,
            fontSize: '0.8rem',
            fontWeight: 600,
            color: mutedText,
            cursor: 'pointer',
          }}
        >
          Cancel
        </Typography>
        <IconButton
          size="small"
          onClick={onSubmit}
          disabled={!value.trim()}
          sx={{
            width: 28,
            height: 28,
            bgcolor: accent,
            color: '#fff',
            '&:hover': { bgcolor: '#ef5a38' },
            '&.Mui-disabled': {
              bgcolor: 'rgba(148, 163, 184, 0.35)',
              color: 'rgba(255,255,255,0.9)',
            },
          }}
        >
          <Send size={14} />
        </IconButton>
      </Stack>
    </Paper>
  );
}

function NestedCommentRow({
  comment,
  depth,
  activeReplyId,
  onReply,
  onReplyTextChange,
  replyDrafts,
  onSubmitReply,
}: {
  comment: NestedComment;
  depth: number;
  activeReplyId: string | number | null;
  onReply: (id: string | number | null) => void;
  onReplyTextChange: (commentId: string | number, value: string) => void;
  replyDrafts: Record<string, string>;
  onSubmitReply: (text: string, parentId: string | number) => void;
}) {
  const isReplying = activeReplyId === comment.id;
  const replyValue = replyDrafts[String(comment.id)] || '';
  const replyCount = comment.replies?.length || 0;

  return (
    <Box sx={{ pl: depth > 0 ? 2.25 : 0, position: 'relative' }}>
      {depth > 0 && (
        <Box
          sx={{
            position: 'absolute',
            left: 13,
            top: 8,
            bottom: 8,
            width: 1.5,
            borderRadius: 999,
            bgcolor: 'rgba(226, 232, 240, 0.95)',
          }}
        />
      )}

      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          gap: 1.1,
          alignItems: 'flex-start',
          py: 1.1,
        }}
      >
        <UserAvatar
          src={comment.author_avatar}
          username={comment.author_username}
          size={depth > 0 ? 'xs' : 'sm'}
          className="bg-orange-100 text-orange-700"
        />

        <Box sx={{ flex: 1, minWidth: 0, pr: 0.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 0.75,
              flexWrap: 'wrap',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.86rem',
                fontWeight: 700,
                color: primaryText,
                lineHeight: 1.2,
              }}
            >
              {comment.author_username}
            </Typography>
            <Typography sx={{ fontSize: '0.76rem', color: mutedText }}>
              {formatRelativeTime(comment.created_at)}
            </Typography>
          </Box>

          <Typography
            sx={{
              mt: 0.3,
              fontSize: depth > 0 ? '0.9rem' : '0.94rem',
              lineHeight: 1.45,
              color: primaryText,
              wordBreak: 'break-word',
            }}
          >
            {comment.text}
          </Typography>

          <Stack direction="row" spacing={1.5} sx={{ mt: 0.7 }} alignItems="center">
            <Typography
              component="button"
              onClick={() => onReply(isReplying ? null : comment.id)}
              sx={{
                border: 'none',
                background: 'none',
                p: 0,
                fontSize: '0.76rem',
                fontWeight: 700,
                color: mutedText,
                cursor: 'pointer',
              }}
            >
              Reply
            </Typography>

            {replyCount > 0 && (
              <Typography sx={{ fontSize: '0.76rem', color: mutedText }}>
                {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
              </Typography>
            )}
          </Stack>

          {isReplying && (
            <ReplyComposer
              value={replyValue}
              onChange={(value) => onReplyTextChange(comment.id, value)}
              onCancel={() => onReply(null)}
              onSubmit={() => {
                onSubmitReply(replyValue, comment.id);
                onReplyTextChange(comment.id, '');
              }}
            />
          )}
        </Box>
      </Box>

      {comment.replies?.length ? (
        <Stack spacing={0} sx={{ mt: 0.1 }}>
          {comment.replies.map((reply) => (
            <NestedCommentRow
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              activeReplyId={activeReplyId}
              onReply={onReply}
              onReplyTextChange={onReplyTextChange}
              replyDrafts={replyDrafts}
              onSubmitReply={onSubmitReply}
            />
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}

function NestedCommentList({
  comments,
  activeReplyId,
  onReply,
  onReplyTextChange,
  replyDrafts,
  onSubmitReply,
}: {
  comments: NestedComment[];
  activeReplyId: string | number | null;
  onReply: (id: string | number | null) => void;
  onReplyTextChange: (commentId: string | number, value: string) => void;
  replyDrafts: Record<string, string>;
  onSubmitReply: (text: string, parentId: string | number) => void;
}) {
  return (
    <Stack spacing={0.75}>
      {comments.map((comment) => (
        <NestedCommentRow
          key={comment.id}
          comment={comment}
          depth={0}
          activeReplyId={activeReplyId}
          onReply={onReply}
          onReplyTextChange={onReplyTextChange}
          replyDrafts={replyDrafts}
          onSubmitReply={onSubmitReply}
        />
      ))}
    </Stack>
  );
}

function NestedCommentComposer({
  isAuthenticated,
  commentText,
  onChange,
  onSubmit,
  isSubmitting,
  showQuickReactions,
}: {
  isAuthenticated: boolean;
  commentText: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  showQuickReactions: boolean;
}) {
  return (
    <Box
      sx={{
        borderTop: threadBorder,
        bgcolor: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(18px)',
        pb: 'calc(env(safe-area-inset-bottom) + 12px)',
      }}
    >
      {showQuickReactions ? (
        <Box
          sx={{
            px: 1.5,
            py: 1,
            display: 'flex',
            gap: 0.75,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {QUICK_REACTIONS.map((reaction) => (
            <Box
              key={reaction}
              component="button"
              onClick={() =>
                onChange(commentText ? `${commentText} ${reaction}` : reaction)
              }
              sx={{
                border: 'none',
                bgcolor: '#f3f4f6',
                borderRadius: 999,
                minWidth: 42,
                height: 34,
                px: 1,
                fontSize: '1.1rem',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {reaction}
            </Box>
          ))}
        </Box>
      ) : null}

      <Box sx={{ px: 1.5, pt: showQuickReactions ? 0.25 : 1.25 }}>
        <Paper
          elevation={0}
          sx={{
            px: 1.25,
            py: 0.85,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            borderRadius: 999,
            border: threadBorder,
            boxShadow: '0 10px 28px rgba(15, 23, 42, 0.07)',
          }}
        >
          <UserAvatar
            username="You"
            size="sm"
            className="bg-slate-100 text-slate-600"
          />
          <InputBase
            sx={{
              flex: 1,
              color: primaryText,
              fontSize: '0.93rem',
            }}
            placeholder={
              isAuthenticated ? 'Add a comment...' : 'Sign in to like and comment'
            }
            value={commentText}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onSubmit();
              }
            }}
          />
          <Smile size={18} color={mutedText} />
          <IconButton
            onClick={onSubmit}
            disabled={!commentText.trim() || isSubmitting}
            sx={{
              width: 34,
              height: 34,
              bgcolor: accent,
              color: '#fff',
              '&:hover': { bgcolor: '#ef5a38' },
              '&.Mui-disabled': {
                bgcolor: 'rgba(148, 163, 184, 0.35)',
                color: 'rgba(255,255,255,0.9)',
              },
            }}
          >
            <Send size={16} />
          </IconButton>
        </Paper>
      </Box>
    </Box>
  );
}

export function NestedCommentsThread({
  comments,
  commentsCount,
  isAuthenticated,
  commentText,
  onCommentTextChange,
  onSubmitComment,
  isSubmitting,
  activeReplyId,
  onReply,
  onReplyTextChange,
  replyDrafts,
  onSubmitReply,
  emptyTitle,
  emptySubtitle,
  maxHeight,
  showQuickReactions = true,
}: {
  comments: NestedComment[];
  commentsCount: number;
  isAuthenticated: boolean;
  commentText: string;
  onCommentTextChange: (value: string) => void;
  onSubmitComment: () => void;
  isSubmitting: boolean;
  activeReplyId: string | number | null;
  onReply: (id: string | number | null) => void;
  onReplyTextChange: (commentId: string | number, value: string) => void;
  replyDrafts: Record<string, string>;
  onSubmitReply: (text: string, parentId: string | number) => void;
  emptyTitle: string;
  emptySubtitle: string;
  maxHeight?: string | number;
  showQuickReactions?: boolean;
}) {
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
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 72%, #f8fafc 100%)',
        }}
      >
        {comments.length > 0 ? (
          <NestedCommentList
            comments={comments}
            activeReplyId={activeReplyId}
            onReply={onReply}
            onReplyTextChange={onReplyTextChange}
            replyDrafts={replyDrafts}
            onSubmitReply={onSubmitReply}
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
                {emptyTitle}
              </Typography>
              <Typography sx={{ mt: 0.75, fontSize: '0.92rem', color: '#6b7280' }}>
                {emptySubtitle}
              </Typography>
              <Typography sx={{ mt: 1, fontSize: '0.8rem', color: '#9ca3af' }}>
                {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <NestedCommentComposer
        isAuthenticated={isAuthenticated}
        commentText={commentText}
        onChange={onCommentTextChange}
        onSubmit={onSubmitComment}
        isSubmitting={isSubmitting}
        showQuickReactions={showQuickReactions}
      />
    </Box>
  );
}
