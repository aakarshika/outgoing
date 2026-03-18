import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { useFeed } from '@/features/events/hooks';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/features/events/constants';



interface NormalRecommendedModuleProps {
  currentEventId?: number;
}

export function NormalRecommendedModule({
  currentEventId,
}: NormalRecommendedModuleProps) {
  const navigate = useNavigate();
  const { data: feedResponse, isLoading } = useFeed({
    sort: 'trending',
    page_size: 10,
  });

  const events = (feedResponse?.data || [])
    .filter((evt: any) => evt.id !== currentEventId)
    .slice(0, 6);

  if (isLoading) {
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
          These might be of your interest too...
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 1.25,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            pb: 0.5,
          }}
        >
          {[1, 2, 3].map((i) => (
            <Box
              key={i}
              sx={{
                minWidth: 160,
                height: 160,
                bgcolor: 'var(--color-background-secondary, #f3f4f6)',
                borderRadius: 'var(--border-radius-lg, 12px)',
                flexShrink: 0,
              }}
            />
          ))}
        </Box>
      </Box>
    );
  }

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
        These might be of your interest too...
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
        {events.map((evt: any) => {
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
              key={evt.id}
              onClick={() => navigate(`/events-new/${evt.id}`)}
              sx={{
                minWidth: 160,
                bgcolor: 'var(--color-background-primary, #fff)',
                border: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
                borderRadius: 'var(--border-radius-lg, 12px)',
                overflow: 'hidden',
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                },
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
                  position: 'relative',
                  overflow: 'hidden',
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
                {evt.is_live && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      bgcolor: '#ef4444',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 600,
                      px: 0.75,
                      py: 0.25,
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Live
                  </Box>
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
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {evt.title}
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
