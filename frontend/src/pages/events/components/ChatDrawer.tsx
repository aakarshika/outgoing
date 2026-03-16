import {
  Box,
  Drawer,
  IconButton,
  InputBase,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Send, X, Minimize2, Maximize2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { Hostname } from '@/components/ui/Hostname';
import { useAuth } from '@/features/auth/hooks';
import {
  useAddHostVendorMessage,
  useAddDirectMessage,
  useAddPrivateMessage,
  useDirectMessages,
  useHostVendorMessages,
  usePrivateMessages,
} from '@/features/events/hooks';
import { BuddyRequestPanel } from './BuddyRequestPanel';

// --- Compact Message Item Component ---
const MessageItem = ({ message }: { message: any }) => {
  const { user } = useAuth();
  const isMine = user?.username === message.sender_username;

  return (
    <Box
      sx={{
        mb: 1.5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMine ? 'flex-end' : 'flex-start',
      }}
    >
      <Box
        sx={{
          mb: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          flexDirection: isMine ? 'row-reverse' : 'row',
        }}
      >
        <Hostname
          username={message.sender_username}
          avatarSrc={message.sender_avatar}
          mode="normal"
          sx={{ '& .MuiTypography-root': { fontSize: '0.8rem' } }}
        />
        {message.sender_role === 'host' && (
          <span
            className="px-1.5 py-0.5 border border-amber-500 bg-amber-100 text-amber-800 text-[8px] font-bold uppercase tracking-wider"
            style={{
              fontFamily: '"Permanent Marker", cursive',
              transform: 'rotate(-1deg)',
            }}
          >
            Host
          </span>
        )}
      </Box>
      <Box
        sx={{
          ml: isMine ? 0 : 4,
          mr: isMine ? 4 : 0,
          p: '6px 10px',
          bgcolor: isMine ? '#eff6ff' : 'white',
          border: '1.5px solid #333',
          boxShadow: '1.5px 1.5px 0px #333',
          maxWidth: '85%',
          position: 'relative',
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Caveat", cursive',
            fontSize: '1.1rem',
            lineHeight: 1.1,
          }}
        >
          {message.text}
        </Typography>
      </Box>
    </Box>
  );
};

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  mode?: 'group' | 'direct' | 'private';
  eventId?: number;
  conversationId?: number;
  targetUsername?: string;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  title = 'Direct Chat',
  mode = 'group',
  eventId,
  conversationId,
  targetUsername,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isMinimized, setIsMinimized] = useState(false);

  // Hooks for Group Chat
  const { data: groupMessagesResponse } = useHostVendorMessages(
    mode === 'group' && eventId ? eventId : undefined,
  );
  const addGroupMessage = useAddHostVendorMessage();

  // Hooks for Private Chat
  const { data: privateMessagesResponse } = usePrivateMessages(
    mode === 'private' && conversationId ? conversationId : undefined,
  );
  const addPrivateMessage = useAddPrivateMessage();
  const { data: directMessagesResponse } = useDirectMessages(
    mode === 'direct' && targetUsername ? targetUsername : undefined,
  );
  const addDirectMessage = useAddDirectMessage();

  const messages =
    mode === 'group'
      ? groupMessagesResponse?.data
      : mode === 'direct'
        ? directMessagesResponse?.data
        : privateMessagesResponse?.data;
  const isPending =
    mode === 'group'
      ? addGroupMessage.isPending
      : mode === 'direct'
        ? addDirectMessage.isPending
        : addPrivateMessage.isPending;

  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    console.debug('[ChatDrawer] props updated', {
      isOpen,
      isMinimized,
      isMobile,
      mode,
      eventId,
      conversationId,
      targetUsername,
      messageCount: messages?.length ?? 0,
    });
  }, [
    conversationId,
    eventId,
    isMinimized,
    isMobile,
    isOpen,
    messages?.length,
    mode,
    targetUsername,
  ]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [isOpen, isMinimized, messages]);

  const handleAddMessage = () => {
    if (!messageText.trim()) return;

    if (mode === 'group' && eventId) {
      addGroupMessage.mutate(
        { eventId, payload: { text: messageText } },
        { onSuccess: () => setMessageText('') },
      );
    } else if (mode === 'direct' && targetUsername) {
      addDirectMessage.mutate(
        { targetUsername, payload: { text: messageText } },
        { onSuccess: () => setMessageText('') },
      );
    } else if (mode === 'private' && conversationId) {
      addPrivateMessage.mutate(
        { conversationId, payload: { text: messageText } },
        { onSuccess: () => setMessageText('') },
      );
    }
  };

  if (!isOpen) return null;

  const content = (
    <>
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #eee',
          bgcolor: 'white',
          cursor: !isMobile ? 'pointer' : 'default',
        }}
        onClick={() => !isMobile && setIsMinimized(!isMinimized)}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '1rem',
            fontFamily: '"Permanent Marker", cursive',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '180px',
          }}
        >
          {title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {!isMobile && (
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              size="small"
            >
              {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
            </IconButton>
          )}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            size="small"
          >
            <X size={18} />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ p: 1, fontSize: '0.75rem', color: '#666', textAlign: 'center' }}>
        {isMobile ? '(Mobile)' : '(Web)'}
        {isMinimized ? ' (Minimized)' : '(Maximized)'}
        {isOpen ? '(Open)' : '(Closed)'}
      </Box>
      {!isMinimized && (
        <>
          {mode === 'direct' && eventId && targetUsername ? (
            <Box sx={{ p: 1.5, borderBottom: '1px solid #eee', bgcolor: '#fffdf6' }}>
              <BuddyRequestPanel
                eventId={eventId}
                targetUsername={targetUsername}
                compact
              />
            </Box>
          ) : null}

          {/* Messages List */}
          <Box
            ref={scrollRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#fafafa',
            }}
            className="no-scrollbar"
          >
            {messages?.length === 0 ? (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.5,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Caveat", cursive',
                    fontSize: '1.2rem',
                    textAlign: 'center',
                  }}
                >
                  {mode === 'direct' ? 'Say hii' : 'No messages yet...'}
                </Typography>
              </Box>
            ) : (
              messages?.map((message: any) => (
                <MessageItem key={message.id} message={message} />
              ))
            )}
          </Box>

          {/* Input Area */}
          <Box sx={{ p: 1.5, borderTop: '1px solid #eee', bgcolor: 'white' }}>
            <Paper
              sx={{
                p: '2px 10px',
                display: 'flex',
                alignItems: 'center',
                bgcolor: '#f9f9f9',
                borderRadius: '20px',
                border: '1.5px solid #ddd',
                boxShadow: 'none',
              }}
            >
              <InputBase
                sx={{
                  ml: 1,
                  flex: 1,
                  fontFamily: '"Caveat", cursive',
                  fontSize: '1rem',
                }}
                placeholder="Type..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMessage()}
              />
              <IconButton
                sx={{ p: 1, color: '#333' }}
                onClick={handleAddMessage}
                disabled={!messageText.trim() || isPending}
              >
                <Send size={16} />
              </IconButton>
            </Paper>
          </Box>
        </>
      )}
    </>
  );

  if (isMobile) {
    return (
      <Box
        sx={{
          position: 'fixed',
          m: 4,
          width: '90%',
          height: '90%',
          bgcolor: 'white',
          border: '2px solid #ca4242ff',
          boxShadow: '4px 4px 0px #d01a1aff',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100000,
          transition: 'height 0.3s ease',
        }}
        PaperProps={{
          sx: {
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100000,
          },
        }}
      >
        {content}
      </Box>
    );
  }

  // Web Floating Window
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: 350,
        height: isMinimized ? 'auto' : '500px',
        maxHeight: '80vh',
        bgcolor: 'white',
        border: '2px solid #333',
        boxShadow: '4px 4px 0px #333',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100000,
        transition: 'height 0.3s ease',
      }}
    >
      {content}
    </Box>
  );
};
