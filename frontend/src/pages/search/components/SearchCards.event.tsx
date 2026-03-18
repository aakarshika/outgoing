import { Avatar, Box, Button, Chip, Collapse, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { type MouseEvent, type ReactNode, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks';
import { getCategoryTheme } from '@/features/events/CategoricalBackground';
import {
  CompletedRatedBadge,
  getEventCardRoles,
  HostVendorBadge,
  LiveBadge,
  PriceBadge,
} from '@/features/events/scrapbookCard';
import { fetchMyApplications, fetchMyVendorOpportunities } from '@/features/needs/api';
import type { EventListItem } from '@/types/events';
import type { VendorOpportunity } from '@/types/needs';

import type { SearchTabId } from '../searchTypes';
import {
  formatEventDayLabel,
  formatEventTimeLabel,
  getCountdownLabel,
  getLowestTicketPrice,
  isOnlineEvent,
} from '../searchUtils';
import {
  ApplicationFeedback,
  ApplicationMessageField,
  CompensationPicker,
  OpportunityTerms,
  useOpportunityApplicationForm,
} from './SearchCards.application';
import { OpportunityCardExpandedSection } from './SearchCards.opportunity';
import {
  getAggregateStatus,
  getNeedActionConfig,
  getNeedsSummaryLabel,
  getOpportunityCardState,
  type NeedActionKind,
} from './SearchCards.shared';

type EventCardProps = {
  event: EventListItem;
  tab: SearchTabId;
  opportunity?: VendorOpportunity;
  hasMatchingService: boolean;
  variant?: 'portrait' | 'landscape';
  onCreateService?: (category?: string) => void;
  onClick: () => void;
};

export function EventCard({
  event,
  tab,
  opportunity,
  hasMatchingService,
  variant = 'portrait',
  onCreateService,
  onClick,
}: EventCardProps) {
  const { user, isAuthenticated } = useAuth();
  const [needsExpanded, setNeedsExpanded] = useState(false);
  const { data: applicationsData } = useQuery({
    queryKey: ['myApplications'],
    queryFn: fetchMyApplications,
    enabled: isAuthenticated && Boolean(opportunity),
  });

  const online = isOnlineEvent(event);
  const categoryTheme = getCategoryTheme(event.category ?? undefined);
  const accent = categoryTheme.accent;
  const { isHost, isVendor } = getEventCardRoles(event, {
    user: user ? { username: user.username } : null,
    isAuthenticated,
  });
  const price = getLowestTicketPrice(event);
  const priceLabel = price === 0 ? 'Free' : `Rs ${price}`;
  const countdown = getCountdownLabel(event.start_time);
  const myApplication = useMemo(() => {
    if (!opportunity) return null;
    const applications = applicationsData?.data || [];
    return (
      applications.find((application) => application.need_id === opportunity.need_id) ||
      null
    );
  }, [applicationsData, opportunity]);
  const needRewardValue = opportunity?.budget_max || opportunity?.budget_min;
  const needsCtaLabel = opportunity
    ? getOpportunityCardState(opportunity, hasMatchingService, myApplication?.status)
        .chipLabel
    : null;
  const isLandscape = variant === 'landscape';

  const handleNeedsClick = (event: MouseEvent) => {
    event.stopPropagation();
    if (!opportunity) return;
    setNeedsExpanded((previous) => !previous);
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        border: '1px solid rgba(17,24,39,0.08)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 0,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: isLandscape ? 'row' : 'column',
        alignItems: 'stretch',
        minHeight: isLandscape ? 220 : 260,
      }}
    >
      <EventCardMedia
        categoryBackground={categoryTheme.bg || '#f3f4f6'}
        event={event}
        isHost={isHost}
        isLandscape={isLandscape}
        isVendor={isVendor}
        priceLabel={priceLabel}
      />

      <Box
        sx={{
          p: isLandscape ? 1.8 : 1.6,
          display: 'flex',
          flexDirection: 'column',
          gap: isLandscape ? 1.15 : 1,
          flex: 1,
          minWidth: 0,
        }}
      >
        <EventCardMetaRow event={event} online={online} />
        <EventCardHero event={event} price={price} countdown={countdown} tab={tab} />

        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: isLandscape ? 18 : 15,
            lineHeight: 1.3,
            fontWeight: 700,
            color: '#111827',
          }}
        >
          {event.title}
        </Typography>

        {event.description ? (
          <Typography
            sx={{
              fontSize: isLandscape ? 12 : 11,
              lineHeight: 1.45,
              color: '#6b7280',
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitLineClamp: isLandscape ? 3 : 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {event.description}
          </Typography>
        ) : null}

        {opportunity ? (
          <EventOpportunityBanner
            ctaLabel={needsCtaLabel}
            isLandscape={isLandscape}
            needRewardValue={needRewardValue}
            onClick={handleNeedsClick}
            opportunity={opportunity}
          />
        ) : null}

        {!online ? (
          <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
            {event.location_name}
          </Typography>
        ) : null}

        {opportunity ? (
          <OpportunityCardExpandedSection
            applicationsData={applicationsData}
            opportunities={[opportunity]}
            hasMatchingService={hasMatchingService}
            expanded={needsExpanded}
            onCreateService={onCreateService}
          />
        ) : null}

        <EventCardFooter
          accent={accent}
          event={event}
          showTimeHero={tab === 'tonight-weekend'}
        />
      </Box>
    </Box>
  );
}

type EventCardMediaProps = {
  categoryBackground: string;
  event: EventListItem;
  isHost: boolean;
  isLandscape: boolean;
  isVendor: boolean;
  priceLabel: string;
};

function EventCardMedia({
  categoryBackground,
  event,
  isHost,
  isLandscape,
  isVendor,
  priceLabel,
}: EventCardMediaProps) {
  const imageHeight = isLandscape ? '100%' : 120;
  const imageWidth = isLandscape ? 220 : '100%';
  const showPriceOverlay =
    event.lifecycle_state === 'published' || event.lifecycle_state === 'live';
  const showRatedOverlay = event.lifecycle_state === 'completed';

  return (
    <Box
      sx={{
        position: 'relative',
        width: imageWidth,
        height: imageHeight,
        minHeight: isLandscape ? 220 : 120,
        flexShrink: 0,
      }}
    >
      {event.cover_image ? (
        <Box
          component="img"
          src={event.cover_image}
          alt={event.title}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            bgcolor: categoryBackground,
            display: 'block',
          }}
        />
      )}

      {event.lifecycle_state === 'live' ? (
        <LiveBadge sx={{ position: 'absolute', bottom: 8, left: 8, zIndex: 2 }} />
      ) : null}

      {isHost || isVendor ? (
        <HostVendorBadge
          isHost={isHost}
          variant={isLandscape ? 'short' : 'full'}
          bottomOffset={event.lifecycle_state === 'live' ? 36 : 10}
          sx={{ position: 'absolute', left: 8, zIndex: 2 }}
        />
      ) : null}

      {showPriceOverlay ? (
        <PriceBadge
          price={priceLabel}
          variant="landscape"
          sx={{ position: 'absolute', bottom: 8, right: 8, zIndex: 2 }}
        />
      ) : null}

      {showRatedOverlay ? (
        <CompletedRatedBadge
          sx={{ position: 'absolute', bottom: 8, right: 8, zIndex: 2 }}
        />
      ) : null}
    </Box>
  );
}

function EventCardMetaRow({
  event,
  online,
}: {
  event: EventListItem;
  online: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 1,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#6b7280',
        }}
      >
        {event.category?.name || 'Event'}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
        {event.user_has_ticket ? (
          <Box
            sx={{
              px: 0.9,
              py: 0.35,
              borderRadius: '999px',
              fontSize: 10,
              fontWeight: 700,
              color: '#166534',
              backgroundColor: '#DCFCE7',
            }}
          >
            You're going
          </Box>
        ) : null}
        <Box
          sx={{
            px: 0.9,
            py: 0.35,
            borderRadius: '999px',
            fontSize: 10,
            fontWeight: 600,
            color: online ? '#085041' : '#7a271a',
            backgroundColor: online ? '#E1F5EE' : '#FAECE7',
          }}
        >
          {online ? 'Online' : 'In person'}
        </Box>
      </Box>
    </Box>
  );
}

type EventCardHeroProps = {
  countdown: string | null;
  event: EventListItem;
  price: number;
  tab: SearchTabId;
};

function EventCardHero({ countdown, event, price, tab }: EventCardHeroProps) {
  const showTimeHero = tab === 'tonight-weekend';
  const showPriceHero = tab === 'free-cheap';
  const showAttendanceHero = tab === 'trending';
  const showPlatformHero = tab === 'online';
  const hasTrendingBadge = event.ticket_count + event.interest_count >= 35;

  return (
    <>
      {showAttendanceHero ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Box
            sx={{
              px: 1,
              py: 0.45,
              borderRadius: '999px',
              backgroundColor: '#EAF3DE',
              color: '#3B6D11',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {event.ticket_count} going
          </Box>
          {hasTrendingBadge ? (
            <Box
              sx={{
                px: 1,
                py: 0.45,
                borderRadius: '999px',
                backgroundColor: '#FCEBEB',
                color: '#A32D2D',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              Trending
            </Box>
          ) : null}
        </Box>
      ) : null}

      {showTimeHero ? (
        <Box>
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 18,
              fontWeight: 700,
              color: '#111827',
            }}
          >
            {formatEventDayLabel(event.start_time)} /{' '}
            {formatEventTimeLabel(event.start_time)}
          </Typography>
          {countdown ? (
            <Typography sx={{ fontSize: 11, color: '#D85A30', fontWeight: 600 }}>
              {countdown}
            </Typography>
          ) : null}
        </Box>
      ) : null}

      {showPriceHero ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 18,
              fontWeight: 700,
              color: price === 0 ? '#3B6D11' : '#111827',
            }}
          >
            {price === 0 ? 'Free' : `Rs ${price}`}
          </Typography>
          <Box
            sx={{
              px: 1,
              py: 0.45,
              borderRadius: '999px',
              backgroundColor: '#FAEEDA',
              color: '#854F0B',
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            Ticket
          </Box>
        </Box>
      ) : null}

      {showPlatformHero ? (
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 16,
            fontWeight: 700,
            color: '#085041',
          }}
        >
          Online
        </Typography>
      ) : null}
    </>
  );
}

type EventOpportunityBannerProps = {
  ctaLabel: string | null;
  isLandscape: boolean;
  needRewardValue?: string | number | null;
  onClick: (event: MouseEvent) => void;
  opportunity: VendorOpportunity;
};

function EventOpportunityBanner({
  ctaLabel,
  isLandscape,
  needRewardValue,
  onClick,
  opportunity,
}: EventOpportunityBannerProps) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 0.8,
        width: '100%',
        border: '1px solid rgba(133,79,11,0.08)',
        borderRadius: '12px',
        backgroundColor: '#FAEEDA',
        color: '#412402',
        px: isLandscape ? 1.25 : 1.1,
        py: isLandscape ? 1 : 0.9,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        '&:hover': {
          backgroundColor: '#F7E2C2',
          borderColor: 'rgba(133,79,11,0.2)',
        },
      }}
    >
      <Box component="span" sx={{ fontSize: 12, lineHeight: 1.4, mt: 0.1 }}>
        ⚡
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontSize: isLandscape ? 12 : 11,
            lineHeight: 1.4,
            color: '#633806',
          }}
        >
          <Box component="span" sx={{ fontWeight: 700, color: '#412402' }}>
            {opportunity.need_title}
          </Box>{' '}
          {needRewardValue ? `- up to Rs ${needRewardValue}` : '- tap to view details'}
        </Typography>
        {ctaLabel ? (
          <Typography
            sx={{
              mt: 0.35,
              fontSize: isLandscape ? 11 : 10,
              fontWeight: 700,
              color: '#854F0B',
            }}
          >
            {ctaLabel}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

function EventCardFooter({
  accent,
  event,
  showTimeHero,
}: {
  accent: string;
  event: EventListItem;
  showTimeHero: boolean;
}) {
  return (
    <Box
      sx={{
        mt: 'auto',
        pt: 1,
        borderTop: '1px solid rgba(17,24,39,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
        {showTimeHero
          ? event.location_name
          : `${formatEventDayLabel(event.start_time)} / ${formatEventTimeLabel(event.start_time)}`}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Avatar
            src={event.host.avatar || undefined}
            sx={{
              width: 18,
              height: 18,
              fontSize: 8,
              fontWeight: 700,
              bgcolor: accent,
              color: '#fff',
            }}
          >
            {event.host.first_name?.[0] || event.host.username[0]}
          </Avatar>
          {Math.max(event.ticket_count, event.interest_count) > 0 ? (
            <Typography sx={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>
              +{Math.max(event.ticket_count, event.interest_count)}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

type EventCardWithAllNeedsProps = {
  event: EventListItem;
  opportunities: VendorOpportunity[];
  matchedNeedIds?: Set<number>;
  onCreateService?: (category?: string) => void;
  onClick: () => void;
};

export function EventCardWithAllNeeds({
  event,
  opportunities,
  matchedNeedIds: externalMatchedNeedIds,
  onCreateService,
  onClick,
}: EventCardWithAllNeedsProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedNeedId, setExpandedNeedId] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const categoryTheme = getCategoryTheme(event.category ?? undefined);
  const online = (event.location_address || '').trim().toLowerCase() === 'online event';

  const { data: applicationsData } = useQuery({
    queryKey: ['myApplications'],
    queryFn: fetchMyApplications,
    enabled: isAuthenticated,
  });

  const { data: myMatchedOpportunities = [] } = useQuery({
    queryKey: ['eventCardAllNeeds', 'matchedOpportunities'],
    queryFn: async () => {
      const matched = await fetchMyVendorOpportunities();
      return matched.data || [];
    },
    enabled: isAuthenticated,
  });

  const matchedNeedIds = useMemo(() => {
    const set = new Set(externalMatchedNeedIds);
    myMatchedOpportunities.forEach((opportunity) => set.add(opportunity.need_id));
    return set;
  }, [externalMatchedNeedIds, myMatchedOpportunities]);

  const applicationByNeedId = useMemo(() => {
    const map = new Map<
      number,
      { status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' }
    >();
    (applicationsData?.data || []).forEach((application) => {
      if (application.need_id != null) map.set(application.need_id, application);
    });
    return map;
  }, [applicationsData]);

  const summaryText = getNeedsSummaryLabel(
    opportunities.map((opportunity) => opportunity.need_title),
  );
  const aggregateStatus = getAggregateStatus(opportunities, applicationByNeedId);

  const handleToggle = (event: MouseEvent) => {
    event.stopPropagation();
    setExpanded((previous) => !previous);
    if (expanded) {
      setExpandedNeedId(null);
    }
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        border: '1px solid rgba(143, 105, 66, 0.14)',
        borderLeft: `4px solid #EF9F27`,
        borderRadius: '22px',
        backgroundColor: 'rgba(255,255,255,0.92)',
        boxShadow: '0 8px 28px rgba(108, 71, 33, 0.06)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        '&:hover': {
          boxShadow: '0 14px 40px rgba(108, 71, 33, 0.1)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'stretch',
        }}
      >
        <EventCardAllNeedsMedia
          categoryThemeBg={categoryTheme.bg || '#FAEEDA'}
          event={event}
        />

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            p: { xs: 1.5, sm: 2 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 1,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(66, 50, 28, 0.56)',
                }}
              >
                {event.category?.name || 'Event'}
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: { xs: 15, sm: 17 },
                  fontWeight: 800,
                  color: '#2B2118',
                  lineHeight: 1.3,
                  letterSpacing: '-0.01em',
                  mt: 0.3,
                }}
              >
                {event.title}
              </Typography>
              <Typography
                sx={{ fontSize: 12, color: 'rgba(66, 50, 28, 0.68)', mt: 0.4 }}
              >
                {formatEventDayLabel(event.start_time)} ·{' '}
                {formatEventTimeLabel(event.start_time)}
                {!online && event.location_name ? ` · ${event.location_name}` : ''}
              </Typography>
            </Box>

            {online ? (
              <Box
                sx={{
                  px: 0.9,
                  py: 0.35,
                  borderRadius: '999px',
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#085041',
                  backgroundColor: '#E1F5EE',
                  flexShrink: 0,
                }}
              >
                Online
              </Box>
            ) : null}
          </Box>

          <EventNeedsSummaryBanner
            aggregateStatus={aggregateStatus}
            expanded={expanded}
            onClick={handleToggle}
            summaryText={summaryText}
          />
        </Box>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box
          onClick={(event) => event.stopPropagation()}
          sx={{
            borderTop: '1px solid rgba(143, 105, 66, 0.10)',
            px: { xs: 1.5, sm: 2 },
            py: 1.5,
            backgroundColor: 'rgba(255,252,245,0.6)',
          }}
        >
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(66, 50, 28, 0.5)',
              mb: 1,
            }}
          >
            {opportunities.length} open role{opportunities.length !== 1 ? 's' : ''}
          </Typography>

          <Stack spacing={0}>
            {opportunities.map((opportunity) => {
              const hasMatch = matchedNeedIds.has(opportunity.need_id);
              const application = applicationByNeedId.get(opportunity.need_id);
              const action = getNeedActionConfig(
                opportunity,
                hasMatch,
                application?.status,
              );
              const isNeedExpanded =
                expandedNeedId === opportunity.need_id &&
                (action.kind === 'invite-received' || action.kind === 'send-inquiry');

              return (
                <EventNeedListItem
                  key={opportunity.need_id}
                  actionLabel={action.label}
                  actionColor={action.color}
                  expanded={isNeedExpanded}
                  onActionClick={(event) => {
                    event.stopPropagation();

                    if (
                      action.kind === 'you-are-servicing' ||
                      action.kind === 'application-sent'
                    ) {
                      navigate(
                        `/events/${opportunity.event_id}/service-event-management`,
                      );
                      return;
                    }

                    if (action.kind === 'create-service') {
                      if (onCreateService) onCreateService(opportunity.category);
                      else navigate(`/vendors/create?category=${opportunity.category}`);
                      return;
                    }

                    setExpandedNeedId((current) =>
                      current === opportunity.need_id ? null : opportunity.need_id,
                    );
                  }}
                  opportunity={opportunity}
                >
                  <Collapse in={isNeedExpanded} timeout="auto" unmountOnExit>
                    <EventCardNeedActionPanel
                      opportunity={opportunity}
                      actionKind={action.kind}
                      onCreateService={onCreateService}
                    />
                  </Collapse>
                </EventNeedListItem>
              );
            })}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}

function EventCardAllNeedsMedia({
  categoryThemeBg,
  event,
}: {
  categoryThemeBg: string;
  event: EventListItem;
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        width: { xs: '100%', sm: 180 },
        minWidth: { xs: '100%', sm: 180 },
        height: { xs: 160, sm: 'auto' },
        minHeight: { xs: 160, sm: 140 },
        flexShrink: 0,
      }}
    >
      {event.cover_image ? (
        <Box
          component="img"
          src={event.cover_image}
          alt={event.title}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            bgcolor: categoryThemeBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
          }}
        >
          {event.category?.name?.toLowerCase().includes('music')
            ? '🎶'
            : event.category?.name?.toLowerCase().includes('food')
              ? '🍽️'
              : '✨'}
        </Box>
      )}
    </Box>
  );
}

function EventNeedsSummaryBanner({
  aggregateStatus,
  expanded,
  onClick,
  summaryText,
}: {
  aggregateStatus: ReturnType<typeof getAggregateStatus>;
  expanded: boolean;
  onClick: (event: MouseEvent) => void;
  summaryText: string;
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        width: '100%',
        border: '1px solid rgba(133,79,11,0.1)',
        borderRadius: '14px',
        backgroundColor: '#FAEEDA',
        color: '#412402',
        px: { xs: 1, sm: 1.25 },
        py: 1,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        '&:hover': {
          backgroundColor: '#F7E2C2',
          borderColor: 'rgba(133,79,11,0.2)',
        },
      }}
    >
      <Box component="span" sx={{ fontSize: 13, lineHeight: 1 }}>
        ⚡
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: { xs: 11, sm: 12 },
            lineHeight: 1.4,
            color: '#633806',
          }}
        >
          Event{' '}
          <Box component="span" sx={{ fontWeight: 700, color: '#412402' }}>
            needs
          </Box>{' '}
          {summaryText}
        </Typography>
      </Box>
      <Chip
        label={aggregateStatus.label}
        size="small"
        sx={{
          borderRadius: '999px',
          fontSize: { xs: 9, sm: 10 },
          fontWeight: 700,
          height: { xs: 22, sm: 24 },
          color: aggregateStatus.color,
          backgroundColor: aggregateStatus.bg,
          border: aggregateStatus.border,
          flexShrink: 0,
          '& .MuiChip-label': { px: { xs: 0.75, sm: 1 } },
        }}
      />
      <Box
        component="span"
        sx={{
          fontSize: 14,
          color: '#854F0B',
          transition: 'transform 0.2s ease',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          flexShrink: 0,
          ml: 0.25,
        }}
      >
        ▾
      </Box>
    </Box>
  );
}

type EventNeedListItemProps = {
  actionColor: { text: string; bg: string; border: string };
  actionLabel: string;
  children: ReactNode;
  expanded: boolean;
  onActionClick: (event: MouseEvent) => void;
  opportunity: VendorOpportunity;
};

function EventNeedListItem({
  actionColor,
  actionLabel,
  children,
  expanded,
  onActionClick,
  opportunity,
}: EventNeedListItemProps) {
  const rewardValue = opportunity.budget_max || opportunity.budget_min;

  return (
    <Box
      sx={{
        py: 1,
        px: 0.5,
        borderBottom: '1px solid rgba(143, 105, 66, 0.06)',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '10px',
            backgroundColor: actionColor.bg,
            color: actionColor.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {opportunity.category?.slice(0, 2).toUpperCase() || '??'}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: '#2B2118',
              lineHeight: 1.3,
            }}
          >
            {opportunity.need_title}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'rgba(66, 50, 28, 0.56)', mt: 0.15 }}>
            {rewardValue ? `Up to Rs ${rewardValue}` : 'Reward TBD'}
            {opportunity.need_description ? ` · ${opportunity.need_description}` : ''}
          </Typography>
        </Box>

        <Box
          component="button"
          type="button"
          onClick={onActionClick}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 1.25,
            py: 0.5,
            borderRadius: '999px',
            border: `1px solid ${actionColor.border}`,
            backgroundColor: expanded ? actionColor.bg : 'transparent',
            color: actionColor.text,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Syne, sans-serif',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            textTransform: 'capitalize',
            transition: 'background-color 0.15s ease',
            '&:hover': { backgroundColor: actionColor.bg },
          }}
        >
          {actionLabel}
        </Box>
      </Box>

      {children}
    </Box>
  );
}

type EventCardNeedActionPanelProps = {
  opportunity: VendorOpportunity;
  actionKind: NeedActionKind;
  onCreateService?: (category?: string) => void;
};

function EventCardNeedActionPanel({
  opportunity,
  actionKind,
  onCreateService,
}: EventCardNeedActionPanelProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: applicationsData } = useQuery({
    queryKey: ['myApplications'],
    queryFn: fetchMyApplications,
    enabled: isAuthenticated,
  });

  const myApplication = useMemo(() => {
    const applications = applicationsData?.data || [];
    return (
      applications.find((application) => application.need_id === opportunity.need_id) ||
      null
    );
  }, [applicationsData, opportunity.need_id]);

  const { discountPercent, discountValue, rewardLabel, detailTitle } =
    getOpportunityCardState(
      opportunity,
      actionKind === 'send-inquiry' || actionKind === 'invite-received',
      myApplication?.status,
    );
  const {
    applyMutation,
    handleSubmitApplication,
    message,
    selectedComp,
    setMessage,
    setSelectedComp,
  } = useOpportunityApplicationForm(opportunity);

  return (
    <Box
      sx={{
        mt: 1,
        ml: { xs: 0, sm: 5.25 },
        borderRadius: '16px',
        border: '1px solid rgba(143, 105, 66, 0.12)',
        backgroundColor: '#fff',
        px: { xs: 1.25, sm: 1.5 },
        py: 1.25,
      }}
    >
      <Stack spacing={1.2}>
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#2B2118' }}>
            {actionKind === 'invite-received'
              ? 'You were invited for this need'
              : 'Send your inquiry for this need'}
          </Typography>
          <Typography sx={{ mt: 0.4, fontSize: 12, color: 'rgba(66, 50, 28, 0.7)' }}>
            {opportunity.need_description ||
              'Review the role details and send your application.'}
          </Typography>
        </Box>

        <OpportunityTerms
          title={detailTitle}
          description={opportunity.need_description}
          needTitle={opportunity.need_title}
          discountPercent={discountPercent}
          rewardLabel={rewardLabel}
          compact
        />

        <CompensationPicker
          discountPercent={discountPercent}
          discountValue={discountValue}
          rewardLabel={rewardLabel}
          selectedComp={selectedComp}
          setSelectedComp={setSelectedComp}
        />

        <ApplicationMessageField
          message={message}
          onChange={setMessage}
          placeholder="Tell the host why you're a good fit..."
        />

        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
          <Button
            onClick={(event) => {
              event.stopPropagation();
              if (actionKind === 'create-service') {
                if (onCreateService) onCreateService(opportunity.category);
                else navigate(`/vendors/create?category=${opportunity.category}`);
                return;
              }
              navigate(`/events-new/${opportunity.event_id}`);
            }}
            variant="outlined"
            size="small"
            sx={{
              borderRadius: '999px',
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'rgba(143, 105, 66, 0.24)',
              color: '#2B2118',
            }}
          >
            View event
          </Button>
          <Button
            onClick={(event) => handleSubmitApplication(event, discountValue)}
            disabled={applyMutation.isPending}
            variant="contained"
            size="small"
            sx={{
              borderRadius: '999px',
              textTransform: 'none',
              fontWeight: 700,
              px: 2,
              backgroundColor: '#1D9E75',
              color: '#fff',
              '&:hover': { backgroundColor: '#15803d' },
            }}
          >
            {applyMutation.isPending ? 'Sending...' : 'Send application'}
          </Button>
        </Stack>

        <ApplicationFeedback
          isSuccess={applyMutation.isSuccess}
          isError={applyMutation.isError}
        />
      </Stack>
    </Box>
  );
}
