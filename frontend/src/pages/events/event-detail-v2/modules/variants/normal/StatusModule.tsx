import { Box, Typography } from '@mui/material';

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

export function NormalStatusModule({ event, isHost }: NormalStatusModuleProps) {
  const lifecycle = event?.lifecycle_state || 'draft';
  const config = LIFECYCLE_CONFIG[lifecycle] || LIFECYCLE_CONFIG.draft;

  const capacity = event.capacity || 100;
  const soldCount = event.ticket_count || event.tickets_sold || 0;
  const minRequired = event.min_attendees || 20;
  const progress = Math.min((soldCount / capacity) * 100, 100);
  const minReached = soldCount >= minRequired;
  const spotsLeft = capacity - soldCount;

  // Only show for upcoming events
  if (!['published', 'event_ready', 'at_risk'].includes(lifecycle)) return null;

  return (
    <Box
      sx={{
        mx: 2,
        mt: 1.75,
        bgcolor: 'var(--color-background-secondary, #f9fafb)',
        borderRadius: 'var(--border-radius-lg, 12px)',
        p: 1.5,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: 'var(--color-text-secondary, #6b7280)',
          }}
        >
          Event status
        </Typography>
        <Box
          sx={{
            fontSize: 11,
            fontWeight: 500,
            px: 1.25,
            py: 0.4,
            borderRadius: 999,
            bgcolor: config.bg,
            color: config.color,
          }}
        >
          {config.label}
        </Box>
      </Box>

      <Box
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
            bgcolor: '#D85A30',
          }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--color-text-secondary, #6b7280)',
        }}
      >
        <span>
          {soldCount} of {capacity} spots filled
        </span>
        <span>
          {minReached ? (
            <span style={{ color: '#3B6D11' }}>Min. {minRequired} reached ✓</span>
          ) : (
            `Min. ${minRequired} needed`
          )}
        </span>
      </Box>

      {isHost && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: 'block', fontSize: 10 }}
        >
          Event ID: {event.id}
        </Typography>
      )}
    </Box>
  );
}
