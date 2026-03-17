import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { AttendeePopover, type Attendee } from '@/components/ui/AttendeePopover';
import { UserAvatar } from '@/components/ui/UserAvatar';

const NEED_CATEGORY_ICONS: Record<string, string> = {
  photographer: '📸',
  videographer: '🎥',
  dj: '🎧',
  music: '🎵',
  catering: '🍽️',
  decoration: '🎀',
  sound: '🔊',
  lighting: '💡',
  security: '🔒',
  host: '👤',
  speaker: '🎤',
  default: '🤝',
};

const CATEGORY_BG_COLORS: Record<string, string> = {
  photographer: '#E6F1FB',
  videographer: '#EEEDFE',
  dj: '#FAEEDA',
  music: '#FAECE7',
  catering: '#FEF3C7',
  default: '#F1F5F9',
};

interface NormalServicesModuleProps {
  event: any;
  displayNeeds: any[];
  isAuthenticated: boolean;
  isEventOver: boolean;
}

export function NormalServicesModule({
  event,
  displayNeeds,
  isAuthenticated,
  isEventOver,
}: NormalServicesModuleProps) {
  const navigate = useNavigate();

  const participatingVendors = event.participating_vendors || [];
  const openNeeds =
    displayNeeds?.filter(
      (n: any) => n.status !== 'filled' && n.status !== 'cancelled',
    ) || [];
  const filledNeeds = displayNeeds?.filter((n: any) => n.status === 'filled') || [];

  const getIcon = (title: string) => {
    const key = title?.toLowerCase().slice(0, 12) || 'default';
    return NEED_CATEGORY_ICONS[key] || NEED_CATEGORY_ICONS.default;
  };

  const getBgColor = (title: string) => {
    const key = title?.toLowerCase().slice(0, 12) || 'default';
    return CATEGORY_BG_COLORS[key] || CATEGORY_BG_COLORS.default;
  };

  if (participatingVendors.length === 0 && displayNeeds?.length === 0) {
    return null;
  }

  const renderOpenNeeds = () => (
    <>
      <Box sx={{ mb: 1.5 }}>
        <Typography
          sx={{
            fontFamily: '"Syne", sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--color-text-primary, #111)',
            mb: 0.5,
          }}
        >
          Chip-in opportunities
        </Typography>
        <Typography
          sx={{ fontSize: 12, color: 'var(--color-text-secondary, #6b7280)' }}
        >
          See if they interest you — chip in and get in cheaper.
        </Typography>
      </Box>

      {openNeeds.map((need: any) => (
        <Box
          key={need.id}
          sx={{
            bgcolor: 'var(--color-background-primary, #fff)',
            border: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
            borderLeft: '3px solid #EF9F27',
            borderRadius: 'var(--border-radius-lg, 12px)',
            p: 1.375,
            mb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 'var(--border-radius-md, 8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                flexShrink: 0,
                bgcolor: getBgColor(need.title),
              }}
            >
              {getIcon(need.title)}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: '"Syne", sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--color-text-primary, #111)',
                  lineHeight: 1.25,
                }}
              >
                {need.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: 11,
                  color: 'var(--color-text-secondary, #6b7280)',
                  mt: 0.25,
                  lineHeight: 1.4,
                }}
              >
                {need.description?.slice(0, 60) || 'Help needed'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              {need.budget_max || need.budget_min ? (
                <>
                  <Typography
                    sx={{
                      fontFamily: '"Syne", sans-serif',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#BA7517',
                    }}
                  >
                    {Number(need.budget_max || need.budget_min) === 0
                      ? 'Free in'
                      : `₹${need.budget_max || need.budget_min}`}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 10, color: 'var(--color-text-secondary, #6b7280)' }}
                  >
                    {need.is_reimbursed ? 'reimbursed' : 'budget'}
                  </Typography>
                </>
              ) : (
                <Typography
                  sx={{ fontSize: 10, color: 'var(--color-text-secondary, #6b7280)' }}
                >
                  Comp TBD
                </Typography>
              )}
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mt: 1.125,
              pt: 1,
              borderTop: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: 0.75,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Box
                sx={{
                  fontSize: 10,
                  fontWeight: 500,
                  px: 1,
                  py: 0.25,
                  borderRadius: 999,
                  bgcolor: '#FAEEDA',
                  color: '#854F0B',
                }}
              >
                Open
              </Box>
              {(need.applications?.length || 0) > 0 && (
                <Typography
                  sx={{ fontSize: 11, color: 'var(--color-text-secondary, #6b7280)' }}
                >
                  {need.applications.length} applied
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                fontWeight: 500,
                px: 1.5,
                py: 0.35,
                borderRadius: 999,
                bgcolor: '#D85A30',
                color: '#fff',
                cursor: 'pointer',
                border: 'none',
              }}
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/signin');
                  return;
                }
                navigate(`/events/${event.id}/service-event-management/application`);
              }}
            >
              Apply
            </Box>
          </Box>
        </Box>
      ))}

      {filledNeeds.map((need: any) => {
        const assignedVendor = (need.applications || []).find(
          (app: any) => app.status === 'accepted',
        );
        return (
          <Box
            key={need.id}
            sx={{
              bgcolor: 'var(--color-background-primary, #fff)',
              border: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
              borderLeft: '3px solid #1D9E75',
              borderRadius: 'var(--border-radius-lg, 12px)',
              p: 1.375,
              mb: 1,
              opacity: 0.75,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 'var(--border-radius-md, 8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  flexShrink: 0,
                  bgcolor: '#EAF3DE',
                }}
              >
                {getIcon(need.title)}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontFamily: '"Syne", sans-serif',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #111)',
                  }}
                >
                  {need.title}
                </Typography>
              </Box>
              <Box
                sx={{
                  fontSize: 10,
                  fontWeight: 500,
                  px: 1,
                  py: 0.25,
                  borderRadius: 999,
                  bgcolor: '#EAF3DE',
                  color: '#3B6D11',
                }}
              >
                Filled
              </Box>
            </Box>
            {assignedVendor && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  mt: 1,
                  pt: 1,
                  borderTop: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
                }}
              >
                <AttendeePopover
                  attendee={{
                    username: assignedVendor.username || assignedVendor.vendor_name || 'user',
                    name: assignedVendor.name,
                    avatar: assignedVendor.avatar,
                    is_verified: assignedVendor.is_verified || false,
                    bio: assignedVendor.bio,
                  } as Attendee}
                  variant="normal"
                >
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      bgcolor: '#F0FDF4',
                      border: '1.5px solid #BBF7D0',
                      borderRadius: 'var(--border-radius-full, 999px)',
                      py: 0.75,
                      px: 1.5,
                      ml: -0.5,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                      '&:hover': {
                        bgcolor: '#DCFCE7',
                        borderColor: '#86EFAC',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 11.5,
                        color: '#166534',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        lineHeight: 1,
                      }}
                    >
                      <span role="img" aria-label="sparkles">✨</span>
                      <Box
                        component="span"
                        sx={{
                          fontWeight: 800,
                          color: '#15803D',
                          // color: 'var(--color-primary-main, #D85A30)',
                        }}
                      >
                        {assignedVendor.username || assignedVendor.vendor_name}
                      </Box>
                      <span>chipped in!</span>
                      <span role="img" aria-label="rocket">🚀</span>
                    </Typography>
                  </Box>
                </AttendeePopover>
              </Box>
            )}
          </Box>
        );
      })}
    </>
  );

  const renderAfterEvent = () => (
    <>
      <Box sx={{ mb: 1.5 }}>
        <Typography
          sx={{
            fontFamily: '"Syne", sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--color-text-primary, #111)',
            mb: 0.5,
          }}
        >
          Shoutout to people who made it possible...
        </Typography>
        <Typography
          sx={{ fontSize: 12, color: 'var(--color-text-secondary, #6b7280)' }}
        >
          Without these people, this night wouldn't have happened.
        </Typography>
      </Box>

      {participatingVendors.map((vendor: any) => (
        <Box
          key={vendor.id}
          sx={{
            bgcolor: 'var(--color-background-primary, #fff)',
            border: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
            borderRadius: 'var(--border-radius-lg, 12px)',
            p: 1.375,
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
          }}
        >
          <UserAvatar
            src={vendor.vendor_avatar}
            username={vendor.vendor_name}
            size="sm"
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-text-primary, #111)',
              }}
            >
              {vendor.vendor_name}
            </Typography>
            <Typography
              sx={{
                fontSize: 11,
                color: 'var(--color-text-secondary, #6b7280)',
                mt: 0.125,
              }}
            >
              {vendor.category?.replace('_', ' ') || 'Service'}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 0.5,
              flexShrink: 0,
            }}
          >
            <Box sx={{ fontSize: 12, color: '#EF9F27', letterSpacing: -1 }}>
              {'★'.repeat(5)}
            </Box>
            <Box
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                fontWeight: 500,
                px: 1.25,
                py: 0.25,
                borderRadius: 999,
                border: '0.5px solid var(--color-border-secondary, #e5e7eb)',
                bgcolor: 'transparent',
                color: 'var(--color-text-primary, #111)',
                cursor: 'pointer',
              }}
            >
              Rate →
            </Box>
          </Box>
        </Box>
      ))}
    </>
  );

  return (
    <Box sx={{ px: 2, pt: 2 }}>
      {isEventOver ? renderAfterEvent() : renderOpenNeeds()}
    </Box>
  );
}
