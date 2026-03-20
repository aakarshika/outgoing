import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import type { EventNeed } from '@/types/needs';
import type { EventTicketTier } from '@/types/events';

import type { EventFeature } from '../manage/ManageDetailsSection';

export const eventDetailsFallback = [
  { label: 'Date & time', value: 'Sat 15 Mar · 8:00 PM' },
  { label: 'Location', value: 'Indiranagar Social, Bengaluru' },
  { label: 'Category', value: 'Music' },
  { label: 'Format', value: 'In person · One-time' },
] as const;

export const ticketRowsFallback = [
  {
    name: 'Early Bird',
    price: '₹250',
    sold: '20 / 20 sold',
    progress: 100,
    color: '#D85A30',
  },
  {
    name: 'Standard',
    price: '₹350',
    sold: '14 / 20 sold',
    progress: 70,
    color: '#D85A30',
  },
  {
    name: 'Contributor',
    price: 'Free',
    sold: '0 / 5 filled',
    progress: 0,
    color: '#1D9E75',
  },
] as const;

export type EditableTicketTier = {
  id?: number | string;
  name: string;
  price: number | string;
  admits: number | string;
  max_passes_per_ticket: number | string;
  capacity: number | '' | null;
  description: string;
  refund_percentage?: number;
};

export type EditableFeature = EventFeature & {
  outsourced?: boolean;
};

export function formatDateLabel(dateString?: string | null) {
  if (!dateString) return 'Date TBD';
  const date = new Date(dateString);
  return `${date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })} · ${date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

/** Sum of tier capacities when every tier has a cap; null if any tier is unlimited or there are no tiers. */
export function totalCapacityFromTiers(
  tiers: EventTicketTier[] | undefined | null,
): number | null {
  const list = tiers ?? [];
  if (list.length === 0) return null;
  if (list.some((t) => t.capacity == null)) return null;
  return list.reduce((sum, t) => sum + (t.capacity ?? 0), 0);
}

/** Short label for totals / unlimited tiers (display only). */
export function formatTierCapacitySummary(tiers: EventTicketTier[] | undefined | null): string {
  const list = tiers ?? [];
  if (list.length === 0) return 'No tiers yet';
  const cappedSum = list.reduce((sum, t) => sum + (t.capacity ?? 0), 0);
  const hasUncapped = list.some((t) => t.capacity == null);
  if (!hasUncapped) return `${cappedSum} total seats`;
  if (cappedSum === 0) return 'Unlimited (all tiers open)';
  return `${cappedSum} capped seats · plus unlimited tiers`;
}

export function WorkspaceCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        mt: 1.5,
        background: '#f9f9f9',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: '24px',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2.5,
          py: 1.75,
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}
      >
        {typeof action === 'string' ? (
          <Typography sx={{ fontSize: 12, color: '#D85A30', fontWeight: 600 }}>
            {action}
          </Typography>
        ) : (
          action || null
        )}
      </Stack>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Box>
  );
}



export function getNeedPresentation(need: EventNeed) {
  const acceptedApplication = need.applications.find(
    (application) => application.status === 'accepted',
  );

  if (need.status === 'filled') {
    return {
      statusLabel: 'Filled',
      statusBg: '#EAF3DE',
      statusColor: '#3B6D11',
      subtitle: acceptedApplication
        ? `${acceptedApplication.vendor_name} · confirmed`
        : 'Filled by vendor',
    };
  }
  if (need.status === 'override_filled') {
    return {
      statusLabel: 'Host override',
      statusBg: '#EEEDFE',
      statusColor: '#26215C',
      subtitle: 'Host will cover this need',
    };
  }
  if (need.application_count > 0) {
    return {
      statusLabel: `${need.application_count} pending`,
      statusBg: '#E6F1FB',
      statusColor: '#185FA5',
      subtitle: `${need.application_count} cover letters waiting`,
    };
  }
  return {
    statusLabel: 'Open',
    statusBg: '#FAEEDA',
    statusColor: '#854F0B',
    subtitle: 'No applicants yet',
  };
}
