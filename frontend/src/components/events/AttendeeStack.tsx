import { BadgeCheck, User, Share2 } from 'lucide-react';
import { useState } from 'react';
import { Box, Popover, Typography, Divider, Button } from '@mui/material';

import { type Attendee, AttendeePopover } from '@/components/ui/AttendeePopover';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { cn } from '@/lib/utils';

interface AttendeeStackProps {
  attendees: Attendee[];
  isEventOver: boolean;
  className?: string;
  variant?: 'comic' | 'normal';
}

export const AttendeeStack = ({
  attendees,
  isEventOver,
  className,
  variant = 'normal',
}: AttendeeStackProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const openPopover = Boolean(anchorEl);

  if (!attendees || attendees.length === 0) {
    return null;
  }

  const MAX_DISPLAY = 8;
  const displayAttendees = attendees.slice(0, MAX_DISPLAY);
  const remainingCount = attendees.length - MAX_DISPLAY;

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
      // Fallback for browsers that don't support share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const isComic = variant === 'comic';

  return (
    <div
      className={cn(
        'flex flex-col w-full',
        isComic ? 'items-center' : 'items-start',
        className,
      )}
    >
      {/* Section Heading */}
      <div
        className={cn(
          'w-full flex items-center mb-6',
          isComic ? 'justify-center' : 'justify-start',
        )}
      >
        <h3
          className={cn(
            'text-base font-bold text-gray-800 mr-4 whitespace-nowrap',
            isComic ? 'text-xl' : 'text-sm uppercase tracking-wider',
          )}
          style={{ fontFamily: isComic ? '"Inter", sans-serif' : 'inherit' }}
        >
          {isEventOver ? 'Who Went' : "Who's Going"}
        </h3>
        {isComic && <div className="h-[1px] flex-1 bg-gray-200" />}
      </div>

      {/* Main Row Container */}
      <div className="flex items-center w-full">
        {/* Avatar Stack */}
        <div className="flex -space-x-4 items-center shrink-0">
          {displayAttendees.map((attendee, index) => (
            <div
              key={`${attendee.username}-${index}`}
              className="relative cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:z-20 group"
              style={{ zIndex: MAX_DISPLAY - index }}
            >
              <AttendeePopover attendee={attendee} variant="normal">
                <div className="rounded-full border-[3px] border-white shadow-md overflow-hidden bg-white ring-1 ring-black/5 group-hover:ring-black/20 transition-all">
                  <UserAvatar
                    src={attendee.avatar}
                    username={attendee.username}
                    size="lg"
                  />
                </div>
              </AttendeePopover>
            </div>
          ))}

          {/* Counter Bubble */}
          {remainingCount > 0 && (
            <div
              className="relative z-0 cursor-pointer transition-all duration-200 hover:-translate-y-1"
              onClick={handleOpenPopover}
            >
              <div
                className={cn(
                  'rounded-full border-[3px] border-white shadow-md bg-white flex items-center justify-center text-gray-600 font-bold select-none ring-1 ring-black/5',
                  'h-12 w-12 text-sm',
                )}
              >
                +{remainingCount}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Button Below */}
      {!isEventOver && (
        <div
          className={cn(
            'w-full mt-6 flex',
            isComic ? 'justify-center' : 'justify-start',
          )}
        >
          <Button
            onClick={handleShare}
            variant="outlined"
            size="small"
            startIcon={<Share2 size={16} />}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              px: 3,
              borderColor: '#e5e7eb',
              color: '#4b5563',
              fontWeight: 600,
              flexShrink: 0,
              '&:hover': {
                borderColor: '#d1d5db',
                bgcolor: '#f9fafb',
              },
            }}
          >
            Invite Friends
          </Button>
        </div>
      )}

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
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {attendees.map((attendee, idx) => (
              <Box
                key={`${attendee.username}-${idx}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1,
                  borderRadius: '12px',
                  transition: 'background 0.2s',
                  '&:hover': { bgcolor: '#f9fafb' },
                }}
              >
                <UserAvatar
                  src={attendee.avatar}
                  username={attendee.username}
                  size="md"
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: '#111827',
                      noWrap: true,
                    }}
                  >
                    {attendee.name || attendee.username}
                  </Typography>
                  <Typography
                    sx={{ fontSize: '0.8rem', color: '#6b7280', noWrap: true }}
                  >
                    @{attendee.username}
                  </Typography>
                </Box>
                {attendee.is_verified && (
                  <BadgeCheck size={18} className="text-blue-500 shrink-0" />
                )}
                {!attendee.is_verified && (
                  <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                )}
              </Box>
            ))}
          </div>
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
    </div>
  );
};
