import {
  Box,
  CircularProgress,
  Container,
  IconButton,
  InputBase,
  Stack,
  Typography,
} from '@mui/material';
import { Inbox, MapPin, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/features/auth/hooks';
import { type ChatParams, useChatDrawer } from '@/features/events/ChatDrawerContext';
import { ChatListAvatar } from '@/features/chat/ChatListAvatar';
import {
  type AllChatEntry,
  buildConversationInboxEntries,
  formatChatMessagePreview,
  formatChatRelativeTime,
} from '@/features/events/chatList';
import { useConversationInbox } from '@/features/events/hooks';

type ChatFilter = 'all' | 'events' | 'people';

function normalizeUsername(value?: string | null) {
  const username = value?.trim();
  if (!username) return undefined;
  return username.startsWith('@') ? username.slice(1) : username;
}

function matchesChatParams(chat: AllChatEntry, params: ChatParams | null) {
  if (!params) return false;
  if (chat.mode !== params.mode) return false;

  if (chat.mode === 'group') {
    return chat.eventId === params.eventId;
  }

  if (chat.mode === 'private') {
    return chat.conversationId === params.conversationId;
  }

  return (
    normalizeUsername(chat.targetUsername || chat.otherUsername) ===
    normalizeUsername(params.targetUsername || params.otherUsername)
  );
}

function buildChatDrawerParams(chat: AllChatEntry): ChatParams {
  return {
    title: chat.title,
    subtitle: chat.subtitle,
    badgeLabel: chat.badgeLabel,
    mode: chat.mode,
    eventId: chat.eventId,
    conversationId: chat.conversationId,
    targetUsername: chat.targetUsername || chat.otherUsername || undefined,
    otherUsername: chat.otherUsername,
    otherAvatar: chat.otherAvatar,
  };
}

export default function ChatsPage() {
  const { user, isAuthenticated } = useAuth();
  const { isOpen, params, openChat } = useChatDrawer();
  const chatSearchInputRef = useRef<HTMLInputElement | null>(null);
  const [chatSearch, setChatSearch] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [chatFilter, setChatFilter] = useState<ChatFilter>('all');

  const { data, isLoading } = useConversationInbox(!!isAuthenticated && !!user);

  const chatEntries = useMemo(
    () => buildConversationInboxEntries(data?.data?.conversations),
    [data?.data?.conversations],
  );

  const selectedChatId = useMemo(() => {
    if (!isOpen || !params) return null;
    return chatEntries.find((chat) => matchesChatParams(chat, params))?.id ?? null;
  }, [chatEntries, isOpen, params]);

  const isListLoading = isLoading;

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

  const handleSelectChat = (chat: AllChatEntry) => {
    openChat(buildChatDrawerParams(chat));
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 4rem)',
        pb: { xs: 12, md: 4 },
        background: `
          radial-gradient(circle at top, rgba(250, 236, 231, 0.8) 0%, rgba(250, 248, 244, 0.92) 28%, rgba(250, 248, 244, 1) 60%),
          linear-gradient(180deg, #FBF8F4 0%, #F7F1E8 100%)
        `,
      }}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          maxWidth: 760,
          py: 0,
        }}
      >
        <Stack
          spacing={0}
          sx={{
            minWidth: 0,
            minHeight: 'calc(100vh - 4rem)',
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
                <Typography sx={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
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
                <Typography sx={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Try a different title or clear your search.
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={0.95}>
                {filteredChatEntries.map((chat) => {
                  const isActive = selectedChatId === chat.id;
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
                            background: '#D85A30',
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
                                    minWidth: 0,
                                    flex: 1,
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
                                    background: 'rgba(250, 236, 231, 0.9)',
                                    color: '#A24C2A',
                                    px: 1,
                                    py: 0.45,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    lineHeight: 1,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {chat.badgeLabel}
                                </Box>
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
      </Container>
    </Box>
  );
}
