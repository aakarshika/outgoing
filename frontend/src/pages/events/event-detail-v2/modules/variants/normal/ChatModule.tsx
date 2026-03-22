import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import { Send, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  useHostVendorMessages,
  useAddHostVendorMessage,
} from '@/features/events/hooks';
import { SubHeaderEventPage } from './SubHeaderEventPage';

interface NormalChatModuleProps {
  event: any;
  canAccessEventChat: boolean;
}

const AVATAR_COLORS = [
  { bg: '#B5D4F4', text: '#0C447C' },
  { bg: '#C0DD97', text: '#27500A' },
  { bg: '#F5C4B3', text: '#71271E' },
  { bg: '#CECBF6', text: '#3C3489' },
  { bg: '#9FE1CB', text: '#085041' },
  { bg: '#FAC775', text: '#633806' },
  { bg: '#F4C0D1', text: '#72243E' },
];

export function NormalChatModule({ event, canAccessEventChat }: NormalChatModuleProps) {
  const eventId = event?.id;
  const { data: messagesResponse, isLoading } = useHostVendorMessages(
    eventId,
    !!eventId && canAccessEventChat,
  );
  const addMessageMutation = useAddHostVendorMessage();

  const [messageText, setMessageText] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() => {
    return messagesResponse?.data || [];
  }, [messagesResponse]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  // Group messages by sender and time
  const groupedMessages = useMemo(() => {
    const groups: any[] = [];
    messages.forEach((msg: any, idx: number) => {
      const prevMsg = messages[idx - 1];
      const isNewGroup =
        !prevMsg ||
        prevMsg.sender_id !== msg.sender_id ||
        new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() >
          60000;

      if (isNewGroup) {
        groups.push({
          sender_id: msg.sender_id,
          sender_name: msg.sender_name || msg.sender_username || 'Anonymous',
          sender_avatar: msg.sender_avatar,
          sender_role: msg.sender_role,
          messages: [msg],
        });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    return groups;
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !eventId) return;

    addMessageMutation.mutate(
      { eventId, payload: { text: messageText } },
      {
        onSuccess: () => {
          setMessageText('');
        },
      },
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!canAccessEventChat) return null;

  if (!(event.lifecycle_state == 'completed' || event.lifecycle_state == 'live' 
    || event.lifecycle_state == 'event_ready')) return null;
  
  return (
    <Box sx={{ px: 2, pt: 2, pb: 4 }}>
      
      
      <SubHeaderEventPage
        heading="Event chat"
        icon="material-symbols-light:conversation"
        description="Join the conversation and share your thoughts and experiences with the community."
      />
      <Box
        sx={{
          border: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
          borderRadius: 'var(--border-radius-lg, 12px)',
          overflow: 'hidden',
          bgcolor: 'var(--color-background-primary, #fff)',
          display: 'flex',
          flexDirection: 'column',
          height: 360,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: '11px 14px',
            borderBottom: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: '#22c55e',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.35 },
                },
              }}
            />
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text-primary, #111)',
              }}
            >
              {event.lifecycle_state == 'live' ? 'Live ' : 'Chat has ended'}
            </Typography>
          </Box>
          <Typography
            sx={{ fontSize: 11, color: 'var(--color-text-secondary, #6b7280)' }}
          >
            {/* Mocking online count */}
            {Math.floor(Math.random() * 5) + 8} here
          </Typography>
        </Box>

        {/* Messages */}
        <Box
          ref={messagesContainerRef}
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            '&::-webkit-scrollbar': { width: 3 },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'var(--color-border-secondary, #e5e7eb)',
              borderRadius: 3,
            },
          }}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={20} sx={{ color: '#15803d' }} />
            </Box>
          ) : groupedMessages.length === 0 ? (
            <Typography
              sx={{
                fontSize: 12,
                color: 'var(--color-text-secondary, #6b7280)',
                textAlign: 'center',
                py: 4,
                fontStyle: 'italic',
              }}
            >
              No messages yet.
            </Typography>
          ) : (
            groupedMessages.map((group, groupIdx) => {
              const colorIdx = group.sender_id
                ? typeof group.sender_id === 'number'
                  ? group.sender_id
                  : group.sender_id.length
                : groupIdx;
              const color = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length];

              return (
                <Box key={groupIdx} sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      bgcolor: group.sender_avatar ? 'transparent' : color.bg,
                      color: color.text,
                      flexShrink: 0,
                      alignSelf: 'flex-end',
                    }}
                  >
                    <UserAvatar
                      src={group.sender_avatar}
                      username={group.sender_name}
                      size="xs"
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: 'transparent',
                        color: 'inherit',
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.25,
                      maxWidth: '80%',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 10,
                        color: 'var(--color-text-secondary, #6b7280)',
                        px: 0.5,
                      }}
                    >
                      {group.sender_name}
                    </Typography>
                    {group.messages.map((msg: any, msgIdx: number) => {
                      const isFirst = msgIdx === 0;
                      const isLast = msgIdx === group.messages.length - 1;
                      const isSolo = group.messages.length === 1;

                      let borderRadius = '14px';
                      if (isSolo) borderRadius = '14px 14px 14px 3px';
                      else if (isFirst) borderRadius = '14px 14px 14px 3px';
                      else if (isLast) borderRadius = '3px 14px 14px 14px';
                      else borderRadius = '3px 14px 14px 3px';

                      return (
                        <Box
                          key={msg.id || msgIdx}
                          sx={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            '&:hover .msg-actions': { opacity: 1 },
                          }}
                        >
                          <Box
                            sx={{
                              p: '7px 11px',
                              fontSize: 13,
                              color: 'var(--color-text-primary, #111)',
                              bgcolor: 'var(--color-background-secondary, #f3f4f6)',
                              borderRadius,
                              lineHeight: 1.4,
                            }}
                          >
                            {msg.text || msg.message}
                          </Box>
                          <Box
                            className="msg-actions"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              opacity: 0,
                              transition: 'opacity 0.12s',
                            }}
                          >
                            <IconButton
                              size="small"
                              sx={{
                                p: '1px 6px',
                                border:
                                  '0.5px solid var(--color-border-tertiary, #e5e7eb)',
                                borderRadius: '20px',
                                bgcolor: 'var(--color-background-primary, #fff)',
                                '&:hover': {
                                  bgcolor: 'var(--color-background-secondary, #f3f4f6)',
                                },
                              }}
                            >
                              <Plus size={10} />
                            </IconButton>
                            <Typography
                              sx={{
                                fontSize: 9,
                                color: 'var(--color-text-tertiary, #9ca3af)',
                              }}
                            >
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              );
            })
          )}
        </Box>

        {/* Input */}
        <Box
          sx={{
            p: '10px 12px',
            borderTop: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
            display: 'flex',
            gap: 1,
            alignItems: 'center',
          }}
        >
          <Box
            component="input"
            value={messageText}
            onChange={(e: any) => setMessageText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Say something..."
            sx={{
              flex: 1,
              bgcolor: 'var(--color-background-secondary, #f3f4f6)',
              border: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
              borderRadius: '20px',
              p: '7px 12px',
              fontSize: 13,
              color: 'var(--color-text-primary, #111)',
              outline: 'none',
              fontFamily: 'inherit',
              '&:focus': { borderColor: '#15803d' },
            }}
          />
          <IconButton
            onClick={handleSendMessage}
            disabled={!messageText.trim() || addMessageMutation.isPending}
            sx={{
              bgcolor: '#15803d',
              color: '#fff',
              width: 30,
              height: 30,
              '&:hover': { bgcolor: '#166534' },
              '&.Mui-disabled': {
                bgcolor: 'var(--color-background-tertiary, #e5e7eb)',
                color: '#9ca3af',
              },
            }}
          >
            {addMessageMutation.isPending ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <Send size={14} />
            )}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
