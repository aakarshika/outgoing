import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import Lottie from 'lottie-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { SmallEventCard } from '@/components/events/SmallEventCard';
import { HostCard } from '@/components/ui/HostCard';
import {
  useFeed,
  useIconicHostsFeed,
  useTrendingHighlights,
} from '@/features/events/hooks';
import { HighlightCard } from '@/pages/events/components/HighlightCard';
import { HighlightChainViewer } from '@/pages/events/components/HighlightChainViewer';
import type { EventListItem } from '@/types/events';

const categoryChips = [
  { label: 'Outdoors', icon: '🏃' },
  { label: 'Music', icon: '🎶' },
  { label: 'Food & Drink', icon: '🍽️' },
  { label: 'Arts & Culture', icon: '🎨' },
  { label: 'Gaming', icon: '🎮' },
  { label: 'Wellness', icon: '🧘' },
  { label: 'Tech', icon: '💻' },
  { label: 'Sports', icon: '⚽' },
  { label: 'Books', icon: '📚' },
  { label: 'Film', icon: '🎞️' },
] as const;

const cityCards = [
  { name: 'New York', flag: '🌍', count: '2,400+ events' },
  { name: 'Los Angeles', flag: '🌞', count: '1,800+ events' },
  { name: 'Chicago', flag: '🍂', count: '1,100+ events' },
  { name: 'Atlanta', flag: '🌵', count: '890+ events' },
  { name: 'Miami', flag: '🌴', count: '760+ events' },
  { name: 'Houston', flag: '🏓', count: '640+ events' },
] as const;

const howItWorksCards = [
  {
    icon: '🔍',
    background: '#FAECE7',
    title: 'Discover',
    description:
      "Browse thousands of hyper-local and online events built around your actual interests — from underground jazz nights to niche hobby meetups you didn't know existed.",
  },
  {
    icon: '🎉',
    background: '#FAEEDA',
    title: 'Go further than attending',
    description:
      'Grab a ticket, or claim a contributor role — bring supplies, run the music, cater the food — and earn discounts or get paid. Every event needs people like you.',
  },
  {
    icon: '👥',
    background: '#EAF3DE',
    title: 'Find your people',
    description:
      "Follow groups, meet regulars, and go from stranger to the person everyone's glad showed up. Communities here are built one event at a time.",
  },
  {
    icon: '💡',
    background: '#E6F1FB',
    title: 'Start something',
    description:
      'Got an idea? Post it. Set what you need, watch interest build, and let your community help you pull it off. No venue, no budget required — just a spark.',
  },
] as const;

const filterChips = [
  'This weekend',
  'Tonight',
  'Free',
  'Under $20',
  'Outdoors',
  'New in town',
  'Contributor spots open',
] as const;

type FilterChip = (typeof filterChips)[number];

function formatDayTime(dateString: string) {
  const date = new Date(dateString);
  return `${date.toLocaleDateString(undefined, {
    weekday: 'short',
  })} · ${date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

function getAccent(event: EventListItem) {
  const category = (event.category?.name || '').toLowerCase();
  if (event.location_name?.toLowerCase().includes('online')) return '#E1F5EE';
  if (category.includes('music')) return '#E6F1FB';
  if (category.includes('food')) return '#FAECE7';
  if (category.includes('outdoor') || category.includes('sport')) return '#FAEEDA';
  if (category.includes('art')) return '#EEEDFE';
  if (category.includes('book')) return '#FBEAF0';
  return '#EAF3DE';
}

function getIcon(event: EventListItem) {
  const category = (event.category?.name || '').toLowerCase();
  if (event.location_name?.toLowerCase().includes('online')) return '💻';
  if (category.includes('music')) return '🎶';
  if (category.includes('food')) return '🍽️';
  if (category.includes('outdoor') || category.includes('sport')) return '🏃';
  if (category.includes('art')) return '🎨';
  if (category.includes('film')) return '🎞️';
  if (category.includes('game')) return '🎮';
  if (category.includes('book')) return '📚';
  if (category.includes('well')) return '🧘';
  return '✨';
}

function getPriceLabel(event: EventListItem) {
  const prices = [event.ticket_price_standard, event.ticket_price_flexible]
    .filter((value): value is string => value !== null)
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));

  if (prices.length === 0) return '';
  const lowest = Math.min(...prices);
  return lowest === 0 ? 'Free' : `$${lowest}`;
}

function EventCard({
  event,
  compactPrice = false,
}: {
  event: EventListItem;
  compactPrice?: boolean;
}) {
  const secondary = compactPrice
    ? `${formatDayTime(event.start_time)}${getPriceLabel(event) ? ` · ${getPriceLabel(event)}` : ''}`
    : formatDayTime(event.start_time);

  return (
    <Box
      sx={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: '24px',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          height: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          background: getAccent(event),
        }}
      >
        {getIcon(event)}
      </Box>
      <Box sx={{ p: 1.5 }}>
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: 'var(--color-text-secondary)',
            mb: 0.5,
          }}
        >
          {event.category?.name ||
            (event.location_name?.toLowerCase().includes('online')
              ? 'Online'
              : 'Event')}
        </Typography>
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 1.3,
            minHeight: 34,
          }}
        >
          {event.title}
        </Typography>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
          sx={{ mt: 1 }}
        >
          <Typography sx={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
            {secondary}
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              color: '#3B6D11',
              background: '#EAF3DE',
              px: 1,
              py: 0.3,
              borderRadius: '999px',
              whiteSpace: 'nowrap',
            }}
          >
            {event.ticket_count || event.interest_count} going
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

function ThingsToDoCard({
  event,
  showNeedCallout,
}: {
  event: EventListItem;
  showNeedCallout: boolean;
}) {
  const isOnline = event.location_name?.toLowerCase().includes('online');
  const description =
    event.description ||
    (isOnline
      ? 'Join from anywhere and meet people around a shared interest.'
      : 'A local event built around people showing up, contributing, and connecting.');
  const priceLabel = getPriceLabel(event);

  return (
    <Box
      sx={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderLeft: `3px solid ${isOnline ? '#1D9E75' : '#D85A30'}`,
        borderRadius: '24px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      {event.cover_image ? (
        <Box
          component="img"
          src={event.cover_image}
          alt={event.title}
          sx={{ height: 110, width: '100%', objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <Box
          sx={{
            height: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            background: getAccent(event),
            flexShrink: 0,
          }}
        >
          {getIcon(event)}
        </Box>
      )}
      <Box
        sx={{
          p: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75,
          flex: 1,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--color-text-secondary)',
            }}
          >
            {event.category?.name || 'Event'}
          </Typography>
          <Box
            sx={{
              fontSize: 10,
              fontWeight: 500,
              px: 1,
              py: 0.35,
              borderRadius: '999px',
              whiteSpace: 'nowrap',
              background: isOnline ? '#E1F5EE' : '#FAECE7',
              color: isOnline ? '#085041' : '#712B13',
              flexShrink: 0,
            }}
          >
            {isOnline ? 'Online' : 'In person'}
          </Box>
        </Stack>

        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 1.3,
          }}
        >
          {event.title}
        </Typography>

        <Typography
          sx={{
            fontSize: 12,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5,
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {description}
        </Typography>

        {showNeedCallout ? (
          <Box
            sx={{
              background: '#FAEEDA',
              borderRadius: '16px',
              p: '7px 10px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 0.75,
            }}
          >
            <Typography sx={{ fontSize: 12, color: '#633806', mt: '1px' }}>
              ⚡
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#633806', lineHeight: 1.4 }}>
              <Box component="span" sx={{ fontWeight: 700, color: '#412402' }}>
                Contributor spot open
              </Box>{' '}
              - chip in on the day and earn a perk.
            </Typography>
          </Box>
        ) : null}

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
          sx={{
            mt: 'auto',
            pt: 1,
            borderTop: '0.5px solid var(--color-border-tertiary)',
          }}
        >
          <Typography sx={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
            {formatDayTime(event.start_time)}
            {priceLabel ? ` · ${priceLabel}` : ''}
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              color: '#3B6D11',
              background: '#EAF3DE',
              px: 1,
              py: 0.3,
              borderRadius: '999px',
              whiteSpace: 'nowrap',
            }}
          >
            {event.ticket_count || event.interest_count} going
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

function SectionHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        sx={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
          mb: 1,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: 'Syne, sans-serif',
          fontSize: { xs: 24, md: 28 },
          fontWeight: 800,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.03em',
        }}
      >
        {title}
      </Typography>
      {description ? (
        <Typography
          sx={{
            fontSize: 15,
            color: 'var(--color-text-secondary)',
            mt: 0.75,
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
      ) : null}
    </Box>
  );
}

function HorizontalScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.75,
        overflowX: 'auto',
        pb: 1,
        scrollSnapType: 'x proximity',
        WebkitOverflowScrolling: 'touch',
        '&::-webkit-scrollbar': {
          height: 8,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(120, 94, 60, 0.18)',
          borderRadius: '999px',
        },
      }}
    >
      {children}
    </Box>
  );
}

export default function GuestLandingPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterChip>('This weekend');
  const [heroAnimationData, setHeroAnimationData] = useState<object | null>(null);
  const nearbySectionRef = useRef<HTMLDivElement | null>(null);
  const [isHighlightViewerOpen, setIsHighlightViewerOpen] = useState(false);
  const [selectedHighlightId, setSelectedHighlightId] = useState<number | null>(null);

  const { data: nearbyResponse, isLoading: loadingNearby } = useFeed({
    sort: 'trending'
  });
  const { data: onlineResponse, isLoading: loadingOnline } = useFeed({
    online: true,
    sort: 'upcoming'
  });
  const { data: discoverResponse, isLoading: loadingDiscover } = useFeed({
    sort: activeFilter === 'Tonight' ? 'upcoming' : 'trending',
    online: activeFilter === 'Contributor spots open' ? undefined : false,
    weekend: activeFilter === 'This weekend' ? true : undefined
  });

  const nearbyEvents = ((nearbyResponse?.data || []) as EventListItem[]).slice(0, 4);
  const onlineEvents = ((onlineResponse?.data || []) as EventListItem[]).slice(0, 4);

  const discoverEvents = useMemo(() => {
    const baseEvents = ((discoverResponse?.data || []) as EventListItem[]).slice(0, 12);

    return baseEvents
      .filter((event) => {
        const category = (event.category?.name || '').toLowerCase();
        const price = getPriceLabel(event);

        switch (activeFilter) {
          case 'Tonight':
            return (
              new Date(event.start_time).toDateString() === new Date().toDateString()
            );
          case 'Free':
            return price === 'Free';
          case 'Under $20':
            return price.startsWith('$') ? Number(price.slice(1)) < 20 : false;
          case 'Outdoors':
            return category.includes('outdoor') || category.includes('sport');
          case 'New in town':
            return category.includes('social') || category.includes('community');
          case 'Contributor spots open':
            return category.includes('workshop') || category.includes('community');
          default:
            return true;
        }
      })
      .slice(0, 4);
  }, [activeFilter, discoverResponse]);

  const { data: iconicHostsResponse } = useIconicHostsFeed();
  const { data: trendingHighlightsResponse } = useTrendingHighlights(12);

  const iconicHosts = (iconicHostsResponse?.data || []).slice(0, 8);
  const trendingHighlights = (trendingHighlightsResponse?.data || []).slice(0, 8);

  const isLoading = loadingNearby || loadingOnline || loadingDiscover;

  useEffect(() => {
    let ignore = false;

    fetch('/assets/group-lottie.json')
      .then((response) => response.json())
      .then((data) => {
        if (!ignore) {
          setHeroAnimationData(data);
        }
      })
      .catch(() => {
        if (!ignore) {
          setHeroAnimationData(null);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <Box sx={{ background: '--var(--color-background-primary)' }}>
      <Box
        sx={{
          background: '#D85A30',
          textAlign: 'center',
          px: 2,
          py: { xs: 7, md: 10 },
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: 900, mb: 10 }}>
          <Chip
            label="Community-powered events"
            sx={{
              mb: 3,
              background: 'rgba(255,255,255,0.18)',
              color: '#fff',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              mt: 10,
              fontSize: 12,
            }}
          />
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: { xs: 38, md: 56 },
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.08,
              letterSpacing: '-0.04em',
              maxWidth: 720,
              mx: 'auto',
            }}
          >
            Show up. Chip in. Belong.
          </Typography>
          {heroAnimationData ? (
            <Box
              sx={{
                width: { xs: 180, md: 220 },
                mx: 'auto',
                mt: { xs: 1.5, md: 2 },
                pointerEvents: 'none',
              }}
            >
              <Lottie animationData={heroAnimationData} loop autoplay />
            </Box>
          ) : null}
          <Typography
            sx={{
              mt: 2,
              fontSize: { xs: 16, md: 18 },
              color: 'rgba(255,255,255,0.85)',
              maxWidth: 580,
              mx: 'auto',
              lineHeight: 1.65,
            }}
          >
            Find activities you care about deeply, or stumble onto something you didn't
            know you loved {'\u2014'}{' '}
            <span className="">
              <strong>then</strong>
            </span>
            <Box
              component="span"
              aria-label="go"
              role="img"
              sx={{
                display: 'inline-block',
                width: { xs: 30, md: 36 },
                height: { xs: 30, md: 35 },
                // pt: 7,
                mx: 0.5,
                transform: 'translateY(10px)',
                backgroundColor: 'currentColor',
                maskImage: "url('/assets/go-symbol.png')",
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                maskSize: 'contain',
                WebkitMaskImage: "url('/assets/go-symbol.png')",
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                WebkitMaskSize: 'contain',
              }}
            />
            {''}
            <strong>further.</strong>
          </Typography>
          <Typography
            sx={{
              mt: 2,
              fontSize: { xs: 14, md: 16 },
              color: 'rgba(255,255,255,0.85)',
              maxWidth: 400,
              mx: 'auto',
              lineHeight: 1.65,
            }}
          >
            Grab a ticket, bring the snacks, run the music, or post your own idea and
            watch your community make it live.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            justifyContent="center"
            alignItems={'center'}
            sx={{ mt: 4 }}
          >
            <Button
              variant="contained"
              onClick={() => navigate('/signup')}
              sx={{
                px: 4.5,
                py: 1.6,
                width: 260,
                mx: 'auto',
                borderRadius: '999px',
                background: '#fff',
                color: '#D85A30',
                textTransform: 'none',
                fontSize: 16,
                boxShadow: 'none',
              }}
            >
              Join Outgoing
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/search')}
              sx={{
                px: 4.5,
                py: 1.6,
                maxWidth: 240,
                mx: 'auto',
                borderRadius: '999px',
                borderColor: 'rgba(255,255,255,0.5)',
                color: '#fff',
                textTransform: 'none',
                fontSize: 16,
              }}
            >
              Browse events
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 4 }, py: 6 }}>
        <SectionHeader label="Explore by interest" title="Popular categories" />
        <Stack direction="row" flexWrap="wrap" gap={1.25}>
          {categoryChips.map((chip) => (
            <Chip
              key={chip.label}
              label={`${chip.icon} ${chip.label}`}
              onClick={() => navigate('/search')}
              sx={{
                borderRadius: '999px',
                px: 1,
                py: 2.75,
                border: '0.5px solid var(--color-border-tertiary)',
                background: 'var(--color-background-primary)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
              }}
            />
          ))}
        </Stack>
      </Container>

      <Box
        sx={{
          height: '0.5px',
          background: 'var(--color-border-tertiary)',
          maxWidth: 960,
          mx: 'auto',
        }}
      />

      <Container
        ref={nearbySectionRef}
        maxWidth={false}
        sx={{ maxWidth: 1040, px: { xs: 2, md: 4 }, py: 6 }}
      >
        <SectionHeader
          label="Near you"
          title="Events happening in your city"
          description="This weekend"
        />
        <HorizontalScrollRow>
          {nearbyEvents.map((event) => (
            <Box
              key={event.id}
              sx={{
                flex: '0 0 clamp(220px, 28vw, 280px)',
                minWidth: 0,
                scrollSnapAlign: 'start',
              }}
            >
              <SmallEventCard event={event} />
            </Box>
          ))}
        </HorizontalScrollRow>
      </Container>

      <Box sx={{ background: 'var(--color-background-secondary)', py: 6 }}>
        <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 4 } }}>
          <SectionHeader label="Join from anywhere" title="Events happening online" />
          <HorizontalScrollRow>
            {onlineEvents.map((event) => (
              <Box
                key={event.id}
                sx={{
                  flex: '0 0 clamp(220px, 28vw, 280px)',
                  minWidth: 0,
                  scrollSnapAlign: 'start',
                }}
              >
                <EventCard event={event} />
              </Box>
            ))}
          </HorizontalScrollRow>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 4 }, py: 6 }}>
        <SectionHeader label="Find something now" title="Things to do" />
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
          {filterChips.map((chip) => (
            <Chip
              key={chip}
              label={chip}
              onClick={() => setActiveFilter(chip)}
              sx={{
                borderRadius: '999px',
                background:
                  activeFilter === chip ? '#D85A30' : 'var(--color-background-primary)',
                color: activeFilter === chip ? '#fff' : 'var(--color-text-primary)',
                border:
                  activeFilter === chip
                    ? '1px solid #D85A30'
                    : '0.5px solid var(--color-border-secondary)',
                px: 1,
              }}
            />
          ))}
        </Stack>
        {isLoading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#D85A30' }} />
          </Box>
        ) : (
          <HorizontalScrollRow>
            {discoverEvents.map((event) => (
              <Box
                key={event.id}
                sx={{
                  flex: '0 0 clamp(240px, 32vw, 320px)',
                  minWidth: 0,
                  scrollSnapAlign: 'start',
                }}
              >
                <ThingsToDoCard
                  event={event}
                  showNeedCallout={activeFilter === 'Contributor spots open'}
                />
              </Box>
            ))}
          </HorizontalScrollRow>
        )}
      </Container>

      <Box
        sx={{
          height: '0.5px',
          background: 'var(--color-border-tertiary)',
          maxWidth: 960,
          mx: 'auto',
        }}
      />

      <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 4 }, py: 6 }}>
        <SectionHeader
          label="The ones who bring it"
          title="Iconic hosts"
          description="Creators, organisers, and vibe-setters the community keeps coming back for."
        />
        <Box
          sx={{
            display: 'flex',
            gap: 2.5,
            overflowX: 'auto',
            pb: 2,
            pt: 4,
            scrollSnapType: 'x mandatory',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {iconicHosts.map((host: any) => (
            <Box key={host.id} sx={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
              <HostCard
                host={host}
                rating={host.avg_rating ? Number(host.avg_rating) : undefined}
              />
            </Box>
          ))}
        </Box>
      </Container>

      <Box
        sx={{
          height: '0.5px',
          background: 'var(--color-border-tertiary)',
          maxWidth: 960,
          mx: 'auto',
        }}
      />

      <Box sx={{ background: 'var(--color-background-secondary)', py: 6 }}>
        <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 4 } }}>
          <SectionHeader
            label="What people are talking about"
            title="Trending highlights"
          />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 1.75,
            }}
          >
            {trendingHighlights.map((highlight: any) => (
              <Box
                key={highlight.id}
                sx={{ display: 'flex', justifyContent: 'center', cursor: 'pointer' }}
                onClick={() => {
                  setSelectedHighlightId(highlight.id);
                  setIsHighlightViewerOpen(true);
                }}
              >
                <HighlightCard highlight={highlight} disableHover />
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {selectedHighlightId && (
        <HighlightChainViewer
          initialHighlightId={selectedHighlightId}
          isOpen={isHighlightViewerOpen}
          onClose={() => setIsHighlightViewerOpen(false)}
        />
      )}

      <Box
        sx={{
          height: '0.5px',
          background: 'var(--color-border-tertiary)',
          maxWidth: 960,
          mx: 'auto',
        }}
      />

      <Box sx={{ background: 'var(--color-background-secondary)', py: 6 }}>
        <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 4 } }}>
          <SectionHeader label="Go where the people are" title="Popular cities" />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 1.5,
            }}
          >
            {cityCards.map((city) => (
              <Box
                key={city.name}
                onClick={() => navigate('/search')}
                sx={{
                  background: 'var(--color-background-primary)',
                  border: '0.5px solid var(--color-border-tertiary)',
                  borderRadius: '24px',
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <Typography sx={{ fontSize: 24, mb: 0.5 }}>{city.flag}</Typography>
                <Typography
                  sx={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {city.name}
                </Typography>
                <Typography
                  sx={{ fontSize: 11, color: 'var(--color-text-secondary)', mt: 0.3 }}
                >
                  {city.count}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 4 }, py: 6 }}>
        <SectionHeader
          label="How it works"
          title="Four ways to go"
          description="However you show up, Outgoing makes it count."
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 2,
          }}
        >
          {howItWorksCards.map((card) => (
            <Box
              key={card.title}
              sx={{
                background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: '24px',
                p: 2.5,
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '16px',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 20,
                  background: card.background,
                  mb: 1.5,
                }}
              >
                {card.icon}
              </Box>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  mb: 0.75,
                }}
              >
                {card.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.55,
                }}
              >
                {card.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>

      <Box
        sx={{ background: '#D85A30', textAlign: 'center', px: 2, py: { xs: 7, md: 8 } }}
      >
        <Container maxWidth={false} sx={{ maxWidth: 800 }}>
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: { xs: 30, md: 40 },
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
            }}
          >
            Go as a guest, a group,
            <br />
            or a contributor.
          </Typography>
          <Typography
            sx={{
              mt: 1.5,
              fontSize: 16,
              color: 'rgba(255,255,255,0.85)',
              maxWidth: 480,
              mx: 'auto',
            }}
          >
            Or go be the one who started it all.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            justifyContent="center"
            sx={{ mt: 4 }}
          >
            <Button
              variant="contained"
              onClick={() => navigate('/search?tab=trending')}
              sx={{
                px: 4.5,
                py: 1.6,
                borderRadius: '999px',
                background: '#fff',
                color: '#D85A30',
                textTransform: 'none',
                fontSize: 16,
                boxShadow: 'none',
              }}
            >
              Browse all events
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/signup')}
              sx={{
                px: 4.5,
                py: 1.6,
                borderRadius: '999px',
                borderColor: 'rgba(255,255,255,0.5)',
                color: '#fff',
                textTransform: 'none',
                fontSize: 16,
              }}
            >
              Start an event
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
