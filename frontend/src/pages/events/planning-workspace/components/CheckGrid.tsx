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
}: PlanningCheckGridProps) {
  return (
    <Box sx={{ mx: 2.1, mt: 1.5 }}>
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
          color: '#888780',
          mb: 1,
        }}
      >
        Event setup
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
        {[
          { state: 'done' as const, 
            emoji: '📅', 
            title: 'When & where', 
            sub: whenWhereSub, 
            badge: 'Set',
            onClick: () => setIsQuickCreateOpen(true),
          },
          {
            state: ticketsTiers > 0 ? ('done' as const) : ('todo' as const),
            emoji: '🎟️',
            title: 'Tickets',
            sub: `${ticketsTiers} tiers · ${ticketsSold} sold`,
            badge: ticketsBadge,
          },
          {
            state: openNeedsCount > 0 ? ('warn' as const) : ('done' as const),
            emoji: '⚡',
            title: 'Needs met',
            sub: needsSub,
            badge: openNeedsCount > 0 ? 'Incomplete' : 'Complete',
          },
          {
            state: salesNotDone ? ('locked' as const) : ('done' as const),
            emoji: '👤',
            title: 'Ready to receive guests',
            sub: salesNotDone ? 'Min. threshold not yet reached' : 'All set to admit guests',
            badge: salesNotDone ? 'Not yet' : 'Ready',
          },
        ].map((card, idx) => {
          const isDone = card.state === 'done';
          const isWarn = card.state === 'warn';
          const isLocked = card.state === 'locked';

          return (
            <Box
              key={idx}
              sx={{
                background: '#fff',
                borderRadius: '14px',
                p: 1.7,
                position: 'relative',
                overflow: 'hidden',
                border: isWarn ? '1.5px solid #EF9F27' : '1.5px solid transparent',
                opacity: isLocked ? 0.45 : 1,
                cursor: card.onClick ? 'pointer' : 'default',
                '&:hover': {
                  background: card.onClick ? '#F1EFE8' : 'transparent',
                },
              }}
              onClick={card.onClick}
            >
              {isDone ? <Typography sx={{ position: 'absolute', top: 10, right: 10, fontSize: 13, color: '#1D9E75' }}>✓</Typography> : null}
              <Typography sx={{ fontSize: 24, mb: 1 }}>{card.emoji}</Typography>
              <Typography
                sx={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#1A1A1A', lineHeight: 1.25 }}
              >
                {card.title}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#888780', lineHeight: 1.35, mt: 0.2 }}>{card.sub}</Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mt: 1,
                  fontSize: 10,
                  fontWeight: 500,
                  px: 1,
                  py: 0.4,
                  borderRadius: '999px',
                  background: isDone ? '#EAF3DE' : isWarn ? '#FAEEDA' : isLocked ? '#F1EFE8' : '#F1EFE8',
                  color: isDone ? '#3B6D11' : isWarn ? '#854F0B' : '#888780',
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

