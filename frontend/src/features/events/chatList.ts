import type { EventOverviewRow } from '@/pages/alerts/utils';

import type { AllChatsListResponse, FriendshipItem } from './api';

export type AllChatMode = 'group' | 'private' | 'direct';
export type AllChatSectionKey = 'management' | 'network';

export interface AllChatEntry {
  id: string;
  mode: AllChatMode;
  section: AllChatSectionKey;
  title: string;
  subtitle: string;
  badgeLabel: string;
  updatedAt: string | null;
  eventId?: number;
  conversationId?: number;
  targetUsername?: string;
  otherUsername?: string | null;
  otherAvatar?: string | null;
  eventTitle?: string | null;
  coverImage?: string | null;
  isPlaceholder?: boolean;
}

interface BuildAllChatEntriesOptions {
  response?: AllChatsListResponse | null;
  friendships?: FriendshipItem[];
  eventOverviewRows?: EventOverviewRow[];
  currentUserId?: number;
  currentUsername?: string | null;
}

function sortByUpdatedAtDesc(entries: AllChatEntry[]) {
  return [...entries].sort((a, b) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bTime - aTime;
  });
}

function otherUsername(friendship: FriendshipItem, currentUsername: string) {
  return friendship.user1_username === currentUsername
    ? friendship.user2_username
    : friendship.user1_username;
}

function deriveManagedEventRows(
  eventOverviewRows: EventOverviewRow[],
  currentUserId?: number,
) {
  if (!currentUserId) return [];

  const allowedLifecycle = new Set(['published', 'ready', 'live']);
  const managedEvents = new Map<number, EventOverviewRow>();

  for (const row of eventOverviewRows) {
    if (!allowedLifecycle.has(row.event_lifecycle_state)) continue;
    if (!row.event_details) continue;

    const isHost = row.host_user_id === currentUserId;
    const isVendor =
      row.need_applied_to_user_id === currentUserId ||
      row.need_application_requested_by_host_vendor_user_id === currentUserId ||
      row.need_assigned_user_id === currentUserId;

    if (isHost || isVendor) {
      managedEvents.set(row.event_id, row);
    }
  }

  return Array.from(managedEvents.values()).sort(
    (a, b) =>
      new Date(b.event_details?.start_time || b.event_created_date || 0).getTime() -
      new Date(a.event_details?.start_time || a.event_created_date || 0).getTime(),
  );
}

export function buildAllChatEntries({
  response,
  friendships = [],
  eventOverviewRows = [],
  currentUserId,
  currentUsername,
}: BuildAllChatEntriesOptions): AllChatEntry[] {
  const baseResponse = response ?? null;
  const entries: AllChatEntry[] = [];
  const eventRowsById = new Map(
    eventOverviewRows
      .filter((row) => row.event_details)
      .map((row) => [row.event_id, row] as const),
  );

  if (baseResponse) {
    entries.push(
      ...baseResponse.management_group.map((chat) => ({
        id: `group-${chat.event_id}`,
        mode: 'group' as const,
        section: 'management' as const,
        title: chat.event_title || 'Event group chat',
        subtitle: 'Host + vendor group chat',
        badgeLabel: 'Group',
        updatedAt: chat.latest_message_at || null,
        eventId: chat.event_id,
        eventTitle: chat.event_title,
        coverImage:
          eventRowsById.get(chat.event_id)?.event_details?.cover_image || null,
      })),
    );

    entries.push(
      ...baseResponse.management.map((chat) => ({
        id: `private-${chat.conversation_id}`,
        mode: 'private' as const,
        section: 'management' as const,
        title: chat.event_title || chat.other_username || 'Event chat',
        subtitle: chat.other_username
          ? `Private chat with @${chat.other_username}`
          : 'Private event conversation',
        badgeLabel: 'Event',
        updatedAt: chat.updated_at || null,
        eventId: chat.event_id ?? undefined,
        conversationId: chat.conversation_id,
        otherUsername: chat.other_username,
        otherAvatar: chat.other_avatar,
        eventTitle: chat.event_title,
        coverImage: chat.event_id
          ? eventRowsById.get(chat.event_id)?.event_details?.cover_image || null
          : null,
      })),
    );

    entries.push(
      ...baseResponse.network.map((chat) => ({
        id: `private-${chat.conversation_id}`,
        mode: 'private' as const,
        section: 'network' as const,
        title: chat.other_username ? `@${chat.other_username}` : 'Direct chat',
        subtitle: chat.event_title ? `Met through ${chat.event_title}` : 'User chat',
        badgeLabel: 'Direct',
        updatedAt: chat.updated_at || null,
        eventId: chat.event_id ?? undefined,
        conversationId: chat.conversation_id,
        otherUsername: chat.other_username,
        otherAvatar: chat.other_avatar,
        eventTitle: chat.event_title,
        targetUsername: chat.other_username ?? undefined,
      })),
    );
  }

  const entriesByEventId = new Map<number, AllChatEntry>();
  const entriesByUsername = new Map<string, AllChatEntry>();

  for (const entry of entries) {
    if (entry.eventId && entry.mode === 'group') {
      entriesByEventId.set(entry.eventId, entry);
    }
    const username = (entry.targetUsername || entry.otherUsername || '')
      .trim()
      .toLowerCase();
    if (username && entry.section === 'network') {
      entriesByUsername.set(username, entry);
    }
  }

  for (const row of deriveManagedEventRows(eventOverviewRows, currentUserId)) {
    if (entriesByEventId.has(row.event_id)) continue;

    const isHost = row.host_user_id === currentUserId;
    entries.push({
      id: `group-${row.event_id}`,
      mode: 'group',
      section: 'management',
      title: row.event_details?.title || `Event #${row.event_id}`,
      subtitle: isHost ? 'Host' : 'Vendor group chat',
      badgeLabel: 'Group',
      updatedAt: row.event_details?.start_time || row.event_created_date || null,
      eventId: row.event_id,
      eventTitle: row.event_details?.title || null,
      coverImage: row.event_details?.cover_image || null,
      isPlaceholder: true,
    });
    entriesByEventId.set(row.event_id, entries[entries.length - 1]);
  }

  if (currentUsername) {
    for (const friendship of friendships) {
      const username = otherUsername(friendship, currentUsername).trim();
      if (!username) continue;
      if (entriesByUsername.has(username.toLowerCase())) continue;

      entries.push({
        id: `direct-${username.toLowerCase()}`,
        mode: 'direct',
        section: 'network',
        title: `@${username}`,
        subtitle: friendship.met_at_event_title
          ? `Met at ${friendship.met_at_event_title}`
          : 'Friend',
        badgeLabel: 'Friend',
        updatedAt: friendship.updated_at || friendship.created_at || null,
        targetUsername: username,
        otherUsername: username,
        eventId: friendship.met_at_event ?? undefined,
        eventTitle: friendship.met_at_event_title,
        isPlaceholder: true,
      });
      entriesByUsername.set(username.toLowerCase(), entries[entries.length - 1]);
    }
  }

  const managementEntries = sortByUpdatedAtDesc(
    entries.filter((entry) => entry.section === 'management'),
  );
  const networkEntries = sortByUpdatedAtDesc(
    entries.filter((entry) => entry.section === 'network'),
  );

  return [...managementEntries, ...networkEntries];
}

export function formatChatTimestamp(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const isSameDay = now.toDateString() === date.toDateString();

  if (isSameDay) {
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) {
    return 'Yesterday';
  }

  const isSameYear = now.getFullYear() === date.getFullYear();
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    ...(isSameYear ? {} : { year: 'numeric' }),
  });
}
