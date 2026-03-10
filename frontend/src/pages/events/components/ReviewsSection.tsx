import { Box, Button as MuiButton, Typography } from '@mui/material';
import { Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { PostItNote } from '@/components/ui/PostItNote';
import { useToggleReviewLike } from '@/features/events/hooks';

import { ReviewCommentDrawer } from './ReviewCommentDrawer';

export const ReviewsSection = ({
  reviews,
  currentUser,
  userHasPurchased,
  setIsReviewOpen,
  onEditReview,
  onDeleteReview,
  isHost,
}: {
  reviews: any[];
  currentUser?: any;
  userHasPurchased: boolean;
  setIsReviewOpen: (v: boolean) => void;
  onEditReview?: (review: any) => void;
  onDeleteReview?: (reviewId: number) => void;
  isHost: boolean;
}) => {
  const userReview = reviews.find((r) => r.username === currentUser?.username);
  const toggleLike = useToggleReviewLike();

  const [selectedReviewForComments, setSelectedReviewForComments] = useState<any>(null);

  const handleLike = (reviewId: number) => {
    if (!currentUser) return; // or show toast to login
    toggleLike.mutate(reviewId);
  };

  return (
    <Box>
      {reviews.length > 0 && (
        <Typography variant="h3" sx={{ mb: 4 }}>
          What they thought
        </Typography>
      )}

      {reviews.length > 0 ? (
        reviews.map((rev: any, idx: number) => {
          const isOwnReview = currentUser && rev.username === currentUser.username;
          return (
            <Box key={rev.id} sx={{ position: 'relative', mb: 2 }}>
              <PostItNote
                username={rev.username}
                rating={rev.rating}
                comment={rev.comment}
                avatar={rev.avatar}
                datetime={rev.datetime}
                vendorReviews={rev.vendorReviews}
                likesCount={rev.likesCount}
                commentsCount={rev.commentsCount}
                userHasLiked={rev.userHasLiked}
                onLike={() => handleLike(rev.id)}
                onComment={() => setSelectedReviewForComments(rev)}
                color={['#fff740', '#ff7eb9', '#7afcff'][idx % 3]}
              />
              {isOwnReview && (
                <Box
                  sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}
                >
                  <MuiButton
                    size="small"
                    startIcon={<Edit2 size={16} />}
                    onClick={() => onEditReview?.(rev)}
                  >
                    Edit
                  </MuiButton>
                  <MuiButton
                    size="small"
                    color="error"
                    startIcon={<Trash2 size={16} />}
                    onClick={() => {
                      if (
                        window.confirm('Are you sure you want to delete your review?')
                      ) {
                        onDeleteReview?.(rev.id);
                      }
                    }}
                  >
                    Delete
                  </MuiButton>
                </Box>
              )}
            </Box>
          );
        })
      ) : (
        <Typography
          sx={{
            fontStyle: 'italic',
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          {isHost
            ? 'No notes yet.'
            : userReview
              ? 'Be the first to review this event!'
              : ''}
        </Typography>
      )}

      {userHasPurchased && !userReview && !isHost && (
        <MuiButton
          fullWidth
          variant="contained"
          onClick={() => setIsReviewOpen(true)}
          sx={{
            bgcolor: 'warning.main',
            color: 'black',
            fontWeight: 'bold',
            '&:hover': { bgcolor: '#f59e0b' },
            mt: 2,
          }}
        >
          Leave a Review
        </MuiButton>
      )}

      <ReviewCommentDrawer
        reviewId={selectedReviewForComments?.id || null}
        commentsCount={selectedReviewForComments?.commentsCount || 0}
        isOpen={!!selectedReviewForComments}
        onClose={() => setSelectedReviewForComments(null)}
      />
    </Box>
  );
};
