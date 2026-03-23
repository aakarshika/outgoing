import { Box, Typography, Popover, Divider, Chip } from '@mui/material';
import { Plus, User, BadgeCheck } from 'lucide-react';
import { useState } from 'react';

import { UserAvatar } from '@/components/ui/UserAvatar';
import { CategoryAvatarBasic } from '@/features/events/CategoryAvatarBasic';
import { CategoryAvatar } from '@/features/events/CategoryAvatar';
import { FriendAvatarPopover } from '@/features/events/FriendAvatarPopover';

interface NormalGoersModuleProps {
  event: any;
  isEventOver: boolean;
}

export function NormalGoersModule({ event, isEventOver }: NormalGoersModuleProps) {
  const attendees = event.attendees || [];
  const attendeesCount = event.attendees_count || attendees.length;

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const openPopover = Boolean(anchorEl);

  if (attendeesCount === 0) return null;

  const MAX_DISPLAY = 8;
  const displayAttendees = attendees.slice(0, MAX_DISPLAY);
  const remainingCount = attendeesCount - MAX_DISPLAY;

  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: document.title,
          url: window.location.href,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const CategoryAvatarWithPopover = ({
    userId,
    children,
  }: {
    userId: number;
    children: React.ReactNode;
  }) => {
    const [avatarAnchorEl, setAvatarAnchorEl] = useState<HTMLElement | null>(null);
    const popoverOpen = Boolean(avatarAnchorEl);
    return (
      <>
        <Box
          component="button"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setAvatarAnchorEl(e.currentTarget);
          }}
          sx={{
            border: 'none',
            p: 0,
            m: 0,
            background: 'transparent',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </Box>
        <FriendAvatarPopover
          userId={userId}
          open={popoverOpen}
          anchorEl={avatarAnchorEl}
          onClose={() => setAvatarAnchorEl(null)}
        />
      </>
    );
  };

  const AttendeeAvatar = ({attendee, idx}: {attendee: any, idx: number}) => {
    console.log('attendee', attendee, '--- attendee avatar ---');
    return (
      <Box
        key={attendee.id || idx}
        sx={{
          ml: idx === 0 ? 0 : -0.75, // -6px roughly
          zIndex: MAX_DISPLAY - idx,
          transition: 'transform 0.15s',
          '&:hover': {
            transform: 'translateY(-3px)',
            zIndex: 20,
          },
        }}
      >
          <CategoryAvatarWithPopover userId={attendee?.user_id}>
            <CategoryAvatarBasic
              userId={attendee?.user_id}
              category={event?.category?.slug}
              size={26}
              sx={{
                ml: -0.5,
              }}
            />
          </CategoryAvatarWithPopover>
      </Box>
    );
  };


  const HostAvatar = () => {
    console.log('event.host', event.host, '--- host avatar ---');
    return (
      <Box
        key={event.host.username}
        sx={{
          ml: 0, // -6px roughly
          zIndex: MAX_DISPLAY + 1,
          transition: 'transform 0.15s',
          '&:hover': {
            transform: 'translateY(-3px)',
            zIndex: 20,
          },
        }}
      >
          <CategoryAvatarWithPopover userId={event.host.id}>
            <CategoryAvatar
              userId={event.host.id}
              category={event.category.slug}
              size={55}
              sx={{
                ml: -0.5,
              }}
            />
          </CategoryAvatarWithPopover>
      </Box>

    );
  };


  const AttendeeStack = ({ attendees }: { attendees: any[] }) => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <>
          {attendees.map((attendee: any, idx: number) => {
            return (
              <AttendeeAvatar key={attendee.id || idx} attendee={attendee} idx={idx} />
            );
          })}
          {remainingCount > 0 && (
            <Box
              onClick={handleOpenPopover}
              sx={{
                ml: -0.75,
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'var(--color-background-secondary, #f9fafb)',
                color: 'var(--color-text-secondary, #6b7280)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 500,
                border: '2px solid var(--color-background-tertiary, #f3f4f6)',
                zIndex: 0,
                cursor: 'pointer',
              }}
            >
              +{remainingCount}
            </Box>
          )}
        </>
      </Box>
    );
  };

  return (
    <Box sx={{ px: 2, pt: 2}}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <HostAvatar />
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{
            fontSize: 13,
            pb: 0.5,
            pl: 0.5,
            color: 'var(--color-text-secondary,rgb(84, 84, 84))',
          }}>

            hosted by
              <Typography
                component="span"
                sx={{ fontWeight: 600 , 
                  fontSize: 13,px: 0.5}}>
                {event.host.name || event.host.username}
              </Typography>
            , 36 going
          </Typography>
          <AttendeeStack attendees={displayAttendees} />

        </Box>
      </Box>


      {/* Detailed Attendees Popover */}
      <Popover
        open={openPopover}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 320,
            maxHeight: 450,
            borderRadius: '24px',
            boxShadow:
              '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <User size={20} /> All Attendees
          </Typography>
          <Box
            className="custom-scrollbar"
            sx={{ spaceY: 2, maxHeight: 300, overflowY: 'auto', pr: 1 }}
          >
            {attendees.map((attendee: any, idx: number) => (
              <Box
                key={`${attendee.username}-${idx}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1,
                  borderRadius: '12px',
                  transition: 'background 0.2s',
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': { bgcolor: '#f9fafb' },
                }}
                component="a"
                href={`/user/${attendee.username}`}
              >
                <UserAvatar
                  src={attendee.avatar}
                  username={attendee.username}
                  size="md"
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    noWrap
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: '#111827',
                    }}
                  >
                    {attendee.name || attendee.username}
                  </Typography>
                  <Typography
                    noWrap
                    sx={{ fontSize: '0.8rem', color: '#6b7280' }}
                  >
                    @{attendee.username}
                  </Typography>
                </Box>
                {attendee.is_verified && (
                  <BadgeCheck size={18} className="text-blue-500 shrink-0" />
                )}
                {!attendee.is_verified && (
                  <Box
                    sx={{
                      h: 2,
                      w: 2,
                      borderRadius: '50%',
                      bgcolor: 'green-500',
                      shrink: 0,
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>
              {attendees.length} people are going
            </Typography>
          </Box>
        </Box>
      </Popover>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </Box>
  );
}
