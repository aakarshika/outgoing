import { Box } from '@mui/material';

import { useAuth } from '@/features/auth/hooks';
import { ChatThreadContainer } from '@/features/chat/ChatThreadContainer';

import { SubHeaderEventPage } from './SubHeaderEventPage';

interface NormalChatModuleProps {
  event: { id?: number; lifecycle_state?: string };
  canAccessEventChat: boolean;
}

const CHAT_LIFECYCLE = new Set(['completed', 'live', 'event_ready']);

export function NormalChatModule({ event, canAccessEventChat }: NormalChatModuleProps) {
  const { user } = useAuth();
  const eventId = event?.id;
  const threadKey = eventId != null ? `event_public:${eventId}` : '';

  if (
    !eventId ||
    !event.lifecycle_state ||
    !CHAT_LIFECYCLE.has(event.lifecycle_state)
  ) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ px: 2, pt: 2, pb: 4 }}>
      <SubHeaderEventPage
        heading="Event chat"
        icon="material-symbols-light:conversation"
        description="Join the conversation and share your thoughts and experiences with the community."
      />
      <Box
        sx={{
          height: 360,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <ChatThreadContainer
          threadKey={threadKey}
          loadThreadInsights={false}
          inset={{ mx: 0, mb: 0 }}
          composer={{
            inputEnabled: canAccessEventChat,
            sendEnabled: canAccessEventChat,
            placeholder: canAccessEventChat
              ? 'Say something...'
              : 'Read-only — only hosts, vendors, and ticket holders can post.',
          }}
        />
      </Box>
    </Box>
  );
}
