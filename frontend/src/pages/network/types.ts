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

export type ActivityItem = {
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
