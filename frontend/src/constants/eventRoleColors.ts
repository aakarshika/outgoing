/**
 * Shared palette for hosting / servicing / attending (managing UI, soul track, dots).
 * Keep in sync with product semantics: “good times” ≈ attending, hustle ≈ servicing, thrown ≈ hosting.
 */
export const EVENT_ROLE_COLORS = {
  hosting: {
    bg: '#E7EDFF',
    color: '#2D4EDA',
    dot: 'rgb(105, 37, 213)',
  },
  servicing: {
    bg: '#E1F5EE',
    color: '#0F6E56',
    dot: 'rgb(0, 119, 99)',
  },
  attending: {
    bg: '#FFF7CC',
    color: '#8A6A00',
    dot: 'rgb(247, 156, 21)',
  },
} as const;
