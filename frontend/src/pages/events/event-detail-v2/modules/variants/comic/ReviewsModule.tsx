import type { UseMutationResult } from '@tanstack/react-query';
import { useState } from 'react';

import { ReviewsSection } from '@/pages/events/components/ReviewsSection';

interface ComicReviewsModuleProps {
  event: any;
  reviews: any[];
  isHost: boolean;
  user: any;
  deleteReview: UseMutationResult<any, any, any, any>;
}

export function ComicReviewsModule({
  event,
  reviews,
  isHost,
  user,
  deleteReview,
}: ComicReviewsModuleProps) {
  const [, setIsReviewOpen] = useState(false);

  const handleEditReview = (review: any) => {
    setIsReviewOpen(true);
  };

  const handleDeleteReview = (reviewId: number) => {
    deleteReview.mutate(reviewId);
  };

  return (
    <ReviewsSection
      reviews={reviews}
      currentUser={user}
      userHasPurchased={event?.user_has_ticket || false}
      setIsReviewOpen={setIsReviewOpen}
      onEditReview={handleEditReview}
      onDeleteReview={handleDeleteReview}
      isHost={isHost}
    />
  );
}
