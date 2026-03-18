import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/features/events/constants';
import { Box, Typography } from '@mui/material';



interface NormalBrowseModuleProps {
  event: any;
}

export function NormalBrowseModule({ event }: NormalBrowseModuleProps) {
  const moreFromHost = event.more_events_from_host || [];
  const similarEvents = event.similar_events || [];

  const events = [...moreFromHost, ...similarEvents].slice(0, 4);

  if (events.length === 0) return null;

  return (
    <Box sx={{ px: 2, pt: 2 }}>
      <Typography
        sx={{
          fontFamily: '"Syne", sans-serif',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-text-primary, #111)',
          mb: 1.25,
          letterSpacing: '0.01em',
        }}
      >
        {moreFromHost.length > 0
          ? `More from ${event.host?.name || event.host?.username}`
          : 'More like this'}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 1.25,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          pb: 0.5,
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {events.map((evt: any, idx: number) => {
          const categorySlug = evt.category?.slug || '';
          const bgColor = CATEGORY_COLORS[categorySlug] || '#F1F5F9';
          const icon = CATEGORY_ICONS[categorySlug] || '📅';

          const eventDate = evt.start_time ? new Date(evt.start_time) : null;
          const dateStr = eventDate
            ? eventDate.toLocaleDateString('en-US', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })
            : '';
          const price =
            evt.min_price === 0 || evt.price === 0
              ? 'Free'
              : evt.min_price
                ? `₹${evt.min_price}`
                : '';

          return (
            <Box
              key={idx}
              sx={{
                minWidth: 160,
                bgcolor: 'var(--color-background-primary, #fff)',
                border: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
                borderRadius: 'var(--border-radius-lg, 12px)',
                overflow: 'hidden',
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              <Box
                sx={{
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  bgcolor: bgColor,
                }}
              >
                {evt.cover_image ? (
                  <Box
                    component="img"
                    src={evt.cover_image}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  icon
                )}
              </Box>
              <Box sx={{ p: 1 }}>
                <Typography
                  sx={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--color-text-secondary, #6b7280)',
                    fontWeight: 500,
                  }}
                >
                  {evt.category?.name || 'Event'}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"Syne", sans-serif',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #111)',
                    lineHeight: 1.3,
                    mt: 0.25,
                  }}
                >
                  {evt.title?.slice(0, 30)}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 10,
                    color: 'var(--color-text-secondary, #6b7280)',
                    mt: 0.5,
                  }}
                >
                  {dateStr}
                  {dateStr && price ? ' · ' : ''}
                  {price}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
