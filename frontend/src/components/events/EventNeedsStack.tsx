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
import { type MouseEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { applyToNeed } from '@/features/needs/api';
import { useServices } from '@/features/vendors/ServicesContext';
import type { BaseFeedEventItem, BaseFeedNeed } from '@/types/events';
import type { VendorService } from '@/types/vendors';
import { stat } from 'fs';

type CompensationOption = 'free' | 'discount' | 'cash';

type EventNeedsStackProps = {
  event: BaseFeedEventItem;
  needs: BaseFeedNeed[];
};

type NeedCardState =
  | 'host-open'
  | 'filled'
  | 'applied'
  | 'servicing'
  | 'create-service'
  | 'apply';

function getCompensationChipStyles(selected: boolean) {
  return {
    borderRadius: '999px',
    fontSize: 12,
    fontWeight: 500,
    border: selected ? '2px solid #D85A30' : '1px solid #e5e7eb',
    backgroundColor: selected ? '#FAECE7' : '#fff',
    color: selected ? '#712B13' : '#374151',
  };
}

function getNeedCardState(
  event: BaseFeedEventItem,
  need: BaseFeedNeed,
  hasMatchingService: boolean,
): NeedCardState {
  const isAssignedToMe = Boolean(need.assigned_vendor?.i_am_assigned_vendor);
  const hasApplied =
    need.i_have_applied ||
    need.applications.some((application) => application.i_have_applied);
  const isFilled =
    need.status === 'filled' ||
    need.status === 'override_filled' ||
    Boolean(need.assigned_vendor);

  if (event.i_am_host) {
    return isFilled ? 'filled' : 'host-open';
  }

  if (isAssignedToMe) {
    return 'servicing';
  }

  if (hasApplied) {
    return 'applied';
  }

  if (isFilled) {
    return 'filled';
  }

  return hasMatchingService ? 'apply' : 'create-service';
}

function getNeedActionMeta(state: NeedCardState) {
  switch (state) {
    case 'servicing':
      return {
        label: 'Go to management',
        text: '#0F6E56',
        bg: '#E1F5EE',
        border: '#1D9E75',
      };
    case 'applied':
      return {
        label: 'View status',
        text: '#712B13',
        bg: '#FAECE7',
        border: '#D85A30',
      };
    case 'apply':
      return {
        label: 'Apply now',
        text: '#712B13',
        bg: '#FAECE7',
        border: '#D85A30',
      };
    case 'create-service':
      return {
        label: 'Create service',
        text: '#0f766e',
        bg: '#CCFBF1',
        border: '#0d9488',
      };
      case 'host-open':
      return {
        label: 'Edit Need',
        text: '#ffffff',
        bg: '#04235E',
        border: '#2792Ef',
      };
    case 'filled':
      return {
        label: 'Filled',
        text: '#0F6E56',
        bg: '#E1F5EE',
        border: '#1D9E75',
      };
    default:
      return {
        label: 'Open',
        text: '#633806',
        bg: '#FAEEDA',
        border: '#EF9F27',
      };
  }
}

function getNeedSubtitle(
  event: BaseFeedEventItem,
  need: BaseFeedNeed,
  state: NeedCardState,
) {
  if (state === 'servicing') {
    return 'You are assigned to this need.';
  }

  if (state === 'applied') {
    return 'Application sent. The host is reviewing it.';
  }

  if (need.assigned_vendor) {
    const assigneeName =
      need.assigned_vendor.user.first_name ||
      need.assigned_vendor.user.username ||
      'vendor';
    return event.i_am_host
      ? `Assigned to ${assigneeName}`
      : `Handled by ${assigneeName}`;
  }

  if (need.budget_max || need.budget_min) {
    return `Budget up to Rs ${need.budget_max || need.budget_min}`;
  }

  if (need.application_count > 0) {
    return `${need.application_count} application${need.application_count === 1 ? '' : 's'}`;
  }

  return '';
}

export function EventNeedsStack({ event, needs }: EventNeedsStackProps) {
  const [expandedNeedId, setExpandedNeedId] = useState<number | null>(null);
  const { getMatchingService } = useServices();

  return (
    <Stack spacing={0.9} sx={{ width: '100%' }}>
      {needs.map((need) => {
        const matchingService = getMatchingService(need.category);
        const state = getNeedCardState(event, need, Boolean(matchingService));
        const actionMeta = getNeedActionMeta(state);
        const expanded = expandedNeedId === need.id && state === 'apply';

        return (
          <EventNeedRow
            key={need.id}
            actionMeta={actionMeta}
            event={event}
            expanded={expanded}
            matchingService={matchingService}
            need={need}
            onToggleExpanded={() =>
              setExpandedNeedId(expandedNeedId === need.id ? null : need.id)
            }
            state={state}
            subtitle={getNeedSubtitle(event, need, state)}
          />
        );
      })}
    </Stack>
  );
}

type EventNeedRowProps = {
  actionMeta: ReturnType<typeof getNeedActionMeta>;
  event: BaseFeedEventItem;
  expanded: boolean;
  matchingService: VendorService | null;
  need: BaseFeedNeed;
  onToggleExpanded: () => void;
  state: NeedCardState;
  subtitle: string;
};

function EventNeedRow({
  actionMeta,
  event,
  expanded,
  matchingService,
  need,
  onToggleExpanded,
  state,
  subtitle,
}: EventNeedRowProps) {
  const navigate = useNavigate();
  const { openQuickCreateService } = useServices();
  const isActionable =
    state === 'apply' ||
    state === 'create-service' ||
    state === 'servicing' ||
    state === 'host-open' ||
    state === 'applied';

  const handleActionClick = (interactionEvent: MouseEvent) => {
    interactionEvent.stopPropagation();
    interactionEvent.preventDefault();

    if (state === 'servicing' || state === 'applied') {
      navigate(`/managing/services/`);
      return;
    }

    if (state === 'create-service') {
      openQuickCreateService(need.category);
      return;
    }

    if (state === 'apply') {
      onToggleExpanded();
    }
      if (state === 'host-open') {
      navigate(`/events/${event.id}/manage`);
    }
  };

  return (
    <Stack
      spacing={1}
      sx={{
        width: '100%',
        borderRadius: '12px',
        px: 1,
        py: 0.8,
        backgroundColor: 'rgba(255,255,255,0.45)',
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={1}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ 
            fontSize: 11, 
            fontWeight: 700, 
            color: '#412402' }}>
            {((need.category).split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' '))} : 
            <span className='text-gray-500 text-normal font-normal'>
            {' '}{need.title}
          </span>
          </Typography>
          <Typography sx={{ fontSize: 10, color: '#8a5a19', lineHeight: 1.35 }}>
            {subtitle}
          </Typography>
        </Box>

        <Box
          component={isActionable ? 'button' : 'span'}
          onClick={isActionable ? handleActionClick : undefined}
          type={isActionable ? 'button' : undefined}
          sx={{
            alignItems: 'center',
            px: 1,
            borderRadius: '999px',
            border: `1px solid ${actionMeta.border}`,
            backgroundColor:
              expanded || state === 'host-open'
                ? actionMeta.bg
                : 'rgba(255,255,255,0.72)',
            color: actionMeta.text,
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'capitalize',
            cursor: isActionable ? 'pointer' : 'default',
            transition: 'background-color 0.15s ease',
            '&:hover': isActionable ? { backgroundColor: actionMeta.bg } : undefined,
          }}
        >
          {actionMeta.label}
        </Box>
      </Stack>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <EventNeedApplicationPanel
          event={event}
          matchingService={matchingService}
          need={need}
        />
      </Collapse>
    </Stack>
  );
}

function EventNeedApplicationPanel({
  event,
  matchingService,
  need,
}: {
  event: BaseFeedEventItem;
  matchingService: VendorService | null;
  need: BaseFeedNeed;
}) {
  const queryClient = useQueryClient();
  const [selectedComp, setSelectedComp] = useState<CompensationOption>('free');
  const [message, setMessage] = useState('');
  const numericReward = Number(need.budget_max || need.budget_min || 0);
  const discountPercent = numericReward
    ? Math.min(60, Math.max(20, Math.round(numericReward / 10)))
    : 40;
  const discountValue = numericReward
    ? Math.round((numericReward * discountPercent) / 100)
    : 0;
  const rewardLabel =
    need.budget_max || need.budget_min
      ? `Rs ${need.budget_max || need.budget_min}`
      : 'Reward TBD';

  const proposedPrice = useMemo(() => {
    if (selectedComp === 'free') return 0;
    if (selectedComp === 'discount') return discountValue;
    return numericReward;
  }, [discountValue, numericReward, selectedComp]);

  useEffect(() => {
    if (matchingService?.description && !message) {
      setMessage(matchingService.description);
    }
  }, [matchingService?.description, message]);

  const applyMutation = useMutation({
    mutationFn: () =>
      applyToNeed(need.id, {
        message: message || undefined,
        proposed_price: proposedPrice,
        service_id: matchingService?.id ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['eventNeeds'] });
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
    },
  });

  const handleSubmitApplication = (interactionEvent: MouseEvent) => {
    interactionEvent.stopPropagation();
    interactionEvent.preventDefault();
    applyMutation.mutate();
  };

  const stopCardNavigation = (interactionEvent: MouseEvent) => {
    interactionEvent.stopPropagation();
    interactionEvent.preventDefault();
  };

  return (
    <Box
      onClick={stopCardNavigation}
      sx={{
        mt: 0.4,
        borderRadius: '14px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        px: 1.2,
        py: 1.1,
      }}
    >
      <Stack spacing={1.1}>

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
            Description of need
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#111827', lineHeight: 1.5 }}>
            {need.description}
          </Typography>
        </Box>

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
            Possible compensation upon completion
          </Typography>
          <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', gap: 0.8 }}>
            <Chip
              label="Free entry"
              onClick={(interactionEvent) => {
                interactionEvent.stopPropagation();
                interactionEvent.preventDefault();
                setSelectedComp('free');
              }}
              size="small"
              sx={getCompensationChipStyles(selectedComp === 'free')}
            />
            <Chip
              label={`${discountPercent}% discount${discountValue ? ` (save Rs ${discountValue})` : ''}`}
              onClick={(interactionEvent) => {
                interactionEvent.stopPropagation();
                interactionEvent.preventDefault();
                setSelectedComp('discount');
              }}
              size="small"
              sx={getCompensationChipStyles(selectedComp === 'discount')}
            />
            <Chip
              label={`Rs150 cash`}
              onClick={(interactionEvent) => {
                interactionEvent.stopPropagation();
                interactionEvent.preventDefault();
                setSelectedComp('cash');
              }}
              size="small"
              sx={getCompensationChipStyles(selectedComp === 'cash')}
            />
          </Stack>
        </Box>

        <TextField
          onClick={stopCardNavigation}
          value={message}
          onChange={(interactionEvent) => setMessage(interactionEvent.target.value)}
          placeholder="Tell the host why you're a good fit..."
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

        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
          <Button
            onClick={handleSubmitApplication}
            disabled={applyMutation.isPending}
            variant="contained"
            size="small"
            sx={{
              borderRadius: '999px',
              textTransform: 'none',
              fontWeight: 700,
              px: 2,
              backgroundColor: '#1D9E75',
              color: '#fff',
              '&:hover': { backgroundColor: '#15803d' },
            }}
          >
            {applyMutation.isPending ? 'Sending...' : 'Send application'}
          </Button>
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
    </Box>
  );
}
