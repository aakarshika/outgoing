import { Box } from '@mui/material';
import { Users } from 'lucide-react';

import { FriendAvatar } from '@/features/events/FriendAvatar';
import { HostVendorBadge } from '@/features/events/scrapbookCard/ScrapbookCardOverlays';

export type ChatListAvatarChat = {
  mode: 'group' | 'direct' | 'private';
  title: string;
  coverImage?: string | null;
  otherAvatar?: string | null;
  otherUserId?: number;
  otherUsername?: string | null;
  groupRole?: 'hosting' | 'servicing' | null;
  badgeLabel?: string;
};

export function ChatListAvatar({ chat }: { chat: ChatListAvatarChat }) {
  if (chat.mode === 'group') {
    return (
      <Box
        sx={{
          position: 'relative',
          width: 72,
          height: 66,
          flexShrink: 0,
          overflow: 'visible',
          boxShadow: '0 10px 24px rgba(86, 58, 28, 0.12)',
        }}
      >
        {chat.coverImage ? (
          <Box
            component="img"
            src={chat.coverImage}
            alt={chat.title}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              borderRadius: '14px',
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              background: '#FAECE7',
              color: '#D85A30',
              borderRadius: '14px',
            }}
          >
            <Users size={18} />
          </Box>
        )}
        {chat.groupRole ? (
          <HostVendorBadge
            isHost={chat.groupRole === 'hosting'}
            variant="short"
            sx={{
              left: -6,
              bottom: -6,
              zIndex: 2,
              pointerEvents: 'none',
              px: '4px',
              py: '1px',
              fontSize: '0.52rem',
              lineHeight: 1.05,
              borderRadius: '4px',
            }}
          />
        ) : null}
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', flexShrink: 0 }}>
      <FriendAvatar
        userId={chat.otherUserId ?? 0}
        size={45}
        imageUrl={chat.otherAvatar}
      />
    </Box>
  );
}
