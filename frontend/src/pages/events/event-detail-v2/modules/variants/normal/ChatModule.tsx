import { Box, Typography } from '@mui/material';
import { Send } from 'lucide-react';

interface NormalChatModuleProps {
  event: any;
  canAccessEventChat: boolean;
}

export function NormalChatModule({ event, canAccessEventChat }: NormalChatModuleProps) {
  const messages = event.recent_chat_messages || event.chat_messages || [];
  const memberCount = event.chat_member_count || event.participants_count || 0;

  if (!canAccessEventChat && messages.length === 0) return null;

  const getInitials = (name: string) => name?.charAt(0)?.toUpperCase() || '?';

  const getColorFromName = (name: string) => {
    const colors = ['#D85A30', '#534AB7', '#1D9E75', '#D4537E', '#BA7517'];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  return (
    <Box sx={{ px: 2, pt: 2 }}>
      <Typography
        sx={{
          fontFamily: '"Syne", sans-serif',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-text-primary, #111)',
          mb: 1.25,
          letterSpacing: '0.01em',
        }}
      >
        Event chat
      </Typography>

      <Box
        sx={{
          border: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
          borderRadius: 'var(--border-radius-lg, 12px)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.25,
            borderBottom: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
            bgcolor: 'var(--color-background-secondary, #f9fafb)',
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--color-text-primary, #111)',
            }}
          >
            {event.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              sx={{ fontSize: 11, color: 'var(--color-text-secondary, #6b7280)' }}
            >
              {memberCount} members
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 500,
                color: '#D85A30',
                cursor: 'pointer',
              }}
            >
              Open →
            </Typography>
          </Box>
        </Box>

        {/* Messages */}
        <Box sx={{ p: 1.25, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {messages.length > 0 ? (
            messages.slice(0, 3).map((msg: any, idx: number) => (
              <Box
                key={idx}
                sx={{ display: 'flex', gap: 0.9, alignItems: 'flex-start' }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: getColorFromName(msg.sender_username || 'H'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 500,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {getInitials(msg.sender_name || msg.sender_username)}
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: 10,
                      color: 'var(--color-text-secondary, #6b7280)',
                      mb: 0.25,
                    }}
                  >
                    {msg.sender_name || msg.sender_username}
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: 'var(--color-background-secondary, #f9fafb)',
                      borderRadius:
                        '0 var(--border-radius-md, 8px) var(--border-radius-md, 8px) var(--border-radius-md, 8px)',
                      px: 1.25,
                      py: 0.75,
                      fontSize: 12,
                      color: 'var(--color-text-primary, #111)',
                      lineHeight: 1.4,
                      maxWidth: 220,
                    }}
                  >
                    {msg.message || msg.text}
                  </Box>
                </Box>
              </Box>
            ))
          ) : (
            <Typography
              sx={{
                fontSize: 12,
                color: 'var(--color-text-secondary, #6b7280)',
                textAlign: 'center',
                py: 1,
              }}
            >
              No messages yet. Start the conversation!
            </Typography>
          )}
        </Box>

        {/* Input */}
        {canAccessEventChat && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.25,
              borderTop: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
            }}
          >
            <Box
              component="input"
              placeholder="Say something..."
              sx={{
                flex: 1,
                px: 1.5,
                py: 0.9,
                border: '0.5px solid var(--color-border-secondary, #e5e7eb)',
                borderRadius: 999,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                bgcolor: 'var(--color-background-primary, #fff)',
                color: 'var(--color-text-primary, #111)',
                outline: 'none',
                '&::placeholder': { color: 'var(--color-text-secondary, #9ca3af)' },
              }}
            />
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                bgcolor: '#D85A30',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Send size={13} color="#fff" />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
