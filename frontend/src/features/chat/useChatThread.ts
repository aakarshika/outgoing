import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  chatApi,
  type ChatMessageDto,
  type ThreadInsightDto,
} from '@/features/chat/api';
import { groupTimelineForDrawer } from '@/features/chat/groupTimelineForDrawer';
import { mergeMessagesWithInsights } from '@/features/chat/mergeTimeline';

export type UseChatThreadOptions = {
  /**
   * Load thread insights merged into the timeline (DM-style).
   * Default: `threadKey` starts with `user:`.
   */
  loadThreadInsights?: boolean;
  /** e.g. refresh conversation list after send */
  onAfterSend?: () => void;
};

export function useChatThread(
  threadKey: string | null,
  options?: UseChatThreadOptions,
) {
  const { loadThreadInsights, onAfterSend } = options ?? {};

  const loadInsights =
    loadThreadInsights ?? (threadKey != null && threadKey.startsWith('user:'));

  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [insights, setInsights] = useState<ThreadInsightDto[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft('');
  }, [threadKey]);

  useEffect(() => {
    if (!threadKey) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setMessagesLoading(true);
      try {
        const res = await chatApi.listMessages(threadKey, { page_size: 100 });
        if (cancelled) return;
        if (res.success) {
          setMessages(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        if (!cancelled) toast.error('Could not load messages');
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [threadKey]);

  useEffect(() => {
    if (!threadKey || !loadInsights) {
      setInsights([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await chatApi.listThreadInsights(threadKey);
        if (cancelled) return;
        if (res.success && Array.isArray(res.data)) {
          setInsights(res.data);
        } else {
          setInsights([]);
        }
      } catch {
        if (!cancelled) setInsights([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [threadKey, loadInsights]);

  const timeline = useMemo(
    () => mergeMessagesWithInsights(messages, insights),
    [messages, insights],
  );

  const runs = useMemo(() => groupTimelineForDrawer(timeline), [timeline]);

  useEffect(() => {
    if (!threadKey || messagesLoading) return;
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [threadKey, messages, messagesLoading, insights]);

  const sendMessage = useCallback(async () => {
    const text = draft.trim();
    if (!threadKey || !text || sending) return;
    setSending(true);
    try {
      const res = await chatApi.postMessage(threadKey, text);
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        setDraft('');
        onAfterSend?.();
      }
    } catch {
      toast.error('Could not send message');
    } finally {
      setSending(false);
    }
  }, [threadKey, draft, sending, onAfterSend]);

  return {
    messages,
    setMessages,
    messagesLoading,
    insights,
    runs,
    draft,
    setDraft,
    sending,
    sendMessage,
    messagesContainerRef,
  };
}
