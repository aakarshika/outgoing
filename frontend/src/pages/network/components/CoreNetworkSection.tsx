import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import type { RefObject } from 'react';

import type { CoreNetworkItem, NetworkFilter } from '../types';
import { BuddySpotlightCard } from './BuddySpotlightCard';
import { SectionIntro } from './SectionIntro';

export function CoreNetworkSection({
  filters,
  items,
  onFilterChange,
  onFindEvents,
  onJoin,
  onMessage,
  onSeeAll,
  sectionRef,
  selectedFilter,
  showEmptyState,
}: {
  filters: readonly NetworkFilter[];
  items: readonly CoreNetworkItem[];
  onFilterChange: (filterLabel: string) => void;
  onFindEvents: () => void;
  onJoin: (eventId: number) => void;
  onMessage: (username: string) => void;
  onSeeAll: () => void;
  sectionRef: RefObject<HTMLDivElement | null>;
  selectedFilter: string;
  showEmptyState: boolean;
}) {
  return null;
  return (
    <Box
      ref={sectionRef}
      id="core-network"
      sx={{
        mt: { xs: 3, md: 4 },
        borderRadius: '12px',
        p: { xs: 2, md: 2.6 },
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.90) 0%, rgba(255,255,255,0.98) 100%)',
        boxShadow: '0 26px 60px rgba(110, 74, 36, 0.08)',
      }}
    >
      <SectionIntro
        eyebrow="Core network"
        title="Go with someone, not just somewhere"
        action={items.length > 0 ? `See all ${items.length}` : undefined}
        onActionClick={onSeeAll}
      />

      <Stack
        direction="row"
        spacing={0.9}
        useFlexGap
        flexWrap="wrap"
        sx={{ mt: 2.2, mb: 2.2 }}
      >
        {filters.map((filter) => (
          <Chip
            key={filter.label}
            label={filter.label}
            onClick={() => onFilterChange(filter.label)}
            sx={{
              height: 34,
              px: 0.4,
              borderRadius: '999px',
              fontSize: 12.5,
              fontWeight: 700,
              background: selectedFilter === filter.label ? '#2B2118' : '#fff',
              color: selectedFilter === filter.label ? '#fff' : '#2B2118',
              cursor: 'pointer',
            }}
          />
        ))}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 1.5,
        }}
      >
        {showEmptyState ? (
          <Box
            sx={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              py: 4,
              px: 2,
              borderRadius: '18px',
              background: '#F8F4EE',
            }}
          >
            <Typography sx={{ fontSize: 16, color: '#4A3827', fontWeight: 600 }}>
              No buddies yet
            </Typography>
            <Typography sx={{ mt: 1, fontSize: 14, color: 'rgba(66,50,28,0.7)' }}>
              Go to events and send buddy requests to people you meet. They&apos;ll show
              up here once they accept.
            </Typography>
            <Button
              variant="contained"
              onClick={onFindEvents}
              sx={{
                mt: 2,
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 700,
                background: '#D85A30',
                boxShadow: 'none',
              }}
            >
              Find events
            </Button>
          </Box>
        ) : (
          items.map(({ buddy, messageTarget }) => (
            <BuddySpotlightCard
              key={buddy.name}
              buddy={buddy}
              onMessage={() => onMessage(messageTarget)}
              onJoin={onJoin}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
