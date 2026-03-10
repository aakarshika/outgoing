import { Box, IconButton, InputBase, Paper, Typography } from '@mui/material';
import { Send } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { Hostname } from '@/components/ui/Hostname';
import { useAuth } from '@/features/auth/hooks';
import {
  useAddHostVendorMessage,
  useHostVendorMessages,
} from '@/features/events/hooks';

// --- Message Item Component ---
const MessageItem = ({ message }: { message: any }) => {
  const { user } = useAuth();
  const isMine = user?.username === message.sender_username;

  return (
    <Box
      sx={{
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMine ? 'flex-end' : 'flex-start',
      }}
    >
      <Box
        sx={{
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexDirection: isMine ? 'row-reverse' : 'row',
        }}
      >
        <Hostname
          username={message.sender_username}
          avatarSrc={message.sender_avatar}
          mode={message.sender_role === 'host' ? 'bigger' : 'normal'}
        />
        {message.sender_role === 'host' && (
          <span
            className="px-2 py-0.5 border border-amber-500 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider"
            style={{
              fontFamily: '"Permanent Marker", cursive',
              transform: 'rotate(-2deg)',
            }}
          >
            Host
          </span>
        )}
      </Box>
      <Box
        sx={{
          ml: isMine ? 0 : 4.5,
          mr: isMine ? 4.5 : 0,
          p: '8px 12px',
          bgcolor: isMine ? '#dbeafe' : 'white', // light blue for mine, white for others
          border: '2px solid #333',
          shadow: '2px 2px 0px #333',
          maxWidth: '85%',
          position: 'relative',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontFamily: '"Caveat", cursive',
            fontSize: '1.2rem',
            lineHeight: 1.2,
          }}
        >
          {message.text}
        </Typography>
      </Box>
    </Box>
  );
};

interface ChatUser {
  id: number | string;
  username: string;
  avatar?: string;
  role: 'host' | 'vendor' | string;
}

interface HostVendorGroupChatProps {
  eventId: number;
  title?: string;
  authorizedUsers?: ChatUser[];
  maxHeight?: string | number;
}

export const HostVendorGroupChat: React.FC<HostVendorGroupChatProps> = ({
  eventId,
  title = 'Organizers Group Chat',
  authorizedUsers = [],
  maxHeight = 400,
}) => {
  const { data: messagesResponse } = useHostVendorMessages(eventId);
  const addMessage = useAddHostVendorMessage();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesResponse?.data]);

  const handleAddMessage = () => {
    if (!messageText.trim() || !eventId) return;
    addMessage.mutate(
      {
        eventId: eventId,
        payload: { text: messageText },
      },
      {
        onSuccess: () => {
          setMessageText('');
        },
      },
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div className="absolute top-0 right-4 h-6 w-12 bg-amber-300/40 -translate-y-2 rotate-[-5deg] z-10" />

      {/* Header */}
      <Box sx={{ bgcolor: 'white' }}>
        <h3
          className="text-xl font-bold text-gray-900"
          style={{ fontFamily: '"Permanent Marker", cursive' }}
        >
          {title}
          <span
            className="text-gray-500 ml-2 text-sm leading-tight"
            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
          >
            Coordinate details together in real-time
          </span>
        </h3>
      </Box>
      {/* Hosrixontal scrollable list of vendors */}
      {authorizedUsers.length > 0 && (
        <Box sx={{ p: 2, bgcolor: 'white' }}>
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
            {authorizedUsers.map((chatUser) => (
              <div
                key={chatUser.username}
                className="flex flex-col items-center flex-shrink-0"
              >
                <div className="flex flex-row">
                  <div
                    className="justify-center items-center w-2 h-2 bg-red-500 rounded-full"
                    style={{
                      backgroundColor: chatUser.role === 'host' ? 'blue' : 'green',
                    }}
                  ></div>
                  _{chatUser.username}
                </div>
              </div>
            ))}
          </div>
        </Box>
      )}

      {/* Messages List */}
      <Box
        sx={{
          borderTop: '2px dashed #ccc',
          flex: 1,
          overflowY: 'auto',
          backgroundImage: 'linear-gradient(transparent 95%, #e5e7eb 100%)',
          backgroundSize: '100% 32px',
          maxHeight: maxHeight,
        }}
        className="no-scrollbar"
      >
        {messagesResponse?.data?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-70">
            <Typography
              sx={{
                fontFamily: '"Caveat", cursive',
                fontSize: '1.5rem',
                textAlign: 'center',
              }}
            >
              No messages yet... <br /> start the conversation!
            </Typography>
          </div>
        ) : (
          messagesResponse?.data?.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          p: 2,
          borderTop: '2px solid #333',
          bgcolor: 'white',
        }}
      >
        <Paper
          sx={{
            p: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'white',
            borderRadius: 0,
            border: '2px solid #333',
            shadow: '2px 2px 0px #333',
          }}
        >
          <InputBase
            sx={{
              ml: 1,
              flex: 1,
              fontFamily: '"Caveat", cursive',
              fontSize: '1.2rem',
            }}
            autoFocus={false}
            placeholder="Write a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddMessage()}
          />
          <IconButton
            sx={{ p: 1, color: '#333' }}
            onClick={() => handleAddMessage()}
            disabled={!messageText.trim() || addMessage.isPending}
          >
            <Send size={20} />
          </IconButton>
        </Paper>
      </Box>
    </Box>
  );
};
