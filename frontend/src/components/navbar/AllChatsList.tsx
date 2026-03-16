import { ChevronRight, MessageCircle, Users, X } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/features/auth/hooks';
import { useChatDrawer } from '@/features/events/ChatDrawerContext';
import { buildAllChatEntries, formatChatTimestamp } from '@/features/events/chatList';
import {
  useAllChatsList,
  useEventOverviewRows,
  useMyFriendships,
} from '@/features/events/hooks';

import { useNavbarContext } from './NavbarContext';

function EmptyState({ label }: { label: string }) {
  return (
    <div
      className="px-3 py-6 text-center text-sm"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      {label}
    </div>
  );
}

function ChatListAvatar({
  chat,
}: {
  chat: {
    mode: string;
    title: string;
    coverImage?: string | null;
    otherAvatar?: string | null;
    otherUsername?: string | null;
  };
}) {
  if (chat.mode === 'group') {
    return chat.coverImage ? (
      <img
        src={chat.coverImage}
        alt={chat.title}
        className="h-12 w-16 shrink-0 object-cover"
      />
    ) : (
      <div
        className="flex h-12 w-16 shrink-0 items-center justify-center"
        style={{ background: '#FAECE7', color: '#D85A30' }}
      >
        <Users className="h-4 w-4" />
      </div>
    );
  }

  return (
    <UserAvatar
      src={chat.otherAvatar}
      username={chat.otherUsername || chat.title}
      size="md"
    />
  );
}

export function AllChatsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAllChatsSidebarOpen, setIsAllChatsSidebarOpen, isAuthenticated } =
    useNavbarContext();
  const { openChat } = useChatDrawer();
  const { data, isLoading } = useAllChatsList(isAuthenticated && isAllChatsSidebarOpen);
  const { data: friendships, isLoading: friendshipsLoading } = useMyFriendships(
    isAuthenticated && isAllChatsSidebarOpen,
  );
  const { data: eventOverviewRows, isLoading: eventOverviewLoading } =
    useEventOverviewRows(isAuthenticated && isAllChatsSidebarOpen);

  const chatEntries = useMemo(
    () =>
      buildAllChatEntries({
        response: data?.data,
        friendships: friendships?.accepted,
        eventOverviewRows: eventOverviewRows || [],
        currentUserId: user?.id,
        currentUsername: user?.username,
      }),
    [data?.data, eventOverviewRows, friendships?.accepted, user?.id, user?.username],
  );
  const managementChats = chatEntries.filter((chat) => chat.section === 'management');
  const networkChats = chatEntries.filter((chat) => chat.section === 'network');
  const sections = [
    { label: 'Management', chats: managementChats },
    { label: 'Network', chats: networkChats },
  ];
  const isListLoading = isLoading || friendshipsLoading || eventOverviewLoading;

  const handleOpenChat = (chat: (typeof chatEntries)[number]) => {
    openChat({
      title: chat.title,
      mode: chat.mode === 'direct' ? 'direct' : chat.mode,
      eventId: chat.eventId,
      conversationId: chat.conversationId,
      targetUsername: chat.targetUsername,
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
        className={`fixed right-0 top-16 z-[60] flex h-[calc(100vh-4rem)] w-[26rem] max-w-[92vw] flex-col transition-transform duration-200 ${isAllChatsSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          background: '#fff8f1',
        }}
      >
        <div className="flex items-center justify-between px-2 py-1.5">
          <button
            type="button"
            onClick={() => {
              setIsAllChatsSidebarOpen(false);
              navigate('/chats');
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Open page
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Collapse all chats sidebar"
            onClick={() => setIsAllChatsSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-1">
          {isListLoading ? <EmptyState label="Loading chats..." /> : null}
          {!isListLoading && chatEntries.length === 0 ? (
            <EmptyState label="No chats yet." />
          ) : null}

          {sections.map((section) =>
            section.chats.length ? (
              <section key={section.label}>
                <p
                  className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {section.label}
                </p>
                <div>
                  {section.chats.map((chat) => (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => handleOpenChat(chat)}
                      className="w-full px-2 py-2 text-left transition-colors"
                      style={{
                        background: chat.isPlaceholder
                          ? 'rgba(0,0,0,0.02)'
                          : 'transparent',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <ChatListAvatar chat={chat} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div
                              className="truncate text-[13px] font-semibold"
                              style={{
                                fontFamily: 'Syne, sans-serif',
                                color: 'var(--color-text-primary)',
                              }}
                            >
                              {chat.title}
                            </div>
                            <div
                              className="shrink-0 text-[11px]"
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              {formatChatTimestamp(chat.updatedAt)}
                            </div>
                          </div>
                          <div
                            className="mt-0.5 truncate text-[11px]"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {chat.subtitle}
                          </div>
                        </div>

                        <MessageCircle
                          className="h-4 w-4 shrink-0"
                          style={{ color: 'var(--color-text-secondary)' }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ) : null,
          )}
        </div>
      </aside>
    </>
  );
}
