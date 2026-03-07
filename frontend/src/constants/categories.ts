export const VENDOR_CATEGORIES = [
  {
    group: 'Music & Entertainment',
    items: [
      { id: 'dj', label: 'DJ' },
      { id: 'live_band', label: 'Live Band' },
      { id: 'musician', label: 'Solo Musician' },
      { id: 'mc_host', label: 'MC / Host' },
    ],
  },
  {
    group: 'Food & Beverage',
    items: [
      { id: 'catering', label: 'Catering & Food' },
      { id: 'bartending', label: 'Bartending & Mixology' },
      { id: 'food_truck', label: 'Food Truck' },
      { id: 'baking', label: 'Baking & Desserts' },
    ],
  },
  {
    group: 'Photography & Media',
    items: [
      { id: 'photography', label: 'Photography' },
      { id: 'videography', label: 'Videography' },
      { id: 'photo_booth', label: 'Photo Booth' },
    ],
  },
  {
    group: 'Venue & Decor',
    items: [
      { id: 'venue_rental', label: 'Venue Rental' },
      { id: 'decor_floristry', label: 'Decor & Floristry' },
      { id: 'lighting_audio', label: 'Lighting & Audio/Visual' },
      { id: 'equipment_rental', label: 'Equipment & Furniture Rental' },
    ],
  },
  {
    group: 'Event Logistics',
    items: [
      { id: 'event_planning', label: 'Event Planning & Coordination' },
      { id: 'staffing', label: 'Event Staffing / Security' },
      { id: 'transportation', label: 'Transportation & Valet' },
    ],
  },
  {
    group: 'Other',
    items: [{ id: 'other', label: 'Other/Miscellaneous' }],
  },
];

export function getCategoryLabel(id: string): string {
  for (const group of VENDOR_CATEGORIES) {
    const item = group.items.find((i) => i.id === id);
    if (item) return item.label;
  }
  return id;
}
