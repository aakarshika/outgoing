import { Box, Button, Chip, Collapse, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { type MouseEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks';
import { fetchMyApplications } from '@/features/needs/api';
import type { NeedApplication, VendorOpportunity } from '@/types/needs';

import { formatEventDayLabel, formatEventTimeLabel } from '../searchUtils';
import {
  ApplicationFeedback,
  ApplicationMessageField,
  CompensationPicker,
  OpportunityTerms,
  useOpportunityApplicationForm,
} from './SearchCards.application';
import { getOpportunityCardState } from './SearchCards.shared';

type OpportunityCardExpandedSectionProps = {
  applicationsData?: { success: boolean; data: NeedApplication[] };
  opportunities: VendorOpportunity[];
  hasMatchingService: boolean;
  matchedNeedIds?: Set<number>;
  expanded: boolean;
  onCreateService?: (category?: string) => void;
};

export function OpportunityCardExpandedSection({
  applicationsData,
  opportunities,
  hasMatchingService,
  matchedNeedIds,
  expanded,
  onCreateService,
}: OpportunityCardExpandedSectionProps) {
  const navigate = useNavigate();

  return (
    <Collapse in={expanded} timeout="auto" unmountOnExit sx={{ width: '100%' }}>
      <Stack spacing={0} sx={{ width: '100%' }}>
        {opportunities.map((opportunity) => (
          <OpportunityCardExpandedItem
            application={
              applicationsData?.data.find(
                (application) => application.need_id === opportunity.need_id,
              ) || null
            }
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

type OpportunityCardExpandedItemProps = {
  application: NeedApplication | null;
  opportunity: VendorOpportunity;
  hasMatchingService: boolean;
  onCreateService: () => void;
};

function OpportunityCardExpandedItem({
  application,
  opportunity,
  hasMatchingService,
  onCreateService,
}: OpportunityCardExpandedItemProps) {
  const navigate = useNavigate();
  const { actionType, rewardLabel, detailTitle, discountPercent, discountValue } =
    getOpportunityCardState(opportunity, hasMatchingService, application?.status);
  const {
    applyMutation,
    handleSubmitApplication,
    message,
    selectedComp,
    setMessage,
    setSelectedComp,
  } = useOpportunityApplicationForm(opportunity);

  const showInteractiveApplication =
    actionType === 'invite' || actionType === 'inquiry';

  const handleNavigateToManagement = (event: MouseEvent) => {
    event.stopPropagation();
    navigate(`/events/${opportunity.event_id}/service-event-management`);
  };

  return (
    <Stack spacing={1.5} sx={{ width: '100%', px: 2, backgroundColor: '#ffffff' }}>
      <OpportunityExpandedHeader actionType={actionType} opportunity={opportunity} />

      {showInteractiveApplication ? (
        <>
          <OpportunityTerms
            title={detailTitle}
            description={opportunity.need_description}
            needTitle={opportunity.need_title}
            discountPercent={discountPercent}
            rewardLabel={rewardLabel}
            showCancellationPolicy
          />
          <CompensationPicker
            discountPercent={discountPercent}
            discountValue={discountValue}
            rewardLabel={rewardLabel}
            selectedComp={selectedComp}
            setSelectedComp={setSelectedComp}
          />
        </>
      ) : null}

      {actionType === 'inquiry' ? (
        <ApplicationMessageField
          message={message}
          onChange={setMessage}
          placeholder="Hey, I'd love to help - here's why I'm a good fit..."
        />
      ) : null}

      <OpportunityExpandedActions
        actionType={actionType}
        applyPending={applyMutation.isPending}
        onCreateService={onCreateService}
        onNavigateToManagement={handleNavigateToManagement}
        onSubmitApplication={(event) => handleSubmitApplication(event, discountValue)}
      />

      <ApplicationFeedback
        isSuccess={applyMutation.isSuccess}
        isError={applyMutation.isError}
      />
    </Stack>
  );
}

type OpportunityExpandedHeaderProps = {
  actionType: ReturnType<typeof getOpportunityCardState>['actionType'];
  opportunity: VendorOpportunity;
};

function OpportunityExpandedHeader({
  actionType,
  opportunity,
}: OpportunityExpandedHeaderProps) {
  return (
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
              ? `${opportunity.need_title} - application pending`
              : actionType === 'invite'
                ? 'You were personally invited for this role'
                : actionType === 'inquiry'
                  ? `${opportunity.need_title} needed - 1 slot open`
                  : `${opportunity.need_title} needed`}
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 12, color: '#6b7280', lineHeight: 1.45 }}>
          {actionType === 'servicing'
            ? 'You are confirmed for this role. Head to event management to coordinate with the host.'
            : actionType === 'already-applied'
              ? 'The host is reviewing your application. You will be notified when they respond.'
              : actionType === 'invite'
                ? "The host thinks you'd be great for this. No pressure - read the terms and decide."
                : actionType === 'inquiry'
                  ? `${opportunity.need_description || 'Contribute during the event.'} - You pick your compensation.`
                  : 'Are you up for providing it?'}
        </Typography>
      </Box>
    </Box>
  );
}

type OpportunityExpandedActionsProps = {
  actionType: ReturnType<typeof getOpportunityCardState>['actionType'];
  applyPending: boolean;
  onCreateService: () => void;
  onNavigateToManagement: (event: MouseEvent) => void;
  onSubmitApplication: (event: MouseEvent) => void;
};

function OpportunityExpandedActions({
  actionType,
  applyPending,
  onCreateService,
  onNavigateToManagement,
  onSubmitApplication,
}: OpportunityExpandedActionsProps) {
  return (
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
          onClick={onNavigateToManagement}
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
          onClick={onNavigateToManagement}
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
            onClick={(event) => event.stopPropagation()}
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
            onClick={onSubmitApplication}
            disabled={applyPending}
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
            {applyPending ? 'Sending...' : "I'm in"}
          </Button>
        </>
      ) : actionType === 'inquiry' ? (
        <Button
          onClick={onSubmitApplication}
          disabled={applyPending}
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
          {applyPending ? 'Sending...' : 'Send application'}
        </Button>
      ) : (
        <Button
          onClick={(event) => {
            event.stopPropagation();
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
  );
}

type OpportunityCardProps = {
  opportunity: VendorOpportunity;
  hasMatchingService: boolean;
  onCreateService?: (category?: string) => void;
  onClick: () => void;
};

export function OpportunityCard({
  opportunity,
  hasMatchingService,
  onCreateService,
  onClick,
}: OpportunityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { isAuthenticated } = useAuth();
  const { data: applicationsData } = useQuery({
    queryKey: ['myApplications'],
    queryFn: fetchMyApplications,
    enabled: isAuthenticated,
  });

  const myApplication = useMemo(() => {
    const applications = applicationsData?.data || [];
    return (
      applications.find((application) => application.need_id === opportunity.need_id) ||
      null
    );
  }, [applicationsData, opportunity.need_id]);

  const { theme, rewardLabel, chipLabel, roleIcon } = getOpportunityCardState(
    opportunity,
    hasMatchingService,
    myApplication?.status,
  );
  const eventDay = formatEventDayLabel(opportunity.event_start_time);
  const eventTime = formatEventTimeLabel(opportunity.event_start_time);

  const handleChipClick = (event: MouseEvent) => {
    event.stopPropagation();
    setExpanded((previous) => !previous);
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        border: '1px solid',
        borderColor: 'rgba(17,24,39,0.06)',
        borderLeft: `4px solid ${theme.borderLeft}`,
        borderRadius: '12px',
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
      <OpportunityCardSummary
        chipLabel={chipLabel}
        eventDay={eventDay}
        eventTime={eventTime}
        iconBackgroundColor={theme.iconBg}
        iconColor={theme.iconColor}
        onChipClick={handleChipClick}
        opportunity={opportunity}
        rewardLabel={rewardLabel}
        roleIcon={roleIcon}
        rewardColor={theme.rewardColor}
        chipColor={theme.chipColor}
        chipBackgroundColor={theme.chipBg}
        chipBorder={theme.chipBorder}
      />

      <OpportunityCardExpandedSection
        applicationsData={applicationsData || { success: true, data: [] }}
        opportunities={[opportunity]}
        hasMatchingService={hasMatchingService}
        expanded={expanded}
        onCreateService={onCreateService}
      />
    </Box>
  );
}

type OpportunityCardSummaryProps = {
  chipLabel: string;
  chipColor: string;
  chipBackgroundColor: string;
  chipBorder?: string;
  eventDay: string;
  eventTime: string;
  iconBackgroundColor: string;
  iconColor: string;
  onChipClick: (event: MouseEvent) => void;
  opportunity: VendorOpportunity;
  rewardColor: string;
  rewardLabel: string;
  roleIcon: string;
};

function OpportunityCardSummary({
  chipLabel,
  chipColor,
  chipBackgroundColor,
  chipBorder,
  eventDay,
  eventTime,
  iconBackgroundColor,
  iconColor,
  onChipClick,
  opportunity,
  rewardColor,
  rewardLabel,
  roleIcon,
}: OpportunityCardSummaryProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '12px',
          backgroundColor: iconBackgroundColor,
          color: iconColor,
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
                color: rewardColor,
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
              color: rewardColor,
            }}
          >
            View event →
          </Typography>
        </Box>

        <Chip
          label={chipLabel}
          onClick={onChipClick}
          size="small"
          sx={{
            mt: 1.25,
            borderRadius: '999px',
            fontSize: 12,
            fontWeight: 700,
            color: chipColor,
            backgroundColor: chipBackgroundColor,
            border: chipBorder,
            '& .MuiChip-label': { px: 1.5, py: 0.5 },
            '&:hover': {
              backgroundColor: chipBackgroundColor,
              opacity: 0.95,
            },
          }}
        />
      </Box>
    </Box>
  );
}
