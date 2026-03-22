import {
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/hooks';

import { chatApi } from './api';

type ThreadKeyChatDrawerProps = {
  open: boolean;
  onClose: () => void;
  threadKey: string;
  title?: string;
  subtitle?: string;
};

/**
 * Right-side drawer: load/send messages for a single `thread_key` via `/api/chat/messages/`.
 * Used for event vendor/host threads and other fixed-key chats outside `/allchats`.
 */
export function ThreadKeyChatDrawer({
  open,
  onClose,
  threadKey,
  title,
  subtitle,
}: ThreadKeyChatDrawerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPoppedRef = useRef(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!open) return;

    window.history.pushState({ threadKeyChatDrawerOpen: true }, '');
    isPoppedRef.current = false;

    const handlePopState = () => {
      isPoppedRef.current = true;
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (!isPoppedRef.current && window.history.state?.threadKeyChatDrawerOpen) {
        window.history.back();
      }
    };
  }, [open, onClose]);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat', 'messages', threadKey],
    queryFn: async () => {
      const res = await chatApi.listMessages(threadKey, { page_size: 200 });
      if (!res.success) throw new Error(res.message || 'Failed to load messages');
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: open && Boolean(threadKey),
  });

  const postMessage = useMutation({
    mutationFn: (body: string) => chatApi.postMessage(threadKey, body),
    onSuccess: (res) => {
      if (res.success) {
        void queryClient.invalidateQueries({ queryKey: ['chat', 'messages', threadKey] });
      }
    },
  });

  const send = () => {
    const text = draft.trim();
    if (!text || postMessage.isPending) return;
    postMessage.mutate(text, {
      onSuccess: (res) => {
        if (res.success) setDraft('');
        else toast.error(res.message || 'Could not send');
      },
      onError: () => toast.error('Could not send message'),
    });
  };

  return (
    <Drawer
      anchor="right"
      open={open}
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
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ p: 1.75, borderBottom: '0.5px solid #F0EDE8', gap: 1 }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', lineHeight: 1.25 }}>
              {title ?? 'Chat'}
            </Typography>
            {subtitle ? (
              <Typography sx={{ fontSize: 12, color: '#888780', mt: 0.35 }}>{subtitle}</Typography>
            ) : null}
          </Box>
          <IconButton aria-label="Close" onClick={onClose} size="small" sx={{ mt: -0.25 }}>
            <X size={20} />
          </IconButton>
        </Stack>

        <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Stack spacing={1.25}>
              {messages.map((m) => {
                const isMine = user?.id === m.sender_id;
                return (
                  <Box
                    key={m.id}
                    sx={{
                      alignSelf: isMine ? 'flex-end' : 'flex-start',
                      maxWidth: '88%',
                    }}
                  >
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#888780', mb: 0.25 }}>
                      @{m.sender_username}
                    </Typography>
                    <Box
                      sx={{
                        px: 1.25,
                        py: 0.85,
                        borderRadius: '12px',
                        bgcolor: isMine ? '#D85A30' : '#F5F3EF',
                        color: isMine ? '#fff' : '#1A1A1A',
                      }}
                    >
                      <Typography sx={{ fontSize: 14, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                        {m.body}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{ p: 1.5, borderTop: '0.5px solid #F0EDE8', alignItems: 'center' }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={postMessage.isPending}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: '#FAFAF8',
              },
            }}
          />
          <Button
            variant="contained"
            onClick={() => send()}
            disabled={!draft.trim() || postMessage.isPending}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#D85A30',
              '&:hover': { bgcolor: '#c24e2a' },
            }}
          >
            Send
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
