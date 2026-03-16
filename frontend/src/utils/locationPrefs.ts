export const NEAR_YOU_ENABLED_KEY = 'outgoing.nearYou.enabled';
export const NEAR_YOU_COORDS_KEY = 'outgoing.nearYou.coords';
export const NEAR_YOU_RADIUS_MILES_KEY = 'outgoing.nearYou.radiusMiles';
export const SEARCH_LOCATION_LABEL_KEY = 'outgoing.search.locationLabel';
export const SEARCH_LOCATION_CITY_KEY = 'outgoing.search.locationCity';
export const SEARCH_LOCATION_COORDS_KEY = 'outgoing.search.locationCoords';
export const LOCATION_PREFERENCES_CHANGED_EVENT = 'outgoing:locationPreferencesChanged';

const DEFAULT_RADIUS_MILES = 25;

export type StoredSearchLocation = {
  label: string;
  city: string;
  coords: { lat: number; lng: number } | null;
};

function clampRadiusMiles(miles: number) {
  return Math.min(500, Math.max(1, Math.round(miles)));
}

function dispatchLocationPreferencesChanged() {
  window.dispatchEvent(new Event(LOCATION_PREFERENCES_CHANGED_EVENT));
}

function parseStoredCoords(raw: string | null): { lat: number; lng: number } | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { lat?: number; lng?: number };
    if (
      typeof parsed?.lat === 'number' &&
      Number.isFinite(parsed.lat) &&
      typeof parsed?.lng === 'number' &&
      Number.isFinite(parsed.lng)
    ) {
      return parsed as { lat: number; lng: number };
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeCoords(
  coords: { lat: number | string; lng: number | string } | null | undefined,
) {
  if (!coords) return null;

  const lat = Number(coords.lat);
  const lng = Number(coords.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

export function inferCityFromLocationLabel(label: string): string {
  const parts = label
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return '';

  const textParts = parts.filter((part) => /[A-Za-z]/.test(part));
  const nonNumericParts = textParts.filter((part) => !/\d/.test(part));
  const candidates = nonNumericParts.length > 0 ? nonNumericParts : textParts;

  if (candidates.length === 0) return '';
  if (parts[0] && /\d/.test(parts[0]) && candidates.length > 1) {
    return candidates[1];
  }

  return candidates[0];
}

export function getNearYouCoords(): { lat: number; lng: number } | null {
  const enabled = localStorage.getItem(NEAR_YOU_ENABLED_KEY) === 'true';
  if (!enabled) return null;

  const stored = localStorage.getItem(NEAR_YOU_COORDS_KEY);
  return parseStoredCoords(stored);
}

export function getNearYouRadiusMiles(): number {
  const stored = localStorage.getItem(NEAR_YOU_RADIUS_MILES_KEY);
  if (stored == null) return DEFAULT_RADIUS_MILES;
  const n = parseInt(stored, 10);
  return Number.isFinite(n) && n > 0 ? clampRadiusMiles(n) : DEFAULT_RADIUS_MILES;
}

export function setNearYouRadiusMiles(miles: number): void {
  const value = clampRadiusMiles(miles);
  localStorage.setItem(NEAR_YOU_RADIUS_MILES_KEY, String(value));
  dispatchLocationPreferencesChanged();
}

export function getStoredSearchLocation(): StoredSearchLocation | null {
  const label = (localStorage.getItem(SEARCH_LOCATION_LABEL_KEY) || '').trim();
  const city = (localStorage.getItem(SEARCH_LOCATION_CITY_KEY) || '').trim();
  const coords = parseStoredCoords(localStorage.getItem(SEARCH_LOCATION_COORDS_KEY));

  if (!label && !city && !coords) return null;

  return {
    label,
    city,
    coords,
  };
}

export function setStoredSearchLocation(location: {
  label: string;
  city?: string;
  coords?: { lat: number | string; lng: number | string } | null;
}): void {
  const label = location.label.trim();
  const city = (location.city || '').trim();
  const coords = normalizeCoords(location.coords);

  if (label) {
    localStorage.setItem(SEARCH_LOCATION_LABEL_KEY, label);
  } else {
    localStorage.removeItem(SEARCH_LOCATION_LABEL_KEY);
  }

  if (city) {
    localStorage.setItem(SEARCH_LOCATION_CITY_KEY, city);
  } else {
    localStorage.removeItem(SEARCH_LOCATION_CITY_KEY);
  }

  if (coords) {
    localStorage.setItem(SEARCH_LOCATION_COORDS_KEY, JSON.stringify(coords));
  } else {
    localStorage.removeItem(SEARCH_LOCATION_COORDS_KEY);
  }

  dispatchLocationPreferencesChanged();
}

export function clearStoredSearchLocation(): void {
  localStorage.removeItem(SEARCH_LOCATION_LABEL_KEY);
  localStorage.removeItem(SEARCH_LOCATION_CITY_KEY);
  localStorage.removeItem(SEARCH_LOCATION_COORDS_KEY);
  dispatchLocationPreferencesChanged();
}
