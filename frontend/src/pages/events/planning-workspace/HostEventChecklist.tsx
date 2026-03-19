import { Box, Chip, Stack, Typography } from '@mui/material';
import { Check } from 'lucide-react';

import type { PlanningChecklistItem } from '@/features/events/planningChecklist';

import { WorkspaceCard } from './shared';

type HostEventChecklistProps = {
  checklistItems: PlanningChecklistItem[];
  completedChecklistCount: number;
};

export function HostEventChecklist({
  checklistItems,
  completedChecklistCount,
}: HostEventChecklistProps) {
  return (
    <WorkspaceCard
      title="Checklist"
      action={
        <Chip
          label={`${completedChecklistCount}/${checklistItems.length} ready`}
          sx={{
            height: 24,
            background:
              completedChecklistCount === checklistItems.length ? '#EAF3DE' : '#F1EFE8',
            color:
              completedChecklistCount === checklistItems.length
                ? '#3B6D11'
                : 'var(--color-text-primary)',
            fontSize: 11,
            fontWeight: 600,
          }}
        />
      }
    >
      <Stack spacing={0}>
        {checklistItems.map((item, index) => {
          const isHighlightedMilestone =
            (item.variant === 'sales' ||
              item.variant === 'go_live' ||
              item.variant === 'live_event') &&
            item.status === 'done';

          return (
            <Stack
              key={item.label}
              direction="row"
              spacing={1.1}
              sx={{
                py: isHighlightedMilestone ? 1.25 : 1,
                px: isHighlightedMilestone ? 1.25 : 0,
                mx: isHighlightedMilestone ? -1.25 : 0,
                borderRadius: isHighlightedMilestone ? 10 : 0,
                borderBottom:
                  index < checklistItems.length - 1 && !isHighlightedMilestone
                    ? '0.5px solid var(--color-border-tertiary)'
                    : 'none',
              }}
            >
              <Box
                sx={{
                  width: isHighlightedMilestone ? 20 : 16,
                  height: isHighlightedMilestone ? 20 : 16,
                  borderRadius: isHighlightedMilestone ? 6 : 4,
                  border: '1.5px solid',
                  borderColor:
                    item.variant === 'host'
                      ? '#2563EB'
                      : item.status === 'done'
                        ? '#1D9E75'
                        : item.status === 'warn'
                          ? '#E24B4A'
                          : 'var(--color-border-secondary)',
                  background:
                    item.variant === 'host'
                      ? '#2563EB'
                      : item.status === 'done'
                        ? '#1D9E75'
                        : 'transparent',
                  display: 'grid',
                  placeItems: 'center',
                  mt: '2px',
                  flexShrink: 0,
                }}
              >
                {item.status === 'done' ? (
                  <Check size={isHighlightedMilestone ? 12 : 10} color="#fff" />
                ) : null}
              </Box>
              <Typography
                sx={{
                  fontSize: isHighlightedMilestone ? 14 : 13,
                  fontWeight: isHighlightedMilestone ? 600 : 400,
                  lineHeight: 1.4,
                  color:
                    item.status === 'warn'
                      ? '#A32D2D'
                      : item.variant === 'host'
                        ? '#1E40AF'
                        : item.status === 'done'
                          ? 'var(--color-text-secondary)'
                          : 'var(--color-text-primary)',
                  textDecoration: item.status === 'done' ? 'line-through' : 'none',
                }}
              >
                {item.label}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </WorkspaceCard>
  );
}
