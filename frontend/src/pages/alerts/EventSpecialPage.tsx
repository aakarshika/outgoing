import { Box, CircularProgress, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import client from '@/api/client';
import { ScrapbookEventCard } from '@/features/events/ScrapbookEventCard';
import { useAuth } from '@/features/auth/hooks';
import { ApiResponse, EventDetail } from '@/types/events';

interface EventOverviewRow {
  event_id: number;
  event_created_date: string;
  event_lifecycle_state: string;
  event_capacity: number | null;
  host_user_id: number;

  number_of_total_needs: number;
  number_of_needs_filled: number;
  number_of_needs_override_filled: number;

  need_id: number | null;
  need_application_requested_by_host_vendor_user_id: number | null;
  need_applied_to_user_id: number | null;
  need_assigned_user_id: number | null;

  need_application_id: number | null;
  need_application_status: string | null;
  need_application_created_date: string | null;
  need_status: string | null;

  number_of_tickets_purchased_not_cancelled: number;
  number_of_tickets_used: number;

  attendee_user_id: number | null;
  ticket_created_date: string | null;
  ticket_status: string | null;

  // Backend should join EventDetailSerializer here
  event_details: EventDetail;
}

async function fetchEventOverview(): Promise<EventOverviewRow[]> {
  // Backend endpoint backed by the `event_overview` DB view.
  const { data } = await client.get<ApiResponse<EventOverviewRow[]>>('/alerts/event-overview/');
  return data.data;
}

export default function EventsSpecialPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<EventOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchEventOverview();
        if (!active) return;
        setRows(data);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || 'Something went wrong loading events.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const { hostingEvents, vendorEvents, attendeeEvents } = useMemo(() => {
    const hosting = new Map<number, EventDetail>();
    const vendor = new Map<number, EventDetail>();
    const attendee = new Map<number, EventDetail>();

    if (!user) {
      return {
        hostingEvents: [] as EventDetail[],
        vendorEvents: [] as EventDetail[],
        attendeeEvents: [] as EventDetail[],
      };
    }

    const userId = user.id;

    for (const row of rows) {
      // Avoid completed/cancelled for this special overview
      if (['completed', 'cancelled'].includes(row.event_lifecycle_state)) continue;

      const detail = row.event_details;
      if (!detail) continue;

      // Host role
      if (row.host_user_id === userId) {
        hosting.set(row.event_id, detail);
      }

      // Vendor role: applied, invited, or assigned
      if (
        row.need_applied_to_user_id === userId ||
        row.need_application_requested_by_host_vendor_user_id === userId ||
        row.need_assigned_user_id === userId
      ) {
        vendor.set(row.event_id, detail);
      }

      // Attendee role
      if (row.attendee_user_id === userId) {
        attendee.set(row.event_id, detail);
      }
    }

    return {
      hostingEvents: Array.from(hosting.values()),
      vendorEvents: Array.from(vendor.values()),
      attendeeEvents: Array.from(attendee.values()),
    };
  }, [rows, user]);

  return (
    <Box
      className="min-h-screen px-4 sm:px-6 py-8"
      sx={{
        backgroundColor: '#f4f1ea',
        backgroundImage:
          'radial-gradient(#e5e7eb 0.5px, transparent 0.5px), radial-gradient(#e5e7eb 0.5px, transparent 0.5px)',
        backgroundSize: '14px 14px',
        backgroundPosition: '0 0, 7px 7px',
      }}
    >
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Permanent Marker"',
            mb: 4,
            textAlign: 'center',
            color: '#1f2933',
          }}
        >
          Your Events at a Glance
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && (
          <Typography color="error" sx={{ textAlign: 'center', mt: 4 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && !user && (
          <Typography sx={{ textAlign: 'center', mt: 4 }}>
            Please sign in to see your events.
          </Typography>
        )}

        {!loading && !error && user && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
              gap: 4,
            }}
          >
            <RoleColumn title="Hosting" events={hostingEvents} />
            <RoleColumn title="Servicing" events={vendorEvents} />
            <RoleColumn title="Attending" events={attendeeEvents} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

function RoleColumn({ title, events }: { title: string; events: EventDetail[] }) {
  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontFamily: '"Permanent Marker"',
          color: '#374151',
          textAlign: 'center',
        }}
      >
        {title}
      </Typography>

      {events.length === 0 ? (
        <Typography
          sx={{
            fontSize: '0.85rem',
            color: '#6b7280',
            textAlign: 'center',
          }}
        >
          No events here yet.
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 3,
          }}
        >
          {events.map((event) => (
            <ScrapbookEventCard
              key={event.id}
              event={event}
              isFocused={false}
              showClip
              isBasicEventCard={false}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}