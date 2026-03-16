import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/hooks';

import { useToggleInterest } from './hooks';

interface LikeButtonProps {
  eventId: number;
  initialIsInterested?: boolean;
  initialInterestCount?: number;
  className?: string;
}

export const LikeButton = ({
  eventId,
  initialIsInterested = false,
  initialInterestCount = 0,
  className,
}: LikeButtonProps) => {
  const { isAuthenticated } = useAuth();
  const toggleInterest = useToggleInterest();
  const [isInterested, setIsInterested] = useState(initialIsInterested);
  const [interestCount, setInterestCount] = useState(initialInterestCount);

  // Sync state if props change
  useEffect(() => {
    setIsInterested(initialIsInterested);
    setInterestCount(initialInterestCount);
  }, [initialIsInterested, initialInterestCount]);

  const handleInterestClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;

    // Optimistic update
    const newIsInterested = !isInterested;
    setIsInterested(newIsInterested);
    setInterestCount((prev) => (newIsInterested ? prev + 1 : Math.max(0, prev - 1)));

    // useToggleInterest mutation expects the old state
    toggleInterest.mutate({
      eventId,
      isInterested: !newIsInterested,
    });
  };

  return (
    <button
      onClick={handleInterestClick}
      className={
        className ??
        'absolute top-2 left-2 flex items-center gap-1 rounded-full bg-white/80 backdrop-blur-sm p-1.5 transition-all hover:bg-white hover:scale-110 shadow-sm z-10'
      }
      aria-label={isInterested ? 'Remove interest' : 'Mark interested'}
    >
      <Heart
        size={16}
        className={`transition-colors ${
          isInterested ? 'fill-red-500 text-red-500' : 'text-gray-500'
        }`}
      />
      {interestCount > 0 && (
        <span
          className={`text-xs font-semibold pr-1 ${
            isInterested ? 'text-red-500' : 'text-gray-600'
          }`}
        >
          {interestCount}
        </span>
      )}
    </button>
  );
};
