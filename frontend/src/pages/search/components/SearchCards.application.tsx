import { Box, Chip, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type MouseEvent, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/hooks';
import { applyToNeed } from '@/features/needs/api';
import { fetchMyServices } from '@/features/vendors/api';
import type { VendorOpportunity } from '@/types/needs';

export type CompensationOption = 'free' | 'discount' | 'cash';

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

export function useOpportunityApplicationForm(opportunity: VendorOpportunity) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedComp, setSelectedComp] = useState<CompensationOption>('free');
  const [message, setMessage] = useState('');

  const { data: myServicesData } = useQuery({
    queryKey: ['myServices'],
    queryFn: fetchMyServices,
    enabled: isAuthenticated,
  });

  const matchedServiceDescription = useMemo(() => {
    const services = myServicesData?.data || [];
    const match = services.find((service) => service.category === opportunity.category);
    return match?.description || '';
  }, [myServicesData, opportunity.category]);

  const matchedServiceId = useMemo(() => {
    const services = myServicesData?.data || [];
    const match = services.find((service) => service.category === opportunity.category);
    return match?.id ?? null;
  }, [myServicesData, opportunity.category]);

  useEffect(() => {
    if (matchedServiceDescription && !message) {
      setMessage(matchedServiceDescription);
    }
  }, [matchedServiceDescription, message]);

  const applyMutation = useMutation({
    mutationFn: (payload: {
      message?: string;
      proposed_price?: number | null;
      service_id?: number | null;
    }) => applyToNeed(opportunity.need_id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      queryClient.invalidateQueries({ queryKey: ['eventNeeds'] });
      queryClient.invalidateQueries({ queryKey: ['myVendorOpportunities'] });
      queryClient.invalidateQueries({ queryKey: ['my-home'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });

  const numericReward = Number(opportunity.budget_max || opportunity.budget_min || 0);

  const handleSubmitApplication = (event: MouseEvent, discountValue: number) => {
    event.stopPropagation();

    const proposedPrice =
      selectedComp === 'free'
        ? 0
        : selectedComp === 'discount'
          ? discountValue
          : numericReward;

    applyMutation.mutate({
      message: message || undefined,
      proposed_price: proposedPrice,
      service_id: matchedServiceId,
    });
  };

  return {
    applyMutation,
    handleSubmitApplication,
    message,
    selectedComp,
    setMessage,
    setSelectedComp,
  };
}

type OpportunityTermsProps = {
  title: string;
  description?: string | null;
  needTitle: string;
  discountPercent: number;
  rewardLabel: string;
  compact?: boolean;
  showCancellationPolicy?: boolean;
};

export function OpportunityTerms({
  title,
  description,
  needTitle,
  discountPercent,
  rewardLabel,
  compact = false,
  showCancellationPolicy = false,
}: OpportunityTermsProps) {
  const bodyFontSize = compact ? 12 : 13;
  const bodyWeight = compact ? 700 : 600;

  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#6b7280',
          mb: compact ? 0.8 : 1,
        }}
      >
        {title}
      </Typography>
      <Stack spacing={compact ? 0.75 : 0.9}>
        <Typography sx={{ fontSize: bodyFontSize, color: '#111827', lineHeight: 1.5 }}>
          <Box component="span" sx={{ fontWeight: bodyWeight }}>
            What you'll do:{' '}
          </Box>
          {description || `Contribute for ${needTitle} during the event window.`}
        </Typography>
        <Typography sx={{ fontSize: bodyFontSize, color: '#111827', lineHeight: 1.5 }}>
          <Box component="span" sx={{ fontWeight: bodyWeight }}>
            What you get:{' '}
          </Box>
          Your choice of free entry, {discountPercent}% discount, or {rewardLabel} cash.
        </Typography>
        {showCancellationPolicy ? (
          <Typography
            sx={{ fontSize: bodyFontSize, color: '#111827', lineHeight: 1.5 }}
          >
            <Box component="span" sx={{ fontWeight: bodyWeight }}>
              If it gets cancelled:{' '}
            </Box>
            You'll still receive your full compensation regardless of when or why it's
            cancelled.
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}

type CompensationPickerProps = {
  discountPercent: number;
  discountValue: number;
  rewardLabel: string;
  selectedComp: CompensationOption;
  setSelectedComp: (value: CompensationOption) => void;
};

export function CompensationPicker({
  discountPercent,
  discountValue,
  rewardLabel,
  selectedComp,
  setSelectedComp,
}: CompensationPickerProps) {
  return (
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
          onClick={(event) => {
            event.stopPropagation();
            setSelectedComp('free');
          }}
          size="small"
          sx={getCompensationChipStyles(selectedComp === 'free')}
        />
        <Chip
          label={`${discountPercent}% discount${discountValue ? ` (save Rs ${discountValue})` : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            setSelectedComp('discount');
          }}
          size="small"
          sx={getCompensationChipStyles(selectedComp === 'discount')}
        />
        <Chip
          label={`${rewardLabel} cash`}
          onClick={(event) => {
            event.stopPropagation();
            setSelectedComp('cash');
          }}
          size="small"
          sx={getCompensationChipStyles(selectedComp === 'cash')}
        />
      </Stack>
    </Box>
  );
}

type ApplicationMessageFieldProps = {
  message: string;
  onChange: (value: string) => void;
  placeholder: string;
};

export function ApplicationMessageField({
  message,
  onChange,
  placeholder,
}: ApplicationMessageFieldProps) {
  return (
    <TextField
      onClick={(event) => event.stopPropagation()}
      value={message}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
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
  );
}

type ApplicationFeedbackProps = {
  isSuccess: boolean;
  isError: boolean;
};

export function ApplicationFeedback({ isSuccess, isError }: ApplicationFeedbackProps) {
  if (isSuccess) {
    return (
      <Typography
        sx={{ fontSize: 12, fontWeight: 600, color: '#1D9E75', textAlign: 'right' }}
      >
        Application sent!
      </Typography>
    );
  }

  if (isError) {
    return (
      <Typography
        sx={{ fontSize: 12, fontWeight: 600, color: '#dc2626', textAlign: 'right' }}
      >
        Something went wrong. Please try again.
      </Typography>
    );
  }

  return null;
}
