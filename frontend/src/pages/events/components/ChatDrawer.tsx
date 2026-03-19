import { Drawer } from '@mui/material';
import React from 'react';

import { ChatThreadPanel } from '@/pages/chats/components/ChatThreadPanel';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
  mode?: 'group' | 'direct' | 'private';
  eventId?: number;
  conversationId?: number;
  targetUsername?: string;
  otherUsername?: string | null;
  otherAvatar?: string | null;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badgeLabel,
  mode = 'group',
  eventId,
  conversationId,
  targetUsername,
  otherUsername,
  otherAvatar,
}) => {
  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 440, lg: 480 },
          maxWidth: '100vw',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(251,248,244,0.96) 100%)',
          boxShadow: '-18px 0 48px rgba(86, 58, 28, 0.16)',
          overflow: 'hidden',
        },
      }}
    >
      <ChatThreadPanel
        title={title}
        subtitle={subtitle}
        badgeLabel={badgeLabel}
        mode={mode}
        eventId={eventId}
        conversationId={conversationId}
        targetUsername={targetUsername}
        otherUsername={otherUsername}
        otherAvatar={otherAvatar}
        onClose={onClose}
      />
    </Drawer>
  );
};
