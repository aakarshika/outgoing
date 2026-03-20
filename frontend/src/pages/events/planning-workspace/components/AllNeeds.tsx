import { Box, Typography } from '@mui/material';

import type { EventNeed } from '@/types/needs';
import { getCategoryVisuals } from '@/constants/categories';
import { getNeedPresentation } from '../shared';

type AllNeedsProps = {
  eventNeeds: EventNeed[];
  onEditNeed: (needId: number | null) => void;
};

const formatMoney = (value?: string | number | null) => {
  if (!value) return '—';
  return `Rs ${value}`;
}
function formatNeedBudget(need: EventNeed) {
  if (!need.budget_min && !need.budget_max) return 'Free in';
  if (need.budget_min && need.budget_max) return `Comp - ${formatMoney(need.budget_max)}`;
  return `Comp - ${formatMoney(need.budget_min || need.budget_max)}`;
}

export function AllNeeds({ eventNeeds, onEditNeed }: AllNeedsProps) {
  return (
    <Box sx={{  }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
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
        <Typography
          onClick={() => onEditNeed(null)}
          sx={{ fontSize: 12, color: '#D85A30', fontWeight: 500, cursor: 'pointer' }}
        >
          + Add need
        </Typography>
      </Box>

      <Box sx={{ background: '#fff', borderRadius: '14px',}}>
        {eventNeeds.length === 0 ? (
          <Typography sx={{ fontSize: 13, color: 'var(--color-text-secondary)', py: 1.5 }}>
            No needs added yet.
          </Typography>
        ) : (
          eventNeeds.map((need, index) => {
            const visuals = getCategoryVisuals(need.category);
            const presentation = getNeedPresentation(need);
            return (
              <Box
                key={need.id}
                onClick={() => onEditNeed(need.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <Box sx={{ fontSize: 15, width: 24, textAlign: 'center', flexShrink: 0 }}>
                  {visuals.icon}
                </Box>
                <Typography
                  className="need-title"
                  sx={{ fontSize: 13, color: '#1A1A1A', flex: 1, fontWeight: 500, transition: 'color 0.2s' }}
                >
                  {need.title}
                </Typography>

                
                <Box
                  sx={{
                  }}
                ><Typography sx={{ fontSize: 11, 
                  color: '#888780', 
                  mr: 0.75, 
                  whiteSpace: 'nowrap' }}>
                  {formatNeedBudget(need)}
                  </Typography>
                <Typography 
                sx={{ 
                  fontSize: 10,
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: presentation.statusBg,
                  color: presentation.statusColor,
                  whiteSpace: 'nowrap',}}>
                  {presentation.subtitle}
                </Typography>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}

