import {
  Box,
  CircularProgress,
  IconButton,
  InputBase,
  Stack,
  Typography,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { Inbox, Send, Users, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/features/auth/hooks';
import { flattenNetworkActivityForChat } from '@/features/events/api';
import type { AllChatMode } from '@/features/events/chatList';
import {
  buildChatTimeline,
  buildUserChatActivities,
  findFriendshipForUserChat,
} from '@/features/events/chatTimeline';
import {
  useAddDirectMessage,
  useAddHostVendorMessage,
  useAddPrivateMessage,
  useDirectMessages,
  useEventOverviewRows,
  useHostVendorMessages,
  useMyFriendships,
  useNetworkActivity,
  useNetworkPeople,
  usePrivateMessages,
} from '@/features/events/hooks';
import { BuddyRequestPanel } from '@/pages/events/components/BuddyRequestPanel';

function formatMessageTimestamp(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function normalizeUsername(value?: string | null) {
  const username = value?.trim();
  if (!username) return undefined;
  return username.startsWith('@') ? username.slice(1) : username;
}

function buildDefaultTitle({
  title,
  mode,
  username,
}: {
  title?: string;
  mode: AllChatMode;
  username?: string;
}) {
  if (title?.trim()) return title;
  if (mode === 'group') return 'Event group chat';
  if (username) return `@${username}`;
  return 'Chat';
}

function buildDefaultSubtitle({
  subtitle,
  mode,
  username,
}: {
  subtitle?: string;
  mode: AllChatMode;
  username?: string;
}) {
  if (subtitle?.trim()) return subtitle;
  if (mode === 'group') return 'Host + vendor group chat';
  if (mode === 'private')
    return username ? `Private chat with @${username}` : 'Private chat';
  return username ? `Direct chat with @${username}` : 'Direct chat';
}

function buildDefaultBadge(mode: AllChatMode, badgeLabel?: string) {
  if (badgeLabel?.trim()) return badgeLabel;
  if (mode === 'group') return 'Group';
  if (mode === 'private') return 'Event';
  return 'Direct';
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

function ChatActivityRow({
  item,
  onNavigate,
}: {
  item: any;
  onNavigate?: () => void;
}) {
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
          onClick={onNavigate}
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

export interface ChatThreadPanelProps {
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
  mode: AllChatMode;
  eventId?: number;
  conversationId?: number;
  targetUsername?: string;
  otherUsername?: string | null;
  otherAvatar?: string | null;
  onClose?: () => void;
}

export function ChatThreadPanel({
  title,
  subtitle,
  badgeLabel,
  mode,
  eventId,
  conversationId,
  targetUsername,
  otherUsername,
  otherAvatar,
  onClose,
}: ChatThreadPanelProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const resolvedUsername =
    normalizeUsername(targetUsername) || normalizeUsername(otherUsername);
  const resolvedTitle = buildDefaultTitle({ title, mode, username: resolvedUsername });
  const resolvedSubtitle = buildDefaultSubtitle({
    subtitle,
    mode,
    username: resolvedUsername,
  });
  const resolvedBadge = buildDefaultBadge(mode, badgeLabel);

  const groupMessages = useHostVendorMessages(eventId ?? 0, mode === 'group');
  const privateMessages = usePrivateMessages(
    mode === 'private' ? conversationId : undefined,
  );
  const directMessages = useDirectMessages(
    mode === 'direct' ? resolvedUsername : undefined,
  );

  const addGroupMessage = useAddHostVendorMessage();
  const addPrivateMessage = useAddPrivateMessage();
  const addDirectMessage = useAddDirectMessage();

  const isUserUserChat =
    !!resolvedUsername && (mode === 'direct' || mode === 'private');
  const { data: friendships } = useMyFriendships(!!isAuthenticated && isUserUserChat);
  const { data: networkPeople } = useNetworkPeople(!!isAuthenticated && isUserUserChat);
  const { data: networkActivity } = useNetworkActivity(
    !!isAuthenticated && isUserUserChat,
  );
  const { data: eventOverviewRows } = useEventOverviewRows(
    !!isAuthenticated && isUserUserChat,
  );

  const messages =
    mode === 'group'
      ? groupMessages.data?.data || []
      : mode === 'direct'
        ? directMessages.data?.data || []
        : privateMessages.data?.data || [];

  const isLoading =
    mode === 'group'
      ? groupMessages.isLoading
      : mode === 'direct'
        ? directMessages.isLoading
        : privateMessages.isLoading;

  const isPending =
    addGroupMessage.isPending ||
    addPrivateMessage.isPending ||
    addDirectMessage.isPending;

  const friendship = isUserUserChat
    ? findFriendshipForUserChat(
        friendships?.accepted || [],
        user?.username,
        resolvedUsername,
      )
    : null;

  const timelineItems = useMemo(
    () =>
      isUserUserChat
        ? buildChatTimeline({
            messages,
            activities: buildUserChatActivities({
              currentUserId: user?.id,
              targetUsername: resolvedUsername,
              friendship,
              networkPeople,
              networkActivity: flattenNetworkActivityForChat(
                networkActivity?.groups,
              ),
              eventOverviewRows: eventOverviewRows || [],
            }),
          })
        : buildChatTimeline({ messages }),
    [
      eventOverviewRows,
      friendship,
      isUserUserChat,
      messages,
      networkActivity?.groups,
      networkPeople,
      resolvedUsername,
      user?.id,
    ],
  );

  useEffect(() => {
    setMessageText('');
  }, [conversationId, eventId, mode, resolvedUsername]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, mode, conversationId, eventId, resolvedUsername]);

  const handleSend = () => {
    const text = messageText.trim();
    if (!text) return;

    const onSuccess = () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['conversation-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['all-chats-list'] });
    };

    if (mode === 'group' && eventId) {
      addGroupMessage.mutate({ eventId, payload: { text } }, { onSuccess });
      return;
    }

    if (mode === 'direct' && resolvedUsername) {
      addDirectMessage.mutate(
        { targetUsername: resolvedUsername, payload: { text } },
        { onSuccess },
      );
      return;
    }

    if (mode === 'private' && conversationId) {
      addPrivateMessage.mutate({ conversationId, payload: { text } }, { onSuccess });
    }
  };

  return (
    <Stack
      sx={{
        minWidth: 0,
        flex: 1,
        height: '100%',
        background:
          'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 250, 245, 0.95) 100%)',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          px: 2,
          py: 1.75,
          borderBottom: '1px solid rgba(120, 94, 60, 0.1)',
          background:
            'linear-gradient(180deg, rgba(250, 236, 231, 0.95) 0%, rgba(255,255,255,0.9) 100%)',
        }}
      >
        {mode === 'group' ? (
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
          <UserAvatar src={otherAvatar} username={resolvedUsername || resolvedTitle} />
        )}
        <Box
          onClick={() => {
            if (eventId) navigate(`/events-new/${eventId}`);
          }}
          sx={{
            minWidth: 0,
            flex: 1,
            cursor: eventId ? 'pointer' : 'default',
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: 20,
              color: 'var(--color-text-primary)',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {resolvedTitle}
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              color: 'var(--color-text-secondary)',
              mt: 0.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {resolvedSubtitle}
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
          {resolvedBadge}
        </Box>
        {onClose ? (
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: 'var(--color-text-primary)' }}
          >
            <X size={18} />
          </IconButton>
        ) : null}
      </Stack>

      {mode === 'direct' && eventId && resolvedUsername ? (
        <Box
          sx={{
            px: 1.5,
            py: 1.25,
            borderBottom: '1px solid rgba(120, 94, 60, 0.08)',
            background: 'rgba(255,255,255,0.88)',
          }}
        >
          {/* <BuddyRequestPanel
            eventId={eventId}
            targetUsername={resolvedUsername}
            compact
          /> */}
        </Box>
      ) : null}

      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          py: 2,
          pb: 2,
          background:
            'linear-gradient(180deg, rgba(255,248,241,0.62) 0%, rgba(255,255,255,0.92) 100%)',
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
                <ChatActivityRow
                  key={`${item.id}-${index}`}
                  item={item}
                  onNavigate={onClose}
                />
              ) : (
                <ChatMessageBubble key={`${item.id}-${index}`} message={item.message} />
              ),
            )}
          </Stack>
        )}
      </Box>

      <Box
        sx={{
          p: 1.5,
          borderTop: '1px solid rgba(120, 94, 60, 0.1)',
          background: 'rgba(255,255,255,0.96)',
          flexShrink: 0,
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
