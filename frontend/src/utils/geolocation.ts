type Coordinates = {
  latitude: number;
  longitude: number;
};

type ReverseGeocodeResult = {
  displayAddress: string;
  venueName: string;
};

const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

function isLocalhost() {
  return LOCALHOST_HOSTNAMES.has(window.location.hostname);
}

export function canUseBrowserGeolocation() {
  return (
    typeof window !== 'undefined' &&
    'geolocation' in navigator &&
    (window.isSecureContext || isLocalhost())
  );
}

export function getCurrentCoordinates(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!canUseBrowserGeolocation()) {
      reject(
        new Error(
          'Geolocation requires HTTPS in production. localhost works during development.',
        ),
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      },
    );
  });
}

export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
    );
    if (!response.ok) return null;

    const data = await response.json();
    const address = data?.address ?? {};
    const venueName =
      data?.name ||
      address?.amenity ||
      address?.building ||
      address?.shop ||
      address?.tourism ||
      address?.road ||
      'Current Location';

    return {
      displayAddress: data?.display_name || '',
      venueName,
    };
  } catch {
    return null;
  }
}

export type LocationSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
};

export async function searchLocation(query: string): Promise<LocationSuggestion[]> {
  if (!query || query.length < 3) return [];

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query,
      )}&limit=5&addressdetails=1`,
    );
    if (!response.ok) return [];

    const data = await response.json();
    return data as LocationSuggestion[];
  } catch (error) {
    console.error('Error searching location:', error);
    return [];
  }
}
