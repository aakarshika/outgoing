export type CategoryItem = {
  id: string;
  label: string;
  icon: string;
  iconBg: string;
  accent: string;
};

export const VENDOR_CATEGORIES: {
  group: string;
  items: CategoryItem[];
}[] = [
  {
    group: 'Music & Entertainment',
    items: [
      { id: 'dj', label: 'DJ', icon: '🎧', iconBg: '#EAF3DE', accent: '#1D9E75' },
      { id: 'live_band', label: 'Live Band', icon: '🎸', iconBg: '#EAF3DE', accent: '#1D9E75' },
      { id: 'musician', label: 'Solo Musician', icon: '🎵', iconBg: '#EAF3DE', accent: '#1D9E75' },
      { id: 'mc_host', label: 'MC / Host', icon: '🎙️', iconBg: '#EAF3DE', accent: '#1D9E75' },
    ],
  },
  {
    group: 'Food & Beverage',
    items: [
      { id: 'catering', label: 'Catering & Food', icon: '🍽️', iconBg: '#FAEEDA', accent: '#EF9F27' },
      { id: 'bartending', label: 'Bartending & Mixology', icon: '🍸', iconBg: '#FAEEDA', accent: '#EF9F27' },
      { id: 'food_truck', label: 'Food Truck', icon: '🚚', iconBg: '#FAEEDA', accent: '#EF9F27' },
      { id: 'baking', label: 'Baking & Desserts', icon: '🧁', iconBg: '#FAEEDA', accent: '#EF9F27' },
    ],
  },
  {
    group: 'Photography & Media',
    items: [
      { id: 'photography', label: 'Photography', icon: '📷', iconBg: '#E6F1FB', accent: '#378ADD' },
      { id: 'videography', label: 'Videography', icon: '🎥', iconBg: '#E6F1FB', accent: '#378ADD' },
      { id: 'photo_booth', label: 'Photo Booth', icon: '🖼️', iconBg: '#E6F1FB', accent: '#378ADD' },
    ],
  },
  {
    group: 'Venue & Decor',
    items: [
      { id: 'venue_rental', label: 'Venue Rental', icon: '🏛️', iconBg: '#FAEEDA', accent: '#C47E13' },
      { id: 'decor_floristry', label: 'Decor & Floristry', icon: '💐', iconBg: '#FAEEDA', accent: '#C47E13' },
      { id: 'lighting_audio', label: 'Lighting & Audio/Visual', icon: '🔊', iconBg: '#FAEEDA', accent: '#C47E13' },
      { id: 'equipment_rental', label: 'Equipment & Furniture Rental', icon: '🪑', iconBg: '#FAEEDA', accent: '#C47E13' },
    ],
  },
  {
    group: 'Event Logistics',
    items: [
      { id: 'event_planning', label: 'Event Planning & Coordination', icon: '📋', iconBg: '#EEEDFE', accent: '#534AB7' },
      { id: 'staffing', label: 'Event Staffing / Security', icon: '🛡️', iconBg: '#EEEDFE', accent: '#534AB7' },
      { id: 'transportation', label: 'Transportation & Valet', icon: '🚗', iconBg: '#EEEDFE', accent: '#534AB7' },
    ],
  },
  {
    group: 'Other',
    items: [
      { id: 'other', label: 'Other/Miscellaneous', icon: '🧩', iconBg: '#F1EFE8', accent: '#534AB7' },
    ],
  },
];

const DEFAULT_VISUALS = { icon: '🧩', iconBg: '#F1EFE8', accent: '#534AB7' };

const _categoryVisualsMap = new Map<string, { icon: string; iconBg: string; accent: string }>();
for (const group of VENDOR_CATEGORIES) {
  for (const item of group.items) {
    _categoryVisualsMap.set(item.id, { icon: item.icon, iconBg: item.iconBg, accent: item.accent });
  }
}

export function getCategoryVisuals(categoryId: string): {
  icon: string;
  iconBg: string;
  accent: string;
} {
  return _categoryVisualsMap.get(categoryId) ?? DEFAULT_VISUALS;
}

export function getCategoryLabel(id: string): string {
  for (const group of VENDOR_CATEGORIES) {
    const item = group.items.find((i) => i.id === id);
    if (item) return item.label;
  }
  return id;
}

export const allVendorCategoryOptions = VENDOR_CATEGORIES.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    group: group.group || '',
  })),
);
