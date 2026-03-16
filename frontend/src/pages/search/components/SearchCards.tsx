import {
  Box,
  Button,
  Chip,
  Collapse,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks';
import { getCategoryTheme } from '@/features/events/CategoricalBackground';
import {
  getEventCardRoles,
  HostVendorBadge,
  LiveBadge,
  PriceBadge,
  CompletedRatedBadge,
} from '@/features/events/scrapbookCard';
import type { EventListItem } from '@/types/events';
import type { VendorOpportunity } from '@/types/needs';
import { applyToNeed, fetchMyApplications } from '@/features/needs/api';

import type { SearchTabId } from '../searchTypes';
import {
  formatEventDayLabel,
  formatEventTimeLabel,
  getCountdownLabel,
  getLowestTicketPrice,
  getRoleGroup,
  isOnlineEvent,
} from '../searchUtils';

export function EventCard({
  event,
  tab,
  opportunity,
  hasMatchingService,
  onCreateService,
  onClick,
}: {
  event: EventListItem;
  tab: SearchTabId;
  opportunity?: VendorOpportunity;
  hasMatchingService: boolean;
  onCreateService?: (category?: string) => void;
  onClick: () => void;
}) {
  const { user, isAuthenticated } = useAuth();
  const [needsExpanded, setNeedsExpanded] = useState(false);
  const online = isOnlineEvent(event);
  const categoryTheme = getCategoryTheme(event.category ?? undefined);
  const accent = categoryTheme.accent;
  const { isHost, isVendor } = getEventCardRoles(event, {
    user: user ? { username: user.username } : null,
    isAuthenticated,
  });
  const price = getLowestTicketPrice(event);
  const priceLabel = price === 0 ? 'Free' : `Rs ${price}`;
  const countdown = getCountdownLabel(event.start_time);
  const showTimeHero = tab === 'tonight-weekend';
  const showPriceHero = tab === 'free-cheap';
  const showAttendanceHero = tab === 'trending';
  const showPlatformHero = tab === 'online';
  const hasTrendingBadge = event.ticket_count + event.interest_count >= 35;
  const showPriceOverlay =
    event.lifecycle_state === 'published' || event.lifecycle_state === 'live';
  const showRatedOverlay = event.lifecycle_state === 'completed';
  const needRewardValue = opportunity?.budget_max || opportunity?.budget_min;
  const needsCtaLabel = opportunity
    ? opportunity.is_invited
      ? 'Show invite'
      : hasMatchingService
        ? 'Send inquiry'
        : 'Create service'
    : null;

  const handleNeedsClick = (clickEvent: React.MouseEvent) => {
    clickEvent.stopPropagation();
    if (!opportunity) return;
    setNeedsExpanded((prev) => !prev);
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        border: '1px solid rgba(17,24,39,0.08)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 0,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 260,
      }}
    >
      <Box sx={{ position: 'relative', width: '100%', height: 120, flexShrink: 0 }}>
        {event.cover_image ? (
          <Box
            component="img"
            src={event.cover_image}
            alt={event.title}
            sx={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: 120,
              bgcolor: categoryTheme.bg || '#f3f4f6',
              display: 'block',
            }}
          />
        )}
        {event.lifecycle_state === 'live' && (
          <LiveBadge sx={{ position: 'absolute', bottom: 8, left: 8, zIndex: 2 }} />
        )}
        {(isHost || isVendor) && (
          <HostVendorBadge
            isHost={isHost}
            variant="full"
            bottomOffset={event.lifecycle_state === 'live' ? 36 : 10}
            sx={{ position: 'absolute', left: 8, zIndex: 2 }}
          />
        )}
        {showPriceOverlay && (
          <PriceBadge
            price={priceLabel}
            variant="landscape"
            sx={{ position: 'absolute', bottom: 8, right: 8, zIndex: 2 }}
          />
        )}
        {showRatedOverlay && (
          <CompletedRatedBadge
            sx={{ position: 'absolute', bottom: 8, right: 8, zIndex: 2 }}
          />
        )}
      </Box>

      <Box sx={{ p: 1.6, display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6b7280',
            }}
          >
            {event.category?.name || 'Event'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            {event.user_has_ticket && (
              <Box
                sx={{
                  px: 0.9,
                  py: 0.35,
                  borderRadius: '999px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#166534',
                  backgroundColor: '#DCFCE7',
                }}
              >
                You're going
              </Box>
            )}
            <Box
              sx={{
                px: 0.9,
                py: 0.35,
                borderRadius: '999px',
                fontSize: 10,
                fontWeight: 600,
                color: online ? '#085041' : '#7a271a',
                backgroundColor: online ? '#E1F5EE' : '#FAECE7',
              }}
            >
              {online ? 'Online' : 'In person'}
            </Box>
          </Box>
        </Box>

        {showAttendanceHero ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Box
              sx={{
                px: 1,
                py: 0.45,
                borderRadius: '999px',
                backgroundColor: '#EAF3DE',
                color: '#3B6D11',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {event.ticket_count} going
            </Box>
            {hasTrendingBadge ? (
              <Box
                sx={{
                  px: 1,
                  py: 0.45,
                  borderRadius: '999px',
                  backgroundColor: '#FCEBEB',
                  color: '#A32D2D',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                Trending
              </Box>
            ) : null}
          </Box>
        ) : null}

        {showTimeHero ? (
          <Box>
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 18,
                fontWeight: 700,
                color: '#111827',
              }}
            >
              {formatEventDayLabel(event.start_time)} /{' '}
              {formatEventTimeLabel(event.start_time)}
            </Typography>
            {countdown ? (
              <Typography sx={{ fontSize: 11, color: '#D85A30', fontWeight: 600 }}>
                {countdown}
              </Typography>
            ) : null}
          </Box>
        ) : null}

        {showPriceHero ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 18,
                fontWeight: 700,
                color: price === 0 ? '#3B6D11' : '#111827',
              }}
            >
              {price === 0 ? 'Free' : `Rs ${price}`}
            </Typography>
            <Box
              sx={{
                px: 1,
                py: 0.45,
                borderRadius: '999px',
                backgroundColor: '#FAEEDA',
                color: '#854F0B',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              Ticket
            </Box>
          </Box>
        ) : null}

        {showPlatformHero ? (
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 16,
              fontWeight: 700,
              color: '#085041',
            }}
          >
            Online
          </Typography>
        ) : null}

        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 15,
            lineHeight: 1.3,
            fontWeight: 700,
            color: '#111827',
          }}
        >
          {event.title}
        </Typography>

        {event.description ? (
          <Typography
            sx={{
              fontSize: 11,
              lineHeight: 1.45,
              color: '#6b7280',
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {event.description}
          </Typography>
        ) : null}

        {opportunity ? (
          <Box
            component="button"
            type="button"
            onClick={handleNeedsClick}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 0.8,
              width: '100%',
              border: '1px solid rgba(133,79,11,0.08)',
              borderRadius: '12px',
              backgroundColor: '#FAEEDA',
              color: '#412402',
              px: 1.1,
              py: 0.9,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
              '&:hover': {
                backgroundColor: '#F7E2C2',
                borderColor: 'rgba(133,79,11,0.2)',
              },
            }}
          >
            <Box component="span" sx={{ fontSize: 12, lineHeight: 1.4, mt: 0.1 }}>
              ⚡
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontSize: 11,
                  lineHeight: 1.4,
                  color: '#633806',
                }}
              >
                <Box component="span" sx={{ fontWeight: 700, color: '#412402' }}>
                  {opportunity.need_title}
                </Box>{' '}
                {needRewardValue
                  ? `- up to Rs ${needRewardValue}`
                  : '- tap to view details'}
              </Typography>
              {needsCtaLabel ? (
                <Typography
                  sx={{ mt: 0.35, fontSize: 10, fontWeight: 700, color: '#854F0B' }}
                >
                  {needsCtaLabel}
                </Typography>
              ) : null}
            </Box>
          </Box>
        ) : null}

        {!online ? (
          <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
            {event.location_name}
          </Typography>
        ) : null}

        {opportunity ? (
          <OpportunityCardExpandedSection
            opportunities={[opportunity]}
            hasMatchingService={hasMatchingService}
            expanded={needsExpanded}
            onCreateService={onCreateService}
          />
        ) : null}

        <Box
          sx={{
            mt: 'auto',
            pt: 1,
            borderTop: '1px solid rgba(17,24,39,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
            {showTimeHero
              ? event.location_name
              : `${formatEventDayLabel(event.start_time)} / ${formatEventTimeLabel(event.start_time)}`}
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              color: online ? '#085041' : '#D85A30',
            }}
          >
            {online ? 'Join' : 'View event'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

type CardActionType =
  | 'invite'
  | 'inquiry'
  | 'create-service'
  | 'already-applied'
  | 'servicing';

const CARD_THEMES: Record<
  CardActionType,
  {
    borderLeft: string;
    iconBg: string;
    iconColor: string;
    rewardColor: string;
    chipBg: string;
    chipColor: string;
    chipBorder?: string;
    bannerBg: string;
    expandRadius: string;
  }
> = {
  invite: {
    borderLeft: '#534AB7',
    iconBg: '#EEEDFE',
    iconColor: '#534AB7',
    rewardColor: '#534AB7',
    chipBg: '#EEEDFE',
    chipColor: '#26215C',
    chipBorder: '1px solid #534AB7',
    bannerBg: '#F6F5FF',
    expandRadius: '12px',
  },
  inquiry: {
    borderLeft: '#D85A30',
    iconBg: '#FAECE7',
    iconColor: '#993C1D',
    rewardColor: '#BA7517',
    chipBg: '#FAECE7',
    chipColor: '#712B13',
    chipBorder: '1px solid #D85A30',
    bannerBg: '#FFF9F5',
    expandRadius: '12px',
  },
  'create-service': {
    borderLeft: '#0d9488',
    iconBg: '#CCFBF1',
    iconColor: '#0f766e',
    rewardColor: '#0f766e',
    chipBg: 'transparent',
    chipColor: '#0f766e',
    chipBorder: '1.5px solid #0d9488',
    bannerBg: '#F0FDFA',
    expandRadius: '12px',
  },
  'already-applied': {
    borderLeft: '#D85A30',
    iconBg: '#FAECE7',
    iconColor: '#993C1D',
    rewardColor: '#BA7517',
    chipBg: '#FAECE7',
    chipColor: '#712B13',
    chipBorder: '1px solid #D85A30',
    bannerBg: '#FFF9F5',
    expandRadius: '12px',
  },
  servicing: {
    borderLeft: '#1D9E75',
    iconBg: '#E1F5EE',
    iconColor: '#0F6E56',
    rewardColor: '#0F6E56',
    chipBg: '#E1F5EE',
    chipColor: '#0F6E56',
    chipBorder: '1px solid #1D9E75',
    bannerBg: '#F0FDF4',
    expandRadius: '12px',
  },
};

function getOpportunityCardState(
  opportunity: VendorOpportunity,
  hasMatchingService: boolean,
  applicationStatus?: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | null,
) {
  const rewardValue = opportunity.budget_max || opportunity.budget_min;
  const rewardLabel = rewardValue ? `Rs ${rewardValue}` : 'Reward TBD';
  const role = getRoleGroup(opportunity);

  let actionType: CardActionType;
  if (applicationStatus === 'accepted') {
    actionType = 'servicing';
  } else if (applicationStatus === 'pending') {
    actionType = 'already-applied';
  } else {
    const hasInvite = opportunity.is_invited;
    const canSendInquiry = hasMatchingService && !hasInvite;
    actionType = hasInvite ? 'invite' : canSendInquiry ? 'inquiry' : 'create-service';
  }

  const theme = CARD_THEMES[actionType];
  const chipLabel =
    actionType === 'servicing'
      ? 'Servicing here'
      : actionType === 'already-applied'
        ? 'Already applied'
        : actionType === 'invite'
          ? 'Show invite'
          : actionType === 'inquiry'
            ? 'Send inquiry'
            : 'Create service';
  const detailTitle =
    actionType === 'servicing'
      ? 'You are assigned to this role'
      : actionType === 'already-applied'
        ? 'Your application is being reviewed'
        : actionType === 'invite'
          ? "Here's what you're signing up for"
          : actionType === 'inquiry'
            ? 'Before you apply'
            : 'Add a service to apply';
  const numericReward = rewardValue ? Number(rewardValue) : 0;
  const discountPercent = numericReward
    ? Math.min(60, Math.max(20, Math.round(numericReward / 10)))
    : 40;
  const discountValue = numericReward
    ? Math.round((numericReward * discountPercent) / 100)
    : 0;
  const roleIcon =
    role === 'dj_music'
      ? 'DJ'
      : role === 'food_catering'
        ? 'FO'
        : role === 'photography'
          ? 'PH'
          : role === 'equipment'
            ? 'EQ'
            : role === 'venue'
              ? 'VE'
              : role === 'staffing'
                ? 'ST'
                : 'OT';

  return {
    actionType,
    theme,
    rewardLabel,
    chipLabel,
    detailTitle,
    discountPercent,
    discountValue,
    roleIcon,
  };
}
export function OpportunityCardExpandedSection({
  opportunities,
  hasMatchingService,
  matchedNeedIds,
  expanded,
  onCreateService,
}: {
  opportunities: VendorOpportunity[];
  hasMatchingService: boolean;
  matchedNeedIds?: Set<number>;
  expanded: boolean;
  onCreateService?: (category?: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <Collapse in={expanded} timeout="auto" unmountOnExit sx={{ width: '100%' }}>
      <Stack spacing={0} sx={{ width: '100%' }}>
        {opportunities.map((opportunity) => (
          <OpportunityCardExpandedItem
            key={opportunity.need_id}
            opportunity={opportunity}
            hasMatchingService={
              matchedNeedIds
                ? matchedNeedIds.has(opportunity.need_id)
                : hasMatchingService
            }
            onCreateService={() =>
              onCreateService
                ? onCreateService(opportunity.category)
                : navigate(`/vendors/create?category=${opportunity.category}`)
            }
          />
        ))}
      </Stack>
    </Collapse>
  );
}

function OpportunityCardExpandedItem({
  opportunity,
  hasMatchingService,
  onCreateService,
}: {
  opportunity: VendorOpportunity;
  hasMatchingService: boolean;
  onCreateService: () => void;
}) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedComp, setSelectedComp] = useState<'free' | 'discount' | 'cash'>(
    'free',
  );
  const [message, setMessage] = useState('');

  const { data: applicationsData } = useQuery({
    queryKey: ['myApplications'],
    queryFn: fetchMyApplications,
    enabled: isAuthenticated,
  });

  const myApplication = useMemo(() => {
    const apps = applicationsData?.data || [];
    return apps.find((app) => app.need === opportunity.need_id) || null;
  }, [applicationsData, opportunity.need_id]);

  const applyMutation = useMutation({
    mutationFn: (payload: { message?: string; proposed_price?: number | null }) =>
      applyToNeed(opportunity.need_id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      queryClient.invalidateQueries({ queryKey: ['eventNeeds'] });
      queryClient.invalidateQueries({ queryKey: ['myVendorOpportunities'] });
      queryClient.invalidateQueries({ queryKey: ['my-home'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });

  const { actionType, rewardLabel, detailTitle, discountPercent, discountValue } =
    getOpportunityCardState(opportunity, hasMatchingService, myApplication?.status);

  const numericReward = Number(opportunity.budget_max || opportunity.budget_min || 0);

  const handleSubmitApplication = (e: React.MouseEvent) => {
    e.stopPropagation();
    const proposedPrice =
      selectedComp === 'free'
        ? 0
        : selectedComp === 'discount'
          ? discountValue
          : numericReward;
    applyMutation.mutate({
      message: message || undefined,
      proposed_price: proposedPrice,
    });
  };

  const handleNavigateToManagement = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/events/${opportunity.event_id}/service-event-management`);
  };

  const showTermsSection = actionType === 'invite' || actionType === 'inquiry';
  const showCompensationPicker = actionType === 'invite' || actionType === 'inquiry';

  return (
    <Stack
      spacing={1.5}
      sx={{
        width: '100%',
        px: 2,
        backgroundColor: '#ffffff',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 1.2,
          width: '100%',
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
            {actionType === 'servicing'
              ? `You're assigned as ${opportunity.need_title}`
              : actionType === 'already-applied'
                ? `${opportunity.need_title} — application pending`
                : actionType === 'invite'
                  ? 'You were personally invited for this role'
                  : actionType === 'inquiry'
                    ? `${opportunity.need_title} needed · 1 slot open`
                    : `${opportunity.need_title} needed`}
          </Typography>
          <Typography
            sx={{ mt: 0.5, fontSize: 12, color: '#6b7280', lineHeight: 1.45 }}
          >
            {actionType === 'servicing'
              ? 'You are confirmed for this role. Head to event management to coordinate with the host.'
              : actionType === 'already-applied'
                ? 'The host is reviewing your application. You will be notified when they respond.'
                : actionType === 'invite'
                  ? "The host thinks you'd be great for this. No pressure — read the terms and decide."
                  : actionType === 'inquiry'
                    ? `${opportunity.need_description || 'Contribute during the event.'} · You pick your compensation.`
                    : 'Are you up for providing it?'}
          </Typography>
        </Box>

        {showTermsSection ? (
          <Box sx={{ width: '100%' }}>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6b7280',
                mb: 1,
              }}
            >
              {detailTitle}
            </Typography>
            <Stack spacing={0.9}>
              <Typography sx={{ fontSize: 13, color: '#111827', lineHeight: 1.5 }}>
                <Box component="span" sx={{ fontWeight: 600 }}>
                  What you'll do:{' '}
                </Box>
                {opportunity.need_description ||
                  `Contribute for ${opportunity.need_title} during the event window.`}
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#111827', lineHeight: 1.5 }}>
                <Box component="span" sx={{ fontWeight: 600 }}>
                  What you get:{' '}
                </Box>
                Your choice — free entry, {discountPercent}% discount, or {rewardLabel}{' '}
                cash.
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#111827', lineHeight: 1.5 }}>
                <Box component="span" sx={{ fontWeight: 600 }}>
                  If it gets cancelled:{' '}
                </Box>
                You'll still receive your full compensation regardless of when or why
                it's cancelled.
              </Typography>
            </Stack>
          </Box>
        ) : null}

        {showCompensationPicker ? (
          <Box sx={{ width: '100%' }}>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6b7280',
                mb: 0.8,
              }}
            >
              Pick compensation
            </Typography>
            <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', gap: 0.8 }}>
              <Chip
                label="Free entry"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedComp('free');
                }}
                size="small"
                sx={{
                  borderRadius: '999px',
                  fontSize: 12,
                  fontWeight: 500,
                  border:
                    selectedComp === 'free' ? '2px solid #D85A30' : '1px solid #e5e7eb',
                  backgroundColor: selectedComp === 'free' ? '#FAECE7' : '#fff',
                  color: selectedComp === 'free' ? '#712B13' : '#374151',
                }}
              />
              <Chip
                label={`${discountPercent}% discount${discountValue ? ` (save Rs ${discountValue})` : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedComp('discount');
                }}
                size="small"
                sx={{
                  borderRadius: '999px',
                  fontSize: 12,
                  fontWeight: 500,
                  border:
                    selectedComp === 'discount'
                      ? '2px solid #D85A30'
                      : '1px solid #e5e7eb',
                  backgroundColor: selectedComp === 'discount' ? '#FAECE7' : '#fff',
                  color: selectedComp === 'discount' ? '#712B13' : '#374151',
                }}
              />
              <Chip
                label={`${rewardLabel} cash`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedComp('cash');
                }}
                size="small"
                sx={{
                  borderRadius: '999px',
                  fontSize: 12,
                  fontWeight: 500,
                  border:
                    selectedComp === 'cash' ? '2px solid #D85A30' : '1px solid #e5e7eb',
                  backgroundColor: selectedComp === 'cash' ? '#FAECE7' : '#fff',
                  color: selectedComp === 'cash' ? '#712B13' : '#374151',
                }}
              />
            </Stack>
          </Box>
        ) : null}

        {actionType === 'inquiry' ? (
          <TextField
            onClick={(e) => e.stopPropagation()}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hey, I'd love to help — here's why I'm a good fit..."
            multiline
            minRows={3}
            fullWidth
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: 13,
                borderRadius: 1.5,
                '& fieldset': { borderColor: 'rgba(17,24,39,0.12)' },
                '&:hover fieldset': { borderColor: '#D85A30' },
                '&.Mui-focused fieldset': { borderWidth: 2, borderColor: '#D85A30' },
              },
            }}
          />
        ) : null}
      </Box>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          justifyContent: actionType === 'invite' ? 'space-between' : 'flex-end',
          flexWrap: 'wrap',
          pt: actionType === 'create-service' ? 0.5 : 0,
        }}
      >
        {actionType === 'servicing' ? (
          <Button
            onClick={handleNavigateToManagement}
            variant="contained"
            size="medium"
            sx={{
              borderRadius: '999px',
              textTransform: 'none',
              fontWeight: 600,
              px: 2.5,
              backgroundColor: '#1D9E75',
              color: '#fff',
              '&:hover': { backgroundColor: '#15803d' },
            }}
          >
            Go to event management
          </Button>
        ) : actionType === 'already-applied' ? (
          <Button
            onClick={handleNavigateToManagement}
            variant="outlined"
            size="medium"
            sx={{
              borderRadius: '999px',
              textTransform: 'none',
              fontWeight: 600,
              px: 2.5,
              borderColor: '#D85A30',
              color: '#D85A30',
              '&:hover': {
                borderColor: '#c04d26',
                backgroundColor: 'rgba(216,90,48,0.04)',
              },
            }}
          >
            View application status
          </Button>
        ) : actionType === 'invite' ? (
          <>
            <Button
              onClick={(e) => e.stopPropagation()}
              variant="outlined"
              size="medium"
              sx={{
                borderColor: '#d1d5db',
                color: '#6b7280',
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 600,
                px: 2,
                '&:hover': {
                  borderColor: '#9ca3af',
                  backgroundColor: 'rgba(0,0,0,0.02)',
                },
              }}
            >
              Not this time
            </Button>
            <Button
              onClick={handleSubmitApplication}
              disabled={applyMutation.isPending}
              variant="contained"
              size="medium"
              sx={{
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
                backgroundColor: '#1D9E75',
                color: '#fff',
                '&:hover': { backgroundColor: '#15803d' },
              }}
            >
              {applyMutation.isPending ? 'Sending...' : "I'm in"}
            </Button>
          </>
        ) : actionType === 'inquiry' ? (
          <Button
            onClick={handleSubmitApplication}
            disabled={applyMutation.isPending}
            variant="contained"
            size="medium"
            sx={{
              borderRadius: '999px',
              textTransform: 'none',
              fontWeight: 600,
              px: 2.5,
              backgroundColor: '#D85A30',
              color: '#fff',
              '&:hover': { backgroundColor: '#c04d26' },
            }}
          >
            {applyMutation.isPending ? 'Sending...' : 'Send application'}
          </Button>
        ) : (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onCreateService();
            }}
            variant="contained"
            size="medium"
            sx={{
              borderRadius: '999px',
              textTransform: 'none',
              fontWeight: 600,
              px: 2.5,
              backgroundColor: '#0d9488',
              color: '#fff',
              '&:hover': { backgroundColor: '#0f766e' },
            }}
          >
            Create service
          </Button>
        )}
      </Stack>
      {applyMutation.isSuccess ? (
        <Typography
          sx={{ fontSize: 12, fontWeight: 600, color: '#1D9E75', textAlign: 'right' }}
        >
          Application sent!
        </Typography>
      ) : null}
      {applyMutation.isError ? (
        <Typography
          sx={{ fontSize: 12, fontWeight: 600, color: '#dc2626', textAlign: 'right' }}
        >
          Something went wrong. Please try again.
        </Typography>
      ) : null}
    </Stack>
  );
}

export function OpportunityCard({
  opportunity,
  hasMatchingService,
  onCreateService,
  onClick,
}: {
  opportunity: VendorOpportunity;
  hasMatchingService: boolean;
  onCreateService?: (category?: string) => void;
  onClick: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { actionType, theme, rewardLabel, chipLabel, roleIcon } =
    getOpportunityCardState(opportunity, hasMatchingService);
  const eventDay = formatEventDayLabel(opportunity.event_start_time);
  const eventTime = formatEventTimeLabel(opportunity.event_start_time);

  const handleChipClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        border: '1px solid',
        borderColor: 'rgba(17,24,39,0.06)',
        borderLeft: `4px solid ${theme.borderLeft}`,
        borderRadius: 2,
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        p: 2,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          borderColor: 'rgba(17,24,39,0.1)',
        },
      }}
    >
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            backgroundColor: theme.iconBg,
            color: theme.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {roleIcon}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 1,
              alignItems: 'flex-start',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 15,
                  fontWeight: 800,
                  color: '#111827',
                  lineHeight: 1.3,
                  letterSpacing: '-0.01em',
                }}
              >
                {opportunity.need_title}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#6b7280', mt: 0.4 }}>
                {opportunity.event_title} · {eventDay} · {eventTime}
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 14,
                  fontWeight: 700,
                  color: theme.rewardColor,
                }}
              >
                {rewardLabel}
              </Typography>
              <Typography sx={{ fontSize: 10, color: '#6b7280', mt: 0.2 }}>
                upon delivery
              </Typography>
            </Box>
          </Box>

          <Typography
            sx={{
              fontSize: 12,
              color: '#6b7280',
              mt: 1,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {opportunity.need_description || 'Open contributor slot for this event.'}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1.5,
              gap: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                color: '#6b7280',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {opportunity.event_location_name}
            </Typography>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                color: theme.rewardColor,
              }}
            >
              View event →
            </Typography>
          </Box>

          <Chip
            label={chipLabel}
            onClick={handleChipClick}
            size="small"
            sx={{
              mt: 1.25,
              borderRadius: '999px',
              fontSize: 12,
              fontWeight: 700,
              color: theme.chipColor,
              backgroundColor: theme.chipBg,
              border: theme.chipBorder,
              '& .MuiChip-label': { px: 1.5, py: 0.5 },
              '&:hover': {
                backgroundColor:
                  actionType === 'create-service' ? '#CCFBF1' : theme.chipBg,
                opacity: 0.95,
              },
            }}
          />
        </Box>
      </Box>

      <OpportunityCardExpandedSection
        opportunities={[opportunity]}
        hasMatchingService={hasMatchingService}
        expanded={expanded}
        onCreateService={onCreateService}
      />
    </Box>
  );
}
