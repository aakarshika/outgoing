export const NEAR_YOU_ENABLED_KEY = 'outgoing.nearYou.enabled';
export const NEAR_YOU_COORDS_KEY = 'outgoing.nearYou.coords';
export const NEAR_YOU_RADIUS_MILES_KEY = 'outgoing.nearYou.radiusMiles';

const DEFAULT_RADIUS_MILES = 25;

export function getNearYouCoords(): { lat: number; lng: number } | null {
  const enabled = localStorage.getItem(NEAR_YOU_ENABLED_KEY) === 'true';
  if (!enabled) return null;

  const stored = localStorage.getItem(NEAR_YOU_COORDS_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function getNearYouRadiusMiles(): number {
  const stored = localStorage.getItem(NEAR_YOU_RADIUS_MILES_KEY);
  if (stored == null) return DEFAULT_RADIUS_MILES;
  const n = parseInt(stored, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(500, Math.max(1, n)) : DEFAULT_RADIUS_MILES;
}

export function setNearYouRadiusMiles(miles: number): void {
  const value = Math.min(500, Math.max(1, Math.round(miles)));
  localStorage.setItem(NEAR_YOU_RADIUS_MILES_KEY, String(value));
}
