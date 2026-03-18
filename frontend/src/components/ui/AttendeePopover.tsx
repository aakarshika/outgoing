import { Box, Popover, Typography } from '@mui/material';
import { BadgeCheck, ExternalLink, MoreHorizontal } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { UserAvatar } from '@/components/ui/UserAvatar';

export interface Attendee {
  username: string;
  name?: string;
  avatar: string | null;
  is_verified: boolean;
  bio?: string;
  headline?: string;
  cover_photo?: string | null;
}

interface AttendeePopoverProps {
  attendee: Attendee;
  children: ReactNode;
  variant?: 'comic' | 'normal';
}

export function AttendeePopover({
  attendee,
  children,
  variant = 'normal',
}: AttendeePopoverProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const displayName = attendee.name || attendee.username;
  const truncatedBio =
    attendee.bio && attendee.bio.length > 100
      ? attendee.bio.slice(0, 100) + '...'
      : attendee.bio;

  if (variant === 'comic') {
    return (
      <>
        <Box onClick={handleClick} sx={{ cursor: 'pointer', display: 'inline-block' }}>
          {children}
        </Box>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          sx={{
            '& .MuiPaper-root': {
              width: 260,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #fff9f0 0%, #fff 50%, #fff9f0 100%)',
              border: '3px solid #1a1a1a',
              borderRadius: '8px',
              boxShadow: '4px 4px 0 #1a1a1a',
              fontFamily: '"Permanent Marker", cursive',
            },
          }}
        >
          <Box sx={{ p: 2.5, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Box sx={{ position: 'relative', transform: 'rotate(2deg)' }}>
                <UserAvatar
                  src={attendee.avatar}
                  username={attendee.username}
                  size="xl"
                  borderGradient
                />
                {attendee.is_verified && (
                  <BadgeCheck
                    className="absolute -top-1 -right-1 text-blue-500 bg-white rounded-full p-0.5 border-2 border-gray-800"
                    size={20}
                  />
                )}
              </Box>
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                mb: 0.5,
                transform: 'rotate(-1deg)',
                fontFamily: '"Permanent Marker", cursive',
                color: '#1a1a1a',
                fontSize: '1.25rem',
              }}
            >
              @{attendee.username}
            </Typography>
            {attendee.name && (
              <Typography
                sx={{
                  mb: 1.5,
                  fontFamily: '"Caveat", cursive',
                  fontSize: '1.1rem',
                  color: '#4b5563',
                }}
              >
                {attendee.name}
              </Typography>
            )}
            {truncatedBio && (
              <Typography
                sx={{
                  mb: 2,
                  fontSize: '0.8rem',
                  fontFamily: '"Caveat", cursive',
                  fontStyle: 'italic',
                  color: '#6b7280',
                }}
              >
                "{truncatedBio}"
              </Typography>
            )}
            <Box
              component="a"
              href={`/profile/${attendee.username}`}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                color: '#ea580c',
                fontWeight: 'bold',
                fontSize: '0.875rem',
                textDecoration: 'none',
                fontFamily: '"Permanent Marker", cursive',
                '&:hover': { color: '#c2410c' },
              }}
            >
              View Profile <ExternalLink size={14} />
            </Box>
          </Box>
          <Box
            sx={{
              bgcolor: '#1a1a1a',
              color: 'white',
              py: 0.5,
              px: 1,
              textAlign: 'center',
              fontFamily: '"Caveat", cursive',
              fontSize: '0.75rem',
            }}
          >
            ★ Soul Identity Verified ★
          </Box>
        </Popover>
      </>
    );
  }

  return (
    <>
      <Box onClick={handleClick} sx={{ cursor: 'pointer', display: 'inline-block' }}>
        {children}
      </Box>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{
          '& .MuiPaper-root': {
            width: 210,
            overflow: 'hidden',
            borderRadius: '20px',
            border: 'none',
            boxShadow:
              '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        }}
      >
        {/* Header Background */}
        <Box
          sx={{
            height: 48,
            background: attendee.cover_photo
              ? `url(${attendee.cover_photo}) center/cover no-repeat`
              : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            position: 'relative',
            px: 1.5,
            pt: 1,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
          }}
        >

          <Box sx={{ color: 'white', opacity: 0.8, cursor: 'pointer' }}>
            <MoreHorizontal size={20} />
          </Box>
        </Box>

        {/* Content Area */}
        <Box sx={{ px: 2, pb: 2, pt: 0, textAlign: 'center', position: 'relative' }}>
          {/* Overlapping Avatar */}
          <Box
            sx={{
              marginTop: '-32px',
              display: 'flex',
              justifyContent: 'center',
              mb: 1,
            }}
          >
            <Box
              sx={{
                p: 0.4,
                bgcolor: 'white',
                borderRadius: '50%',
                boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                display: 'inline-flex',
              }}
            >
              <UserAvatar
                src={attendee.avatar}
                username={attendee.username}
                size="lg"
              />
            </Box>
          </Box>



          {/* User Info */}
          <Box sx={{ mb: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: '#111827',
                  lineHeight: 1.2,
                }}
              >
                {displayName}
              </Typography>
              {attendee.is_verified && (
                <BadgeCheck className="text-blue-500 fill-blue-500/10" size={16} />
              )}
            </Box>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: '#6b7280',
                fontWeight: 600,
                mt: 0.15,
              }}
            >
              @{attendee.username}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', mt: 0.75 }}>
              {attendee.headline ||
                (attendee.bio && attendee.bio.length > 50
                  ? attendee.bio.slice(0, 50) + '...'
                  : attendee.bio) ||
                'Product enthusiast & life explorer'}
            </Typography>
          </Box>

          <Box
            component="a"
            href={`/user/${attendee.username}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              width: '100%',
              py: 1,
              px: 1.5,
              bgcolor: '#f3f4f6',
              borderRadius: '10px',
              color: '#374151',
              fontSize: '0.8rem',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: '#e5e7eb',
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            }}
          >
            View Profile <ExternalLink size={14} />
          </Box>
        </Box>
      </Popover>
    </>
  );
}
