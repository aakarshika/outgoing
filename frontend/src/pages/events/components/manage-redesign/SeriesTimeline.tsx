import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { EventListItem } from '@/types/events';

interface SeriesTimelineProps {
  occurrences: EventListItem[];
  currentEventId: number;
}

function formatLifecycleState(state: EventListItem['lifecycle_state']) {
  return state.replace(/_/g, ' ').toUpperCase();
}

function getStateColors(state: EventListItem['lifecycle_state']) {
  if (state === 'published' || state === 'event_ready' || state === 'live') {
    return {
      bg: 'rgba(34, 197, 94, 0.1)',
      border: 'rgba(34, 197, 94, 0.55)',
      shadow: '1px 1px 3px rgba(34, 197, 94, 0.12)',
      text: '#166534',
    };
  }

  if (state === 'completed') {
    return {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.55)',
      shadow: '1px 1px 3px rgba(59, 130, 246, 0.12)',
      text: '#1d4ed8',
    };
  }

  return {
    bg: 'white',
    border: 'rgba(0,0,0,0.1)',
    shadow: '1px 1px 3px rgba(0,0,0,0.05)',
    text: '#666',
  };
}

function getDefaultStepSlug(state: EventListItem['lifecycle_state']) {
  if (state === 'completed') {
    return 'wrap-up';
  }

  if (state === 'published' || state === 'event_ready' || state === 'live') {
    return 'live-attendance';
  }

  return 'basic-details';
}

export function SeriesTimeline({ occurrences, currentEventId }: SeriesTimelineProps) {
  const navigate = useNavigate();

  if (!occurrences || occurrences.length <= 1) return null;

  return (
    <Box
      sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pb: 4, position: 'relative' }}
    >
      {occurrences.map((occ: EventListItem, idx: number) => {
        const isCurrent = occ.id === currentEventId;
        const d = new Date(occ.start_time);
        const stateColors = getStateColors(occ.lifecycle_state);
        const cardBg = isCurrent ? 'rgba(239, 68, 68, 0.1)' : stateColors.bg;
        const cardBorder = isCurrent ? '#ef4444' : stateColors.border;
        const cardShadow = isCurrent
          ? '2px 2px 0px rgba(239, 68, 68, 0.2)'
          : stateColors.shadow;
        const accentColor = isCurrent ? '#ef4444' : stateColors.text;

        const targetSlug = getDefaultStepSlug(occ.lifecycle_state);

        return (
          <Box
            key={occ.id}
            onClick={() =>
              !isCurrent &&
              navigate(`/events/${occ.id}/manage/`)
            }
            sx={{
              cursor: isCurrent ? 'default' : 'pointer',
              px: 1.5,
              py: 0.5,
              bgcolor: cardBg,
              border: '1.5px solid',
              borderColor: cardBorder,
              borderRadius: '4px',
              transform: `rotate(${((idx % 3) - 1) * 2}deg)`,
              boxShadow: cardShadow,
              transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              '&:hover': !isCurrent
                ? {
                    transform: 'scale(1.1) rotate(0deg)',
                    boxShadow: '2px 2px 8px rgba(0,0,0,0.1)',
                    borderColor: 'rgba(0,0,0,0.3)',
                    zIndex: 2,
                  }
                : {},
              position: 'relative',
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Caveat", cursive',
                fontSize: '0.9rem',
                fontWeight: isCurrent ? 'bold' : 'normal',
                color: isCurrent ? '#ef4444' : stateColors.text,
                lineHeight: 1,
                pointerEvents: 'none',
              }}
            >
              #{idx + 1}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'serif',
                fontSize: '0.65rem',
                color: accentColor,
                display: 'block',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              {d.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.56rem',
                fontWeight: 700,
                letterSpacing: '0.03em',
                color: accentColor,
                display: 'block',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                mt: 0.15,
              }}
            >
              {formatLifecycleState(occ.lifecycle_state)}
            </Typography>
            {isCurrent && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 6,
                  height: 6,
                  bgcolor: '#ef4444',
                  borderRadius: '50%',
                }}
              />
            )}
          </Box>
        );
      })}
      {/* Scrapbook decoration: dotted line */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          borderBottom: '2px dotted',
          borderColor: 'rgba(0,0,0,0.2)',
          zIndex: -1,
        }}
      />
    </Box>
  );
}
