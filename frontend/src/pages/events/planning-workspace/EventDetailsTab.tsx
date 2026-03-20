import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';

import type { PlanningChecklistItem } from '@/features/events/planningChecklist';
import type { EventDetail } from '@/types/events';

import { formatMoney } from '../AddNeedOverlay';
import { FEATURE_ITEMS } from '../manage/ManageDetailsSection';
import { HostEventChecklist } from './HostEventChecklist';
import {
  type EditableFeature,
  type EditableTicketTier,
  ticketRowsFallback,
  WorkspaceCard,
} from './shared';

type DetailRow = {
  label: string;
  value: string;
};

type EventDetailsTabProps = {
  checklistItems: PlanningChecklistItem[];
  completedChecklistCount: number;
  detailRows: DetailRow[];
  editableFeatures: EditableFeature[];
  event: EventDetail;
  realTicketRows: EditableTicketTier[];
  ticketRevenue: number;
  totalSold: number;
  onOpenDetails: () => void;
  onOpenFeatures: () => void;
  onOpenTickets: () => void;
};

export function EventDetailsTab({
  checklistItems,
  completedChecklistCount,
  detailRows,
  editableFeatures,
  event,
  realTicketRows,
  ticketRevenue,
  totalSold,
  onOpenDetails,
  onOpenFeatures,
  onOpenTickets,
}: EventDetailsTabProps) {
  return (
    <Stack spacing={0}>
      <WorkspaceCard title="Event details">
        <Stack spacing={1}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 3,
            }}
          >
            {[
              {
                label: 'Date & time',
                value:
                  detailRows.find((item) => item.label === 'Date & time')?.value ||
                  'Date TBD',
                icon: <span className="text-lg">📅</span>,
              },
              {
                label: 'Location',
                value:
                  detailRows.find((item) => item.label === 'Location')?.value ||
                  'Location TBD',
                icon: <span className="text-lg">📍</span>,
              },
              {
                label: 'Category',
                value:
                  detailRows.find((item) => item.label === 'Category')?.value ||
                  'Category TBD',
                icon: <span className="text-lg">🏷️</span>,
              },
              {
                label: 'Format',
                value:
                  detailRows.find((item) => item.label === 'Format')?.value ||
                  'Format TBD',
                icon: <span className="text-lg">✨</span>,
              },
            ].map((item) => (
              <Stack key={item.label} direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-background-secondary)',
                    border: '0.5px solid var(--color-border-tertiary)',
                  }}
                >
                  {item.icon}
                </Box>
                <Stack spacing={0.25}>
                  <Typography
                    sx={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: 'var(--color-text-primary)',
                      fontWeight: 600,
                    }}
                  >
                    {item.value}
                  </Typography>
                </Stack>
              </Stack>
            ))}
          </Box>

          <Stack spacing={0.75}>
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--color-text-secondary)',
              }}
            >
              Description
            </Typography>
            <Typography
              sx={{
                fontSize: 14,
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
              }}
            >
              {event.description ||
                'Add a description that tells people exactly what the event is, why it matters, and what they should expect.'}
            </Typography>
          </Stack>

          <Button
            variant="outlined"
            onClick={onOpenDetails}
            sx={{
              width: 'fit-content',
              borderRadius: '999px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              borderColor: 'var(--color-border-tertiary)',
              color: 'var(--color-text-primary)',
              '&:hover': {
                borderColor: '#D85A30',
                background: 'rgba(216, 90, 48, 0.04)',
              },
            }}
          >
            Edit details
          </Button>

          <Box
            sx={{
              mt: 1,
              borderTop: '0.5px solid var(--color-border-tertiary)',
              pt: 2.5,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <Typography
                sx={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 800 }}
              >
                Features
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={onOpenFeatures}
                sx={{ textTransform: 'none', color: '#D85A30', fontWeight: 600 }}
              >
                Edit features
              </Button>
            </Stack>
            <Stack direction="row" flexWrap="wrap" useFlexGap gap={1.5}>
              {editableFeatures.length > 0 ? (
                editableFeatures.map((feature) => {
                  const item = FEATURE_ITEMS.find(
                    (entry) => entry.name === feature.name,
                  );
                  return (
                    <Box
                      key={feature.name}
                      title={
                        feature.outsourced
                          ? `${feature.name} (Outsourced)`
                          : feature.name
                      }
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: feature.outsourced
                          ? '#FAECE7'
                          : 'var(--color-background-secondary)',
                        border: '0.5px solid',
                        borderColor: feature.outsourced
                          ? '#D85A30'
                          : 'var(--color-border-tertiary)',
                        fontSize: 20,
                      }}
                    >
                      {item?.emoji || '✨'}
                    </Box>
                  );
                })
              ) : (
                <Typography sx={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  No features added yet.
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>
      </WorkspaceCard>

      <WorkspaceCard
        title="Tickets"
        action={
          <Button
            variant="text"
            onClick={onOpenTickets}
            sx={{ textTransform: 'none', color: '#D85A30', fontWeight: 600 }}
          >
            + Add ticket
          </Button>
        }
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.5,
            mb: 1.5,
          }}
        >
          {[
            { label: 'Total sold', value: String(totalSold) },
            { label: 'Revenue', value: formatMoney(ticketRevenue) },
          ].map((metric) => (
            <Box
              key={metric.label}
              sx={{
                background: 'var(--color-background-secondary)',
                borderRadius: '16px',
                p: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  color: 'var(--color-text-secondary)',
                  mb: 0.5,
                }}
              >
                {metric.label}
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {metric.value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Stack spacing={1.25}>
          {(realTicketRows.length > 0 ? realTicketRows : ticketRowsFallback).map(
            (ticket, index) => (
              <Stack
                key={`${ticket.name}-${index}`}
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={{ xs: 1, sm: 1.5 }}
                sx={{
                  py: 1.5,
                  borderBottom: '0.5px solid var(--color-border-tertiary)',
                  '&:last-of-type': { borderBottom: 'none', pb: 0 },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 700, minWidth: { sm: 90 } }}
                  >
                    {ticket.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: 'var(--color-text-secondary)',
                      ml: 'auto',
                      minWidth: { sm: 50 },
                    }}
                  >
                    {'price' in ticket && typeof ticket.price !== 'undefined'
                      ? formatMoney(ticket.price)
                      : ''}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ width: '100%', flex: 1 }}
                >
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={
                        'progress' in ticket
                          ? ticket.progress
                          : ticket.capacity
                            ? Math.min(
                                100,
                                ((event.ticket_tiers?.[index]?.sold_count || 0) /
                                  Number(ticket.capacity)) *
                                  100,
                              )
                            : 0
                      }
                      sx={{
                        height: 6,
                        borderRadius: '999px',
                        backgroundColor: 'var(--color-background-secondary)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: '999px',
                          backgroundColor: 'color' in ticket ? ticket.color : '#D85A30',
                        },
                      }}
                    />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: 'var(--color-text-secondary)',
                      minWidth: 88,
                      textAlign: 'right',
                    }}
                  >
                    {'sold' in ticket
                      ? ticket.sold
                      : `${event.ticket_tiers?.[index]?.sold_count || 0} / ${ticket.capacity || '∞'} sold`}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onOpenTickets}
                    sx={{
                      borderRadius: '999px',
                      textTransform: 'none',
                      flexShrink: 0,
                    }}
                  >
                    Edit
                  </Button>
                </Stack>
              </Stack>
            ),
          )}
        </Stack>
        <Typography
          sx={{ mt: 1.25, fontSize: 11, color: 'var(--color-text-secondary)' }}
        >
          Min. threshold: 20 attendees ·{' '}
          <Box component="span" sx={{ color: '#3B6D11', fontWeight: 500 }}>
            Reached ✓
          </Box>
        </Typography>
      </WorkspaceCard>

      <HostEventChecklist
        checklistItems={checklistItems}
        completedChecklistCount={completedChecklistCount}
      />
    </Stack>
  );
}
