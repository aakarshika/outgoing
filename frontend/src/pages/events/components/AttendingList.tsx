import { AttendeeStack } from '@/components/events/AttendeeStack';
import { type Attendee } from '@/components/ui/AttendeePopover';

interface AttendingListProps {
  attendees: Attendee[];
  isEventOver: boolean;
}

export const AttendingList = ({ attendees, isEventOver }: AttendingListProps) => {
  if (!attendees || attendees.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 mb-8">
      <AttendeeStack attendees={attendees} isEventOver={isEventOver} variant="comic" />
    </div>
  );
};
