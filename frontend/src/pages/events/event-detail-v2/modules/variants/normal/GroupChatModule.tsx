import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { MessageSquare, Send } from 'lucide-react';
import { useState } from 'react';

interface NormalGroupChatModuleProps {
  event: any;
  canAccessEventChat: boolean;
}

export function NormalGroupChatModule({
  event,
  canAccessEventChat,
}: NormalGroupChatModuleProps) {
  const [message, setMessage] = useState('');

  if (!canAccessEventChat) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <MessageSquare size={20} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
          Event Chat
        </Typography>
      </Box>

      <Box
        sx={{
          maxHeight: '200px',
          overflowY: 'auto',
          mb: 2,
          p: 2,
          bgcolor: '#f8fafc',
          borderRadius: '8px',
        }}
      >
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No messages yet. Start the conversation!
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            },
          }}
        />
        <Button
          variant="contained"
          sx={{
            bgcolor: '#0f172a',
            minWidth: 'auto',
            px: 2,
            '&:hover': { bgcolor: '#1e293b' },
          }}
        >
          <Send size={18} />
        </Button>
      </Box>
    </Paper>
  );
}
