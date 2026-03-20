import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

export const LIFECYCLE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  draft: { label: 'Draft', color: '#64748b', bg: '#f1f5f9' },
  published: { label: 'Published', color: '#2563eb', bg: '#dbeafe' },
  at_risk: { label: 'At Risk', color: '#d97706', bg: '#fef3c7' },
  postponed: { label: 'Postponed', color: '#ea580c', bg: '#ffedd5' },
  event_ready: { label: 'Confirmed ✓', color: '#3B6D11', bg: '#EAF3DE' },
  live: { label: 'Live Now', color: '#16a34a', bg: '#dcfce7' },
  cancelled: { label: 'Cancelled', color: '#dc2626', bg: '#fee2e2' },
  completed: { label: 'Completed', color: '#7c3aed', bg: '#ede9fe' },
};

interface NormalStatusModuleProps {
  event: any;
  isHost: boolean;
}

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const COUNTDOWN_TRIGGER_MS = 2 * 24 * 60 * 60 * 1000;

function getCountdownParts(targetDate: Date): CountdownParts {
  const diff = Math.max(0, targetDate.getTime() - Date.now());

  return {
    days: Math.floor(diff / (24 * 60 * 60 * 1000)),
    hours: Math.floor((diff / (60 * 60 * 1000)) % 24),
    minutes: Math.floor((diff / (60 * 1000)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function NormalStatusModule({ event }: NormalStatusModuleProps) {
  const lifecycle = event?.lifecycle_state || 'draft';
  const config = LIFECYCLE_CONFIG[lifecycle] || LIFECYCLE_CONFIG.draft;

  // Treat missing/0 capacity as "infinite" capacity.
  const rawCapacity = event?.capacity;
  const capacity = rawCapacity == null ? null : Number(rawCapacity);
  const isInfiniteCapacity = capacity == null || capacity === 0;

  const soldCount = Number(event.ticket_count || event.tickets_sold) || 0;
  const explicitMin = Number(event.min_attendees) || 0;
  const minRequired = explicitMin > 0 ? explicitMin : isInfiniteCapacity ? 1 : 0;

  const progress = isInfiniteCapacity
    ? Math.min((soldCount / Math.max(minRequired, 1)) * 100, 100)
    : capacity != null
      ? Math.min((soldCount / capacity) * 100, 100)
      : 0;
  const minReached = soldCount >= minRequired;
  const spotsLeft = !isInfiniteCapacity && capacity != null ? Math.max(capacity - soldCount, 0) : null;
  const remainingRatio = isInfiniteCapacity
    ? 1
    : capacity != null && capacity > 0
      ? (spotsLeft ?? 0) / capacity
      : 1;
  const capacityLabel = isInfiniteCapacity ? 'Unlimited' : capacity;
  const remainingLabel = isInfiniteCapacity ? 'Unlimited remaining' : `${spotsLeft} remaining`;
  const startTime = event?.start_time ? new Date(event.start_time) : null;
  const timeUntilStart = startTime ? startTime.getTime() - Date.now() : null;
  const showCountdown =
    Boolean(startTime) &&
    Boolean(
      timeUntilStart && timeUntilStart > 0 && timeUntilStart <= COUNTDOWN_TRIGGER_MS,
    );
  const [countdown, setCountdown] = useState<CountdownParts | null>(() =>
    showCountdown && startTime ? getCountdownParts(startTime) : null,
  );

  useEffect(() => {
    if (!showCountdown || !startTime) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const next = getCountdownParts(startTime);
      setCountdown(next);
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(timer);
  }, [showCountdown, startTime?.getTime()]);

  const urgency =
    remainingRatio < 0.2
      ? {
          accent: '#C93C37',
          soft: '#FCE9E7',
          text: '#8D231F',
          track: 'rgba(201, 60, 55, 0.16)',
        }
      : remainingRatio < 0.5
        ? {
            accent: '#C88A16',
            soft: '#FCF1D7',
            text: '#8A5A00',
            track: 'rgba(200, 138, 22, 0.18)',
          }
        : {
            accent: '#D85A30',
            soft: '#FAECE7',
            text: '#993C1D',
            track: 'rgba(216, 90, 48, 0.16)',
          };

  // Only show for upcoming events
  if (!['published', 'event_ready', 'at_risk'].includes(lifecycle)) return null;

  return (
    <Box
      sx={{
        mx: 2,
        mt: 1.75,
        bgcolor: '#fff',
        p: 1.5,
      }}
    >

      {capacity != null && (<Box
        sx={{
          height: 6,
          bgcolor: 'var(--color-border-tertiary, #e5e7eb)',
          borderRadius: 999,
          overflow: 'hidden',
          mb: 0.75,
        }}
      >
        <Box
          sx={{
            height: 6,
            width: `${progress}%`,
            borderRadius: 999,
            bgcolor: urgency.accent,
          }}
        />
      </Box>)}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: urgency.text,
          mb: minRequired > 0 ? 1 : 0,
        }}
      >
        <span>
          {soldCount} of {capacityLabel} spots filled
        </span>
        <span>{remainingLabel}</span>
      </Box>

      {minRequired > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            bgcolor: minReached ? '#EAF3DE' : urgency.soft,
            borderRadius: '10px',
            px: 1.25,
            py: 0.9,
            mb: showCountdown ? 1 : 0,
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: minReached ? '#3B6D11' : urgency.text,
            }}
          >
            {minReached ? 'Min. required reached' : 'Min. required'}
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 500,
              color: minReached ? '#3B6D11' : 'var(--color-text-secondary, #6b7280)',
            }}
          >
            {minReached ? `${minRequired}+ confirmed` : `${minRequired} needed for event to happen`}
          </Typography>
        </Box>
      )}

      {showCountdown && countdown && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 0.75,
          }}
        >
          {[
            { label: 'Days', value: countdown.days },
            { label: 'Hours', value: countdown.hours },
            { label: 'Mins', value: countdown.minutes },
            { label: 'Secs', value: countdown.seconds },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{
                borderRadius: '10px',
                border: '1px solid #111',
                bgcolor: '#fff',
                px: 0.75,
                py: 0.9,
                textAlign: 'center',
              }}
            >
              <Typography
                sx={{
                  fontSize: 16,
                  lineHeight: 1,
                  fontWeight: 700,
                  color: '#111',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {String(item.value).padStart(2, '0')}
              </Typography>
              <Typography
                sx={{
                  mt: 0.35,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#6b7280',
                }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
