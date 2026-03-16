import {
  Box,
  Button as MuiButton,
  Chip,
  Collapse,
  Paper,
  Popover,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { TinyBusinessCard } from '@/components/ui/TinyBusinessCard';
import { VendorBusinessCard } from '@/components/ui/VendorBusinessCard';
import { useAuth } from '@/features/auth/hooks';
import { applyToNeed } from '@/features/needs/api';
import type { NeedApplication } from '@/types/needs';

function isOpenNeed(status?: string | null) {
  return !status || status === 'open' || status === 'pending';
}

function formatBudgetLabel(need: any) {
  const value = Number(need?.budget_max || need?.budget_min || 0);
  if (!value) return 'Comp TBD';
  return `Rs ${value}`;
}

function getDiscountDetails(need: any) {
  const numericReward = Number(need?.budget_max || need?.budget_min || 0);
  const discountPercent = numericReward
    ? Math.min(60, Math.max(20, Math.round(numericReward / 10)))
    : 40;
  const discountValue = numericReward
    ? Math.round((numericReward * discountPercent) / 100)
    : 0;

  return { numericReward, discountPercent, discountValue };
}

function serviceMatchesNeed(service: any, category?: string) {
  const serviceCategory = String(service?.category || '').toLowerCase();
  const needCategory = String(category || '').toLowerCase();

  return (
    Boolean(serviceCategory) &&
    Boolean(needCategory) &&
    (serviceCategory.includes(needCategory) || needCategory.includes(serviceCategory))
  );
}

export const ClassifiedAd = ({
  need,
  event,
  myServices = [],
  onInquire,
  isEligible = false,
  isOpportunity = false,
}: {
  need: any;
  event?: any;
  myServices?: any[];
  onInquire?: (n: any) => void;
  isEligible?: boolean;
  isOpportunity?: boolean;
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hostAnchorEl, setHostAnchorEl] = useState<HTMLElement | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedComp, setSelectedComp] = useState<'free' | 'discount' | 'cash'>(
    'free',
  );
  const [message, setMessage] = useState('');
  const [localApplicationStatus, setLocalApplicationStatus] = useState<
    NeedApplication['status'] | null
  >(null);

  const assignedVendor = (need?.applications || []).find(
    (app: any) => app.status === 'accepted',
  );
  const userApplication = event?.user_applications?.find(
    (app: any) => app.need_id === need.id,
  );
  const applicationStatus = userApplication?.status || localApplicationStatus || null;
  const matchedService = useMemo(
    () =>
      myServices.find((service: any) => serviceMatchesNeed(service, need?.category)) ||
      null,
    [myServices, need?.category],
  );
  const hostProfile = useMemo(
    () => ({
      username:
        assignedVendor?.username ||
        assignedVendor?.vendor_name ||
        assignedVendor?.name ||
        'host',
      avatar: assignedVendor?.avatar || null,
      rating: assignedVendor?.rating,
    }),
    [assignedVendor],
  );
  const isHostCardOpen = Boolean(hostAnchorEl);
  const isHost =
    event?.host?.username === user?.username ||
    event?.host?.id === user?.id ||
    event?.host === user?.username ||
    event?.host === user?.id;
  const needIsOpen = isOpenNeed(need?.status);
  const shouldShowActions = needIsOpen && !isHost;
  const budgetLabel = formatBudgetLabel(need);
  const { numericReward, discountPercent, discountValue } = getDiscountDetails(need);

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
        queryClient.invalidateQueries({ queryKey: ['myApplications'] }),
        queryClient.invalidateQueries({ queryKey: ['event', event?.id] }),
        queryClient.invalidateQueries({ queryKey: ['eventNeeds'] }),
        queryClient.invalidateQueries({ queryKey: ['myVendorOpportunities'] }),
      ]);
    },
  });

  const handleOpenApplication = () => {
    if (!event?.id && onInquire) {
      onInquire(need);
      return;
    }
    setShowApplicationForm((prev) => !prev);
  };

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

  const renderPrimaryAction = () => {
    if (!shouldShowActions) return null;

    if (!isAuthenticated) {
      return (
        <MuiButton
          variant="outlined"
          size="small"
          onClick={() =>
            navigate(
              `/events/${(event as any)?.id}/service-event-management/application`,
            )
          }
          sx={primaryButtonSx('#0284c7', '#0284c7')}
        >
          Sign in to apply
        </MuiButton>
      );
    }

    if (applicationStatus === 'accepted') {
      return (
        <MuiButton
          variant="outlined"
          size="small"
          onClick={() =>
            navigate(`/events/${(event as any)?.id}/service-event-management`)
          }
          sx={primaryButtonSx('#15803d', '#15803d')}
        >
          Go to management
        </MuiButton>
      );
    }

    if (applicationStatus === 'pending') {
      return (
        <MuiButton
          variant="outlined"
          size="small"
          onClick={() =>
            navigate(
              `/events/${(event as any)?.id}/service-event-management/application`,
            )
          }
          sx={primaryButtonSx('#0284c7', '#0284c7')}
        >
          View application
        </MuiButton>
      );
    }

    if (isEligible) {
      return (
        <MuiButton
          variant={showApplicationForm ? 'contained' : 'outlined'}
          size="small"
          onClick={handleOpenApplication}
          sx={
            showApplicationForm
              ? {
                  ...primaryButtonSx('#2b2b2b', '#2b2b2b'),
                  color: '#fff',
                  '&:hover': { bgcolor: '#111', borderColor: '#111' },
                }
              : primaryButtonSx('#2b2b2b', '#2b2b2b')
          }
        >
          {showApplicationForm ? 'Hide application' : 'Send application'}
        </MuiButton>
      );
    }

    if (isOpportunity) {
      return (
        <MuiButton
          variant="outlined"
          size="small"
          onClick={() => navigate(`/vendors/create?category=${need.category}`)}
          sx={primaryButtonSx('#166534', '#166534')}
        >
          Create service
        </MuiButton>
      );
    }

    return null;
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          p: 2.25,
          mb: 2,
          bgcolor: '#fffaf2',
          backgroundImage: `
            linear-gradient(0deg, rgba(255, 214, 165, 0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 214, 165, 0.12) 1px, transparent 1px),
            radial-gradient(circle at 20% 15%, rgba(255, 186, 120, 0.16), transparent 45%)
          `,
          backgroundSize: '24px 24px, 24px 24px, 100% 100%',
          border: '2px solid #2b2b2b',
          outline: '4px solid #fffaf2',
          position: 'relative',
          opacity: need.status === 'filled' ? 0.72 : 1,
          filter: need.status === 'filled' ? 'grayscale(0.45)' : 'none',
          pointerEvents: need.status === 'filled' ? 'none' : 'auto',
          transition: 'all 0.25s ease',
          boxShadow: '6px 8px 0 rgba(43,43,43,0.12), 0 10px 18px rgba(0,0,0,0.08)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 14,
            left: 18,
            width: 60,
            height: 18,
            background:
              'linear-gradient(90deg, rgba(255, 216, 151, 0.85), rgba(255, 232, 190, 0.4))',
            border: '1px solid rgba(181, 128, 60, 0.35)',
            transform: 'rotate(-6deg)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            opacity: 0.9,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 16,
            right: 18,
            width: 70,
            height: 20,
            background:
              'linear-gradient(90deg, rgba(168, 222, 255, 0.8), rgba(214, 244, 255, 0.4))',
            border: '1px solid rgba(60, 132, 181, 0.35)',
            transform: 'rotate(4deg)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            opacity: 0.9,
          },
        }}
      >
        <Stack spacing={1.4}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 1,
              pr: isOpportunity ? 7 : 0,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.09em',
                  color: '#7c5b36',
                  mb: 0.5,
                }}
              >
                {String(need.category || 'service')
                  .split('_')
                  .join(' ')}
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 700,
                  fontSize: '1rem',
                  lineHeight: 1.25,
                  color: need.status === 'filled' ? '#7a7a7a' : '#1f1f1f',
                  textTransform: 'capitalize',
                }}
              >
                {need.title ||
                  `${String(need.category || 'service')
                    .split('_')
                    .join(' ')} help`}
              </Typography>
            </Box>

            <Chip
              size="small"
              label={getStatusLabel(need.status, applicationStatus)}
              sx={statusChipSx(need.status, applicationStatus)}
            />
          </Box>

          <Typography
            variant="body2"
            sx={{
              fontSize: '0.9rem',
              lineHeight: 1.5,
              color: '#473b2b',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: showApplicationForm ? 'none' : 3,
              overflow: 'hidden',
            }}
          >
            {need.description}
          </Typography>

          <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', gap: 0.8 }}>
            <Chip size="small" label={budgetLabel} sx={metaChipSx} />
            {need?.application_count > 0 ? (
              <Chip
                size="small"
                label={`${need.application_count} application${need.application_count === 1 ? '' : 's'}`}
                sx={metaChipSx}
              />
            ) : null}
            {matchedService?.title && isEligible ? (
              <Chip
                size="small"
                label={`Using ${matchedService.title}`}
                sx={metaChipSx}
              />
            ) : null}
          </Stack>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.74rem',
                fontWeight: 600,
                color: '#76624b',
              }}
            >
              {applicationStatus === 'pending'
                ? 'Your application is under review.'
                : applicationStatus === 'accepted'
                  ? 'You are confirmed for this role.'
                  : isOpportunity
                    ? 'No matching service yet.'
                    : 'Choose a quick next step.'}
            </Typography>
            {renderPrimaryAction()}
          </Box>

          <Collapse in={showApplicationForm}>
            <Box
              sx={{
                pt: 1.4,
                mt: 0.4,
                borderTop: '1px dashed rgba(43,43,43,0.25)',
              }}
            >
              <Stack spacing={1.2}>
                <Typography
                  sx={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#6c5843',
                  }}
                >
                  Pick compensation
                </Typography>

                <Stack
                  direction="row"
                  spacing={0.8}
                  sx={{ flexWrap: 'wrap', gap: 0.8 }}
                >
                  <Chip
                    label="Free entry"
                    onClick={() => setSelectedComp('free')}
                    size="small"
                    sx={compChipSx(selectedComp === 'free')}
                  />
                  <Chip
                    label={`${discountPercent}% discount${discountValue ? ` (save Rs ${discountValue})` : ''}`}
                    onClick={() => setSelectedComp('discount')}
                    size="small"
                    sx={compChipSx(selectedComp === 'discount')}
                  />
                  <Chip
                    label={numericReward ? `${budgetLabel} cash` : 'Cash offer'}
                    onClick={() => setSelectedComp('cash')}
                    size="small"
                    sx={compChipSx(selectedComp === 'cash')}
                  />
                </Stack>

                <TextField
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a short note about why you're a good fit..."
                  multiline
                  minRows={2}
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: 13,
                      borderRadius: 1.5,
                      backgroundColor: 'rgba(255,255,255,0.72)',
                      '& fieldset': { borderColor: 'rgba(17,24,39,0.12)' },
                      '&:hover fieldset': { borderColor: '#D85A30' },
                      '&.Mui-focused fieldset': {
                        borderWidth: 2,
                        borderColor: '#D85A30',
                      },
                    },
                  }}
                />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  <Typography sx={{ fontSize: '0.72rem', color: '#7b6a58' }}>
                    {matchedService?.title
                      ? `This will attach ${matchedService.title}.`
                      : 'You can still apply without attaching a service.'}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <MuiButton
                      variant="text"
                      size="small"
                      onClick={() => setShowApplicationForm(false)}
                      sx={{
                        color: '#5b4b3a',
                        fontWeight: 700,
                        minWidth: 0,
                        px: 1,
                      }}
                    >
                      Cancel
                    </MuiButton>
                    <MuiButton
                      variant="contained"
                      size="small"
                      onClick={handleSubmitApplication}
                      disabled={applyMutation.isPending}
                      sx={{
                        borderRadius: 0,
                        bgcolor: '#2b2b2b',
                        color: '#fff',
                        fontWeight: 700,
                        px: 1.5,
                        '&:hover': { bgcolor: '#111' },
                      }}
                    >
                      {applyMutation.isPending ? 'Sending...' : 'Send application'}
                    </MuiButton>
                  </Stack>
                </Box>

                {applyMutation.isError ? (
                  <Typography
                    sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626' }}
                  >
                    Something went wrong. Please try again.
                  </Typography>
                ) : null}
              </Stack>
            </Box>
          </Collapse>
        </Stack>
      </Paper>

      {needIsOpen && isOpportunity && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 14,
            px: 1.5,
            py: 0.6,
            border: '2px solid rgba(22, 163, 74, 0.6)',
            borderRadius: '4px',
            transform: 'rotate(4deg)',
            pointerEvents: 'none',
            zIndex: 2,
            bgcolor: 'rgba(255, 255, 255, 0.85)',
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Permanent Marker", cursive',
              fontSize: '0.65rem',
              color: 'rgba(22, 163, 74, 0.8)',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            OPPORTUNITY
          </Typography>
        </Box>
      )}

      {need.status === 'filled' && (
        <>
          <Box
            sx={{
              position: 'absolute',
              bottom: -6,
              right: -6,
              zIndex: 10,
              transform: 'rotate(3deg)',
            }}
          >
            <TinyBusinessCard
              name={hostProfile.username}
              avatar={hostProfile.avatar || ''}
              onClick={(event) => {
                event.stopPropagation();
                setHostAnchorEl(event.currentTarget);
              }}
            />
          </Box>
          <Popover
            open={isHostCardOpen}
            anchorEl={hostAnchorEl}
            onClose={() => setHostAnchorEl(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            PaperProps={{
              sx: {
                p: 0,
                bgcolor: 'transparent',
                boxShadow: 'none',
              },
            }}
          >
            <Box sx={{ p: 1 }}>
              <VendorBusinessCard vendor={hostProfile} rotation={-1.5} />
            </Box>
          </Popover>
        </>
      )}
    </Box>
  );
};

function getStatusLabel(needStatus?: string | null, applicationStatus?: string | null) {
  if (applicationStatus === 'accepted') return 'accepted';
  if (applicationStatus === 'pending') return 'applied';
  if (needStatus === 'filled') return 'filled';
  return 'open';
}

function statusChipSx(needStatus?: string | null, applicationStatus?: string | null) {
  if (applicationStatus === 'accepted') {
    return {
      ...metaChipSx,
      color: '#166534',
      bgcolor: '#DCFCE7',
      borderColor: '#86efac',
    };
  }

  if (applicationStatus === 'pending') {
    return {
      ...metaChipSx,
      color: '#9a3412',
      bgcolor: '#ffedd5',
      borderColor: '#fdba74',
    };
  }

  if (needStatus === 'filled') {
    return {
      ...metaChipSx,
      color: '#525252',
      bgcolor: '#f5f5f5',
      borderColor: '#d4d4d4',
    };
  }

  return {
    ...metaChipSx,
    color: '#166534',
    bgcolor: '#f0fdf4',
    borderColor: '#bbf7d0',
  };
}

function primaryButtonSx(color: string, borderColor: string) {
  return {
    borderRadius: 0,
    borderColor,
    color,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    textTransform: 'none',
    '&:hover': {
      borderColor,
      bgcolor: `${color}12`,
    },
  };
}

const metaChipSx = {
  height: 24,
  borderRadius: '999px',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: '#5b4b3a',
  bgcolor: 'rgba(255,255,255,0.66)',
  border: '1px solid rgba(91,75,58,0.15)',
  '& .MuiChip-label': {
    px: 1,
  },
};

function compChipSx(selected: boolean) {
  return {
    borderRadius: '999px',
    fontSize: 12,
    fontWeight: 600,
    border: selected ? '2px solid #D85A30' : '1px solid #e5e7eb',
    backgroundColor: selected ? '#FAECE7' : '#fff',
    color: selected ? '#712B13' : '#374151',
  };
}
