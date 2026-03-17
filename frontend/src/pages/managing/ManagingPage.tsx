import {
  Box,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Coins,
  Edit2,
  ExternalLink,
  MapPin,
  Receipt,
  Ticket,
  Wallet,
} from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import client from '@/api/client';
import { EditApplicationModal } from '@/components/events/EditApplicationModal';
import { useAuth } from '@/features/auth/hooks';
import { getCategoryTheme } from '@/features/events/CategoricalBackground';
import {
  getChecklistFocusItem,
  type PlanningChecklistItem,
} from '@/features/events/planningChecklist';
import {
  CompletedRatedBadge,
  LiveBadge,
  PriceBadge,
} from '@/features/events/scrapbookCard';
import { fetchEventNeeds } from '@/features/needs/api';
import { useMyApplications } from '@/features/needs/hooks';
import { useMyServices } from '@/features/vendors/hooks';
import type { EventOverviewRow } from '@/pages/alerts/utils';
import { VendorAgreement } from '@/pages/events/components/manage-vendor/VendorAgreement';
import type { ApiResponse, EventDetail } from '@/types/events';
import type { EventNeed, NeedApplication } from '@/types/needs';
import type { VendorService } from '@/types/vendors';

type ManagingKind = 'hosting' | 'vendor_request' | 'vendor_application' | 'attending';
type ManagingTab = 'managing' | 'earnings' | 'hosting' | 'attending' | 'services';
type EarningsRole = 'hosted' | 'serviced';

interface ManagingItem {
  id: string;
  event?: EventDetail;
  kind: ManagingKind;
  title: string;
  subtitle: string;
  location: string;
  eventTime: string;
  route: string;
  isPast: boolean;
}

interface EarningsLineItem {
  label: string;
  detail?: string;
  amount: number;
}

interface EarningsItem {
  id: string;
  route: string;
  role: EarningsRole;
  event: EventDetail;
  title: string;
  location: string;
  eventTime: string;
  status: 'live' | 'completed';
  totalEarned: number;
  totalSaved: number;
  ticketRevenue: number;
  vendorCosts: number;
  serviceRevenue: number;
  netRevenue: number;
  ticketLines: EarningsLineItem[];
  vendorLines: EarningsLineItem[];
  serviceLines: EarningsLineItem[];
}

interface ServiceApplicationItem extends NeedApplication {
  eventDetail?: EventDetail;
}

interface ServiceWithApplications {
  id: number | string;
  title: string;
  category: string;
  portfolio_image: string | null;
  is_active: boolean;
  location_city: string;
  created_at: string;
  base_price: string | null;
  applications: ServiceApplicationItem[];
  isDetached?: boolean;
}

const KIND_STYLES: Record<
  ManagingKind,
  { label: string; bg: string; color: string; dot: string }
> = {
  hosting: {
    label: 'Hosting',
    bg: '#E7EDFF',
    color: '#2D4EDA',
    dot: 'rgb(61, 71, 255)',
  },
  vendor_request: {
    label: 'Service request',
    bg: '#E1F5EE',
    color: '#0F6E56',
    dot: 'rgb(92, 205, 186)',
  },
  vendor_application: {
    label: 'Servicing',
    bg: '#E1F5EE',
    color: '#0F6E56',
    dot: 'rgb(0, 159, 132)',
  },
  attending: {
    label: 'Attending',
    bg: '#FFF7CC',
    color: '#8A6A00',
    dot: 'rgb(255, 228, 25)',
  },
};

const APPLICATION_STATUS_STYLES: Record<
  NeedApplication['status'],
  { bg: string; color: string; label: string }
> = {
  accepted: { bg: '#DCFCE7', color: '#166534', label: 'Accepted' },
  pending: { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
  rejected: { bg: '#FEE2E2', color: '#B91C1C', label: 'Rejected' },
  withdrawn: { bg: '#E5E7EB', color: '#4B5563', label: 'Withdrawn' },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function formatTime(dateString: string | undefined | null) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatCalendarSelection(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatMoney(value: number) {
  return `Rs ${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(value)))}`;
}

function parseMoney(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getEventPriceLabel(event: EventDetail) {
  const prices = [
    ...(event.ticket_tiers?.map((tier) => Number(tier.price)) || []),
    Number(event.ticket_price_standard),
    Number(event.ticket_price_flexible),
  ].filter((value) => Number.isFinite(value));

  if (prices.length === 0) return null;

  const lowestPrice = Math.min(...prices);
  return lowestPrice <= 0 ? 'Free' : `Rs ${lowestPrice}`;
}

function isOnlineEventLocation(
  event: Pick<EventDetail, 'location_name' | 'location_address'>,
) {
  const locationName = (event.location_name || '').trim().toLowerCase();
  const locationAddress = (event.location_address || '').trim().toLowerCase();

  return (
    locationName.includes('online') ||
    locationAddress === 'online event' ||
    locationAddress.includes('online')
  );
}

function formatLifecycleLabel(state: EventDetail['lifecycle_state'] | undefined) {
  if (!state) return 'Scheduled';
  return state.replace(/_/g, ' ');
}

function buildMonthGrid(visibleMonth: Date) {
  const start = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      key: toDateKey(date),
      inMonth: date.getMonth() === visibleMonth.getMonth(),
      isToday: toDateKey(date) === toDateKey(new Date()),
    };
  });
}

function getChecklistTone(status: PlanningChecklistItem['status'] | undefined) {
  if (status === 'warn') {
    return {
      bg: '#FFF4E6',
      color: '#9A3412',
      border: 'rgba(245, 158, 11, 0.18)',
      label: 'Pre-event checklist',
    };
  }
  if (status === 'done') {
    return {
      bg: '#EAF7F0',
      color: '#0F6E56',
      border: 'rgba(15, 110, 86, 0.14)',
      label: 'Pre-event checklist',
    };
  }
  return {
    bg: '#FAECE7',
    color: '#7C2D12',
    border: 'rgba(216, 90, 48, 0.14)',
    label: 'Pre-event checklist',
  };
}

async function fetchEventOverview() {
  return client.get<ApiResponse<EventOverviewRow[]>>('/alerts/event-overview/');
}

function ManagingEventCard({
  item,
  nextChecklistItem,
}: {
  item: ManagingItem;
  nextChecklistItem?: PlanningChecklistItem | null;
}) {
  if (!item.event) return null;

  const event = item.event;
  const style = KIND_STYLES[item.kind];
  const categoryTheme = getCategoryTheme(event.category ?? undefined);
  const stepLabel =
    item.kind === 'hosting'
      ? 'hosting'
      : item.kind === 'attending'
        ? 'attending'
        : 'servicing';
  const checklistTone = getChecklistTone(nextChecklistItem?.status);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'stretch',
        overflow: 'hidden',
        borderRadius: '24px',
        border: '1px solid rgba(17,24,39,0.08)',
        borderLeft: `4px solid ${categoryTheme.accent}`,
        backgroundColor: 'rgba(255,255,255,0.96)',
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: '0 10px 28px rgba(108, 71, 33, 0.06)',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: { xs: '100%', sm: 220 },
          minWidth: { sm: 220 },
          height: { xs: 148, sm: 'auto' },
          minHeight: { sm: 240 },
          flexShrink: 0,
          background: categoryTheme.bg,
          backgroundImage: categoryTheme.pattern,
          backgroundSize: '20px 20px',
        }}
      >
        {event.cover_image ? (
          <Box
            component="img"
            src={event.cover_image}
            alt={event.title}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : null}
        <Chip
          label={style.label}
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            bgcolor: style.bg,
            color: style.color,
            fontWeight: 700,
            fontSize: 11,
            height: 28,
          }}
        />
      </Box>

      <Box
        sx={{
          p: 1.8,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.15,
          flex: 1,
          minWidth: 0,
        }}
      >
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
          <Box
            sx={{
              px: 0.9,
              py: 0.35,
              borderRadius: '999px',
              fontSize: 10,
              fontWeight: 700,
              color: item.isPast ? '#7c2d12' : '#166534',
              backgroundColor: item.isPast ? '#FDE7D8' : '#DCFCE7',
            }}
          >
            {item.isPast ? 'Past event' : 'Active'}
          </Box>
        </Box>

        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 20,
            lineHeight: 1.2,
            fontWeight: 700,
            color: '#111827',
          }}
        >
          {event.title}
        </Typography>

        <Typography
          sx={{
            fontSize: 12,
            lineHeight: 1.5,
            color: '#6b7280',
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {item.subtitle}
        </Typography>

        {nextChecklistItem ? (
          <Box
            sx={{
              px: 1.1,
              py: 0.95,
              borderRadius: '16px',
              background: checklistTone.bg,
              border: `1px solid ${checklistTone.border}`,
            }}
          >
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: checklistTone.color,
              }}
            >
              {checklistTone.label}
            </Typography>
            <Typography
              sx={{
                mt: 0.45,
                fontSize: 13,
                fontWeight: 700,
                color: '#2B2118',
              }}
            >
              {nextChecklistItem.label}
            </Typography>
            <Typography
              sx={{ mt: 0.25, fontSize: 11.5, color: 'rgba(66, 50, 28, 0.72)' }}
            >
              {nextChecklistItem.due}
            </Typography>
          </Box>
        ) : null}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} useFlexGap>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              minWidth: 0,
              px: 1,
              py: 0.85,
              borderRadius: '12px',
              backgroundColor: '#F9FAFB',
            }}
          >
            <Clock3 size={14} color="#6b7280" />
            <Typography sx={{ fontSize: 12, color: '#374151', minWidth: 0 }}>
              {formatShortDate(event.start_time)} · {formatTime(event.start_time)}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              minWidth: 0,
              px: 1,
              py: 0.85,
              borderRadius: '12px',
              backgroundColor: '#F9FAFB',
            }}
          >
            <MapPin size={14} color="#6b7280" />
            <Typography
              sx={{
                fontSize: 12,
                color: '#374151',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {event.location_name || 'Location TBD'}
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            mt: 'auto',
            pt: 1.1,
            borderTop: '1px solid rgba(17,24,39,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>
            {nextChecklistItem
              ? nextChecklistItem.status === 'done'
                ? nextChecklistItem.due
                : `Next checklist item: ${nextChecklistItem.label}`
              : `You are on step 2 of ${stepLabel} `}
            {!nextChecklistItem ? (
              <Box component="span" sx={{ fontStyle: 'italic' }}>
                hurry
              </Box>
            ) : null}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {item.kind === 'hosting' ? (
              <Box
                component={Link}
                to={`/events/${event.id}/manage`}
                onClick={(event) => event.stopPropagation()}
                sx={{
                  px: 1.15,
                  py: 0.7,
                  borderRadius: '999px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#7C3E1D',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.55,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: '#F7EADF',
                  textDecoration: 'none',
                }}
              >
                <Edit2 size={13} />
                Manage event
              </Box>
            ) : null}
            <Box
              component={Link}
              to={item.route}
              onClick={(event) => event.stopPropagation()}
              sx={{
                px: 1.15,
                py: 0.7,
                borderRadius: '999px',
                fontSize: 11,
                fontWeight: 700,
                color: style.color,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: style.bg,
                textDecoration: 'none',
              }}
            >
              View event
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

function CompactManagingEventCard({
  item,
  onClick,
  nextChecklistItem,
}: {
  item: ManagingItem;
  onClick?: () => void;
  nextChecklistItem?: PlanningChecklistItem | null;
}) {
  const style = KIND_STYLES[item.kind];
  const date = new Date(item.eventTime);
  const categoryTheme = getCategoryTheme(item.event?.category ?? undefined);
  const checklistTone = getChecklistTone(nextChecklistItem?.status);
  const sharedSx = {
    display: 'flex',
    alignItems: 'stretch',
    gap: 1.25,
    p: 1.25,
    width: '100%',
    borderRadius: '24px',
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(143, 105, 66, 0.12)',
    borderLeft: `4px solid ${categoryTheme.accent}`,
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: '0 10px 28px rgba(108, 71, 33, 0.06)',
    transition: 'background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease',
    '&:hover': {
      background: 'rgba(255,255,255,0.96)',
      boxShadow: '0 8px 24px rgba(108, 71, 33, 0.08)',
      transform: 'translateY(-1px)',
    },
  };

  const content = (
    <>
      <Box
        sx={{
          minWidth: 48,
          px: 0.85,
          py: 0.8,
          borderRadius: '16px',
          background: '#FAECE7',
          textAlign: 'center',
        }}
      >
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#993C1D',
          }}
        >
          {date.toLocaleDateString(undefined, {
            month: 'short',
          })}
        </Typography>
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 19,
            fontWeight: 800,
            color: '#D85A30',
            lineHeight: 1,
          }}
        >
          {String(date.getDate()).padStart(2, '0')}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1,
            alignItems: 'center',
            flexWrap: 'nowrap',
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
            {item.event?.category?.name || 'Event'}
          </Typography>
          <Box
            sx={{
              px: 0.9,
              py: 0.3,
              borderRadius: '999px',
              fontSize: 10,
              fontWeight: 700,
              color: item.isPast ? '#7c2d12' : '#166534',
              backgroundColor: item.isPast ? '#FDE7D8' : '#DCFCE7',
              flexShrink: 0,
            }}
          >
            {item.isPast ? 'Past event' : 'Active'}
          </Box>
        </Box>

        <Typography
          noWrap
          sx={{
            mt: 0.4,
            fontFamily: 'Syne, sans-serif',
            fontSize: 16,
            lineHeight: 1.2,
            fontWeight: 700,
            color: '#2B2118',
          }}
        >
          {item.title}
        </Typography>

        <Typography
          sx={{
            mt: 0.45,
            fontSize: 12.5,
            color: 'rgba(66, 50, 28, 0.68)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {formatShortDate(item.eventTime)} · {formatTime(item.eventTime)} ·{' '}
          {item.location}
        </Typography>
        {nextChecklistItem ? (
          <Box
            sx={{
              mt: 0.45,
              px: 0.8,
              py: 0.45,
              borderRadius: '12px',
              background: checklistTone.bg,
              border: `1px solid ${checklistTone.border}`,
              overflow: 'hidden',
            }}
          >
            <Typography
              sx={{
                fontSize: 11.5,
                fontWeight: 700,
                color: checklistTone.color,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {nextChecklistItem.label}
            </Typography>
          </Box>
        ) : null}
      </Box>
      <Stack
        alignItems="flex-end"
        justifyContent="space-between"
        sx={{
          flexShrink: 0,
          minWidth: { xs: 0, sm: 96 },
        }}
      >
        <Chip
          label={style.label}
          sx={{
            bgcolor: style.bg,
            color: style.color,
            fontWeight: 700,
          }}
        />
        {onClick ? (
          <Box
            sx={{
              mt: { xs: 0.9, sm: 0 },
              width: 30,
              height: 30,
              borderRadius: '999px',
              display: 'grid',
              placeItems: 'center',
              background: '#F7EADF',
              color: '#7C3E1D',
            }}
          >
            <ChevronDown size={18} />
          </Box>
        ) : null}
      </Stack>
    </>
  );

  if (onClick) {
    return (
      <Box
        component="button"
        type="button"
        onClick={onClick}
        sx={{
          ...sharedSx,
          cursor: 'pointer',
          borderWidth: '1px',
          font: 'inherit',
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box component={Link} to={item.route} sx={sharedSx}>
      {content}
    </Box>
  );
}

function ExpandableManagingEventCard({
  item,
  expanded,
  onToggle,
  nextChecklistItem,
}: {
  item: ManagingItem;
  expanded: boolean;
  onToggle: () => void;
  nextChecklistItem?: PlanningChecklistItem | null;
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'grid',
        gap: 0,
      }}
    >
      <Collapse in={!expanded} timeout={240} unmountOnExit>
        <CompactManagingEventCard
          item={item}
          onClick={onToggle}
          nextChecklistItem={nextChecklistItem}
        />
      </Collapse>

      <Collapse
        in={expanded}
        timeout={{ enter: 320, exit: 220 }}
        unmountOnExit
        sx={{
          '& .MuiCollapse-wrapperInner': {
            paddingTop: 0,
          },
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Box
            component="button"
            type="button"
            onClick={onToggle}
            aria-label={`Collapse ${item.title}`}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 2,
              width: 34,
              height: 34,
              border: '1px solid rgba(17,24,39,0.08)',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.94)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(108, 71, 33, 0.1)',
              transition: 'transform 0.2s ease, background 0.2s ease',
              '&:hover': {
                background: '#fff',
                transform: 'translateY(-1px)',
              },
            }}
          >
            <ChevronDown size={16} style={{ transform: 'rotate(180deg)' }} />
          </Box>
          <Box
            onClick={onToggle}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onToggle();
              }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={expanded}
            sx={{
              cursor: 'pointer',
              animation: 'managingCardFadeIn 260ms ease',
              '@keyframes managingCardFadeIn': {
                from: { opacity: 0, transform: 'translateY(-6px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            <ManagingEventCard item={item} nextChecklistItem={nextChecklistItem} />
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

function buildHostedVendorLines(event: EventDetail) {
  const participatingVendorLines = (
    Array.isArray(event.participating_vendors) ? event.participating_vendors : []
  )
    .map((vendor: any, index: number) => ({
      label:
        vendor?.need_title ||
        vendor?.service_title ||
        vendor?.vendor_name ||
        `Vendor ${index + 1}`,
      detail: vendor?.vendor_name
        ? `Paid to ${vendor.vendor_name}`
        : 'Vendor payout placeholder',
      amount: parseMoney(
        vendor?.proposed_price ??
          vendor?.price_agreed ??
          vendor?.price_paid ??
          vendor?.amount,
      ),
    }))
    .filter((line) => line.amount > 0);

  if (participatingVendorLines.length > 0) return participatingVendorLines;

  return (event.user_applications || [])
    .filter((application) => application.status === 'accepted')
    .map((application) => ({
      label: application.need_title || 'Accepted vendor',
      detail: application.vendor_name || 'Vendor payout placeholder',
      amount: parseMoney(application.proposed_price),
    }))
    .filter((line) => line.amount > 0);
}

function buildServiceLines(event: EventDetail) {
  return (event.user_applications || [])
    .filter((application) => application.status === 'accepted')
    .map((application) => ({
      label: application.need_title || 'Service payout',
      detail: application.vendor_name || 'Accepted service',
      amount: parseMoney(application.proposed_price),
    }))
    .filter((line) => line.amount > 0);
}

function buildEarningsItem(item: ManagingItem): EarningsItem | null {
  if (!item.event) return null;
  if (item.kind !== 'hosting' && item.kind !== 'vendor_application') return null;
  if (
    item.event.lifecycle_state !== 'live' &&
    item.event.lifecycle_state !== 'completed'
  ) {
    return null;
  }

  const ticketLines = (item.event.ticket_tiers || [])
    .map((tier) => {
      const sold = tier.sold_count || 0;
      const price = parseMoney(tier.price);
      return {
        label: tier.name,
        detail: `${sold} sold x ${formatMoney(price)}`,
        amount: sold * price,
      };
    })
    .filter((line) => line.amount > 0);

  const vendorLines = buildHostedVendorLines(item.event);
  const serviceLines = buildServiceLines(item.event);

  const ticketRevenue = ticketLines.reduce((sum, line) => sum + line.amount, 0);
  const vendorCosts = vendorLines.reduce((sum, line) => sum + line.amount, 0);
  const serviceRevenue = serviceLines.reduce((sum, line) => sum + line.amount, 0);
  const role: EarningsRole = item.kind === 'hosting' ? 'hosted' : 'serviced';
  const totalEarned = role === 'hosted' ? ticketRevenue - vendorCosts : serviceRevenue;

  return {
    id: item.id,
    route: item.route,
    role,
    event: item.event,
    title: item.title,
    location: item.location,
    eventTime: item.eventTime,
    status: item.event.lifecycle_state === 'live' ? 'live' : 'completed',
    totalEarned,
    totalSaved: 0,
    ticketRevenue,
    vendorCosts,
    serviceRevenue,
    netRevenue: totalEarned,
    ticketLines,
    vendorLines,
    serviceLines,
  };
}

function SummaryValueCard({
  label,
  value,
  hint,
  icon,
  compact = false,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  compact?: boolean;
}) {
  return (
    <Box
      sx={{
        p: compact ? 1.4 : 2,
        borderRadius: compact ? '20px' : '24px',
        background: 'rgba(255,255,255,0.88)',
        border: '1px solid rgba(143, 105, 66, 0.12)',
        boxShadow: compact
          ? '0 10px 24px rgba(108, 71, 33, 0.05)'
          : '0 14px 32px rgba(108, 71, 33, 0.06)',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box
          sx={{
            width: compact ? 36 : 42,
            height: compact ? 36 : 42,
            borderRadius: compact ? '12px' : '14px',
            display: 'grid',
            placeItems: 'center',
            background: '#FAECE7',
            color: '#993C1D',
          }}
        >
          {icon}
        </Box>
        <Typography
          sx={{
            fontSize: compact ? 9 : 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(66, 50, 28, 0.52)',
          }}
        >
          {label}
        </Typography>
      </Stack>
      <Typography
        sx={{
          mt: compact ? 1 : 1.5,
          fontFamily: 'Syne, sans-serif',
          fontSize: compact ? { xs: 19, sm: 22 } : { xs: 24, sm: 28 },
          fontWeight: 800,
          letterSpacing: '-0.04em',
          color: '#2B2118',
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          mt: compact ? 0.25 : 0.5,
          fontSize: compact ? 11 : 12.5,
          lineHeight: 1.35,
          color: 'rgba(66, 50, 28, 0.68)',
        }}
      >
        {hint}
      </Typography>
    </Box>
  );
}

function EarningsBreakdownSection({
  title,
  hint,
  lines,
  accent,
  emptyText,
}: {
  title: string;
  hint: string;
  lines: EarningsLineItem[];
  accent: string;
  emptyText: string;
}) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: '18px',
        background: 'rgba(255,255,255,0.74)',
        border: '1px solid rgba(143, 105, 66, 0.12)',
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(66, 50, 28, 0.52)',
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{ mt: 0.4, mb: 1.25, fontSize: 12, color: 'rgba(66, 50, 28, 0.68)' }}
      >
        {hint}
      </Typography>
      {lines.length === 0 ? (
        <Typography sx={{ fontSize: 12.5, color: 'rgba(66, 50, 28, 0.56)' }}>
          {emptyText}
        </Typography>
      ) : (
        <Stack spacing={1}>
          {lines.map((line) => (
            <Stack
              key={`${title}-${line.label}-${line.detail || 'detailless'}`}
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              spacing={1.5}
              sx={{
                p: 1.2,
                borderRadius: '14px',
                background: '#FFFDF8',
                border: '1px solid rgba(143, 105, 66, 0.1)',
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#2B2118' }}>
                  {line.label}
                </Typography>
                {line.detail ? (
                  <Typography
                    sx={{ mt: 0.3, fontSize: 12, color: 'rgba(66, 50, 28, 0.62)' }}
                  >
                    {line.detail}
                  </Typography>
                ) : null}
              </Box>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: accent,
                  whiteSpace: 'nowrap',
                }}
              >
                {formatMoney(line.amount)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function EarningsEventRow({
  item,
  expanded,
  onToggle,
}: {
  item: EarningsItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const date = new Date(item.eventTime);
  const isHosted = item.role === 'hosted';
  const primaryAmount = isHosted ? item.netRevenue : item.serviceRevenue;

  return (
    <Box
      sx={{
        borderRadius: '26px',
        background: 'rgba(255,255,255,0.88)',
        border: '1px solid rgba(143, 105, 66, 0.12)',
        boxShadow: '0 14px 36px rgba(108, 71, 33, 0.08)',
        overflow: 'hidden',
      }}
    >
      <Box
        component="button"
        onClick={onToggle}
        sx={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          textAlign: 'left',
          cursor: 'pointer',
          p: { xs: 1.5, sm: 1.8 },
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Box
            sx={{
              minWidth: 62,
              px: 1,
              py: 1,
              borderRadius: '18px',
              background: '#FAECE7',
              textAlign: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#993C1D',
              }}
            >
              {date.toLocaleDateString(undefined, { month: 'short' })}
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 24,
                fontWeight: 800,
                color: '#D85A30',
                lineHeight: 1,
              }}
            >
              {String(date.getDate()).padStart(2, '0')}
            </Typography>
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ mb: 0.8 }}
            >
              <Chip
                label={isHosted ? 'Hosted' : 'Serviced'}
                sx={{
                  height: 28,
                  bgcolor: isHosted ? '#E7EDFF' : '#E1F5EE',
                  color: isHosted ? '#2D4EDA' : '#0F6E56',
                  fontWeight: 700,
                }}
              />
              <Chip
                label={item.status === 'live' ? 'Live' : 'Completed'}
                sx={{
                  height: 28,
                  bgcolor: item.status === 'live' ? '#FAECE7' : '#F1EFE8',
                  color: item.status === 'live' ? '#993C1D' : '#5C4B3A',
                  fontWeight: 700,
                }}
              />
            </Stack>
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: { xs: 18, sm: 20 },
                fontWeight: 800,
                color: '#2B2118',
                lineHeight: 1.2,
              }}
            >
              {item.title}
            </Typography>
            <Typography
              sx={{ mt: 0.45, fontSize: 12.5, color: 'rgba(66, 50, 28, 0.68)' }}
            >
              {item.location} · {formatShortDate(item.eventTime)}
            </Typography>
          </Box>

          <Stack
            direction={{ xs: 'row', sm: 'column' }}
            justifyContent="space-between"
            alignItems={{ xs: 'center', sm: 'flex-end' }}
            spacing={0.75}
            sx={{ minWidth: { sm: 180 } }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(66, 50, 28, 0.52)',
                  textAlign: { xs: 'left', sm: 'right' },
                }}
              >
                {isHosted ? 'Net earned' : 'Amount earned'}
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: { xs: 22, sm: 26 },
                  fontWeight: 800,
                  color: '#2B2118',
                  textAlign: { xs: 'left', sm: 'right' },
                }}
              >
                {formatMoney(primaryAmount)}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '999px',
                display: 'grid',
                placeItems: 'center',
                background: expanded ? '#D85A30' : '#F7EADF',
                color: expanded ? '#fff' : '#7C3E1D',
                transition: 'transform 0.18s ease',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <ChevronDown size={18} />
            </Box>
          </Stack>
        </Stack>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box
          sx={{
            px: { xs: 1.5, sm: 1.8 },
            pb: { xs: 1.5, sm: 1.8 },
            pt: 0.2,
            borderTop: '1px solid rgba(143, 105, 66, 0.1)',
            background:
              'linear-gradient(180deg, rgba(255,250,243,0.72) 0%, rgba(255,255,255,0.9) 100%)',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
              gap: 1.2,
              mt: 1.4,
            }}
          >
            <Box
              sx={{
                p: 1.4,
                borderRadius: '18px',
                background: '#FFFDF8',
                border: '1px solid rgba(143, 105, 66, 0.12)',
              }}
            >
              <Stack direction="row" spacing={0.8} alignItems="center">
                <Ticket size={16} color="#7C3E1D" />
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#7C3E1D' }}>
                  Ticket revenue
                </Typography>
              </Stack>
              <Typography
                sx={{
                  mt: 0.8,
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#2B2118',
                }}
              >
                {formatMoney(item.ticketRevenue)}
              </Typography>
            </Box>

            <Box
              sx={{
                p: 1.4,
                borderRadius: '18px',
                background: '#FFFDF8',
                border: '1px solid rgba(143, 105, 66, 0.12)',
              }}
            >
              <Stack direction="row" spacing={0.8} alignItems="center">
                <Coins size={16} color="#7C3E1D" />
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#7C3E1D' }}>
                  Vendor cost
                </Typography>
              </Stack>
              <Typography
                sx={{
                  mt: 0.8,
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#2B2118',
                }}
              >
                {formatMoney(item.vendorCosts)}
              </Typography>
            </Box>

            <Box
              sx={{
                p: 1.4,
                borderRadius: '18px',
                background: '#FFFDF8',
                border: '1px solid rgba(143, 105, 66, 0.12)',
              }}
            >
              <Stack direction="row" spacing={0.8} alignItems="center">
                <CircleDollarSign size={16} color="#7C3E1D" />
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#7C3E1D' }}>
                  {isHosted ? 'Net earned' : 'Service earned'}
                </Typography>
              </Stack>
              <Typography
                sx={{
                  mt: 0.8,
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 22,
                  fontWeight: 800,
                  color: isHosted ? '#2B2118' : '#0F6E56',
                }}
              >
                {formatMoney(isHosted ? item.netRevenue : item.serviceRevenue)}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: isHosted ? '1.2fr 1fr' : '1fr' },
              gap: 1.2,
              mt: 1.2,
            }}
          >
            {isHosted ? (
              <>
                <EarningsBreakdownSection
                  title="Tickets sold"
                  hint="Revenue is estimated from sold ticket tiers."
                  lines={item.ticketLines}
                  accent="#2B2118"
                  emptyText="Ticket-tier earnings will appear here once ticket sales are wired in."
                />
                <EarningsBreakdownSection
                  title="Vendors paid"
                  hint="Accepted service payouts will reduce host earnings."
                  lines={item.vendorLines}
                  accent="#7C3E1D"
                  emptyText="Vendor cost details will appear here when pricing data is wired."
                />
              </>
            ) : (
              <EarningsBreakdownSection
                title="Services delivered"
                hint="Accepted service payouts are grouped here for this event."
                lines={item.serviceLines}
                accent="#0F6E56"
                emptyText="Service earnings will appear here once payout details are wired."
              />
            )}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

function ServiceApplicationsRow({
  service,
  expanded,
  onToggle,
}: {
  service: ServiceWithApplications;
  expanded: boolean;
  onToggle: () => void;
}) {
  const acceptedCount = service.applications.filter(
    (application) => application.status === 'accepted',
  ).length;
  const pendingCount = service.applications.filter(
    (application) => application.status === 'pending',
  ).length;
  const isDetached = Boolean(service.isDetached);
  if (isDetached) return null;

  return (
    <Box
      sx={{
        borderRadius: '26px',
        background: 'rgba(255,255,255,0.88)',
        border: '1px solid rgba(143, 105, 66, 0.12)',
        boxShadow: '0 14px 36px rgba(108, 71, 33, 0.08)',
        overflow: 'hidden',
      }}
    >
      <Box
        component="button"
        onClick={onToggle}
        sx={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          textAlign: 'left',
          cursor: 'pointer',
          p: { xs: 1.5, sm: 1.8 },
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Box
            sx={{
              width: { xs: '100%', sm: 118 },
              minWidth: { sm: 118 },
              height: { xs: 120, sm: 118 },
              borderRadius: '18px',
              overflow: 'hidden',
              background: service.portfolio_image
                ? '#E9E1D8'
                : 'linear-gradient(135deg, #FAECE7 0%, #FAEEDA 100%)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {service.portfolio_image ? (
              <Box
                component="img"
                src={service.portfolio_image}
                alt={service.title}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <Briefcase size={26} color="#993C1D" />
            )}
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ mb: 0.8 }}
            >
              <Chip
                label={service.category || 'Service'}
                sx={{
                  height: 28,
                  bgcolor: isDetached ? '#F6F0E8' : '#FAECE7',
                  color: isDetached ? '#5C4B3A' : '#993C1D',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                }}
              />
              <Chip
                label={
                  isDetached
                    ? 'Needs linking'
                    : service.is_active
                      ? 'Active'
                      : 'Inactive'
                }
                sx={{
                  height: 28,
                  bgcolor: isDetached
                    ? '#FFF4E6'
                    : service.is_active
                      ? '#E1F5EE'
                      : '#F1EFE8',
                  color: isDetached
                    ? '#7C3E1D'
                    : service.is_active
                      ? '#0F6E56'
                      : '#5C4B3A',
                  fontWeight: 700,
                }}
              />
            </Stack>
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: { xs: 18, sm: 21 },
                fontWeight: 800,
                color: '#2B2118',
                lineHeight: 1.2,
              }}
            >
              {service.title}
            </Typography>
            <Typography
              sx={{ mt: 0.45, fontSize: 12.5, color: 'rgba(66, 50, 28, 0.68)' }}
            >
              {service.location_city || 'Location TBD'} · Created{' '}
              {formatShortDate(service.created_at)}
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 1.1 }}
            >
              <Box
                sx={{
                  px: 1.1,
                  py: 0.65,
                  borderRadius: '12px',
                  background: '#FFF4E6',
                  fontSize: 12,
                  color: '#7C3E1D',
                  fontWeight: 700,
                }}
              >
                {service.applications.length} applications
              </Box>
              <Box
                sx={{
                  px: 1.1,
                  py: 0.65,
                  borderRadius: '12px',
                  background: '#F6F0E8',
                  fontSize: 12,
                  color: '#5C4B3A',
                  fontWeight: 700,
                }}
              >
                {pendingCount} pending
              </Box>
              <Box
                sx={{
                  px: 1.1,
                  py: 0.65,
                  borderRadius: '12px',
                  background: '#EAF7F0',
                  fontSize: 12,
                  color: '#0F6E56',
                  fontWeight: 700,
                }}
              >
                {acceptedCount} accepted
              </Box>
            </Stack>
          </Box>

          <Stack
            direction={{ xs: 'row', sm: 'column' }}
            justifyContent="space-between"
            alignItems={{ xs: 'center', sm: 'flex-end' }}
            spacing={0.9}
            sx={{ minWidth: { sm: 170 } }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(66, 50, 28, 0.52)',
                  textAlign: { xs: 'left', sm: 'right' },
                }}
              >
                {isDetached ? 'Link status' : 'Base price'}
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: { xs: 20, sm: 24 },
                  fontWeight: 800,
                  color: '#2B2118',
                  textAlign: { xs: 'left', sm: 'right' },
                }}
              >
                {isDetached
                  ? 'Unlinked'
                  : service.base_price
                    ? formatMoney(parseMoney(service.base_price))
                    : 'Rs 0'}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '999px',
                display: 'grid',
                placeItems: 'center',
                background: expanded ? '#D85A30' : '#F7EADF',
                color: expanded ? '#fff' : '#7C3E1D',
                transition: 'transform 0.18s ease',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <ChevronDown size={18} />
            </Box>
          </Stack>
        </Stack>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box
          sx={{
            px: { xs: 1.5, sm: 1.8 },
            pb: { xs: 1.5, sm: 1.8 },
            pt: 0.2,
            borderTop: '1px solid rgba(143, 105, 66, 0.1)',
            background:
              'linear-gradient(180deg, rgba(255,250,243,0.72) 0%, rgba(255,255,255,0.9) 100%)',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            sx={{ mb: 1.4, mt: 1.3 }}
          >
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(66, 50, 28, 0.52)',
              }}
            >
              {isDetached
                ? 'Applications without a linked service'
                : 'Applications sent with this service'}
            </Typography>
            {isDetached ? (
              <Typography sx={{ fontSize: 12.5, color: 'rgba(66, 50, 28, 0.64)' }}>
                These applications were sent without a linked service id.
              </Typography>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  component={Link}
                  to={`/services/${service.id}`}
                  clickable
                  icon={<ExternalLink size={14} />}
                  label="View service"
                  sx={{
                    bgcolor: '#FFF4E6',
                    color: '#7C3E1D',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                />
                <Chip
                  component={Link}
                  to={`/services/${service.id}/edit`}
                  clickable
                  icon={<Edit2 size={14} />}
                  label="Edit service"
                  sx={{
                    bgcolor: '#F6F0E8',
                    color: '#5C4B3A',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                />
              </Stack>
            )}
          </Stack>

          <Box
            sx={{
              borderRadius: '18px',
              border: '1px solid rgba(143, 105, 66, 0.12)',
              background: 'rgba(255,255,255,0.72)',
              p: 1.2,
            }}
          >
            <Stack spacing={1.2}>
              {service.applications.map((application) => (
                <ServiceApplicationCard
                  key={application.id}
                  application={application}
                />
              ))}
            </Stack>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

function ServiceApplicationCard({
  application,
}: {
  application: ServiceApplicationItem;
}) {
  const [editing, setEditing] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const event = application.eventDetail;
  const categoryTheme = getCategoryTheme(event?.category ?? undefined);
  const statusStyle = APPLICATION_STATUS_STYLES[application.status];
  const eventPriceLabel = event ? getEventPriceLabel(event) : null;
  const isOnline = event ? isOnlineEventLocation(event) : false;

  return (
    <>
      <Box
        sx={{
          borderRadius: '22px',
          border: '1px solid rgba(143, 105, 66, 0.14)',
          background: 'rgba(255,255,255,0.92)',
          boxShadow: '0 12px 30px rgba(108, 71, 33, 0.06)',
          overflow: 'hidden',
        }}
      >
        {event ? (
          <Box
            component={Link}
            to={`/events/${application.event_id}`}
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'stretch',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'background-color 0.18s ease',
              '&:hover': {
                backgroundColor: 'rgba(250, 236, 231, 0.2)',
              },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: { xs: '100%', sm: 210 },
                minWidth: { sm: 210 },
                height: { xs: 150, sm: 'auto' },
                minHeight: { sm: 220 },
                flexShrink: 0,
                background: categoryTheme.bg,
                backgroundImage: categoryTheme.pattern,
                backgroundSize: '20px 20px',
              }}
            >
              {event.cover_image ? (
                <Box
                  component="img"
                  src={event.cover_image}
                  alt={event.title}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              ) : null}
              {event.lifecycle_state === 'live' ? (
                <LiveBadge
                  sx={{ position: 'absolute', bottom: 8, left: 8, zIndex: 1 }}
                />
              ) : null}
              {event.lifecycle_state === 'completed' ? (
                <CompletedRatedBadge
                  sx={{ position: 'absolute', bottom: 8, right: 8, zIndex: 1 }}
                />
              ) : null}
              {eventPriceLabel &&
              (event.lifecycle_state === 'published' ||
                event.lifecycle_state === 'live') ? (
                <PriceBadge
                  price={eventPriceLabel}
                  variant="landscape"
                  sx={{ position: 'absolute', bottom: 8, right: 8, zIndex: 1 }}
                />
              ) : null}
            </Box>

            <Box
              sx={{
                p: 1.7,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.1,
                flex: 1,
                minWidth: 0,
              }}
            >
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
                <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                  <Box
                    sx={{
                      px: 0.9,
                      py: 0.35,
                      borderRadius: '999px',
                      fontSize: 10,
                      fontWeight: 600,
                      color: isOnline ? '#085041' : '#7a271a',
                      backgroundColor: isOnline ? '#E1F5EE' : '#FAECE7',
                    }}
                  >
                    {isOnline ? 'Online' : 'In person'}
                  </Box>
                  <Box
                    sx={{
                      px: 0.9,
                      py: 0.35,
                      borderRadius: '999px',
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      color: '#5C4B3A',
                      backgroundColor: '#F6F0E8',
                    }}
                  >
                    {formatLifecycleLabel(event.lifecycle_state)}
                  </Box>
                </Stack>
              </Box>

              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: { xs: 18, sm: 20 },
                  lineHeight: 1.2,
                  fontWeight: 700,
                  color: '#111827',
                }}
              >
                {event.title}
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: '#6b7280',
                  display: '-webkit-box',
                  overflow: 'hidden',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {event.description ||
                  application.need_title ||
                  'Open service opportunity'}
              </Typography>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} useFlexGap>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    minWidth: 0,
                    px: 1,
                    py: 0.85,
                    borderRadius: '12px',
                    backgroundColor: '#F9FAFB',
                  }}
                >
                  <Clock3 size={14} color="#6b7280" />
                  <Typography sx={{ fontSize: 12, color: '#374151', minWidth: 0 }}>
                    {formatShortDate(event.start_time)} · {formatTime(event.start_time)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    minWidth: 0,
                    px: 1,
                    py: 0.85,
                    borderRadius: '12px',
                    backgroundColor: '#F9FAFB',
                  }}
                >
                  <MapPin size={14} color="#6b7280" />
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: '#374151',
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {event.location_name || 'Location TBD'}
                  </Typography>
                </Box>
              </Stack>

              <Box
                sx={{
                  mt: 'auto',
                  pt: 1,
                  borderTop: '1px solid rgba(17,24,39,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap',
                }}
              >
                <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>
                  Attached to your application for{' '}
                  <Box component="span" sx={{ fontWeight: 700, color: '#2B2118' }}>
                    {application.need_title || 'General service'}
                  </Box>
                </Typography>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#7C3E1D',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  View event
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ p: 1.7, borderBottom: '1px solid rgba(143, 105, 66, 0.1)' }}>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#6b7280',
              }}
            >
              Event
            </Typography>
            <Typography
              sx={{
                mt: 0.7,
                fontFamily: 'Syne, sans-serif',
                fontSize: { xs: 18, sm: 20 },
                fontWeight: 700,
                color: '#111827',
              }}
            >
              {application.event_title || 'Attached event'}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            p: 1.5,
            background:
              'linear-gradient(180deg, rgba(255,249,240,0.9) 0%, rgba(255,255,255,0.96) 100%)',
            borderTop: '1px solid rgba(143, 105, 66, 0.1)',
          }}
        >
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', lg: 'center' }}
          >
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(66, 50, 28, 0.52)',
              }}
            >
              Application details
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {application.event_id ? (
                <Chip
                  component={Link}
                  to={`/events/${application.event_id}`}
                  clickable
                  icon={<ExternalLink size={14} />}
                  label="Open event"
                  sx={{
                    bgcolor: '#FFF4E6',
                    color: '#7C3E1D',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                />
              ) : null}
              {application.status === 'pending' ? (
                <Chip
                  clickable
                  onClick={() => setEditing(true)}
                  icon={<Edit2 size={14} />}
                  label="Edit application"
                  sx={{
                    bgcolor: '#FAE6C7',
                    color: '#7C3E1D',
                    fontWeight: 700,
                  }}
                />
              ) : null}
              {application.status === 'accepted' ? (
                <Chip
                  clickable
                  onClick={() => setAgreementOpen((prev) => !prev)}
                  icon={<Ticket size={14} />}
                  label={agreementOpen ? 'Hide vendor pass' : 'Show vendor pass'}
                  sx={{
                    bgcolor: '#EAF7F0',
                    color: '#0F6E56',
                    fontWeight: 700,
                  }}
                />
              ) : null}
            </Stack>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 1.2 }}
          >
            <Box
              sx={{
                px: 1.15,
                py: 0.9,
                borderRadius: '14px',
                background: statusStyle.bg,
                color: statusStyle.color,
                minWidth: { xs: 'calc(50% - 8px)', sm: 0 },
              }}
            >
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Status
              </Typography>
              <Typography sx={{ mt: 0.35, fontSize: 13, fontWeight: 800 }}>
                {statusStyle.label}
              </Typography>
            </Box>
            <Box
              sx={{
                px: 1.15,
                py: 0.9,
                borderRadius: '14px',
                background: '#FFF4E6',
                color: '#7C3E1D',
                minWidth: { xs: 'calc(50% - 8px)', sm: 0 },
              }}
            >
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Need
              </Typography>
              <Typography sx={{ mt: 0.35, fontSize: 13, fontWeight: 800 }}>
                {application.need_title || 'General'}
              </Typography>
            </Box>
            <Box
              sx={{
                px: 1.15,
                py: 0.9,
                borderRadius: '14px',
                background: '#F6F0E8',
                color: '#5C4B3A',
                minWidth: { xs: 'calc(50% - 8px)', sm: 0 },
              }}
            >
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Proposed price
              </Typography>
              <Typography sx={{ mt: 0.35, fontSize: 13, fontWeight: 800 }}>
                {application.proposed_price
                  ? formatMoney(parseMoney(application.proposed_price))
                  : 'Not set'}
              </Typography>
            </Box>
            <Box
              sx={{
                px: 1.15,
                py: 0.9,
                borderRadius: '14px',
                background: '#F9FAFB',
                color: '#374151',
                minWidth: { xs: 'calc(50% - 8px)', sm: 0 },
              }}
            >
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Applied on
              </Typography>
              <Typography sx={{ mt: 0.35, fontSize: 13, fontWeight: 800 }}>
                {formatShortDate(application.created_at)}
              </Typography>
            </Box>
          </Stack>

          {application.message ? (
            <Box
              sx={{
                mt: 1.2,
                p: 1.25,
                borderRadius: '16px',
                border: '1px solid rgba(143, 105, 66, 0.12)',
                background: 'rgba(255,244,230,0.82)',
              }}
            >
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(66, 50, 28, 0.52)',
                }}
              >
                Message
              </Typography>
              <Typography
                sx={{
                  mt: 0.55,
                  fontSize: 13,
                  lineHeight: 1.65,
                  color: '#6B4F34',
                  fontStyle: 'italic',
                }}
              >
                "{application.message}"
              </Typography>
            </Box>
          ) : null}

          {application.status === 'accepted' && agreementOpen ? (
            <Box
              sx={{
                mt: 1.25,
                borderRadius: '18px',
                overflow: 'hidden',
                border: '1px solid rgba(143, 105, 66, 0.12)',
                background: '#fff',
              }}
            >
              <VendorAgreement
                applicationStatus={application.status}
                vendorSigned={true}
                hostSigned={true}
                price={
                  application.proposed_price
                    ? parseFloat(application.proposed_price)
                    : 0
                }
                barcode={application.barcode}
                qrToken={application.qr_token}
                isHostView={false}
              />
            </Box>
          ) : null}
        </Box>
      </Box>

      <EditApplicationModal
        open={editing}
        onClose={() => setEditing(false)}
        application={application}
      />
    </>
  );
}

const VALID_TABS: ManagingTab[] = [
  'managing',
  'earnings',
  'hosting',
  'attending',
  'services',
];

export default function ManagingPage() {
  const { user, loading } = useAuth();
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const tab: ManagingTab = VALID_TABS.includes(tabParam as ManagingTab)
    ? (tabParam as ManagingTab)
    : 'managing';
  const setTab = (next: ManagingTab) =>
    navigate(next === 'managing' ? '/managing' : `/managing/${next}`, {
      replace: true,
    });
  const [filter, setFilter] = useState<'all' | 'hosting' | 'vendor'>('all');
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [expandedEarningId, setExpandedEarningId] = useState<string | null>(null);
  const [expandedHostingId, setExpandedHostingId] = useState<string | null>(null);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const { data: servicesResponse, isLoading: servicesLoading } = useMyServices({
    enabled: !!user,
  });
  const { data: applicationsResponse, isLoading: applicationsLoading } =
    useMyApplications();

  const { data: overviewResponse, isLoading: loadingOverview } = useQuery({
    queryKey: ['managingOverview'],
    queryFn: fetchEventOverview,
    enabled: !!user,
  });

  const overviewRows = (overviewResponse?.data?.data || []) as EventOverviewRow[];
  const services = (servicesResponse?.data || []) as VendorService[];
  const serviceApplications = (applicationsResponse?.data || []) as NeedApplication[];
  const isLoading = loading || loadingOverview;
  const now = Date.now();

  const eventReasons = useMemo(() => {
    const map = new Map<
      string,
      { hosting?: boolean; vendor_application?: boolean; vendor_request?: boolean }
    >();
    const ensure = (eventId: string) => {
      if (!map.has(eventId)) map.set(eventId, {});
      return map.get(eventId)!;
    };

    overviewRows.forEach((row) => {
      const eventId = String(row.event_id);
      const reasons = ensure(eventId);
      if (user?.id && row.host_user_id === user.id) reasons.hosting = true;
      if (
        user?.id &&
        row.need_application_requested_by_host_vendor_user_id === user.id
      ) {
        reasons.vendor_request = true;
      }
      if (
        user?.id &&
        (row.need_applied_to_user_id === user.id ||
          row.need_assigned_user_id === user.id)
      ) {
        reasons.vendor_application = true;
      }
    });

    return map;
  }, [overviewRows, user?.id]);

  const timeline = useMemo<ManagingItem[]>(() => {
    const detailByEventId = new Map<string, EventDetail>();
    overviewRows.forEach((row) => {
      if (row.event_details) {
        detailByEventId.set(String(row.event_id), row.event_details);
      }
    });

    const items: ManagingItem[] = [];
    const seen = new Set<string>();

    for (const [eventId, detail] of detailByEventId.entries()) {
      const reasons = eventReasons.get(eventId);
      if (!reasons) continue;

      if (reasons.hosting && !seen.has(`hosting-${eventId}`)) {
        seen.add(`hosting-${eventId}`);
        const isPast = new Date(detail.start_time).getTime() < now;
        items.push({
          id: `hosting-${eventId}`,
          event: detail,
          kind: 'hosting',
          title: detail.title,
          subtitle: isPast ? 'Hosted event' : 'Upcoming hosted event',
          location: detail.location_name || 'Location TBD',
          eventTime: detail.start_time,
          route: `/events/${eventId}`,
          isPast,
        });
      }

      if (reasons.vendor_request && !seen.has(`vendor_request-${eventId}`)) {
        seen.add(`vendor_request-${eventId}`);
        const isPast = new Date(detail.start_time).getTime() < now;
        items.push({
          id: `vendor_request-${eventId}`,
          event: detail,
          kind: 'vendor_request',
          title: detail.title,
          subtitle: 'Service request for this event',
          location: detail.location_name || 'Location TBD',
          eventTime: detail.start_time,
          route: `/events/${eventId}`,
          isPast,
        });
      }

      if (reasons.vendor_application && !seen.has(`vendor_application-${eventId}`)) {
        seen.add(`vendor_application-${eventId}`);
        const isPast = new Date(detail.start_time).getTime() < now;
        items.push({
          id: `vendor_application-${eventId}`,
          event: detail,
          kind: 'vendor_application',
          title: detail.title,
          subtitle: 'You applied to service this event',
          location: detail.location_name || 'Location TBD',
          eventTime: detail.start_time,
          route: `/events/${eventId}`,
          isPast,
        });
      }
    }

    return items.sort(
      (a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime(),
    );
  }, [eventReasons, now, overviewRows]);

  const hostedEventIds = useMemo(
    () =>
      Array.from(
        new Set(
          timeline
            .filter((item) => item.kind === 'hosting' && item.event)
            .map((item) => item.event!.id),
        ),
      ),
    [timeline],
  );

  const hostedNeedsQueries = useQueries({
    queries: hostedEventIds.map((eventId) => ({
      queryKey: ['eventNeeds', eventId],
      queryFn: () => fetchEventNeeds(eventId),
      enabled: !!user,
      staleTime: 60_000,
    })),
  });

  const hostedNeedsByEventId = useMemo(() => {
    const map = new Map<number, EventNeed[]>();
    hostedEventIds.forEach((eventId, index) => {
      map.set(eventId, hostedNeedsQueries[index]?.data?.data || []);
    });
    return map;
  }, [hostedEventIds, hostedNeedsQueries]);

  const nextChecklistByItemId = useMemo(() => {
    const map = new Map<string, PlanningChecklistItem | null>();
    timeline.forEach((item) => {
      if (item.kind !== 'hosting' || !item.event) {
        map.set(item.id, null);
        return;
      }
      map.set(
        item.id,
        getChecklistFocusItem(
          item.event,
          hostedNeedsByEventId.get(item.event.id) || [],
        ),
      );
    });
    return map;
  }, [hostedNeedsByEventId, timeline]);

  const typeFiltered = timeline.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'hosting') return item.kind === 'hosting';
    return item.kind === 'vendor_request' || item.kind === 'vendor_application';
  });

  const dayFiltered = selectedDateKey
    ? typeFiltered.filter(
        (item) => toDateKey(new Date(item.eventTime)) === selectedDateKey,
      )
    : typeFiltered;

  const upcomingItems = dayFiltered.filter((item) => !item.isPast);
  const topUpcoming = upcomingItems.slice(0, 3);
  const hostingItems = timeline;
  const attendingItems = useMemo<ManagingItem[]>(() => {
    if (!user?.id) return [];

    const attendee = new Map<number, EventOverviewRow>();

    overviewRows.forEach((row) => {
      if (['completed', 'cancelled'].includes(row.event_lifecycle_state)) return;
      if (!row.event_details) return;
      if (row.attendee_user_id !== user.id || row.ticket_status === 'cancelled') return;

      attendee.set(row.event_id, row);
    });

    return Array.from(attendee.values())
      .sort(
        (a, b) =>
          new Date(b.ticket_created_date || 0).getTime() -
          new Date(a.ticket_created_date || 0).getTime(),
      )
      .map((row) => {
        const detail = row.event_details;
        return {
          id: `attending-${row.event_id}`,
          event: detail,
          kind: 'attending' as const,
          title: detail.title,
          subtitle: 'You are attending this event',
          location: detail.location_name || 'Location TBD',
          eventTime: detail.start_time,
          route: `/events-new/${row.event_id}`,
          isPast: new Date(detail.start_time).getTime() < now,
        };
      });
  }, [now, overviewRows, user?.id]);
  const monthDays = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);

  const eventsByDay = useMemo(() => {
    const bucket: Record<string, ManagingItem[]> = {};
    typeFiltered.forEach((item) => {
      const key = toDateKey(new Date(item.eventTime));
      if (!bucket[key]) bucket[key] = [];
      bucket[key].push(item);
    });
    return bucket;
  }, [typeFiltered]);

  const earningsItems = useMemo(
    () =>
      timeline
        .map((item) => buildEarningsItem(item))
        .filter((item): item is EarningsItem => Boolean(item))
        .sort(
          (a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime(),
        ),
    [timeline],
  );

  const lifetimeEarned = useMemo(
    () => earningsItems.reduce((sum, item) => sum + item.totalEarned, 0),
    [earningsItems],
  );

  const servicesWithApplications = useMemo<ServiceWithApplications[]>(() => {
    const eventDetailsById = new Map<number, EventDetail>();
    overviewRows.forEach((row) => {
      if (row.event_details) {
        eventDetailsById.set(row.event_id, row.event_details);
      }
    });
    const serviceIds = new Set(services.map((service) => service.id));
    const linkedGroups = services.map((service) => ({
      id: String(service.id),
      title: service.title,
      category: service.category,
      portfolio_image: service.portfolio_image,
      is_active: service.is_active,
      location_city: service.location_city,
      created_at: service.created_at,
      base_price: service.base_price,
      applications: serviceApplications
        .filter((application) => application.service === service.id)
        .map((application) => ({
          ...application,
          eventDetail: application.event_id
            ? eventDetailsById.get(application.event_id)
            : undefined,
        })),
    }));

    const detachedApplications = serviceApplications.filter(
      (application) =>
        application.service == null || !serviceIds.has(application.service),
    );

    const detachedGroup =
      detachedApplications.length > 0
        ? [
            {
              id: 'detached-applications',
              title: 'Applications without a linked service',
              category: 'Unlinked',
              portfolio_image: null,
              is_active: true,
              location_city: 'Needs relinking',
              created_at:
                detachedApplications[0]?.created_at || new Date().toISOString(),
              base_price: null,
              applications: detachedApplications.map((application) => ({
                ...application,
                eventDetail: application.event_id
                  ? eventDetailsById.get(application.event_id)
                  : undefined,
              })),
              isDetached: true,
            },
          ]
        : [];

    return [...linkedGroups, ...detachedGroup].sort(
      (a, b) => b.applications.length - a.applications.length,
    );
  }, [overviewRows, serviceApplications, services]);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress sx={{ color: '#D85A30' }} />
      </Box>
    );
  }

  if (tab === 'services' && (servicesLoading || applicationsLoading)) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress sx={{ color: '#D85A30' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 1240,
        mx: 'auto',
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(255, 244, 227, 0.9), transparent 32%), linear-gradient(180deg, #FFFDF8 0%, #FFF6EA 48%, #FFFDF8 100%)',
      }}
    >
      <Container maxWidth={false}>
        <Box
          sx={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(255,250,243,0.92) 100%)',
            boxShadow: '0 32px 90px rgba(113, 74, 35, 0.10)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <Box
            sx={{
              px: { xs: 2, sm: 3, md: 4 },
              pt: { xs: 3, md: 4 },
              pb: 2,
              borderBottom: '1px solid rgba(143, 105, 66, 0.10)',
              background:
                'linear-gradient(135deg, rgba(216,90,48,0.08) 0%, rgba(250,238,218,0.2) 60%, rgba(255,255,255,0.12) 100%)',
            }}
          >
            <Stack spacing={2}>
              <Stack spacing={0.75}>
                <Typography
                  sx={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(66, 50, 28, 0.62)',
                  }}
                >
                  Your events
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: { xs: 26, sm: 32 },
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    color: '#2B2118',
                  }}
                >
                  {tab === 'managing'
                    ? 'Upcoming Events'
                    : tab === 'earnings'
                      ? 'Earnings'
                      : tab === 'hosting'
                        ? 'Hosting'
                        : tab === 'attending'
                          ? 'Attending'
                          : 'Services'}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {(
                  [
                    { key: 'managing', label: 'Managing' },
                    { key: 'earnings', label: 'Earnings' },
                    { key: 'hosting', label: 'Hosting' },
                    { key: 'attending', label: 'Attending' },
                    { key: 'services', label: 'Services' },
                  ] as const
                ).map((pageTab) => (
                  <Chip
                    key={pageTab.key}
                    label={pageTab.label}
                    onClick={() => setTab(pageTab.key)}
                    sx={{
                      height: 36,
                      borderRadius: '999px',
                      bgcolor:
                        tab === pageTab.key ? '#2B2118' : 'rgba(255,255,255,0.82)',
                      color: tab === pageTab.key ? '#fff' : '#4A3827',
                      border:
                        tab === pageTab.key
                          ? 'none'
                          : '1px solid rgba(143, 105, 66, 0.14)',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </Stack>

              {tab === 'managing' ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {(
                    [
                      { key: 'all', label: 'All' },
                      { key: 'hosting', label: 'Hosting' },
                      { key: 'vendor', label: 'Servicing' },
                    ] as const
                  ).map((tabFilter) => (
                    <Chip
                      key={tabFilter.key}
                      label={tabFilter.label}
                      onClick={() => setFilter(tabFilter.key)}
                      sx={{
                        height: 34,
                        borderRadius: '999px',
                        bgcolor:
                          filter === tabFilter.key
                            ? '#D85A30'
                            : 'rgba(255,255,255,0.9)',
                        color: filter === tabFilter.key ? '#fff' : '#4A3827',
                        border:
                          filter === tabFilter.key
                            ? 'none'
                            : '1px solid rgba(143, 105, 66, 0.14)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </Stack>
              ) : null}
            </Stack>
          </Box>

          {tab === 'managing' ? (
            <>
              <Box
                sx={{
                  px: { xs: 2, sm: 3, md: 4 },
                  py: { xs: 2.5, md: 3 },
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '1.3fr 0.7fr' },
                    gap: 3,
                    alignItems: 'start',
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'rgba(66, 50, 28, 0.62)',
                        mb: 1.5,
                      }}
                    >
                      Coming up next
                    </Typography>
                    {topUpcoming.length === 0 ? (
                      <Box
                        sx={{
                          p: 3,
                          borderRadius: '24px',
                          background: 'rgba(255,255,255,0.88)',
                          border: '1px solid rgba(143, 105, 66, 0.12)',
                        }}
                      >
                        <Typography
                          sx={{ fontSize: 14, color: 'rgba(66, 50, 28, 0.72)' }}
                        >
                          No upcoming events you're hosting or servicing.
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={1.4}>
                        {topUpcoming.map((item) => (
                          <CompactManagingEventCard
                            key={item.id}
                            item={item}
                            nextChecklistItem={nextChecklistByItemId.get(item.id)}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>

                  <Box
                    sx={{
                      borderRadius: '24px',
                      background: 'rgba(255,255,255,0.92)',
                      border: '1px solid rgba(143, 105, 66, 0.12)',
                      p: 2,
                      boxShadow: '0 8px 28px rgba(108, 71, 33, 0.06)',
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1.5 }}
                    >
                      <Stack spacing={0.5}>
                        <Typography
                          sx={{
                            fontFamily: 'Syne, sans-serif',
                            fontSize: 15,
                            fontWeight: 800,
                            color: '#2B2118',
                          }}
                        >
                          {monthLabel(visibleMonth)}
                        </Typography>
                        {selectedDateKey ? (
                          <Typography
                            sx={{ fontSize: 11, color: 'rgba(66, 50, 28, 0.68)' }}
                          >
                            Showing {formatCalendarSelection(selectedDateKey)}
                          </Typography>
                        ) : null}
                      </Stack>
                      <Stack direction="row" spacing={0.5}>
                        <Box
                          component="button"
                          onClick={() =>
                            setVisibleMonth(
                              (prev) =>
                                new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                            )
                          }
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '10px',
                            border: '1px solid rgba(143, 105, 66, 0.14)',
                            background: 'rgba(255,255,255,0.9)',
                            display: 'grid',
                            placeItems: 'center',
                            cursor: 'pointer',
                            '&:hover': { background: '#FAECE7' },
                          }}
                        >
                          <ChevronLeft size={14} color="#4A3827" />
                        </Box>
                        <Box
                          component="button"
                          onClick={() =>
                            setVisibleMonth(
                              (prev) =>
                                new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                            )
                          }
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '10px',
                            border: '1px solid rgba(143, 105, 66, 0.14)',
                            background: 'rgba(255,255,255,0.9)',
                            display: 'grid',
                            placeItems: 'center',
                            cursor: 'pointer',
                            '&:hover': { background: '#FAECE7' },
                          }}
                        >
                          <ChevronRight size={14} color="#4A3827" />
                        </Box>
                      </Stack>
                    </Stack>

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: 0.25,
                        textAlign: 'center',
                      }}
                    >
                      {WEEKDAYS.map((day) => (
                        <Typography
                          key={day}
                          sx={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'rgba(66, 50, 28, 0.48)',
                            py: 0.5,
                          }}
                        >
                          {day}
                        </Typography>
                      ))}
                      {monthDays.map((day) => {
                        const dayItems = eventsByDay[day.key] || [];
                        const hasEvents = dayItems.length > 0;
                        const isSelected = selectedDateKey === day.key;
                        return (
                          <Box
                            key={day.key}
                            component="button"
                            onClick={() =>
                              setSelectedDateKey((current) =>
                                current === day.key ? null : day.key,
                              )
                            }
                            sx={{
                              position: 'relative',
                              width: '100%',
                              py: 0.6,
                              borderRadius: '10px',
                              border: 'none',
                              cursor: 'pointer',
                              background: 'transparent',
                              transition:
                                'background-color 0.15s ease, box-shadow 0.15s ease',
                              boxShadow: isSelected
                                ? 'inset 0 0 0 1px rgba(216,90,48,0.45)'
                                : 'none',
                              ...(day.isToday && {
                                background: '#D85A30',
                                color: '#fff',
                              }),
                              ...(!day.isToday &&
                                isSelected && {
                                  background: '#FAECE7',
                                  color: '#7C2D12',
                                }),
                              ...(!day.isToday && day.inMonth && { color: '#2B2118' }),
                              ...(!day.isToday &&
                                !day.inMonth && { color: 'rgba(66, 50, 28, 0.28)' }),
                              '&:hover': {
                                background: day.isToday
                                  ? '#D85A30'
                                  : isSelected
                                    ? '#FAECE7'
                                    : 'rgba(250, 236, 231, 0.7)',
                              },
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: day.isToday ? 800 : 500,
                                lineHeight: 1,
                              }}
                            >
                              {day.date.getDate()}
                            </Typography>
                            {hasEvents && (
                              <Stack
                                direction="row"
                                spacing={0.25}
                                justifyContent="center"
                                sx={{ mt: 0.25 }}
                              >
                                {dayItems.slice(0, 3).map((dayItem) => (
                                  <Box
                                    key={dayItem.id}
                                    sx={{
                                      width: 4,
                                      height: 4,
                                      borderRadius: '50%',
                                      background: KIND_STYLES[dayItem.kind].dot,
                                    }}
                                  />
                                ))}
                              </Stack>
                            )}
                          </Box>
                        );
                      })}
                    </Box>

                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{ mt: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}
                    >
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: KIND_STYLES.hosting.dot,
                          }}
                        />
                        <Typography
                          sx={{ fontSize: 10, color: 'rgba(66, 50, 28, 0.6)' }}
                        >
                          Hosting
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: KIND_STYLES.vendor_application.dot,
                          }}
                        />
                        <Typography
                          sx={{ fontSize: 10, color: 'rgba(66, 50, 28, 0.6)' }}
                        >
                          Servicing
                        </Typography>
                      </Stack>
                      {selectedDateKey ? (
                        <Chip
                          label="Clear date"
                          onClick={() => setSelectedDateKey(null)}
                          sx={{
                            height: 24,
                            bgcolor: '#FAECE7',
                            color: '#7C2D12',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        />
                      ) : null}
                    </Stack>
                  </Box>
                </Box>
              </Box>
            </>
          ) : tab === 'hosting' ? (
            <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2.5, md: 3.5 } }}>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(66, 50, 28, 0.62)',
                  mb: 2,
                }}
              >
                All events
              </Typography>

              {hostingItems.length === 0 ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: '28px',
                    background: 'rgba(255,255,255,0.88)',
                    border: '1px solid rgba(143, 105, 66, 0.12)',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 20,
                      fontWeight: 800,
                      color: '#2B2118',
                    }}
                  >
                    No events yet
                  </Typography>
                  <Typography
                    sx={{ mt: 1, fontSize: 14, color: 'rgba(66, 50, 28, 0.72)' }}
                  >
                    Events you're hosting or servicing will appear here.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {hostingItems.map((item) => (
                    <Box key={item.id} sx={{ opacity: item.isPast ? 0.72 : 1 }}>
                      <ExpandableManagingEventCard
                        item={item}
                        expanded={expandedHostingId === item.id}
                        nextChecklistItem={nextChecklistByItemId.get(item.id)}
                        onToggle={() =>
                          setExpandedHostingId((current) =>
                            current === item.id ? null : item.id,
                          )
                        }
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          ) : tab === 'attending' ? (
            <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2.5, md: 3.5 } }}>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(66, 50, 28, 0.62)',
                  mb: 2,
                }}
              >
                Your attending feed
              </Typography>

              {attendingItems.length === 0 ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: '28px',
                    background: 'rgba(255,255,255,0.88)',
                    border: '1px solid rgba(143, 105, 66, 0.12)',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 20,
                      fontWeight: 800,
                      color: '#2B2118',
                    }}
                  >
                    No attending events yet
                  </Typography>
                  <Typography
                    sx={{ mt: 1, fontSize: 14, color: 'rgba(66, 50, 28, 0.72)' }}
                  >
                    Events you have tickets for will appear here.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {attendingItems.map((item) => (
                    <Box key={item.id} sx={{ opacity: item.isPast ? 0.72 : 1 }}>
                      <ExpandableManagingEventCard
                        item={item}
                        expanded={expandedHostingId === item.id}
                        onToggle={() =>
                          setExpandedHostingId((current) =>
                            current === item.id ? null : item.id,
                          )
                        }
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          ) : tab === 'earnings' ? (
            <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2.5, md: 3.5 } }}>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  gap: 1,
                  mb: 2.2,
                  overflowX: 'auto',
                  pb: 0.5,
                  scrollbarWidth: 'thin',
                  '& > *': {
                    flex: { xs: '0 0 220px', md: '1 1 0' },
                    minWidth: 0,
                  },
                }}
              >
                <SummaryValueCard
                  label="Lifetime earned"
                  value={formatMoney(lifetimeEarned)}
                  hint="UI-first estimate across hosted and serviced live/completed events."
                  icon={<Wallet size={18} />}
                  compact
                />
                <SummaryValueCard
                  label="Total saved"
                  value="Rs 0"
                  hint="Keeping this at zero until payout and savings tracking are wired."
                  icon={<Receipt size={18} />}
                  compact
                />
                <SummaryValueCard
                  label="Events counted"
                  value={String(earningsItems.length)}
                  hint="Completed and live hosted or serviced events only."
                  icon={<CircleDollarSign size={18} />}
                  compact
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography
                  sx={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(66, 50, 28, 0.62)',
                  }}
                >
                  Earnings history
                </Typography>
                <Typography
                  sx={{
                    mt: 0.6,
                    fontFamily: 'Syne, sans-serif',
                    fontSize: { xs: 22, sm: 28 },
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    color: '#2B2118',
                  }}
                >
                  Live and completed event earnings
                </Typography>
                <Typography
                  sx={{ mt: 0.5, fontSize: 14, color: 'rgba(66, 50, 28, 0.72)' }}
                >
                  Expand an event to inspect ticket revenue, vendor costs, or service
                  payout placeholders before backend wiring lands.
                </Typography>
              </Box>

              {earningsItems.length === 0 ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: '28px',
                    background: 'rgba(255,255,255,0.88)',
                    border: '1px solid rgba(143, 105, 66, 0.12)',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 20,
                      fontWeight: 800,
                      color: '#2B2118',
                    }}
                  >
                    No earnings events yet
                  </Typography>
                  <Typography
                    sx={{ mt: 1, fontSize: 14, color: 'rgba(66, 50, 28, 0.72)' }}
                  >
                    Hosted and serviced live or completed events will appear here.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {earningsItems.map((item) => (
                    <EarningsEventRow
                      key={item.id}
                      item={item}
                      expanded={expandedEarningId === item.id}
                      onToggle={() =>
                        setExpandedEarningId((current) =>
                          current === item.id ? null : item.id,
                        )
                      }
                    />
                  ))}
                </Stack>
              )}
            </Box>
          ) : (
            <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2.5, md: 3.5 } }}>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  gap: 1,
                  mb: 2.2,
                  overflowX: 'auto',
                  pb: 0.5,
                  scrollbarWidth: 'thin',
                  '& > *': {
                    flex: { xs: '0 0 220px', md: '1 1 0' },
                    minWidth: 0,
                  },
                }}
              >
                <SummaryValueCard
                  label="My services"
                  value={String(servicesWithApplications.length)}
                  hint="Each service can expand to reveal applications sent to events."
                  icon={<Briefcase size={18} />}
                  compact
                />
                <SummaryValueCard
                  label="Applications sent"
                  value={String(serviceApplications.length)}
                  hint="Grouped below by service instead of event."
                  icon={<ExternalLink size={18} />}
                  compact
                />
                <SummaryValueCard
                  label="Accepted gigs"
                  value={String(
                    serviceApplications.filter(
                      (application) => application.status === 'accepted',
                    ).length,
                  )}
                  hint="Accepted applications across all your services."
                  icon={<Coins size={18} />}
                  compact
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography
                  sx={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(66, 50, 28, 0.62)',
                  }}
                >
                  Service applications
                </Typography>
                <Typography
                  sx={{
                    mt: 0.6,
                    fontFamily: 'Syne, sans-serif',
                    fontSize: { xs: 22, sm: 28 },
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    color: '#2B2118',
                  }}
                >
                  All applications by service
                </Typography>
              </Box>

              {servicesWithApplications.length === 0 ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: '28px',
                    background: 'rgba(255,255,255,0.88)',
                    border: '1px solid rgba(143, 105, 66, 0.12)',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 20,
                      fontWeight: 800,
                      color: '#2B2118',
                    }}
                  >
                    No services yet
                  </Typography>
                  <Typography
                    sx={{ mt: 1, fontSize: 14, color: 'rgba(66, 50, 28, 0.72)' }}
                  >
                    Your listed services will appear here once they are created.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {servicesWithApplications.map((service) => (
                    <ServiceApplicationsRow
                      key={service.id}
                      service={service}
                      expanded={expandedServiceId === String(service.id)}
                      onToggle={() =>
                        setExpandedServiceId((current) =>
                          current === String(service.id) ? null : String(service.id),
                        )
                      }
                    />
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
