import type { EventOverviewRow } from '@/pages/alerts/utils';

import type { FriendshipItem, NetworkActivityItem, NetworkPeopleResponse } from './api';

export interface ChatActivityItem {
  id: string;
  type: 'activity';
  occurredAt: string;
  label: string;
  detail?: string;
  eventId?: number;
  eventTitle?: string;
}

export interface ChatMessageItem {
  id: string;
  type: 'message';
  occurredAt: string;
  message: any;
}

export type ChatTimelineItem = ChatActivityItem | ChatMessageItem;

function normalizeUsername(value?: string | null) {
  return (value || '').trim().toLowerCase();
}

function otherUsername(friendship: FriendshipItem, currentUsername: string) {
  return normalizeUsername(friendship.user1_username) ===
    normalizeUsername(currentUsername)
    ? friendship.user2_username
    : friendship.user1_username;
}

export function findFriendshipForUserChat(
  friendships: FriendshipItem[],
  currentUsername?: string | null,
  targetUsername?: string | null,
) {
  const normalizedCurrent = normalizeUsername(currentUsername);
  const normalizedTarget = normalizeUsername(targetUsername);

  if (!normalizedCurrent || !normalizedTarget) return null;

  return (
    friendships.find(
      (friendship) =>
        normalizeUsername(otherUsername(friendship, normalizedCurrent)) ===
        normalizedTarget,
    ) || null
  );
}

function pushActivity(
  items: ChatActivityItem[],
  seenKeys: Set<string>,
  next: {
    id: string;
    occurredAt?: string | null;
    label: string;
    detail?: string;
    eventId?: number;
    eventTitle?: string;
  },
) {
  if (!next.occurredAt) return;
  const occurredAt = new Date(next.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) return;
  if (seenKeys.has(next.id)) return;
  seenKeys.add(next.id);
  items.push({
    id: next.id,
    type: 'activity',
    occurredAt: occurredAt.toISOString(),
    label: next.label,
    detail: next.detail,
    eventId: next.eventId,
    eventTitle: next.eventTitle,
  });
}

export function buildUserChatActivities({
  currentUserId,
  targetUsername,
  friendship,
  networkPeople,
  networkActivity,
  eventOverviewRows,
}: {
  currentUserId?: number;
  targetUsername?: string | null;
  friendship?: FriendshipItem | null;
  networkPeople?: NetworkPeopleResponse | null;
  networkActivity?: NetworkActivityItem[];
  eventOverviewRows?: EventOverviewRow[];
}) {
  const normalizedTarget = normalizeUsername(targetUsername);
  if (!normalizedTarget) return [] as ChatActivityItem[];

  const eventRowsById = new Map(
    (eventOverviewRows || [])
      .filter((row) => row.event_details)
      .map((row) => [row.event_id, row] as const),
  );
  const activities: ChatActivityItem[] = [];
  const seenKeys = new Set<string>();

  if (friendship) {
    pushActivity(activities, seenKeys, {
      id: `friends-${friendship.id}`,
      occurredAt: friendship.accepted_at || friendship.created_at,
      label: 'Became friends',
    });

    if (friendship.met_at_event && friendship.met_at_event_title) {
      const metRow = eventRowsById.get(friendship.met_at_event);
      pushActivity(activities, seenKeys, {
        id: `met-${friendship.met_at_event}`,
        occurredAt:
          metRow?.event_details?.start_time ||
          friendship.accepted_at ||
          friendship.created_at,
        label: `Met at ${friendship.met_at_event_title}`,
        eventId: friendship.met_at_event,
        eventTitle: friendship.met_at_event_title,
      });
    }
  }

  const commonPastEvents = (networkPeople?.went_to_events_with || []).filter(
    (person) => normalizeUsername(person.username) === normalizedTarget,
  );

  for (const person of commonPastEvents) {
    if (!person.event_id || !person.event_title) continue;
    const eventRow = eventRowsById.get(person.event_id);
    const eventStartTime = eventRow?.event_details?.start_time;

    pushActivity(activities, seenKeys, {
      id: `went-${person.event_id}`,
      occurredAt: eventStartTime,
      label: `Went to ${person.event_title} together`,
      eventId: person.event_id,
      eventTitle: person.event_title,
    });

    const eventHostUsername = normalizeUsername(
      eventRow?.event_details?.host?.username,
    );
    if (eventHostUsername && eventStartTime) {
      if (currentUserId && eventRow?.host_user_id === currentUserId) {
        pushActivity(activities, seenKeys, {
          id: `you-hosted-${person.event_id}`,
          occurredAt: eventStartTime,
          label: `You hosted ${targetUsername}`,
        });
      } else if (eventHostUsername === normalizedTarget) {
        pushActivity(activities, seenKeys, {
          id: `they-hosted-${person.event_id}`,
          occurredAt: eventStartTime,
          label: `${targetUsername} hosted you`,
        });
      }
    }
  }

  const filteredNetworkActivity = (networkActivity || []).filter(
    (item) => normalizeUsername(item.actor.username) === normalizedTarget,
  );

  for (const item of filteredNetworkActivity) {
    if (item.kind === 'going') {
      pushActivity(activities, seenKeys, {
        id: `going-${item.event_id}`,
        occurredAt: item.happened_at,
        label: `Going to ${item.event_title} together`,
        eventId: item.event_id,
        eventTitle: item.event_title,
      });
    }

    if (item.kind === 'hosting') {
      const eventRow = eventRowsById.get(item.event_id);
      const isHostedByTarget =
        normalizeUsername(eventRow?.event_details?.host?.username) === normalizedTarget;
      const isHostedByMe = currentUserId && eventRow?.host_user_id === currentUserId;

      if (isHostedByTarget) {
        pushActivity(activities, seenKeys, {
          id: `hosting-them-${item.event_id}`,
          occurredAt: item.happened_at,
          label: `${targetUsername} hosted you`,
        });
      } else if (isHostedByMe) {
        pushActivity(activities, seenKeys, {
          id: `hosting-me-${item.event_id}`,
          occurredAt: item.happened_at,
          label: `You hosted ${targetUsername}`,
        });
      }
    }
  }

  return activities.sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );
}

export function buildChatTimeline({
  messages,
  activities,
}: {
  messages: any[];
  activities?: ChatActivityItem[];
}) {
  const timeline: ChatTimelineItem[] = [
    ...messages.map((message, index) => ({
      id: String(message.id || message.created_at || `message-${index}`),
      type: 'message' as const,
      occurredAt: message.created_at || new Date(0).toISOString(),
      message,
    })),
    ...(activities || []),
  ];

  return timeline.sort((a, b) => {
    const aTime = new Date(a.occurredAt).getTime();
    const bTime = new Date(b.occurredAt).getTime();
    if (aTime !== bTime) return aTime - bTime;
    if (a.type === b.type) return 0;
    return a.type === 'activity' ? -1 : 1;
  });
}
