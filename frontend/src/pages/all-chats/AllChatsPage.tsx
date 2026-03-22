import {
  Box,
  CircularProgress,
  Container,
  Drawer,
  IconButton,
  InputBase,
  Stack,
  Typography,
} from '@mui/material';
import { Inbox, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/hooks';
import { chatApi, type ConversationItemDto } from '@/features/chat/api';
import {
  ChatListAvatar,
  type ChatListAvatarChat,
} from '@/features/chat/ChatListAvatar';
import { ChatThreadCard } from '@/features/chat/ChatThreadCard';
import { ChatThreadHeader } from '@/features/chat/ChatThreadHeader';
import {
  buildViewerRolesByEventId,
  eventChatKindLabel,
  eventIdForConversationRow,
  formatViewerEventRoles,
  peerDmChipLabel,
} from '@/features/chat/conversationRowMeta';
import { decodeThreadKey, encodeThreadKey } from '@/features/chat/threadKeyCodec';
import { useChatThread } from '@/features/chat/useChatThread';
import { FriendAvatar } from '@/features/events/FriendAvatar';
import { useEventOverviewRows, useMyFriendships } from '@/features/events/hooks';

import { AllChatsConversationRow } from './AllChatsConversationRow';

type ChatFilter = 'all' | 'events' | 'people';

/** Primary line — only uses `ConversationItemDto` sub-objects. */
function rowPrimaryTitle(row: ConversationItemDto): string {
  if (row.event) {
    return row.event.title;
  }
  if (row.peer_user) {
    const p = row.peer_user;
    const n = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
    return n || p.username || `User #${p.id}`;
  }
  return row.thread_key;
}

/** Group-style card (event thread, or no peer/event payload). */
function isGroupStyleRow(row: ConversationItemDto): boolean {
  return row.event != null || row.peer_user == null;
}

function avatarChatFromRow(row: ConversationItemDto): ChatListAvatarChat {
  if (isGroupStyleRow(row)) {
    return {
      mode: 'group',
      title: row.event?.title ?? row.thread_key,
      coverImage: null,
      groupRole: null,
    };
  }
  const p = row.peer_user!;
  const n = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
  return {
    mode: 'direct',
    title: n || p.username || `User #${p.id}`,
    otherUserId: p.id,
    otherAvatar: p.avatar,
    otherUsername: p.username,
  };
}

export default function AllChatsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { encodedKey } = useParams<{ encodedKey?: string }>();

  const [conversations, setConversations] = useState<ConversationItemDto[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const chatSearchInputRef = useRef<HTMLInputElement | null>(null);
  const [chatSearch, setChatSearch] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [chatFilter, setChatFilter] = useState<ChatFilter>('all');

  const threadKey = useMemo(() => {
    if (!encodedKey) return null;
    try {
      return decodeThreadKey(encodedKey);
    } catch {
      return null;
    }
  }, [encodedKey]);

  const drawerOpen = Boolean(encodedKey);

  const activeConversation = useMemo(
    () =>
      threadKey
        ? (conversations.find((c) => c.thread_key === threadKey) ?? null)
        : null,
    [conversations, threadKey],
  );

  const refreshConversations = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await chatApi.listConversations();
      if (res.success) {
        setConversations(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      toast.error('Could not load conversations');
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    if (!encodedKey) return;
    if (!threadKey) {
      toast.error('Invalid chat link');
      navigate('/allchats', { replace: true });
    }
  }, [encodedKey, threadKey, navigate]);

  const {
    runs,
    messagesLoading,
    messagesContainerRef,
    draft,
    setDraft,
    sending,
    sendMessage,
  } = useChatThread(threadKey, { onAfterSend: refreshConversations });

  const { data: friendships } = useMyFriendships(Boolean(user?.id));
  const { data: overviewRows } = useEventOverviewRows(Boolean(user?.id));
  const eventRolesByEventId = useMemo(
    () => buildViewerRolesByEventId(overviewRows, user?.id),
    [overviewRows, user?.id],
  );

  useEffect(() => {
    if (!isSearchExpanded) return;
    const timeout = window.setTimeout(() => chatSearchInputRef.current?.focus(), 120);
    return () => window.clearTimeout(timeout);
  }, [isSearchExpanded]);

  const filteredConversations = useMemo(() => {
    const base =
      chatFilter === 'events'
        ? conversations.filter((c) => c.event != null)
        : chatFilter === 'people'
          ? conversations.filter((c) => c.peer_user != null)
          : conversations;
    const q = chatSearch.trim().toLowerCase();
    if (!q) return base;
    return base.filter((c) => {
      const parts = [
        c.thread_key,
        c.event?.title,
        c.peer_user?.username,
        c.peer_user?.first_name,
        c.peer_user?.last_name,
        c.last_message?.body,
        c.last_message?.sender_username,
      ].filter(Boolean);
      return parts.some((v) => String(v).toLowerCase().includes(q));
    });
  }, [conversations, chatFilter, chatSearch]);

  const closeDrawer = () => {
    navigate('/allchats', { replace: true });
  };

  const openThread = (tk: string) => {
    navigate(`/allchats/t/${encodeThreadKey(tk)}`);
  };

  const drawerTitle = activeConversation
    ? rowPrimaryTitle(activeConversation)
    : (threadKey ?? 'Thread');
  const drawerSubtitle =
    activeConversation?.peer_user && !activeConversation.event
      ? `@${activeConversation.peer_user.username}`
      : '';

  const drawerAvatarChat = activeConversation
    ? avatarChatFromRow(activeConversation)
    : null;

  const drawerDmRelationshipLine = useMemo(() => {
    if (!activeConversation?.peer_user || activeConversation.event) return null;
    if (friendships === undefined || user?.id == null) return null;
    const label = peerDmChipLabel(
      activeConversation.peer_user.id,
      user.id,
      friendships,
    );
    return label ? `Relationship: ${label}` : null;
  }, [activeConversation, friendships, user?.id]);

  const drawerEventMetaLine = useMemo(() => {
    if (!activeConversation || !isGroupStyleRow(activeConversation)) return null;
    const parts: string[] = [];
    const kind = eventChatKindLabel(activeConversation.thread_key);
    if (kind) parts.push(kind);
    if (overviewRows !== undefined) {
      const eid = eventIdForConversationRow(activeConversation);
      if (eid != null) {
        const roles = eventRolesByEventId.get(eid) ?? {
          host: false,
          vendor: false,
          goer: false,
        };
        parts.push(formatViewerEventRoles(roles));
      }
    }
    return parts.length ? parts.join(' · ') : null;
  }, [activeConversation, overviewRows, eventRolesByEventId]);

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
                        {filteredConversations.length} conversation
                        {filteredConversations.length === 1 ? '' : 's'}
                      </Typography>
                      {user?.username ? (
                        <Typography
                          sx={{
                            mt: 0.25,
                            fontSize: 11,
                            color: 'rgba(66, 50, 28, 0.45)',
                          }}
                        >
                          Signed in as @{user.username}
                        </Typography>
                      ) : null}
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
            {listLoading ? (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{ minHeight: 220 }}
              >
                <CircularProgress size={28} sx={{ color: '#D85A30' }} />
              </Stack>
            ) : conversations.length === 0 ? (
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
            ) : filteredConversations.length === 0 ? (
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
                {filteredConversations.map((row) => (
                  <AllChatsConversationRow
                    key={row.thread_key}
                    row={row}
                    isActive={threadKey === row.thread_key}
                    onOpen={() => openThread(row.thread_key)}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </Container>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={closeDrawer}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 440, lg: 480 },
            maxWidth: '100vw',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(251,248,244,0.96) 100%)',
            boxShadow: '-18px 0 48px rgba(86, 58, 28, 0.16)',
            overflow: 'hidden',
          },
        }}
      >
        <Stack sx={{ height: '100%', minHeight: 0 }}>
          <ChatThreadHeader
            onClose={closeDrawer}
            leading={
              drawerAvatarChat ? (
                drawerAvatarChat.mode === 'group' ? (
                  <ChatListAvatar chat={drawerAvatarChat} />
                ) : (
                  <FriendAvatar
                    userId={drawerAvatarChat.otherUserId ?? 0}
                    size={48}
                    imageUrl={drawerAvatarChat.otherAvatar}
                  />
                )
              ) : null
            }
            title={
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: 18,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {drawerTitle}
              </Typography>
            }
            subtitle={
              drawerSubtitle ? (
                <Typography
                  sx={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    mt: 0.25,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {drawerSubtitle}
                </Typography>
              ) : null
            }
            details={
              <>
                {drawerDmRelationshipLine ? (
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.25,
                      color: 'rgba(66, 50, 28, 0.55)',
                    }}
                  >
                    {drawerDmRelationshipLine}
                  </Typography>
                ) : null}
                {drawerEventMetaLine ? (
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.25,
                      color: 'rgba(66, 50, 28, 0.55)',
                      lineHeight: 1.35,
                    }}
                  >
                    {drawerEventMetaLine}
                  </Typography>
                ) : null}
              </>
            }
          />

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              px: 0,
              py: 2,
              background:
                'linear-gradient(180deg, rgba(255,248,241,0.62) 0%, rgba(255,255,255,0.92) 100%)',
            }}
          >
            <ChatThreadCard
              runs={runs}
              userId={user?.id}
              messagesLoading={messagesLoading}
              messagesContainerRef={messagesContainerRef}
              draft={draft}
              onDraftChange={setDraft}
              onSend={() => void sendMessage()}
              sending={sending}
              inputEnabled={Boolean(threadKey)}
              sendEnabled={Boolean(threadKey)}
            />
          </Box>
        </Stack>
      </Drawer>
    </Box>
  );
}
