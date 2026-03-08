export type SectionId =
  | 'hero'
  | 'featured_carousel'
  | 'upcoming_rsvps'
  | 'trending'
  | 'nearby'
  | 'this_week'
  | 'online'
  | 'iconic_hosts'
  | 'make_your_event_happen'
  | 'recommended'
  | 'last_week_memories'
  | 'create_event_cta'
  | 'sign_up_cta';

export const SIGNED_IN_SECTIONS: SectionId[] = [
  'hero',
  'featured_carousel',
  'upcoming_rsvps',
  'trending',
  'nearby',
  'online',
  'this_week',
  'iconic_hosts',
  'make_your_event_happen',
  'recommended',
  'last_week_memories',
  'create_event_cta',
];

export const SIGNED_OUT_SECTIONS: SectionId[] = [
  'hero',
  'featured_carousel',
  'trending',
  'nearby',
  'online',
  'this_week',
  'iconic_hosts',
  'make_your_event_happen',
  'sign_up_cta',
];
