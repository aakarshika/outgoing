/** Round-trip encode `thread_key` for URL segments (base64url, UTF-8). */

export function buildUserThreadKey(userIdA: number, userIdB: number): string {
  const lo = Math.min(userIdA, userIdB);
  const hi = Math.max(userIdA, userIdB);
  return `user:${lo}:${hi}`;
}

export function buildEventPublicThreadKey(eventId: number): string {
  return `event_public:${eventId}`;
}

export function buildEventVendorThreadKey(eventId: number): string {
  return `event_vendor:${eventId}`;
}

export function encodeThreadKey(threadKey: string): string {
  const bytes = new TextEncoder().encode(threadKey);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeThreadKey(encoded: string): string {
  const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const binary = atob(b64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
