import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputBase,
  Paper,
  Typography,
} from '@mui/material';
import { MessageSquare, Send, UserPlus } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { Hostname } from '@/components/ui/Hostname';
import { useAuth } from '@/features/auth/hooks';
import {
  useAddHostVendorMessage,
  useHostVendorMessages,
} from '@/features/events/hooks';
import { useChatDrawer } from '@/features/events/ChatDrawerContext';
import { BuddyRequestPanel } from './BuddyRequestPanel';

interface InkNotebookChatProps {
  eventId: number;
  eventHostUsername: string;
  participatingVendors?: any[];
  canAccessChat?: boolean;
}

export const InkNotebookChat: React.FC<InkNotebookChatProps> = ({
  eventId,
  eventHostUsername,
  participatingVendors = [],
  canAccessChat = false,
}) => {
  const { user } = useAuth();
  const { data: messagesResponse } = useHostVendorMessages(eventId, canAccessChat);
  const addMessage = useAddHostVendorMessage();
  const [messageText, setMessageText] = useState('');
  const [friendTargetUsername, setFriendTargetUsername] = useState<string | null>(null);
  const { openChat } = useChatDrawer();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesResponse?.data]);

  if (!user || !canAccessChat) {
    return null;
  }

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

  const handlePrivateChatClick = (targetUsername: string) => {
    if (!user || user.username === targetUsername) return;

    console.debug('[InkNotebookChat] chat icon clicked', {
      eventId,
      currentUsername: user.username,
      targetUsername,
    });

    openChat({
      title: `Chat with ${targetUsername}`,
      mode: 'direct',
      eventId,
      targetUsername,
    });
  };

  const handleOpenFriendDialog = (targetUsername: string) => {
    if (!user || user.username === targetUsername) return;
    setFriendTargetUsername(targetUsername);
  };

  const handleCloseFriendDialog = () => {
    setFriendTargetUsername(null);
  };

  const getRoleInfo = (username: string) => {
    if (username === eventHostUsername) {
      return { label: 'Host', color: '#d97706' }; // Amber
    }
    const isVendor = participatingVendors.some(
      (v) => v.username === username || v.vendor_username === username,
    );
    if (isVendor) {
      return { label: 'Vendor', color: '#059669' }; // Emerald
    }
    return { label: 'Goer', color: '#4f46e5' }; // Indigo
  };

  return (
    <Box
      sx={{
        mt: 6,
        mb: 8,
        position: 'relative',
        width: '100%',
        maxWidth: '800px',
        mx: 'auto',
      }}
    >
      {/* Notebook Page Background */}
      <Paper
        elevation={3}
        sx={{
          position: 'relative',
          minHeight: '500px',
          backgroundColor: '#fffcf2',
          backgroundImage: `
            linear-gradient(#f1f1f1 0.1em, transparent 0.1em),
            linear-gradient(90deg, #f1f1f1 0.1em, transparent 0.1em)
          `,
          backgroundSize: '30px 30px',
          p: 4,
          pt: 8,
          borderRadius: '2px',
          boxShadow: '10px 10px 0px rgba(0,0,0,0.1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: '40px',
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: '#ffadad',
            zIndex: 1,
          },
        }}
      >
        {/* Notebook Header */}
        <Box sx={{ mb: 4, position: 'relative', zIndex: 2 }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Permanent Marker", cursive',
              color: '#334155',
              transform: 'rotate(-1deg)',
              display: 'inline-block',
              borderBottom: '4px solid #334155',
              pb: 1,
            }}
          >
            Event Notebook Chat
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Caveat", cursive',
              fontSize: '1.4rem',
              color: '#64748b',
              mt: 1,
            }}
          >
            A place for everyone to share thoughts...
          </Typography>
        </Box>

        {/* Messages List */}
        <Box
          ref={scrollRef}
          sx={{
            height: '400px',
            overflowY: 'auto',
            pr: 2,
            mb: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            position: 'relative',
            zIndex: 2,
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: '#cbd5e1',
              borderRadius: '4px',
            },
          }}
        >
          {messagesResponse?.data?.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, opacity: 0.5 }}>
              <Typography sx={{ fontFamily: '"Caveat", cursive', fontSize: '1.8rem' }}>
                The pages are empty... write something!
              </Typography>
            </Box>
          ) : (
            messagesResponse?.data?.map((msg: any) => {
              const role = getRoleInfo(msg.sender_username);
              const isMine = user?.username === msg.sender_username;
              return (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                    maxWidth: '90%',
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 0.5,
                      flexDirection: isMine ? 'row-reverse' : 'row',
                    }}
                  >
                    <Hostname
                      username={msg.sender_username}
                      avatarSrc={msg.sender_avatar}
                      mode="normal"
                    />
                    {!isMine && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handlePrivateChatClick(msg.sender_username)}
                          sx={{
                            p: 0.5,
                            color: role.color,
                            bgcolor: `${role.color}10`,
                            '&:hover': { bgcolor: `${role.color}25` },
                          }}
                        >
                          <MessageSquare size={14} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenFriendDialog(msg.sender_username)}
                          sx={{
                            p: 0.5,
                            color: '#b45309',
                            bgcolor: '#fef3c7',
                            '&:hover': { bgcolor: '#fde68a' },
                          }}
                        >
                          <UserPlus size={14} />
                        </IconButton>
                      </>
                    )}
                    <Typography
                      sx={{
                        fontFamily: '"Permanent Marker", cursive',
                        fontSize: '0.7rem',
                        color: role.color,
                        bgcolor: `${role.color}15`,
                        px: 1,
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {role.label}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: '"Caveat", cursive',
                      fontSize: '1.5rem',
                      color: role.color,
                      lineHeight: 1.1,
                      textAlign: isMine ? 'right' : 'left',
                      filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.1))',
                      position: 'relative',
                      whiteSpace: 'pre-wrap',
                      '&::after': isMine
                        ? {
                            content: '""',
                            position: 'absolute',
                            bottom: -4,
                            right: 0,
                            width: '40%',
                            height: '2px',
                            background: `${role.color}40`,
                            borderRadius: '100%',
                          }
                        : {},
                    }}
                  >
                    {msg.text}
                  </Typography>
                </Box>
              );
            })
          )}
        </Box>

        {/* Input Area */}
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'transparent',
              border: '2px solid #334155',
              borderRadius: '8px',
              boxShadow: '4px 4px 0px #334155',
            }}
          >
            <InputBase
              sx={{
                ml: 1,
                flex: 1,
                fontFamily: '"Caveat", cursive',
                fontSize: '1.4rem',
                color: '#334155',
              }}
              placeholder="Write in the notebook..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddMessage();
                }
              }}
              multiline
              maxRows={3}
            />
            <IconButton
              sx={{ p: '10px', color: '#334155' }}
              onClick={handleAddMessage}
              disabled={!messageText.trim() || addMessage.isPending}
            >
              <Send size={24} />
            </IconButton>
          </Paper>
        </Box>

        {/* Decorative Tape */}
        <Box
          sx={{
            position: 'absolute',
            top: '20px',
            right: '-10px',
            width: '100px',
            height: '35px',
            backgroundColor: 'rgba(255, 230, 0, 0.4)',
            transform: 'rotate(15deg)',
            zIndex: 3,
            boxShadow: '2px 2px 5px rgba(0,0,0,0.05)',
            borderLeft: '1px dashed rgba(0,0,0,0.1)',
            borderRight: '1px dashed rgba(0,0,0,0.1)',
          }}
        />
      </Paper>
      <Dialog
        open={!!friendTargetUsername}
        onClose={handleCloseFriendDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontFamily: '"Permanent Marker", cursive',
            color: '#334155',
          }}
        >
          Ask to be your buddy
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          {friendTargetUsername ? (
            <BuddyRequestPanel
              eventId={eventId}
              targetUsername={friendTargetUsername}
              onClose={handleCloseFriendDialog}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
};
