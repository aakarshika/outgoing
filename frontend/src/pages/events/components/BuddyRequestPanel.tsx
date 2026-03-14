import { Box, Button, TextField, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/hooks';
import {
  useFriendRequestStatus,
  useSendFriendRequest,
  useUpdateFriendRequest,
} from '@/features/events/hooks';

interface BuddyRequestPanelProps {
  eventId: number;
  targetUsername: string;
  onClose?: () => void;
  compact?: boolean;
}

const defaultMessages = [
  'Hi, person who was sitting next to me!',
  'Hey, I enjoyed our chat at the event!',
  'I think we have a lot in common.',
];

export const BuddyRequestPanel: React.FC<BuddyRequestPanelProps> = ({
  eventId,
  targetUsername,
  onClose,
  compact = false,
}) => {
  const { user } = useAuth();
  const [requestMessage, setRequestMessage] = useState('');
  const { data: friendshipStatusResponse, isLoading: isFriendshipStatusLoading } =
    useFriendRequestStatus(eventId, targetUsername);
  const sendFriendRequest = useSendFriendRequest();
  const updateFriendRequest = useUpdateFriendRequest();

  const friendship = friendshipStatusResponse?.data;
  const isIncomingPending =
    friendship?.status === 'pending' &&
    friendship?.request_sender_username &&
    friendship.request_sender_username !== user?.username;
  const isOutgoingPending =
    friendship?.status === 'pending' &&
    friendship?.request_sender_username === user?.username;
  const isAlreadyBuddies = friendship?.status === 'accepted';

  useEffect(() => {
    if (friendship?.status === 'pending' || friendship?.status === 'accepted') {
      setRequestMessage(friendship.request_message || '');
      return;
    }

    setRequestMessage(defaultMessages[Math.floor(Math.random() * defaultMessages.length)]);
  }, [friendship?.request_message, friendship?.status, targetUsername]);

  const handleSend = () => {
    sendFriendRequest.mutate(
      {
        eventId,
        targetUsername,
        payload: {
          request_message: requestMessage.trim(),
        },
      },
      {
        onSuccess: (response) => {
          toast.success(response.message || 'Buddy request sent');
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Failed to send buddy request');
        },
      },
    );
  };

  const handleAction = (action: 'accept' | 'withdraw') => {
    updateFriendRequest.mutate(
      {
        eventId,
        targetUsername,
        payload: { action },
      },
      {
        onSuccess: (response) => {
          toast.success(response.message);
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Failed to update buddy request');
        },
      },
    );
  };

  const actionInFlight = sendFriendRequest.isPending || updateFriendRequest.isPending;

  return (
    <Box>
      <Typography sx={{ mb: 2, color: '#64748b', fontSize: compact ? '0.9rem' : '1rem' }}>
        {isFriendshipStatusLoading
          ? 'Checking buddy status...'
          : isIncomingPending
            ? `${targetUsername} already sent you a buddy request.`
            : isOutgoingPending
              ? `Your buddy request to ${targetUsername} is still pending.`
              : isAlreadyBuddies
                ? `You and ${targetUsername} are already buddies.`
                : `Send a note to ${targetUsername}.`}
      </Typography>

      {isIncomingPending || isOutgoingPending || isAlreadyBuddies ? (
        <Box
          sx={{
            border: '1px solid #e2e8f0',
            borderRadius: 2,
            bgcolor: '#f8fafc',
            p: compact ? 1.5 : 2,
            mb: 2,
          }}
        >
          <Typography sx={{ color: '#334155', whiteSpace: 'pre-wrap' }}>
            {friendship?.request_message || 'No message was included.'}
          </Typography>
        </Box>
      ) : (
        <TextField
          multiline
          minRows={compact ? 3 : 4}
          fullWidth
          value={requestMessage}
          onChange={(e) => setRequestMessage(e.target.value)}
          placeholder="Write a short buddy request..."
          inputProps={{ maxLength: 500 }}
          sx={{ mb: 2 }}
        />
      )}

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {onClose ? (
          <Button onClick={onClose} disabled={actionInFlight}>
            Close
          </Button>
        ) : null}
        {isIncomingPending ? (
          <Button
            variant="contained"
            onClick={() => handleAction('accept')}
            disabled={actionInFlight || isFriendshipStatusLoading}
          >
            Accept request
          </Button>
        ) : isOutgoingPending ? (
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => handleAction('withdraw')}
            disabled={actionInFlight || isFriendshipStatusLoading}
          >
            Withdraw request
          </Button>
        ) : isAlreadyBuddies ? (
          <Button variant="contained" disabled>
            Already buddies
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={actionInFlight || isFriendshipStatusLoading}
          >
            Send buddy request
          </Button>
        )}
      </Box>
    </Box>
  );
};
