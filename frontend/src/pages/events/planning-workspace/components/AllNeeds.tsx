import { Box, Typography } from '@mui/material';

import type { EventNeed } from '@/types/needs';
import { getNeedPresentation, getNeedVisuals } from '../shared';

type AllNeedsProps = {
  eventNeeds: EventNeed[];
};

function formatNeedBudget(need: EventNeed) {
  if (!need.budget_min && !need.budget_max) return 'Free in';
  if (need.budget_min && need.budget_max) return `${need.budget_min} - ${need.budget_max}`;
  return need.budget_min || need.budget_max || '—';
}

export function AllNeeds({ eventNeeds }: AllNeedsProps) {
  return (
    <Box sx={{ mx: 2.1, mt: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            color: '#888780',
          }}
        >
          All needs
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#D85A30', fontWeight: 500 }}>+ Add</Typography>
      </Box>

      <Box sx={{ background: '#fff', borderRadius: '14px', px: 1.5, py: 1.1 }}>
        {eventNeeds.length === 0 ? (
          <Typography sx={{ fontSize: 13, color: 'var(--color-text-secondary)', py: 1.5 }}>No needs added yet.</Typography>
        ) : (
          eventNeeds.map((need, index) => {
            const visuals = getNeedVisuals(need);
            const presentation = getNeedPresentation(need);
            return (
              <Box
                key={need.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.1,
                  py: 1,
                  borderTop: index === 0 ? 'none' : '0.5px solid #F0EDE8',
                }}
              >
                <Box sx={{ fontSize: 15, width: 22, textAlign: 'center', flexShrink: 0 }}>{visuals.icon}</Box>
                <Typography sx={{ fontSize: 13, color: '#1A1A1A', flex: 1, fontWeight: 500 }}>{need.title}</Typography>
                <Typography sx={{ fontSize: 11, color: '#888780', mr: 0.5, whiteSpace: 'nowrap' }}>
                  {formatNeedBudget(need)}
                </Typography>
                <Box
                  sx={{
                    fontSize: 10,
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: presentation.statusBg,
                    color: presentation.statusColor,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {presentation.statusLabel}
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}

