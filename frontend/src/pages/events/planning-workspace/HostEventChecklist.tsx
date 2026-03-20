import { Box, Stack, Typography } from '@mui/material';

import type { PlanningChecklistItem } from '@/features/events/planningChecklist';

type HostEventChecklistProps = {
  checklistItems: PlanningChecklistItem[];
  completedChecklistCount: number;
};

export function HostEventChecklist({
  checklistItems,
  completedChecklistCount,
}: HostEventChecklistProps) {
  return (
    <Box sx={{ mx: 0, mt: 0 }}>
      {/* Label for Checklist */}
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
        Checklist
      </Typography>

      <Box
        sx={{
          background: '#fff',
          borderRadius: '14px',
          padding: '12px 16px',
          border: '0.5px solid #F0EDE8',
        }}
      >
        <Stack spacing={0}>
          {checklistItems.map((item, index) => {
            const isDone = item.status === 'done';
            const isWarn = item.status === 'warn';

            return (
              <Stack
                key={item.label}
                direction="row"
                spacing={1.25}
                sx={{
                  py: 1,
                  alignItems: 'center',
                  borderBottom: index < checklistItems.length - 1 ? '0.5px solid #F0EDE8' : 'none',
                }}
              >
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: isDone ? '#1D9E75' : isWarn ? '#E24B4A' : '#B4B2A9',
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  {isDone ? '✓' : isWarn ? '!' : '○'}
                </Box>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 400,
                    lineHeight: 1.4,
                    color: isDone ? '#B4B2A9' : isWarn ? '#A32D2D' : '#1A1A1A',
                    textDecoration: isDone ? 'line-through' : 'none',
                    flex: 1,
                  }}
                >
                  {item.label}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
