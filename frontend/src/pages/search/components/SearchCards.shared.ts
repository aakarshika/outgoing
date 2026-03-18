import type { VendorOpportunity } from '@/types/needs';

import { getRoleGroup } from '../searchUtils';

export type NeedApplicationStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | null
  | undefined;

export type CardActionType =
  | 'invite'
  | 'inquiry'
  | 'create-service'
  | 'already-applied'
  | 'servicing';

export type CardTheme = {
  borderLeft: string;
  iconBg: string;
  iconColor: string;
  rewardColor: string;
  chipBg: string;
  chipColor: string;
  chipBorder?: string;
  bannerBg: string;
  expandRadius: string;
};

export const CARD_THEMES: Record<CardActionType, CardTheme> = {
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

export function getOpportunityCardState(
  opportunity: VendorOpportunity,
  hasMatchingService: boolean,
  applicationStatus?: NeedApplicationStatus,
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

export function getNeedsSummaryLabel(titles: string[], max = 2) {
  if (titles.length === 0) return '';
  if (titles.length === 1) return titles[0];
  if (titles.length <= max) {
    return titles.slice(0, -1).join(', ') + ' and ' + titles[titles.length - 1];
  }

  const shown = titles.slice(0, max).join(', ');
  const remaining = titles.length - max;
  return `${shown}, and ${remaining} other${remaining > 1 ? 's' : ''}`;
}

export type AggregateStatus = {
  label: string;
  bg: string;
  color: string;
  border: string;
};

export function getAggregateStatus(
  opportunities: VendorOpportunity[],
  applicationByNeedId: Map<
    number,
    { status: Exclude<NeedApplicationStatus, null | undefined> }
  >,
): AggregateStatus {
  let hasAccepted = false;
  let hasPending = false;
  let hasInvite = false;

  for (const opportunity of opportunities) {
    const application = applicationByNeedId.get(opportunity.need_id);
    if (application?.status === 'accepted') hasAccepted = true;
    else if (application?.status === 'pending') hasPending = true;
    if (opportunity.is_invited) hasInvite = true;
  }

  if (hasAccepted) {
    return {
      label: 'Servicing here',
      bg: '#E1F5EE',
      color: '#0F6E56',
      border: '1px solid #1D9E75',
    };
  }

  if (hasPending) {
    return {
      label: 'You have applied',
      bg: '#FAECE7',
      color: '#712B13',
      border: '1px solid #D85A30',
    };
  }

  if (hasInvite) {
    return {
      label: 'You have been invited',
      bg: '#EEEDFE',
      color: '#26215C',
      border: '1px solid #534AB7',
    };
  }

  if (opportunities.length > 1) {
    return {
      label: 'Multiple opportunities',
      bg: '#FAEEDA',
      color: '#633806',
      border: '1px solid #EF9F27',
    };
  }

  return {
    label: 'Open opportunity',
    bg: '#FAEEDA',
    color: '#633806',
    border: '1px solid #EF9F27',
  };
}

export type NeedActionKind =
  | 'create-service'
  | 'invite-received'
  | 'send-inquiry'
  | 'application-sent'
  | 'you-are-servicing';

export type NeedActionConfig = {
  kind: NeedActionKind;
  label: string;
  color: { text: string; bg: string; border: string };
};

export function getNeedActionConfig(
  opportunity: VendorOpportunity,
  hasMatchingService: boolean,
  applicationStatus?: NeedApplicationStatus,
): NeedActionConfig {
  if (applicationStatus === 'accepted') {
    return {
      kind: 'you-are-servicing',
      label: 'you are servicing',
      color: { text: '#0F6E56', bg: '#E1F5EE', border: '#1D9E75' },
    };
  }

  if (applicationStatus === 'pending') {
    return {
      kind: 'application-sent',
      label: 'application sent',
      color: { text: '#712B13', bg: '#FAECE7', border: '#D85A30' },
    };
  }

  if (opportunity.is_invited) {
    return {
      kind: 'invite-received',
      label: 'invite received',
      color: { text: '#26215C', bg: '#EEEDFE', border: '#534AB7' },
    };
  }

  if (hasMatchingService) {
    return {
      kind: 'send-inquiry',
      label: 'send inquiry',
      color: { text: '#712B13', bg: '#FAECE7', border: '#D85A30' },
    };
  }

  return {
    kind: 'create-service',
    label: 'create service',
    color: { text: '#0f766e', bg: '#CCFBF1', border: '#0d9488' },
  };
}
