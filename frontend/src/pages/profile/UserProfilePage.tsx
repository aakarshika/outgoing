import {
  Box,
  Button,
  Chip,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
  Menu,
  MenuItem,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Award,
  Crown,
  Lock,
  MapPin,
  PartyPopper,
  Plus,
  Sparkles,
  Star,
  Tent,
  UserRound,
  Users,
  Wrench,
  MoreHorizontal,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Media } from '@/components/ui/media';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/features/auth/hooks';
import { useSendFriendRequest, useUpdateFriendRequest } from '@/features/events/hooks';
import { ProfileService } from './Profile.service';

type SharedEvent = {
  id: number;
  title: string;
  start_time?: string;
};

type ProfileAccess = {
  is_authenticated_viewer: boolean;
  is_self_profile: boolean;
  has_shared_events: boolean;
  shared_events: SharedEvent[];
  latest_shared_event_id?: number | null;
  friendship_status: 'none' | 'pending' | 'accepted' | 'declined' | 'cancelled';
  incoming_request: boolean;
  outgoing_request: boolean;
  incoming_request_event_id?: number | null;
  can_view_full_profile: boolean;
  met_at_event_title?: string | null;
  cta:
    | 'login_required'
    | 'no_shared_events'
    | 'add_friend'
    | 'request_sent'
    | 'accept_invitation'
    | 'none';
};

type PublicProfile = {
  username: string;
  first_name?: string;
  last_name?: string;
  is_verified?: boolean;
  avatar?: string | null;
  cover_photo?: string | null;
  headline?: string | null;
  showcase_bio?: string | null;
  date_joined: string;
  location_city?: string | null;
  attended_count?: number;
  hosted_count?: number;
  total_reviews?: number;
  badges?: Array<{
    id: number;
    label: string;
    icon: string;
    description?: string;
  }>;
  attended_events?: Array<{
    id: number;
    title: string;
    cover_image?: string | null;
    start_time?: string;
    category?: string;
    event_type?: string;
  }>;
  hosted_events?: Array<{
    id: number;
    title: string;
    cover_image?: string | null;
    start_time?: string;
    category?: string;
    event_type?: string;
  }>;
  services?: Array<{
    id: number;
    title: string;
    portfolio_image?: string | null;
    category?: string;
  }>;
  access?: ProfileAccess;
};

const badgeTones = [
  { bg: '#F2EAE0', fg: '#7A5A43', border: '#E0D3C4' },
  { bg: '#FAEADA', fg: '#8A583D', border: '#E8C7A9' },
  { bg: '#EEF3E9', fg: '#58704A', border: '#D4E1CA' },
  { bg: '#EAF0F7', fg: '#4B6682', border: '#CFDDED' },
];

const getBadgeIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    'party-popper': PartyPopper,
    tent: Tent,
    wrench: Wrench,
    crown: Crown,
    sparkles: Sparkles,
  };
  return icons[iconName] || Award;
};

const getDisplayName = (profile: PublicProfile) => {
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  return fullName || profile.username;
};

const getMemberSince = (dateJoined?: string) => {
  if (!dateJoined) return '';
  const date = new Date(dateJoined);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

const getEventCategory = (event: { category?: string; event_type?: string }) => {
  return event.category || event.event_type || 'Event';
};

const getEventDate = (startTime?: string) => {
  if (!startTime) return 'Upcoming';
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return 'Upcoming';
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const sendFriendRequest = useSendFriendRequest();
  const updateFriendRequest = useUpdateFriendRequest();
  const [isFriendDialogOpen, setIsFriendDialogOpen] = useState(false);
  const [selectedSharedEventId, setSelectedSharedEventId] = useState<number | null>(null);
  const [removeCountdown, setRemoveCountdown] = useState<number | null>(null);
  const [buddyMenuAnchor, setBuddyMenuAnchor] = useState<null | HTMLElement>(null);
  const removeFriendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeFriendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (removeFriendTimeoutRef.current) {
        clearTimeout(removeFriendTimeoutRef.current);
      }
      if (removeFriendIntervalRef.current) {
        clearInterval(removeFriendIntervalRef.current);
      }
    };
  }, []);

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['publicProfile', username],
    queryFn: () => ProfileService.getPublicProfile(username!),
    enabled: !!username,
  });

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#FDF8F3', display: 'grid', placeItems: 'center' }}>
        <Typography sx={{ color: '#7A5A43', fontWeight: 500 }}>Loading profile...</Typography>
      </Box>
    );
  }

  if (error || !response?.data) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#FDF8F3', display: 'grid', placeItems: 'center', px: 3 }}>
        <Typography sx={{ color: '#7A5A43', fontWeight: 500, textAlign: 'center' }}>
          Profile not found.
        </Typography>
      </Box>
    );
  }

  const profile = response.data as PublicProfile;
  const displayName = getDisplayName(profile);
  const attendedEvents = profile.attended_events || [];
  const hostedEvents = profile.hosted_events || [];
  const services = profile.services || [];
  const access = profile.access;

  const sharedEvents = access?.shared_events || [];
  const latestSharedEventId =
    access?.latest_shared_event_id || (sharedEvents.length > 0 ? sharedEvents[0].id : null);
  const incomingRequestEventId =
    access?.incoming_request_event_id || latestSharedEventId;

  const canViewFullProfile = access?.can_view_full_profile ?? false;
  const actionCta = access?.cta || 'none';
  const actionInFlight = sendFriendRequest.isPending || updateFriendRequest.isPending;
  const isActionEnabled =
    (actionCta === 'add_friend' && !actionInFlight) ||
    (actionCta === 'accept_invitation' && !actionInFlight && !!incomingRequestEventId);

  const openFriendDialog = () => {
    setSelectedSharedEventId(latestSharedEventId);
    setIsFriendDialogOpen(true);
  };

  const handleSendFriendRequest = () => {
    if (!username || !selectedSharedEventId) return;

    sendFriendRequest.mutate(
      {
        eventId: selectedSharedEventId,
        targetUsername: username,
        payload: {
          request_message: 'Hey, great running into you at this event. Wanna connect as buddies?',
        },
      },
      {
        onSuccess: (result) => {
          toast.success(result?.data?.message || 'Buddy request sent');
          setIsFriendDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: ['publicProfile', username] });
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Failed to send buddy request');
        },
      },
    );
  };

  const handleAcceptInvitation = () => {
    if (!username || !incomingRequestEventId) return;

    updateFriendRequest.mutate(
      {
        eventId: incomingRequestEventId,
        targetUsername: username,
        payload: { action: 'accept' },
      },
      {
        onSuccess: (result: any) => {
          toast.success(result?.data?.message || 'Invitation accepted');
          queryClient.invalidateQueries({ queryKey: ['publicProfile', username] });
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Failed to accept invitation');
        },
      },
    );
  };

  const clearRemoveFriendTimers = () => {
    if (removeFriendTimeoutRef.current) {
      clearTimeout(removeFriendTimeoutRef.current);
      removeFriendTimeoutRef.current = null;
    }
    if (removeFriendIntervalRef.current) {
      clearInterval(removeFriendIntervalRef.current);
      removeFriendIntervalRef.current = null;
    }
  };

  const handleRemoveFriend = () => {
    if (!username || !latestSharedEventId) return;

    setBuddyMenuAnchor(null);
    clearRemoveFriendTimers();
    setRemoveCountdown(10);

    removeFriendIntervalRef.current = setInterval(() => {
      setRemoveCountdown((current) => {
        if (current === null || current <= 1) {
          if (removeFriendIntervalRef.current) {
            clearInterval(removeFriendIntervalRef.current);
            removeFriendIntervalRef.current = null;
          }
          return null;
        }

        return current - 1;
      });
    }, 1000);

    removeFriendTimeoutRef.current = setTimeout(() => {
      updateFriendRequest.mutate(
        {
          eventId: latestSharedEventId,
          targetUsername: username,
          payload: { action: 'unfriend' },
        },
        {
          onSuccess: () => {
            clearRemoveFriendTimers();
            setRemoveCountdown(null);
            toast.success('Buddy removed');
            queryClient.invalidateQueries({ queryKey: ['publicProfile', username] });
          },
          onError: (err: any) => {
            clearRemoveFriendTimers();
            setRemoveCountdown(null);
            toast.error(err?.response?.data?.message || 'Failed to remove buddy');
          },
        },
      );
    }, 10000);
  };

  const handleUndoRemove = () => {
    clearRemoveFriendTimers();
    setRemoveCountdown(null);
  };

  const isRestricted = !canViewFullProfile;
  const isUnauth = !isAuthenticated || actionCta === 'login_required';
  const memberSince = getMemberSince(profile.date_joined);

  const headerAction = (() => {
    if (actionCta === 'add_friend') {
      return (
        <Button
          startIcon={<Plus size={14} />}
          onClick={openFriendDialog}
          disabled={!isActionEnabled}
          sx={{
            minWidth: { xs: '100%', sm: 'unset' },
            borderRadius: '18px',
            px: 2,
            py: 1,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 12.5,
            background: '#C95E35',
            color: '#FDF8F3',
            boxShadow: '0 8px 20px rgba(201, 94, 53, 0.18)',
            '&:hover': { background: '#B04E28' },
            '&.Mui-disabled': { background: '#D8B9A8', color: '#fff' },
          }}
        >
          Add friend
        </Button>
      );
    }

    if (actionCta === 'request_sent') {
      return (
        <Button
          disabled
          sx={{
            minWidth: { xs: '100%', sm: 'unset' },
            borderRadius: '18px',
            px: 2,
            py: 1,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 12.5,
            background: '#D8B9A8',
            color: '#FDF8F3',
          }}
        >
          Request sent
        </Button>
      );
    }

    if (actionCta === 'accept_invitation') {
      return (
        <Button
          onClick={handleAcceptInvitation}
          disabled={!isActionEnabled}
          sx={{
            minWidth: { xs: '100%', sm: 'unset' },
            borderRadius: '18px',
            px: 2,
            py: 1,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 12.5,
            background: '#C95E35',
            color: '#FDF8F3',
            boxShadow: '0 8px 20px rgba(201, 94, 53, 0.18)',
            '&:hover': { background: '#B04E28' },
            '&.Mui-disabled': { background: '#D8B9A8', color: '#fff' },
          }}
        >
          Accept invitation
        </Button>
      );
    }

    if (access?.friendship_status === 'accepted') {
      if (!access?.met_at_event_title) {
        return (
          <>
            <IconButton
              size="small"
              onClick={(e) => setBuddyMenuAnchor(e.currentTarget)}
              sx={{
                width: 42,
                height: 42,
                color: '#58704A',
                bgcolor: '#EEF3E9',
                border: '1px solid #D9E5D0',
                '&:hover': { bgcolor: '#E4EBDE' },
              }}
            >
              <MoreHorizontal size={18} />
            </IconButton>
            <Menu
              anchorEl={buddyMenuAnchor}
              open={Boolean(buddyMenuAnchor)}
              onClose={() => setBuddyMenuAnchor(null)}
              PaperProps={{
                sx: {
                  borderRadius: '12px',
                  mt: 1,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  minWidth: 160,
                },
              }}
            >
              <MenuItem
                onClick={() => {
                  setBuddyMenuAnchor(null);
                  handleRemoveFriend();
                }}
                sx={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#C95E35',
                  py: 1,
                }}
              >
                Remove friend
              </MenuItem>
            </Menu>
          </>
        );
      }

      return null;
    }

    return null;
  })();

  return (
    <Box sx={{ minHeight: '100vh', 
      background: 'rgba(237, 232, 226, 0.9)',
       pb: 14 }}>
      <Box sx={{ maxWidth: 430, mx: 'auto', position: 'relative' }}>

        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{
              height: 132,
              position: 'relative',
              overflow: 'hidden',
              background: profile.cover_photo
                ? `url(${profile.cover_photo}) center/cover no-repeat`
                : '#C4A882',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(ellipse 70% 80% at 30% 120%, #D4956A 0%, transparent 70%), radial-gradient(ellipse 60% 60% at 80% -10%, #E8C9A0 0%, transparent 65%)',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background:
                  'repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(255,255,255,0.04) 18px, rgba(255,255,255,0.04) 19px)',
              },
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              left: 16,
              bottom: -34,
              width: 68,
              height: 68,
              borderRadius: '50%',
              border: '3px solid #FDF8F3',
              bgcolor: '#F2EAE0',
              overflow: 'hidden',
              zIndex: 5,
            }}
          >
            <UserAvatar src={profile.avatar} username={profile.username} size="md" />
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexWrap: access?.friendship_status === 'accepted' && access?.met_at_event_title ? 'nowrap' : 'wrap',
            alignItems: 'stretch',
            px: 2,
            pt: 5,
            pb: 1.8,
            gap: 1.25,
          }}
        >
          <Box
            sx={{
              minWidth: 0,
              flex:
                access?.friendship_status === 'accepted' && access?.met_at_event_title
                  ? '1 1 0'
                  : { xs: '1 1 100%', sm: '1 1 150px' },
              display: 'flex',
              flexDirection: 'column',
              gap: 0.45,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: 'Fraunces, "Times New Roman", serif',
                  fontSize: 21,
                  fontWeight: 600,
                  color: '#2E1F14',
                  lineHeight: 1.2,
                  overflowWrap: 'anywhere',
                }}
              >
                {displayName}
              </Typography>
              {profile.is_verified && <Star size={14} color="#C95E35" fill="#F9D6C2" />}
            </Box>
            <Typography sx={{ fontSize: 13, color: '#8F7868', fontWeight: 500, overflowWrap: 'anywhere' }}>
              @{profile.username}
            </Typography>
            {memberSince && (
              <Typography sx={{ fontSize: 11.5, color: '#B39D8D', letterSpacing: '0.01em' }}>
                Member since {memberSince}
              </Typography>
            )}
          </Box>

          {!!access?.met_at_event_title && (
            <Box
              sx={{
                flex:
                  access?.friendship_status === 'accepted'
                    ? { xs: '0 0 156px', sm: '0 0 178px' }
                    : { xs: '1 1 100%', sm: '1 1 170px' },
                minWidth: 0,
                alignSelf: 'stretch',
                borderRadius: '16px',
                px: 1.25,
                py: 1,
                background: 'linear-gradient(180deg, #F4F8EF 0%, #EEF3E9 100%)',
                border: '1px solid #D9E5D0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 0.45,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 0.75 }}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: '#7A8D67',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      lineHeight: 1.2,
                    }}
                  >
                    Shared event
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.35,
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: '#58704A',
                      lineHeight: 1.3,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {access.met_at_event_title}
                  </Typography>
                </Box>

                {access?.friendship_status === 'accepted' && !removeCountdown && (
                  <>
                    <IconButton
                      size="small"
                      onClick={(e) => setBuddyMenuAnchor(e.currentTarget)}
                      sx={{
                        width: 32,
                        height: 32,
                        flexShrink: 0,
                        color: '#58704A',
                        bgcolor: 'rgba(255,255,255,0.56)',
                        border: '1px solid rgba(122, 141, 103, 0.18)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.78)' },
                      }}
                    >
                      <MoreHorizontal size={16} />
                    </IconButton>
                    <Menu
                      anchorEl={buddyMenuAnchor}
                      open={Boolean(buddyMenuAnchor)}
                      onClose={() => setBuddyMenuAnchor(null)}
                      PaperProps={{
                        sx: {
                          borderRadius: '12px',
                          mt: 1,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                          minWidth: 160,
                        },
                      }}
                    >
                      <MenuItem
                        onClick={() => {
                          setBuddyMenuAnchor(null);
                          handleRemoveFriend();
                        }}
                        sx={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: '#C95E35',
                          py: 1,
                        }}
                      >
                        Remove friend
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </Box>

              {removeCountdown ? (
                <Box
                  sx={{
                    mt: 0.2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: '#6F7F5F',
                      lineHeight: 1.2,
                    }}
                  >
                    Removing connection in {removeCountdown}s
                  </Typography>
                  <Button
                    onClick={handleUndoRemove}
                    sx={{
                      minWidth: 'unset',
                      px: 1.1,
                      py: 0.45,
                      borderRadius: '999px',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'none',
                      color: '#58704A',
                      bgcolor: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(122, 141, 103, 0.2)',
                      '&:hover': { bgcolor: '#fff' },
                    }}
                  >
                    Undo
                  </Button>
                </Box>
              ) : null}
            </Box>
          )}

          {headerAction && (
            <Box
              sx={{
                flex: { xs: '1 1 100%', sm: '0 0 auto' },
                ml: { sm: 'auto' },
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'stretch', sm: 'flex-end' },
                gap: 1,
              }}
            >
              {headerAction}
            </Box>
          )}
        </Box>

        {isRestricted && (
          <Box
            sx={{
              mx: 2,
              mb: 4,
              mt: 2,
              borderRadius: '24px',
              border: '1px solid #E8D9C8',
              bgcolor: '#FDF8F3',
              p: 4,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              boxShadow: '0 4px 20px rgba(122, 90, 67, 0.05)',
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '30px',
                bgcolor: '#F5EDE3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              {isUnauth ? (
                <Lock size={28} color="#C95E35" />
              ) : (
                <Users size={28} color="#C95E35" />
              )}
            </Box>
            
            <Typography
              sx={{
                fontFamily: 'Fraunces, "Times New Roman", serif',
                fontSize: 22,
                color: '#2E1F14',
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              {isUnauth 
                ? `Connect with ${displayName}` 
                : 'Your next friendship starts here'}
            </Typography>
            
            <Typography 
              sx={{ 
                fontSize: 14, 
                color: '#6B5848', 
                lineHeight: 1.6,
                maxWidth: '300px',
                mx: 'auto'
              }}
            >
              {isUnauth
                ? `Join the community to connect with ${displayName}. Sign in to see their highlights and discover your next shared adventure!`
                : `You haven't crossed paths at an event yet—why not join a future gathering and say hello?`}
            </Typography>

            {isUnauth && (
              <Button
                variant="contained"
                onClick={() =>
                  navigate(`/signin?redirectTo=${encodeURIComponent(`/profile/${profile.username}`)}`)
                }
                sx={{
                  mt: 1,
                  borderRadius: '16px',
                  px: 4,
                  py: 1.2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: 14,
                  background: '#C95E35',
                  color: '#FDF8F3',
                  boxShadow: '0 4px 12px rgba(201, 94, 53, 0.2)',
                  '&:hover': { 
                    background: '#B04E28',
                    boxShadow: '0 6px 16px rgba(201, 94, 53, 0.3)',
                  },
                }}
              >
                Sign in to connect
              </Button>
            )}
          </Box>
        )}

        {!isRestricted && (
          <Typography sx={{ px: 2, pb: 1.8, fontSize: 13, color: '#6B5848', lineHeight: 1.5 }}>
            {profile.headline || profile.showcase_bio || 'Living the best moments, one event at a time.'}
          </Typography>
        )}

        {!isRestricted && (
          <Box
            sx={{
              mx: 2,
              mb: 1.8,
              borderRadius: '16px',
              overflow: 'hidden',
              border: '0.5px solid #E8D9C8',
              background: '#F5EDE3',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            }}
          >
            {[
              {
                label: 'Attended',
                value: profile.attended_count || 0,
                icon: <PartyPopper size={14} color="#7A5A43" />,
              },
              {
                label: 'Hosted',
                value: profile.hosted_count || 0,
                icon: <UserRound size={14} color="#7A5A43" />,
              },
              {
                label: 'Reviews',
                value: profile.total_reviews || 0,
                icon: <Star size={14} color="#7A5A43" />,
              },
            ].map((stat, idx) => (
              <Box
                key={stat.label}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 1.4,
                  borderLeft: idx > 0 ? '0.5px solid #E0D0BF' : 'none',
                }}
              >
                {stat.icon}
                <Typography
                  sx={{
                    fontFamily: 'Fraunces, "Times New Roman", serif',
                    fontSize: 22,
                    lineHeight: 1,
                    fontWeight: 600,
                    color: '#2E1F14',
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 9.5,
                    color: '#9C8878',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {!isRestricted && profile.badges && profile.badges.length > 0 && (
          <Box sx={{ px: 2, pb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            {profile.badges.map((badge, idx) => {
              const Icon = getBadgeIcon(badge.icon);
              const tone = badgeTones[idx % badgeTones.length];
              return (
                <Tooltip title={badge.description || badge.label} key={badge.id} placement="top" arrow>
                  <Chip
                    icon={<Icon size={12} color={tone.fg} />}
                    label={badge.label}
                    sx={{
                      height: 24,
                      borderRadius: '18px',
                      bgcolor: tone.bg,
                      color: tone.fg,
                      border: `0.5px solid ${tone.border}`,
                      fontSize: 11,
                      fontWeight: 600,
                      '& .MuiChip-icon': { ml: 0.8 },
                    }}
                  />
                </Tooltip>
              );
            })}
          </Box>
        )}

        {!isRestricted && <Box sx={{ height: '0.5px', background: '#EAE0D4', mx: 2, mb: 1.8 }} />}

        {!isRestricted && <Box sx={{ px: 2, pb: 2.4 }}>
          <Typography
            sx={{
              fontFamily: 'Fraunces, "Times New Roman", serif',
              fontSize: 18,
              fontWeight: 600,
              color: '#2E1F14',
              mb: 1.2,
            }}
          >
            Good times had
          </Typography>

          {attendedEvents.length > 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2 }}>
              {attendedEvents.slice(0, 6).map((event, idx) => (
                <Box
                  key={event.id}
                  onClick={() => navigate(`/events-new/${event.id}`)}
                  sx={{
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: '0.5px solid #EAE0D4',
                    bgcolor: '#fff',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(46,31,20,0.10)',
                    },
                  }}
                >
                  <Box sx={{ width: '100%', aspectRatio: '4/3', bgcolor: ['#FAC775', '#9FE1CB', '#F5C4B3', '#EEEDFE'][idx % 4] }}>
                    <Media
                      src={event.cover_image || undefined}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                  <Box sx={{ px: 1.1, py: 1 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#C95E35', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {getEventCategory(event)}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'Fraunces, "Times New Roman", serif',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#2E1F14',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                        minHeight: '2.6em',
                      }}
                    >
                      {event.title}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#9C8878', mt: 0.3 }}>{getEventDate(event.start_time)}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                borderRadius: '14px',
                border: '0.5px solid #EAE0D4',
                background: '#FFFDF9',
                px: 2,
                py: 3,
                textAlign: 'center',
              }}
            >
              <Typography sx={{ color: '#7A5A43', fontSize: 13 }}>No attended events yet.</Typography>
            </Box>
          )}
        </Box>}

        {!isRestricted && hostedEvents.length > 0 && (
          <Box sx={{ px: 2, pb: 2.4 }}>
            <Typography
              sx={{
                fontFamily: 'Fraunces, "Times New Roman", serif',
                fontSize: 18,
                fontWeight: 600,
                color: '#2E1F14',
                mb: 1.2,
              }}
            >
              Parties thrown
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2 }}>
              {hostedEvents.slice(0, 4).map((event) => (
                <Box
                  key={event.id}
                  onClick={() => navigate(`/events-new/${event.id}`)}
                  sx={{
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: '0.5px solid #EAE0D4',
                    bgcolor: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <Box sx={{ width: '100%', aspectRatio: '4/3' }}>
                    <Media
                      src={event.cover_image || undefined}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                  <Box sx={{ px: 1.1, py: 1 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#C95E35', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {getEventCategory(event)}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'Fraunces, "Times New Roman", serif',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#2E1F14',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                        minHeight: '2.6em',
                      }}
                    >
                      {event.title}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#9C8878', mt: 0.3 }}>{getEventDate(event.start_time)}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {!isRestricted && services.length > 0 && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Typography
              sx={{
                fontFamily: 'Fraunces, "Times New Roman", serif',
                fontSize: 18,
                fontWeight: 600,
                color: '#2E1F14',
                mb: 1.2,
              }}
            >
              My hustle
            </Typography>
            <Box sx={{ display: 'grid', gap: 1 }}>
              {services.slice(0, 3).map((service) => (
                <Box
                  key={service.id}
                  onClick={() => navigate(`/services/${service.id}`)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.2,
                    borderRadius: '14px',
                    p: 1,
                    bgcolor: '#FFFDF9',
                    border: '0.5px solid #EAE0D4',
                    cursor: 'pointer',
                  }}
                >
                  <Box sx={{ width: 54, height: 54, borderRadius: '10px', overflow: 'hidden', bgcolor: '#F2EAE0', flexShrink: 0 }}>
                    <Media
                      src={service.portfolio_image || undefined}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 13.5,
                        color: '#2E1F14',
                        fontWeight: 600,
                        lineHeight: 1.25,
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                      }}
                    >
                      {service.title}
                    </Typography>
                    {service.category && (
                      <Typography sx={{ fontSize: 11, color: '#9C8878', mt: 0.4 }}>{service.category}</Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {!isRestricted && profile.location_city && (
          <Box sx={{ px: 2, pt: 1, pb: 1 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.7,
                bgcolor: '#F2EAE0',
                borderRadius: '16px',
                px: 1.2,
                py: 0.7,
                border: '0.5px solid #E0D3C4',
              }}
            >
              <MapPin size={13} color="#7A5A43" />
              <Typography sx={{ fontSize: 11.5, color: '#7A5A43', fontWeight: 600 }}>{profile.location_city}</Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ height: 'max(18px, env(safe-area-inset-bottom))' }} />

        {/* Premium Add Friend Dialog */}
        <Dialog
          open={isFriendDialogOpen}
          onClose={() => setIsFriendDialogOpen(false)}
          fullWidth
          maxWidth="xs"
          PaperProps={{
            sx: {
              borderRadius: '28px',
              bgcolor: '#FDF8F3',
              border: '0.5px solid #EAE0D4',
              p: 1,
            },
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: 'Fraunces, "Times New Roman", serif',
              color: '#2E1F14',
              fontSize: 20,
              fontWeight: 600,
              pb: 1,
            }}
          >
            Choose shared event
          </DialogTitle>
          <DialogContent sx={{ pt: 0.5 }}>
            <Typography sx={{ fontSize: 13, color: '#7A5A43', mb: 2, lineHeight: 1.4 }}>
              Pick one event you both attended. The latest one is selected by default.
            </Typography>
            <Box sx={{ display: 'grid', gap: 1 }}>
              {sharedEvents.map((event) => {
                const isSelected = selectedSharedEventId === event.id;
                return (
                  <Box
                    key={event.id}
                    onClick={() => setSelectedSharedEventId(event.id)}
                    sx={{
                      border: '1px solid',
                      borderColor: isSelected ? '#C95E35' : '#EAE0D4',
                      borderRadius: '16px',
                      px: 2,
                      py: 1.5,
                      cursor: 'pointer',
                      bgcolor: isSelected ? '#FFF8F4' : '#fff',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#C95E35',
                        bgcolor: '#FFF8F4',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography sx={{ fontSize: 14, color: '#2E1F14', fontWeight: 600 }}>
                          {event.title}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: '#9C8878', mt: 0.2 }}>
                          {getEventDate(event.start_time)}
                        </Typography>
                      </Box>
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        sx={{
                          p: 0,
                          color: '#C95E35',
                          '&.Mui-checked': { color: '#C95E35' },
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 2, pb: 2, pt: 1, gap: 1 }}>
            <Button
              onClick={() => setIsFriendDialogOpen(false)}
              disabled={actionInFlight}
              sx={{
                textTransform: 'none',
                color: '#8C7B6B',
                fontWeight: 600,
                borderRadius: '12px',
                '&:hover': { bgcolor: '#F2EAE0' },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSendFriendRequest}
              disabled={!selectedSharedEventId || actionInFlight}
              sx={{
                textTransform: 'none',
                bgcolor: '#C95E35',
                color: '#fff',
                fontWeight: 600,
                borderRadius: '14px',
                px: 3,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#B04E28', boxShadow: 'none' },
                '&.Mui-disabled': { background: '#D8B9A8', color: '#fff' },
              }}
            >
              Confirm request
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
