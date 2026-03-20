import { Box, Typography } from '@mui/material';

type PlanningCheckGridProps = {
  whenWhereSub: string;
  ticketsTiers: number;
  ticketsSold: number;
  ticketsBadge: string;
  openNeedsCount: number;
  needsSub: string;
  salesNotDone: boolean;
  setIsQuickCreateOpen: (open: boolean) => void;
  onTicketsClick?: () => void;
  onNeedsClick?: () => void;
  onChecklistClick?: () => void;
};

export function PlanningCheckGrid({
  whenWhereSub,
  ticketsTiers,
  ticketsSold,
  ticketsBadge,
  openNeedsCount,
  needsSub,
  salesNotDone,
  setIsQuickCreateOpen,
  onTicketsClick,
  onNeedsClick,
  onChecklistClick,
}: PlanningCheckGridProps) {
  return (
    <Box sx={{ mx: 1.75, mt: 1.75 }}>
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
          color: '#888780',
          mb: 1.25,
          pl: 0.25,
        }}
      >
        Plan your event
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
        {[
          {
            state: 'done' as const,
            emoji: '📅',
            title: 'When & where',
            sub: whenWhereSub,
            badge: 'Done',
            onClick: () => setIsQuickCreateOpen(true),
          },
          {
            state: ticketsTiers > 0 ? ('done' as const) : ('todo' as const),
            emoji: '🎟️',
            title: 'Tickets',
            sub: `${ticketsTiers} tiers · ${ticketsSold} sold`,
            badge: ticketsTiers > 0 ? 'Done' : 'Not set',
            onClick: onTicketsClick,
          },
          {
            state: openNeedsCount > 0 ? ('warn' as const) : ('done' as const),
            emoji: '🧰',
            title: 'Needs',
            sub: needsSub,
            badge: openNeedsCount > 0 ? 'Needs filling' : 'Done',
            onClick: onNeedsClick,
          },
          {
            state: salesNotDone ? ('locked' as const) : ('done' as const),
            emoji: '👤',
            title: 'Guest list',
            sub: salesNotDone ? 'Min. threshold not yet reached' : 'Ready to admit guests',
            badge: salesNotDone ? 'Not yet' : 'Ready',
            onClick: onChecklistClick,
          },
        ].map((card, idx) => {
          const isDone = card.state === 'done';
          const isWarn = card.state === 'warn';
          const isLocked = card.state === 'locked';
          const isClickable = !!card.onClick;

          return (
            <Box
              key={idx}
              sx={{
                background: '#fff',
                borderRadius: '14px',
                p: 1.75,
                position: 'relative',
                overflow: 'hidden',
                opacity: isLocked ? 0.55 : 1,
                cursor: isClickable ? 'pointer' : 'default',
                border: '0.5px solid #F0EDE8',
                '&:hover': {
                  background: isClickable ? '#fdfdfd' : 'transparent',
                },
              }}
              onClick={card.onClick}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 32,
                  height: 32,
                  borderRadius: '0 14px 0 32px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  padding: '5px 6px',
                  fontSize: 12,
                  fontWeight: 700,
                  background: isDone ? '#EAF3DE' : isWarn ? '#FCEBEB' : '#F1EFE8',
                  color: isDone ? '#3B6D11' : isWarn ? '#D12424' : '#888780',
                }}
              >
                {isDone ? '✓' : isWarn ? '!' : ''}
              </Box>

              <Typography sx={{ fontSize: 26, mb: 1 }}>{card.emoji}</Typography>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#1A1A1A',
                  lineHeight: 1.25,
                  mb: 0.5,
                }}
              >
                {card.title}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#888780', lineHeight: 1.4 }}>
                {card.sub}
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mt: 1.25,
                  fontSize: 10,
                  fontWeight: 500,
                  px: 1.1,
                  py: 0.4,
                  borderRadius: '999px',
                  background: isDone ? '#EAF3DE' : isWarn ? '#FAECE7' : '#F1EFE8',
                  color: isDone ? '#3B6D11' : isWarn ? '#993C1D' : '#5F5E5A',
                }}
              >
                {card.badge}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

