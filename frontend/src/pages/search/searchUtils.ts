import type { EventListItem } from '@/types/events';
import type { VendorOpportunity } from '@/types/needs';

import type {
  FormatFilterId,
  RoleFilterId,
  SearchTabId,
  WhenFilterId,
} from './searchTypes';

export type SearchParamsSetter = (
  value: URLSearchParams,
  options?: { replace?: boolean },
) => void;

export function readList(searchParams: URLSearchParams, key: string) {
  return (searchParams.get(key) || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function updateListParam(
  searchParams: URLSearchParams,
  key: string,
  values: string[],
  setSearchParams: SearchParamsSetter,
) {
  const next = new URLSearchParams(searchParams);
  if (values.length > 0) {
    next.set(key, values.join(','));
  } else {
    next.delete(key);
  }
  next.delete('page');
  setSearchParams(next, { replace: true });
}

export function toggleListValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function getLowestTicketPrice(event: EventListItem) {
  const prices = [
    ...(event.ticket_tiers?.map((tier) => Number(tier.price)) || []),
    Number(event.ticket_price_standard),
    Number(event.ticket_price_flexible),
  ].filter((value) => Number.isFinite(value));

  return prices.length > 0 ? Math.min(...prices) : 0;
}

export function isOnlineEvent(event: EventListItem) {
  return (event.location_address || '').trim().toLowerCase() === 'online event';
}

export function formatEventDayLabel(dateText: string) {
  const date = new Date(dateText);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const diffDays = Math.round((target - today) / 86400000);

  if (diffDays === 0) return 'Tonight';
  if (diffDays === 1) return 'Tomorrow';
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

export function formatEventTimeLabel(dateText: string) {
  return new Date(dateText).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getCountdownLabel(dateText: string) {
  const ms = new Date(dateText).getTime() - Date.now();
  if (ms <= 0 || ms > 3 * 60 * 60 * 1000) return null;
  const hours = Math.max(1, Math.floor(ms / (60 * 60 * 1000)));
  return `Starting in ${hours}h`;
}

export function isInWhenWindow(
  eventStart: string,
  selectedWhen: WhenFilterId[],
  selectedDate: string,
) {
  if (!selectedDate && selectedWhen.length === 0) return true;

  const start = new Date(eventStart);
  const now = new Date();

  if (selectedDate) {
    const targetDate = new Date(`${selectedDate}T00:00:00`);
    return (
      start.getFullYear() === targetDate.getFullYear() &&
      start.getMonth() === targetDate.getMonth() &&
      start.getDate() === targetDate.getDate()
    );
  }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const startOfDayAfterTomorrow = new Date(startOfTomorrow);
  startOfDayAfterTomorrow.setDate(startOfDayAfterTomorrow.getDate() + 1);

  const startOfWeek = new Date(startOfToday);
  const weekday = startOfWeek.getDay();
  const mondayOffset = (weekday + 6) % 7;
  startOfWeek.setDate(startOfWeek.getDate() - mondayOffset);

  const weekendStart = new Date(startOfWeek);
  weekendStart.setDate(weekendStart.getDate() + 5);
  const nextMonday = new Date(startOfWeek);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const followingMonday = new Date(startOfWeek);
  followingMonday.setDate(followingMonday.getDate() + 14);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return selectedWhen.some((filter) => {
    if (filter === 'tonight') {
      return start >= startOfToday && start < startOfTomorrow;
    }
    if (filter === 'tomorrow') {
      return start >= startOfTomorrow && start < startOfDayAfterTomorrow;
    }
    if (filter === 'this-weekend') {
      return start >= weekendStart && start < nextMonday;
    }
    if (filter === 'this-week') {
      return start >= now && start < nextMonday;
    }
    if (filter === 'this-month') {
      return start >= now && start < startOfNextMonth;
    }
    if (filter === 'next-week') {
      return start >= nextMonday && start < followingMonday;
    }
    return true;
  });
}

export function getRoleGroup(opportunity: VendorOpportunity): RoleFilterId {
  const text = `${opportunity.category} ${opportunity.need_title}`.toLowerCase();

  if (text.includes('dj') || text.includes('music') || text.includes('sound')) {
    return 'dj_music';
  }
  if (text.includes('food') || text.includes('cater') || text.includes('cook')) {
    return 'food_catering';
  }
  if (text.includes('photo') || text.includes('video') || text.includes('camera')) {
    return 'photography';
  }
  if (
    text.includes('equipment') ||
    text.includes('projector') ||
    text.includes('speaker') ||
    text.includes('chair') ||
    text.includes('table')
  ) {
    return 'equipment';
  }
  if (
    text.includes('venue') ||
    text.includes('space') ||
    text.includes('studio') ||
    text.includes('hall')
  ) {
    return 'venue';
  }
  if (
    text.includes('staff') ||
    text.includes('crew') ||
    text.includes('usher') ||
    text.includes('volunteer')
  ) {
    return 'staffing';
  }
  return 'other';
}

export function getEffectiveWhenFilters(
  tab: SearchTabId,
  selectedWhen: WhenFilterId[],
  selectedDate: string,
): WhenFilterId[] {
  if (selectedWhen.length > 0 || selectedDate) return selectedWhen;
  if (tab === 'tonight-weekend') return ['tonight'];
  return [];
}

export function getEffectiveFormatFilters(
  tab: SearchTabId,
  selectedFormats: FormatFilterId[],
): FormatFilterId[] {
  if (selectedFormats.length > 0) return selectedFormats;
  if (tab === 'online') return ['online'];
  if (tab === 'free-cheap') return ['under-500'];
  return [];
}

export function getFeedSort(tab: SearchTabId) {
  if (tab === 'trending') return 'trending';
  if (tab === 'free-cheap') return 'popular';
  return 'newest';
}

function getFilterDateRange(filter: WhenFilterId) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const startOfDayAfterTomorrow = new Date(startOfTomorrow);
  startOfDayAfterTomorrow.setDate(startOfDayAfterTomorrow.getDate() + 1);

  const startOfWeek = new Date(startOfToday);
  const weekday = startOfWeek.getDay();
  const mondayOffset = (weekday + 6) % 7;
  startOfWeek.setDate(startOfWeek.getDate() - mondayOffset);

  const weekendStart = new Date(startOfWeek);
  weekendStart.setDate(weekendStart.getDate() + 5);
  const nextMonday = new Date(startOfWeek);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const followingMonday = new Date(startOfWeek);
  followingMonday.setDate(followingMonday.getDate() + 14);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  if (filter === 'tonight') {
    return { start: now, end: startOfTomorrow };
  }
  if (filter === 'tomorrow') {
    return { start: startOfTomorrow, end: startOfDayAfterTomorrow };
  }
  if (filter === 'this-weekend') {
    return { start: weekendStart, end: nextMonday };
  }
  if (filter === 'this-week') {
    return { start: now, end: nextMonday };
  }
  if (filter === 'this-month') {
    return { start: now, end: startOfNextMonth };
  }
  return { start: nextMonday, end: followingMonday };
}

export function getFeedTimeRange(selectedWhen: WhenFilterId[], selectedDate: string) {
  if (selectedDate) {
    const start = new Date(`${selectedDate}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return {
      start_time_gte: start.toISOString(),
      start_time_lte: end.toISOString(),
    };
  }

  if (selectedWhen.length === 0) return null;

  const ranges = selectedWhen.map(getFilterDateRange);
  const start = new Date(Math.min(...ranges.map((range) => range.start.getTime())));
  const end = new Date(Math.max(...ranges.map((range) => range.end.getTime())));
  return {
    start_time_gte: start.toISOString(),
    start_time_lte: end.toISOString(),
  };
}

export function filterEvents({
  events,
  selectedCategories,
  effectiveWhen,
  selectedDate,
  effectiveFormats,
  tab,
}: {
  events: EventListItem[];
  selectedCategories: string[];
  effectiveWhen: WhenFilterId[];
  selectedDate: string;
  effectiveFormats: FormatFilterId[];
  tab: SearchTabId;
}) {
  const filtered = events.filter((event) => {
    if (tab === 'tonight-weekend' && event.lifecycle_state === 'live') {
      return true;
    }

    if (selectedCategories.length > 0) {
      if (!event.category?.slug || !selectedCategories.includes(event.category.slug)) {
        return false;
      }
    }

    if (!isInWhenWindow(event.start_time, effectiveWhen, selectedDate)) return false;

    const online = isOnlineEvent(event);
    const price = getLowestTicketPrice(event);

    for (const format of effectiveFormats) {
      if (format === 'in-person' && online) return false;
      if (format === 'online' && !online) return false;
      if (format === 'free' && price > 0) return false;
      if (format === 'under-200' && price > 200) return false;
      if (format === 'under-500' && price > 500) return false;
    }

    if (
      tab === 'free-cheap' &&
      price > 500 &&
      !effectiveFormats.includes('discount-available')
    ) {
      return false;
    }

    return true;
  });

  return [...filtered].sort((left, right) => {
    if (tab === 'trending') {
      return (
        right.ticket_count +
        right.interest_count -
        (left.ticket_count + left.interest_count)
      );
    }
    if (tab === 'free-cheap') {
      return getLowestTicketPrice(left) - getLowestTicketPrice(right);
    }
    return new Date(left.start_time).getTime() - new Date(right.start_time).getTime();
  });
}

export function filterOpportunities({
  opportunities,
  search,
  effectiveWhen,
  selectedDate,
  selectedRoles,
  effectiveFormats,
}: {
  opportunities: VendorOpportunity[];
  search: string;
  effectiveWhen: WhenFilterId[];
  selectedDate: string;
  selectedRoles: RoleFilterId[];
  effectiveFormats: FormatFilterId[];
}) {
  return opportunities.filter((opportunity) => {
    if (search) {
      const haystack = [
        opportunity.need_title,
        opportunity.need_description,
        opportunity.event_title,
        opportunity.event_location_name,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }

    if (!isInWhenWindow(opportunity.event_start_time, effectiveWhen, selectedDate)) {
      return false;
    }

    if (
      selectedRoles.length > 0 &&
      !selectedRoles.includes(getRoleGroup(opportunity))
    ) {
      return false;
    }

    const online =
      opportunity.event_location_name.trim().toLowerCase() === 'online event';
    for (const format of effectiveFormats) {
      if (format === 'in-person' && online) return false;
      if (format === 'online' && !online) return false;
    }
    return true;
  });
}

export function buildApplySearchParams(
  searchParams: URLSearchParams,
  searchDraft: string,
  locationDraft: string,
) {
  const next = normalizeSearchPageParams(searchParams);
  if (searchDraft.trim()) next.set('search', searchDraft.trim());
  else next.delete('search');

  if (locationDraft.trim()) {
    next.set('location', locationDraft.trim());
  } else {
    next.delete('location');
    next.delete('lat');
    next.delete('lng');
    next.delete('radius_miles');
  }

  next.delete('page');
  return next;
}

export function normalizeSearchPageParams(searchParams: URLSearchParams) {
  const next = new URLSearchParams();

  for (const [key, value] of searchParams.entries()) {
    if (key.includes('/search?')) {
      const nestedKey = key.slice(key.lastIndexOf('?') + 1);

      if (nestedKey.includes('=')) {
        const nestedParams = new URLSearchParams(nestedKey);
        for (const [nestedParamKey, nestedParamValue] of nestedParams.entries()) {
          if (nestedParamValue) {
            next.set(nestedParamKey, nestedParamValue);
          }
        }
      } else if (nestedKey) {
        next.set(nestedKey, value);
      }

      continue;
    }

    if (value.includes('/search?')) {
      const nestedParams = new URLSearchParams(value.slice(value.lastIndexOf('?') + 1));
      const nestedValue = nestedParams.get(key);
      if (nestedValue) {
        next.set(key, nestedValue);
        continue;
      }
    }

    next.set(key, value);
  }

  return next;
}

export function buildLocationSearchParams(
  searchParams: URLSearchParams,
  options: {
    location: string;
    lat?: number | null;
    lng?: number | null;
  },
) {
  const next = normalizeSearchPageParams(searchParams);
  const trimmedLocation = options.location.trim();

  if (!trimmedLocation) {
    next.delete('location');
    next.delete('lat');
    next.delete('lng');
    next.delete('radius_miles');
    next.delete('page');
    return next;
  }

  next.set('location', trimmedLocation);

  if (
    typeof options.lat === 'number' &&
    Number.isFinite(options.lat) &&
    typeof options.lng === 'number' &&
    Number.isFinite(options.lng)
  ) {
    next.set('lat', String(options.lat));
    next.set('lng', String(options.lng));
  } else {
    next.delete('lat');
    next.delete('lng');
    next.delete('radius_miles');
  }

  next.delete('page');
  return next;
}

export function buildTabSearchParams(
  searchParams: URLSearchParams,
  nextTab: SearchTabId,
) {
  const next = new URLSearchParams(searchParams);

  if (nextTab === 'all') {
    next.set('tab', nextTab);
    next.delete('search');
    next.delete('when');
    next.delete('date');
    next.delete('categories');
    next.delete('formats');
    next.delete('roles');
    next.delete('page');
    return next;
  }

  next.set('tab', nextTab);
  next.delete('when');
  next.delete('date');

  if (nextTab === 'chip-in') {
    next.delete('formats');
  }
  if (nextTab === 'my-network') {
    next.delete('formats');
    next.delete('categories');
    next.delete('roles');
  }
  if (nextTab !== 'chip-in') {
    next.delete('roles');
  }

  return next;
}

export function buildClearFiltersSearchParams(searchParams: URLSearchParams) {
  const next = new URLSearchParams(searchParams);
  next.delete('when');
  next.delete('date');
  next.delete('categories');
  next.delete('formats');
  next.delete('roles');
  next.delete('page');
  return next;
}

export function buildDateSearchParams(searchParams: URLSearchParams, date: string) {
  const next = new URLSearchParams(searchParams);
  if (date) {
    next.set('date', date);
  } else {
    next.delete('date');
  }
  next.delete('page');
  return next;
}

export function getSectionCount(
  tab: SearchTabId,
  filteredEventsCount: number,
  filteredOpportunitiesCount: number,
) {
  if (tab === 'chip-in') return filteredOpportunitiesCount;
  if (tab === 'free-cheap') return filteredEventsCount + filteredOpportunitiesCount;
  if (tab === 'my-network') return 0;
  return filteredEventsCount;
}
