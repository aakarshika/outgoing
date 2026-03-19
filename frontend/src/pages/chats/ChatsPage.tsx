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
import {
  ArrowLeft,
  Inbox,
  MapPin,
  MessageCircle,
  Search,
  Send,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/features/auth/hooks';
import { HostVendorBadge } from '@/features/events/scrapbookCard/ScrapbookCardOverlays';
import {
  type AllChatEntry,
  buildAllChatEntries,
  formatChatMessagePreview,
  formatChatRelativeTime,
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
import { getCategoryTheme } from '@/features/events/CategoricalBackground';

type ChatFilter = 'all' | 'events' | 'people';

function parseNumberParam(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildChatPath(chat: AllChatEntry) {
  if (chat.mode === 'group' && chat.eventId) return `/chats/group/${chat.eventId}`;
  if (chat.mode === 'private' && chat.conversationId)
    return `/chats/private/${chat.conversationId}`;
  if (chat.mode === 'direct') {
    const username = chat.targetUsername || chat.otherUsername;
    if (username) return `/chats/direct/${username}`;
  }
  return '/chats';
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
        borderRadius: '32px',
        border: '1px solid rgba(120, 94, 60, 0.12)',
        background:
          'linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(255, 250, 245, 0.92) 100%)',
        boxShadow: '0 24px 60px rgba(86, 58, 28, 0.08)',
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
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
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

function ChatActivityRow({ item }: { item: any }) {
  const { label, eventId, eventTitle } = item || {};

  if (!eventId || !eventTitle) {
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

  const text = String(label ?? '');
  const title = String(eventTitle);
  const idx = text.indexOf(title);

  if (idx === -1) {
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

  const before = text.slice(0, idx);
  const after = text.slice(idx + title.length);

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
        {before}
        <Box
          component={Link}
          to={`/events-new/${eventId}`}
          sx={{
            color: '#D85A30',
            fontWeight: 600,
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {title}
        </Box>
        {after}
      </Box>
    </Stack>
  );
}

function ChatListAvatar({
  chat,
}: {
  chat: Pick<
    AllChatEntry,
    'mode' | 'title' | 'coverImage' | 'otherAvatar' | 'otherUsername' | 'groupRole' | 'badgeLabel'
  >;
}) {
  if (chat.mode === 'group') {
    return (
      <Box
        sx={{
          position: 'relative',
          width: 72,
          height: 66,
          flexShrink: 0,
          overflow: 'visible',
          boxShadow: '0 10px 24px rgba(86, 58, 28, 0.12)',
        }}
      >
        {chat.coverImage ? (
          <Box
            component="img"
            src={chat.coverImage}
            alt={chat.title}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              borderRadius: '14px',
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              background: '#FAECE7',
              color: '#D85A30',
              borderRadius: '14px',
            }}
          >
            <Users size={18} />
          </Box>
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
      </Box>
    );
  }

  const isFriend = chat.badgeLabel === 'Friend';

  return (
    <Box sx={{ position: 'relative', flexShrink: 0 }}>
      {isFriend ? (
        <>
          <Box
            sx={{
              position: 'absolute',
              inset: -2,
              borderRadius: '999px',
              border: '1.25px solid rgba(216, 90, 48, 0.28)',
              transform: 'translate(-2px, -1px) rotate(-8deg)',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: -2,
              borderRadius: '999px',
              border: '1.25px solid rgba(216, 90, 48, 0.18)',
              transform: 'translate(2px, 1px) rotate(6deg)',
              pointerEvents: 'none',
            }}
          />
        </>
      ) : null}
      <UserAvatar
        src={chat.otherAvatar}
        username={chat.otherUsername || chat.title}
        size="md"
        className="shadow-[0_8px_20px_rgba(86,58,28,0.12)]"
      />
    </Box>
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
        borderRadius: { xs: '28px', md: '34px' },
        border: '1px solid rgba(120, 94, 60, 0.12)',
        background:
          'linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 250, 245, 0.9) 100%)',
        boxShadow: '0 26px 70px rgba(86, 58, 28, 0.1)',
        overflow: 'hidden',
        height: { xs: '100%', md: 680 },
        minHeight: { xs: '100%', md: 680 },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          px: { xs: 1.75, sm: 2.75 },
          py: { xs: 1.5, sm: 2.1 },
          borderBottom: '1px solid rgba(120, 94, 60, 0.1)',
          background:
            'linear-gradient(180deg, rgba(250, 236, 231, 0.95) 0%, rgba(255,255,255,0.88) 100%)',
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
            px: 1.35,
            py: 0.65,
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72)',
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
          px: { xs: 1.5, sm: 2.25 },
          py: { xs: 1.5, sm: 2 },
          pb: { xs: 12, sm: 2 },
          background:
            'linear-gradient(180deg, rgba(255,248,241,0.62) 0%, rgba(255,255,255,0.9) 100%)',
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
          <Stack spacing={1.5}>
            {timelineItems.map((item, index) =>
              item.type === 'activity' ? (
                <ChatActivityRow key={`${item.id}-${index}`} item={item} />
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
          borderTop: '1px solid rgba(120, 94, 60, 0.1)',
          background: 'rgba(255,255,255,0.96)',
          flexShrink: 0,
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
          pb: { xs: 'calc(10px + env(safe-area-inset-bottom, 0px))', sm: 1.5 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            borderRadius: '26px',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FBF8F4 100%)',
            border: '1px solid rgba(120, 94, 60, 0.12)',
            boxShadow: '0 10px 28px rgba(86, 58, 28, 0.08)',
            px: 1.6,
            py: 0.9,
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
  const navigate = useNavigate();
  const params = useParams();
  const { user, isAuthenticated } = useAuth();
  const chatSearchInputRef = useRef<HTMLInputElement | null>(null);
  const [chatSearch, setChatSearch] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [chatFilter, setChatFilter] = useState<ChatFilter>('all');
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
  const filteredChatEntries = useMemo(() => {
    const baseChats =
      chatFilter === 'events'
        ? chatEntries.filter((chat) => chat.mode === 'group')
        : chatFilter === 'people'
          ? chatEntries.filter((chat) => chat.mode !== 'group')
          : chatEntries;
    const searchValue = chatSearch.trim().toLowerCase();
    if (!searchValue) return baseChats;
    return baseChats.filter((chat) =>
      [
        chat.title,
        chat.subtitle,
        chat.latestMessageText,
        chat.latestMessageSenderUsername,
        chat.locationName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchValue)),
    );
  }, [chatEntries, chatFilter, chatSearch]);

  useEffect(() => {
    if (!isSearchExpanded) return;
    const timeout = window.setTimeout(() => chatSearchInputRef.current?.focus(), 120);
    return () => window.clearTimeout(timeout);
  }, [isSearchExpanded]);

  const selectedChat = useMemo(() => {
    const eventId = parseNumberParam((params.eventId as string | undefined) ?? null);
    const conversationId = parseNumberParam(
      (params.conversationId as string | undefined) ?? null,
    );
    const username = (params.username as string | undefined) ?? undefined;

    if (eventId) {
      return (
        chatEntries.find((chat) => chat.mode === 'group' && chat.eventId === eventId) ||
        null
      );
    }

    if (conversationId) {
      return (
        chatEntries.find(
          (chat) => chat.mode === 'private' && chat.conversationId === conversationId,
        ) || null
      );
    }

    if (username) {
      return (
        chatEntries.find(
          (chat) =>
            chat.mode === 'direct' &&
            (chat.targetUsername || chat.otherUsername) === username,
        ) || null
      );
    }

    return null;
  }, [chatEntries, params.conversationId, params.eventId, params.username]);

  useEffect(() => {
    if (isMobile || chatEntries.length === 0 || selectedChat) return;
    navigate(buildChatPath(chatEntries[0]), { replace: true });
  }, [chatEntries, isMobile, navigate, selectedChat]);

  const showList = !isMobile || !selectedChat;
  const showThread = !isMobile || Boolean(selectedChat);

  const handleSelectChat = (chat: AllChatEntry) => {
    navigate(buildChatPath(chat));
  };

  const handleBack = () => {
    navigate('/chats');
  };

  const isMobileThread = isMobile && Boolean(selectedChat);

  return (
    <Box
      sx={{
        minHeight: isMobileThread ? '100dvh' : 'calc(100vh - 4rem)',
        height: isMobileThread ? '100dvh' : 'auto',
        pb: isMobileThread ? 0 : { xs: 12, md: 4 },
        background: `
          radial-gradient(circle at top, rgba(250, 236, 231, 0.8) 0%, rgba(250, 248, 244, 0.92) 28%, rgba(250, 248, 244, 1) 60%),
          linear-gradient(180deg, #FBF8F4 0%, #F7F1E8 100%)
        `,
        overflow: isMobileThread ? 'hidden' : 'visible',
      }}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          maxWidth: 1240,
          py: 0,
          height: isMobileThread ? '100%' : 'auto',
        }}
      >
        <Stack spacing={0} sx={{ height: isMobileThread ? '100%' : 'auto' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns:
                !isMobile && showList && showThread
                  ? 'minmax(300px, 340px) minmax(0, 1fr)'
                  : '1fr',
              gap: { xs: 0, md: 2 },
              alignItems: 'stretch',
              height: isMobileThread ? '100%' : 'auto',
            }}
          >
            {showList && (
              <Stack
                spacing={0}
                sx={{
                  minWidth: 0,
                  minHeight: { xs: 'calc(100vh - 8rem)', md: 'calc(100vh - 4rem)' },
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,250,245,0.92) 100%)',
                  boxShadow: '0 24px 60px rgba(86, 58, 28, 0.08)',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    px: { xs: 1.35, sm: 1.6 },
                    pt: { xs: 1.35, sm: 1.6 },
                    pb: { xs: 1, sm: 1.15 },
                    borderBottom: '1px solid rgba(120, 94, 60, 0.1)',
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(251,248,244,0.92) 100%)',
                  }}
                >
                  <Stack spacing={1.25}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        {isSearchExpanded ? (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              borderRadius: '999px',
                              border: '1px solid rgba(120, 94, 60, 0.12)',
                              background:
                                'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(251,248,244,0.96) 100%)',
                              px: 1.5,
                              py: 0.7,
                              boxShadow: '0 12px 28px rgba(74, 53, 33, 0.08)',
                            }}
                          >
                            <Search size={16} color="#8A6C4A" />
                            <InputBase
                              inputRef={chatSearchInputRef}
                              value={chatSearch}
                              onChange={(event) => setChatSearch(event.target.value)}
                              placeholder="Search chats..."
                              inputProps={{ 'aria-label': 'Search chats...' }}
                              sx={{
                                flex: 1,
                                fontSize: 14,
                                color: 'var(--color-text-primary)',
                                '& input::placeholder': {
                                  opacity: 0.5,
                                  color: 'var(--color-text-secondary)',
                                },
                              }}
                            />
                          </Box>
                        ) : (
                          <>
                            <Typography
                              sx={{
                                fontFamily: 'Georgia, serif',
                                fontSize: { xs: 24, sm: 26 },
                                lineHeight: 1,
                                letterSpacing: '-0.03em',
                                color: '#1a1a18',
                              }}
                            >
                              Messages
                            </Typography>
                            <Typography
                              sx={{
                                mt: 0.35,
                                fontSize: 12,
                                color: 'rgba(66, 50, 28, 0.58)',
                              }}
                            >
                              {filteredChatEntries.length} conversation
                              {filteredChatEntries.length === 1 ? '' : 's'}
                            </Typography>
                          </>
                        )}
                      </Box>
                      <IconButton
                        onClick={() => {
                          if (isSearchExpanded && !chatSearch.trim()) {
                            setIsSearchExpanded(false);
                            return;
                          }
                          setIsSearchExpanded(true);
                        }}
                        sx={{
                          width: 38,
                          height: 38,
                          border: '1px solid rgba(120, 94, 60, 0.12)',
                          background: 'rgba(237, 235, 229, 0.88)',
                          color: '#444441',
                          boxShadow: '0 8px 18px rgba(74, 53, 33, 0.06)',
                          '&:hover': {
                            background: 'rgba(237, 235, 229, 1)',
                          },
                        }}
                      >
                        <Search size={17} />
                      </IconButton>
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.25 }}>
                      {(['all', 'events', 'people'] as ChatFilter[]).map((filter) => {
                        const isActive = chatFilter === filter;
                        const label =
                          filter === 'all'
                            ? 'All'
                            : filter === 'events'
                              ? 'Events'
                              : 'People';

                        return (
                          <Box
                            key={filter}
                            component="button"
                            type="button"
                            onClick={() => setChatFilter(filter)}
                            sx={{
                              flexShrink: 0,
                              border: 'none',
                              borderRadius: '999px',
                              px: 1.6,
                              py: 0.75,
                              fontSize: 12,
                              fontWeight: isActive ? 700 : 500,
                              color: isActive ? '#fff' : '#5F5E5A',
                              background: isActive ? '#C84B22' : '#EDEBE5',
                              boxShadow: isActive
                                ? '0 12px 24px rgba(200, 75, 34, 0.22)'
                                : 'inset 0 1px 0 rgba(255,255,255,0.7)',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.18s ease',
                            }}
                          >
                            {label}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Stack>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    px: { xs: 1, sm: 1.25 },
                    py: { xs: 1.1, sm: 1.25 },
                  }}
                >
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
                  ) : filteredChatEntries.length === 0 ? (
                    <Stack
                      spacing={1.5}
                      alignItems="center"
                      justifyContent="center"
                      sx={{ minHeight: 220, textAlign: 'center', px: 2 }}
                    >
                      <Search size={24} color="#D85A30" />
                      <Typography
                        sx={{
                          fontFamily: 'Syne, sans-serif',
                          fontWeight: 700,
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        No matching chats
                      </Typography>
                      <Typography
                        sx={{ fontSize: 13, color: 'var(--color-text-secondary)' }}
                      >
                        Try a different title or clear your search.
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack spacing={0.95}>
                      {filteredChatEntries.map((chat) => {
                        const isActive = selectedChat?.id === chat.id;
                        const isGroupCard = chat.badgeLabel === 'Group';

                        return (
                          <Box
                            key={chat.id}
                            component="button"
                            type="button"
                            onClick={() => handleSelectChat(chat)}
                            sx={{
                              position: 'relative',
                              width: '100%',
                              textAlign: 'left',
                              border: 'none',
                              borderRadius: '24px',
                              px: 1.25,
                              py: 1.15,
                              background: isGroupCard
                                ? isActive
                                  ? 'rgba(255, 248, 241, 0.98)'
                                  : 'rgba(255, 251, 247, 0.94)'
                                : isActive
                                  ? 'rgba(255, 248, 241, 0.94)'
                                  : 'rgba(255,255,255,0.88)',
                              boxShadow: isActive
                                ? '0 16px 34px rgba(86, 58, 28, 0.12)'
                                : '0 6px 16px rgba(86, 58, 28, 0.05)',
                              transition:
                                'background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease',
                              '&::before': isGroupCard
                                ? {
                                    content: '""',
                                    position: 'absolute',
                                    left: 0,
                                    top: 8,
                                    bottom: 8,
                                    width: 4,
                                    borderRadius: '999px',
                                    background: getCategoryTheme(chat.category)?.accent || '',
                                  }
                                : undefined,
                              '&:hover': {
                                background: isGroupCard
                                  ? 'rgba(255, 248, 241, 1)'
                                  : 'rgba(255,255,255,0.96)',
                                boxShadow: '0 18px 36px rgba(86, 58, 28, 0.1)',
                                transform: 'translateY(-1px)',
                              },
                            }}
                          >
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <ChatListAvatar chat={chat} />
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                {chat.badgeLabel === 'Group' ? (
                                  <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                                    <Stack
                                      direction="row"
                                      justifyContent="space-between"
                                      alignItems="center"
                                      spacing={1}
                                    >
                                      <Typography
                                        sx={{
                                          fontFamily: 'Syne, sans-serif',
                                          fontSize: 15,
                                          fontWeight: 700,
                                          color: 'var(--color-text-primary)',
                                          lineHeight: 1.2,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {chat.title}
                                      </Typography>
                                      <Box
                                        sx={{
                                          flexShrink: 0,
                                          borderRadius: '999px',
                                          background: '#EAF3DE',
                                          color: '#3B6D11',
                                          px: 1,
                                          py: 0.45,
                                          fontSize: 10,
                                          fontWeight: 700,
                                          lineHeight: 1,
                                          whiteSpace: 'nowrap',
                                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72)',
                                        }}
                                      >
                                        {(chat.attendeeCount ?? 0).toLocaleString()} going
                                      </Box>
                                    </Stack>
                                    <Stack
                                      direction="row"
                                      alignItems="center"
                                      justifyContent="space-between"
                                      spacing={1}
                                      sx={{ mt: 0.15, minWidth: 0 }}
                                    >
                                      <Typography
                                        sx={{
                                          minWidth: 0,
                                          flex: 1,
                                          fontSize: 13,
                                          color: 'var(--color-text-secondary)',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {formatChatMessagePreview(
                                          chat.latestMessageSenderUsername,
                                          chat.latestMessageText,
                                        )}
                                      </Typography>
                                      {chat.updatedAt ? (
                                        <Typography
                                          sx={{
                                            flexShrink: 0,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            letterSpacing: '0.02em',
                                            color: 'rgba(66, 50, 28, 0.52)',
                                            whiteSpace: 'nowrap',
                                            textAlign: 'right',
                                          }}
                                        >
                                          {formatChatRelativeTime(chat.updatedAt)}
                                        </Typography>
                                      ) : null}
                                    </Stack>
                                    <Stack
                                      direction="row"
                                      alignItems="center"
                                      spacing={0.4}
                                      sx={{ minWidth: 0 }}
                                    >
                                      <MapPin size={10} color="gray" />
                                      <Typography
                                        sx={{
                                          minWidth: 0,
                                          fontSize: 11,
                                          color: 'rgba(66, 50, 28, 0.5)',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {chat.locationName || 'Location TBD'}
                                      </Typography>
                                    </Stack>
                                  </Stack>
                                ) : (
                                  <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                                    <Stack
                                      direction="row"
                                      justifyContent="space-between"
                                      alignItems="center"
                                      spacing={1}
                                    >
                                      <Typography
                                        sx={{
                                          fontFamily: 'Syne, sans-serif',
                                          fontSize: 15,
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
                                    </Stack>
                                    <Stack
                                      direction="row"
                                      alignItems="center"
                                      justifyContent="space-between"
                                      spacing={1}
                                      sx={{ minWidth: 0 }}
                                    >
                                      <Typography
                                        sx={{
                                          minWidth: 0,
                                          flex: 1,
                                          fontSize: 13,
                                          color: 'var(--color-text-secondary)',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {chat.latestMessageText || chat.subtitle}
                                      </Typography>
                                      {chat.updatedAt ? (
                                        <Typography
                                          sx={{
                                            flexShrink: 0,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            letterSpacing: '0.02em',
                                            color: 'rgba(66, 50, 28, 0.52)',
                                            whiteSpace: 'nowrap',
                                            textAlign: 'right',
                                          }}
                                        >
                                          {formatChatRelativeTime(chat.updatedAt)}
                                        </Typography>
                                      ) : null}
                                    </Stack>
                                  </Stack>
                                )}
                              </Box>
                            </Stack>
                          </Box>
                        );
                      })}
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
