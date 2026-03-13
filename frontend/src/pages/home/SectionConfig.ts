export type SectionId =
  | 'hero'
  | 'featured_carousel'
  | 'upcoming_rsvps'
  | 'trending'
  | 'nearby'
  | 'trending_highlights'
  | 'this_week'
  | 'online'
  | 'highlights_strip'
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
  'trending_highlights',
  'online',
  'highlights_strip',
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
  'trending_highlights',
  'online',
  'highlights_strip',
  'this_week',
  'iconic_hosts',
  'make_your_event_happen',
  'sign_up_cta',
];
