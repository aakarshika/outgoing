import { ChevronRight, MapPin, MessageCircle, Users, X } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/features/auth/hooks';
import { useChatDrawer } from '@/features/events/ChatDrawerContext';
import { HostVendorBadge } from '@/features/events/scrapbookCard/ScrapbookCardOverlays';
import {
  buildAllChatEntries,
  formatChatMessagePreview,
  formatChatRelativeTime,
} from '@/features/events/chatList';
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
    groupRole?: 'hosting' | 'servicing' | null;
    badgeLabel?: string;
  };
}) {
  if (chat.mode === 'group') {
    return (
      <div className="relative h-12 w-16 shrink-0">
        {chat.coverImage ? (
          <img
            src={chat.coverImage}
            alt={chat.title}
            className="h-12 w-16 rounded-[12px] object-cover"
          />
        ) : (
          <div
            className="flex h-12 w-16 items-center justify-center rounded-[12px]"
            style={{ background: '#FAECE7', color: '#D85A30' }}
          >
            <Users className="h-4 w-4" />
          </div>
        )}
        {chat.groupRole ? (
          <HostVendorBadge
            isHost={chat.groupRole === 'hosting'}
            variant="short"
            sx={{
              left: -6,
              bottom: -6,
              zIndex: 2,
              pointerEvents: 'none',
              px: '4px',
              py: '1px',
              fontSize: '0.52rem',
              lineHeight: 1.05,
              borderRadius: '4px',
            }}
          />
        ) : null}
      </div>
    );
  }

  const isFriend = chat.badgeLabel === 'Friend';

  return (
    <div className="relative shrink-0">
      {isFriend ? (
        <>
          <div
            className="pointer-events-none absolute -inset-[2px] rounded-full border"
            style={{
              borderColor: 'rgba(216, 90, 48, 0.28)',
              transform: 'translate(-2px, -1px) rotate(-8deg)',
            }}
          />
          <div
            className="pointer-events-none absolute -inset-[2px] rounded-full border"
            style={{
              borderColor: 'rgba(216, 90, 48, 0.18)',
              transform: 'translate(2px, 1px) rotate(6deg)',
            }}
          />
        </>
      ) : null}
      <UserAvatar
        src={chat.otherAvatar}
        username={chat.otherUsername || chat.title}
        size="md"
      />
    </div>
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

          {chatEntries.map((chat) => (
            <button
              key={chat.id}
              type="button"
              onClick={() => handleOpenChat(chat)}
              className="w-full px-2 py-2 text-left transition-colors"
              style={{
                background:
                  chat.badgeLabel === 'Group'
                    ? 'rgba(255,255,255,0.9)'
                    : 'rgba(255,255,255,0.82)',
                border: 'none',
                borderLeft: chat.badgeLabel === 'Group' ? '4px solid #D85A30' : 'none',
                borderRadius: chat.badgeLabel === 'Group' ? '18px 0 0 18px' : '0px',
              }}
            >
              <div className="flex items-center gap-2">
                <ChatListAvatar chat={chat} />

                <div className="min-w-0 flex-1">
                  {chat.badgeLabel === 'Group' ? (
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className="truncate text-[13px] font-semibold leading-tight"
                          style={{
                            fontFamily: 'Syne, sans-serif',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {chat.title}
                        </div>
                        <div
                          className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold"
                          style={{ background: '#EAF3DE', color: '#3B6D11' }}
                        >
                          {(chat.attendeeCount ?? 0).toLocaleString()} going
                        </div>
                      </div>
                      <div className="mt-0.5 flex min-w-0 items-center justify-between gap-2">
                        <div
                          className="min-w-0 flex-1 truncate text-[11px]"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {formatChatMessagePreview(
                            chat.latestMessageSenderUsername,
                            chat.latestMessageText,
                          )}
                        </div>
                        {chat.updatedAt ? (
                          <div
                            className="shrink-0 text-[10px] font-bold text-right"
                            style={{
                              color: 'rgba(66, 50, 28, 0.52)',
                              letterSpacing: '0.02em',
                            }}
                          >
                            {formatChatRelativeTime(chat.updatedAt)}
                          </div>
                        ) : null}
                      </div>
                      <div
                        className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10.5px]"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        <MapPin className="h-3 w-3 shrink-0" />
                        <div className="truncate">{chat.locationName || 'Location TBD'}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--color-text-primary)' }}>
                        {chat.title}
                      </div>
                      <div className="mt-0.5 flex min-w-0 items-center justify-between gap-2">
                        <div
                          className="min-w-0 flex-1 truncate text-[11px]"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {chat.latestMessageText || chat.subtitle}
                        </div>
                        {chat.updatedAt ? (
                          <div
                            className="shrink-0 text-[10px] font-bold text-right"
                            style={{
                              color: 'rgba(66, 50, 28, 0.52)',
                              letterSpacing: '0.02em',
                            }}
                          >
                            {formatChatRelativeTime(chat.updatedAt)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>

                <MessageCircle
                  className="h-4 w-4 shrink-0"
                  style={{ color: 'var(--color-text-secondary)' }}
                />
              </div>
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
