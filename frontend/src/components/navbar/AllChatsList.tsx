import { MessageSquare, X } from 'lucide-react';

import { Hostname } from '@/components/ui/Hostname';
import { useChatDrawer } from '@/features/events/ChatDrawerContext';
import { useAllChatsList } from '@/features/events/hooks';
import { useNavbarContext } from './NavbarContext';

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
      {label}
    </div>
  );
}

export function AllChatsList() {
  const { isAllChatsSidebarOpen, setIsAllChatsSidebarOpen, isAuthenticated } = useNavbarContext();
  const { openChat } = useChatDrawer();
  const { data, isLoading } = useAllChatsList(isAuthenticated && isAllChatsSidebarOpen);

  const managementGroupChats = data?.data.management_group ?? [];
  const managementChats = data?.data.management ?? [];
  const networkChats = data?.data.network ?? [];

  const handleOpenPrivateConversation = (chat: {
    conversation_id: number;
    event_id: number | null;
    event_title: string | null;
    other_username: string | null;
  }) => {
    openChat({
      title: chat.event_title || (chat.other_username ? `Chat with ${chat.other_username}` : 'Chat'),
      mode: 'private',
      eventId: chat.event_id ?? undefined,
      conversationId: chat.conversation_id,
    });
    setIsAllChatsSidebarOpen(false);
  };

  const handleOpenGroupConversation = (chat: { event_id: number; event_title: string }) => {
    openChat({
      title: chat.event_title || 'Event Group Chat',
      mode: 'group',
      eventId: chat.event_id,
    });
    setIsAllChatsSidebarOpen(false);
  };

  return (
    <>
      {isAllChatsSidebarOpen && (
        <button
          type="button"
          aria-label="Close all chats sidebar"
          className="fixed inset-0 top-16 z-[55] bg-black/40"
          onClick={() => setIsAllChatsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed right-0 top-16 z-[60] flex h-[calc(100vh-4rem)] w-[26rem] max-w-[92vw] flex-col border-l border-gray-200 bg-white p-4 transition-transform duration-200 ${isAllChatsSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">All Chats</h2>
            <p className="text-sm text-gray-600">
              Management + network conversations
            </p>
          </div>
          <button
            type="button"
            aria-label="Collapse all chats sidebar"
            onClick={() => setIsAllChatsSidebarOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          <section>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-600">Management</p>
            <div className="space-y-2">
              {isLoading ? <EmptyState label="Loading management chats..." /> : null}
              {!isLoading && managementGroupChats.length === 0 && managementChats.length === 0 ? (
                <EmptyState label="No management chats yet." />
              ) : null}
              {managementGroupChats.map((chat) => (
                <button
                  key={`management-group-${chat.event_id}`}
                  type="button"
                  onClick={() => handleOpenGroupConversation(chat)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-3 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-medium text-gray-900">
                        {chat.event_title || 'Event Group Chat'}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        group chat • event #{chat.event_id}
                      </div>
                    </div>
                    <MessageSquare className="mt-1 h-4 w-4 shrink-0 text-gray-500" />
                  </div>
                </button>
              ))}
              {managementChats.map((chat) => (
                <button
                  key={`management-${chat.conversation_id}`}
                  type="button"
                  onClick={() => handleOpenPrivateConversation(chat)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-3 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-medium text-gray-900">
                        {chat.event_title || 'Event Chat'}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        event #{chat.event_id} • convo #{chat.conversation_id}
                      </div>
                    </div>
                    <MessageSquare className="mt-1 h-4 w-4 shrink-0 text-gray-500" />
                  </div>
                  {chat.other_username ? (
                    <div className="mt-3">
                      <Hostname
                        username={chat.other_username}
                        avatarSrc={chat.other_avatar || undefined}
                        mode="normal"
                        sx={{ '& .MuiTypography-root': { fontSize: '0.85rem' } }}
                      />
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-600">Network</p>
            <div className="space-y-2">
              {isLoading ? <EmptyState label="Loading network chats..." /> : null}
              {!isLoading && networkChats.length === 0 ? (
                <EmptyState label="No network chats yet." />
              ) : null}
              {networkChats.map((chat) => (
                <button
                  key={`network-${chat.conversation_id}`}
                  type="button"
                  onClick={() => handleOpenPrivateConversation(chat)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-3 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-medium text-gray-900">
                        {chat.other_username || 'Direct Chat'}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        user #{chat.other_user_id} • convo #{chat.conversation_id}
                      </div>
                    </div>
                    <MessageSquare className="mt-1 h-4 w-4 shrink-0 text-gray-500" />
                  </div>
                  {chat.other_username ? (
                    <div className="mt-3">
                      <Hostname
                        username={chat.other_username}
                        avatarSrc={chat.other_avatar || undefined}
                        mode="normal"
                        sx={{ '& .MuiTypography-root': { fontSize: '0.85rem' } }}
                      />
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
