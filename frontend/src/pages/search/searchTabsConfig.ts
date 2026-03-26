import { CalendarClock, Coins, Flame, MonitorPlay, Sparkles } from 'lucide-react';

export const exploreTabs = [
  {
    id: 'trending',
    label: 'Trending',
    Icon: Flame,
    accent: '#D85A30',
    wash: '#FAECE7',
  },
  {
    id: 'upcoming',
    label: 'Upcoming',
    Icon: CalendarClock,
    accent: '#2C7BE5',
    wash: '#E6F1FB',
  },
  {
    id: 'free',
    label: 'Free',
    Icon: Sparkles,
    accent: '#2F8F4E',
    wash: '#EAF3DE',
  },
  {
    id: 'opportunities',
    label: 'Opportunities',
    Icon: Coins,
    accent: '#A258C6',
    wash: '#F3E7FB',
  },
  {
    id: 'online',
    label: 'Online',
    Icon: MonitorPlay,
    accent: '#C78319',
    wash: '#FAEEDA',
  },
] as const;

export type ExploreTabId = (typeof exploreTabs)[number]['id'];

const tabAliases: Record<string, ExploreTabId> = {
  all: 'trending',
  trending: 'trending',
  upcoming: 'upcoming',
  'tonight-weekend': 'upcoming',
  free: 'free',
  'free-cheap': 'free',
  opportunities: 'opportunities',
  'chip-in': 'opportunities',
  online: 'online',
  'my-network': 'trending',
};

export function normalizeTab(value: string | null): ExploreTabId {
  if (!value) return 'trending';
  return tabAliases[value] || 'trending';
}
