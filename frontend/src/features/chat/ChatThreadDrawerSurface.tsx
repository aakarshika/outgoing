import { Box, Stack, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuth } from '@/features/auth/hooks';
import type { ConversationItemDto } from '@/features/chat/api';
import {
  ChatListAvatar,
  type ChatListAvatarChat,
} from '@/features/chat/ChatListAvatar';
import { ChatThreadContainer } from '@/features/chat/ChatThreadContainer';
import { ChatThreadHeader } from '@/features/chat/ChatThreadHeader';
import {
  buildViewerRolesByEventId,
  eventChatKindLabel,
  eventIdForConversationRow,
  formatViewerEventRoles,
  peerDmChipLabel,
} from '@/features/chat/conversationRowMeta';
import { FriendAvatar } from '@/features/events/FriendAvatar';
import { useEventOverviewRows, useMyFriendships } from '@/features/events/hooks';

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

export type ChatThreadDrawerSurfaceProps = {
  threadKey: string;
  onClose: () => void;
  /** From `listConversations` when available; otherwise header uses fallbacks. */
  activeConversation: ConversationItemDto | null;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
};

/**
 * Single chat thread experience for the global drawer: Syne header + {@link ChatThreadContainer}.
 */
export function ChatThreadDrawerSurface({
  threadKey,
  onClose,
  activeConversation,
  fallbackTitle,
  fallbackSubtitle,
}: ChatThreadDrawerSurfaceProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: friendships } = useMyFriendships(Boolean(user?.id));
  const { data: overviewRows } = useEventOverviewRows(Boolean(user?.id));
  const eventRolesByEventId = useMemo(
    () => buildViewerRolesByEventId(overviewRows, user?.id),
    [overviewRows, user?.id],
  );

  const drawerTitle = activeConversation
    ? rowPrimaryTitle(activeConversation)
    : (fallbackTitle ?? threadKey);
  const drawerSubtitle =
    activeConversation?.peer_user && !activeConversation.event
      ? `@${activeConversation.peer_user.username}`
      : (fallbackSubtitle ?? '');

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
  }, [activeConversation, friendships, user]);

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

  const onAfterSend = () => {
    void queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
  };

  return (
    <Stack sx={{ height: '100%', minHeight: 0 }}>
      <ChatThreadHeader
        onClose={onClose}
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
        <ChatThreadContainer
          threadKey={threadKey}
          userId={user?.id}
          onAfterSend={onAfterSend}
          composer={{
            inputEnabled: true,
            sendEnabled: true,
          }}
        />
      </Box>
    </Stack>
  );
}
