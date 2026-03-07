export const NEAR_YOU_ENABLED_KEY = 'outgoing.nearYou.enabled';
export const NEAR_YOU_COORDS_KEY = 'outgoing.nearYou.coords';

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
