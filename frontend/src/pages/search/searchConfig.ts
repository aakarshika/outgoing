import type {
  FormatFilterId,
  RoleFilterId,
  SearchTabId,
  WhenFilterId,
} from './searchTypes';

export const TABS: Array<{
  id: SearchTabId;
  label: string;
  note: string;
  icon: string;
  badge?: number;
}> = [
  // {
  //   id: 'all',
  //   label: 'All Events',
  //   note: 'Everything, with no default filters applied.',
  //   icon: '✦',
  // },
  {
    id: 'tonight-weekend',
    label: 'Tonight',
    note: 'Time-sensitive plans first.',
    icon: '🌙',
  },
  {
    id: 'trending',
    label: 'Trending',
    note: 'Events buzzing in the city right now.',
    icon: '🔥',
  },
  {
    id: 'free-cheap',
    label: 'Free & Cheap',
    note: 'Low-cost events and chip-in gigs.',
    icon: '🎉',
  },
  {
    id: 'chip-in',
    label: 'Chip In',
    note: 'Contributor opportunities only.',
    icon: '🤝',
  },
  {
    id: 'online',
    label: 'Online',
    note: 'Digital events, no venue needed.',
    icon: '💻',
  },
  {
    id: 'my-network',
    label: 'My Network',
    note: 'Buddy and known-host discovery.',
    icon: '👥',
  },
];

export const WHEN_OPTIONS: Array<{ id: WhenFilterId; label: string }> = [
  { id: 'tonight', label: 'Tonight' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'this-weekend', label: 'This weekend' },
  { id: 'this-week', label: 'This week' },
  { id: 'this-month', label: 'This month' },
  { id: 'next-week', label: 'Next week' },
];

export const FORMAT_OPTIONS: Array<{ id: FormatFilterId; label: string }> = [
  { id: 'in-person', label: 'In person' },
  { id: 'online', label: 'Online' },
  { id: 'free', label: 'Free' },
  { id: 'under-200', label: 'Under Rs 200' },
  { id: 'under-500', label: 'Under Rs 500' },
  { id: 'discount-available', label: 'Discount available' },
];

export const ROLE_OPTIONS: Array<{ id: RoleFilterId; label: string }> = [
  { id: 'dj_music', label: 'DJ / Music' },
  { id: 'food_catering', label: 'Food & Catering' },
  { id: 'photography', label: 'Photography' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'venue', label: 'Venue' },
  { id: 'staffing', label: 'Staffing' },
  { id: 'other', label: 'Other' },
];
