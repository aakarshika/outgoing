import { Box, Typography } from '@mui/material';
import { Star } from 'lucide-react';

import { UserAvatar } from '@/components/ui/UserAvatar';

interface NormalReviewsModuleProps {
  event: any;
  reviews: any[];
  canWriteReview?: boolean;
  onOpenReviewComposer?: () => void;
  currentUsername?: string;
}

export function NormalReviewsModule({
  event,
  reviews,
  canWriteReview = false,
  onOpenReviewComposer,
  currentUsername,
}: NormalReviewsModuleProps) {
  const hostReviews = event.host_reviews || reviews || [];
  const hasUserReview = hostReviews.some(
    (review: any) =>
      review.reviewer_username === currentUsername || review.username === currentUsername,
  );
  const canLeaveReview = canWriteReview && event.user_has_ticket && !hasUserReview;

  return (
    <Box sx={{ px: 2, pt: 2 }}>
      <Typography
        sx={{
          fontFamily: '"Syne", sans-serif',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-text-primary, #111)',
          mb: 1.25,
          letterSpacing: '0.01em',
        }}
      >
        Word on the street
      </Typography>

      {hostReviews.length === 0 ? (
        <Box
          sx={{
            border: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
            borderRadius: 'var(--border-radius-lg, 12px)',
            p: 2,
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{ fontSize: 13, color: 'var(--color-text-secondary, #6b7280)' }}
          >
            No reviews yet
          </Typography>
        </Box>
      ) : (
        <Box>
          {hostReviews.slice(0, 5).map((review: any, idx: number) => {
            const reviewerName =
              review.reviewer_name ||
              review.reviewer_username ||
              review.username ||
              'User';
            const reviewerAvatar = review.reviewer_avatar || review.avatar;
            const reviewText = review.comment || review.text || review.review;

            return (
              <Box
                key={idx}
                sx={{
                  border: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
                  borderRadius: 'var(--border-radius-lg, 12px)',
                  p: 1.5,
                  mb: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <UserAvatar
                    src={reviewerAvatar}
                    username={reviewerName}
                    size="xs"
                    className="flex-shrink-0"
                  />
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--color-text-primary, #111)',
                      flex: 1,
                    }}
                  >
                    {reviewerName}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.25, letterSpacing: -1 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        fill={star <= review.rating ? '#EF9F27' : 'none'}
                        stroke={star <= review.rating ? '#EF9F27' : '#d1d5db'}
                      />
                    ))}
                  </Box>
                </Box>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: 'var(--color-text-secondary, #6b7280)',
                    lineHeight: 1.5,
                  }}
                >
                  {reviewText}
                </Typography>
                {review.event_name && (
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: 'var(--color-text-secondary, #6b7280)',
                      mt: 0.5,
                      fontStyle: 'italic',
                    }}
                  >
                    Attended {review.event_name} ·{' '}
                    {review.created_at
                      ? new Date(review.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : ''}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {canLeaveReview && (
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
            Leave a review
          </Box>
        </Box>
      )}
    </Box>
  );
}
