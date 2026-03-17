import {
  Box,
  CircularProgress,
  Container,
  IconButton,
  InputBase,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Inbox, MessageCircle, Send, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/features/auth/hooks';
import {
  type AllChatEntry,
  buildAllChatEntries,
  formatChatTimestamp,
} from '@/features/events/chatList';
import {
  buildChatTimeline,
  buildUserChatActivities,
  findFriendshipForUserChat,
} from '@/features/events/chatTimeline';
import {
  useAddDirectMessage,
  useAddHostVendorMessage,
  useAddPrivateMessage,
  useAllChatsList,
  useDirectMessages,
  useEventOverviewRows,
  useHostVendorMessages,
  useMyFriendships,
  useNetworkActivity,
  useNetworkPeople,
  usePrivateMessages,
} from '@/features/events/hooks';

function buildChatSearchParams(chat: AllChatEntry) {
  const params = new URLSearchParams();
  params.set('mode', chat.mode);
  params.set('title', chat.title);

  if (chat.eventId) {
    params.set('eventId', String(chat.eventId));
  }

  if (chat.conversationId) {
    params.set('conversationId', String(chat.conversationId));
  }

  if (chat.targetUsername) {
    params.set('username', chat.targetUsername);
  } else if (chat.otherUsername) {
    params.set('username', chat.otherUsername);
  }

  return params;
}

function parseNumberParam(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatMessageTimestamp(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function EmptyThreadState() {
  return (
    <Stack
      spacing={2}
      alignItems="center"
      justifyContent="center"
      sx={{
        flex: 1,
        minHeight: 320,
        borderRadius: '28px',
        border: '0.5px solid var(--color-border-tertiary)',
        background: 'rgba(255, 255, 255, 0.72)',
        px: 3,
        py: 6,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '22px',
          display: 'grid',
          placeItems: 'center',
          background: '#FAECE7',
          color: '#D85A30',
        }}
      >
        <MessageCircle size={28} />
      </Box>
      <Typography
        sx={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: 20,
          color: 'var(--color-text-primary)',
        }}
      >
        Pick a chat
      </Typography>
      <Typography
        sx={{
          maxWidth: 320,
          fontSize: 14,
          color: 'var(--color-text-secondary)',
        }}
      >
        Management threads and network conversations show up here.
      </Typography>
    </Stack>
  );
}

function ChatMessageBubble({ message }: { message: any }) {
  const { user } = useAuth();
  const isMine = user?.username === message.sender_username;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
      }}
    >
      <Stack
        direction={isMine ? 'row-reverse' : 'row'}
        spacing={1}
        alignItems="flex-end"
        sx={{ maxWidth: '88%' }}
      >
        <UserAvatar
          src={message.sender_avatar}
          username={message.sender_username}
          size="xs"
        />
        <Box
          sx={{
            px: 1.5,
            py: 1.2,
            borderRadius: isMine ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
            background: isMine ? '#D85A30' : '#F9F9F9',
            color: isMine ? '#fff' : 'var(--color-text-primary)',
            border: isMine ? 'none' : '0.5px solid var(--color-border-tertiary)',
            boxShadow: isMine
              ? '0 12px 24px rgba(216, 90, 48, 0.18)'
              : '0 8px 20px rgba(15, 23, 42, 0.06)',
          }}
        >
          {!isMine && (
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
                mb: 0.4,
              }}
            >
              @{message.sender_username}
            </Typography>
          )}
          <Typography sx={{ fontSize: 14, lineHeight: 1.45 }}>
            {message.text}
          </Typography>
          <Typography
            sx={{
              mt: 0.75,
              fontSize: 10,
              textAlign: 'right',
              color: isMine ? 'rgba(255,255,255,0.72)' : 'var(--color-text-secondary)',
            }}
          >
            {formatMessageTimestamp(message.created_at)}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function ChatActivityRow({ label }: { label: string }) {
  return (
    <Stack alignItems="center" sx={{ py: 0.75 }}>
      <Box
        sx={{
          maxWidth: '80%',
          px: 1.5,
          py: 0.7,
          background: 'rgba(15, 23, 42, 0.05)',
          color: 'var(--color-text-secondary)',
          fontSize: 11,
          textAlign: 'center',
          borderRadius: '999px',
        }}
      >
        {label}
      </Box>
    </Stack>
  );
}

function ChatListAvatar({
  chat,
}: {
  chat: Pick<
    AllChatEntry,
    'mode' | 'title' | 'coverImage' | 'otherAvatar' | 'otherUsername'
  >;
}) {
  if (chat.mode === 'group') {
    return chat.coverImage ? (
      <Box
        component="img"
        src={chat.coverImage}
        alt={chat.title}
        sx={{
          width: 68,
          height: 48,
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    ) : (
      <Box
        sx={{
          width: 68,
          height: 48,
          display: 'grid',
          placeItems: 'center',
          background: '#FAECE7',
          color: '#D85A30',
          flexShrink: 0,
        }}
      >
        <Users size={18} />
      </Box>
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

function ChatThread({
  chat,
  isMobile,
  onBack,
  currentUserId,
  currentUsername,
  friendships,
  networkPeople,
  networkActivity,
  eventOverviewRows,
}: {
  chat: AllChatEntry;
  isMobile: boolean;
  onBack: () => void;
  currentUserId?: number;
  currentUsername?: string | null;
  friendships: any[];
  networkPeople?: any;
  networkActivity?: any[];
  eventOverviewRows?: any[];
}) {
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const groupMessages = useHostVendorMessages(chat.eventId ?? 0, chat.mode === 'group');
  const privateMessages = usePrivateMessages(
    chat.mode === 'private' ? chat.conversationId : undefined,
  );
  const directMessages = useDirectMessages(
    chat.mode === 'direct' ? chat.targetUsername : undefined,
  );

  const addGroupMessage = useAddHostVendorMessage();
  const addPrivateMessage = useAddPrivateMessage();
  const addDirectMessage = useAddDirectMessage();

  const messages =
    chat.mode === 'group'
      ? groupMessages.data?.data || []
      : chat.mode === 'direct'
        ? directMessages.data?.data || []
        : privateMessages.data?.data || [];

  const isLoading =
    chat.mode === 'group'
      ? groupMessages.isLoading
      : chat.mode === 'direct'
        ? directMessages.isLoading
        : privateMessages.isLoading;

  const isPending =
    addGroupMessage.isPending ||
    addPrivateMessage.isPending ||
    addDirectMessage.isPending;
  const isUserUserChat =
    chat.section === 'network' && !!(chat.targetUsername || chat.otherUsername);
  const friendship = isUserUserChat
    ? findFriendshipForUserChat(
      friendships,
      currentUsername,
      chat.targetUsername || chat.otherUsername,
    )
    : null;
  const timelineItems = isUserUserChat
    ? buildChatTimeline({
      messages,
      activities: buildUserChatActivities({
        currentUserId,
        targetUsername: chat.targetUsername || chat.otherUsername,
        friendship,
        networkPeople,
        networkActivity,
        eventOverviewRows,
      }),
    })
    : buildChatTimeline({ messages });

  const navigate = useNavigate();
  useEffect(() => {
    setMessageText('');
  }, [chat.id]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, chat.id]);

  const handleSend = () => {
    const text = messageText.trim();
    if (!text) return;

    const onSuccess = () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['all-chats-list'] });
    };

    if (chat.mode === 'group' && chat.eventId) {
      addGroupMessage.mutate(
        { eventId: chat.eventId, payload: { text } },
        { onSuccess },
      );
      return;
    }

    if (chat.mode === 'direct' && chat.targetUsername) {
      addDirectMessage.mutate(
        { targetUsername: chat.targetUsername, payload: { text } },
        { onSuccess },
      );
      return;
    }

    if (chat.mode === 'private' && chat.conversationId) {
      addPrivateMessage.mutate(
        { conversationId: chat.conversationId, payload: { text } },
        { onSuccess },
      );
    }
  };

  return (
    <Stack
      sx={{
        minWidth: 0,
        flex: 1,
        borderRadius: { xs: '28px', md: '32px' },
        border: '0.5px solid var(--color-border-tertiary)',
        background: 'rgba(255, 255, 255, 0.72)',
        overflow: 'hidden',
        minHeight: { xs: 'calc(100vh - 11rem)', md: 680 },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          px: { xs: 1.5, sm: 2.5 },
          py: { xs: 1.5, sm: 2 },
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          background:
            'linear-gradient(180deg, rgba(250, 236, 231, 0.95) 0%, rgba(255,255,255,0.82) 100%)',
        }}
      >
        {isMobile && (
          <IconButton
            onClick={onBack}
            size="small"
            sx={{ color: 'var(--color-text-primary)' }}
          >
            <ArrowLeft size={18} />
          </IconButton>
        )}
        {chat.mode === 'group' ? (
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '16px',
              display: 'grid',
              placeItems: 'center',
              background: '#FAECE7',
              color: '#D85A30',
            }}
          >
            <Users size={20} />
          </Box>
        ) : (
          <UserAvatar
            src={chat.otherAvatar}
            username={chat.otherUsername || chat.title}
          />
        )}
        <Box
          onClick={() => navigate(`/events-new/${chat.eventId}`)}
          sx={{ minWidth: 0, flex: 1, cursor: 'pointer' }}
        >
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: { xs: 18, sm: 20 },
              color: 'var(--color-text-primary)',
              lineHeight: 1.2,
            }}
          >
            {chat.title}
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              color: 'var(--color-text-secondary)',
              mt: 0.25,
            }}
          >
            {chat.subtitle}
          </Typography>
        </Box>
        <Box
          sx={{
            borderRadius: '999px',
            background: '#EAF3DE',
            color: '#3B6D11',
            px: 1.2,
            py: 0.6,
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {chat.badgeLabel}
        </Box>
      </Stack>

      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: { xs: 1.5, sm: 2.5 },
          py: 2,
          background:
            'linear-gradient(180deg, rgba(255,248,241,0.55) 0%, rgba(255,255,255,0.88) 100%)',
        }}
      >
        {isLoading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 220 }}>
            <CircularProgress size={28} sx={{ color: '#D85A30' }} />
          </Stack>
        ) : messages.length === 0 ? (
          <Stack
            spacing={1}
            alignItems="center"
            justifyContent="center"
            sx={{ minHeight: 220, textAlign: 'center' }}
          >
            <Inbox size={26} color="#D85A30" />
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
              }}
            >
              No messages yet
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Start the conversation here.
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={1.25}>
            {timelineItems.map((item, index) =>
              item.type === 'activity' ? (
                <ChatActivityRow key={`${item.id}-${index}`} label={item.label} />
              ) : (
                <ChatMessageBubble key={`${item.id}-${index}`} message={item.message} />
              ),
            )}
          </Stack>
        )}
      </Box>

      <Box
        sx={{
          p: { xs: 1.25, sm: 1.5 },
          borderTop: '0.5px solid var(--color-border-tertiary)',
          background: 'rgba(255,255,255,0.92)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            borderRadius: '24px',
            background: '#F9F9F9',
            border: '0.5px solid var(--color-border-tertiary)',
            px: 1.5,
            py: 0.8,
          }}
        >
          <InputBase
            multiline
            maxRows={4}
            fullWidth
            placeholder="Type a message"
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            sx={{
              fontSize: 14,
              color: 'var(--color-text-primary)',
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={!messageText.trim() || isPending}
            sx={{
              width: 40,
              height: 40,
              borderRadius: '14px',
              background: '#D85A30',
              color: '#fff',
              '&:hover': { background: '#C44F29' },
              '&.Mui-disabled': {
                background: 'rgba(216, 90, 48, 0.2)',
                color: 'rgba(255,255,255,0.8)',
              },
            }}
          >
            <Send size={16} />
          </IconButton>
        </Box>
      </Box>
    </Stack>
  );
}

export default function ChatsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { data, isLoading } = useAllChatsList(true);
  const { data: friendships, isLoading: friendshipsLoading } = useMyFriendships(
    !!isAuthenticated && !!user,
  );
  const { data: eventOverviewRows, isLoading: eventOverviewLoading } =
    useEventOverviewRows(!!isAuthenticated && !!user);
  const { data: networkPeople } = useNetworkPeople(!!isAuthenticated && !!user);
  const { data: networkActivity } = useNetworkActivity(!!isAuthenticated && !!user);

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

  const selectedChat = useMemo(() => {
    const mode = searchParams.get('mode');
    if (!mode) return null;

    const eventId = parseNumberParam(searchParams.get('eventId'));
    const conversationId = parseNumberParam(searchParams.get('conversationId'));
    const targetUsername = searchParams.get('username') || undefined;

    const matchingChat =
      chatEntries.find((chat) => {
        if (mode === 'group') {
          return chat.mode === 'group' && chat.eventId === eventId;
        }

        if (mode === 'private') {
          return chat.mode === 'private' && chat.conversationId === conversationId;
        }

        if (mode === 'direct') {
          return chat.mode === 'direct' && chat.targetUsername === targetUsername;
        }

        return false;
      }) || null;

    if (matchingChat) return matchingChat;

    if (mode === 'group' && eventId) {
      return {
        id: `group-${eventId}`,
        mode: 'group',
        section: 'management',
        title: searchParams.get('title') || 'Event group chat',
        subtitle: 'Group chat',
        badgeLabel: 'Group',
        updatedAt: null,
        eventId,
      } satisfies AllChatEntry;
    }

    if (mode === 'private' && conversationId) {
      return {
        id: `private-${conversationId}`,
        mode: 'private',
        section: 'management',
        title: searchParams.get('title') || 'Conversation',
        subtitle: targetUsername
          ? `Private chat with @${targetUsername}`
          : 'Private conversation',
        badgeLabel: 'Event',
        updatedAt: null,
        conversationId,
        eventId,
        otherUsername: targetUsername,
      } satisfies AllChatEntry;
    }

    if (mode === 'direct' && targetUsername) {
      return {
        id: `direct-${targetUsername}`,
        mode: 'direct',
        section: 'network',
        title: searchParams.get('title') || `@${targetUsername}`,
        subtitle: 'Direct conversation',
        badgeLabel: 'Direct',
        updatedAt: null,
        targetUsername,
        otherUsername: targetUsername,
      } satisfies AllChatEntry;
    }

    return null;
  }, [chatEntries, searchParams]);

  useEffect(() => {
    if (isMobile || chatEntries.length === 0 || selectedChat) return;
    setSearchParams(buildChatSearchParams(chatEntries[0]), { replace: true });
  }, [chatEntries, isMobile, selectedChat, setSearchParams]);

  const managementChats = chatEntries.filter((chat) => chat.section === 'management');
  const networkChats = chatEntries.filter((chat) => chat.section === 'network');
  const sections = [
    { label: 'Management', chats: managementChats },
    { label: 'Network', chats: networkChats },
  ];
  const showList = !isMobile || !selectedChat;
  const showThread = !isMobile || Boolean(selectedChat);

  const handleSelectChat = (chat: AllChatEntry) => {
    setSearchParams(buildChatSearchParams(chat));
  };

  const handleBack = () => {
    setSearchParams({});
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 4rem)',
        pb: { xs: 12, md: 4 },
        background: '#fff8f1',
      }}
    >
      <Container maxWidth={false} disableGutters sx={{ py: 0 }}>
        <Stack spacing={0}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns:
                !isMobile && showList && showThread
                  ? 'minmax(300px, 340px) minmax(0, 1fr)'
                  : '1fr',
              gap: 0,
              alignItems: 'stretch',
            }}
          >
            {showList && (
              <Stack
                spacing={0}
                sx={{
                  minWidth: 0,
                  minHeight: { xs: 'calc(100vh - 8rem)', md: 'calc(100vh - 4rem)' },
                }}
              >
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                  {isListLoading ? (
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      sx={{ minHeight: 220 }}
                    >
                      <CircularProgress size={28} sx={{ color: '#D85A30' }} />
                    </Stack>
                  ) : chatEntries.length === 0 ? (
                    <Stack
                      spacing={1.5}
                      alignItems="center"
                      justifyContent="center"
                      sx={{ minHeight: 220, textAlign: 'center', px: 2 }}
                    >
                      <Inbox size={26} color="#D85A30" />
                      <Typography
                        sx={{
                          fontFamily: 'Syne, sans-serif',
                          fontWeight: 700,
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        No chats yet
                      </Typography>
                      <Typography
                        sx={{ fontSize: 13, color: 'var(--color-text-secondary)' }}
                      >
                        Conversations will appear here once you start messaging.
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack spacing={0.5}>
                      {sections.map((section) =>
                        section.chats.length ? (
                          <Stack key={section.label} spacing={0}>
                            <Typography
                              sx={{
                                px: 1,
                                pt: 1.25,
                                pb: 0.25,
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              {section.label}
                            </Typography>
                            {section.chats.map((chat) => {
                              const isActive = selectedChat?.id === chat.id;

                              return (
                                <Box
                                  key={chat.id}
                                  component="button"
                                  type="button"
                                  onClick={() => handleSelectChat(chat)}
                                  sx={{
                                    width: '100%',
                                    textAlign: 'left',
                                    border: 'none',
                                    borderRadius: 0,
                                    px: 1,
                                    py: 1,
                                    background: isActive
                                      ? 'rgba(216, 90, 48, 0.08)'
                                      : chat.isPlaceholder
                                        ? 'rgba(0,0,0,0.02)'
                                        : 'transparent',
                                    boxShadow: 'none',
                                    transition: 'background 0.18s ease',
                                    '&:hover': {
                                      background: 'rgba(216, 90, 48, 0.06)',
                                    },
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    spacing={1.2}
                                    alignItems="center"
                                  >
                                    <ChatListAvatar chat={chat} />
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                      <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        spacing={1}
                                      >
                                        <Typography
                                          sx={{
                                            fontFamily: 'Syne, sans-serif',
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: 'var(--color-text-primary)',
                                            lineHeight: 1.25,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          {chat.title}
                                        </Typography>
                                        <Typography
                                          sx={{
                                            fontSize: 11,
                                            flexShrink: 0,
                                            color: 'var(--color-text-secondary)',
                                          }}
                                        >
                                          {formatChatTimestamp(chat.updatedAt)}
                                        </Typography>
                                      </Stack>
                                      <Typography
                                        sx={{
                                          mt: 0.25,
                                          fontSize: 11,
                                          color: 'var(--color-text-secondary)',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {chat.subtitle}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </Box>
                              );
                            })}
                          </Stack>
                        ) : null,
                      )}
                    </Stack>
                  )}
                </Box>
              </Stack>
            )}

            {showThread &&
              (selectedChat ? (
                <ChatThread
                  chat={selectedChat}
                  isMobile={isMobile}
                  onBack={handleBack}
                  currentUserId={user?.id}
                  currentUsername={user?.username}
                  friendships={friendships?.accepted || []}
                  networkPeople={networkPeople}
                  networkActivity={networkActivity?.activity || []}
                  eventOverviewRows={eventOverviewRows || []}
                />
              ) : (
                <EmptyThreadState />
              ))}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
