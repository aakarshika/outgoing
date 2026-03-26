import { Box, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { FriendAvatarPopover } from '@/features/events/FriendAvatarPopover';
import { FriendAvatar } from '@/features/events/FriendAvatar';

interface HostnameProps {
  userId?: number;
  username: string;
  avatarSrc?: string;
  datetime?: string;
  mode?: 'simple' | 'normal' | 'bigger';
  className?: string;
  sx?: any;
}

export const Hostname = ({
  userId,
  username,
  avatarSrc,
  datetime,
  mode = 'normal',
  className,
  sx,
}: HostnameProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (!userId) return;
    event.stopPropagation();
    if (anchorEl) {
      handleClose();
      return;
    }
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isOpen = Boolean(anchorEl);

  return (
    <>
      <Box
        onClick={handleOpen}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          cursor: userId ? 'pointer' : 'default',
          borderRadius: 1,
          ...(userId
            ? {
                '&:hover': {
                  opacity: 0.8,
                },
              }
            : {}),
          ...sx,
        }}
        className={className}
      >
        {mode === 'simple' && (
          <Typography
            sx={{
              fontSize: 'inherit',
              color: 'inherit',
            }}
          >
            @{username}
          </Typography>
        )}

        {mode === 'normal' && (
          <Stack direction="row" spacing={1} alignItems="center">
            {userId && (
              <FriendAvatar
                userId={userId}
                size={24}
                ringWidth={2}
                sx={{
                  pointerEvents: 'none',
                }}
              />
            )}
            <Box>
              <Typography
                sx={{
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  lineHeight: 1,
                }}
              >
                @{username}
              </Typography>
              {datetime && (
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: '"Caveat", cursive',
                    fontSize: '0.8rem',
                    color: 'text.secondary',
                    display: 'block',
                  }}
                >
                  {datetime}
                </Typography>
              )}
            </Box>
          </Stack>
        )}

        <FriendAvatarPopover
          userId={userId ?? 0}
          open={isOpen}
          anchorEl={anchorEl}
          onClose={handleClose}
        />
      </Box>

    </>
  );
};
