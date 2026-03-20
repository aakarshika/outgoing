import {
  Box,
  Chip,
  CircularProgress,
  Container,
  Stack,
} from '@mui/material';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import client from '@/api/client';
import { useAuth } from '@/features/auth/hooks';
import {
  getChecklistFocusItem,
  type PlanningChecklistItem,
} from '@/features/events/planningChecklist';
import { fetchEventNeeds } from '@/features/needs/api';
import { useMyApplications } from '@/features/needs/hooks';
import { useMyServices } from '@/features/vendors/hooks';
import type { EventOverviewRow } from '@/pages/alerts/utils';
import type { ApiResponse, EventDetail } from '@/types/events';
import type { EventNeed, NeedApplication } from '@/types/needs';
import type { VendorService } from '@/types/vendors';
import * as managingUtils from './useManaging';
import { MyAttending } from './MyAttending';
import { MyEarnings } from './MyEarnings';
import { MyEvents } from './MyEvents';
import { MyServices } from './MyServices';
import { MyUpcoming } from './MyUpcoming';

async function fetchEventOverview() {
  return client.get<ApiResponse<EventOverviewRow[]>>('/alerts/event-overview/');
}

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
  kind: ManagingKind;
  isPast: boolean;
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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const VALID_TABS: ManagingTab[] = [
  'managing',
  'attending',
  'hosting',
  'services',
  'earnings',
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
  const [expandedAttendingId, setExpandedAttendingId] = useState<string | null>(null);
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
    queryFn: fetchEventOverview as any,
    enabled: !!user,
  });

  const overviewRows = (((overviewResponse as any)?.data?.data as EventOverviewRow[]) ||
    []) as EventOverviewRow[];
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
          route: `/events-new/${eventId}`,
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
          route: `/events-new/${eventId}`,
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
          route: `/events-new/${eventId}`,
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
      (item) => managingUtils.toDateKey(new Date(item.eventTime)) === selectedDateKey,
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

  const eventsByDay = useMemo(() => {
    const bucket: Record<string, ManagingItem[]> = {};
    typeFiltered.forEach((item) => {
      const key = managingUtils.toDateKey(new Date(item.eventTime));
      if (!bucket[key]) bucket[key] = [];
      bucket[key].push(item);
    });
    return bucket;
  }, [typeFiltered]);

  const earningsItems = useMemo(
    () =>
      timeline
        .map((item) => managingUtils.buildEarningsItem(item))
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
        pt: 8,
        pb: 20,
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(255, 244, 227, 0.9), transparent 32%), linear-gradient(180deg, #FFFDF8 0%, #FFF6EA 48%, #FFFDF8 100%)',
      }}
    >
      <Container maxWidth={false}>
        <Box>
          <Box sx={{ borderBottom: '1px solid rgba(143, 105, 66, 0.10)' }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {(
                  [
                    { key: 'managing', label: 'Upcoming Events' },
                    { key: 'earnings', label: 'Earnings' },
                    { key: 'hosting', label: 'My Events' },
                    { key: 'attending', label: 'My Tickets' },
                    { key: 'services', label: 'My Services' },
                  ] as const
                ).map((pageTab) => (
                  <Chip
                    key={pageTab.key}
                    label={pageTab.label}
                    onClick={() => setTab(pageTab.key)}
                    sx={{
                      height: 36,
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

            </Stack>
          </Box>

          {tab === 'managing' ? (
            <MyUpcoming
              topUpcoming={topUpcoming as any}
              nextChecklistByItemId={nextChecklistByItemId as any}
              visibleMonth={visibleMonth}
              setVisibleMonth={setVisibleMonth}
              selectedDateKey={selectedDateKey}
              setSelectedDateKey={setSelectedDateKey}
              filter={filter}
              setFilter={setFilter}
              eventsByDay={eventsByDay as any}
              weekdays={WEEKDAYS}
              kindStyles={managingUtils.KIND_STYLES as any}
            />
          ) : tab === 'hosting' ? (
            <MyEvents
              hostingItems={hostingItems as any}
              expandedHostingId={expandedHostingId}
              setExpandedHostingId={setExpandedHostingId}
              nextChecklistByItemId={nextChecklistByItemId as any}
            />
          ) : tab === 'attending' ? (
            <MyAttending
              attendingItems={attendingItems as any}
              expandedAttendingId={expandedAttendingId}
              setExpandedAttendingId={setExpandedAttendingId}
            />
          ) : tab === 'earnings' ? (
            <MyEarnings
              lifetimeEarned={lifetimeEarned}
              earningsItems={earningsItems as any}
              expandedEarningId={expandedEarningId}
              setExpandedEarningId={setExpandedEarningId}
            />
          ) : (
            <MyServices
              servicesWithApplications={servicesWithApplications as any}
              serviceApplications={serviceApplications}
              expandedServiceId={expandedServiceId}
              setExpandedServiceId={setExpandedServiceId}
            />
          )}
        </Box>
      </Container>
    </Box>
  );
}
