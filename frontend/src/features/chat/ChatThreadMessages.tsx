import { Box, CircularProgress, Typography } from '@mui/material';
import type { RefObject } from 'react';
import { Link } from 'react-router-dom';

import type { ChatMessageDto } from '@/features/chat/api';
import type { DrawerTimelineRun } from '@/features/chat/groupTimelineForDrawer';
import { FriendAvatar } from '@/features/events/FriendAvatar';

/** Inner photo size; rings add `2 * ringWidth` (total footprint matches spacer below). */
const THREAD_AVATAR_SIZE = 22;
const THREAD_AVATAR_RING = 3;
const THREAD_AVATAR_OUTER = THREAD_AVATAR_SIZE + THREAD_AVATAR_RING * 2;

export type ChatThreadMessagesProps = {
  runs: DrawerTimelineRun[];
  userId: number | undefined;
  messagesLoading: boolean;
  messagesContainerRef: RefObject<HTMLDivElement | null>;
  /** Minimum height of the scroll area (px). */
  minHeight?: number;
};

export function ChatThreadMessages({
  runs,
  userId,
  messagesLoading,
  messagesContainerRef,
  minHeight = 200,
}: ChatThreadMessagesProps) {
  return (
    <Box
      ref={messagesContainerRef}
      sx={{
        flex: 1,
        overflowY: 'auto',
        minHeight,
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
      {messagesLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={20} sx={{ color: '#15803d' }} />
        </Box>
      ) : runs.length === 0 ? (
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
        runs.map((run, runIdx) => {
          if (run.kind === 'activity') {
            return (
              <Box
                key={`a-${run.item.id}`}
                sx={{
                  alignSelf: 'center',
                  maxWidth: '90%',
                  px: 1.5,
                  py: 0.75,
                  borderRadius: '999px',
                  bgcolor: 'rgba(15, 23, 42, 0.05)',
                  textAlign: 'center',
                }}
              >
                <Typography sx={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {run.item.label}
                </Typography>
                {run.item.eventId ? (
                  <Typography
                    component={Link}
                    to={`/events-new/${run.item.eventId}`}
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#15803d',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    View event
                  </Typography>
                ) : null}
              </Box>
            );
          }

          const isMine = userId != null && String(run.sender_id) === String(userId);
          const senderName = run.sender_username || 'Unknown';

          const prevRun = runIdx > 0 ? runs[runIdx - 1] : null;
          const hideSenderMeta =
            prevRun?.kind === 'group' && prevRun.sender_id === run.sender_id;

          return (
            <Box
              key={`g-${runIdx}-${run.sender_id}-${run.messages[0]?.id ?? ''}`}
              sx={{
                display: 'flex',
                gap: 1,
                mt: hideSenderMeta ? 0.125 : 0.5,
                alignSelf: isMine ? 'flex-end' : 'flex-start',
                flexDirection: isMine ? 'row-reverse' : 'row',
              }}
            >
              {hideSenderMeta ? (
                <Box
                  aria-hidden
                  sx={{
                    width: THREAD_AVATAR_OUTER,
                    flexShrink: 0,
                    alignSelf: 'flex-end',
                  }}
                />
              ) : (
                <FriendAvatar
                  userId={run.sender_id}
                  size={THREAD_AVATAR_SIZE}
                  ringWidth={THREAD_AVATAR_RING}
                  imageUrl={run.sender_avatar}
                  sx={{ alignSelf: 'flex-end' }}
                />
              )}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.25,
                  maxWidth: '80%',
                  alignItems: isMine ? 'flex-end' : 'flex-start',
                }}
              >
                {!hideSenderMeta ? (
                  <Typography
                    sx={{
                      fontSize: 10,
                      color: 'var(--color-text-secondary, #6b7280)',
                      px: 0.5,
                      textAlign: isMine ? 'right' : 'left',
                    }}
                  >
                    {senderName}
                  </Typography>
                ) : null}
                {run.messages.map((msg: ChatMessageDto, msgIdx: number) => {
                  const n = run.messages.length;
                  const isLastInRun = msgIdx === n - 1;
                  const stackFirst = msgIdx === 0 && !hideSenderMeta;
                  const stackLast = isLastInRun;
                  const stackSolo = n === 1 && stackFirst;

                  let borderRadius = '14px';
                  if (isMine) {
                    if (stackSolo) borderRadius = '14px 14px 3px 14px';
                    else if (stackFirst && !stackLast)
                      borderRadius = '14px 14px 3px 14px';
                    else if (!stackFirst && stackLast)
                      borderRadius = '14px 3px 14px 14px';
                    else if (!stackFirst && !stackLast)
                      borderRadius = '14px 3px 3px 14px';
                    else borderRadius = '14px 3px 14px 14px';
                  } else {
                    if (stackSolo) borderRadius = '14px 14px 14px 3px';
                    else if (stackFirst && !stackLast)
                      borderRadius = '14px 14px 14px 3px';
                    else if (!stackFirst && stackLast)
                      borderRadius = '3px 14px 14px 14px';
                    else if (!stackFirst && !stackLast)
                      borderRadius = '3px 14px 14px 3px';
                    else borderRadius = '3px 14px 14px 14px';
                  }

                  return (
                    <Box
                      key={msg.id ?? msgIdx}
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        flexDirection: isMine ? 'row-reverse' : 'row',
                        '&:hover .msg-time': { opacity: 1 },
                      }}
                    >
                      <Box
                        sx={{
                          p: '7px 11px',
                          fontSize: 13,
                          color: 'var(--color-text-primary, #111)',
                          bgcolor: isMine
                            ? 'rgba(21, 128, 61, 0.12)'
                            : 'var(--color-background-secondary, #f3f4f6)',
                          borderRadius,
                          lineHeight: 1.4,
                        }}
                      >
                        {msg.body}
                      </Box>
                      <Typography
                        className="msg-time"
                        sx={{
                          fontSize: 9,
                          color: 'var(--color-text-tertiary, #9ca3af)',
                          opacity: 0,
                          transition: 'opacity 0.12s',
                          flexShrink: 0,
                        }}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          );
        })
      )}
    </Box>
  );
}
