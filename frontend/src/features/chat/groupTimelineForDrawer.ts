import type { ChatMessageDto } from '@/features/chat/api';
import type { ChatTimelineItem } from '@/features/events/chatTimeline';

export type DrawerActivityRun = {
  kind: 'activity';
  item: Extract<ChatTimelineItem, { type: 'activity' }>;
};

export type DrawerMessageGroupRun = {
  kind: 'group';
  sender_id: number;
  sender_username: string;
  sender_avatar: string | null;
  messages: ChatMessageDto[];
};

export type DrawerTimelineRun = DrawerActivityRun | DrawerMessageGroupRun;

const GROUP_GAP_MS = 60_000;

/**
 * Split timeline into activity rows and message groups (same sender, ≤60s apart),
 * matching {@link ChatThreadMessages} / event chat grouping.
 */
export function groupTimelineForDrawer(
  timeline: ChatTimelineItem[],
): DrawerTimelineRun[] {
  const runs: DrawerTimelineRun[] = [];
  let group: DrawerMessageGroupRun | null = null;

  const flush = () => {
    if (group) {
      runs.push(group);
      group = null;
    }
  };

  for (const item of timeline) {
    if (item.type === 'activity') {
      flush();
      runs.push({ kind: 'activity', item });
      continue;
    }

    const msg = item.message as ChatMessageDto;
    const lastInGroup = group?.messages[group.messages.length - 1];
    const startNewGroup =
      !group ||
      group.sender_id !== msg.sender_id ||
      !lastInGroup ||
      new Date(msg.created_at).getTime() - new Date(lastInGroup.created_at).getTime() >
        GROUP_GAP_MS;

    if (startNewGroup) {
      flush();
      group = {
        kind: 'group',
        sender_id: msg.sender_id,
        sender_username: msg.sender_username,
        sender_avatar: msg.sender_avatar,
        messages: [msg],
      };
    } else {
      group!.messages.push(msg);
    }
  }
  flush();
  return runs;
}
