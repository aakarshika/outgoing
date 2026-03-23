import { Box, Stack, Typography, type SxProps, type Theme } from '@mui/material';
import { useMemo, type ReactNode } from 'react';

import type { ConversationItemDto } from '@/features/chat/api';
import { ChatListAvatar, type ChatListAvatarChat } from '@/features/chat/ChatListAvatar';
import {
  buildViewerRolesByEventId,
  eventChatKindLabel,
  eventIdForConversationRow,
  formatViewerEventRoles,
  peerDmChipLabel,
  peerRelationship,
} from '@/features/chat/conversationRowMeta';
import { CATEGORY_THEMES, getCategoryTheme } from '@/features/events/CategoricalBackground';
import {
  formatChatMessagePreview,
  formatChatRelativeTime,
} from '@/features/events/chatList';
import { useEvent, useEventOverviewRows, useMyFriendships } from '@/features/events/hooks';
import { useAuth } from '@/features/auth/hooks';

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

function buildAvatarChat(row: ConversationItemDto, coverImage?: string | null): ChatListAvatarChat {
  if (isGroupStyleRow(row)) {
    return {
      mode: 'group',
      title: row.event?.title ?? row.thread_key,
      coverImage: coverImage ?? null,
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

function resolveTheme(category?: { slug?: string | null } | null) {
  const raw = category?.slug?.trim();
  const slug = raw ? raw.toLowerCase() : '';
  return getCategoryTheme(slug ? { slug } : undefined) ?? CATEGORY_THEMES.default;
}

function MetaPill({
  children,
  background,
  color,
  borderColor,
  sx,
}: {
  children: ReactNode;
  background: string;
  color: string;
  borderColor?: string;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      sx={{
        flexShrink: 0,
        borderRadius: '999px',
        px: 1,
        py: 0.35,
        fontSize: 10,
        fontWeight: 700,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        background,
        color,
        border: borderColor ? `1px solid ${borderColor}` : 'none',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function relationshipPillStyle(rel: ReturnType<typeof peerRelationship>) {
  if (rel === 'friends') return { background: '#EAF3DE', color: '#3B6D11' };
  if (rel === 'pending') return { background: '#FFF4E5', color: '#B45309' };
  return { background: '#EDEBE5', color: '#5F5E5A' };
}

export function AllChatsConversationRow({
  row,
  isActive,
  onOpen,
}: {
  row: ConversationItemDto;
  isActive: boolean;
  onOpen: () => void;
}) {
  const { user } = useAuth();
  const groupCard = isGroupStyleRow(row);
  const eventId = groupCard ? eventIdForConversationRow(row) : undefined;

  const { data: eventApi } = useEvent(eventId ?? 0);
  const eventDetail = eventApi?.success ? eventApi.data : undefined;

  const { data: friendships } = useMyFriendships(Boolean(user?.id));
  const { data: overviewRows } = useEventOverviewRows(Boolean(user?.id));

  const eventRolesByEventId = useMemo(
    () => buildViewerRolesByEventId(overviewRows, user?.id),
    [overviewRows, user?.id],
  );

  const eventTheme = useMemo(
    () => resolveTheme(eventDetail?.category ?? null),
    [eventDetail?.category],
  );

  const kindLabel = eventChatKindLabel(row.thread_key);
  const rolesForEvent =
    groupCard && eventId != null && overviewRows !== undefined
      ? eventRolesByEventId.get(eventId) ?? {
          host: false,
          vendor: false,
          goer: false,
        }
      : null;

  const dmRel =
    !groupCard && row.peer_user && user?.id != null
      ? peerRelationship(row.peer_user.id, user.id, friendships)
      : null;

  const dmChipLabel =
    !groupCard && row.peer_user && user?.id != null
      ? peerDmChipLabel(row.peer_user.id, user.id, friendships)
      : null;

  const avatarChat = buildAvatarChat(row, eventDetail?.cover_image ?? null);

  return (
    <Box
      component="button"
      type="button"
      onClick={onOpen}
      sx={{
        position: 'relative',
        width: '100%',
        textAlign: 'left',
        border: 'none',
        borderRadius: '24px',
        px: 1.25,
        py: 1.15,
        background: groupCard
          ? isActive
            ? 'rgba(255, 248, 241, 0.98)'
            : 'rgba(255, 251, 247, 0.94)'
          : isActive
            ? 'rgba(255, 248, 241, 0.94)'
            : 'rgba(255,255,255,0.88)',
        boxShadow: isActive
          ? '0 16px 34px rgba(86, 58, 28, 0.12)'
          : '0 6px 16px rgba(86, 58, 28, 0.05)',
        transition: 'background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease',
        ...(groupCard
          ? {
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 8,
                bottom: 8,
                width: 4,
                borderRadius: '999px',
                background: eventTheme.accent,
              },
            }
          : {}),
        '&:hover': {
          background: groupCard ? 'rgba(255, 248, 241, 1)' : 'rgba(255,255,255,0.96)',
          boxShadow: '0 18px 36px rgba(86, 58, 28, 0.1)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <ChatListAvatar chat={avatarChat} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          {groupCard ? (
            <Stack spacing={0.35} sx={{ minWidth: 0 }}>
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
                {rowPrimaryTitle(row)}
              </Typography>
              {kindLabel || rolesForEvent ? (
                <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.15 }}>
                  {kindLabel ? (
                    <MetaPill
                      background={eventTheme.tape}
                      color={eventTheme.accent}
                      borderColor={`${eventTheme.accent}55`}
                    >
                      {kindLabel}
                    </MetaPill>
                  ) : null}
                  {rolesForEvent ? (
                    <MetaPill
                      background={eventTheme.tape}
                      color={eventTheme.accent}
                      borderColor={`${eventTheme.accent}55`}
                    >
                      {formatViewerEventRoles(rolesForEvent)}
                    </MetaPill>
                  ) : null}
                </Stack>
              ) : null}
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
                    row.last_message?.sender_username ?? null,
                    row.last_message?.body ?? null,
                  )}
                </Typography>
                {row.updated_at ? (
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
                    {formatChatRelativeTime(row.updated_at)}
                  </Typography>
                ) : null}
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={0.35} sx={{ minWidth: 0 }}>
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
                {rowPrimaryTitle(row)}
              </Typography>
              {row.peer_user ? (
                <Typography
                  sx={{
                    fontSize: 12,
                    color: 'rgba(66, 50, 28, 0.5)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  @{row.peer_user.username}
                </Typography>
              ) : null}
              {friendships !== undefined && dmRel != null && dmChipLabel ? (
                <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.15 }}>
                  <MetaPill
                    {...relationshipPillStyle(dmRel)}
                    sx={{
                      alignSelf: 'flex-start',
                      maxWidth: '100%',
                      whiteSpace: 'normal',
                      textAlign: 'left',
                    }}
                  >
                    {dmChipLabel}
                  </MetaPill>
                </Stack>
              ) : null}
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
                  {row.last_message?.body ?? ''}
                </Typography>
                {row.updated_at ? (
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
                    {formatChatRelativeTime(row.updated_at)}
                  </Typography>
                ) : null}
              </Stack>
            </Stack>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
