import { useNavigate } from 'react-router-dom';

import { useToggleInterest } from '@/features/events/hooks';

interface ComicSaveTheDateModuleProps {
  event: any;
  isAuthenticated: boolean;
}

export function ComicSaveTheDateModule({
  event,
  isAuthenticated,
}: ComicSaveTheDateModuleProps) {
  const navigate = useNavigate();
  const toggleInterest = useToggleInterest();

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    toggleInterest.mutate({
      eventId: event.id,
      isInterested: !event.user_is_interested,
    });
  };

  return null;
}
