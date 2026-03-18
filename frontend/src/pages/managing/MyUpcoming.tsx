import { Box, Chip, Stack, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import type { PlanningChecklistItem } from '@/features/events/planningChecklist';
import { buildMonthGrid, formatCalendarSelection, monthLabel } from './useManaging';
import { CompactManagingEventCard } from './useManaging';

export type ManagingKind = 'hosting' | 'vendor_request' | 'vendor_application' | 'attending';

export interface ManagingItem {
  id: string;
  kind: ManagingKind;
  event?: unknown;
  eventTime: string;
  isPast: boolean;
}

type DayGridItem = { date: Date; key: string; inMonth: boolean; isToday: boolean };

type KindStyles = Record<ManagingKind, { dot: string }>;

interface MyUpcomingProps {
  topUpcoming: ManagingItem[];
  nextChecklistByItemId: Map<string, PlanningChecklistItem | null>;
  visibleMonth: Date;
  setVisibleMonth: Dispatch<SetStateAction<Date>>;
  selectedDateKey: string | null;
  setSelectedDateKey: Dispatch<SetStateAction<string | null>>;
  filter: 'all' | 'hosting' | 'vendor';
  setFilter: Dispatch<SetStateAction<'all' | 'hosting' | 'vendor'>>;
  eventsByDay: Record<string, ManagingItem[]>;
  weekdays: readonly string[];
  kindStyles: KindStyles;
}

export function MyUpcoming({
  topUpcoming,
  nextChecklistByItemId,
  visibleMonth,
  setVisibleMonth,
  selectedDateKey,
  setSelectedDateKey,
  filter,
  setFilter,
  eventsByDay,
  weekdays,
  kindStyles,
}: MyUpcomingProps) {
  const monthDays = buildMonthGrid(visibleMonth) as DayGridItem[];

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2.5, md: 3 },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 2,
          alignItems: 'start',
        }}
      >
        <Box sx={{ order: 3 }}>
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(66, 50, 28, 0.62)',
              mb: 1.5,
            }}
          >
            Coming up next
          </Typography>
          {topUpcoming.length === 0 ? (
            <Box
              sx={{
                p: 3,
                borderRadius: '24px',
                background: 'rgba(255,255,255,0.88)',
                border: '1px solid rgba(143, 105, 66, 0.12)',
              }}
            >
              <Typography sx={{ fontSize: 14, color: 'rgba(66, 50, 28, 0.72)' }}>
                No upcoming events you're hosting or servicing.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.4}>
              {topUpcoming.map((item) => (
                <CompactManagingEventCard
                  key={item.id}
                  item={item as any}
                  nextChecklistItem={nextChecklistByItemId.get(item.id)}
                />
              ))}
            </Stack>
          )}
        </Box>

        <Box
          sx={{
            order: 1,
            borderRadius: '24px',
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(143, 105, 66, 0.12)',
            p: { xs: 1.5, sm: 2 },
            boxShadow: '0 8px 28px rgba(108, 71, 33, 0.06)',
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            <Stack spacing={0.5}>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: { xs: 14, sm: 15 },
                  fontWeight: 800,
                  color: '#2B2118',
                }}
              >
                {monthLabel(visibleMonth)}
              </Typography>
              {selectedDateKey ? (
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: 'rgba(66, 50, 28, 0.68)',
                  }}
                >
                  Showing {formatCalendarSelection(selectedDateKey)}
                </Typography>
              ) : null}
            </Stack>
            <Stack direction="row" spacing={0.5}>
              <Box
                component="button"
                onClick={() =>
                  setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                }
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '10px',
                  border: '1px solid rgba(143, 105, 66, 0.14)',
                  background: 'rgba(255,255,255,0.9)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  '&:hover': { background: '#FAECE7' },
                }}
              >
                <ChevronLeft size={14} color="#4A3827" />
              </Box>
              <Box
                component="button"
                onClick={() =>
                  setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                }
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '10px',
                  border: '1px solid rgba(143, 105, 66, 0.14)',
                  background: 'rgba(255,255,255,0.9)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  '&:hover': { background: '#FAECE7' },
                }}
              >
                <ChevronRight size={14} color="#4A3827" />
              </Box>
            </Stack>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.25,
              textAlign: 'center',
            }}
          >
            {weekdays.map((day) => (
              <Typography
                key={day}
                sx={{
                  fontSize: { xs: 9, sm: 10 },
                  fontWeight: 700,
                  color: 'rgba(66, 50, 28, 0.48)',
                  py: 0.5,
                }}
              >
                {day}
              </Typography>
            ))}
            {monthDays.map((day) => {
              const dayItems = eventsByDay[day.key] || [];
              const hasEvents = dayItems.length > 0;
              const isSelected = selectedDateKey === day.key;
              return (
                <Box
                  key={day.key}
                  component="button"
                  onClick={() =>
                    setSelectedDateKey((current) => (current === day.key ? null : day.key))
                  }
                  sx={{
                    position: 'relative',
                    width: '100%',
                    py: 0.6,
                    borderRadius: '10px',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                    transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
                    boxShadow: isSelected
                      ? 'inset 0 0 0 1px rgba(216,90,48,0.45)'
                      : 'none',
                    ...(day.isToday && {
                      background: '#D85A30',
                      color: '#fff',
                    }),
                    ...(!day.isToday &&
                      isSelected && {
                        background: '#FAECE7',
                        color: '#7C2D12',
                      }),
                    ...(!day.isToday && day.inMonth && { color: '#2B2118' }),
                    ...(!day.isToday &&
                      !day.inMonth && { color: 'rgba(66, 50, 28, 0.28)' }),
                    '&:hover': {
                      background: day.isToday
                        ? '#D85A30'
                        : isSelected
                          ? '#FAECE7'
                          : 'rgba(250, 236, 231, 0.7)',
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: 10, sm: 11 },
                      fontWeight: day.isToday ? 800 : 500,
                      lineHeight: 1,
                    }}
                  >
                    {day.date.getDate()}
                  </Typography>
                  {hasEvents && (
                    <Stack
                      direction="row"
                      spacing={0.25}
                      justifyContent="center"
                      sx={{ mt: 0.25 }}
                    >
                      {dayItems.slice(0, 3).map((dayItem) => (
                        <Box
                          key={dayItem.id}
                          sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            background: kindStyles[dayItem.kind].dot,
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              );
            })}
          </Box>

          <Stack
            direction="row"
            spacing={1.5}
            sx={{ mt: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: kindStyles.hosting.dot,
                }}
              />
              <Typography sx={{ fontSize: 10, color: 'rgba(66, 50, 28, 0.6)' }}>
                Hosting
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: kindStyles.vendor_application.dot,
                }}
              />
              <Typography sx={{ fontSize: 10, color: 'rgba(66, 50, 28, 0.6)' }}>
                Servicing
              </Typography>
            </Stack>
            {selectedDateKey ? (
              <Chip
                label="Clear date"
                onClick={() => setSelectedDateKey(null)}
                sx={{
                  height: 24,
                  bgcolor: '#FAECE7',
                  color: '#7C2D12',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              />
            ) : null}
          </Stack>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ order: 2 }}
        >
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'hosting', label: 'Hosting' },
              { key: 'vendor', label: 'Service' },
            ] as const
          ).map((tabFilter) => (
            <Chip
              key={tabFilter.key}
              label={tabFilter.label}
              onClick={() => setFilter(tabFilter.key)}
              sx={{
                height: 34,
                borderRadius: '999px',
                bgcolor: filter === tabFilter.key ? '#D85A30' : 'rgba(255,255,255,0.9)',
                color: filter === tabFilter.key ? '#fff' : '#4A3827',
                border:
                  filter === tabFilter.key
                    ? 'none'
                    : '1px solid rgba(143, 105, 66, 0.14)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}