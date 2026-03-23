export type BuddyCard = {
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
  username?: string;
  met_at_event_id?: number | null;
};

export type BuddyRequestCard = {
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

import type { NetworkActivityAttendee } from '@/features/events/api';

export type ActivityItem = {
  initial: string;
  /** Accent from the event category (activity group theme). */
  category_color: string;
  text: string;
  time: string;
  cta?: string;
  /** Event category slug from API; used to group network activity. */
  eventCategorySlug?: string | null;
  /** When multiple people share the same event + action, listed in sentence order. */
  goerNames?: readonly string[];
  /** IDs of people represented by this merged activity item. */
  goerIds?: readonly number[];
  /** Friend attendees from API (going / hosting / servicing). */
  relevantAttendees?: readonly NetworkActivityAttendee[];
  actionType?: 'hosting' | 'going' | 'interested' | 'servicing';
  event?: {
    icon: string;
    title: string;
    subtitle: string;
    eventId?: number;
  };
};

export type NetworkActivityGroup = {
  heading: string;
  slugKey: string;
  items: readonly ActivityItem[];
};

export type HeroStatItem = {
  value: string;
  label: string;
  detail: string;
  accent: string;
  color: string;
};

export type NetworkFilter = {
  label: string;
  active: boolean;
};

export type NetworkGroup = {
  name: string;
  icon: string;
  background: string;
  active: boolean;
  count: string;
  caption: string;
};

export type HeroMoment = {
  name: string;
  initial: string;
  color: string;
  text: string;
};

export type CoreNetworkItem = {
  buddy: BuddyCard;
  messageTarget: string;
};

export type SuggestedRequestItem = {
  key: string;
  request: BuddyRequestCard;
  messageTarget: string;
  suggestedEventId?: number | null;
  suggestedUsername?: string;
};

export type PendingRequestItem = {
  key: string | number;
  request: BuddyRequestCard;
  username: string;
  eventId: number | null;
};
