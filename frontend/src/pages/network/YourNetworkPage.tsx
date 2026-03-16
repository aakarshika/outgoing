import { Box, Container } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/hooks';
import { useChatDrawer } from '@/features/events/ChatDrawerContext';
import type { FriendshipItem, NetworkPerson } from '@/features/events/api';
import {
  useMyFriendships,
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

const buddies: readonly BuddyCard[] = [
  {
    name: 'Rahul Mehta',
    initial: 'R',
    color: '#D85A30',
    context: 'Tech buddy · met at Anthill Hackathon · 3 events together',
    category: 'Tech',
    categoryTone: { bg: '#EAF3DE', color: '#3B6D11' },
    active: true,
    note: 'Best for last-minute “should we just go?” plans.',
    events: [
      {
        dot: '#D85A30',
        prefix: 'Going to',
        eventName: 'Indie Night at Social',
        suffix: '· tonight',
      },
      {
        dot: '#888780',
        prefix: 'Interested in',
        eventName: 'Build in Public stream',
        suffix: '· Fri',
      },
    ],
    primaryAction: 'Join Rahul',
    secondaryAction: 'Message',
  },
  {
    name: 'Aditi Sharma',
    initial: 'A',
    color: '#534AB7',
    context: 'Art buddy · met at Cubbon Reads · 2 events together',
    category: 'Arts',
    categoryTone: { bg: '#EEEDFE', color: '#534AB7' },
    note: 'A calm, thoughtful match for gallery nights and workshops.',
    events: [
      {
        dot: '#888780',
        prefix: 'Interested in',
        eventName: 'Graffiti Workshop HSR',
        suffix: '· Sat',
      },
    ],
    primaryAction: 'Go together',
    secondaryAction: 'Message',
  },
  {
    name: 'Karan Nair',
    initial: 'K',
    color: '#1D9E75',
    context: 'Music buddy · met at NH7 Weekender · 5 events together',
    category: 'Music',
    categoryTone: { bg: '#E6F1FB', color: '#185FA5' },
    active: true,
    note: 'Always seems to know where the good room is before everyone else.',
    events: [
      {
        dot: '#1D9E75',
        prefix: 'Hosting',
        suffix: 'Rooftop Vinyl Night · Sat',
      },
      {
        dot: '#D85A30',
        prefix: 'Going to',
        eventName: 'Jazz in the Courtyard',
        suffix: '· Sun',
      },
    ],
    primaryAction: 'Join Karan',
    secondaryAction: 'Assign a need',
    secondaryTone: 'assign',
  },
  {
    name: 'Sneha Krishnan',
    initial: 'S',
    color: '#D4537E',
    context: 'Food buddy · met at VV Puram crawl · 1 event together',
    category: 'Food',
    categoryTone: { bg: '#FAECE7', color: '#993C1D' },
    note: 'Worth nudging when you want to turn a quiet week into a plan.',
    events: [{ dot: '#888780', suffix: 'Nothing planned yet this week' }],
    primaryAction: 'Suggest an event',
    secondaryAction: 'Message',
    secondaryTone: 'ghost',
  },
  {
    name: 'Priya Menon',
    initial: 'P',
    color: '#BA7517',
    context: 'Outdoor buddy · met at Nandi Hills trek · 4 events together',
    category: 'Outdoors',
    categoryTone: { bg: '#FAEEDA', color: '#854F0B' },
    active: true,
    note: 'Good energy for movement, early starts, and chaotic good adventures.',
    events: [
      {
        dot: '#D85A30',
        prefix: 'Going to',
        eventName: 'Midnight Cycling Loop',
        suffix: '· tonight',
      },
    ],
    primaryAction: 'Join Priya',
    secondaryAction: 'Message',
  },
  {
    name: 'Vikram Das',
    initial: 'V',
    color: '#185FA5',
    context: 'Tech buddy · met at Product Conf 2025 · 2 events together',
    category: 'Tech',
    categoryTone: { bg: '#EAF3DE', color: '#3B6D11' },
    note: 'Strong collaborator energy when an event needs an extra pair of hands.',
    events: [
      {
        dot: '#1D9E75',
        prefix: 'Hosting',
        suffix: 'Build in Public stream · Fri',
      },
    ],
    primaryAction: 'Join Vikram',
    secondaryAction: 'Assign a need',
    secondaryTone: 'assign',
  },
] as const;

const pendingRequests: readonly BuddyRequestCard[] = [
  {
    name: 'Ayesha Kapoor',
    initial: 'A',
    color: '#534AB7',
    buddyType: 'Art and Culture',
    kind: 'incoming',
    subtitle: 'You both went to Cubbon Reads and saved two gallery nights this month.',
    badge: '2 shared events',
    primaryAction: 'Accept request',
    secondaryAction: 'Not now',
  },
  {
    name: 'Dev Malhotra',
    initial: 'D',
    color: '#D85A30',
    buddyType: 'Music',
    kind: 'incoming',
    subtitle:
      'You crossed paths at Indie Night at Social and both follow rooftop gig plans.',
    badge: '1 shared event',
    primaryAction: 'Accept request',
    secondaryAction: 'Ignore',
  },
] as const;

const possibleBuddyRequests: readonly BuddyRequestCard[] = [
  {
    name: 'Meera Sethi',
    initial: 'M',
    color: '#1D9E75',
    buddyType: 'Art and Culture',
    kind: 'suggested',
    subtitle:
      'You keep landing at the same readings, pottery jams, and small gallery events.',
    badge: '3 overlaps',
    primaryAction: 'Send request',
  },
  {
    name: 'Nikhil Rao',
    initial: 'N',
    color: '#185FA5',
    buddyType: 'Tech',
    kind: 'suggested',
    subtitle:
      'You both attended Cubbon Park Skate Demo · Sat 8 Mar. Also at NH7 Weekender 2025',
    badge: '2 overlaps',
    primaryAction: 'Send request',
  },
  {
    name: 'Tara Iyer',
    initial: 'T',
    color: '#BA7517',
    buddyType: 'Outdoors',
    kind: 'suggested',
    subtitle:
      'Shared cycling and sunrise hike events suggest this could become an easy recurring plan.',
    badge: '2 overlaps',
    primaryAction: 'Send request',
  },
] as const;

const activity: readonly ActivityItem[] = [
  {
    initial: 'K',
    color: '#1D9E75',
    text: 'Karan Nair is hosting Rooftop Vinyl Night this Saturday.',
    time: '2h ago',
    cta: 'See event',
    event: {
      icon: '🎶',
      title: 'Rooftop Vinyl Night',
      subtitle: 'Sat · 8:00 PM · Indiranagar',
      eventId: 1,
    },
  },
  {
    initial: 'P',
    color: '#BA7517',
    text: 'Priya Menon is going to Midnight Cycling Loop tonight.',
    time: '4h ago',
    cta: 'Join Priya',
  },
  {
    initial: 'R',
    color: '#D85A30',
    text: 'Rahul Mehta is interested in Build in Public stream this Friday.',
    time: 'Yesterday',
  },
] as const;

const BUDDY_COLORS = ['#D85A30', '#534AB7', '#1D9E75', '#D4537E', '#BA7517', '#185FA5'];

function otherUsername(friendship: FriendshipItem, currentUsername: string): string {
  return friendship.user1_username === currentUsername
    ? friendship.user2_username
    : friendship.user1_username;
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
    ? buddies
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

  const displayActivity: readonly ActivityItem[] = !isAuthenticated
    ? activity
    : (networkActivityRes?.activity ?? []).map((item, index) => {
        const name =
          item.actor.first_name && item.actor.last_name
            ? `${item.actor.first_name} ${item.actor.last_name}`.trim()
            : item.actor.username;
        const displayName = name || item.actor.username;
        const verb =
          item.kind === 'hosting'
            ? 'is hosting'
            : item.kind === 'going'
              ? 'is going to'
              : 'is interested in';
        const text = `${displayName} ${verb} ${item.event_title}.`;
        const time = (() => {
          try {
            return formatDistanceToNow(new Date(item.happened_at), {
              addSuffix: true,
            });
          } catch {
            return '';
          }
        })();
        const icon =
          item.kind === 'hosting' ? '🎶' : item.kind === 'going' ? '🎫' : '💡';

        return {
          initial: (displayName.charAt(0) || '?').toUpperCase(),
          color: BUDDY_COLORS[index % BUDDY_COLORS.length],
          text,
          time,
          cta: 'See event',
          event: {
            icon,
            title: item.event_title,
            subtitle: item.event_subtitle,
            eventId: item.event_id,
          },
        };
      });

  const displayPendingIncoming: BuddyRequestCard[] = !isAuthenticated
    ? [...pendingRequests]
    : pendingIncoming.map((friendship: FriendshipItem, index: number) => {
        const username = otherUsername(friendship, user?.username ?? '');
        const name = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();

        return {
          name,
          initial: username.charAt(0).toUpperCase() || '?',
          color: BUDDY_COLORS[index % BUDDY_COLORS.length],
          buddyType: 'Buddy',
          kind: 'incoming' as const,
          subtitle: friendship.request_message || `${name} wants to connect.`,
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
    ? [...possibleBuddyRequests]
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
          color: BUDDY_COLORS[index % BUDDY_COLORS.length],
          buddyType: 'Buddy',
          kind: 'incoming',
          subtitle: friendship.request_message || `${username} wants to connect.`,
          badge: friendship.met_at_event_title
            ? `Met at ${friendship.met_at_event_title}`
            : 'Pending',
          primaryAction: 'Accept request',
          secondaryAction: 'Not now',
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
          buddyType: 'Buddy',
          kind: 'suggested',
          subtitle: friendship.request_message || `Request sent to ${username}.`,
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
        background:
          'linear-gradient(180deg, #F6E8DE 0%, #F7EDE6 16%, #F6F0EA 34%, #FBF8F4 58%, #FBF8F4 100%)',
        pb: { xs: 6, md: 8 },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -140,
          left: '50%',
          width: '150vw',
          height: 900,
          transform: 'translateX(-50%)',
          background:
            'radial-gradient(circle at 18% 18%, rgba(216, 90, 48, 0.72) 0%, rgba(216, 90, 48, 0.18) 26%, rgba(216, 90, 48, 0) 54%), radial-gradient(circle at 82% 12%, rgba(159, 108, 255, 0.54) 0%, rgba(159, 108, 255, 0.16) 24%, rgba(159, 108, 255, 0) 52%), linear-gradient(180deg, #C65436 0%, #DB7A4A 28%, rgba(244, 193, 171, 0.72) 58%, rgba(246, 240, 234, 0) 100%)',
          pointerEvents: 'none',
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
          background:
            'radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        },
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1300,
          px: { xs: 2, md: 4 },
          py: { xs: 2.5, md: 4 },
        }}
      >
        <NetworkHeroSection
          activeBuddies={activeBuddies}
          buddyCount={buddyCount}
          heroMoments={heroMoments}
          isAuthenticated={Boolean(isAuthenticated)}
          onPlanClick={() => navigate('/search')}
          onSearchClick={() => navigate('/search')}
          stats={heroStats}
        />

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
            activityItems={displayActivity}
            isAuthenticated={Boolean(isAuthenticated)}
            onFindEvents={() => navigate('/search')}
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
