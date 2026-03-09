/** Shared constants for the events feature. */

/** Map category icon names from the backend to simple emoji fallbacks. */
export const CATEGORY_ICON_MAP: Record<string, string> = {
  music: '🎵',
  utensils: '🍽️',
  moon: '🌙',
  dumbbell: '💪',
  palette: '🎨',
  cpu: '💻',
  'book-open': '📖',
  mountain: '⛰️',
  laugh: '😂',
  users: '👥',
  'party-popper': '🎉',
  'heart-handshake': '🤝',
};

export const TICKET_COLORS = [
  { light2: '#fffad1ff', dark: 'rgb(216, 189, 15)', light: 'rgba(255, 247, 187, 1)' }, // Yellow
  { light2: '#f8d7eaff', dark: '#ef9cc6ff', light: 'rgba(248, 215, 234, 1)' }, // Pink
  { light2: '#f9e3c3ff', dark: '#ed9c61ff', light: 'rgba(250, 227, 195, 1)' }, // Orange
  { light2: '#def7e7ff', dark: '#7ce0a1ff', light: 'rgba(222, 247, 231, 1)' }, // Green
  { light2: '#e8eef5ff', dark: '#9eb9e4ff', light: 'rgba(232, 238, 245, 1)' }, // Blue
  { light2: '#e9e1f1ff', dark: '#c4a4e2ff', light: 'rgba(228, 164, 226, 1)' }, // Purple
  { light2: '#e5eeceff', dark: '#b9d98aff', light: 'rgba(229, 238, 206, 1)' }, // Lime
];
