import { Box, Chip, Stack } from '@mui/material';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { SmallEventCard } from '@/components/events/SmallEventCard';
import type { EventCardEvent } from '@/components/events/useEventCards';

import { SectionHeading } from './MyHomeSectionHeading';

type TrendingFeedFilter = {
  id: string;
  label: string;
};

type Props = {
  title: string;
  allTrendingSearchHref: string;
  trendingFeedFilters: readonly TrendingFeedFilter[];
  selectedTrendingFilters: string[];
  onToggleFilter: (filterId: string) => void;
  onClearFilters: () => void;
  filteredTrendingEvents: EventCardEvent[];
};

export function MyHomeTrendingSection({
  title,
  allTrendingSearchHref,
  trendingFeedFilters,
  selectedTrendingFilters,
  onToggleFilter,
  onClearFilters,
  filteredTrendingEvents,
}: Props) {
  return (
    <Box>
      <SectionHeading
        eyebrow="Trending events"
        title={title}
        action={
          <Chip
            component={Link}
            to={allTrendingSearchHref}
            clickable
            label={
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                }}
              >
                All
                <ArrowRight size={14} />
              </Box>
            }
            sx={{
              height: 34,
              borderRadius: '999px',
              px: 0.35,
              bgcolor: '#2B2118',
              color: '#FFF8EF',
              boxShadow: '0 10px 20px rgba(66, 50, 28, 0.18)',
              fontWeight: 700,
              textDecoration: 'none',
              '& .MuiChip-label': {
                px: 1.4,
              },
              '&:hover': {
                bgcolor: '#3B2E22',
              },
            }}
          />
        }
      />
      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        sx={{ mt: 2, mb: 2 }}
      >
        {trendingFeedFilters.map((filter) => (
          <Chip
            key={filter.id}
            label={filter.label}
            onClick={() => onToggleFilter(filter.id)}
            sx={{
              height: 34,
              borderRadius: '999px',
              bgcolor: selectedTrendingFilters.includes(filter.id)
                ? '#D85A30'
                : 'rgba(255,255,255,0.9)',
              color: selectedTrendingFilters.includes(filter.id) ? '#fff' : '#4A3827',
              border: selectedTrendingFilters.includes(filter.id)
                ? 'none'
                : '1px solid rgba(143, 105, 66, 0.14)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          />
        ))}
        <Chip
          label="Clear"
          onClick={onClearFilters}
          sx={{
            height: 34,
            borderRadius: '999px',
            bgcolor: 'rgba(255, 244, 227, 0.92)',
            color: '#B45309',
            border: '1px dashed rgba(180, 83, 9, 0.38)',
            fontWeight: 700,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'rgba(255, 237, 213, 0.98)',
            },
          }}
        />
      </Stack>
      <Box
        sx={{
          display: 'flex',
          gap: 1.8,
          overflowX: 'auto',
          pb: 1,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {filteredTrendingEvents.length > 0 ? (
          filteredTrendingEvents.map((event) => (
            <SmallEventCard key={event.id} event={event} sx={{ minWidth: 260 }} />
          ))
        ) : (
          <Box
            sx={{
              p: 2,
              borderRadius: '24px',
              background: 'rgba(255,255,255,0.88)',
              border: '1px solid rgba(143, 105, 66, 0.12)',
              minWidth: 280,
            }}
          >
            No trending events match the filters you picked right now.
          </Box>
        )}
      </Box>
    </Box>
  );
}
