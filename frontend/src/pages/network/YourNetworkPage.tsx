import { Box, Container } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/hooks';
import type {
  FriendshipItem,
  NetworkActivityEvent,
  NetworkActivityResponse,
  NetworkPerson,
} from '@/features/events/api';
import { CATEGORY_THEMES, getCategoryTheme } from '@/features/events/CategoricalBackground';
import { useChatDrawer } from '@/features/events/ChatDrawerContext';
import {
  useMyFriendships,
  useMyFriendshipsByOrbitCategory,
  useNetworkActivity,
  useNetworkPeople,
  useUpdateFriendRequest,
} from '@/features/events/hooks';

import { CoreNetworkSection } from './components/CoreNetworkSection';
import { NetworkActivitySection } from './components/NetworkActivitySection';
import { NetworkCirclesSection } from './components/NetworkCirclesSection';
import { NetworkHeroSection } from './components/NetworkHeroSection';
import { PendingRequestsSection } from './components/PendingRequestsSection';
import { SuggestedPeopleSection } from './components/SuggestedPeopleSection';
import type {
  ActivityItem,
  BuddyCard,
  BuddyRequestCard,
  CoreNetworkItem,
  HeroMoment,
  HeroStatItem,
  NetworkActivityGroup,
  NetworkFilter,
  NetworkGroup,
  PendingRequestItem,
  SuggestedRequestItem,
} from './types';

const stats: readonly HeroStatItem[] = [
  {
    value: '24',
    label: 'people in your orbit',
    detail: 'buddies, hosts, regulars',
    accent: '#FAECE7',
    color: '#993C1D',
  },
  {
    value: '11',
    label: 'shared nights out',
    detail: 'proof this is not just a contact list',
    accent: '#E6F1FB',
    color: '#185FA5',
  },
  {
    value: '6',
    label: 'plans already moving',
    detail: 'the network has momentum this month',
    accent: '#EAF3DE',
    color: '#3B6D11',
  },
] as const;

const filters: readonly NetworkFilter[] = [
  { label: 'All', active: true },
  { label: 'Music', active: false },
  { label: 'Tech', active: false },
  { label: 'Arts', active: false },
  { label: 'Food', active: false },
  { label: 'Outdoors', active: false },
  { label: 'Going this weekend', active: false },
  { label: 'Hosting', active: false },
] as const;

const networkGroups: readonly NetworkGroup[] = [
  {
    name: 'Network',
    icon: 'N',
    background: '#FAECE7',
    active: true,
    count: '24',
    caption: 'the people you already move with',
  },
  {
    name: 'Hosts',
    icon: 'H',
    background: '#E6F1FB',
    active: false,
    count: '7',
    caption: 'the ones who open the room',
  },
  {
    name: 'Vendors',
    icon: 'V',
    background: '#EAF3DE',
    active: false,
    count: '4',
    caption: 'helpers, collaborators, fixers',
  },
  {
    name: 'Friends',
    icon: 'F',
    background: '#FAEEDA',
    active: false,
    count: '9',
    caption: 'the easy yes people',
  },
  {
    name: 'Nearby',
    icon: 'L',
    background: '#EEEDFE',
    active: false,
    count: '13',
    caption: 'faces you keep crossing paths with',
  },
  {
    name: 'Soon',
    icon: '+',
    background: '#F1EFE8',
    active: false,
    count: '5',
    caption: 'new circles forming next',
  },
] as const;

const BUDDY_COLORS = ['#D85A30', '#534AB7', '#1D9E75', '#D4537E', '#BA7517', '#185FA5'];

function otherUsername(friendship: FriendshipItem, currentUsername: string): string {
  return friendship.user1_username === currentUsername
    ? friendship.user2_username
    : friendship.user1_username;
}

const OTHER_ACTIVITY_CATEGORY_KEY = '__other';

/** Accent from shared category themes (same source as event categorical UI). */
function categoryColorForGroupTheme(categorySlugKey: string): string {
  if (categorySlugKey === OTHER_ACTIVITY_CATEGORY_KEY) {
    return CATEGORY_THEMES.default.accent;
  }
  const key = categorySlugKey.toLowerCase().trim();
  return CATEGORY_THEMES[key]?.accent ?? CATEGORY_THEMES.default.accent;
}

function formatHappenedAtDistance(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

function joinGoerNames(names: readonly string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  if (names.length === 3) {
    return `${names[0]}, ${names[1]}, and ${names[2]}`;
  }
  const [a, b, c] = names;
  const others = names.length - 3;
  const otherLabel = others === 1 ? '1 other friend' : `${others} other friends`;
  return `${a}, ${b}, ${c}, and ${otherLabel}`;
}

function attendeeDisplayName(att: {
  first_name: string;
  last_name: string;
  username: string;
}): string {
  const n = [att.first_name, att.last_name].filter(Boolean).join(' ').trim();
  return n || att.username;
}

function activityPhraseForType(
  act: 'going' | 'hosting' | 'servicing',
  plural: boolean,
): string {
  if (act === 'going') return plural ? 'are going' : 'is going';
  if (act === 'hosting') return plural ? 'are hosting' : 'is hosting';
  return plural ? 'are servicing this event' : 'is servicing this event';
}

function formatNetworkEventFriendSummary(ev: NetworkActivityEvent): string {
  const goingNames: string[] = [];
  const hostingNames: string[] = [];
  const servicingNames: string[] = [];
  const seenG = new Set<number>();
  const seenH = new Set<number>();
  const seenS = new Set<number>();

  for (const att of ev.relevant_attendees) {
    const label = attendeeDisplayName(att);
    if (att.activities.includes('going') && !seenG.has(att.user_id)) {
      seenG.add(att.user_id);
      goingNames.push(label);
    }
    if (att.activities.includes('hosting') && !seenH.has(att.user_id)) {
      seenH.add(att.user_id);
      hostingNames.push(label);
    }
    if (att.activities.includes('servicing') && !seenS.has(att.user_id)) {
      seenS.add(att.user_id);
      servicingNames.push(label);
    }
  }

  const parts: string[] = [];
  if (goingNames.length) {
    parts.push(
      `${joinGoerNames(goingNames)} ${activityPhraseForType('going', goingNames.length > 1)}`,
    );
  }
  if (hostingNames.length) {
    parts.push(
      `${joinGoerNames(hostingNames)} ${activityPhraseForType('hosting', hostingNames.length > 1)}`,
    );
  }
  if (servicingNames.length) {
    parts.push(
      `${joinGoerNames(servicingNames)} ${activityPhraseForType('servicing', servicingNames.length > 1)}`,
    );
  }

  if (!parts.length) return ev.title;
  return `${parts.join('; ')}`;
}

function mapNetworkActivityGroups(
  data: NetworkActivityResponse | undefined,
): readonly NetworkActivityGroup[] {
  const groups = data?.groups ?? [];
  return groups.map((g) => {
    const slugKey = g.category_slug;
    const themeKey =
      slugKey === 'other' ? OTHER_ACTIVITY_CATEGORY_KEY : slugKey;
    return {
      heading: g.category_name,
      slugKey,
      items: g.events.map((ev): ActivityItem => ({
        initial: '?',
        category_color: categoryColorForGroupTheme(themeKey),
        text: formatNetworkEventFriendSummary(ev),
        time: formatHappenedAtDistance(ev.start_time),
        cta: 'See event',
        eventCategorySlug: slugKey === 'other' ? null : slugKey,
        event: {
          icon: '🎫',
          title: ev.title,
          subtitle: ev.subtitle,
          eventId: ev.event_id,
        },
        goerIds: ev.relevant_attendees.map((a) => a.user_id),
        relevantAttendees: ev.relevant_attendees,
      })),
    };
  });
}

export default function YourNetworkPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { openChat } = useChatDrawer();
  const updateFriendRequest = useUpdateFriendRequest();
  const coreNetworkRef = useRef<HTMLDivElement>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const { data: friendshipsRes, isLoading: friendshipsLoading } = useMyFriendships(
    !!isAuthenticated && !!user,
  );
  const { data: networkPeopleRes } = useNetworkPeople(!!isAuthenticated && !!user);
  const { data: networkActivityRes } = useNetworkActivity(!!isAuthenticated && !!user);
  const { data: friendshipsByOrbitRes } = useMyFriendshipsByOrbitCategory(
    !!isAuthenticated && !!user,
  );

  const orbitFriendsByCategorySlug = useMemo(() => {
    const m: Record<string, { userId: number; avatar: string | null }[]> = {};
    for (const g of friendshipsByOrbitRes?.grouped_friendships ?? []) {
      const slug = g.category.slug;
      m[slug] = g.friendships.map((row) => ({
        userId: row.friend.id,
        avatar: row.friend.avatar,
      }));
    }
    return m;
  }, [friendshipsByOrbitRes]);

  useEffect(() => {
    if (typeof isAuthenticated === 'boolean' && !isAuthenticated) {
      navigate('/signin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const friendshipsPayload = friendshipsRes;
  const networkPeoplePayload = networkPeopleRes;
  const accepted = friendshipsPayload?.accepted ?? [];
  const pendingIncoming = friendshipsPayload?.pending_incoming ?? [];
  const pendingOutgoing = friendshipsPayload?.pending_outgoing ?? [];
  const buddyCount = accepted.length;
  const hasFetchedFriendships =
    isAuthenticated && typeof friendshipsPayload !== 'undefined';

  const displayBuddies: readonly BuddyCard[] = !isAuthenticated
    ? []
    : buddyCount > 0
      ? accepted.map((friendship: FriendshipItem, index: number) => {
          const username = otherUsername(friendship, user?.username ?? '');
          const initial = username.charAt(0).toUpperCase() || '?';
          const color = BUDDY_COLORS[index % BUDDY_COLORS.length];
          const name =
            username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();

          return {
            name,
            initial,
            color,
            context: friendship.met_at_event_title
              ? `Met at ${friendship.met_at_event_title}`
              : 'Buddy',
            category: 'Network',
            categoryTone: { bg: '#FAECE7', color: '#993C1D' },
            active: false,
            note: 'Say hi or make a plan together.',
            events: [],
            primaryAction: 'Message',
            secondaryAction: 'Message',
            met_at_event_id: friendship.met_at_event,
            username,
          };
        })
      : [];

  const networkActivityGroups = !isAuthenticated
    ? []
    : mapNetworkActivityGroups(networkActivityRes);

  const displayPendingIncoming: BuddyRequestCard[] = !isAuthenticated
    ? []
    : pendingIncoming.map((friendship: FriendshipItem, index: number) => {
        const username = otherUsername(friendship, user?.username ?? '');
        const name = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();

        return {
          name,
          initial: username.charAt(0).toUpperCase() || '?',
          color: BUDDY_COLORS[index % BUDDY_COLORS.length],
          buddyType: 'Buddy',
          kind: 'incoming' as const,
          subtitle: friendship.request_message || ``,
          badge: friendship.met_at_event_title
            ? `Met at ${friendship.met_at_event_title}`
            : 'Pending',
          primaryAction: 'Accept request',
          secondaryAction: 'Not now',
        };
      });

  const wentWith = networkPeoplePayload?.went_to_events_with ?? [];
  const hostsMet = networkPeoplePayload?.hosts_met ?? [];
  const vendorsMet = networkPeoplePayload?.vendors_met ?? [];
  const networkFriends = networkPeoplePayload?.friends ?? [];

  const displaySuggestedList = isAuthenticated ? wentWith.slice(0, 4) : null;
  const displaySuggested: BuddyRequestCard[] = !isAuthenticated
    ? []
    : displaySuggestedList
      ? displaySuggestedList.map((person: NetworkPerson, index: number) => ({
          name:
            person.first_name && person.last_name
              ? `${person.first_name} ${person.last_name}`.trim() || person.username
              : person.username,
          initial: (person.first_name || person.username || '?')
            .charAt(0)
            .toUpperCase(),
          color: BUDDY_COLORS[index % BUDDY_COLORS.length],
          buddyType: 'Buddy',
          kind: 'suggested' as const,
          subtitle: person.event_title
            ? `You both attended ${person.event_title}. Send a buddy request from that event.`
            : 'You attended the same event.',
          badge: person.event_title ? '1 shared event' : 'Same event',
          primaryAction: 'Send request',
        }))
      : [];

  const displayNetworkGroups: readonly NetworkGroup[] = !isAuthenticated
    ? networkGroups
    : networkPeoplePayload
      ? [
          {
            name: 'Network',
            icon: 'N',
            background: '#FAECE7',
            active: true,
            count: String(
              (networkPeoplePayload.friends?.length ?? 0) +
                (networkPeoplePayload.went_to_events_with?.length ?? 0) +
                (hostsMet.length + vendorsMet.length),
            ),
            caption: 'the people you already move with',
          },
          {
            name: 'Hosts',
            icon: 'H',
            background: '#E6F1FB',
            active: false,
            count: String(hostsMet.length),
            caption: 'the ones who open the room',
          },
          {
            name: 'Vendors',
            icon: 'V',
            background: '#EAF3DE',
            active: false,
            count: String(vendorsMet.length),
            caption: 'helpers, collaborators, fixers',
          },
          {
            name: 'Friends',
            icon: 'F',
            background: '#FAEEDA',
            active: false,
            count: String(networkFriends.length || buddyCount),
            caption: 'the easy yes people',
          },
          {
            name: 'Nearby',
            icon: 'L',
            background: '#EEEDFE',
            active: false,
            count: String(wentWith.length),
            caption: 'faces you keep crossing paths with',
          },
          {
            name: 'Soon',
            icon: '+',
            background: '#F1EFE8',
            active: false,
            count: '0',
            caption: 'new circles forming next',
          },
        ]
      : [
          {
            name: 'Network',
            icon: 'N',
            background: '#FAECE7',
            active: true,
            count: '0',
            caption: 'the people you already move with',
          },
          {
            name: 'Hosts',
            icon: 'H',
            background: '#E6F1FB',
            active: false,
            count: '0',
            caption: 'the ones who open the room',
          },
          {
            name: 'Vendors',
            icon: 'V',
            background: '#EAF3DE',
            active: false,
            count: '0',
            caption: 'helpers, collaborators, fixers',
          },
          {
            name: 'Friends',
            icon: 'F',
            background: '#FAEEDA',
            active: false,
            count: '0',
            caption: 'the easy yes people',
          },
          {
            name: 'Nearby',
            icon: 'L',
            background: '#EEEDFE',
            active: false,
            count: '0',
            caption: 'faces you keep crossing paths with',
          },
          {
            name: 'Soon',
            icon: '+',
            background: '#F1EFE8',
            active: false,
            count: '0',
            caption: 'new circles forming next',
          },
        ];

  const activeBuddies = displayBuddies.filter((buddy) => buddy.active).slice(0, 3);
  const heroMoments: readonly HeroMoment[] = displayBuddies
    .flatMap((buddy) =>
      buddy.events.slice(0, 1).map((event) => ({
        name: buddy.name,
        initial: buddy.initial,
        color: buddy.color,
        text: event.eventName
          ? `${event.prefix || 'Around'} ${event.eventName} ${event.suffix}`
          : event.suffix,
      })),
    )
    .slice(0, 3);

  const heroStats: readonly HeroStatItem[] = hasFetchedFriendships
    ? [{ ...stats[0], value: String(buddyCount) }, stats[1], stats[2]]
    : stats;

  const incomingPendingItems: readonly PendingRequestItem[] = pendingIncoming.map(
    (friendship: FriendshipItem, index: number) => {
      const username = otherUsername(friendship, user?.username ?? '');
      const name = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();

      return {
        key: friendship.id,
        username,
        eventId: friendship.met_at_event,
        request: {
          name,
          initial: username.charAt(0).toUpperCase() || '?',
          color: getCategoryTheme({ slug: friendship.orbit_category_slug })?.accent,
          buddyType:
            'Wants to be ' + getCategoryTheme({ slug: friendship.orbit_category_slug })?.name + ' Buddy',
          kind: 'incoming',
          subtitle: friendship.request_message || ``,
          badge: friendship.met_at_event_title
            ? `Met at ${friendship.met_at_event_title}`
            : 'Pending',
          primaryAction: 'Accept request',
          secondaryAction: 'Not Now',
        },
      };
    },
  );

  const outgoingPendingItems: readonly PendingRequestItem[] = pendingOutgoing.map(
    (friendship: FriendshipItem, index: number) => {
      const username = otherUsername(friendship, user?.username ?? '');
      const name = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();

      return {
        key: friendship.id,
        username,
        eventId: friendship.met_at_event,
        request: {
          name,
          initial: username.charAt(0).toUpperCase() || '?',
          color: BUDDY_COLORS[(index + 1) % BUDDY_COLORS.length],
          buddyType:
            'Potential ' + getCategoryTheme({ slug: friendship.orbit_category_slug })?.name + ' Buddy',
          kind: 'suggested',
          subtitle: friendship.request_message || ``,
          badge: friendship.met_at_event_title
            ? `Met at ${friendship.met_at_event_title}`
            : 'Pending',
          primaryAction: 'Withdraw request',
        },
      };
    },
  );

  const coreNetworkItems: readonly CoreNetworkItem[] = displayBuddies.map((buddy) => ({
    buddy,
    messageTarget: buddy.username ?? buddy.name.toLowerCase(),
  }));

  const suggestedRequestItems: readonly SuggestedRequestItem[] = displaySuggested.map(
    (request, index) => ({
      key: request.name + (displaySuggestedList?.[index]?.username ?? ''),
      request,
      messageTarget:
        displaySuggestedList?.[index]?.username ??
        request.name.toLowerCase().replace(/\s+/g, ''),
      suggestedEventId: displaySuggestedList?.[index]?.event_id,
      suggestedUsername: displaySuggestedList?.[index]?.username,
    }),
  );

  const handleOpenMessage = (username: string) => {
    openChat({
      mode: 'direct',
      targetUsername: username,
      otherUsername: username,
      badgeLabel: 'Direct',
      title: `Chat with ${username}`,
    });
  };

  const handleAcceptRequest = (eventId: number | null, username: string) => {
    if (eventId == null) {
      toast.error('Accept from an event where you met.');
      return;
    }

    updateFriendRequest.mutate(
      { eventId, targetUsername: username, payload: { action: 'accept' } },
      {
        onSuccess: (response) => toast.success(response.message),
        onError: (error: any) =>
          toast.error(error?.response?.data?.message || 'Failed to accept'),
      },
    );
  };

  const handleWithdrawRequest = (eventId: number | null, username: string) => {
    if (eventId == null) {
      toast.error('Cannot withdraw without event context.');
      return;
    }

    updateFriendRequest.mutate(
      { eventId, targetUsername: username, payload: { action: 'withdraw' } },
      {
        onSuccess: (response) => toast.success(response.message),
        onError: (error: any) =>
          toast.error(error?.response?.data?.message || 'Failed to withdraw'),
      },
    );
  };

  const scrollToCoreNetwork = useCallback(() => {
    coreNetworkRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
          background: 'rgba(237, 232, 226, 0.9)',
        pb: { xs: 6, md: 8 },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -140,
          left: '50%',
          width: '150vw',
          height: 900,
          transform: 'translateX(-50%)',pointerEvents: 'none',
          zIndex: 0,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 220,
          right: '-8vw',
          width: 420,
          height: 420,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0,
        },
      }}
    >
      <Container
        disableGutters
        maxWidth={false}
        sx={{
          background: 'transparent',
          position: 'relative',
          zIndex: 1,
          maxWidth: 1300,
          px: { xs: 2, md: 4 },
          pt: 8,
        }}
      >
        <Box sx={{ mt: { xs: 3, md: 4 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' },
              gap: 2,
            }}
          >
            <PendingRequestsSection
              actionPending={updateFriendRequest.isPending}
              fallbackRequests={displayPendingIncoming}
              hasFetchedFriendships={hasFetchedFriendships}
              incomingItems={incomingPendingItems}
              isLoading={friendshipsLoading}
              onAccept={handleAcceptRequest}
              onMessage={handleOpenMessage}
              onWithdraw={handleWithdrawRequest}
              outgoingItems={outgoingPendingItems}
            />

            <NetworkCirclesSection
              groups={displayNetworkGroups}
              onCircleClick={scrollToCoreNetwork}
            />
          </Box>
        </Box>

        <CoreNetworkSection
          filters={filters}
          items={coreNetworkItems}
          onFilterChange={setSelectedFilter}
          onFindEvents={() => navigate('/search')}
          onJoin={(eventId) => navigate(`/events/${eventId}`)}
          onMessage={handleOpenMessage}
          onSeeAll={scrollToCoreNetwork}
          sectionRef={coreNetworkRef}
          selectedFilter={selectedFilter}
          showEmptyState={displayBuddies.length === 0 && hasFetchedFriendships}
        />

        <Box
          sx={{
            mt: { xs: 3, md: 4 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', xl: '1fr 0.92fr' },
            gap: 2,
          }}
        >
          <NetworkActivitySection
            activityGroups={networkActivityGroups}
            isAuthenticated={Boolean(isAuthenticated)}
            onFindEvents={() => navigate('/search')}
            orbitFriendsByCategorySlug={orbitFriendsByCategorySlug}
          />

          <SuggestedPeopleSection
            items={suggestedRequestItems}
            onMessage={handleOpenMessage}
            onSendRequest={(eventId) => navigate(`/events/${eventId}`)}
          />
        </Box>
      </Container>
    </Box>
  );
}
