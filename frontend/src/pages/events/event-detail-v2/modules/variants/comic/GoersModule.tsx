import { AttendingList } from '@/pages/events/components/AttendingList';

interface ComicGoersModuleProps {
  event: any;
  isEventOver: boolean;
}

export function ComicGoersModule({ event, isEventOver }: ComicGoersModuleProps) {
  const attendees = event?.attendees || [];
  return <AttendingList attendees={attendees} isEventOver={isEventOver} />;
}
