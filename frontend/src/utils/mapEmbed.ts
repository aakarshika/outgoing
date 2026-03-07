const DEFAULT_ZOOM = 15;
const MAP_DELTA = 0.0075;

function clampLatitude(value: number) {
  return Math.max(-85, Math.min(85, value));
}

function clampLongitude(value: number) {
  return Math.max(-180, Math.min(180, value));
}

function encodeQuery(query: string) {
  return encodeURIComponent(query.trim());
}

export function buildMapQuery(locationName: string, locationAddress?: string | null) {
  const parts = [locationName, locationAddress].filter(
    (part): part is string => !!part && part.trim().length > 0,
  );
  return parts.join(', ');
}

export function buildOsmEmbedUrl(latitude: number, longitude: number) {
  const lat = clampLatitude(latitude);
  const lon = clampLongitude(longitude);

  const left = clampLongitude(lon - MAP_DELTA);
  const right = clampLongitude(lon + MAP_DELTA);
  const top = clampLatitude(lat + MAP_DELTA);
  const bottom = clampLatitude(lat - MAP_DELTA);

  const bbox = `${left},${bottom},${right},${top}`;
  const marker = `${lat},${lon}`;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(marker)}`;
}

export function buildGoogleEmbedUrl(query: string) {
  return `https://maps.google.com/maps?q=${encodeQuery(query)}&z=15&output=embed`;
}

export function buildOsmExternalUrl(latitude: number, longitude: number) {
  const lat = clampLatitude(latitude);
  const lon = clampLongitude(longitude);
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${DEFAULT_ZOOM}/${lat}/${lon}`;
}

export function buildGoogleExternalUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeQuery(query)}`;
}
