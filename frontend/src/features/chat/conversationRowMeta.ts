import { CATEGORY_THEMES } from '@/features/events/CategoricalBackground';
import type { FriendshipItem, MyFriendshipsResponse } from '@/features/events/api';
import type { EventOverviewRow } from '@/pages/alerts/utils';

/** `event_public:N` / `event_vendor:N` → event id. */
export function parseEventIdFromEventThreadKey(threadKey: string): number | undefined {
  const m = /^event_(?:public|vendor):(\d+)$/.exec(threadKey);
  return m ? Number(m[1]) : undefined;
}

export function eventChatKindLabel(threadKey: string): string | null {
  if (threadKey.startsWith('event_public:')) return 'Public chat';
  if (threadKey.startsWith('event_vendor:')) return 'Vendor group chat';
  if (threadKey.startsWith('special_group:')) return 'Special group';
  return null;
}

function friendshipTouchesUsers(f: FriendshipItem, a: number, b: number): boolean {
  return (f.user1 === a && f.user2 === b) || (f.user1 === b && f.user2 === a);
}

export type PeerRelationship = 'friends' | 'pending' | 'not_friends';

/**
 * Accepted friendship, any pending request with this peer, or neither.
 * Uses `my-friendships` payload only (no extra API).
 */
export function peerRelationship(
  peerUserId: number | undefined,
  viewerUserId: number | undefined,
  data: MyFriendshipsResponse | undefined,
): PeerRelationship | null {
  if (peerUserId == null || viewerUserId == null || !data) return null;
  const accepted = data.accepted ?? [];
  if (accepted.some((f) => friendshipTouchesUsers(f, viewerUserId, peerUserId))) {
    return 'friends';
  }
  const pending = [...(data.pending_incoming ?? []), ...(data.pending_outgoing ?? [])];
  if (pending.some((f) => friendshipTouchesUsers(f, viewerUserId, peerUserId))) {
    return 'pending';
  }
  return 'not_friends';
}

export function peerRelationshipLabel(rel: PeerRelationship | null): string | null {
  if (rel == null) return null;
  if (rel === 'friends') return 'Friends';
  if (rel === 'pending') return 'Pending';
  return 'Not friends';
}

/** Display names for each distinct accepted orbit between viewer and peer (from `CATEGORY_THEMES`). */
function acceptedFriendshipOrbitNames(
  peerUserId: number,
  viewerUserId: number,
  data: MyFriendshipsResponse,
): string[] {
  const seenSlug = new Set<string>();
  const out: string[] = [];
  for (const f of data.accepted ?? []) {
    if (!friendshipTouchesUsers(f, viewerUserId, peerUserId)) continue;
    const slug = (f.orbit_category_slug || '').trim().toLowerCase();
    if (slug) {
      if (seenSlug.has(slug)) continue;
      seenSlug.add(slug);
      const theme = CATEGORY_THEMES[slug];
      out.push(theme?.name ?? f.orbit_category_slug);
    } else {
      const key = `orbit:${f.orbit_category}`;
      if (seenSlug.has(key)) continue;
      seenSlug.add(key);
      out.push(`Orbit #${f.orbit_category}`);
    }
  }
  return out;
}

/**
 * DM list / drawer chip copy: pending, not friends, or "In your … orbits" when accepted (multi-orbit aware).
 */
export function peerDmChipLabel(
  peerUserId: number | undefined,
  viewerUserId: number | undefined,
  data: MyFriendshipsResponse | undefined,
): string | null {
  const rel = peerRelationship(peerUserId, viewerUserId, data);
  if (rel == null || data == null) return null;
  if (rel === 'pending') return 'Pending';
  if (rel === 'not_friends') return 'Not friends';
  const names = acceptedFriendshipOrbitNames(peerUserId!, viewerUserId!, data);
  if (names.length === 0) return 'Friends';
  return `In your ${names.join(', ')} orbits`;
}

export type ViewerEventRoles = { host: boolean; vendor: boolean; goer: boolean };

/** One entry per `event_id` appearing in the overview response. */
export function buildViewerRolesByEventId(
  overviewRows: EventOverviewRow[] | undefined,
  viewerUserId: number | undefined,
): Map<number, ViewerEventRoles> {
  const map = new Map<number, ViewerEventRoles>();
  if (viewerUserId == null || !overviewRows?.length) return map;

  for (const r of overviewRows) {
    const eid = r.event_id;
    const cur = map.get(eid) ?? { host: false, vendor: false, goer: false };
    let next = cur;
    if (r.host_user_id === viewerUserId) {
      next = { ...next, host: true };
    }
    if (
      r.need_applied_to_user_id === viewerUserId ||
      r.need_application_requested_by_host_vendor_user_id === viewerUserId ||
      r.need_assigned_user_id === viewerUserId
    ) {
      next = { ...next, vendor: true };
    }
    if (r.attendee_user_id === viewerUserId) {
      next = { ...next, goer: true };
    }
    map.set(eid, next);
  }
  return map;
}

export function formatViewerEventRoles(roles: ViewerEventRoles): string {
  const parts: string[] = [];
  if (roles.host) parts.push('Host');
  if (roles.vendor) parts.push('Vendor');
  if (roles.goer) parts.push('Goer');
  if (parts.length === 0) return 'You: —';
  return `You: ${parts.join(' · ')}`;
}

export function eventIdForConversationRow(
  row: { thread_key: string; event: { id: number } | null },
): number | undefined {
  return row.event?.id ?? parseEventIdFromEventThreadKey(row.thread_key);
}
