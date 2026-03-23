import {
  Box,
  Button,
  Chip,
  Collapse,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Attendee, AttendeePopover } from '@/components/ui/AttendeePopover';
import { useAuth } from '@/features/auth/hooks';
import { applyToNeed } from '@/features/needs/api';
import { VENDOR_CATEGORIES } from '@/constants/categories';

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

interface NormalServiceCardProps {
  event: any;
  need: any;
  isAuthenticated: boolean;
  myServices?: any[];
  onCreateService?: (category: string) => void;
  isInteractionDisabled?: boolean;
}

export function NormalServiceCard({
  event,
  need,
  isAuthenticated,
  myServices = [],
  onCreateService,
  isInteractionDisabled = false,
}: NormalServiceCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedComp, setSelectedComp] = useState<'free' | 'discount' | 'cash'>(
    'free',
  );
  const [message, setMessage] = useState('');
  const [localApplicationStatus, setLocalApplicationStatus] = useState<string | null>(
    null,
  );

  const userApplication = event?.user_applications?.find(
    (app: any) => app.need_id === need.id,
  );
  const applicationStatus = userApplication?.status || localApplicationStatus || null;

  const assignedVendor = (need?.applications || []).find(
    (app: any) => app.status === 'accepted',
  );

  const isEligible = useMemo(() => {
    return myServices.some(
      (s: any) =>
        s.category.toLowerCase().includes(need.category.toLowerCase()) ||
        need.category.toLowerCase().includes(s.category.toLowerCase()),
    );
  }, [myServices, need.category]);

  const matchedService = useMemo(
    () =>
      myServices.find(
        (service: any) =>
          service.category.toLowerCase().includes(need.category.toLowerCase()) ||
          need.category.toLowerCase().includes(service.category.toLowerCase()),
      ) || null,
    [myServices, need.category],
  );


  const getBgColor = (title: string) => {
    const key = title?.toLowerCase().slice(0, 12) || 'default';
    return CATEGORY_BG_COLORS[key] || CATEGORY_BG_COLORS.default;
  };

  const numericReward = Number(need?.budget_max || need?.budget_min || 0);
  const discountPercent = numericReward
    ? Math.min(60, Math.max(20, Math.round(numericReward / 10)))
    : 40;
  const discountValue = numericReward
    ? Math.round((numericReward * discountPercent) / 100)
    : 0;

  useEffect(() => {
    if (matchedService?.description && !message) {
      setMessage(matchedService.description);
    }
  }, [matchedService, message]);

  const applyMutation = useMutation({
    mutationFn: (payload: {
      message?: string;
      proposed_price?: number | null;
      service_id?: number | null;
    }) => applyToNeed(need.id, payload),
    onSuccess: async () => {
      setLocalApplicationStatus('pending');
      setShowApplicationForm(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['event', event?.id] }),
        queryClient.invalidateQueries({ queryKey: ['eventNeeds'] }),
      ]);
    },
  });

  const handleSubmitApplication = () => {
    const proposedPrice =
      selectedComp === 'free'
        ? 0
        : selectedComp === 'discount'
          ? discountValue
          : numericReward || null;

    applyMutation.mutate({
      message: message.trim() || undefined,
      proposed_price: proposedPrice,
      service_id: matchedService?.id ?? null,
    });
  };

  const renderAction = () => {
    const isHost = user?.username && event?.host?.username === user.username;

    if (isInteractionDisabled) {
      return (
        <Typography sx={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>
          Locked in draft
        </Typography>
      );
    }

    if (isHost) {
      return (
        <Button
          onClick={() => navigate(`/events/${event.id}/manage?editNeedId=${need.id}`)}
          sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 500,
            px: 1.5,
            py: 0.35,
            borderRadius: 999,
            bgcolor: '#D85A30',
            color: '#fff',
            textTransform: 'none',
            '&:hover': { bgcolor: '#c44d28' },
          }}
        >
          EDIT NEED
        </Button>
      );
    }

    if (need.status === 'filled') return null;

    if (!isAuthenticated) {
      return (
        <Button
          onClick={() => navigate('/signin')}
          sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 500,
            px: 1.5,
            py: 0.35,
            borderRadius: 999,
            bgcolor: '#D85A30',
            color: '#fff',
            textTransform: 'none',
            '&:hover': { bgcolor: '#c44d28' },
          }}
        >
          Sign in to apply
        </Button>
      );
    }

    if (applicationStatus === 'accepted') {
      return (
        <Button
          onClick={() => navigate(`/events-new/${event.id}/service-event-management`)}
          sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 500,
            px: 1.5,
            py: 0.35,
            borderRadius: 999,
            bgcolor: '#15803d',
            color: '#fff',
            textTransform: 'none',
            '&:hover': { bgcolor: '#166534' },
          }}
        >
          Go to management
        </Button>
      );
    }

    if (applicationStatus === 'pending') {
      return (
        <Typography sx={{ fontSize: 11, color: '#0284c7', fontWeight: 600 }}>
          Application Pending
        </Typography>
      );
    }

    if (isEligible) {
      return (
        <Button
          onClick={() => setShowApplicationForm(!showApplicationForm)}
          sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 500,
            px: 1.5,
            py: 0.35,
            borderRadius: 999,
            bgcolor: showApplicationForm ? '#111' : '#D85A30',
            color: '#fff',
            textTransform: 'none',
            '&:hover': { bgcolor: showApplicationForm ? '#000' : '#c44d28' },
          }}
        >
          {showApplicationForm ? 'Close' : 'Apply'}
        </Button>
      );
    }

    return (
      <Button
        onClick={() => {
          if (onCreateService) {
            onCreateService(need.category);
          } else {
            navigate(`/vendors/create?category=${need.category}`);
          }
        }}
        sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 11,
          fontWeight: 500,
          px: 1.5,
          py: 0.35,
          borderRadius: 999,
          bgcolor: '#D85A30',
          color: '#fff',
          textTransform: 'none',
          '&:hover': { bgcolor: '#c44d28' },
        }}
      >
        Create to Apply
      </Button>
    );
  };

  return (
    <Box
      sx={{
        bgcolor: 'var(--color-background-primary, #fff)',
        border: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
        p: 1.375,
        mb: 1.5,
        opacity: need.status === 'filled' && !assignedVendor ? 0.75 : 1,
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
            fontSize: 36,
            flexShrink: 0,
          }}
        >
          { VENDOR_CATEGORIES.find((category: any) => category.items.find((item: any) => item.id === need.category))?.items.find((item: any) => item.id === need.category)?.icon}
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
              display: showApplicationForm ? 'block' : '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {need.description || ''}
          </Typography>
        </Box>
        {need.status !== 'filled' && (<Box sx={{ textAlign: 'right', flexShrink: 0 }}>
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
                {need.is_reimbursed ? '' : ''}
              </Typography>
            </>
          ) : (
            
            <Typography
            sx={{
              fontFamily: '"Syne", sans-serif',
              fontSize: 13,
              fontWeight: 700,
              color: '#BA7517',
            }}
          >
            Free in
          </Typography>
          )}
        </Box>)}
      </Box>

      {/* Applications / Status Section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row' ,
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 1, sm: 0 },
          mt: need.status === 'filled' ? 0 : 1.125,
          pt: need.status === 'filled' ? 0 : 1,
          borderTop: need.status === 'filled' ? 'none' : '0.5px solid var(--color-border-tertiary, #e5e7eb)',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {(need.applications?.length || 0) > 0 && need.status !== 'filled' && (
            <Typography
              sx={{ fontSize: 11, color: 'var(--color-text-secondary, #6b7280)' }}
            >
              {need.applications.length} applied
            </Typography>
          )}
        </Stack>
        {renderAction()}
      </Box>

      <Box >
        <Box display="flex" flexDirection="row" justifyContent="flex-end" gap={1}>
          {/* Accepted Vendor Section */}
      {need.status === 'filled' && assignedVendor && (
        
        <AttendeePopover
          attendee={
            {
              username:
                assignedVendor.username || assignedVendor.vendor_name || 'user',
              name: assignedVendor.name,
              avatar: assignedVendor.avatar,
              is_verified: assignedVendor.is_verified || false,
              bio: assignedVendor.bio,
            } as Attendee
          }
          variant="normal"
        >
          <Box
            sx={{
              mt: -2,
              display: 'inline-flex',
              bgcolor: '#F0FDF4',
              border: '1.5px solid #BBF7D0',
              py: 0.6,
              px: 1.25,
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                color: '#166534',
                fontWeight: 500,
              }}
            >
              <Box component="span" sx={{ fontWeight: 800, color: '#15803D' }}>
                {assignedVendor.username || assignedVendor.vendor_name}
              </Box>
              <span> is chipping in!</span>
            </Typography>
          </Box>
        </AttendeePopover>
    )}

        </Box>

      </Box>

      {/* Application Form */}
      <Collapse in={showApplicationForm}>
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e5e7eb' }}>
          <Stack spacing={1.5}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
              Pick compensation
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label="Free entry"
                onClick={() => setSelectedComp('free')}
                size="small"
                sx={{
                  fontSize: 11,
                  bgcolor: selectedComp === 'free' ? '#FAECE7' : '#fff',
                  color: selectedComp === 'free' ? '#712B13' : '#374151',
                  border:
                    selectedComp === 'free' ? '1px solid #D85A30' : '1px solid #e5e7eb',
                }}
              />
              <Chip
                label={`${discountPercent}% discount`}
                onClick={() => setSelectedComp('discount')}
                size="small"
                sx={{
                  fontSize: 11,
                  bgcolor: selectedComp === 'discount' ? '#FAECE7' : '#fff',
                  color: selectedComp === 'discount' ? '#712B13' : '#374151',
                  border:
                    selectedComp === 'discount'
                      ? '1px solid #D85A30'
                      : '1px solid #e5e7eb',
                }}
              />
              <Chip
                label={numericReward ? `₹${numericReward} cash` : 'Cash offer'}
                onClick={() => setSelectedComp('cash')}
                size="small"
                sx={{
                  fontSize: 11,
                  bgcolor: selectedComp === 'cash' ? '#FAECE7' : '#fff',
                  color: selectedComp === 'cash' ? '#712B13' : '#374151',
                  border:
                    selectedComp === 'cash' ? '1px solid #D85A30' : '1px solid #e5e7eb',
                }}
              />
            </Stack>

            <TextField
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell the host why you're a good fit..."
              multiline
              rows={3}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: 12,
                  borderRadius: '10px',
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#D85A30' },
                },
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                onClick={() => setShowApplicationForm(false)}
                sx={{ textTransform: 'none', fontSize: 12, color: '#6b7280' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmitApplication}
                disabled={applyMutation.isPending}
                sx={{
                  bgcolor: '#D85A30',
                  color: '#fff',
                  textTransform: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: '8px',
                  '&:hover': { bgcolor: '#c44d28' },
                }}
              >
                {applyMutation.isPending ? 'Sending...' : 'Send Application'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}
