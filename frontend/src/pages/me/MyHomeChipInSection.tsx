import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { EventCardWithAllNeeds } from '@/pages/search/components/SearchCards';
import type { EventDetail, EventListItem } from '@/types/events';
import type { VendorOpportunity } from '@/types/needs';

import { SectionHeading } from './MyHomeSectionHeading';
import { getCategoryTheme } from '@/features/events/CategoricalBackground';

type ContributionEventCardData = {
  eventId: number;
  eventTitle: string;
  subtitle: string;
  opportunities: VendorOpportunity[];
};

type Props = {
  contributionEventCards: ContributionEventCardData[];
  eventDetailByEventId: Map<number, EventDetail>;
  matchedOpportunityNeedIds: Set<number>;
  onOpenQuickCreateService: (category?: string) => void;
};

export function MyHomeChipInSection({
  contributionEventCards,
  eventDetailByEventId,
  matchedOpportunityNeedIds,
  onOpenQuickCreateService,
}: Props) {
  const navigate = useNavigate();

  if (contributionEventCards.length === 0) {
    return null;
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <SectionHeading
        eyebrow="Chip in"
        title="Earn your way into the room"
        action={
          // Using a simple anchor keeps this component focused on layout.
          <a
            href="/search?tab=chip-in"
            style={{
              textDecoration: 'none',
              borderRadius: 999,
              padding: '4px 12px',
              border: '1px solid rgba(143, 105, 66, 0.3)',
              color: '#2B2118',
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.6,
            }}
          >
            View all
          </a>
        }
      />
      <Box
        sx={{
          mt: 2,
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 1,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {contributionEventCards.map((eventCard) => {
          const eventDetail = eventDetailByEventId.get(eventCard.eventId);
          if (!eventDetail) return null;
          const accent = getCategoryTheme(eventDetail.category).accent;

          return (
            <Box key={eventCard.eventId} sx={{ minWidth: 320 }}>
              <EventCardWithAllNeeds
                event={eventDetail as EventDetail & EventListItem}
                accent={accent}
                opportunities={eventCard.opportunities}
                matchedNeedIds={matchedOpportunityNeedIds}
                onCreateService={onOpenQuickCreateService}
                onClick={() => navigate(`/events-new/${eventCard.eventId}`)}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

