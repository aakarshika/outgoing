import { Icon } from '@iconify/react';
import { Box, Collapse, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  PencilLine,
  Star,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Media } from '@/components/ui/media';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/features/auth/hooks';
import {
  useAddReviewComment,
  useReviewComments,
  useToggleReviewLike,
} from '@/features/events/hooks';
import {
  type NestedComment,
  NestedCommentsThread,
} from '@/pages/events/components/NestedCommentsThread';

interface NormalReviewsModuleProps {
  event: any;
  reviews: any[];
  canWriteReview?: boolean;
  onOpenReviewComposer?: () => void;
  currentUsername?: string;
  onEditReview?: (review: any) => void;
  onDeleteReview?: (reviewId: number) => void;
}

const getReviewAuthorName = (review: any) =>
  review.reviewer_name || review.reviewer_username || review.username || 'User';

const getReviewAuthorUsername = (review: any) =>
  review.reviewer_username || review.username || '';

const getReviewAuthorAvatar = (review: any) => review.reviewer_avatar || review.avatar;

const getReviewText = (review: any) =>
  review.comment || review.text || review.review || '';

const getReviewMedia = (review: any) => review.media || review.media_files || [];

const normalizeCommentNodes = (comments: any[] | undefined): NestedComment[] => {
  if (!Array.isArray(comments)) return [];

  return comments.map((comment: any, index: number) => ({
    id:
      comment.id ??
      `${comment.author_username || comment.authorName || 'comment'}-${index}`,
    text: comment.text || comment.comment || '',
    author_username:
      comment.author_username || comment.username || comment.author_name || 'User',
    author_avatar: comment.author_avatar || comment.avatar,
    created_at: comment.created_at || comment.createdAt,
    replies: normalizeCommentNodes(
      comment.replies || comment.children || comment.comments,
    ),
  }));
};

const getReviewComments = (review: any) =>
  normalizeCommentNodes(
    review.comments ||
      review.review_comments ||
      review.commentThreads ||
      review.comment_threads ||
      review.replies,
  );

const formatReviewDate = (value?: string) => {
  if (!value) return '';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

function ReviewCard({
  review,
  currentUsername,
  onEditReview,
  onDeleteReview,
}: {
  review: any;
  currentUsername?: string;
  onEditReview?: (review: any) => void;
  onDeleteReview?: (reviewId: number) => void;
}) {
  const reviewerName = getReviewAuthorName(review);
  const reviewerUsername = getReviewAuthorUsername(review);
  const reviewerAvatar = getReviewAuthorAvatar(review);
  const reviewText = getReviewText(review);
  const reviewMedia = getReviewMedia(review);
  const { isAuthenticated } = useAuth();
  const toggleLike = useToggleReviewLike();
  const { data: commentsResponse } = useReviewComments(review.id || null);
  const addComment = useAddReviewComment();
  const isOwnReview = Boolean(currentUsername) && reviewerUsername === currentUsername;
  const nestedComments = getReviewComments(
    commentsResponse?.data?.length ? { comments: commentsResponse.data } : review,
  );
  const [liked, setLiked] = useState(
    Boolean(review.userHasLiked ?? review.user_has_liked),
  );
  const [likesCount, setLikesCount] = useState(
    Number(review.likesCount ?? review.likes_count ?? 0),
  );
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [replyTo, setReplyTo] = useState<string | number | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const commentsCount = Number(
    review.commentsCount ?? review.comments_count ?? nestedComments.length ?? 0,
  );

  const setReplyDraft = (commentId: string | number, value: string) => {
    setReplyDrafts((current) => ({
      ...current,
      [String(commentId)]: value,
    }));
  };

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error('Sign in to like this review');
      return;
    }

    setLiked((prev) => !prev);
    setLikesCount((prev) => prev + (liked ? -1 : 1));
    toggleLike.mutate(review.id, {
      onError: () => {
        setLiked((prev) => !prev);
        setLikesCount((prev) => prev + (liked ? 1 : -1));
        toast.error('Could not update like right now');
      },
    });
  };

  const handleAddComment = (text: string, parentId?: string | number) => {
    if (!isAuthenticated) {
      toast.error('Sign in to join the conversation');
      return;
    }

    if (!review.id || !text.trim()) return;

    addComment.mutate(
      {
        reviewId: review.id,
        payload: {
          text: text.trim(),
          parent: parentId ? Number(parentId) : undefined,
        },
      },
      {
        onSuccess: () => {
          if (parentId) {
            setReplyDraft(parentId, '');
          } else {
            setCommentDraft('');
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
        border: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
        borderRadius: 'var(--border-radius-lg, 16px)',
        p: 1.5,
        mb: 1.25,
        backgroundColor: 'var(--color-background-primary, #fff)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.75 }}>
        <UserAvatar
          src={reviewerAvatar}
          username={reviewerName}
          size="xs"
          className="flex-shrink-0"
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-text-primary, #111827)',
                  lineHeight: 1.3,
                }}
              >
                {reviewerName}
              </Typography>
              {review.created_at ? (
                <Typography
                  sx={{
                    fontSize: 11,
                    color: 'var(--color-text-secondary, #6b7280)',
                    mt: 0.25,
                  }}
                >
                  {formatReviewDate(review.created_at)}
                </Typography>
              ) : null}
            </Box>

            {isOwnReview ? (
              <>
                <IconButton
                  size="small"
                  onClick={(event) => setMenuAnchor(event.currentTarget)}
                  sx={{
                    color: '#6b7280',
                    width: 28,
                    height: 28,
                  }}
                >
                  <MoreHorizontal size={16} />
                </IconButton>
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={() => setMenuAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem
                    onClick={() => {
                      setMenuAnchor(null);
                      onEditReview?.(review);
                    }}
                  >
                    <PencilLine size={15} style={{ marginRight: 8 }} />
                    Edit review
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setMenuAnchor(null);
                      onDeleteReview?.(review.id);
                    }}
                    sx={{ color: '#b42318' }}
                  >
                    <Trash2 size={15} style={{ marginRight: 8 }} />
                    Delete review
                  </MenuItem>
                </Menu>
              </>
            ) : null}
          </Box>

          <Box sx={{ display: 'flex', gap: 0.25, letterSpacing: -1, mt: 0.75 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={13}
                fill={star <= Number(review.rating || 0) ? '#EF9F27' : 'none'}
                stroke={star <= Number(review.rating || 0) ? '#EF9F27' : '#d1d5db'}
              />
            ))}
          </Box>
        </Box>
      </Box>

      <Typography
        sx={{
          fontSize: 13,
          color: 'var(--color-text-secondary, #4b5563)',
          lineHeight: 1.6,
          mb: 1.25,
        }}
      >
        {reviewText}
      </Typography>

      {reviewMedia.length > 0 ? (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            pb: 0.5,
            mb: 1.25,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {reviewMedia.map((media: any, index: number) => {
            const mediaUrl = media.file || media.url;
            if (!mediaUrl) return null;

            return (
              <Box
                key={media.id ?? `${review.id}-media-${index}`}
                sx={{
                  width: 76,
                  height: 76,
                  flexShrink: 0,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                }}
              >
                <Media
                  src={mediaUrl}
                  alt="review media"
                  className="h-full w-full object-cover"
                />
              </Box>
            );
          })}
        </Box>
      ) : null}

      {review.event_name ? (
        <Typography
          sx={{
            fontSize: 11,
            color: 'var(--color-text-secondary, #6b7280)',
            mb: 1.25,
            fontStyle: 'italic',
          }}
        >
          Attended {review.event_name}
        </Typography>
      ) : null}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
        <Box
          component="button"
          type="button"
          onClick={handleLike}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            border: '1px solid #e5e7eb',
            borderRadius: 999,
            backgroundColor: liked ? '#fff1f2' : '#fff',
            color: liked ? '#e11d48' : '#475569',
            px: 1.25,
            py: 0.75,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
          {likesCount}
        </Box>

        <Box
          component="button"
          type="button"
          onClick={() => setCommentsOpen((prev) => !prev)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            border: '1px solid #e5e7eb',
            borderRadius: 999,
            backgroundColor: commentsOpen ? '#fff7ed' : '#fff',
            color: commentsOpen ? '#c2410c' : '#475569',
            px: 1.25,
            py: 0.75,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <MessageCircle size={14} />
          {commentsCount}
        </Box>
      </Box>

      <Collapse in={commentsOpen}>
        <Box sx={{ mt: 1.5, borderTop: '1px solid #eef2f7' }}>
          <NestedCommentsThread
            comments={nestedComments}
            commentsCount={commentsCount}
            isAuthenticated={isAuthenticated}
            commentText={commentDraft}
            onCommentTextChange={setCommentDraft}
            onSubmitComment={() => handleAddComment(commentDraft)}
            isSubmitting={addComment.isPending}
            activeReplyId={replyTo}
            onReply={setReplyTo}
            onReplyTextChange={setReplyDraft}
            replyDrafts={replyDrafts}
            onSubmitReply={handleAddComment}
            emptyTitle="No comments yet"
            emptySubtitle={
              isAuthenticated
                ? 'Start the conversation on this review.'
                : 'Sign in to leave the first comment.'
            }
            maxHeight={420}
            showQuickReactions={false}
          />
        </Box>
      </Collapse>
    </Box>
  );
}

export function NormalReviewsModule({
  event,
  reviews,
  canWriteReview = false,
  onOpenReviewComposer,
  currentUsername,
  onEditReview,
  onDeleteReview,
}: NormalReviewsModuleProps) {
  const hostReviews = event.host_reviews || reviews || [];
  const hasUserReview = hostReviews.some(
    (review: any) =>
      review.reviewer_username === currentUsername ||
      review.username === currentUsername,
  );
  const canLeaveReview = canWriteReview && event.user_has_ticket && !hasUserReview;

  return (
    <Box sx={{ px: 2, pt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: 'rgb(255, 217, 183)',
          }}
        >
          <Box position="absolute">
            <Icon
              icon="streamline-cyber:bubble-chat-double-text-1"
              width={54}
              height={54}
              color="#D85A30"
            />
          </Box>
        </Box>
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#64748b',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}
        >
          Word on the street
        </Typography>
        <Box sx={{ flex: 1, minWidth: 0, height: '1px', backgroundColor: '#e5e7eb' }} />
      </Box>

      {hostReviews.length === 0 ? null : (
        <Box sx={{ mt: 1.5 }}>
          {hostReviews.slice(0, 5).map((review: any, idx: number) => (
            <ReviewCard
              key={review.id ?? idx}
              review={review}
              currentUsername={currentUsername}
              onEditReview={onEditReview}
              onDeleteReview={onDeleteReview}
            />
          ))}
        </Box>
      )}

      {canLeaveReview ? (
        <Box sx={{ mt: 1.5 }}>
          <Box
            component="button"
            onClick={onOpenReviewComposer}
            sx={{
              width: '100%',
              py: 1.15,
              borderRadius: '12px',
              border: '0.5px solid #D85A30',
              background: '#FFF5F2',
              color: '#D85A30',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Leave event review
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
