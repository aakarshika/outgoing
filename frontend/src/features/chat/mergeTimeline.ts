import { buildChatTimeline, type ChatTimelineItem } from '@/features/events/chatTimeline';

import type { ChatMessageDto, ThreadInsightDto } from './api';

/** Merge persisted messages with thread insights; same ordering as legacy `buildChatTimeline`. */
export function mergeMessagesWithInsights(
  messages: ChatMessageDto[],
  insights: ThreadInsightDto[],
): ChatTimelineItem[] {
  const activities = insights.map((row) => ({
    id: row.id,
    type: 'activity' as const,
    occurredAt: row.occurred_at,
    label: row.label,
    detail: row.detail ?? undefined,
    eventId: row.event_id ?? undefined,
    eventTitle: row.event_title ?? undefined,
  }));

  return buildChatTimeline({
    messages,
    activities,
  });
}
