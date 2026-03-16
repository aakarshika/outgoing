import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import type { EventListItem } from '@/types/events';
import type { VendorOpportunity } from '@/types/needs';

import type { SearchTabId } from '../searchTypes';
import { EventCard, OpportunityCard } from './SearchCards';

function MessageCard({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        border: '1px solid rgba(17,24,39,0.08)',
        borderRadius: 0,
        backgroundColor: '#ffffff',
        p: 2,
        display: action ? 'flex' : 'block',
        justifyContent: action ? 'space-between' : undefined,
        gap: action ? 2 : undefined,
        alignItems: action ? 'center' : undefined,
      }}
    >
      {children}
      {action}
    </Box>
  );
}

function EmptyState() {
  return (
    <MessageCard>
      <Typography sx={{ fontSize: 13, color: '#6b7280' }}>
        Nothing here right now - try removing a filter or check back later.
      </Typography>
    </MessageCard>
  );
}

function EventGrid({
  events,
  tab,
  eventCardOpportunityByEventId,
  matchedOpportunityNeedIds,
  onEventClick,
  onCreateService,
}: {
  events: EventListItem[];
  tab: SearchTabId;
  eventCardOpportunityByEventId: Map<number, VendorOpportunity>;
  matchedOpportunityNeedIds: Set<number>;
  onEventClick: (eventId: number) => void;
  onCreateService?: (category?: string) => void;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 1.6,
      }}
    >
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          tab={tab}
          opportunity={eventCardOpportunityByEventId.get(event.id)}
          hasMatchingService={matchedOpportunityNeedIds.has(
            eventCardOpportunityByEventId.get(event.id)?.need_id ?? -1,
          )}
          onCreateService={onCreateService}
          onClick={() => onEventClick(event.id)}
        />
      ))}
    </Box>
  );
}

function OpportunityList({
  opportunities,
  onOpportunityClick,
  matchedOpportunityNeedIds,
  heading,
  onCreateService,
}: {
  opportunities: VendorOpportunity[];
  onOpportunityClick: (eventId: number) => void;
  matchedOpportunityNeedIds: Set<number>;
  heading?: string;
  onCreateService?: (category?: string) => void;
}) {
  return (
    <Stack spacing={1}>
      {heading ? (
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 15,
            fontWeight: 700,
            color: '#111827',
          }}
        >
          {heading}
        </Typography>
      ) : null}
      {opportunities.map((opportunity) => (
        <OpportunityCard
          key={opportunity.need_id}
          opportunity={opportunity}
          hasMatchingService={matchedOpportunityNeedIds.has(opportunity.need_id)}
          onCreateService={onCreateService}
          onClick={() => onOpportunityClick(opportunity.event_id)}
        />
      ))}
    </Stack>
  );
}

export function SearchResults({
  tab,
  sectionCount,
  filteredEvents,
  filteredOpportunities,
  eventCardOpportunityByEventId,
  matchedOpportunityNeedIds,
  isFeedLoading,
  isOpportunitiesLoading,
  isAuthenticated,
  onEventClick,
  onOpportunityClick,
  onCreateService,
  onSignIn,
}: {
  tab: SearchTabId;
  sectionCount: number;
  filteredEvents: EventListItem[];
  filteredOpportunities: VendorOpportunity[];
  eventCardOpportunityByEventId: Map<number, VendorOpportunity>;
  matchedOpportunityNeedIds: Set<number>;
  isFeedLoading: boolean;
  isOpportunitiesLoading: boolean;
  isAuthenticated: boolean;
  onEventClick: (eventId: number) => void;
  onOpportunityClick: (eventId: number) => void;
  onCreateService?: (category?: string) => void;
  onSignIn: () => void;
}) {
  return (
    <Stack spacing={2.2}>
      {tab !== 'my-network' ? (
        <Typography sx={{ fontSize: 11, color: '#6b7280', px: 0.2 }}>
          {sectionCount} result{sectionCount === 1 ? '' : 's'}
        </Typography>
      ) : null}
      {tab === 'my-network' ? (
        <MessageCard>
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 16,
              fontWeight: 700,
              color: '#111827',
            }}
          >
            My Network
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#6b7280', mt: 0.8, maxWidth: 560 }}>
            This tab is reserved for buddy and known-host results. The compact UI is in
            place, but it still needs the dedicated network feed contract before it can
            render real people and network event cards.
          </Typography>
        </MessageCard>
      ) : null}

      {(isFeedLoading || isOpportunitiesLoading) && tab !== 'my-network' ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#D85A30' }} />
        </Box>
      ) : null}

      {!isFeedLoading &&
      tab !== 'chip-in' &&
      tab !== 'free-cheap' &&
      tab !== 'my-network' ? (
        filteredEvents.length > 0 ? (
          <EventGrid
            events={filteredEvents}
            tab={tab}
            eventCardOpportunityByEventId={eventCardOpportunityByEventId}
            matchedOpportunityNeedIds={matchedOpportunityNeedIds}
            onEventClick={onEventClick}
            onCreateService={onCreateService}
          />
        ) : (
          <EmptyState />
        )
      ) : null}

      {tab === 'free-cheap' ? (
        <Stack spacing={2}>
          {filteredEvents.length > 0 ? (
            <EventGrid
              events={filteredEvents}
              tab={tab}
              eventCardOpportunityByEventId={eventCardOpportunityByEventId}
              matchedOpportunityNeedIds={matchedOpportunityNeedIds}
              onEventClick={onEventClick}
              onCreateService={onCreateService}
            />
          ) : null}

          {!isAuthenticated ? (
            <MessageCard
              action={
                <Button size="small" onClick={onSignIn}>
                  Sign in
                </Button>
              }
            >
              <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                Sign in to see contributor opportunities inside Free & Cheap.
              </Typography>
            </MessageCard>
          ) : filteredOpportunities.length > 0 ? (
            <OpportunityList
              opportunities={filteredOpportunities}
              onOpportunityClick={onOpportunityClick}
              matchedOpportunityNeedIds={matchedOpportunityNeedIds}
              heading="Contributor gigs"
              onCreateService={onCreateService}
            />
          ) : null}

          {filteredEvents.length === 0 && filteredOpportunities.length === 0 ? (
            <EmptyState />
          ) : null}
        </Stack>
      ) : null}

      {tab === 'chip-in' ? (
        filteredOpportunities.length > 0 ? (
          <OpportunityList
            opportunities={filteredOpportunities}
            onOpportunityClick={onOpportunityClick}
            matchedOpportunityNeedIds={matchedOpportunityNeedIds}
            onCreateService={onCreateService}
          />
        ) : (
          <EmptyState />
        )
      ) : null}
    </Stack>
  );
}
