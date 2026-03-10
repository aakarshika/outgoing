import { Box, CircularProgress, Typography } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';

import client from '@/api/client';
import { useAuth } from '@/features/auth/hooks';
import { ScrapbookEventCard } from '@/features/events/ScrapbookEventCard';
import { ApiResponse } from '@/types/events';

import {
  EventOverviewRow,
  getConfirmDateLabel,
  getEventStep,
  getEventTimeLabel,
  getStepStatusLabel,
} from './utils';

async function fetchEventOverview(): Promise<EventOverviewRow[]> {
  // Backend endpoint backed by the `event_overview` DB view.
  const { data } = await client.get<ApiResponse<EventOverviewRow[]>>(
    '/alerts/event-overview/',
  );
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
    const hosting = new Map<number, EventOverviewRow>();
    const vendor = new Map<number, EventOverviewRow>();
    const attendee = new Map<number, EventOverviewRow>();

    if (!user) {
      return {
        hostingEvents: [] as EventOverviewRow[],
        vendorEvents: [] as EventOverviewRow[],
        attendeeEvents: [] as EventOverviewRow[],
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
        hosting.set(row.event_id, row);
      }

      // Vendor role: applied, invited, or assigned
      if (
        row.need_applied_to_user_id === userId ||
        row.need_application_requested_by_host_vendor_user_id === userId ||
        row.need_assigned_user_id === userId
      ) {
        vendor.set(row.event_id, row);
      }

      // Attendee role
      if (row.attendee_user_id === userId && row.ticket_status !== 'cancelled') {
        attendee.set(row.event_id, row);
      }
    }

    return {
      hostingEvents: Array.from(hosting.values()).sort(
        (a, b) =>
          new Date(b.event_created_date || 0).getTime() -
          new Date(a.event_created_date || 0).getTime(),
      ),
      vendorEvents: Array.from(vendor.values()).sort(
        (a, b) =>
          new Date(b.need_application_created_date || 0).getTime() -
          new Date(a.need_application_created_date || 0).getTime(),
      ),
      attendeeEvents: Array.from(attendee.values()).sort(
        (a, b) =>
          new Date(b.ticket_created_date || 0).getTime() -
          new Date(a.ticket_created_date || 0).getTime(),
      ),
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
            <RoleColumn
              title="Hosting"
              rows={hostingEvents}
              role="host"
              userId={user.id}
            />
            <RoleColumn
              title="Servicing"
              rows={vendorEvents}
              role="vendor"
              userId={user.id}
            />
            <RoleColumn
              title="Attending"
              rows={attendeeEvents}
              role="attendee"
              userId={user.id}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

function StepTabsFlowchart({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        mb: 1,
        mt: 1,
      }}
    >
      {steps.map((step, idx) => {
        const isActive = step === currentStep;
        const isPast = step < currentStep;

        return (
          <React.Fragment key={step}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                fontFamily: '"Permanent Marker", cursive',
                transition: 'all 0.2s',
                backgroundColor: isActive ? '#fef08a' : isPast ? '#fef9c3' : '#ffffff',
                color: isActive ? '#111827' : isPast ? '#4b5563' : '#9ca3af',
                border: '2px solid',
                borderColor: isActive ? '#111827' : isPast ? '#6b7280' : '#d1d5db',
                boxShadow: isActive
                  ? '2px 2px 0px #333'
                  : isPast
                    ? '1px 1px 0px #555'
                    : 'none',
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                zIndex: isActive ? 10 : 1,
              }}
            >
              {isPast ? '✓' : step}
            </Box>

            {idx < steps.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  height: 2,
                  mx: 0.5,
                  backgroundColor: isPast ? '#6b7280' : '#e5e7eb',
                  transition: 'all 0.2s',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
}

function RoleColumn({
  title,
  rows,
  role,
  userId,
}: {
  title: string;
  rows: EventOverviewRow[];
  role: 'host' | 'vendor' | 'attendee';
  userId: number;
}) {
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

      {rows.length === 0 ? (
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
          {rows.map((row) => {
            const { currentStep, totalSteps } = getEventStep(role, row, userId);
            const statusLabel = getStepStatusLabel(role, row, userId);
            const timeLabel = getEventTimeLabel(row.event_details.start_time);
            const confirmDateLabel = getConfirmDateLabel(role, row);

            return (
              <Box key={row.event_id} sx={{ display: 'flex', flexDirection: 'column' }}>
                <StepTabsFlowchart currentStep={currentStep} totalSteps={totalSteps} />
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    px: 1,
                    mb: 1.5,
                    mt: -0.5,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography
                      sx={{
                        fontSize: '0.65rem',
                        fontFamily: '"Permanent Marker", cursive',
                        color: '#4b5563',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {statusLabel}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.65rem',
                        fontFamily: '"Permanent Marker", cursive',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Event : {timeLabel}
                    </Typography>
                  </Box>
                  {confirmDateLabel && (
                    <Typography
                      sx={{
                        fontSize: '0.55rem',
                        fontFamily: '"Permanent Marker", cursive',
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        textAlign: 'right',
                        mt: 0.25,
                      }}
                    >
                      {confirmDateLabel}
                    </Typography>
                  )}
                </Box>
                <ScrapbookEventCard
                  event={row.event_details}
                  isFocused={false}
                  showClip
                  isBasicEventCard={false}
                />
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
