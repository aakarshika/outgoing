import { Avatar, Box, Button, Chip, Container, Stack, Typography } from '@mui/material';
import {
  ArrowRight,
  Clock3,
  MessageCircle,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { formatDistanceToNow } from 'date-fns';

type BuddyCard = {
  name: string;
  initial: string;
  color: string;
  context: string;
  category: string;
  categoryTone: {
    bg: string;
    color: string;
  };
  active?: boolean;
  note: string;
  events: ReadonlyArray<{
    dot: string;
    prefix?: string;
    eventName?: string;
    suffix: string;
    eventId?: number;
  }>;
  primaryAction: string;
  secondaryAction: string;
  secondaryTone?: 'assign' | 'ghost';
  /** For wiring: username and event id from API */
  username?: string;
  met_at_event_id?: number | null;
};

type BuddyRequestCard = {
  name: string;
  initial: string;
  color: string;
  buddyType: string;
  kind: 'incoming' | 'suggested';
  subtitle: string;
  badge: string;
  primaryAction: string;
  secondaryAction?: string;
};

type ActivityItem = {
  initial: string;
  color: string;
  text: string;
  time: string;
  cta?: string;
  event?: {
    icon: string;
    title: string;
    subtitle: string;
    eventId?: number;
  };
};

const stats = [
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

const filters = [
  { label: 'All', active: true },
  { label: 'Music', active: false },
  { label: 'Tech', active: false },
  { label: 'Arts', active: false },
  { label: 'Food', active: false },
  { label: 'Outdoors', active: false },
  { label: 'Going this weekend', active: false },
  { label: 'Hosting', active: false },
] as const;

const networkGroups = [
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

function SectionIntro({
  eyebrow,
  title,
  description,
  action,
  onActionClick,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: string;
  onActionClick?: () => void;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
      justifyContent="space-between"
    >
      <Stack spacing={0.8}>
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(66, 50, 28, 0.58)',
          }}
        >
          {eyebrow}
        </Typography>
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: { xs: 26, md: 32 },
            fontWeight: 800,
            lineHeight: 1.04,
            letterSpacing: '-0.045em',
            color: '#2B2118',
          }}
        >
          {title}
        </Typography>
        {description ? (
          <Typography
            sx={{
              maxWidth: 640,
              fontSize: 14.5,
              lineHeight: 1.65,
              color: 'rgba(66, 50, 28, 0.74)',
            }}
          >
            {description}
          </Typography>
        ) : null}
      </Stack>
      {action ? (
        <Button
          variant="text"
          endIcon={<ArrowRight size={16} />}
          onClick={onActionClick}
          sx={{
            px: 0,
            minWidth: 0,
            textTransform: 'none',
            fontWeight: 700,
            color: '#D85A30',
            alignSelf: { xs: 'flex-start', sm: 'center' },
          }}
        >
          {action}
        </Button>
      ) : null}
    </Stack>
  );
}

function HeroStat({
  value,
  label,
  detail,
  accent,
  color,
}: {
  value: string;
  label: string;
  detail: string;
  accent: string;
  color: string;
}) {
  return (
    <Box
      sx={{
        borderRadius: '18px',
        px: 2,
        py: 1.9,
        background: 'rgba(255,255,255,0.14)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Stack direction="row" spacing={1.15} alignItems="flex-start">
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '14px',
            background: accent,
            color,
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {value}
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#FFF7F2' }}>
            {label}
          </Typography>
          <Typography
            sx={{ mt: 0.35, fontSize: 11.5, color: 'rgba(255,255,255,0.72)' }}
          >
            {detail}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function RequestCard({
  request,
  onAccept,
  onWithdraw,
  onMessage,
  onSendRequest,
  suggestedEventId,
  suggestedUsername,
  actionPending,
}: {
  request: BuddyRequestCard;
  onAccept?: () => void;
  onWithdraw?: () => void;
  onMessage?: () => void;
  onSendRequest?: (eventId: number, username: string) => void;
  suggestedEventId?: number | null;
  suggestedUsername?: string;
  actionPending?: boolean;
}) {
  const isIncoming = request.kind === 'incoming';
  const hasRealActions = (isIncoming && onAccept) || (!isIncoming && onWithdraw);
  const hasSendRequest = !isIncoming && onSendRequest && suggestedEventId != null && suggestedUsername;

  return (
    <Box
      sx={{
        borderRadius: '18px',
        p: 2.1,
        height: '100%',
        background: isIncoming
          ? 'linear-gradient(180deg, #FFF9F5 0%, #FFFFFF 100%)'
          : 'linear-gradient(180deg, #FAF9FF 0%, #FFFFFF 100%)',
        boxShadow: isIncoming
          ? '0 16px 36px rgba(216, 90, 48, 0.08)'
          : '0 16px 36px rgba(83, 74, 183, 0.08)',
      }}
    >
      <Stack spacing={1.5} sx={{ height: '100%' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Stack direction="row" spacing={1.1} alignItems="center">
            <Avatar
              sx={{
                width: 44,
                height: 44,
                fontSize: 13,
                fontWeight: 700,
                bgcolor: request.color,
              }}
            >
              {request.initial}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#2B2118' }}>
                {request.name}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: 'rgba(66, 50, 28, 0.62)' }}>
                {request.buddyType}
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={request.badge}
            sx={{
              height: 24,
              background: isIncoming ? '#FAECE7' : '#EEEDFE',
              color: isIncoming ? '#993C1D' : '#534AB7',
              fontSize: 10.5,
              fontWeight: 700,
            }}
          />
        </Stack>

        <Typography
          sx={{
            fontSize: 13.5,
            lineHeight: 1.55,
            color: '#4A3827',
          }}
        >
          {isIncoming
            ? `${request.name} wants to be your "${request.buddyType}" buddy.`
            : `${request.name} looks like an easy fit for your "${request.buddyType}" circle.`}
        </Typography>

        <Typography
          sx={{
            fontSize: 12,
            lineHeight: 1.55,
            color: 'rgba(66, 50, 28, 0.68)',
          }}
        >
          {request.subtitle}
        </Typography>

        <Stack
          direction="row"
          spacing={0.9}
          useFlexGap
          flexWrap="wrap"
          sx={{ mt: 'auto' }}
        >
          <Button
            variant="contained"
            endIcon={<ArrowRight size={15} />}
            disabled={Boolean((hasRealActions || hasSendRequest) && actionPending)}
            onClick={
              hasRealActions
                ? isIncoming
                  ? onAccept
                  : onWithdraw
                : hasSendRequest
                  ? () => onSendRequest!(suggestedEventId!, suggestedUsername!)
                  : undefined
            }
            sx={{
              borderRadius: '999px',
              textTransform: 'none',
              fontWeight: 700,
              background: isIncoming ? '#D85A30' : '#534AB7',
              boxShadow: 'none',
            }}
          >
            {request.primaryAction}
          </Button>
          {request.secondaryAction ? (
            <Button
              variant="contained"
              onClick={onMessage}
              sx={{
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 600,
                color: '#4A3827',
                background: '#F2E7DE',
                boxShadow: 'none',
              }}
            >
              {request.secondaryAction}
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<MessageCircle size={15} />}
              onClick={onMessage}
              sx={{
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 600,
                color: '#534AB7',
                background: '#EEE9FF',
                boxShadow: 'none',
              }}
            >
              Say hi first
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

function renderBuddyEventCopy(event: BuddyCard['events'][number]) {
  if (!event.prefix) {
    return event.suffix;
  }

  return (
    <>
      {event.prefix}{' '}
      {event.eventName ? (
        <Box component="span" sx={{ fontWeight: 700, color: '#2B2118' }}>
          {event.eventName}
        </Box>
      ) : null}{' '}
      {event.suffix}
    </>
  );
}

function BuddySpotlightCard({
  buddy,
  onMessage,
  onJoin,
}: {
  buddy: BuddyCard;
  onMessage?: () => void;
  onJoin?: (eventId: number) => void;
}) {
  const navigate = useNavigate();
  const primaryIsMuted = buddy.primaryAction === 'Suggest an event';
  const eventId = buddy.met_at_event_id ?? buddy.events[0]?.eventId;

  return (
    <Box
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.95)',
        boxShadow: '0 20px 40px rgba(110, 74, 36, 0.06)',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.4,
          background: buddy.categoryTone.bg,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Chip
            label={buddy.category}
            sx={{
              height: 24,
              background: 'rgba(255,255,255,0.72)',
              color: buddy.categoryTone.color,
              fontSize: 10.5,
              fontWeight: 800,
            }}
          />
          <Stack direction="row" spacing={0.75} alignItems="center">
            {buddy.active ? (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#1D9E75',
                  boxShadow: '0 0 0 5px rgba(29, 158, 117, 0.14)',
                }}
              />
            ) : null}
            <Typography sx={{ fontSize: 11.5, color: 'rgba(66, 50, 28, 0.70)' }}>
              {buddy.active ? 'Making plans now' : 'Quiet but warm'}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.3} alignItems="flex-start">
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Avatar
                sx={{
                  width: 50,
                  height: 50,
                  fontSize: 15,
                  fontWeight: 800,
                  bgcolor: buddy.color,
                }}
              >
                {buddy.initial}
              </Avatar>
              {buddy.active ? (
                <Box
                  sx={{
                    position: 'absolute',
                    right: 2,
                    bottom: 2,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#1D9E75',
                  }}
                />
              ) : null}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: '#2B2118',
                }}
              >
                {buddy.name}
              </Typography>
              <Typography
                sx={{
                  mt: 0.45,
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  color: 'rgba(66, 50, 28, 0.68)',
                }}
              >
                {buddy.context}
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              borderRadius: '20px',
              px: 1.4,
              py: 1.15,
              background: '#F8F4EE',
            }}
          >
            <Typography
              sx={{
                fontSize: 12.5,
                lineHeight: 1.55,
                color: '#4A3827',
              }}
            >
              {buddy.note}
            </Typography>
          </Box>

          <Stack spacing={0.9}>
            {buddy.events.map((event, index) => (
              <Stack
                key={`${buddy.name}-${index}`}
                direction="row"
                spacing={1}
                alignItems="flex-start"
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: event.dot,
                    mt: 0.8,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    color: 'rgba(66, 50, 28, 0.74)',
                  }}
                >
                  {renderBuddyEventCopy(event)}
                </Typography>
              </Stack>
            ))}
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              endIcon={<ArrowRight size={15} />}
              onClick={() => {
                if (primaryIsMuted) navigate('/search');
                else if (eventId != null && onJoin) onJoin(eventId);
                else if (buddy.primaryAction === 'Message' && onMessage) onMessage();
                else if (!primaryIsMuted) navigate('/search');
              }}
              sx={{
                flex: 1,
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 700,
                background: primaryIsMuted ? '#F3ECE5' : '#D85A30',
                color: primaryIsMuted ? '#4A3827' : '#fff',
                boxShadow: 'none',
              }}
            >
              {buddy.primaryAction}
            </Button>
            <Button
              variant="contained"
              startIcon={
                buddy.secondaryTone === 'assign' ? (
                  <Sparkles size={15} />
                ) : (
                  <MessageCircle size={15} />
                )
              }
              onClick={() => {
                if (buddy.secondaryTone === 'assign') navigate('/search');
                else if (onMessage) onMessage();
              }}
              sx={{
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 700,
                color: buddy.secondaryTone === 'assign' ? '#854F0B' : '#2B2118',
                background: buddy.secondaryTone === 'assign' ? '#FAEEDA' : '#F3ECE5',
                boxShadow: 'none',
              }}
            >
              {buddy.secondaryAction}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

function ActivityCard({
  item,
  onCtaClick,
}: {
  item: ActivityItem;
  onCtaClick?: (eventId?: number) => void;
}) {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        borderRadius: '18px',
        p: 1.7,
        background: 'rgba(255,255,255,0.88)',
      }}
    >
      <Stack direction="row" spacing={1.3} alignItems="flex-start">
        <Avatar
          sx={{
            width: 38,
            height: 38,
            fontSize: 12,
            fontWeight: 700,
            bgcolor: item.color,
          }}
        >
          {item.initial}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={0.8}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Typography
              sx={{
                fontSize: 13.5,
                lineHeight: 1.55,
                color: '#2B2118',
              }}
            >
              {item.text}
            </Typography>
            <Stack
              direction="row"
              spacing={0.55}
              alignItems="center"
              sx={{ flexShrink: 0 }}
            >
              <Clock3 size={13} color="#8A7762" />
              <Typography sx={{ fontSize: 11.5, color: 'rgba(66, 50, 28, 0.58)' }}>
                {item.time}
              </Typography>
            </Stack>
          </Stack>

          {item.event ? (
            <Box
              sx={{
                mt: 1.1,
                borderRadius: '18px',
                px: 1.2,
                py: 1,
                background: '#F6F1EC',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontSize: 15 }}>{item.event.icon}</Typography>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{ fontSize: 12.5, fontWeight: 700, color: '#2B2118' }}
                  >
                    {item.event.title}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'rgba(66, 50, 28, 0.62)' }}>
                    {item.event.subtitle}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ) : null}

          {item.cta ? (
            <Button
              variant="text"
              endIcon={<ArrowRight size={15} />}
              onClick={() => {
                if (item.event?.eventId != null)
                  navigate(`/events/${item.event.eventId}`);
                else onCtaClick?.(item.event?.eventId);
              }}
              sx={{
                mt: 0.85,
                px: 0,
                minWidth: 0,
                textTransform: 'none',
                fontWeight: 700,
                color: '#D85A30',
              }}
            >
              {item.cta}
            </Button>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}

const BUDDY_COLORS = [
  '#D85A30',
  '#534AB7',
  '#1D9E75',
  '#D4537E',
  '#BA7517',
  '#185FA5',
];

function otherUsername(f: FriendshipItem, currentUsername: string): string {
  return f.user1_username === currentUsername ? f.user2_username : f.user1_username;
}

export default function YourNetworkPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { openChat } = useChatDrawer();
  const updateFriendRequest = useUpdateFriendRequest();
  const coreNetworkRef = useRef<HTMLDivElement>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const { data: friendshipsRes, isLoading: friendshipsLoading } = useMyFriendships(
    !!isAuthenticated && !!user
  );
  const { data: networkPeopleRes } = useNetworkPeople(!!isAuthenticated && !!user);
  const { data: networkActivityRes } = useNetworkActivity(!!isAuthenticated && !!user);
  const networkPeoplePayload = networkPeopleRes;

  useEffect(() => {
    if (typeof isAuthenticated === 'boolean' && !isAuthenticated) {
      navigate('/signin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const friendshipsPayload = friendshipsRes;
  const accepted = friendshipsPayload?.accepted ?? [];
  const pendingIncoming = friendshipsPayload?.pending_incoming ?? [];
  const pendingOutgoing = friendshipsPayload?.pending_outgoing ?? [];
  const buddyCount = accepted.length;
  const hasFetchedFriendships = isAuthenticated && typeof friendshipsPayload !== 'undefined';

  const displayBuddies: readonly BuddyCard[] =
    !isAuthenticated
      ? buddies
      : buddyCount > 0
        ? accepted.map((f: FriendshipItem, i: number) => {
            const username = otherUsername(f, user?.username ?? '');
            const initial = username.charAt(0).toUpperCase() || '?';
            const color = BUDDY_COLORS[i % BUDDY_COLORS.length];
            const name = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
            return {
              name,
              initial,
              color,
              context: f.met_at_event_title
                ? `Met at ${f.met_at_event_title}`
                : 'Buddy',
              category: 'Network',
              categoryTone: { bg: '#FAECE7', color: '#993C1D' },
              active: false,
              note: 'Say hi or make a plan together.',
              events: [],
              primaryAction: 'Message',
              secondaryAction: 'Message',
              met_at_event_id: f.met_at_event,
              username,
            };
          })
        : [];

  const displayActivity: readonly ActivityItem[] = !isAuthenticated
    ? activity
    : (networkActivityRes?.activity ?? []).map((item, i) => {
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
        const timeStr = (() => {
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
          color: BUDDY_COLORS[i % BUDDY_COLORS.length],
          text,
          time: timeStr,
          cta: 'See event',
          event: {
            icon,
            title: item.event_title,
            subtitle: item.event_subtitle,
            eventId: item.event_id,
          },
        };
      });

  const displayPendingIncoming: BuddyRequestCard[] =
    !isAuthenticated
      ? [...pendingRequests]
      : pendingIncoming.map((f: FriendshipItem, i: number) => {
          const username = otherUsername(f, user?.username ?? '');
          const name = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
          return {
            name,
            initial: username.charAt(0).toUpperCase() || '?',
            color: BUDDY_COLORS[i % BUDDY_COLORS.length],
            buddyType: 'Buddy',
            kind: 'incoming' as const,
            subtitle: f.request_message || `${name} wants to connect.`,
            badge: f.met_at_event_title ? `Met at ${f.met_at_event_title}` : 'Pending',
            primaryAction: 'Accept request',
            secondaryAction: 'Not now',
          };
        });

  const handleAcceptRequest = (eventId: number | null, username: string) => {
    if (eventId == null) {
      toast.error('Accept from an event where you met.');
      return;
    }
    updateFriendRequest.mutate(
      { eventId, targetUsername: username, payload: { action: 'accept' } },
      {
        onSuccess: (r) => toast.success(r.message),
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to accept'),
      }
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
        onSuccess: (r) => toast.success(r.message),
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to withdraw'),
      }
    );
  };

  const handleOpenMessage = (username: string) => {
    openChat({
      mode: 'direct',
      targetUsername: username,
      title: `Chat with ${username}`,
    });
  };

  const scrollToCoreNetwork = useCallback(() => {
    coreNetworkRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const wentWith = networkPeoplePayload?.went_to_events_with ?? [];
  const hostsMet = networkPeoplePayload?.hosts_met ?? [];
  const vendorsMet = networkPeoplePayload?.vendors_met ?? [];
  const networkFriends = networkPeoplePayload?.friends ?? [];

  const displaySuggestedList = isAuthenticated ? wentWith.slice(0, 4) : null;
  const displaySuggested: BuddyRequestCard[] = !isAuthenticated
    ? [...possibleBuddyRequests]
    : displaySuggestedList
      ? displaySuggestedList.map((p: NetworkPerson, i: number) => ({
          name: p.first_name && p.last_name ? `${p.first_name} ${p.last_name}`.trim() || p.username : p.username,
          initial: (p.first_name || p.username || '?').charAt(0).toUpperCase(),
          color: BUDDY_COLORS[i % BUDDY_COLORS.length],
          buddyType: 'Buddy',
          kind: 'suggested' as const,
          subtitle: p.event_title ? `You both attended ${p.event_title}. Send a buddy request from that event.` : 'You attended the same event.',
          badge: p.event_title ? '1 shared event' : 'Same event',
          primaryAction: 'Send request',
        }))
      : [];

  const displayNetworkGroups = !isAuthenticated
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
              (hostsMet.length + vendorsMet.length)
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
        { name: 'Network', icon: 'N', background: '#FAECE7', active: true, count: '0', caption: 'the people you already move with' },
        { name: 'Hosts', icon: 'H', background: '#E6F1FB', active: false, count: '0', caption: 'the ones who open the room' },
        { name: 'Vendors', icon: 'V', background: '#EAF3DE', active: false, count: '0', caption: 'helpers, collaborators, fixers' },
        { name: 'Friends', icon: 'F', background: '#FAEEDA', active: false, count: '0', caption: 'the easy yes people' },
        { name: 'Nearby', icon: 'L', background: '#EEEDFE', active: false, count: '0', caption: 'faces you keep crossing paths with' },
        { name: 'Soon', icon: '+', background: '#F1EFE8', active: false, count: '0', caption: 'new circles forming next' },
      ];

  const activeBuddies = displayBuddies.filter((b) => b.active).slice(0, 3);
  const heroMoments = displayBuddies
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
        <Box
          sx={{
            px: { xs: 2, sm: 2.6, md: 3.2 },
            py: { xs: 2.4, sm: 2.8, md: 3.2 },
            color: '#fff',
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Stack spacing={3}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', xl: 'row' },
                  gap: 2.5,
                  justifyContent: 'space-between',
                  alignItems: { xs: 'stretch', xl: 'flex-start' },
                }}
              >
                <Box sx={{ maxWidth: 620 }}>
                  <Chip
                    icon={<Sparkles size={14} />}
                    label="Your network should feel alive"
                    sx={{
                      mb: 2,
                      height: 34,
                      borderRadius: '999px',
                      background: 'rgba(255,255,255,0.16)',
                      color: '#fff',
                      '& .MuiChip-icon': { color: '#fff' },
                      fontWeight: 700,
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: { xs: 36, md: 58 },
                      fontWeight: 800,
                      lineHeight: 0.97,
                      letterSpacing: '-0.06em',
                      maxWidth: 560,
                    }}
                  >
                    Your people, in motion.
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1.8,
                      maxWidth: 560,
                      fontSize: { xs: 15.5, md: 17 },
                      lineHeight: 1.7,
                      color: 'rgba(255,255,255,0.82)',
                    }}
                  >
                    This should feel less like a spreadsheet of names and more like a
                    living social map. Who is active, who matches your energy, who you
                    nearly met, and where the next easy yes is already forming.
                  </Typography>

                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1.2}
                    alignItems={{ xs: 'stretch', md: 'center' }}
                    sx={{ mt: 2.4 }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      onClick={() => navigate('/search')}
                      sx={{
                        minWidth: 0,
                        flex: 1,
                        px: 1.6,
                        py: 1.15,
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.14)',
                        cursor: 'pointer',
                      }}
                    >
                      <Search size={16} />
                      <Typography
                        sx={{
                          fontSize: 14,
                          color: 'rgba(255,255,255,0.88)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        Search your people, circles, or shared plans
                      </Typography>
                    </Stack>
                    <Button
                      variant="contained"
                      endIcon={<ArrowRight size={16} />}
                      onClick={() => navigate('/search')}
                      sx={{
                        flexShrink: 0,
                        borderRadius: '999px',
                        px: 2.3,
                        py: 1.1,
                        textTransform: 'none',
                        fontWeight: 800,
                        color: '#2B2118',
                        background: '#FFF5EE',
                        boxShadow: 'none',
                      }}
                    >
                      Make a plan
                    </Button>
                  </Stack>
                </Box>

                <Stack
                  spacing={1.3}
                  sx={{ width: { xs: '100%', xl: 380 }, flexShrink: 0 }}
                >
                  <Box
                    sx={{
                      borderRadius: '18px',
                      p: 2,
                      background: 'rgba(255,255,255,0.14)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Stack spacing={1.6}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography
                          sx={{
                            fontFamily: 'Syne, sans-serif',
                            fontSize: 22,
                            fontWeight: 800,
                            letterSpacing: '-0.04em',
                            color: '#fff',
                          }}
                        >
                          This week in your orbit
                        </Typography>
                        <Chip
                          label={
                            isAuthenticated
                              ? activeBuddies.length > 0
                                ? `${activeBuddies.length} active now`
                                : buddyCount > 0
                                  ? `${buddyCount} in your orbit`
                                  : 'Your orbit'
                              : '3 active now'
                          }
                          sx={{
                            height: 24,
                            background: 'rgba(255,255,255,0.18)',
                            color: '#fff',
                            fontWeight: 700,
                          }}
                        />
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={1.1}
                        sx={{ '& > *:not(:first-of-type)': { ml: -1 } }}
                      >
                        {activeBuddies.map((buddy) => (
                          <Avatar
                            key={buddy.name}
                            sx={{
                              width: 46,
                              height: 46,
                              bgcolor: buddy.color,
                              fontWeight: 800,
                              boxShadow: '0 0 0 4px rgba(255,255,255,0.18)',
                            }}
                          >
                            {buddy.initial}
                          </Avatar>
                        ))}
                      </Stack>

                      {(heroMoments.length === 0 && isAuthenticated && buddyCount === 0) ? (
                        <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.84)' }}>
                          Go to events and connect with people to see them here.
                        </Typography>
                      ) : null}

                      <Stack spacing={1}>
                        {heroMoments.map((moment) => (
                          <Stack
                            key={`${moment.name}-${moment.text}`}
                            direction="row"
                            spacing={1}
                            alignItems="flex-start"
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: '#fff',
                                mt: 0.8,
                                flexShrink: 0,
                              }}
                            />
                            <Typography
                              sx={{
                                fontSize: 13,
                                lineHeight: 1.55,
                                color: 'rgba(255,255,255,0.84)',
                              }}
                            >
                              <Box
                                component="span"
                                sx={{ fontWeight: 700, color: '#fff' }}
                              >
                                {moment.name}
                              </Box>{' '}
                              {moment.text}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                  </Box>

                  <Box
                    sx={{
                      borderRadius: '18px',
                      p: 1.8,
                      background: 'rgba(43, 33, 24, 0.18)',
                    }}
                  >
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: '16px',
                          display: 'grid',
                          placeItems: 'center',
                          background: 'rgba(255,255,255,0.16)',
                        }}
                      >
                        <Users size={18} />
                      </Box>
                      <Box>
                        <Typography
                          sx={{ fontSize: 13, fontWeight: 700, color: '#fff' }}
                        >
                          Your strongest pattern right now
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.35,
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.74)',
                          }}
                        >
                          Music and tech people are driving most of your next plans.
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                  gap: 1.2,
                }}
              >
                {(hasFetchedFriendships
                  ? [
                      { ...stats[0], value: String(buddyCount) },
                      stats[1],
                      stats[2],
                    ]
                  : stats
                ).map((stat) => (
                  <HeroStat key={stat.label} {...stat} />
                ))}
              </Box>
            </Stack>
          </Box>
        </Box>

        <Box sx={{ mt: { xs: 3, md: 4 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' },
              gap: 2,
            }}
          >
            <Box
              sx={{
                borderRadius: '10px',
                p: { xs: 2, md: 2.4 },
                background: 'rgba(255,255,255,0.82)',
                boxShadow: '0 24px 50px rgba(110, 74, 36, 0.06)',
              }}
            >
              <SectionIntro
                eyebrow="Needs a reply"
                title="Signals you should not leave hanging"
                description="Keep the page emotionally legible. Show the people asking to get closer, not just another anonymous queue."
              />
              {friendshipsLoading ? (
                <Typography sx={{ mt: 2, color: 'rgba(66,50,28,0.5)', fontSize: 14 }}>
                  Loading requests...
                </Typography>
              ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  gap: 1.3,
                  mt: 2,
                }}
              >
                {pendingIncoming.length > 0
                  ? pendingIncoming.map((f: FriendshipItem) => {
                      const uname = otherUsername(f, user?.username ?? '');
                      const req: BuddyRequestCard = {
                        name: uname.charAt(0).toUpperCase() + uname.slice(1).toLowerCase(),
                        initial: uname.charAt(0).toUpperCase() || '?',
                        color: BUDDY_COLORS[0],
                        buddyType: 'Buddy',
                        kind: 'incoming',
                        subtitle: f.request_message || `${uname} wants to connect.`,
                        badge: f.met_at_event_title ? `Met at ${f.met_at_event_title}` : 'Pending',
                        primaryAction: 'Accept request',
                        secondaryAction: 'Not now',
                      };
                      return (
                        <RequestCard
                          key={f.id}
                          request={req}
                          actionPending={updateFriendRequest.isPending}
                          onAccept={() => handleAcceptRequest(f.met_at_event, uname)}
                          onMessage={() => handleOpenMessage(uname)}
                        />
                      );
                    })
                  : displayPendingIncoming.length > 0
                    ? displayPendingIncoming.map((request) => (
                        <RequestCard key={request.name} request={request} />
                      ))
                    : hasFetchedFriendships ? (
                        <Typography sx={{ color: 'rgba(66,50,28,0.55)', fontSize: 14 }}>
                          No pending requests right now.
                        </Typography>
                      ) : null}
                {pendingOutgoing.length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'rgba(66, 50, 28, 0.5)',
                        mb: 1,
                      }}
                    >
                      Your pending requests
                    </Typography>
                    <Stack direction="row" spacing={1.3} flexWrap="wrap" useFlexGap>
                      {pendingOutgoing.map((f: FriendshipItem) => {
                        const uname = otherUsername(f, user?.username ?? '');
                        const req: BuddyRequestCard = {
                          name: uname.charAt(0).toUpperCase() + uname.slice(1).toLowerCase(),
                          initial: uname.charAt(0).toUpperCase() || '?',
                          color: BUDDY_COLORS[1],
                          buddyType: 'Buddy',
                          kind: 'suggested',
                          subtitle: f.request_message || `Request sent to ${uname}.`,
                          badge: f.met_at_event_title ? `Met at ${f.met_at_event_title}` : 'Pending',
                          primaryAction: 'Withdraw request',
                        };
                        return (
                          <RequestCard
                            key={f.id}
                            request={req}
                            actionPending={updateFriendRequest.isPending}
                            onWithdraw={() =>
                              handleWithdrawRequest(f.met_at_event, uname)
                            }
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                ) : null}
              </Box>
              )}
            </Box>

            <Box
              sx={{
                borderRadius: '10px',
                p: { xs: 2, md: 2.4 },
                background: 'rgba(255,255,255,0.84)',
                boxShadow: '0 24px 50px rgba(110, 74, 36, 0.06)',
              }}
            >
              <SectionIntro
                eyebrow="Circles"
                title="The shape of your social map"
                description="Lean into circular forms here so the information feels relational instead of tabular."
              />
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, minmax(0, 1fr))',
                    sm: 'repeat(3, minmax(0, 1fr))',
                  },
                  gap: 1.2,
                  mt: 2,
                }}
              >
                {displayNetworkGroups.map((group) => (
                  <Box
                    key={group.name}
                    onClick={scrollToCoreNetwork}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && scrollToCoreNetwork()}
                    sx={{
                      borderRadius: '18px',
                      p: 1.35,
                      background: group.active ? '#FFF8F4' : '#F8F4EE',
                      cursor: 'pointer',
                      '&:hover': { background: group.active ? '#FFF0E8' : '#F0EBE3' },
                    }}
                  >
                    <Stack spacing={1.05} alignItems="center" textAlign="center">
                      <Box
                        sx={{
                          width: 72,
                          height: 72,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          background: group.background,
                          boxShadow: group.active
                            ? '0 0 0 8px rgba(216, 90, 48, 0.08)'
                            : 'none',
                          fontFamily: 'Syne, sans-serif',
                          fontSize: 24,
                          fontWeight: 800,
                          color: '#2B2118',
                        }}
                      >
                        {group.icon}
                      </Box>
                      <Typography
                        sx={{
                          fontFamily: 'Syne, sans-serif',
                          fontSize: 19,
                          fontWeight: 800,
                          letterSpacing: '-0.03em',
                          color: '#2B2118',
                        }}
                      >
                        {group.count}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 12.5, fontWeight: 700, color: '#2B2118' }}
                      >
                        {group.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 11.5,
                          lineHeight: 1.45,
                          color: 'rgba(66, 50, 28, 0.62)',
                        }}
                      >
                        {group.caption}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>

        <Box
          ref={coreNetworkRef}
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
            description="Each card should feel like a relationship with context and momentum attached, not a tiny CRM tile."
            action={displayBuddies.length > 0 ? `See all ${displayBuddies.length}` : undefined}
            onActionClick={scrollToCoreNetwork}
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
                onClick={() => setSelectedFilter(filter.label)}
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
            {displayBuddies.length === 0 && hasFetchedFriendships ? (
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
                  Go to events and send buddy requests to people you meet. They’ll show up here once they accept.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/search')}
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
              displayBuddies.map((buddy) => (
                <BuddySpotlightCard
                  key={buddy.name}
                  buddy={buddy}
                  onMessage={() =>
                    handleOpenMessage(buddy.username ?? buddy.name.toLowerCase())
                  }
                  onJoin={(eventId) => navigate(`/events/${eventId}`)}
                />
              ))
            )}
          </Box>
        </Box>

        <Box
          sx={{
            mt: { xs: 3, md: 4 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', xl: '1fr 0.92fr' },
            gap: 2,
          }}
        >
          <Box
            sx={{
              borderRadius: '10px',
              p: { xs: 2, md: 2.4 },
              background: 'rgba(255,255,255,0.84)',
              boxShadow: '0 24px 50px rgba(110, 74, 36, 0.06)',
            }}
          >
            <SectionIntro
              eyebrow="Movement"
              title="The network is not static"
              description="Use the bottom of the page to show living social proof: who is hosting, going, and nudging the next outing into existence."
            />
            <Stack spacing={1.2} sx={{ mt: 2 }}>
              {displayActivity.length === 0 ? (
                <Box sx={{ py: 2, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 14, color: 'rgba(66,50,28,0.6)' }}>
                    No recent activity yet.
                  </Typography>
                  {isAuthenticated && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => navigate('/search')}
                      sx={{ mt: 1, textTransform: 'none', fontWeight: 600, color: '#D85A30' }}
                    >
                      Find events
                    </Button>
                  )}
                </Box>
              ) : (
                displayActivity.map((item, idx) => (
                  <ActivityCard
                    key={
                      item.event?.eventId != null
                        ? `activity-${idx}-${item.event.eventId}-${item.text}`
                        : `activity-${idx}-${item.text}`
                    }
                    item={item}
                  />
                ))
              )}
            </Stack>
          </Box>

          <Stack spacing={2}>
            <Box
              sx={{
                borderRadius: '10px',
                p: { xs: 2, md: 2.4 },
                background: 'linear-gradient(180deg, #FFF5ED 0%, #FFFFFF 100%)',
                boxShadow: '0 24px 50px rgba(216, 90, 48, 0.08)',
              }}
            >
              <SectionIntro
                eyebrow="Quiet sparks"
                title="Suggested people to pull closer"
                description="A few people you almost met—good candidates to send a buddy request from the event you shared."
              />
              <Stack spacing={1.1} sx={{ mt: 2 }}>
                {displaySuggested.map((request, i) => (
                  <RequestCard
                    key={request.name + (displaySuggestedList?.[i]?.username ?? '')}
                    request={request}
                    onMessage={() =>
                      handleOpenMessage(
                        displaySuggestedList?.[i]?.username ??
                          request.name.toLowerCase().replace(/\s+/g, '')
                      )
                    }
                    onSendRequest={
                      displaySuggestedList?.[i]?.event_id
                        ? (eventId) => navigate(`/events/${eventId}`)
                        : undefined
                    }
                    suggestedEventId={displaySuggestedList?.[i]?.event_id}
                    suggestedUsername={displaySuggestedList?.[i]?.username}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
