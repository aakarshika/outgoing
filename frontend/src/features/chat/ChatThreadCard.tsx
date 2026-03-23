import { Box } from '@mui/material';

import { ChatThreadComposer, type ChatThreadComposerProps } from './ChatThreadComposer';
import { ChatThreadMessages, type ChatThreadMessagesProps } from './ChatThreadMessages';

export type ChatThreadCardProps = ChatThreadMessagesProps &
  Pick<
    ChatThreadComposerProps,
    'draft' | 'onDraftChange' | 'onSend' | 'sending' | 'placeholder'
  > & {
    inputEnabled?: boolean;
    sendEnabled?: boolean;
    /** Outer card spacing (e.g. drawer inset). */
    inset?: { mx?: number; mb?: number };
  };

export function ChatThreadCard({
  runs,
  userId,
  messagesLoading,
  messagesContainerRef,
  minHeight,
  draft,
  onDraftChange,
  onSend,
  sending,
  inputEnabled = true,
  sendEnabled = true,
  placeholder,
  inset = { mx: 2, mb: 2 },
}: ChatThreadCardProps) {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        mx: inset.mx,
        mb: inset.mb,
        display: 'flex',
        flexDirection: 'column',
        border: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
        borderRadius: 'var(--border-radius-lg, 12px)',
        overflow: 'hidden',
        bgcolor: 'var(--color-background-primary, #fff)',
      }}
    >
      <ChatThreadMessages
        runs={runs}
        userId={userId}
        messagesLoading={messagesLoading}
        messagesContainerRef={messagesContainerRef}
        minHeight={minHeight}
      />
      <ChatThreadComposer
        draft={draft}
        onDraftChange={onDraftChange}
        onSend={onSend}
        sending={sending}
        inputEnabled={inputEnabled}
        sendEnabled={sendEnabled}
        placeholder={placeholder}
      />
    </Box>
  );
}
