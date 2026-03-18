import { InkNotebookChat } from '@/pages/events/components/InkNotebookChat';

interface ComicGroupChatModuleProps {
  event: any;
  canAccessEventChat: boolean;
}

export function ComicGroupChatModule({
  event,
  canAccessEventChat,
}: ComicGroupChatModuleProps) {
  return (
    <InkNotebookChat
      eventId={event.id}
      eventHostUsername={event.host.username}
      participatingVendors={event.participating_vendors}
      canAccessChat={canAccessEventChat}
    />
  );
}
