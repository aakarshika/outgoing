import { Box, Typography } from '@mui/material';
import { AttendeePopover, type Attendee } from '@/components/ui/AttendeePopover';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface NormalGoersModuleProps {
  event: any;
  isEventOver: boolean;
}

export function NormalGoersModule({ event, isEventOver }: NormalGoersModuleProps) {
  const attendees = event.attendees || [];
  const attendeesCount = event.attendees_count || attendees.length;
  const buddies = event.buddyGoing || [];

  if (attendeesCount === 0) return null;

  const displayAttendees = attendees.slice(0, 5);

  return (
    <Box sx={{ px: 2, pt: 2 }}>
      <Typography
        sx={{
          fontFamily: '"Syne", sans-serif',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-text-primary, #111)',
          mb: 1.25,
          letterSpacing: '0.01em',
        }}
      >
        {isEventOver ? 'Who went' : `Who's going`}
      </Typography>

      {/* Avatar cluster with popover */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.25 }}>
        <Box sx={{ display: 'flex' }}>
          {displayAttendees.map((attendee: any, idx: number) => (
            <AttendeePopover
              key={idx}
              attendee={{
                username: attendee.username,
                name: attendee.name,
                avatar: attendee.avatar,
                is_verified: attendee.is_verified,
                bio: attendee.bio,
              } as Attendee}
              variant="normal"
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ml: idx > 0 ? -0.5 : 0,
                  border: '2px solid var(--color-background-primary, #fff)',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, z-index 0s',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    zIndex: 10,
                  },
                }}
              >
                <UserAvatar
                  src={attendee.avatar}
                  username={attendee.username}
                  size="xs"
                />
              </Box>
            </AttendeePopover>
          ))}
          {attendeesCount > 5 && (
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 500,
                color: '#6b7280',
                ml: -0.5,
                border: '2px solid var(--color-background-primary, #fff)',
              }}
            >
              +{attendeesCount - 5}
            </Box>
          )}
        </Box>
        <Typography sx={{ fontSize: 13, color: 'var(--color-text-secondary, #6b7280)' }}>
          {attendeesCount} people {isEventOver ? 'went' : 'going'}
        </Typography>
      </Box>

      {/* Buddy section */}
      {buddies.length > 0 && !isEventOver && (
        <Box sx={{ bgcolor: '#EEEDFE', borderRadius: 'var(--border-radius-md, 8px)', p: 1, display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <span style={{ fontSize: 16 }}>👥</span>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 12, color: '#26215C', lineHeight: 1.4 }}>
              <b>{buddies.slice(0, 2).map((b: any) => b.name).join(', ')}</b>
              {buddies.length > 2 && ` and ${buddies.length - 2} other`} buddy{buddies.length > 2 ? 's' : ''} are going to this
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 500,
              color: '#534AB7',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Join them →
          </Typography>
        </Box>
      )}
    </Box>
  );
}
