import { useAuth } from '@/features/auth/hooks';

import { ChatThreadCard, type ChatThreadCardProps } from './ChatThreadCard';
import { useChatThread, type UseChatThreadOptions } from './useChatThread';

export type ChatComposerPermissions = {
  /** User can type in the field. */
  inputEnabled?: boolean;
  /** User can submit (button + Enter). */
  sendEnabled?: boolean;
  placeholder?: string;
};

export type ChatThreadContainerProps = {
  threadKey: string;
  userId?: number;
  composer?: ChatComposerPermissions;
  /** Passed through to {@link ChatThreadCard} (default margin around the card). */
  inset?: ChatThreadCardProps['inset'];
} & UseChatThreadOptions;

/**
 * Fetches messages (and optional thread insights), scrolls to bottom, and renders
 * {@link ChatThreadCard} (thread + composer). Use when you only have a `thread_key`
 * and want the standard chat UI in any layout.
 */
export function ChatThreadContainer({
  threadKey,
  userId: userIdProp,
  composer,
  inset,
  loadThreadInsights,
  onAfterSend,
}: ChatThreadContainerProps) {
  const { user } = useAuth();
  const userId = userIdProp ?? user?.id;

  const {
    runs,
    messagesLoading,
    messagesContainerRef,
    draft,
    setDraft,
    sending,
    sendMessage,
  } = useChatThread(threadKey, { loadThreadInsights, onAfterSend });

  return (
    <ChatThreadCard
      runs={runs}
      userId={userId}
      messagesLoading={messagesLoading}
      messagesContainerRef={messagesContainerRef}
      draft={draft}
      onDraftChange={setDraft}
      onSend={() => void sendMessage()}
      sending={sending}
      inputEnabled={composer?.inputEnabled ?? true}
      sendEnabled={composer?.sendEnabled ?? true}
      placeholder={composer?.placeholder}
      inset={inset}
    />
  );
}
